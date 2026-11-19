import asyncio
import json
from unittest.mock import AsyncMock

import pytest
from pydantic import ValidationError

from app.core.ai_runtime import ConfigSnapshot
from app.schemas.rag import AIChatRequest
from app.services.ai_config import service as config_service
from app.services.llamaindex_rag_orchestrator import counselor_connection


def _snapshot(revision="a" * 64):
    return ConfigSnapshot(
        source_mode="DATABASE", protocol="openai_compatible",
        canonical_base_url="https://provider.example/v1", model="synthetic-model",
        auth_mode="BEARER", credential_binding=("openai_compatible", "https", "provider.example", 443, "/v1"),
        revision_token=revision, credential="synthetic-secret-not-for-output",
    )


@pytest.mark.asyncio
async def test_connection_probe_sends_only_fixed_prompt_and_returns_opaque_receipt(monkeypatch):
    snapshot = _snapshot()
    monkeypatch.setattr(config_service, "resolve_snapshot", AsyncMock(return_value=snapshot))
    calls = []

    async def chat(actual_snapshot, messages, **kwargs):
        calls.append((actual_snapshot, messages, kwargs))
        return "OK"

    monkeypatch.setattr(counselor_connection.adapter, "chat", chat)
    result = await counselor_connection.check_connection(object())
    assert result["available"] is True
    assert result["code"] == "OK"
    assert result["revision_token"]
    assert result["revision_token"] != snapshot.revision_token
    assert len(calls) == 1
    assert calls[0][0] is snapshot
    assert calls[0][1] == [{"role": "user", "content": "Reply with exactly OK."}]
    assert calls[0][2]["max_tokens"] == 32
    assert calls[0][2]["timeout"] == 60
    public = json.dumps(result)
    assert snapshot.credential not in public
    assert snapshot.base_url not in public
    assert snapshot.model not in public


@pytest.mark.asyncio
async def test_simultaneous_chat_opens_share_one_provider_check(monkeypatch):
    snapshot = _snapshot()
    monkeypatch.setattr(config_service, "resolve_snapshot", AsyncMock(return_value=snapshot))
    calls = 0
    release = asyncio.Event()

    async def chat(*args, **kwargs):
        nonlocal calls
        calls += 1
        await release.wait()
        return "OK"

    monkeypatch.setattr(counselor_connection.adapter, "chat", chat)
    tasks = [asyncio.create_task(counselor_connection.check_connection(object())) for _ in range(3)]
    await asyncio.sleep(0)
    release.set()
    results = await asyncio.gather(*tasks)
    assert calls == 1
    assert all(item["available"] for item in results)
    assert len({item["revision_token"] for item in results}) == 1


@pytest.mark.asyncio
async def test_probe_failure_never_reports_available_or_leaks_provider_error(monkeypatch):
    snapshot = _snapshot()
    monkeypatch.setattr(config_service, "resolve_snapshot", AsyncMock(return_value=snapshot))

    async def fail(*args, **kwargs):
        raise RuntimeError(snapshot.credential)

    monkeypatch.setattr(counselor_connection.adapter, "chat", fail)
    result = await counselor_connection.check_connection(object())
    assert result["available"] is False
    assert result["code"] == "PROVIDER_ERROR"
    assert snapshot.credential not in json.dumps(result)
    assert not result["revision_token"]


@pytest.mark.asyncio
async def test_rotated_connection_receipt_does_not_break_local_chat(monkeypatch):
    snapshot = _snapshot()
    monkeypatch.setattr(config_service, "resolve_snapshot", AsyncMock(return_value=snapshot))
    token = counselor_connection._issue_receipt(snapshot.revision_token)
    assert await counselor_connection.verify_receipt(object(), token) is True
    assert await counselor_connection.verify_receipt(object(), None) is False
    changed = _snapshot("b" * 64)
    monkeypatch.setattr(config_service, "resolve_snapshot", AsyncMock(return_value=changed))
    assert await counselor_connection.verify_receipt(object(), token) is False


def test_history_budget_is_independent_from_private_profile_budget():
    request = AIChatRequest(
        message="Hãy giải thích ngành Khoa học máy tính.",
        history=[{"role": "user", "content": "x" * 12000}] * 64,
    )
    assert len(request.history) == 64
    assert request.history[-1].content == "x" * 12000
    with pytest.raises(ValidationError):
        AIChatRequest(message="ngành học", history=[{"role": "user", "content": "ngành " + "đ" * 12000}] * 64)


@pytest.mark.asyncio
async def test_inflight_old_profile_cannot_report_new_profile_online(monkeypatch):
    snapshot = _snapshot()
    resolver = AsyncMock(return_value=snapshot)
    monkeypatch.setattr(config_service, "resolve_snapshot", resolver)
    entered, release = asyncio.Event(), asyncio.Event()

    async def chat(*args, **kwargs):
        entered.set()
        await release.wait()
        return "OK"

    monkeypatch.setattr(counselor_connection.adapter, "chat", chat)
    pending = asyncio.create_task(counselor_connection.check_connection(object()))
    await entered.wait()
    resolver.return_value = _snapshot("b" * 64)
    release.set()
    result = await pending
    assert result["available"] is False
    assert result["code"] == "CONFIGURATION_CHANGED"
    assert not result["revision_token"]


