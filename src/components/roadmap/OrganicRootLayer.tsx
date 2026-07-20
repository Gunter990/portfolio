'use client';

import React, { useMemo } from 'react';
import { useNodes, useEdges, useStore } from '@xyflow/react';
import { useUIStateStore } from '@/store/uiStateStore';

  const getSway = (y: number) => Math.sin(y * 0.015) * 15;

  const getBaseX = (x1: number, y1: number, x2: number, y2: number, y: number) => {
    if (y <= y1) return x1 - getSway(y1);
    if (y >= y2) return x2 - getSway(y2);
    const t = (y - y1) / (y2 - y1);
    const smoothT = t * t * (3 - 2 * t);
    const b1 = x1 - getSway(y1);
    const b2 = x2 - getSway(y2);
    return b1 + (b2 - b1) * smoothT;
  };

  const generatePathSegment = (x1: number, y1: number, x2: number, y2: number, startY: number, endY: number, omitM = false) => {
    const steps = Math.max(5, Math.floor(Math.abs(endY - startY) / 5));
    let path = '';
    for (let i = 0; i <= steps; i++) {
      const currY = startY + (endY - startY) * (i / steps);
      const bx = getBaseX(x1, y1, x2, y2, currY);
      const currX = bx + getSway(currY);
      if (i === 0 && !omitM) {
        path += `M ${currX.toFixed(2)} ${currY.toFixed(2)}`;
      } else {
        path += ` L ${currX.toFixed(2)} ${currY.toFixed(2)}`;
      }
    }
    return path;
  };

