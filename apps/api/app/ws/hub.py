"""Realtime fan-out hub.

Dashboards subscribe to a per-session channel; ingest and the fusion loop publish
to it. With REDIS_URL set, messages route through Redis pub/sub so any number of
API workers can serve any client. Without it, an in-process path delivers directly
(single-worker dev). The rest of the app calls `hub.publish(...)` either way.
"""

from __future__ import annotations

import asyncio
import json
from typing import Dict, Set

from fastapi import WebSocket

from app.core.config import settings


def channel(session_id: str) -> str:
    return f"session:{session_id}"


class Hub:
    def __init__(self) -> None:
        # channel -> connected dashboard sockets on THIS worker
        self._local: Dict[str, Set[WebSocket]] = {}
        self._redis = None
        self._redis_pub = None
        self._task = None

    async def start(self) -> None:
        if settings.redis_url:
            import redis.asyncio as aioredis

            self._redis = aioredis.from_url(settings.redis_url, decode_responses=True)
            self._redis_pub = self._redis
            self._task = asyncio.create_task(self._redis_listener())

    async def stop(self) -> None:
        if self._task:
            self._task.cancel()
        if self._redis:
            await self._redis.close()

    async def _redis_listener(self) -> None:
        pubsub = self._redis.pubsub()
        await pubsub.psubscribe("session:*")
        async for msg in pubsub.listen():
            if msg.get("type") != "pmessage":
                continue
            ch = msg["channel"]
            try:
                data = json.loads(msg["data"])
            except (ValueError, TypeError):
                continue
            await self._deliver_local(ch, data)

    # --- dashboard connections ---------------------------------------------
    async def register(self, session_id: str, ws: WebSocket) -> None:
        self._local.setdefault(channel(session_id), set()).add(ws)

    def unregister(self, session_id: str, ws: WebSocket) -> None:
        conns = self._local.get(channel(session_id))
        if conns:
            conns.discard(ws)
            if not conns:
                self._local.pop(channel(session_id), None)

    def has_subscribers(self, session_id: str) -> bool:
        """Any dashboard watching this session on THIS worker. (In-process/dev
        accurate; with Redis multi-worker this only sees the local worker.)"""
        return bool(self._local.get(channel(session_id)))

    async def _deliver_local(self, ch: str, message: dict) -> None:
        conns = list(self._local.get(ch, set()))
        dead = []
        for ws in conns:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            for s in self._local.values():
                s.discard(ws)

    # --- publish -----------------------------------------------------------
    async def publish(self, session_id: str, message: dict) -> None:
        ch = channel(session_id)
        if self._redis_pub:
            await self._redis_pub.publish(ch, json.dumps(message))
        else:
            await self._deliver_local(ch, message)


hub = Hub()
