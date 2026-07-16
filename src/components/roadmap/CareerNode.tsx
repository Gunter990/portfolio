'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';

import { useUIStateStore } from '@/store/uiStateStore';

interface CareerNodeProps {
  data: {
    label: string;
    category: string;
    isMyPath?: boolean;
    isRoot?: boolean;
  };
}

export default function CareerNode({ data }: CareerNodeProps) {
  const isRoot = data.isRoot || data.category === 'root';
  const { setSelectedEdge, setIsDrawerOpen } = useUIStateStore();

  if (isRoot) {
    return (
      <div className="relative shadow-md rounded-2xl border border-[#e8dfd5] bg-[#fcfaf7] px-6 py-3.5 text-center min-w-[200px]">
        <div className="text-xs uppercase tracking-wider font-semibold text-[#f28c28]">START JOB</div>
        <div className="font-bold text-[#4a3e3d] text-base mt-0.5">{data.label}</div>
        <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-[#f28c28]" />
      </div>
    );
  }

  // 일반 이벤트/기술 노드: 선 중간의 점(dot) 표시 및 그 옆에 텍스트 배치
  return (
    <div
      onClick={() => {
        setSelectedEdge({
          sourceId: data.label,
          targetId: data.label,
          sourceLabel: data.label,
          targetLabel: data.label,
        });
        setIsDrawerOpen(true);
      }}
      className="relative flex items-center gap-3 py-1 px-2 select-none group cursor-pointer"
    >
      <Handle type="target" position={Position.Top} className="!opacity-0 !w-0 !h-0" />
      
      {/* 둥근 도트(Dot) */}
      <div
        className={`w-3.5 h-3.5 rounded-full border-2 transition-transform duration-300 group-hover:scale-125 ${
          data.isMyPath
            ? 'bg-[#f28c28] border-[#f28c28] shadow-[0_0_8px_rgba(242,140,40,0.6)]'
            : 'bg-[#f9f4ee] border-[#bfbfbf] group-hover:border-[#5ddc72]'
        }`}
      />

      {/* 우측 기술명/이벤트명 */}
      <div className="flex flex-col items-start">
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
            data.category === 'certificate'
              ? 'bg-[#eef3f7] text-[#4f6f8f]'
              : data.category === 'project'
              ? 'bg-[#f7edf5] text-[#9b5190]'
              : 'bg-[#eef8f0] text-[#488e53]'
          }`}
        >
          {data.category.toUpperCase()}
        </span>
        <span className={`text-sm font-semibold mt-0.5 ${data.isMyPath ? 'text-[#f28c28]' : 'text-[#4a3e3d] group-hover:text-black'}`}>
          {data.label}
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!opacity-0 !w-0 !h-0" />
    </div>
  );
}