@pytest.mark.asyncio
async def test_old_success_cache_is_not_reused_while_new_profile_probe_runs(monkeypatch):
    resolver = AsyncMock(return_value=_snapshot())
    monkeypatch.setattr(config_service, "resolve_snapshot", resolver)
    entered, release = asyncio.Event(), asyncio.Event()
    calls = 0

    async def chat(*args, **kwargs):
        nonlocal calls
        calls += 1
        if calls > 1:
            entered.set()
            await release.wait()
        return "OK"

    monkeypatch.setattr(counselor_connection.adapter, "chat", chat)
    first = await counselor_connection.check_connection(object())
    resolver.return_value = _snapshot("b" * 64)
    second = asyncio.create_task(counselor_connection.check_connection(object()))
    await entered.wait()
    concurrent = asyncio.create_task(counselor_connection.check_connection(object()))
    await asyncio.sleep(0)
    assert not concurrent.done()
    release.set()
    results = await asyncio.gather(second, concurrent)
    assert calls == 2
    assert all(result["available"] for result in results)
    assert all(result["revision_token"] != first["revision_token"] for result in results)


@pytest.mark.asyncio
async def test_availability_is_rechecked_after_local_guidance_work(monkeypatch):
    from app.services.llamaindex_rag_orchestrator import guidance_rag, guidance_boundary

    snapshot = _snapshot()
    resolver = AsyncMock(return_value=snapshot)
    monkeypatch.setattr(config_service, "resolve_snapshot", resolver)
    token = counselor_connection._issue_receipt(snapshot.revision_token)

    async def facts(*args, **kwargs):
        resolver.return_value = _snapshot("b" * 64)
        return {}

    monkeypatch.setattr(guidance_boundary, "guidance_facts", facts)
    monkeypatch.setattr(guidance_boundary, "render_chat", lambda *args: ("Dữ liệu hướng nghiệp", None, []))
    result = await guidance_rag.chat_with_career_counselor(None, AIChatRequest(message="ngành học", connection_revision=token))
    assert result.connection_available is False


@pytest.mark.asyncio
async def test_repeated_opens_have_global_cost_bound(monkeypatch):
    snapshot = _snapshot()
    monkeypatch.setattr(config_service, "resolve_snapshot", AsyncMock(return_value=snapshot))
    chat = AsyncMock(return_value="OK")
    monkeypatch.setattr(counselor_connection.adapter, "chat", chat)
    for _ in range(6):
        counselor_connection._state().cached_until = 0
        assert (await counselor_connection.check_connection(object()))["available"]
    counselor_connection._state().cached_until = 0
    result = await counselor_connection.check_connection(object())
    assert result["available"] is False
    assert result["code"] == "PROBE_RATE_LIMIT"
    assert chat.await_count == 6


@pytest.mark.asyncio
async def test_local_guidance_never_sends_student_text_or_evidence_to_provider(monkeypatch):
    from app.services.llamaindex_rag_orchestrator import guidance_rag

    chat = AsyncMock(side_effect=AssertionError("Student evidence must stay local"))
    monkeypatch.setattr(counselor_connection.adapter, "chat", chat)
    request = AIChatRequest(message="Em tên là Học Sinh, email secret@example.test. Tìm hiểu nghề kỹ sư AI.",
                            history=[{"role": "user", "content": "private student history"}],
                            grades_by_subject={"math": 8.5})
    reply = await guidance_rag.chat_with_career_counselor(None, request)
    assert reply.is_ai_generated is False
    assert reply.response_source == "verified_guidance"
    assert "secret@example.test" not in reply.reply
    chat.assert_not_awaited()


def test_provider_advertised_context_is_bounded_without_assuming_other_models():
    from app.core.llm_client import _parse_capabilities

    caps = _parse_capabilities({"capabilities": {"contextWindow": 272000, "maxOutput": 128000}})
    assert caps["context_window"] == 272000
    assert caps["max_output_tokens"] == 128000
    unknown = _parse_capabilities(None)
    assert unknown["context_window"] == 16384
    assert unknown["max_output_tokens"] == 4096


@pytest.mark.asyncio
async def test_public_probe_no_store_aliases_and_invalid_bearer(monkeypatch):
    import httpx
    from app.main import app
    from app.core.database import get_db

    snapshot = _snapshot()
    monkeypatch.setattr(config_service, "resolve_snapshot", AsyncMock(return_value=snapshot))
    chat = AsyncMock(return_value="OK")
    monkeypatch.setattr(counselor_connection.adapter, "chat", chat)

    async def database():
        yield object()

    old = dict(app.dependency_overrides)
    app.dependency_overrides[get_db] = database
    try:
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            for prefix in ("/api", "/api/v1"):
                result = await client.post(prefix + "/rag-governance/chat/connection")
                assert result.status_code == 200
                assert result.headers["cache-control"] == "no-store"
                assert result.json()["available"] is True
                assert set(result.json()) == {"available", "code", "message", "checked_at", "latency_ms", "revision_token"}
                assert snapshot.credential not in result.text
                assert snapshot.model not in result.text
                assert snapshot.base_url not in result.text
            invalid = await client.post("/api/rag-governance/chat/connection", headers={"Authorization": "Bearer invalid-token"})
            assert invalid.status_code == 401
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(old)
