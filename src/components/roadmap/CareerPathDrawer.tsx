'use client';

import React, { useState } from 'react';
import { Drawer } from 'vaul';
import { X, ExternalLink, GraduationCap, Award, Briefcase, Code, Bookmark } from 'lucide-react';
import { useUIStateStore } from '@/store/uiStateStore';
import PortfolioPreview from './PortfolioPreview';

export default function CareerPathDrawer() {
  const { isDrawerOpen, setIsDrawerOpen, selectedEdge, selectedJobId } = useUIStateStore();
  const { selectedProfileId, setSelectedProfileId } = useUIStateStore();

  const currentJobId = selectedJobId || '018f4b50-1234-7000-8000-000000000001';
  let mockUsers = mockUsersByJob[currentJobId] || mockUsersByJob['018f4b50-1234-7000-8000-000000000001'];

  if (currentJobId === '018f4b50-1234-7000-8000-000000000001' && selectedEdge) {
    const sId = selectedEdge.sourceId;
    const tId = selectedEdge.targetId;

    const sMatch = sId.match(/node-(\d+)/);
    const tMatch = tId.match(/node-(\d+)/);
    
    let isRouteA = false;
    let isRouteB = false;
    let isRouteC = false;

    if (sMatch) {
      const sNum = parseInt(sMatch[1], 10);
      if (sNum >= 1 && sNum <= 4) isRouteA = true;
      if (sNum >= 6 && sNum <= 9) isRouteB = true;
      if (sNum >= 10 && sNum <= 12) isRouteC = true;
    }
    if (tMatch) {
      const tNum = parseInt(tMatch[1], 10);
      if (tNum >= 1 && tNum <= 4) isRouteA = true;
      if (tNum >= 6 && tNum <= 9) isRouteB = true;
      if (tNum >= 10 && tNum <= 12) isRouteC = true;
    }

    if (isRouteA) {
      // CS 전공 / Java 스프링 루트 (Route A)
      mockUsers = mockUsers.filter(u => u.profileId.endsWith('-be') || u.profileId.endsWith('-be-a'));
    } else if (isRouteB) {
      // 비전공 / 부트캠프 루트 (Route B)
      mockUsers = mockUsers.filter(u => u.profileId.endsWith('-be-b'));
    } else if (isRouteC) {
      // Node.js / JavaScript 루트 (Route C)
      mockUsers = mockUsers.filter(u => u.profileId.endsWith('-be-c'));
    }
  }

  const activeUser = selectedProfileId 
    ? mockUsers.find(u => u.profileId === selectedProfileId) || null
    : null;

  return (
    <Drawer.Root
      open={isDrawerOpen}
      onOpenChange={(open) => {
        setIsDrawerOpen(open);
        if (!open) setSelectedProfileId(null);
      }}
      direction="right"
    >
      <Drawer.Portal>
        {/* 블러 오버레이 */}
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] transition-all duration-300" />
        
        {/* 서브 패널 Drawer 콘텐츠 (Desktop: 우측 고정, Mobile: Bottom Sheet 형태로 하단 고정) */}
        <Drawer.Content className="fixed right-0 top-0 bottom-0 z-[9999] flex flex-col w-full md:w-[480px] bg-[#fcfaf7] border-l border-[#e8dfd5] shadow-2xl focus:outline-none">
          
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#f2ebe1]">
            <div>
              <Drawer.Title className="text-base font-bold text-[#4a3e3d] line-clamp-1">
                {selectedEdge ? `${selectedEdge.sourceLabel} → ${selectedEdge.targetLabel}` : '선택한 커리어 패스 이력'}
              </Drawer.Title>
              <Drawer.Description className="text-xs text-[#8c7b6e] mt-1">
                이 경로를 밟아간 선배들의 포트폴리오를 탐색하세요.
              </Drawer.Description>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 hover:bg-[#f5ece1] rounded-full transition-colors text-[#8c7b6e] hover:text-[#4a3e3d]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeUser ? (
              // Notion Portfolio Preview 모드로 전환
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedProfileId(null)}
                  className="text-xs font-semibold text-[#f28c28] hover:underline mb-2 flex items-center gap-1.5"
                >
                  ← 목록으로 돌아가기
                </button>
                
                {/* 노션 포트폴리오 렌더링 */}
                <PortfolioPreview
                  portfolio={activeUser.portfolio}
                  nickname={activeUser.nickname}
                  avatarUrl={activeUser.avatarUrl}
                  bio={activeUser.bio}
                />
              </div>
            ) : (
              // 사용자 프로필 목록 출력 (Lazy/Virtual List 역할)
              <div className="space-y-3.5">
                {mockUsers.map((user) => (
                  <div
                    key={user.profileId}
                    onClick={() => setSelectedProfileId(user.profileId)}
                    className="flex gap-4 p-4 rounded-2xl bg-[#f5ece1]/40 border border-[#e8dfd5]/60 hover:border-[#f28c28] hover:bg-[#f5ece1] cursor-pointer transition-all duration-200"
                  >
                    <img
                      src={user.avatarUrl}
                      alt={user.nickname}
                      className="w-12 h-12 rounded-full border-2 border-white object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-[#4a3e3d] truncate">{user.nickname}</div>
                      <div className="text-xs text-[#8c7b6e] mt-1 line-clamp-2 leading-relaxed">
                        {user.bio}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {user.portfolio.skills.slice(0, 3).map((s) => (
                          <span key={s} className="bg-white/80 border border-[#e8dfd5] text-[#8c7b6e] text-[10px] px-2 py-0.5 rounded-full">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

// 직무군별 맞춤형 목업 사용자 리스트 데이터 정의
export const mockUsersByJob: Record<string, Array<{
  profileId: string;
  nickname: string;
  avatarUrl: string;
  bio: string;
  portfolio: {
    skills: string[];
    experiences: Array<{ company: string; role: string; startDate: string; endDate: string | null; achievements: string[] }>;
    certificates: Array<{ name: string; date: string }>;
    githubUrl?: string;
    behanceUrl?: string;
  }
}>> = {
  // 1. 백엔드 개발자
  '018f4b50-1234-7000-8000-000000000001': [
    // Route A (CS Major)
    {
      profileId: 'u1-be-a',
      nickname: '김서연 (CS 전공 백엔드 개발자)',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      bio: '컴퓨터공학과 전공 출신 5년차 백엔드 시니어 개발자입니다. 대용량 분산 캐싱 처리에 관심이 많습니다.',
      portfolio: {
        skills: ['Spring Boot', 'Java', 'PostgreSQL', 'Redis'],
        experiences: [
          { company: '토스', role: 'Backend Engineer', startDate: '2023-03', endDate: null, achievements: ['송금 서버 트래픽 40% 개선', 'Spring Cloud 도입'] },
          { company: '네이버', role: 'Java Developer', startDate: '2021-01', endDate: '2023-02', achievements: ['검색 어시스턴트 성능 15% 튜닝'] }
        ],
        certificates: [
          { name: 'SQLD 자격증', date: '2019-07-05' },
          { name: '정보처리기사', date: '2020-03-12' }
        ],
        githubUrl: 'https://github.com/seoyeon-kim'
      }
    },
    {
      profileId: 'u2-be-a',
      nickname: '박도현 (Java Specialist)',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      bio: '정통 컴퓨터공학 학사 수료 후 Java와 Spring 프레임워크 기반의 엔터프라이즈 솔루션 개발을 하고 있습니다.',
      portfolio: {
        skills: ['Java', 'Spring Boot', 'Kubernetes', 'MyBatis'],
        experiences: [
          { company: '카카오', role: 'Platform Engineer', startDate: '2022-05', endDate: null, achievements: ['메시징 시스템 모듈 최적화'] }
        ],
        certificates: [
          { name: 'SQLD 자격증', date: '2020-11-20' }
        ],
        githubUrl: 'https://github.com/dohyun-park'
      }
    },
    // Route B (Bootcamp/Non-CS)
    {
      profileId: 'u3-be-b',
      nickname: '이정우 (비전공자 출신 스프링 개발자)',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      bio: '경영학 비전공자로 시작해 국비 부트캠프를 거쳐 SQLD 취득 후 스타트업 백엔드로 취업에 성공한 2년차 스프링 개발자입니다.',
      portfolio: {
        skills: ['Java', 'Spring Boot', 'SQLD', 'JPA', 'MySQL'],
        experiences: [
          { company: '비바릴리', role: 'Backend Developer', startDate: '2023-08', endDate: null, achievements: ['주문 관리 API 및 어드민 페이지 신규 구축', 'JPA 쿼리 튜닝을 통한 조회 속도 2배 단축'] }
        ],
        certificates: [
          { name: 'SQLD 자격증', date: '2023-03-15' }
        ],
        githubUrl: 'https://github.com/jungwoo-lee'
      }
    },
    // Route C (Node.js)
    {
      profileId: 'u4-be-c',
      nickname: '최민수 (Node.js 풀스택 개발자)',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
      bio: '웹 퍼블리셔로 시작하여 Node.js와 Express 기반의 비동기 백엔드 API 설계에 특화된 풀스택 개발자입니다.',
      portfolio: {
        skills: ['Node.js', 'Express', 'React', 'MongoDB', 'JavaScript'],
        experiences: [
          { company: '어반컴퍼니', role: 'Node.js Developer', startDate: '2023-05', endDate: null, achievements: ['실시간 알림 서버 고도화 (Socket.io)', 'Express 서버 프레임워크 마이그레이션'] }
        ],
        certificates: [
          { name: '웹디자인기능사', date: '2021-06-12' }
        ],
        githubUrl: 'https://github.com/minsu-choi'
      }
    }
  ],
  // 2. DevOps 엔지니어
  '018f4b50-1234-7000-8000-000000000002': [
    {
      profileId: 'u1-do',
      nickname: '이민우 (Cloud/DevOps Engineer)',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      bio: 'AWS 기반의 인프라 자동화 구축 및 쿠버네티스 컨테이너 오케스트레이션 전문가입니다.',
      portfolio: {
        skills: ['Terraform', 'Kubernetes', 'AWS', 'Docker', 'Github Actions'],
        experiences: [
          { company: '라인', role: 'Infrastructure Engineer', startDate: '2022-08', endDate: null, achievements: ['IaC 기반 클라우드 리소스 100% 자동 전환', 'CI/CD 빌드 타임 50% 단축'] }
        ],
        certificates: [
          { name: 'AWS Solutions Architect Professional', date: '2021-04-10' },
          { name: 'CKA (Kubernetes)', date: '2021-09-15' }
        ]
      }
    }
  ],
  // 3. 퍼포먼스 마케터
  '018f4b50-1234-7000-8000-000000000003': [
    {
      profileId: 'u1-pm',
      nickname: '한지민 (Performance Marketer)',
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      bio: '데이터를 분석하여 매체 광고 효율을 극대화하는 4년차 퍼포먼스 마케터입니다.',
      portfolio: {
        skills: ['Google Analytics 4', 'SQL', 'Meta Ads', 'Tableau'],
        experiences: [
          { company: '쿠팡', role: 'Growth Marketer', startDate: '2023-01', endDate: null, achievements: ['신규 카테고리 광고 ROI 240% 달성', 'GA4 기반 사용자 퍼널 행동 분석 대시보드 구축'] }
        ],
        certificates: [
          { name: '검색광고마케터 1급', date: '2021-02-18' },
          { name: 'Google Analytics Individual Qualification', date: '2021-06-25' }
        ]
      }
    }
  ],
  // 4. UI/UX 디자이너
  '018f4b50-1234-7000-8000-000000000004': [
    {
      profileId: 'u1-uiux',
      nickname: '송민지 (UX/UI Designer)',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      bio: '사용자 친화적인 인터페이스와 유기적인 인터랙션을 그리는 제품 디자이너입니다.',
      portfolio: {
        skills: ['Figma', 'Framer', 'Adobe XD', 'Prototyping'],
        experiences: [
          { company: '당근', role: 'Product Designer', startDate: '2022-10', endDate: null, achievements: ['메인 홈 피드 개편 디자인 주도', '디자인 시스템 구축으로 작업 생산성 35% 향상'] }
        ],
        certificates: [
          { name: '시각디자인기사', date: '2020-08-20' }
        ],
        behanceUrl: 'https://behance.net/minji-song'
      }
    }
  ],
  // 5. 공인회계사 (CPA)
  '018f4b50-1234-7000-8000-000000000005': [
    {
      profileId: 'u1-cpa',
      nickname: '정윤호 (Certified Public Accountant)',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
      bio: '기업 감사와 구조조정 세무 컨설팅을 전담하는 공인회계사입니다.',
      portfolio: {
        skills: ['회계감사', '세무자문', '재무제표 분석', '엑셀 모델링'],
        experiences: [
          { company: '삼일회계법인', role: 'Senior Accountant', startDate: '2021-05', endDate: null, achievements: ['대기업 제조사 감사 주총 대응', '해외 자회사 세무 구조 선진화 자문'] }
        ],
        certificates: [
          { name: '공인회계사 (KICPA) 최종 합격', date: '2020-08-28' }
        ]
      }
    }
  ]
};
