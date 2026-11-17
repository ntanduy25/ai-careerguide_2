# Kiểm tra source dư, mã chết và phạm vi có thể dọn

Ngày: **17/11/2026**. Dự án kiểm tra: `E:\CMU-SoftWareEngineering\CAPSTONE PROJECT\capstone 1\AI_CAREERGUIDE_1`.

**Kết luận:** có **12 file ưu tiên dọn / 110,991 byte (~108,4 KiB)**, các hàm/đoạn code không có tác dụng, dependency khai báo dư và nhiều bản skill trùng. Đây là kết quả **kiểm toán**, chưa xóa hoặc sửa source. Không coi “không thấy import” là bằng chứng duy nhất để xóa.

## Phạm vi và cách kiểm tra

Đã dùng **3 subagent thực tế**: `admin_frontend` kiểm frontend; `backend_security_audit` kiểm backend; `ai_runtime` kiểm scripts/deployment/tài liệu/skills. Root kiểm tra chéo symbol/reference, hash duplicate và phân loại.

| Phạm vi | Đã kiểm tra |
|---|---|
| Toàn snapshot | 10,297 file, 158,744,075 byte; gồm tài nguyên skill hợp lệ bị gitignore |
| Backend app | 81 file Python, 14.624 dòng; 462 định nghĩa cấp module; 71 route decorator; 26 ORM model |
| Backend scripts/tests và generators | 13 scripts, 25 file test/conftest, 3 document generators; tham chiếu CLI/migration/seed/fixtures |
| Frontend app | 75 TS/TSX + 1 CSS = 76 file, 704.766 byte, 18.213 dòng; entry main.tsx, import tĩnh, re-export, 12 lazy imports |
| Skills | 9.978 file; 397 skill trực tiếp và 325 SKILL.md trong plugin; kiểm kê/hash/loader/reference, không review semantic toàn bộ code khoa học |
| Hạ tầng | Docker/Compose, GitHub CI/hooks, Vercel auto routes, Render, README/handoff/docs, assets/public URLs |

Phương pháp: đọc source/AST và đồ thị phụ thuộc; tìm symbol/path trên app, scripts, tests, docs, config; xét ORM metadata/string relationships, decorators, dynamic imports, `getattr/importlib/glob`, URL asset và convention entrypoints. Không đọc secret, không kết nối DB/provider, không cài package, không thay `.git`, không commit/push.

**Bằng chứng thực hiện mới:**
- `ast.parse` toàn 122 file Python thuộc app/scripts/tests/document: **0 lỗi cú pháp**; không import app hay tạo bytecode.
- TypeScript noEmit bằng compiler host trong bộ nhớ, dùng dependency đã cài ở worktree C: baseline **0 diagnostics**. Mô phỏng bỏ đồng thời 5 file FE-01..05 khỏi root list/file host: **0 diagnostics mới**.
- Đây **không phải** full build/test sau xóa. Chưa chạy deletion, chưa gỡ dependency. Các gate ở cuối báo cáo là điều kiện cho bước dọn sau này.
- SHA-256 trước/sau đã đối chiếu: **10.297/10.297 file gốc giữ nguyên**. Chỉ thêm báo cáo và JSON candidates sau kiểm kê.

## 1. File ưu tiên dọn — tin cậy cao

Các file này không nối vào đường chạy hiện tại hoặc chỉ là bản duplicate/shim. Cần backup và chạy gate sau khi xóa. Với nhóm component cũ, sửa thêm tài liệu `agents-docs/fe/04-cau-truc-code.md` để không còn liệt kê tên đã bỏ.

