'use client';

import React, { useMemo, useEffect } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

import CareerNode from './CareerNode';
import CareerEdge from './CareerEdge';
import { useUIStateStore } from '@/store/uiStateStore';

const nodeTypes = {
  careerNode: CareerNode,
};

const edgeTypes = {
  careerEdge: CareerEdge,
};

// Dagre Layout을 이용해 수직 방향 계층형 트리 정렬 진행
const getLayoutedElements = (nodes: any[], edges: any[]) => {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', nodesep: 130, ranksep: 100 });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => {
    g.setNode(node.id, { width: 220, height: 80 });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return {
    nodes: nodes.map((node) => {
      const nodeWithPosition = g.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 110,
          y: nodeWithPosition.y - 40,
        },
      };
    }),
    edges,
  };
};

interface RoadmapCanvasProps {
  treeData: {
    nodes: any[];
    edges: any[];
  };
  myEvents?: any[];
  mySequences?: any[];
}

export default function RoadmapCanvas({ treeData, myEvents = [], mySequences = [] }: RoadmapCanvasProps) {
  const { showMyCareerOverlay, hoveredEdge } = useUIStateStore();

  const processedData = useMemo(() => {
    // 1. 내 커리어 정보를 Overlay(주황색)할지 여부에 따라 상태 추가 설정
    let rawNodes = [...treeData.nodes];
    let rawEdges = [...treeData.edges];

    if (showMyCareerOverlay && myEvents.length > 0) {
      // 내 이벤트 타이틀 매핑
      const myTitles = new Set(myEvents.map((e) => e.title));
      rawNodes = rawNodes.map((node) => {
        if (myTitles.has(node.data?.label)) {
          return {
            ...node,
            data: { ...node.data, isMyPath: true },
          };
        }
        return node;
      });

      // 내 sequence 이전/다음 맵핑
      const myPairs = new Set(
        mySequences.map((seq) => {
          const prev = myEvents.find((e) => e.id === seq.previous_event_id)?.title;
          const next = myEvents.find((e) => e.id === seq.next_event_id)?.title;
          return `${prev}->${next}`;
        })
      );

      rawEdges = rawEdges.map((edge) => {
        const sourceLabel = rawNodes.find((n) => n.id === edge.source)?.data?.label;
        const targetLabel = rawNodes.find((n) => n.id === edge.target)?.data?.label;
        if (myPairs.has(`${sourceLabel}->${targetLabel}`)) {
          return {
            ...edge,
            data: { ...edge.data, isMyPath: true },
          };
        }
        return edge;
      });
    }

    return getLayoutedElements(rawNodes, rawEdges);
  }, [treeData, myEvents, mySequences, showMyCareerOverlay]);

  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);

  useEffect(() => {
    setNodes(processedData.nodes);
    setEdges(processedData.edges);
  }, [processedData, setNodes, setEdges]);

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#ebdcc8" gap={20} size={1} />
        <Controls className="!bg-[#fcfaf7] !border-[#e8dfd5] !rounded-xl !shadow-md" />
      </ReactFlow>

      {/* 실시간 플로팅 Edge Hover 정보 패널 */}
      {hoveredEdge && (
        <div
          className="absolute bg-[#4a3e3d] text-[#fcfaf7] px-4 py-3 rounded-2xl shadow-xl z-50 text-xs flex flex-col gap-1 pointer-events-none"
          style={{
            left: hoveredEdge.x + 30,
            top: hoveredEdge.y - 40,
          }}
        >
          <div className="font-bold text-[#5ddc72]">{hoveredEdge.label}</div>
          <div>👥 <span className="font-semibold text-white">{hoveredEdge.count}</span>명 선택</div>
          <div>⏱️ 평균 이동 기간: <span className="font-semibold text-white">{hoveredEdge.days}</span>개월</div>
        </div>
      )}
    </div>
  );
}