export default function OrganicRootLayer() {
  const nodes = useNodes();
  const edges = useEdges();
  const transform = useStore((s) => s.transform); // [x, y, zoom]
  const { setHoveredEdge, setSelectedEdge, setIsDrawerOpen } = useUIStateStore();

  // 노드 ID를 기반으로 노드 객체를 빠르게 찾기 위한 맵
  const nodeMap = useMemo(() => {
    const map = new Map();
    nodes.forEach((n) => {
      const isRoot = n.data?.isRoot;
      const w = n.measured?.width || n.width || (isRoot ? 240 : 40);
      const h = n.measured?.height || n.height || (isRoot ? 80 : 40);
      map.set(n.id, {
        cx: n.position.x + (isRoot ? w / 2 : 10),
        cy: n.position.y + (isRoot ? (h - 10) : 10), // Root는 아래쪽 도트 위치, 일반은 왼쪽 도트 위치
        ...n
      });
    });
    return map;
  }, [nodes]);

  // 전체 트리를 분석하여 루트부터 리프까지 이어지는 단일 SVG Path(Taproot)들을 생성
  const paths = useMemo(() => {
    if (nodeMap.size === 0 || edges.length === 0) return [];

    const adjacencyList: Record<string, typeof edges> = {};
    const incomingCount: Record<string, number> = {};
    
    edges.forEach(e => {
      if (!adjacencyList[e.source]) adjacencyList[e.source] = [];
      adjacencyList[e.source].push(e);
      incomingCount[e.target] = (incomingCount[e.target] || 0) + 1;
    });

    const rootNodes = nodes.filter(n => !incomingCount[n.id]);
    
    // 각 노드별 메인 자식(Main Trunk 방향) 결정 - weight가 가장 높은 간선을 메인으로 취급
    const mainChildMap: Record<string, any> = {};
    Object.keys(adjacencyList).forEach(sourceId => {
      const outEdges = adjacencyList[sourceId];
      if (outEdges.length > 0) {
        mainChildMap[sourceId] = outEdges.reduce((prev, curr) => {
          const wPrev = (prev.data?.weight as number) || 0;
          const wCurr = (curr.data?.weight as number) || 0;
          return wPrev >= wCurr ? prev : curr;
        });
      }
    });

    const routes: (typeof edges)[] = [];
    const dfs = (nodeId: string, currentRoute: typeof edges) => {
      const outEdges = adjacencyList[nodeId] || [];
      if (outEdges.length === 0) {
        if (currentRoute.length > 0) routes.push([...currentRoute]);
        return;
      }
      for (const edge of outEdges) {
        currentRoute.push(edge);
        dfs(edge.target, currentRoute);
        currentRoute.pop();
      }
    };

    rootNodes.forEach(rn => dfs(rn.id, []));

    return routes.map((route, idx) => {
      const rootNode = nodeMap.get(route[0].source);
      let d = `M ${(rootNode.cx).toFixed(2)} ${(rootNode.cy).toFixed(2)}`;
      
      let totalWeight = 0;
      let totalDays = 0;
      let isMyPath = false;

      for (const edge of route) {
        const U = nodeMap.get(edge.source);
        const V = nodeMap.get(edge.target);
        if (!U || !V) continue;

        totalWeight += (edge.data?.weight as number) || 1;
        totalDays += (edge.data?.avgTransitionDays as number) || 0;
        if (edge.data?.isMyPath) isMyPath = true;

        const mainEdge = mainChildMap[U.id];
        
        if (edge.id === mainEdge.id) {
          // 메인 줄기: U -> V 로 직선 보간(Sway 포함)
          d += generatePathSegment(U.cx, U.cy, V.cx, V.cy, U.cy, V.cy, true);
        } else {
          // 잔가지(Branch): 메인 줄기를 타고 내려가다 중간(splitY)에서 뻗어나옴 (Sprouting)
          const M = nodeMap.get(mainEdge.target);
          if (M) {
            // 루트 노드(직무창) 아래에서 뻗어나올 때는 즉시 도트에서 분기(splitY = U.cy)
            // 일반 노드는 70% 지점에서 분기
            const isRootU = U.data?.isRoot;
            const splitY = isRootU ? U.cy : U.cy + (V.cy - U.cy) * 0.7;
            
            // 1. Trunk 구간 (U -> splitY)
            if (!isRootU) {
              d += generatePathSegment(U.cx, U.cy, M.cx, M.cy, U.cy, splitY, true);
            }
            // 2. Branch 구간 (splitY -> V)
            const trunkBaseXAtSplit = getBaseX(U.cx, U.cy, M.cx, M.cy, splitY);
            const trunkXAtSplit = trunkBaseXAtSplit + getSway(splitY);
            d += generatePathSegment(trunkXAtSplit, splitY, V.cx, V.cy, splitY, V.cy, true);
          }
        }
      }

      const leafNode = nodeMap.get(route[route.length - 1].target);

      return {
        id: `route-${idx}`,
        d,
        route,
        rootLabel: rootNode?.data?.label,
        leafLabel: leafNode?.data?.label,
        avgWeight: totalWeight / route.length,
        totalDays,
        isMyPath,
        leafNode
      };
    });
  }, [nodeMap, edges]);

  const [tx, ty, zoom] = transform;

  return (
    <svg 
      className="absolute top-0 left-0 w-full h-full pointer-events-none" 
      style={{ zIndex: 0 }} 
    >
      <g transform={`translate(${tx}, ${ty}) scale(${zoom})`}>
        {paths.map(pathInfo => {
          const baseWidth = Math.min(Math.max(pathInfo.avgWeight * 1.5, 3), 10);
          let edgeColor = pathInfo.isMyPath ? '#F28C28' : '#5DDC72';
          
          return (
            <path
              key={pathInfo.id}
              d={pathInfo.d}
              fill="none"
              stroke={edgeColor}
              strokeWidth={baseWidth}
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{ pointerEvents: 'stroke' }}
              className="transition-all duration-300 cursor-pointer hover:stroke-[#3da34f] hover:stroke-[12px] opacity-80 hover:opacity-100"
              onMouseEnter={(e) => {
                setHoveredEdge({
                  id: pathInfo.id,
                  source: pathInfo.route[0].source,
                  target: pathInfo.route[pathInfo.route.length - 1].target,
                  label: `${pathInfo.rootLabel} → ${pathInfo.leafLabel}`,
                  count: 0,
                  days: parseFloat((pathInfo.totalDays / 30.4).toFixed(1)),
                  x: pathInfo.leafNode?.cx || 0,
                  y: pathInfo.leafNode?.cy || 0,
                });
                (e.target as SVGPathElement).style.stroke = pathInfo.isMyPath ? '#c46b12' : '#3da34f';
              }}
              onMouseLeave={(e) => {
                setHoveredEdge(null);
                (e.target as SVGPathElement).style.stroke = edgeColor;
              }}
              onClick={() => {
                setSelectedEdge({
                  sourceId: pathInfo.route[0].source,
                  targetId: pathInfo.route[pathInfo.route.length - 1].target,
                  sourceLabel: pathInfo.rootLabel,
                  targetLabel: pathInfo.leafLabel,
                });
                setIsDrawerOpen(true);
              }}
            />
          );
        })}
      </g>
    </svg>
  );
}
