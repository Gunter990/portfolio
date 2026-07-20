const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local in project root
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local file not found. Please set it up first.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
  console.log('Seeding Supabase database with mock jobs and roadmap cache...');

  // 1. Insert Jobs
  const { data: jobData, error: jobError } = await supabase
    .from('jobs')
    .upsert([
      {
        id: '018f4b50-1234-7000-8000-000000000001',
        title: '백엔드 개발자',
        industry: 'IT',
        description: '서버 백엔드 시스템 및 API 개발 설계 담당',
        search_tags: '백엔드,서버,java,개발,backend',
        display_order: 1
      },
      {
        id: '018f4b50-1234-7000-8000-000000000002',
        title: 'DevOps 엔지니어',
        industry: 'IT',
        description: '클라우드 인프라 및 CI/CD 자동화 환경 구축',
        search_tags: '데브옵스,클라우드,인프라,서버,devops,aws',
        display_order: 2
      },
      {
        id: '018f4b50-1234-7000-8000-000000000003',
        title: '퍼포먼스 마케터',
        industry: 'Marketing',
        description: '데이터 기반 광고 매체 운영 및 효율 최적화',
        search_tags: '마케팅,마케터,광고,퍼포먼스,데이터,marketing',
        display_order: 3
      },
      {
        id: '018f4b50-1234-7000-8000-000000000004',
        title: 'UI/UX 디자이너',
        industry: 'Design',
        description: '웹/앱 제품 디자인 및 사용자 경험 설계',
        search_tags: '디자인,디자이너,ui,ux,figma,프론트',
        display_order: 4
      },
      {
        id: '018f4b50-1234-7000-8000-000000000005',
        title: '공인회계사 (CPA)',
        industry: 'Finance',
        description: '기업 회계 감사 및 세무/재무 컨설팅',
        search_tags: '회계,회계사,cpa,세무,재무,금융,감사',
        display_order: 5
      }
    ], { onConflict: 'id' });

  if (jobError) {
    console.error('Error seeding jobs:', jobError);
    return;
  }
  console.log('Successfully seeded jobs.');

  // 2. Insert Roadmap Cache with 3 different routes (CS Major, Bootcamp, Node.js)
  const mockTreeData = {
    nodes: [
      // Route A: CS Major Route
      { id: 'node-1', title: '컴퓨터공학과 전공 수업 수강', type: 'study' },
      { id: 'node-2', title: '자료구조 및 알고리즘 마스터', type: 'study' },
      { id: 'node-3', title: '자바 스프링 백엔드 개인 프로젝트', type: 'core_skill' },
      { id: 'node-4', title: '대기업 IT 플랫폼 인턴십', type: 'internship' },
      
      // Route B: Non-CS / Bootcamp Route
      { id: 'node-6', title: '비전공자 프로그래밍 기초 학습', type: 'study' },
      { id: 'node-7', title: '웹 풀스택 부트캠프 집중 과정 수료', type: 'study' },
      { id: 'node-8', title: 'SQLD 자격증 취득', type: 'qualification' },
      { id: 'node-9', title: '스타트업 외주 및 협업 프로젝트 수행', type: 'core_skill' },
      
      // Route C: Node.js / JavaScript Route
      { id: 'node-10', title: '웹 프론트엔드 기본기 (HTML/CSS/JS)', type: 'study' },
      { id: 'node-11', title: 'Node.js & Express 서버 프레임워크 학습', type: 'study' },
      { id: 'node-12', title: 'React & Node.js 협업 토이 프로젝트', type: 'core_skill' },
      
      // Common Target Node (All routes merge here)
      { id: 'node-5', title: '백엔드 신입 개발자 최종 취업', type: 'career' }
    ],
    edges: [
      // Route A connections
      { from: 'node-1', to: 'node-2', count: 648, weight: 4.5 },
      { from: 'node-2', to: 'node-3', count: 420, weight: 4.0 },
      { from: 'node-3', to: 'node-4', count: 215, weight: 4.2 },
      { from: 'node-4', to: 'node-5', count: 180, weight: 4.8 },
      
      // Route B connections
      { from: 'node-6', to: 'node-7', count: 320, weight: 4.2 },
      { from: 'node-7', to: 'node-8', count: 280, weight: 3.9 },
      { from: 'node-8', to: 'node-9', count: 195, weight: 4.1 },
      { from: 'node-9', to: 'node-5', count: 110, weight: 4.5 },
      
      // Route C connections
      { from: 'node-10', to: 'node-11', count: 250, weight: 4.0 },
      { from: 'node-11', to: 'node-12', count: 180, weight: 4.3 },
      { from: 'node-12', to: 'node-5', count: 95, weight: 4.6 }
    ]
  };

  const { data: cacheData, error: cacheError } = await supabase
    .from('roadmap_cache')
    .upsert([
      {
        job_id: '018f4b50-1234-7000-8000-000000000001',
        tree_data: mockTreeData,
        version: 1,
        generated_at: new Date().toISOString()
      }
    ], { onConflict: 'job_id' });

  if (cacheError) {
    console.error('Error seeding roadmap cache:', cacheError);
    return;
  }
  console.log('Successfully seeded roadmap cache.');
  console.log('Seed completed successfully!');
}

seed();
