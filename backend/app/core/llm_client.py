"""Giới hạn model có ngân sách; mọi HTTP dùng cùng snapshot/adapter an toàn."""
import time
from app.core.ai_runtime import ConfigSnapshot
from app.core.config import settings

_MODEL_CAPS_CACHE = {}


def _match_model_record(models, target_model):
    target=(target_model or "").lower()
    return next((m for m in models if isinstance(m,dict) and str(m.get("id", "")).lower()==target),None)


def _parse_capabilities(entry):
    entry = entry if isinstance(entry, dict) else {}
    caps=entry.get("capabilities",{})
    if not isinstance(caps, dict):
        caps = {}
    def positive(value, default):
        try:
            if isinstance(value, bool):
                return default
            parsed = int(value)
            return parsed if parsed > 0 else default
        except (ValueError, TypeError, OverflowError):
            return default
    output = positive(caps.get("maxOutput") or (entry or {}).get("max_completion_tokens") or
                      (entry or {}).get("max_output_tokens"), 4096)
    context = positive(caps.get("contextWindow") or (entry or {}).get("context_length") or
                       (entry or {}).get("context_window"), 16384)
    context = min(context, settings.LLM_MAX_CONTEXT_TOKENS)
    return {"max_output_tokens": min(output, settings.LLM_MAX_TOKENS, max(1, context - 1024)),
            "context_window": context, "max_context_chars": min(settings.LLM_MAX_CONTEXT_CHARS, context * 4)}


async def resolve_model_token_limits(snapshot: ConfigSnapshot | None = None):
    from app.services.ai_config.service import resolve_snapshot
    from app.services.ai_config.adapter import list_models
    snapshot=snapshot or await resolve_snapshot(allow_unconfigured=True)
    if snapshot.auth_mode=="BEARER" and not snapshot.credential:
        return _parse_capabilities(None)
    cached=_MODEL_CAPS_CACHE.get(snapshot.revision_token)
    if cached and time.monotonic()-cached[0]<600:
        return dict(cached[1])
    models=await list_models(snapshot)
    limits=_parse_capabilities(_match_model_record(models,snapshot.model))
    if len(_MODEL_CAPS_CACHE)>=32:
        _MODEL_CAPS_CACHE.clear()
    _MODEL_CAPS_CACHE[snapshot.revision_token]=(time.monotonic(),limits)
    return dict(limits)


def resolve_model_token_limits_sync(snapshot: ConfigSnapshot):
    # Sync OCR dùng ngân sách cố định; không đọc singleton hoặc gọi lại provider giữa trang.
    return _parse_capabilities(None)


def clear_model_caps_cache():
    _MODEL_CAPS_CACHE.clear()
