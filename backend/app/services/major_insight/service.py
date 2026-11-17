"""Catalog-grounded major information and evidence-limited student insights.

Public output is deterministic. Cache keys bind active catalog content and the
resolved actor-owned profile; no generative provider receives these profiles.
"""

import hashlib
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.insight import MajorInsight, StudentSkillInsight
from app.schemas.insight import (
    CareerPosition,
    InsightPoint,
    MajorInsightResponse,
    SkillGapItem,
    StudentSkillAnalysisRequest,
    StudentSkillAnalysisResponse,
    TrainingContent,
)

logger = logging.getLogger(__name__)

RIASEC_LABELS: Dict[str, str] = {
    "R": "Thực tế (thích làm việc cụ thể, máy móc, công cụ)",
    "I": "Nghiên cứu (thích phân tích, tìm hiểu nguyên nhân)",
    "A": "Nghệ thuật (thích sáng tạo, thể hiện cá tính)",
    "S": "Xã hội (thích giúp đỡ, kết nối con người)",
    "E": "Quản lý (thích dẫn dắt, thuyết phục)",
    "C": "Nghiệp vụ (thích quy trình, số liệu, tổ chức)",
}

# =========================================================================
# 1. MAJOR INSIGHT AGENT
# =========================================================================

async def _load_major_context(db: Optional[AsyncSession], major_code: str) -> Dict[str, Any]:
    from app.services.recommender.catalog import get_active_major_context
    return await get_active_major_context(db, major_code)


def build_deterministic_major_insight(ctx: Dict[str, Any]) -> Tuple[TrainingContent, List[CareerPosition], bool]:
    """Render catalog facts and clearly labelled study suggestions, never model prose."""
    name = ctx["name"]
    training = TrainingContent(
        overview=(f"Thông tin tham khảo về {name}. " + (ctx.get("description") or
            "Danh mục chưa có đề cương chi tiết; hãy đối chiếu chương trình của trường bạn quan tâm."))[:600],
        core_knowledge=[f"Tra cứu các học phần cơ sở và chuyên ngành của {name}",
                        "Đối chiếu môn tiên quyết trong đề cương của trường"],
        practical_skills=["Thử một bài tập nhập môn và ghi lại mức hứng thú, khó khăn",
                          "Trao đổi với giảng viên hoặc người đang làm nghề về công việc thực tế"],
        curriculum_highlights=["Các mục trên là gợi ý tìm hiểu, chưa phải chương trình đã được trường xác nhận."],
        study_duration="Chưa có dữ liệu xác minh; thời lượng phụ thuộc chương trình và trường.",
    )
    careers = [CareerPosition(title=str(title),
        description=f"Vị trí được ghi trong danh mục ngành {name}; điều kiện hành nghề cần đối chiếu riêng.",
        career_level="Tham khảo") for title in (ctx.get("careers") or [])[:6]]
    return training, careers, False


def _to_major_insight_response(entry: MajorInsight, cached: bool) -> MajorInsightResponse:
    training_data = entry.training_content or {}
    return MajorInsightResponse(
        major_code=entry.major_code,
        major_name=entry.major_name,
        training_content=TrainingContent(**training_data),
        career_positions=[CareerPosition(**c) for c in (entry.career_positions or [])],
        subject_blocks=list(entry.subject_blocks or []),
        is_ai_generated=bool(entry.is_ai_generated),
        cached=cached,
        generated_at=entry.generated_at.isoformat() if entry.generated_at else None,
    )


