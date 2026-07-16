'use client';

import React, { useState } from 'react';
import { Drawer } from 'vaul';
import { X, ExternalLink, GraduationCap, Award, Briefcase, Code, Bookmark } from 'lucide-react';
import { useUIStateStore } from '@/store/uiStateStore';
import PortfolioPreview from './PortfolioPreview';

export default function CareerPathDrawer() {
  const { isDrawerOpen, setIsDrawerOpen, selectedEdge } = useUIStateStore();

  // 목업 사용자 리스트 데이터 정의
  const mockUsers = [
    {
      profileId: 'u1',
      nickname: '김서연 (Backend Developer)',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      bio: '5년차 백엔드 시니어 개발자입니다. 대용량 분산 캐싱 처리에 흥미가 있습니다.',
      portfolio: {
        skills: ['Spring Boot', 'Next.js', 'PostgreSQL', 'Redis'],
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
      profileId: 'u2',
      nickname: '박도현 (Java Specialist)',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      bio: 'Java와 Spring 프레임워크 기반의 엔터프라이즈 솔루션 개발을 전문으로 합니다.',
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
    }
  ];

  const [activeUser, setActiveUser] = useState<typeof mockUsers[0] | null>(null);

  return (
    <Drawer.Root
      open={isDrawerOpen}
      onOpenChange={(open) => {
        setIsDrawerOpen(open);
        if (!open) setActiveUser(null);
      }}
      direction="right"
    >
      <Drawer.Portal>
        {/* 블러 오버레이 */}
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-all duration-300" />
        
        {/* 서브 패널 Drawer 콘텐츠 (Desktop: 우측 고정, Mobile: Bottom Sheet 형태로 하단 고정) */}
        <Drawer.Content className="fixed right-0 top-0 bottom-0 z-50 flex flex-col w-full md:w-[480px] bg-[#fcfaf7] border-l border-[#e8dfd5] shadow-2xl focus:outline-none">
          
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#f2ebe1]">
            <div>
              <Drawer.Title className="text-base font-bold text-[#4a3e3d]">
                선택한 커리어 패스 이력
              </Drawer.Title>
              <Drawer.Description className="text-xs text-[#8c7b6e] mt-1">
                이 경로를 거쳐간 사용자 포트폴리오를 탐색하세요.
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
                  onClick={() => setActiveUser(null)}
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
                    onClick={() => setActiveUser(user)}
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
