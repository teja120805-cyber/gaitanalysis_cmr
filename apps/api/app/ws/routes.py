"""WebSocket endpoints: device ingest + dashboard live channel."""

from __future__ import annotations

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status

from app.core.config import settings
from app.core.security import decode_token
from app.ws.hub import hub
from app.ws.session_runtime import sessions
from gaitguard_fusion import InsoleSample, PoseSample

router = APIRouter()


def _parse_insole(d: dict) -> InsoleSample:
    fsr = d["fsr"]
    imu = d["imu"]
    return InsoleSample(
        t=float(d["t"]),
        fsr_left=[float(x) for x in fsr["left"]],
        fsr_right=[float(x) for x in fsr["right"]],
        ax=float(imu["ax"]), ay=float(imu["ay"]), az=float(imu["az"]),
        gx=float(imu["gx"]), gy=float(imu["gy"]), gz=float(imu["gz"]),
    )


def _parse_pose(d: dict) -> PoseSample:
    m = d["metrics"]
    return PoseSample(
        t=float(d["t"]),
        cadence=float(m["cadence"]),
        step_length_sym=float(m["stepLengthSym"]),
        arm_swing_sym=float(m["armSwingSym"]),
        trunk_sway=float(m["trunkSway"]),
        double_support=float(m["doubleSupport"]),
    )


@router.websocket("/ws/ingest/insole")
async def ingest_insole(
    ws: WebSocket,
    session: str = Query(...),
    token: str = Query(...),
):
    if token != settings.ingest_token:
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    await ws.accept()
    rt = await sessions.on_ingest_connect(session)
    try:
        while True:
            data = await ws.receive_json()
            try:
                rt.add_insole(_parse_insole(data))
            except (KeyError, TypeError, ValueError):
                continue
            await hub.publish(session, {"type": "insole", "payload": data})
    except WebSocketDisconnect:
        pass
    finally:
        await sessions.on_ingest_disconnect(session)


@router.websocket("/ws/ingest/vision")
async def ingest_vision(
    ws: WebSocket,
    session: str = Query(...),
    token: str = Query(...),
):
    if token != settings.ingest_token:
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    await ws.accept()
    rt = await sessions.on_ingest_connect(session)
    try:
        while True:
            data = await ws.receive_json()
            try:
                rt.add_pose(_parse_pose(data))
            except (KeyError, TypeError, ValueError):
                continue
            await hub.publish(session, {"type": "pose", "payload": data})
    except WebSocketDisconnect:
        pass
    finally:
        await sessions.on_ingest_disconnect(session)


@router.websocket("/ws/live/{session_id}")
async def live(
    ws: WebSocket,
    session_id: str,
    token: str = Query(None),
):
    # Dashboard auth: browsers can't set WS headers, so the JWT rides a query
    # param. Validated if present; allowed through in the demo build if absent.
    if token and not decode_token(token, expected_type="access"):
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    await ws.accept()
    await hub.register(session_id, ws)
    await ws.send_json({"type": "conn", "payload": "live"})
    try:
        while True:
            # We don't expect inbound data; this keeps the socket open + detects close.
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        hub.unregister(session_id, ws)
