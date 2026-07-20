-- ==========================================
-- 커뮤니티 기반 커리어 로드맵 플랫폼 reference SQL Queries
-- ==========================================

-- 0. 테스트용 종속성 데이터 삽입 (외래키 제약조건 방지)
-- 0.1 auth.users에 테스트 유저 삽입
INSERT INTO auth.users (id, email)
VALUES ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'testuser@example.com')
ON CONFLICT (id) DO NOTHING;

-- 0.2 jobs에 테스트 직무 삽입
INSERT INTO public.jobs (id, title, industry, description, search_tags, display_order)
VALUES 
    ('018f4b50-1234-7000-8000-000000000001', '백엔드 개발자', 'IT', '백엔드 시스템 아키텍처 및 API 개발', 'backend, 백엔드, 백앤드, 서버개발자, server', 1),
    ('018f4b50-1234-7000-8000-000000000002', 'DevOps 엔지니어', 'IT', '클라우드 인프라 및 CI/CD 구축', 'devops, 데브옵스, 디옵스, 인프라, infra', 2)
ON CONFLICT (id) DO NOTHING;

-- 0.3 standard_events에 테스트 표준 이벤트 삽입
INSERT INTO public.standard_events (id, category, standard_title, description)
VALUES ('018f4b50-eeee-7000-8000-000000000001', 'certificate', 'SQLD 자격증', '한국데이터산업진흥원 주관 SQL 개발자 자격증')
ON CONFLICT (id) DO NOTHING;

-- 1. 사용자 프로필 및 목표 직무 등록/조회
-- 1.1 프로필 생성 (Supabase Auth 가입 트리거용 예시)
INSERT INTO public.profiles (id, nickname, avatar_url, bio)
VALUES (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', -- auth.users.id
    '커리어꿈나무',
    'https://example.com/avatar.png',
    '백엔드 시니어 개발자를 꿈꾸는 주니어입니다.'
)
ON CONFLICT (id) DO NOTHING;

-- 1.2 목표 직무 다중 등록 (1순위 백엔드, 2순위 DevOps)
INSERT INTO public.profile_target_jobs (profile_id, job_id, priority)
VALUES 
    ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '018f4b50-1234-7000-8000-000000000001', 1), -- 백엔드 개발자 ID
    ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '018f4b50-1234-7000-8000-000000000002', 2) -- DevOps 엔지니어 ID
ON CONFLICT (profile_id, job_id) DO NOTHING;