async def get_or_create_major_insight(
    db: Optional[AsyncSession],
    major_code: str,
    refresh: bool = False,
) -> MajorInsightResponse:
    """
    Cache-first: đọc `major_insights` theo major_code.
    Dựng từ danh mục hiện hành; cache chỉ dùng khi dấu vân tay nội dung còn khớp.
    """
    ctx = await _load_major_context(db, major_code)
    model_name = "catalog-v2:" + hashlib.sha256(json.dumps(ctx, ensure_ascii=False, sort_keys=True).encode()).hexdigest()
    if db is not None and not refresh:
        try:
            cached_entry = (
                await db.execute(select(MajorInsight).where(MajorInsight.major_code == major_code))
            ).scalar_one_or_none()
            if cached_entry and cached_entry.model_name == model_name and not cached_entry.is_ai_generated:
                return _to_major_insight_response(cached_entry, cached=True)
        except Exception as exc:
            logger.warning("[MajorInsight] Cache read failed for %s: %s", major_code, exc)

    training, career_positions, is_ai = build_deterministic_major_insight(ctx)
    now = datetime.now(timezone.utc)

    if db is None:
        return MajorInsightResponse(
            major_code=major_code,
            major_name=ctx["name"],
            training_content=training,
            career_positions=career_positions,
            subject_blocks=list(ctx.get("blocks") or []),
            is_ai_generated=is_ai,
            cached=False,
            generated_at=now.isoformat(),
        )

    try:
        entry = (
            await db.execute(select(MajorInsight).where(MajorInsight.major_code == major_code))
        ).scalar_one_or_none()
        payload = {
            "major_name": ctx["name"],
            "training_content": training.model_dump(),
            "career_positions": [c.model_dump() for c in career_positions],
            "subject_blocks": list(ctx.get("blocks") or []),
            "is_ai_generated": is_ai,
            "model_name": model_name,
            "generated_at": now,
        }
        if entry:
            for key, value in payload.items():
                setattr(entry, key, value)
        else:
            entry = MajorInsight(id=uuid.uuid4(), major_code=major_code, **payload)
            db.add(entry)
        await db.commit()
        await db.refresh(entry)
        return _to_major_insight_response(entry, cached=False)
    except Exception as exc:
        logger.warning("[MajorInsight] Persist failed for %s: %s", major_code, exc)
        try:
            await db.rollback()
        except Exception:
            pass
        return MajorInsightResponse(
            major_code=major_code,
            major_name=ctx["name"],
            training_content=training,
            career_positions=career_positions,
            subject_blocks=list(ctx.get("blocks") or []),
            is_ai_generated=is_ai,
            cached=False,
            generated_at=now.isoformat(),
        )


async def delete_major_insight(db: Optional[AsyncSession], major_code: str) -> bool:
    """Xoá bản ghi cache của một ngành. Trả về True nếu có bản ghi bị xoá."""
    if db is None:
        return False
    try:
        entry = (
            await db.execute(select(MajorInsight).where(MajorInsight.major_code == major_code))
        ).scalar_one_or_none()
        if not entry:
            return False
        await db.delete(entry)
        await db.commit()
        return True
    except Exception as exc:
        logger.warning("[MajorInsight] Delete failed for %s: %s", major_code, exc)
        try:
            await db.rollback()
        except Exception:
            pass
        return False


# =========================================================================
# 2. STUDENT SKILL AGENT
# =========================================================================