| ID | File/dòng | Byte | Bằng chứng |
|---|---|---:|---|
| FE-01 | [CognitiveQuestionCard.tsx](../frontend/src/components/assessment/CognitiveQuestionCard.tsx#L22) — `frontend/src/components/assessment/CognitiveQuestionCard.tsx:22` | 5,338 | Không import/re-export/JSX consumer/test; wizard dùng component nội bộ khác. |
| FE-02 | [QuestionCard.tsx](../frontend/src/components/assessment/QuestionCard.tsx#L5) — `frontend/src/components/assessment/QuestionCard.tsx:5` | 1,778 | Không consumer; chỉ liên kết tới LikertScale trong cùng cụm chết. |
| FE-03 | [LikertScale.tsx](../frontend/src/components/assessment/LikertScale.tsx#L15) — `frontend/src/components/assessment/LikertScale.tsx:15` | 2,530 | Consumer duy nhất là QuestionCard.tsx:3; xóa cùng FE-02. |
| FE-04 | [ScoreBarChart.tsx](../frontend/src/components/visualization/ScoreBarChart.tsx#L17) — `frontend/src/components/visualization/ScoreBarChart.tsx:17` | 1,678 | Không consumer/test; chỉ được nhắc trong tài liệu cấu trúc. |
| FE-05 | [index.ts](../frontend/src/constants/index.ts#L5) — `frontend/src/constants/index.ts:5` | 958 | RIASEC_DIMENSIONS, APP_ROUTES, MOET_REGULATIONS không có caller. |
| BE-01 | [models.py](../backend/app/models.py#L1) — `backend/app/models.py:1` | 125 | Shim bị package models/__init__.py cùng tên che; không có direct file loader. |
| BE-02 | [schemas.py](../backend/app/schemas.py#L1) — `backend/app/schemas.py:1` | 137 | Shim bị package schemas/__init__.py cùng tên che; giữ package thật. |
| BE-03 | [logging.py](../backend/app/middleware/logging.py#L10) — `backend/app/middleware/logging.py:10` | 829 | RequestLoggingMiddleware không import, không add_middleware, không test. |
| BE-04 | [__init__.py](../backend/app/middleware/__init__.py#L1) — `backend/app/middleware/__init__.py:1` | 54 | Chỉ docstring; bỏ cùng module logging không được đăng ký. |
| BE-05 | [helpers.py](../backend/app/utils/helpers.py#L6) — `backend/app/utils/helpers.py:6` | 910 | Ba helper chỉ có định nghĩa, không import/reflection/test. |
| BE-06 | [__init__.py](../backend/app/utils/__init__.py#L1) — `backend/app/utils/__init__.py:1` | 50 | Chỉ docstring; bỏ cùng helpers sau kiểm tra namespace. |
| BE-07 | [moet_taxonomy_tt09.json](../backend/app/data/moet_taxonomy_tt09.json#L1) — `backend/app/data/moet_taxonomy_tt09.json:1` | 96,604 | Trùng SHA256 với app/db/seeds/moet_taxonomy_tt09.json; không consumer đường dẫn app/data. Giữ bản db/seeds. |

FE-01..05 cộng **12.282 byte / 341 dòng**. `LikertScale` phải bỏ cùng `QuestionCard`, không tách sai thứ tự. Không xóa `backend/app/models/` hoặc `backend/app/schemas/` là package thật.

Hai asset bổ sung cũng không thấy reference: `frontend/public/favicon.svg` (9.522 B, favicon thực nằm trong data URI tại index.html:8) và `frontend/public/icons.svg` (5.055 B, không có `<use>`/URL reference). Có thể đưa vào cùng đợt dọn sau khi xác nhận không còn link ngoài repo tới public URL.

## 2. Đoạn code nhỏ có thể bỏ trong file đang hoạt động

| File/dòng | Symbol/phạm vi | Bằng chứng / phần phải giữ |
|---|---|---|
| `backend/app/services/recommender/service.py:253` | `apply_constrained_diversity_reranking`, 143 dòng | Chỉ định nghĩa, không caller/test/registration. Đường hiện tại dùng `order()` và hard gate trước top-k. |
| `backend/app/core/security.py:33` | `check_and_rehash`, 3 dòng | Không caller; không thay/xóa password verifier đang dùng. |
| `backend/app/core/llm_client.py:39` | `resolve_model_token_limits_sync`, 3 dòng | Không caller; không xóa toàn module vì test khác còn dùng. |
| `backend/app/services/ai_config/adapter.py:253` | `model_details`, 2 dòng | Không caller/runtime/test; giữ `list_models`, HTTP transport và guard. |
| `backend/app/services/llamaindex_rag_orchestrator/guidance_rag.py:91` | `call_llm_for_personalization`, 3 dòng | Stub retired chỉ raise; không còn test patch/caller tại snapshot này. |
| Cùng file `:287` | `update_llm_config`, 3 dòng | Wrapper chỉ còn import thừa ở facade `service.py:45`; bỏ đồng thời import. HTTP alias dùng ai_config.service trực tiếp. |
| `backend/app/services/recommender/aspiration_agent.py:125` | `_match_aspiration_to_majors`, 3 dòng | Alias không caller; `_resolve_intent` vẫn là đường thật. |
| `backend/app/services/taxonomy/service.py:102,162` | `_attach_seed_trend_info` (14 dòng), `list_careers_by_major` (4 dòng) | Không caller; không xóa `format_major_dict`/query eager-load đang dùng. |
| `backend/app/services/taxonomy/trend_agent.py:946` | `_strip_old_trend_prefix`, 4 dòng | Không caller sau thay DB-only trend metadata. |
| `backend/app/schemas/taxonomy.py:63,83` | `SubjectBlockSummary`, `SkillSummary` | Không consumer; phải phân biệt base schema đang được schema khác kế thừa. |
| `backend/app/services/major_insight/service.py:30` | `RIASEC_LABELS`, 8 dòng | Hằng không được đọc. |
| `backend/app/services/recommender/engine.py:229,516,517` | `APTITUDE_BLOCKS`, `GROUPS`, `BASE_WEIGHTS` | Hằng không có consumer; không xóa thuật toán xung quanh. |
| `backend/app/services/recommender/service.py:954,962` | `max_trend_boost`, `trend_field_bonus` | Kết quả tính không được đọc. Bỏ xong mới xem xét `get_trend_rank_boost` mất caller cuối. |
| `frontend/src/components/assessment/OnetSwipeCardVisual.tsx:106` | `OnetItemVisualIcon`, 12 dòng | Không dùng; giữ `getOnetIcon` vì `QuestionIllustrationFrame` dùng. |
| `frontend/src/services/mockData.ts:22,103` | `majors` + `defaultFunnelData`, cụm107 dòng | Chỉ hai biến tham chiếu nhau. Giữ radar/type và roadmap còn có caller. |
| `frontend/src/utils/index.ts:8,16,25,33` | `formatPercent`, `formatZScore`, `truncateText`, `formatMajorCode` | Không consumer; giữ `formatBlockWithSubjects` và map đang dùng ở4file. |
| `frontend/src/routes/PrivateRoute.tsx:5` | `PrivateRoute`, 10 dòng | Không caller; giữ `StudentRoute:17` được AppRoutes import. Bỏ import useLocation nếu không còn dùng. |
| `frontend/src/index.css:215,225,230` | `.sidebar-mini-button`/hover, `.sidebar-section-label`, khoảng25 dòng | Không class reference TS/TSX/HTML/test. |
| `frontend/src/pages/RoadmapView.tsx:94` | Tham số `task` của `getTaskGuide` | Tham số không được đọc; sửa signature/caller, không xóa hàm. |

AST tự động đánh dấu 209 import chưa đọc trong 35 module Python. Đây chỉ là **candidate**, không phải danh sách xóa: ORM registration, package export và facade có side-effect hợp lệ. Không dùng autofix xóa tất cả import.

## 3. Tính toán không tạo ra kết quả hữu ích — cần refactor có kiểm chứng

### Scorer chạy rồi ghi đè

`backend/app/services/recommender/service.py` xây feasibility/XAI/top_factors/tactic ở các vùng 606–655,657–671,680–716 (**102 dòng**) rồi `_publish_readiness()` ghi đè22field trước sort/return tại778.

Không xóa nguyên đoạn ngay: constructor còn đọc các biến trung gian. Phải khởi tạo trực tiếp từ readiness, bỏ nhánh cũ và so JSON đầu ra trước/sau trên hồ sơ rỗng, thiếu, trung lập, sát ngưỡng, học lực cao, cognitive và aspiration; chỉ chuẩn hóa timestamp. **Giữ** bm_info520–526 và academicfit554–563 vì ảnh hưởng điểm. **Giữ** trend_compat673–678 vì vẫn nằm trong score_breakdown.

### OCR nhận diện loại thông tư không còn được sử dụng

`stream_a_ingest.py:161,168–169` gán `is_tt74` nhưng không đọc. Block RapidOCR186–201 tạo OCR engine/render tối đa2trang chỉ để gán cờ đó. Có thể bỏ metadata pass và cờ sau regression PDF có/không có text. **Giữ** vision extraction180 và `pymupdf` trong `extract_with_ai_vision_model`; không coi toàn bộ OCR là dead.

## 4. Runtime không dùng nhưng test/hợp đồng còn bám

Chỉ xóa sau khi chuyển các assertion nghiệp vụ có giá trị sang đường production. Không bỏ test để ép xanh.

- `core/llm_client.py`: test_dual_rag_and_ingestion527–543 vẫn dùng match/parser/resolver/cache; production adapter hiện tự giới hạn budget. Chuyển test budget/exactmodel rồi mới thu gọn module.
- `horizon_gender_engine.py`: gender adjustment105dòng, replacement19, reranking337 và fairness audit41 chỉ còn test trực tiếp. `get_grade_horizon_config` **vẫn ảnh hưởng weights/nhãn**, không xóa file.
- `engine.py`: `compute_adaptive_weights`64dòng và `calculate_3pillar_hybrid_score`52dòng chỉ còn test/đường cũ; production dùng `evidence.score_observed_pillars`. Chuyển invariant test rồi mới bỏ.
- `hitl_governance.generate_deterministic_embedding`: test toán học dùng, runtime không dùng; cần quyết định còn giá trị benchmark không.
- `guidance_rag.get_llm_status/test_llm_connection`: facade/test còn dùng; HTTP alias gọi service mới.
- `tt74_reference.parse_excel_or_csv_majors`: test_scoring572 còn dùng; runtime dùng bản multi-sheet.
- Các export schema `BlockZScoreResult`, `StudentProfileSummary`, `MajorResponse`, `CareerResponse`: thu gọn đồng thời re-export/import; kiểm tra kế thừa trước xóa.
- Alias `compute_cosine_similarity`, `compute_cognitive_match`, `compute_content_sha256`: script test_backend_core vẫn tham chiếu; phải xử lý script trước.
- `seed_tt09.py` không xóa toàn file: test_scoring:23 import MAJORS_DATA/SUBJECT_BLOCKS_DATA/SKILLS_DATA. Tách fixtures ra khỏi script demo trước.

## 5. Script, asset và config cần lưu trữ hoặc sửa

| File | Kết luận |
|---|---|
| `backend/scripts/setup_database.py:27` | Có thể archive: SQLite schema/đường dẫn cũ, demo seeds,545dòng/25.190B. Không caller thực ngoài file. Hướng dẫn thay bằng init_db/seed_catalog/create_admin. |
| `backend/scripts/test_backend_core.py:14,126` | Script lỗi thời: import normal_cdf từ module không export, assertion đòi nguồn giả trái contract hiện tại. Chuyển test độc nhất sang pytest rồi archive;158dòng/6.845B. |
| `backend/scripts/verify_taxonomy.py:16,46` | **Giữ, sửa:** zip bỏ qua chênh lệch số hàng, thiếu exit1 khi lỗi. Không dùng thông báo SUCCESS làm bằng chứng đủ435. |
| `document/generate_*.py` | Tool soạn tài liệu thủ công, không phải code app chết. Có thể archive cùng asset/output;2.053dòng/144.597B. Có absolute output paths cũ cần sửa nếu tiếp tục dùng. |
| `frontend/public/Bao_Cao_Cong_Nghe_AI_CareerGuide.docx` | Trùng SHA256 bản document43.153B, không link FE. Có thể bỏ bản public nếu không cần external URL, giữ canonicaldocument. |
| `document/MOET_Major_Import_Template_Standard.xlsx` | Copy17.681B tùy chọn lưu trữ; giữ bản backend và frontend/public vì API/test/download dùng thật. |
| 30 `.gitkeep` trong thư mục có nội dung | Dọn cosmetic0B. `frontend/src/assets/.gitkeep` đang giữ thư mục rỗng: không xóa nếu muốn directory tồn tại. |
| `frontend/tailwind.config.js` | Không @config/import/script reference; ViteTailwind4+CSS@theme là đường dùng. Candidate1.123B/42dòng nhưng cần so CSS/build trước-sau. |

**Lỗi đang chạy không được giải quyết bằng cách xóa file:**

1. `RoadmapFlow.tsx:114,122` thay `weeks=[]` bằng roadmap mẫu; `RoadmapView.tsx:498` luôn render ngay cả khi API lỗi/rỗng. Cần sửa empty/error contract và regression, không xóa component hoặc `@xyflow/react`.
2. `RiasecRadarChart.tsx:17` có default điểm mẫu; caller hiện truyềndata. Có thể bắt buộc prop và bỏ default sau kiểm tra, nhưng metadata radar vẫn dùng.
3. Catalog tĩnh `data/moetMajors435.ts` đang dùng ở chat/detail, có nguy cơ lệch activeDB. Chuyển nguồn đọc trước khi xem xét xóa.
4. `render.yaml:17,21` dùng OPENAI_* cũ trong khi resolver dùng LLM_*; phải sửa deployconfig.
5. CI `.github/workflows/ci.yml:61` chỉ chạy test_scoring_and_gap_engine, không phải toàn backend/auth/runtime/PG/E2E.
6. Standalone `backend/Dockerfile` không migrate trong CMD, Compose có init; phải thống nhất cách vận hành. FrontendDocker dùng npm install thay vì ci theo lock.
7. `frontend/api/[...path].js` là entrypoint theo convention Vercel: cần giữ/xác minh deployment. Multipart stringify và response.text có thể phá upload/binary; thiếu timeout và echo rawerror. Không phải deadfile vì khôngimport.
8. README còn thông tin repo/108ngành/64tests/Node18/quickstart cũ. Cập nhật, không xóa README.

## 6. Dependency có thể thu gọn

Frontend không có import/test/configconsumer: `@animate-ui/react`, `@tanstack/react-query`, `html2canvas`, `jspdf`, `pngjs`, `tailwind-merge`, `xlsx`, `autoprefixer`. `motion` chỉ là peer của animate-ui không dùng, có thể bỏ cùng nhóm; **giữ framer-motion**.

Chỉ bỏ **direct declaration** khi phù hợp, không cưỡng ép xóa transitive: `clsx` vẫn doRecharts dùng; `postcss` vẫn doVite dùng. **Giữ react-is** là peerRecharts. `react-router-dom` đang cấp transitive `react-router` cho app: phải khai báo `react-router` trực tiếp trước khi bỏDOM, không xóa đơn lẻ.

Backend `scipy`, `openai`, `tavily-python` không có import hiện tại: candidates cho clean-install verification. **Giữ numpy:** pgvector runtime dùng thực tế; metadata bản cài không đảm bảo dependency tự được kéo vào. Không thêm/xóa package chỉ dựa tên trong comment.

Sau thay dependency: package manager cập nhật lock, freshinstall môi trường riêng, build/typecheck/unit và backend/integration phù hợp. Lần kiểm toán này không cài/gỡ package và không cam kết dung lượng node_modules tiết kiệm.

## 7. Skills: phần lớn dung lượng, không phải toàn bộ là rác

`.agents` chiếm **152.687.828/158.744.075 byte (~96,18%)** snapshot. 4.470 nhóm trùng cùng basename+SHA256 cho4.717bản sao dư, **76.406.711B (~72,9MiB)** tiềm năng dedup. Không phải tổng được phép xóa ngay.

322/324 cặp plugin-skill/flattened-skill giống toàn thư mục; phía plugin4.588file/73.916.576B. Hai ngoại lệ `eval-harness`, `verification-loop` có nội dung/frontmatter khác. Các catalog/loader/registry có thể cần cả hai layout. Người dùng vừa yêu cầu chuyển skills, vì vậy không xóa `.agents/plugins` hoặc nhóm scientific theo phỏng đoán app khôngimport.

159 skill khoa học là tùy chọn so với webhướngnghiệp; có thể archive/giữlibrary riêng khi chốt nhu cầu, không gọi chúng là code app chết.

**Cần bảo toàn62file hợp lệ đang bị gitignore che** (903.066B):58check_*.py +3sidecardist +homunculus-dir.sh. Tham chiếu thật trong PDF forms, continuous-learning hooks và sidecar.json. Quy tắcignore `lib/`, `dist/`, `check_*.py` quá rộng với kho skills; nên bổ sung ngoại lệ có kiểm soát khi commit, không xóa các file này.

Cấu hình `.agents/ecc-install-state.json` chứa đường dẫn repo cũ/provenanceflatten-copy. Đánh giá khả năng di chuyển và loader trước khi dedup; không tự sửa config toàn máy.

## 8. Thứ tự dọn khuyến nghị

1. **Đợt1 ít rủi ro:** backup; bỏ12file nhóm1 + các hàm/hằng khôngcaller ởnhóm2 theo dependency; cập nhật docs references. Kiểmtra sourcegraph/typecheck/build/unit. Mỗi nhóm xóa có manifest và restore.
2. **Đợt2:** chuyển tests/helperlegacy, sửa lỗi fallbackRoadmap, refactor102dòng tính rồi ghi đè và bỏRapidOCR pass vôdụng. So output trước/sau/counterfactual, chạy testdomain/integration.
3. **Đợt3:** gỡ package thừa bằng package manager/cleaninstall; archive demo/docs; dedupskills sau khi kiểm loader. Không gộp tất cả thành một lần xóa lớn.

Gate dự kiến sau khi thực sự sửa: `npm --prefix frontend run typecheck`, `npm --prefix frontend run build`, `npm --prefix frontend test`, `py -3 -m pytest backend/tests -q`; PGtests dùng databasekiểmthửriêng qua AUDIT_TEST_DATABASE_URL, browser smoke wizard/dashboard/roadmap/admin. Không dùng DBngười dùng để làmtest. Nếu chưa códeps ởE thì cài từlock trong môi trườngriêng trước gate.

**Trạng thái bàn giao:** CHECKED / NOT_DELETED. Không thay source, `.env`, DB, Gitindex hay lịch sử. Báo cáo và `DEAD_CODE_CANDIDATES.json` là hai file mới duy nhất của lần kiểm toán; JSON không phải script xóa tự động.
