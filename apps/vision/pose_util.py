"""
Kinematic pose utilities for MediaPipe landmarks.

Adapted from @kratikach99-tab/Smart_gait_analysis (joint angles, pelvic tilt, hip
symmetry, step width, foot arc, lateral deviation, foot clearance, circumduction
risk). Extended for GaitGuard.
"""

from __future__ import annotations

from collections import deque

import numpy as np

from config import (
    LEFT_ANKLE,
    LEFT_FOOT,
    LEFT_HIP,
    LEFT_KNEE,
    LEFT_SHOULDER,
    RIGHT_ANKLE,
    RIGHT_FOOT,
    RIGHT_HIP,
    RIGHT_KNEE,
    RIGHT_SHOULDER,
)

LEFT_ANKLE_HISTORY: deque = deque(maxlen=30)
RIGHT_ANKLE_HISTORY: deque = deque(maxlen=30)


def calculate_angle(a, b, c) -> float:
    """Angle ABC in degrees (0..180)."""
    a, b, c = np.array(a), np.array(b), np.array(c)
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(np.degrees(radians))
    return 360 - angle if angle > 180 else angle


def get_point(landmarks, index):
    return [landmarks[index].x, landmarks[index].y]


def get_all_joint_angles(landmarks) -> dict:
    ls = get_point(landmarks, LEFT_SHOULDER)
    lh = get_point(landmarks, LEFT_HIP)
    lk = get_point(landmarks, LEFT_KNEE)
    la = get_point(landmarks, LEFT_ANKLE)
    lf = get_point(landmarks, LEFT_FOOT)
    rs = get_point(landmarks, RIGHT_SHOULDER)
    rh = get_point(landmarks, RIGHT_HIP)
    rk = get_point(landmarks, RIGHT_KNEE)
    ra = get_point(landmarks, RIGHT_ANKLE)
    rf = get_point(landmarks, RIGHT_FOOT)
    return {
        "left_hip": calculate_angle(ls, lh, lk),
        "right_hip": calculate_angle(rs, rh, rk),
        "left_knee": calculate_angle(lh, lk, la),
        "right_knee": calculate_angle(rh, rk, ra),
        "left_ankle": calculate_angle(lk, la, lf),
        "right_ankle": calculate_angle(rk, ra, rf),
    }


def calculate_pelvic_tilt(landmarks) -> float:
    lh = get_point(landmarks, LEFT_HIP)
    rh = get_point(landmarks, RIGHT_HIP)
    dx = abs(rh[0] - lh[0])
    dy = abs(rh[1] - lh[1])
    if dx == 0:
        return 0.0
    return float(np.degrees(np.arctan(dy / dx)))


def calculate_hip_symmetry(angles) -> float:
    difference = abs(angles["left_hip"] - angles["right_hip"])
    return max(0.0, 100.0 - difference)


def calculate_step_width(landmarks) -> float:
    la = get_point(landmarks, LEFT_ANKLE)
    ra = get_point(landmarks, RIGHT_ANKLE)
    return float(np.hypot(la[0] - ra[0], la[1] - ra[1]))


def update_ankle_history(landmarks) -> None:
    LEFT_ANKLE_HISTORY.append(get_point(landmarks, LEFT_ANKLE))
    RIGHT_ANKLE_HISTORY.append(get_point(landmarks, RIGHT_ANKLE))


def calculate_foot_arc() -> float:
    if len(LEFT_ANKLE_HISTORY) < 5:
        return 0.0
    total = 0.0
    for i in range(1, len(LEFT_ANKLE_HISTORY)):
        x1, y1 = LEFT_ANKLE_HISTORY[i - 1]
        x2, y2 = LEFT_ANKLE_HISTORY[i]
        total += float(np.hypot(x2 - x1, y2 - y1))
    return total


def calculate_lateral_deviation() -> float:
    if len(LEFT_ANKLE_HISTORY) < 5:
        return 0.0
    xs = np.array([p[0] for p in LEFT_ANKLE_HISTORY])
    return float(np.mean(np.abs(xs - xs.mean())))


def calculate_foot_clearance() -> float:
    if len(LEFT_ANKLE_HISTORY) < 5:
        return 0.0
    ys = [p[1] for p in LEFT_ANKLE_HISTORY]
    return float(max(ys) - min(ys))


def get_all_features(landmarks, angles) -> dict:
    update_ankle_history(landmarks)
    return {
        "pelvic_tilt": calculate_pelvic_tilt(landmarks),
        "hip_symmetry": calculate_hip_symmetry(angles),
        "step_width": calculate_step_width(landmarks),
        "foot_arc": calculate_foot_arc(),
        "lateral_deviation": calculate_lateral_deviation(),
        "foot_clearance": calculate_foot_clearance(),
    }


def calculate_circumduction_risk(features, angles):
    """Original heuristic risk (Normal/Mild/Moderate/High) — kept for the on‑screen
    overlay. GaitGuard's own fusion engine produces the authoritative score."""
    score = 0
    reasons = []
    if features["hip_symmetry"] < 94:
        score += 2
        reasons.append("Reduced hip symmetry")
    if features["pelvic_tilt"] > 8:
        score += 2
        reasons.append("High pelvic tilt")
    if features["step_width"] > 0.06:
        score += 1
        reasons.append("Wide step width")
    if features["foot_clearance"] < 0.12:
        score += 2
        reasons.append("Low foot clearance")
    avg_knee = (angles["left_knee"] + angles["right_knee"]) / 2
    if avg_knee > 172:
        score += 2
        reasons.append("Reduced knee flexion")

    if score <= 2:
        risk = "Normal"
    elif score <= 4:
        risk = "Mild"
    elif score <= 7:
        risk = "Moderate"
    else:
        risk = "High"
    return risk, reasons
