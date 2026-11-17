"""Finite AI deadlines and aggregate context/output budgets without provider traffic."""
import math

import httpx
import pytest
from pydantic import ValidationError

from app.core.ai_runtime import AIConfigError, ConfigSnapshot, canonical_target
from app.core.config import Settings, settings
from app.services.ai_config import adapter, service


def snapshot():
    base, binding = canonical_target("https://budget-test.example/v1")
    return ConfigSnapshot("ENV", "openai_compatible", base, "synthetic-model", "BEARER", tuple(binding[key] for key in ("protocol", "scheme", "host", "port", "base_path")), "0" * 64, "synthetic-budget-credential")


@pytest.mark.parametrize("value", [math.nan, math.inf, -math.inf, 0, -1, 601, True])
def test_config_rejects_invalid_deadline(value):
    with pytest.raises(ValidationError):
        Settings(_env_file=None, ENVIRONMENT="test", LLM_TIMEOUT_SECONDS=value)


def test_budget_settings_accept_environment_strings():
    configured = Settings(_env_file=None, ENVIRONMENT="test", LLM_TIMEOUT_SECONDS="300", LLM_MAX_TOKENS="128000", LLM_MAX_CONTEXT_TOKENS="272000", LLM_MAX_CONTEXT_CHARS="1000000")
    assert configured.LLM_TIMEOUT_SECONDS == 300
    assert configured.LLM_MAX_TOKENS == 128000
    assert configured.LLM_MAX_CONTEXT_TOKENS == 272000
    assert configured.LLM_MAX_CONTEXT_CHARS == 1000000


@pytest.mark.parametrize("value", [math.nan, math.inf, -math.inf, -1, 0, True, "300"])
def test_request_rejects_unbounded_or_invalid_deadline(value):
    with pytest.raises(AIConfigError) as err:
        adapter.timeout_budget(value)
    assert err.value.code == "INVALID_TIMEOUT"


def test_deadline_uses_configured_ceiling_without_thirty_second_clamp(monkeypatch):
    monkeypatch.setattr(settings, "LLM_TIMEOUT_SECONDS", 300)
    assert adapter.timeout_budget(None) == 300
    assert adapter.timeout_budget(120) == 120
    assert adapter.timeout_budget(900) == 300
    assert adapter.timeout_budget(1) == 1


@pytest.mark.asyncio
async def test_async_http_client_and_total_deadline_receive_long_budget(monkeypatch):
    monkeypatch.setattr(settings, "LLM_TIMEOUT_SECONDS", 300)
    monkeypatch.setattr(adapter, "resolve_target_addresses", lambda *args: ("93.184.216.34",))
    original = httpx.AsyncClient
    observed = []

    def create_client(**kwargs):
        observed.append(kwargs["timeout"].read)
        return original(**kwargs, transport=httpx.MockTransport(lambda request: httpx.Response(200, json={"choices": [{"message": {"content": "OK"}, "finish_reason": "stop"}]})))

    monkeypatch.setattr(httpx, "AsyncClient", create_client)
    assert await adapter.chat(snapshot(), [{"role": "user", "content": "Reply OK"}], timeout=120) == "OK"
    assert observed == [120]


def test_sync_http_client_receives_long_remaining_budget(monkeypatch):
    monkeypatch.setattr(settings, "LLM_TIMEOUT_SECONDS", 300)
    monkeypatch.setattr(adapter, "resolve_target_addresses", lambda *args: ("93.184.216.34",))
    original = httpx.Client
    observed = []

    def create_client(**kwargs):
        observed.append(kwargs["timeout"].read)
        return original(**kwargs, transport=httpx.MockTransport(lambda request: httpx.Response(200, json={"choices": [{"message": {"content": "OK"}, "finish_reason": "stop"}]})))

    monkeypatch.setattr(httpx, "Client", create_client)
    assert adapter.chat_sync(snapshot(), [{"role": "user", "content": "Reply OK"}], timeout=120) == "OK"
    assert len(observed) == 1 and 119 < observed[0] <= 120


