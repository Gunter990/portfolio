'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Job } from '@/types';
import JobSearchBar from '@/components/roadmap/JobSearchBar';
import StarredJobBar from '@/components/roadmap/StarredJobBar';
import RoadmapCanvas from '@/components/roadmap/RoadmapCanvas';
import CareerPathDrawer from '@/components/roadmap/CareerPathDrawer';
import { useUIStateStore } from '@/store/uiStateStore';

export default function RoadmapPageContent() {
  const { selectedJobId, showMyCareerOverlay, setShowMyCareerOverlay } = useUIStateStore();

  // 즐겨찾기 상태
  const [starredIds, setStarredIds] = useState<string[]>([]);
  const [starredJobs, setStarredJobs] = useState<Job[]>([]);

  // 특정 직무의 트리 캐시 상태
  const [treeData, setTreeData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  
  // 내 로드맵 데이터 (Overlay용)
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [mySequences, setMySequences] = useState<any[]>([]);

  // 튜토리얼 툴팁 숨김 상태
  const [hideTutorialTip, setHideTutorialTip] = useState(false);

  // 1. LocalStorage 기반 즐겨찾기 동기화
  useEffect(() => {
    const saved = localStorage.getItem('starred_jobs');
    if (saved) {
      try {
        setStarredIds(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // 즐겨찾기 목록 상세 조회
  useEffect(() => {
    if (starredIds.length === 0) {
      setStarredJobs([]);
      return;
    }
    const fetchStarredJobs = async () => {
      const { data } = await supabase
        .from('jobs')
        .select('*')
        .in('id', starredIds);
      if (data) {
        // 정렬 우선순위 복원
        const ordered = starredIds
          .map((id) => data.find((j) => j.id === id))
          .filter(Boolean) as Job[];
        setStarredJobs(ordered);
      }
    };
    fetchStarredJobs();
  }, [starredIds]);

  const toggleStar = (id: string) => {
    const next = starredIds.includes(id)
      ? starredIds.filter((x) => x !== id)
      : [...starredIds, id];
    setStarredIds(next);
    localStorage.setItem('starred_jobs', JSON.stringify(next));
  };

  // 2. 선택한 직업에 따른 로드맵 캐시 조회
  useEffect(() => {
    if (!selectedJobId) return;
    const fetchRoadmap = async () => {
      const { data, error } = await supabase
        .from('roadmap_cache')
        .select('tree_data')
        .eq('job_id', selectedJobId)
        .single();

      if (!error && data && data.tree_data) {
        const rawTree = data.tree_data as any;
        // 현재 활성화된 직업(Job)의 한글 타이틀 가져오기
        const { data: jobData } = await supabase
          .from('jobs')
          .select('title')
          .eq('id', selectedJobId)
          .single();
        const activeJobTitle = jobData?.title || '백엔드 개발자';

        // 루트 노드(최종 목표) 찾기: DB edges에서 from에 존재하지 않는(나가는 간선이 없는) 노드
        const fromSet = new Set((rawTree.edges || []).map((e: any) => e.from));
        const rootNodeId = (rawTree.nodes || []).find((n: any) => !fromSet.has(n.id))?.id || (rawTree.nodes?.[0]?.id);

        // React Flow 포맷 노드 변환
        const mappedNodes = (rawTree.nodes || []).map((n: any) => {
          const isRoot = n.id === rootNodeId;
          return {
            id: n.id,
            type: 'careerNode',
            // Top Node는 root로 표기하며 현재 검색된 직업군명을 할당
            data: {
              label: isRoot ? activeJobTitle : n.title,
              category: n.type || 'core_skill',
              isRoot: isRoot,
            },
            position: { x: 0, y: 0 }, // Dagre가 자동 배치함
          };
        });

        // React Flow 포맷 에지 변환 (뿌리가 위에서 뻗어나가도록 방향을 역전시킴)
        const mappedEdges = (rawTree.edges || []).map((e: any) => ({
          id: `edge-${e.to}-${e.from}`,
          source: e.to,   // 목표(직무)가 시작점(Top)이 됨
          target: e.from, // 선행학습이 도착점(Bottom)이 됨
          type: 'careerEdge',
          data: {
            weight: e.weight || 1.0,
            connectionCount: e.count || 0,
            avgTransitionDays: e.avg_transition_days || 60,
          },
        }));

        setTreeData({ nodes: mappedNodes, edges: mappedEdges });
      } else {
        // 데이터가 없거나 에러 발생 시 폴백
        setTreeData({
          nodes: [
            { id: '1', type: 'careerNode', data: { label: '직무 정보를 불러오는 중입니다...', category: 'study', isRoot: true }, position: { x: 0, y: 0 } }
          ],
          edges: []
        });
      }
    };
    fetchRoadmap();
  }, [selectedJobId]);

  // 3. 내 커리어 데이터 조회 (Mock Profile 연동)
  useEffect(() => {
    const fetchMyCareer = async () => {
      const testUserId = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'; // queries.sql의 테스트 유저 ID 매핑
      
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('profile_id', testUserId);

      const { data: sequences } = await supabase
        .from('event_sequences')
        .select('*')
        .eq('profile_id', testUserId);

      if (events) setMyEvents(events);
      if (sequences) setMySequences(sequences);
    };
    fetchMyCareer();
  }, []);

  return (
    <div 
      className="flex flex-col w-screen h-screen bg-[#f9f4ee] overflow-hidden"
      onClick={() => {
        if (!hideTutorialTip) setHideTutorialTip(true);
      }}
    >
      {/* 최상단 헤더 */}
      <header className="flex flex-col md:flex-row md:items-center justify-between px-8 py-5 border-b border-[#e8dfd5] bg-[#fcfaf7] z-40 gap-4">
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-[#4a3e3d] tracking-tight">CAREER ROADMAP</h1>
          <p className="text-xs text-[#8c7b6e] mt-1 font-medium">커뮤니티 실제 경로 기반 오가닉 커리어 로드맵</p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* 내 커리어 오버레이 스위치 */}
          <button
            onClick={() => setShowMyCareerOverlay(!showMyCareerOverlay)}
            className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm border ${
              showMyCareerOverlay
                ? 'bg-[#f28c28] text-white border-[#f28c28]'
                : 'bg-white text-[#4a3e3d] border-[#e8dfd5] hover:bg-[#f5ece1]'
            }`}
          >
            {showMyCareerOverlay ? '🍊 내 커리어 Overlay 활성화됨' : '🔍 내 커리어 Overlay 켜기'}
          </button>

          <JobSearchBar starredIds={starredIds} toggleStar={toggleStar} />
        </div>
      </header>

      {/* 즐겨찾기 고정바 */}
      <div className="px-8 py-3 bg-[#fcfaf7]/50 border-b border-[#e8dfd5]/60 z-30">
        <StarredJobBar starredJobs={starredJobs} setStarredIds={setStarredIds} toggleStar={toggleStar} />
      </div>

      {/* 메인 로드맵 영역 */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        <RoadmapCanvas 
          treeData={selectedJobId ? treeData : tutorialTreeData} 
          myEvents={myEvents} 
          mySequences={mySequences} 
        />
        {!selectedJobId && (
          <div 
            className={`absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-md px-6 py-3 rounded-full border border-[#f28c28]/30 shadow-lg text-center transition-opacity duration-1000 pointer-events-none ${
              hideTutorialTip ? 'opacity-0' : 'opacity-100 animate-bounce'
            }`}
          >
            <p className="text-sm font-bold text-[#4a3e3d]">💡 직접 노드에 마우스를 올리거나 클릭하며 기능을 익혀보세요!</p>
          </div>
        )}
      </main>

      {/* 우측 슬라이드 인 Drawer */}
      <CareerPathDrawer />
    </div>
  );
}

const tutorialTreeData = {
  nodes: [
    { id: 't-root', type: 'careerNode', data: { label: '직업명', category: 'tutorial_root', isRoot: true }, position: { x: 0, y: 0 } },
    { id: 't-1', type: 'careerNode', data: { label: '경험 1', category: 'tutorial' }, position: { x: 0, y: 0 } },
    { id: 't-2', type: 'careerNode', data: { label: '관련 기술', category: 'tutorial' }, position: { x: 0, y: 0 } },
    { id: 't-3', type: 'careerNode', data: { label: '경험 2', category: 'tutorial' }, position: { x: 0, y: 0 } },
    { id: 't-4', type: 'careerNode', data: { label: '심화 과정', category: 'tutorial' }, position: { x: 0, y: 0 } },
  ],
  edges: [
    { id: 'e-t1', source: 't-root', target: 't-1', type: 'careerEdge', data: { weight: 3, connectionCount: 100 } },
    { id: 'e-t2', source: 't-1', target: 't-2', type: 'careerEdge', data: { weight: 2, connectionCount: 60 } },
    { id: 'e-t3', source: 't-root', target: 't-3', type: 'careerEdge', data: { weight: 1.5, connectionCount: 40 } },
    { id: 'e-t4', source: 't-3', target: 't-4', type: 'careerEdge', data: { weight: 1, connectionCount: 20 } },
  ]
};
