'use client';

import React from 'react';
import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';
import { useUIStateStore } from '@/store/uiStateStore';

export default function CareerEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  // 각 에지가 노드에서 수직으로 만나도록 베지어 곡선을 사용하여, 전체 경로가 끊김 없이 하나의 부드러운 줄기로 보이게 함
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const { hoveredEdge, setHoveredEdge, setSelectedEdge, setIsDrawerOpen } = useUIStateStore();

  const weight = (data?.weight as number) || 1.0;
  const count = (data?.connectionCount as number) || 0;
  const avgDays = (data?.avgTransitionDays as number) || 0;
  const isMyPath = !!data?.isMyPath;

  // 가중치에 대응하는 기본 굵기 계산 (2px ~ 8px)
  const baseWidth = Math.min(Math.max(weight * 1.2, 2), 8);
  const isHovered = hoveredEdge?.id === id;
  const strokeWidth = isHovered ? baseWidth + 3 : baseWidth;

  // 점진적 컬러링 대신 전체가 하나의 줄기처럼 보이도록 단일 색상(연두색)으로 통일
  let edgeColor = '#5DDC72'; // 기본 연두색
  if (isMyPath) {
    edgeColor = '#F28C28';
  }

  // 호버 시 색상을 원래보다 진하게 보정
  if (isHovered) {
    if (isMyPath) {
      edgeColor = '#c46b12'; // 어두운 주황
    } else {
      edgeColor = '#3da34f'; // 진한 초록
    }
  }

  return (
    <>
      {/* 마우스 호버 영역 확장용 투명 에지 */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
        onMouseEnter={(e) => {
          setHoveredEdge({
            id,
            source,
            target,
            label: `Spring → SQLD`, // 목업 라벨 예시
            count,
            days: parseFloat((avgDays / 30.4).toFixed(1)),
            x: labelX,
            y: labelY,
          });
        }}
        onMouseLeave={() => setHoveredEdge(null)}
        onClick={() => {
          setSelectedEdge({
            sourceId: source,
            targetId: target,
            sourceLabel: '이전 단계',
            targetLabel: '다음 단계',
          });
          setIsDrawerOpen(true);
        }}
      />
      
      {/* 실제 렌더링될 베지어 에지 */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: edgeColor,
          strokeWidth,
          transition: 'stroke 0.2s, stroke-width 0.2s',
        }}
      />
    </>
  );
}