def test_aggregate_context_char_limit_cannot_be_bypassed_with_many_messages(monkeypatch):
    monkeypatch.setattr(settings, "LLM_MAX_CONTEXT_CHARS", 10)
    with pytest.raises(AIConfigError) as err:
        adapter._chat_body(snapshot(), [{"role": "user", "content": "a" * 6}, {"role": "assistant", "content": "b" * 5}], 1, None)
    assert err.value.code == "CONTEXT_LIMIT"


def test_context_reserves_output_tokens_and_role_overhead(monkeypatch):
    monkeypatch.setattr(adapter, "_text_token_count", len)
    monkeypatch.setattr(settings, "LLM_MAX_CONTEXT_TOKENS", 46)
    message = [{"role": "user", "content": "hello"}]
    assert adapter._chat_body(snapshot(), message, 30, None)["max_tokens"] == 30
    monkeypatch.setattr(settings, "LLM_MAX_CONTEXT_TOKENS", 45)
    with pytest.raises(AIConfigError) as err:
        adapter._chat_body(snapshot(), message, 30, None)
    assert err.value.code == "CONTEXT_LIMIT"


def test_large_configured_output_and_history_are_usable(monkeypatch):
    monkeypatch.setattr(settings, "LLM_MAX_TOKENS", 128000)
    monkeypatch.setattr(settings, "LLM_MAX_CONTEXT_TOKENS", 272000)
    messages = [{"role": "user", "content": "career"}] * 64
    assert adapter._chat_body(snapshot(), messages, 8192, None)["max_tokens"] == 8192
    with pytest.raises(AIConfigError) as err:
        adapter._chat_body(snapshot(), messages, 128001, None)
    assert err.value.code == "TOKEN_BUDGET"


def test_token_count_does_not_download_assets_and_has_safe_utf8_fallback(monkeypatch):
    monkeypatch.setattr(adapter, "_cached_tokenizer", lambda: None)
    assert adapter._text_token_count("hướng nghiệp") == len("hướng nghiệp".encode("utf-8"))


def test_structured_vision_keeps_its_own_token_reserve(monkeypatch):
    monkeypatch.setattr(settings, "LLM_MAX_CONTEXT_TOKENS", 10000)
    monkeypatch.setattr(settings, "LLM_MAX_CONTEXT_CHARS", 100)
    messages = [{"role": "user", "content": [{"type": "text", "text": "Read this"}, {"type": "image_url", "image_url": {"url": "data:image/png;base64," + "a" * 1000}}]}]
    assert adapter._chat_body(snapshot(), messages, 2048, None)["messages"] == messages
    monkeypatch.setattr(settings, "LLM_MAX_CONTEXT_TOKENS", 5000)
    with pytest.raises(AIConfigError) as err:
        adapter._chat_body(snapshot(), messages, 2048, None)
    assert err.value.code == "CONTEXT_LIMIT"


@pytest.mark.asyncio
async def test_admin_probe_uses_a_small_prompt_with_sixty_second_deadline(monkeypatch):
    from types import SimpleNamespace
    from unittest.mock import AsyncMock
    call = AsyncMock(return_value="OK")
    monkeypatch.setattr(adapter, "chat", call)
    monkeypatch.setattr(service, "_rate_limit", lambda actor: None)
    monkeypatch.setattr(service, "_audit", lambda *args: None)
    monkeypatch.setattr(settings, "LLM_TIMEOUT_SECONDS", 300)
    db = SimpleNamespace(commit=AsyncMock())
    payload = SimpleNamespace(probe_request_id="budget-probe", draft_digest="budget", base_revision_token="0" * 64)
    result = await service._run_probe(db, snapshot(), payload, "synthetic-actor", "PROBE_ACTIVE")
    assert result["success"]
    assert call.call_args.kwargs == {"max_tokens": 64, "timeout": 60}
