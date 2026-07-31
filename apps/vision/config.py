"""
MediaPipe Pose landmark indices + gait thresholds.

Landmark map and several gait features (joint angles, pelvic tilt, hip symmetry,
step width, foot arc, lateral deviation, foot clearance, circumduction risk) are
adapted from the GaitGuard vision prototype by @kratikach99-tab:
https://github.com/kratikach99-tab/Smart_gait_analysis
"""

# ---------------- Head / arms ----------------
NOSE = 0
LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12
LEFT_ELBOW = 13
RIGHT_ELBOW = 14
LEFT_WRIST = 15
RIGHT_WRIST = 16

# ---------------- Lower body -----------------
LEFT_HIP = 23
RIGHT_HIP = 24
LEFT_KNEE = 25
RIGHT_KNEE = 26
LEFT_ANKLE = 27
RIGHT_ANKLE = 28
LEFT_HEEL = 29
RIGHT_HEEL = 30
LEFT_FOOT = 31   # foot index
RIGHT_FOOT = 32

# ---------------- Thresholds -----------------
PELVIC_TILT_THRESHOLD = 8          # degrees
STEP_WIDTH_THRESHOLD = 0.12        # normalized distance
LATERAL_DEVIATION_THRESHOLD = 0.08
FOOT_CLEARANCE_THRESHOLD = 0.05
HIP_SYMMETRY_THRESHOLD = 90        # percent

# ---------------- Analyzer -------------------
SMOOTHING_WINDOW = 5
HISTORY_SECONDS = 3.0              # rolling window for cadence / sway
CADENCE_BASELINE = 110            # healthy steps/min reference
