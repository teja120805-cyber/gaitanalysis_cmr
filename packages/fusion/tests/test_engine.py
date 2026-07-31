"""Smoke tests for the fusion engine. Run: python -m pytest (or python test_engine.py)."""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from gaitguard_fusion import FusionState, InsoleSample, PoseSample, level_from_score


def _insole(t, l, r, sway=0.05):
    return InsoleSample(
        t=t, fsr_left=l, fsr_right=r,
        ax=sway, ay=sway, az=1.0, gx=5, gy=5, gz=sway * 90,
    )


def _pose(t, cadence, arm=0.95, trunk=1.5, ds=18, stepsym=0.95):
    return PoseSample(
        t=t, cadence=cadence, step_length_sym=stepsym,
        arm_swing_sym=arm, trunk_sway=trunk, double_support=ds,
    )


def test_levels_map():
    assert level_from_score(0.1) == "normal"
    assert level_from_score(0.5) == "mild"
    assert level_from_score(0.8) == "high"


def test_healthy_gait_is_normal():
    st = FusionState()
    for i in range(40):
        t = i * 20.0
        st.add_insole(_insole(t, [0.6, 0.5, 0.5, 0.6], [0.6, 0.5, 0.5, 0.6]))
        if i % 2 == 0:
            st.add_pose(_pose(t, cadence=110))
    a = st.assess(now_ms=39 * 20.0)
    assert a.level == "normal", a.to_dict()
    assert a.score < 0.33


def test_parkinsonian_gait_is_high():
    st = FusionState()
    for i in range(40):
        t = i * 20.0
        # Strong asymmetry, low load (freezing), heavy sway.
        st.add_insole(_insole(t, [0.7, 0.6, 0.6, 0.7], [0.15, 0.1, 0.1, 0.15], sway=0.5))
        if i % 2 == 0:
            st.add_pose(_pose(t, cadence=30, arm=0.35, trunk=8.5, ds=33))
    a = st.assess(now_ms=39 * 20.0)
    assert a.level == "high", a.to_dict()
    assert a.drivers[0].weight >= a.drivers[-1].weight


if __name__ == "__main__":
    test_levels_map()
    test_healthy_gait_is_normal()
    test_parkinsonian_gait_is_high()
    print("fusion engine: all smoke tests passed")
