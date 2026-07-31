-- GaitGuard — PostgreSQL + TimescaleDB schema
-- Apply with:  psql "$DATABASE_URL" -f infra/schema.sql
-- (The FastAPI app auto-creates these via SQLAlchemy for the demo; this is the
--  canonical production DDL, with indexes, FKs, constraints, and hypertables.)

CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ---------------------------------------------------------------- users / staff
CREATE TABLE IF NOT EXISTS users (
    id              VARCHAR(32) PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name       VARCHAR(120) NOT NULL,
    role            VARCHAR(20)  NOT NULL DEFAULT 'clinician'
                    CHECK (role IN ('admin','clinician','caregiver','patient')),
    org_id          VARCHAR(32),
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);

CREATE TABLE IF NOT EXISTS doctors (
    id        VARCHAR(32) PRIMARY KEY,
    name      VARCHAR(120) NOT NULL,
    specialty VARCHAR(80)  NOT NULL DEFAULT 'Neurology',
    email     VARCHAR(255) NOT NULL UNIQUE,
    org_id    VARCHAR(32)
);

-- ---------------------------------------------------------------- patients
CREATE TABLE IF NOT EXISTS patients (
    id             VARCHAR(32) PRIMARY KEY,
    mrn            VARCHAR(32) NOT NULL UNIQUE,
    name           VARCHAR(120) NOT NULL,
    age            INTEGER NOT NULL CHECK (age >= 0 AND age < 150),
    sex            CHAR(1) NOT NULL CHECK (sex IN ('M','F')),
    room           VARCHAR(60),
    condition      TEXT,
    baseline_risk  VARCHAR(10) NOT NULL DEFAULT 'normal'
                   CHECK (baseline_risk IN ('normal','mild','high')),
    assigned_doctor_id VARCHAR(32) REFERENCES doctors(id) ON DELETE SET NULL,
    org_id         VARCHAR(32),
    created_at     TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_patients_mrn ON patients(mrn);

-- ---------------------------------------------------------------- devices
CREATE TABLE IF NOT EXISTS devices (
    id         VARCHAR(32) PRIMARY KEY,
    serial     VARCHAR(64) NOT NULL UNIQUE,
    type       VARCHAR(20) NOT NULL CHECK (type IN ('insole','camera')),
    patient_id VARCHAR(32) REFERENCES patients(id) ON DELETE SET NULL,
    status     VARCHAR(12) NOT NULL DEFAULT 'online' CHECK (status IN ('online','offline')),
    battery    INTEGER NOT NULL DEFAULT 100 CHECK (battery BETWEEN 0 AND 100),
    last_seen  TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_devices_patient ON devices(patient_id);

-- ---------------------------------------------------------------- sessions
CREATE TABLE IF NOT EXISTS sessions (
    id           VARCHAR(32) PRIMARY KEY,
    patient_id   VARCHAR(32) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    clinician_id VARCHAR(32) REFERENCES users(id) ON DELETE SET NULL,
    started_at   TIMESTAMP NOT NULL DEFAULT now(),
    ended_at     TIMESTAMP,
    status       VARCHAR(12) NOT NULL DEFAULT 'active' CHECK (status IN ('active','ended')),
    peak_level   VARCHAR(10) NOT NULL DEFAULT 'normal'
);
CREATE INDEX IF NOT EXISTS ix_sessions_patient ON sessions(patient_id);

-- ---------------------------------------------------------------- time-series (hypertables)
CREATE TABLE IF NOT EXISTS sensor_samples (
    session_id VARCHAR(32) NOT NULL,
    time       TIMESTAMP   NOT NULL,
    fsr        JSONB       NOT NULL DEFAULT '{}',
    imu        JSONB       NOT NULL DEFAULT '{}',
    PRIMARY KEY (session_id, time)
);
SELECT create_hypertable('sensor_samples', 'time', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS risk_scores (
    session_id VARCHAR(32) NOT NULL,
    time       TIMESTAMP   NOT NULL,
    score      DOUBLE PRECISION NOT NULL,
    level      VARCHAR(10) NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    drivers    JSONB NOT NULL DEFAULT '[]',
    PRIMARY KEY (session_id, time)
);
SELECT create_hypertable('risk_scores', 'time', if_not_exists => TRUE);

-- Continuous aggregate: per-minute mean risk for instant long-range trends.
CREATE MATERIALIZED VIEW IF NOT EXISTS risk_scores_1m
WITH (timescaledb.continuous) AS
SELECT session_id,
       time_bucket('1 minute', time) AS bucket,
       avg(score) AS avg_score,
       max(score) AS max_score
FROM risk_scores
GROUP BY session_id, bucket
WITH NO DATA;

-- ---------------------------------------------------------------- predictions
CREATE TABLE IF NOT EXISTS risk_predictions (
    id              VARCHAR(32) PRIMARY KEY,
    patient_id      VARCHAR(32) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    horizon_hours   INTEGER NOT NULL DEFAULT 24,
    predicted_score DOUBLE PRECISION NOT NULL,
    predicted_level VARCHAR(10) NOT NULL,
    model_version   VARCHAR(20) NOT NULL DEFAULT 'rule-v1'
);
CREATE INDEX IF NOT EXISTS ix_predictions_patient ON risk_predictions(patient_id);

-- ---------------------------------------------------------------- alerts
CREATE TABLE IF NOT EXISTS alerts (
    id         VARCHAR(32) PRIMARY KEY,
    patient_id VARCHAR(32) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    session_id VARCHAR(32) REFERENCES sessions(id) ON DELETE SET NULL,
    type       VARCHAR(24) NOT NULL DEFAULT 'high_risk',
    priority   VARCHAR(10) NOT NULL DEFAULT 'high',
    level      VARCHAR(10) NOT NULL,
    title      VARCHAR(160) NOT NULL,
    detail     TEXT,
    status     VARCHAR(14) NOT NULL DEFAULT 'open'
               CHECK (status IN ('open','acknowledged','resolved')),
    ack_by     VARCHAR(32) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS ix_alerts_patient ON alerts(patient_id);

-- ---------------------------------------------------------------- reports
CREATE TABLE IF NOT EXISTS reports (
    id           VARCHAR(32) PRIMARY KEY,
    session_id   VARCHAR(32) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    url          TEXT,
    generated_by VARCHAR(32) REFERENCES users(id) ON DELETE SET NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- notifications
CREATE TABLE IF NOT EXISTS notifications (
    id         VARCHAR(32) PRIMARY KEY,
    user_id    VARCHAR(32) REFERENCES users(id) ON DELETE CASCADE,
    channel    VARCHAR(12) NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app','email','sms')),
    title      VARCHAR(160) NOT NULL,
    body       TEXT,
    read       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_notifications_user ON notifications(user_id);

-- ---------------------------------------------------------------- analytics + settings
CREATE TABLE IF NOT EXISTS analytics (
    id         VARCHAR(32) PRIMARY KEY,
    patient_id VARCHAR(32) REFERENCES patients(id) ON DELETE CASCADE,
    metric     VARCHAR(40) NOT NULL,
    period     VARCHAR(10) NOT NULL,
    value      DOUBLE PRECISION NOT NULL,
    captured_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_analytics_patient_metric ON analytics(patient_id, metric);

CREATE TABLE IF NOT EXISTS settings (
    key        VARCHAR(64) PRIMARY KEY,
    value      JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log (
    id        VARCHAR(32) PRIMARY KEY,
    user_id   VARCHAR(32) REFERENCES users(id) ON DELETE SET NULL,
    action    VARCHAR(120) NOT NULL,
    entity    VARCHAR(40),
    entity_id VARCHAR(32),
    meta      JSONB,
    ts        TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_audit_ts ON audit_log(ts);