def _profile_hash(payload: StudentSkillAnalysisRequest) -> str:
    canonical = {"policy": "evidence-skills-v2", **payload.model_dump(mode="json", exclude_none=True)}
    raw = json.dumps(canonical, ensure_ascii=False, sort_keys=True, allow_nan=False)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def build_deterministic_skill_analysis(
    payload: StudentSkillAnalysisRequest,
    major_name: Optional[str] = None,
) -> Tuple[str, List[InsightPoint], List[InsightPoint], List[SkillGapItem]]:
    """Only observed scores and declared preferences; no inferred ability from interests."""
    from app.services.recommender.readiness import build_interest_evidence, validate_readiness_grades
    evidence = build_interest_evidence(getattr(payload, "riasec_answers", None), payload.riasec_scores)
    grades = validate_readiness_grades(payload.grades_by_subject)["scores"]
    strengths, weaknesses, gaps = [], [], []
    if evidence["status"] == "COMPLETE":
        groups = sorted(evidence["groups"], key=lambda group: -group["percent"])
        for group in groups[:2]:
            strengths.append(InsightPoint(title=f"Sở thích {group['code']}: {group['percent']:g}%",
                detail="Mức tự khai về hứng thú, không phải điểm đo năng lực hay xác suất trúng tuyển."))
    if grades:
        subject, score = max(grades.items(), key=lambda pair: pair[1])
        strengths.append(InsightPoint(title=f"Điểm {subject}: {score:g}",
            detail="Đây là điểm đã cung cấp; chưa đủ để khẳng định thành thạo kỹ năng chuyên ngành."))
        for subject, score in sorted(grades.items(), key=lambda pair: pair[1]):
            if score >= 7:
                continue
            weaknesses.append(InsightPoint(title=f"Cân nhắc ôn {subject}",
                detail=f"Điểm hiện có {score:g}/10. Nên làm bài chẩn đoán để biết phần nào cần ôn; đây không phải kết luận về năng lực nghề."))
            gaps.append(SkillGapItem(skill=f"Nền tảng môn {subject}",
                why="Gợi ý ôn tập từ điểm đã nhập, chưa phải lỗ hổng kỹ năng đã được đo.",
                how_to_improve=["Làm bài chẩn đoán ngắn để tìm phần chưa hiểu", "Chọn một chủ đề cần ôn và kiểm tra lại sau khi học"], priority="HIGH"))
    if not gaps and grades:
        gaps.append(SkillGapItem(skill="Kiểm tra nền tảng trước khi học chuyên ngành",
            why="Điểm học bạ không xác nhận kỹ năng tiên quyết; cần kiểm tra trước khi bỏ qua nội dung.",
            how_to_improve=["Đối chiếu đề cương môn nhập môn", "Làm bài chẩn đoán theo các môn tiên quyết"], priority="MEDIUM"))
    subject_text = f" cho ngành {major_name}" if major_name else ""
    summary = (f"Ghi nhận dữ liệu học tập{subject_text}. Sở thích và phong cách tự khai không phải phép đo năng lực. "
               "Các nội dung dưới đây là gợi ý kiểm tra/ôn tập, không kết luận đủ điều kiện tuyển sinh.")
    if not grades and evidence["status"] != "COMPLETE":
        summary = "Chưa đủ bằng chứng để phân tích cá nhân" + subject_text + ". Hãy bổ sung điểm hoặc hoàn thành bài sở thích; không suy ra điểm mạnh/yếu từ phần bỏ trống."
    return summary, strengths[:3], weaknesses[:3], gaps[:4]


def _to_skill_response(entry: StudentSkillInsight, cached: bool) -> StudentSkillAnalysisResponse:
    return StudentSkillAnalysisResponse(
        profile_hash=entry.profile_hash,
        major_code=entry.major_code or "",
        summary=entry.summary,
        strengths=[InsightPoint(**p) for p in (entry.strengths or [])],
        weaknesses=[InsightPoint(**p) for p in (entry.weaknesses or [])],
        skill_gaps=sorted(
            (SkillGapItem(**g) for g in (entry.skill_gaps or [])),
            key=lambda gap: {"HIGH": 0, "MEDIUM": 1, "LOW": 2}.get(gap.priority, 1),
        ),
        is_ai_generated=bool(entry.is_ai_generated),
        cached=cached,
        insight_id=entry.id,
    )


