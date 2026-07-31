# GaitGuard — Data Model (ER Diagram)

PostgreSQL + TimescaleDB. Relational core for entities; hypertables for the
high-volume time-series (`sensor_samples`, `risk_scores`). Canonical DDL:
[`infra/schema.sql`](../infra/schema.sql).

```mermaid
erDiagram
    USERS ||--o{ SESSIONS : "conducts"
    USERS ||--o{ ALERTS : "acknowledges"
    USERS ||--o{ REPORTS : "generates"
    USERS ||--o{ NOTIFICATIONS : "receives"

    DOCTORS ||--o{ PATIENTS : "assigned to"

    PATIENTS ||--o{ SESSIONS : "has"
    PATIENTS ||--o{ DEVICES : "wears"
    PATIENTS ||--o{ ALERTS : "raises"
    PATIENTS ||--o{ RISK_PREDICTIONS : "forecast for"
    PATIENTS ||--o{ ANALYTICS : "aggregated in"

    SESSIONS ||--o{ SENSOR_SAMPLES : "streams"
    SESSIONS ||--o{ RISK_SCORES : "scored by"
    SESSIONS ||--o{ ALERTS : "triggers"
    SESSIONS ||--o{ REPORTS : "summarized in"

    USERS {
        varchar id PK
        varchar email UK
        varchar hashed_password
        varchar full_name
        varchar role "admin|clinician|caregiver|patient"
        timestamp created_at
    }
    DOCTORS {
        varchar id PK
        varchar name
        varchar specialty
        varchar email UK
    }
    PATIENTS {
        varchar id PK
        varchar mrn UK
        varchar name
        int age
        char sex
        varchar room
        text condition
        varchar baseline_risk
        varchar assigned_doctor_id FK
    }
    DEVICES {
        varchar id PK
        varchar serial UK
        varchar type "insole|camera"
        varchar patient_id FK
        varchar status
        int battery
        timestamp last_seen
    }
    SESSIONS {
        varchar id PK
        varchar patient_id FK
        varchar clinician_id FK
        timestamp started_at
        timestamp ended_at
        varchar status
        varchar peak_level
    }
    SENSOR_SAMPLES {
        varchar session_id PK
        timestamp time PK
        jsonb fsr
        jsonb imu
    }
    RISK_SCORES {
        varchar session_id PK
        timestamp time PK
        float score
        varchar level
        float confidence
        jsonb drivers
    }
    RISK_PREDICTIONS {
        varchar id PK
        varchar patient_id FK
        int horizon_hours
        float predicted_score
        varchar predicted_level
        varchar model_version
    }
    ALERTS {
        varchar id PK
        varchar patient_id FK
        varchar session_id FK
        varchar type
        varchar priority
        varchar level
        varchar status
        varchar ack_by FK
        timestamp created_at
    }
    REPORTS {
        varchar id PK
        varchar session_id FK
        text url
        varchar generated_by FK
        timestamp created_at
    }
    NOTIFICATIONS {
        varchar id PK
        varchar user_id FK
        varchar channel "in_app|email|sms"
        varchar title
        boolean read
        timestamp created_at
    }
    ANALYTICS {
        varchar id PK
        varchar patient_id FK
        varchar metric
        varchar period
        float value
        timestamp captured_at
    }
    SETTINGS {
        varchar key PK
        jsonb value
        timestamp updated_at
    }
```

## Indexes & constraints (highlights)

- **Unique**: `users.email`, `doctors.email`, `patients.mrn`, `devices.serial`.
- **Foreign keys** cascade from `patients` → `sessions` → `sensor_samples`/`risk_scores`/`reports`; `SET NULL` for optional staff links.
- **Check constraints** on enums (`role`, `sex`, `baseline_risk`, device `type`/`status`, alert `status`, notification `channel`).
- **Hypertables**: `sensor_samples`, `risk_scores` partitioned on `time`; continuous aggregate `risk_scores_1m` powers long-range trend queries.
- **Hot-path indexes**: `alerts(status)`, `alerts(patient_id)`, `sessions(patient_id)`, `notifications(user_id)`, `audit_log(ts)`.