-- 2. 개인 커리어 이벤트(Events) 및 Sequence 등록
-- 2.1 첫 번째 활동 등록: 전공수업 수강 (attributes JSONB 속성 포함)
INSERT INTO public.events (id, profile_id, category, event_type, title, description, start_date, end_date, visibility, status, attributes)
VALUES (
    '018f4b50-abcd-7000-9000-000000000001', -- UUIDv7
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'study',
    'university_course',
    '자료구조 및 알고리즘',
    '전공 필수 알고리즘 수강 및 Java 구현 과제 수행',
    '2025-03-02',
    '2025-06-20',
    'public',
    'completed',
    '{"grade": "A+", "credits": 3, "professor": "홍길동"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 2.2 두 번째 활동 등록: 자격증 취득
INSERT INTO public.events (id, profile_id, standard_event_id, category, event_type, title, description, start_date, end_date, visibility, status, attributes)
VALUES (
    '018f4b50-abcd-7000-9000-000000000002', -- UUIDv7
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    '018f4b50-eeee-7000-8000-000000000001', -- 표준 SQLD 자격증 ID
    'certificate',
    'qualification',
    'SQL 개발자(SQLD) 자격증 취득',
    '데이터베이스 기초 및 SQL 활용 능력 검증',
    '2025-07-05',
    '2025-07-05',
    'public',
    'completed',
    '{"score": 82, "issue_organization": "한국데이터산업진흥원"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 2.3 활동 간 Sequence 연결 정의 (알고리즘 수강 -> SQLD 취득)
INSERT INTO public.event_sequences (id, profile_id, previous_event_id, next_event_id, order_index)
VALUES (
    '018f4b50-9999-7000-8000-000000000001',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    '018f4b50-abcd-7000-9000-000000000001', -- 알고리즘
    '018f4b50-abcd-7000-9000-000000000002', -- SQLD
    1
)
ON CONFLICT (id) DO NOTHING;


-- 3. 특정 사용자의 순차적 커리어 로드맵 조회 (Recursive CTE)
-- 사용자가 등록한 Sequence를 타고 시작 노드부터 끝 노드까지 시간 순서대로 조회
WITH RECURSIVE career_path AS (
    -- Anchor Member: 이전 활동이 없는 첫 번째 활동 찾기
    SELECT 
        e.id, 
        e.title, 
        e.category, 
        e.start_date, 
        e.end_date, 
        es.next_event_id,
        1 AS step_level
    FROM public.events e
    LEFT JOIN public.event_sequences es ON e.id = es.previous_event_id
    WHERE e.profile_id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'
      AND NOT EXISTS (
          SELECT 1 FROM public.event_sequences 
          WHERE next_event_id = e.id AND profile_id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'
      )
    
    UNION ALL
    
    -- Recursive Member: 연결 체인 추적
    SELECT 
        e.id, 
        e.title, 
        e.category, 
        e.start_date, 
        e.end_date, 
        es.next_event_id,
        cp.step_level + 1 AS step_level
    FROM public.events e
    JOIN career_path cp ON cp.next_event_id = e.id
    LEFT JOIN public.event_sequences es ON e.id = es.previous_event_id
    WHERE e.profile_id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'
)
SELECT step_level, title, category, start_date, end_date
FROM career_path
ORDER BY step_level ASC;


-- 4. 로드맵 통계 집계 (Event Edges 갱신용 배치 쿼리 예시)
-- 사용자들이 작성한 개인 Sequence 흐름을 기반으로, 표준 이벤트 전이 빈도(SQLD -> 인턴)를 실시간 집계
SELECT 
    prev_se.id AS from_standard_event_id,
    next_se.id AS to_standard_event_id,
    COUNT(DISTINCT seq.profile_id) AS user_transition_count
FROM public.event_sequences seq
JOIN public.events prev_e ON seq.previous_event_id = prev_e.id
JOIN public.events next_e ON seq.next_event_id = next_e.id
JOIN public.standard_events prev_se ON prev_e.standard_event_id = prev_se.id
JOIN public.standard_events next_se ON next_e.standard_event_id = next_se.id
GROUP BY prev_se.id, next_se.id;


-- 5. 검색 쿼리 예시
-- 5.1 Full Text Search (FTS)를 이용한 이벤트 검색 (예: '알고리즘' 또는 '자료구조' 포함 검색)
SELECT id, title, description, category
FROM public.events
WHERE to_tsvector('simple', title || ' ' || coalesce(description, '')) @@ to_tsquery('simple', '알고리즘 | 자료구조')
  AND deleted_at IS NULL;

-- 5.2 pg_trgm 활용 기술스택 퍼지 매칭 검색 (사용자 오타/일부 철자 지원: 'React' 검색)
SELECT id, name, category
FROM public.skills
WHERE name ILIKE '%Reac%'
ORDER BY similarity(name, 'React') DESC;

-- 5.3 GIN Index를 이용한 JSONB 내부 속성 고속 검색 (예: 한국데이터산업진흥원에서 발급한 자격증 이벤트 찾기)
SELECT id, title, attributes->>'issue_organization' AS publisher
FROM public.events
WHERE attributes @> '{"issue_organization": "한국데이터산업진흥원"}'::jsonb
  AND deleted_at IS NULL;


-- 6. 캐시 데이터 적재 및 조회
-- 6.1 특정 직무(예: 백엔드 개발자)의 완성된 Organic Tree 로드맵 JSON 캐시 삽입/갱신
INSERT INTO public.roadmap_cache (job_id, tree_data, version, generated_at)
VALUES (
    '018f4b50-1234-7000-8000-000000000001',
    '{
        "nodes": [
            {"id": "node-1", "title": "알고리즘 기초", "type": "study"},
            {"id": "node-2", "title": "SQLD 자격증", "type": "qualification"},
            {"id": "node-3", "title": "스프링 웹개발", "type": "core_skill"}
        ],
        "edges": [
            {"from": "node-1", "to": "node-2", "count": 648, "weight": 4.5},
            {"from": "node-2", "to": "node-3", "count": 320, "weight": 3.8}
        ]
    }'::jsonb,
    1,
    NOW()
)
ON CONFLICT (job_id) DO UPDATE 
SET tree_data = EXCLUDED.tree_data,
    version = roadmap_cache.version + 1,
    generated_at = NOW();

-- 6.2 Organic Tree 렌더링을 위한 직무 캐시 즉시 단건 조회 (초고속 캐싱 조회)
SELECT tree_data 
FROM public.roadmap_cache 
WHERE job_id = '018f4b50-1234-7000-8000-000000000001';