async def analyze_student_skills(
    db: Optional[AsyncSession],
    payload: StudentSkillAnalysisRequest,
    user_id: Optional[uuid.UUID] = None,
) -> StudentSkillAnalysisResponse:
    """
    Cache theo chủ sở hữu, hồ sơ bằng chứng và nội dung danh mục; không gọi mô hình sinh văn bản.
    """
    from fastapi import HTTPException
    from app.services.llamaindex_rag_orchestrator.guidance_boundary import resolve_profile_owner
    from app.services.recommender.service import resolve_assessment_evidence
    user_id = resolve_profile_owner(payload.user_id, user_id)
    if payload.assessment_id and user_id is None:
        raise HTTPException(401, "Đăng nhập để xem bản đánh giá đã lưu.")
    raw = payload.model_dump(exclude_unset=True)
    evidence = await resolve_assessment_evidence(db, user_id, raw)
    payload = payload.model_copy(update={
        "riasec_answers": evidence.get("riasec_answers") or {},
        "riasec_scores": evidence.get("riasec_scores") or {},
        "grades_by_subject": evidence.get("grades_by_subject") or {},
        "cognitive_preferences": evidence.get("cognitive_preferences") or {},
        "cognitive_answers": evidence.get("cognitive_preferences") or {},
        "aspiration": evidence.get("aspiration") or {},
        "score_context": evidence.get("score_context") or {},
    })
    major_code = (payload.major_code or "").strip()
    major_name = None
    ctx = {}
    if major_code:
        ctx = await _load_major_context(db, major_code)
        major_name = ctx["name"]
    profile_hash = hashlib.sha256(json.dumps({
        "owner": str(user_id or "guest"), "profile": _profile_hash(payload),
        "catalog_context": ctx, "policy": "evidence-skills-v3",
    }, ensure_ascii=False, sort_keys=True, default=str).encode()).hexdigest()

    if db is not None:
        try:
            stmt = select(StudentSkillInsight).where(
                StudentSkillInsight.profile_hash == profile_hash,
                StudentSkillInsight.major_code == major_code,
            )
            cached_entry = (await db.execute(stmt)).scalar_one_or_none()
            if cached_entry and not cached_entry.is_ai_generated:
                return _to_skill_response(cached_entry, cached=True)
        except Exception as exc:
            logger.warning("[SkillAgent] Cache read failed: %s", exc)

    summary, strengths, weaknesses, gaps = build_deterministic_skill_analysis(payload, major_name)
    is_ai = False

    if db is None:
        return StudentSkillAnalysisResponse(
            profile_hash=profile_hash,
            major_code=major_code,
            summary=summary,
            strengths=strengths,
            weaknesses=weaknesses,
            skill_gaps=gaps,
            is_ai_generated=is_ai,
            cached=False,
        )

    try:
        stmt = select(StudentSkillInsight).where(
            StudentSkillInsight.profile_hash == profile_hash,
            StudentSkillInsight.major_code == major_code,
        )
        entry = (await db.execute(stmt)).scalar_one_or_none()
        payload_data = {
            "user_id": user_id,
            "summary": summary,
            "strengths": [p.model_dump() for p in strengths],
            "weaknesses": [p.model_dump() for p in weaknesses],
            "skill_gaps": [g.model_dump() for g in gaps],
            "is_ai_generated": is_ai,
            "model_name": "evidence-skills-v3",
        }
        if entry:
            for key, value in payload_data.items():
                if key == "user_id" and value is None:
                    continue
                setattr(entry, key, value)
        else:
            entry = StudentSkillInsight(
                id=uuid.uuid4(),
                profile_hash=profile_hash,
                major_code=major_code,
                **payload_data,
            )
            db.add(entry)
        await db.commit()
        await db.refresh(entry)
        return _to_skill_response(entry, cached=False)
    except Exception as exc:
        logger.warning("[SkillAgent] Persist failed: %s", exc)
        try:
            await db.rollback()
        except Exception:
            pass
        return StudentSkillAnalysisResponse(
            profile_hash=profile_hash,
            major_code=major_code,
            summary=summary,
            strengths=strengths,
            weaknesses=weaknesses,
            skill_gaps=gaps,
            is_ai_generated=is_ai,
            cached=False,
        )
