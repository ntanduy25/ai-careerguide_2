"""A real, bounded provider check; student evidence never enters the request."""
import asyncio
import secrets
import time
import weakref
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timezone

from app.core.ai_runtime import AIConfigError
from app.core.config import settings
from app.services.ai_config import adapter, service as config_service


@dataclass
class ProbeState:
    revision: str = ""
    task: asyncio.Task | None = None
    result: dict | None = None
    cached_until: float = 0
    # Receipts refer only to this server-owned immutable configuration revision.
    receipts: dict[str, tuple[str, float]] = field(default_factory=dict)
    starts: deque = field(default_factory=deque)


_STATES: weakref.WeakKeyDictionary = weakref.WeakKeyDictionary()


def _state() -> ProbeState:
    loop = asyncio.get_running_loop()
    if loop not in _STATES:
        _STATES[loop] = ProbeState()
    return _STATES[loop]


def _result(available: bool, code: str, latency_ms: float = 0) -> dict:
    return {"available": available, "code": code,
            "message": "AI đã phản hồi yêu cầu kiểm tra." if available else
                       "AI chưa phản hồi thành công. Bạn có thể thử kiểm tra lại.",
            "checked_at": datetime.now(timezone.utc).isoformat(),
            "latency_ms": round(latency_ms, 1), "revision_token": ""}


async def _probe(snapshot) -> dict:
    start = time.perf_counter()
    try:
        reply = await adapter.chat(snapshot, [{"role": "user", "content": "Reply with exactly OK."}],
                                   max_tokens=32, timeout=min(settings.LLM_TIMEOUT_SECONDS, 60))
        if reply.strip().rstrip(".! ").upper() != "OK":
            raise AIConfigError("PROBE_INVALID_RESPONSE", "Phản hồi kiểm tra chưa hợp lệ.", 502)
        return _result(True, "OK", (time.perf_counter() - start) * 1000)
    except AIConfigError as exc:
        return _result(False, exc.code, (time.perf_counter() - start) * 1000)
    except Exception:
        return _result(False, "PROVIDER_ERROR", (time.perf_counter() - start) * 1000)


async def check_connection(db) -> dict:
    """Coalesce simultaneous opens, but never turn a DB health check into AI health."""
    try:
        snapshot = await config_service.resolve_snapshot(db)
    except AIConfigError as exc:
        return _result(False, exc.code)
    state = _state()
    now = time.monotonic()
    state.receipts = {key: value for key, value in state.receipts.items() if value[1] > now}
    if state.revision == snapshot.revision_token and state.result and now < state.cached_until:
        return dict(state.result)
    if state.task and not state.task.done() and state.revision != snapshot.revision_token:
        # A new configuration never inherits an old in-flight check.
        return _result(False, "CONFIGURATION_CHANGED")
    if not state.task or state.task.done():
        while state.starts and state.starts[0] <= now - 60:
            state.starts.popleft()
        if len(state.starts) >= 6:
            result = _result(False, "PROBE_RATE_LIMIT")
            result["message"] = "Bạn đã kiểm tra nhiều lần. Hãy thử lại sau một phút."
            return result
        state.starts.append(now)
        state.result = None
        state.cached_until = 0
        state.revision = snapshot.revision_token
        state.task = asyncio.create_task(_probe(snapshot))
    task = state.task
    result = dict(await asyncio.shield(task))
    # Re-read the selected profile so a slow old result cannot report a new one online.
    try:
        current = await config_service.resolve_snapshot(db)
    except AIConfigError:
        return _result(False, "CONFIGURATION_CHANGED")
    if current.revision_token != snapshot.revision_token:
        return _result(False, "CONFIGURATION_CHANGED")
    if state.task is task:
        if not state.result or state.result["checked_at"] != result["checked_at"]:
            if result["available"]:
                token = secrets.token_urlsafe(32)
                state.receipts[token] = (snapshot.revision_token, time.monotonic() + 300)
                result["revision_token"] = token
            state.result = result
            state.cached_until = time.monotonic() + 2
        return dict(state.result)
    return _result(False, "CONFIGURATION_CHANGED")


async def verify_receipt(db, token: str | None) -> bool:
    if not token:
        return False
    receipt = _state().receipts.get(token)
    if not receipt or receipt[1] <= time.monotonic():
        return False
    try:
        current = await config_service.resolve_snapshot(db)
    except AIConfigError:
        return False
    if current.revision_token != receipt[0]:
        return False
    return True
