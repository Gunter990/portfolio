'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';

import { useUIStateStore } from '@/store/uiStateStore';
import { mockUsersByJob } from './CareerPathDrawer';

interface CareerNodeProps {
  id: string;
  data: {
    label: string;
    category: string;
    isMyPath?: boolean;
    isRoot?: boolean;
  };
}

export default function CareerNode({ id, data }: CareerNodeProps) {
  const isRoot = data.isRoot || data.category === 'root';
  const { setSelectedEdge, setIsDrawerOpen, selectedJobId } = useUIStateStore();
  const elRef = React.useRef<HTMLDivElement>(null);

  if (isRoot) {
    return (
      <div className="relative shadow-md rounded-2xl border border-[#e8dfd5] bg-[#fcfaf7] px-6 py-4.5 text-center min-w-[200px] transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg hover:border-[#5ddc72]/80 cursor-pointer">
        <div className="font-extrabold text-[#4a3e3d] text-lg">{data.label}</div>
        <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !bg-[#f28c28]" />
      </div>
    );
  }

  const currentJobId = selectedJobId || '018f4b50-1234-7000-8000-000000000001';
  let mockUsers = mockUsersByJob[currentJobId] || mockUsersByJob['018f4b50-1234-7000-8000-000000000001'];

  if (currentJobId === '018f4b50-1234-7000-8000-000000000001' && id) {
    const numMatch = id.match(/node-(\d+)/);
    if (numMatch) {
      const num = parseInt(numMatch[1], 10);
      if (num >= 1 && num <= 4) {
        mockUsers = mockUsers.filter(u => u.profileId.endsWith('-be') || u.profileId.endsWith('-be-a'));
      } else if (num >= 6 && num <= 9) {
        mockUsers = mockUsers.filter(u => u.profileId.endsWith('-be-b'));
      } else if (num >= 10 && num <= 12) {
        mockUsers = mockUsers.filter(u => u.profileId.endsWith('-be-c'));
      }
    }
  }

  const isHovered = useUIStateStore((state) => state.hoveredNode)?.label === data.label;

  React.useEffect(() => {
    if (elRef.current) {
      const parentNode = elRef.current.closest('.react-flow__node') as HTMLElement;
      if (parentNode) {
        if (isHovered) {
          parentNode.style.setProperty('z-index', '1000', 'important');
        } else {
          parentNode.style.removeProperty('z-index');
        }
      }
    }
  }, [isHovered]);

  // 일반 이벤트/기술 노드: 선 중간의 점(dot) 표시 및 그 옆에 텍스트 배치
  return (
    <div
      ref={elRef}
      onClick={() => {
        setSelectedEdge({
          sourceId: data.label,
          targetId: data.label,
          sourceLabel: data.label,
          targetLabel: data.label,
        });
        setIsDrawerOpen(true);
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        const width = el.offsetWidth;

        useUIStateStore.getState().setHoveredNode({
          label: data.label,
          category: data.category,
          x: 0,
          y: 0,
          width
        });
      }}
      onMouseLeave={() => {
        useUIStateStore.getState().setHoveredNode(null);
      }}
      className="relative flex flex-row items-center group cursor-pointer"
      style={{ width: 'fit-content' }}
    >
      {/* React Flow가 연결하는 Handles */}
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ top: '10px', left: '10px', transform: 'translate(-50%, -50%)', opacity: 0, width: '10px', height: '10px', pointerEvents: 'none' }} 
      />
      
      {/* 둥근 도트(Dot): 줄기 사이에 원활히 정렬되도록 배치 */}
      <div className="relative w-5 h-5 flex items-center justify-center z-10">
        <div
          className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 z-10 ${
            data.isMyPath
              ? 'bg-[#fcfaf7] border-[#f28c28] shadow-[0_0_12px_rgba(242,140,40,0.5)]'
              : 'bg-[#e8dfd5] border-[#fcfaf7] group-hover:bg-[#5ddc72] group-hover:border-[#5ddc72] group-hover:shadow-[0_0_12px_rgba(93,220,114,0.6)]'
          }`}
        />
        
        {/* 항상 보이는 텍스트 라벨 (호버 시 팝업과 겹치지 않도록 숨김) */}
        <div 
          className={`absolute left-full ml-2 w-[75px] top-1/2 -translate-y-1/2 text-[10px] leading-tight font-bold text-[#4a3e3d] break-keep pointer-events-none transition-opacity duration-200 ${
            isHovered ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {data.label}
        </div>
      </div>

      {/* 노드 내부에 절대좌표(Absolute) 팝업을 직접 삽입하여, 캔버스 줌/이동 시 위치/크기가 함께 동기화되게 처리 (호버 시에만 표시) */}
      {isHovered && (
        <div
          className="absolute left-[calc(100%+16px)] bg-[#fcfaf7] border border-[#e8dfd5] p-3 rounded-2xl shadow-xl z-50 flex flex-col gap-2 w-max animate-in fade-in slide-in-from-left-2 duration-200 pointer-events-auto before:absolute before:content-[''] before:-left-4 before:top-0 before:w-4 before:h-full"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
          onMouseEnter={() => {
            const width = elRef.current?.offsetWidth || 150;
            useUIStateStore.getState().setHoveredNode({
              label: data.label,
              category: data.category,
              x: 0,
              y: 0,
              width
            });
          }}
          onMouseLeave={() => {
            useUIStateStore.getState().setHoveredNode(null);
          }}
        >
          {/* 패널 제목 (카테고리 + 노드 라벨) */}
          <div className="border-b border-[#f2ebe1] pb-2 mb-2">
            <span
              className={`block text-[8px] font-semibold tracking-wider mb-0.5 ${
                data.isMyPath ? 'text-[#f28c28]/70' : 'text-[#b0a295]'
              }`}
            >
              {data.category.toUpperCase()}
            </span>
            <span className={`text-xs font-extrabold whitespace-nowrap ${data.isMyPath ? 'text-[#f28c28]' : 'text-[#4a3e3d]'}`}>
              {data.label}
            </span>
          </div>

          {data.category === 'tutorial' ? (
            <div className="flex items-center justify-center py-3 px-1">
              <span className="text-[10px] font-bold text-[#8c7b6e]">프로필이 나오는 곳</span>
            </div>
          ) : (
            <>
              <div className="text-[10px] font-bold text-[#8c7b6e] mb-1">
                프로필
              </div>
              <div className="flex flex-col gap-2">
                {mockUsers.map((user, idx) => (
                  <div
                    key={user.profileId}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEdge({
                        sourceId: data.label,
                        targetId: data.label,
                        sourceLabel: data.label,
                        targetLabel: data.label,
                      });
                      useUIStateStore.getState().setSelectedProfileId(user.profileId);
                      setIsDrawerOpen(true);
                      useUIStateStore.getState().setHoveredNode(null);
                    }}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#5ddc72]/10 hover:border-[#5ddc72]/30 border border-transparent cursor-pointer transition-colors"
                  >
                    <img src={user.avatarUrl} alt={user.nickname} className="w-6 h-6 rounded-full object-cover border border-[#e8dfd5]" />
                    <div>
                      <div className="text-[11px] font-bold text-[#4a3e3d]">{user.nickname.split(' (')[0]}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-[9px] text-[#b0a295] text-center mt-1">
                * 클릭 시 상세 노션 포트폴리오 열림
              </div>
            </>
          )}
        </div>
      )}

      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ bottom: '10px', left: '10px', transform: 'translate(-50%, 50%)', opacity: 0, width: '10px', height: '10px', pointerEvents: 'none' }} 
      />
    </div>
  );
}
