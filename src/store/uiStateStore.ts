import { create } from 'zustand';

interface UIState {
  selectedJobId: string | null;
  setSelectedJobId: (id: string | null) => void;
  hoveredEdge: { id: string; source: string; target: string; label: string; count: number; days: number; x: number; y: number } | null;
  setHoveredEdge: (edge: UIState['hoveredEdge']) => void;
  selectedEdge: { sourceId: string; targetId: string; sourceLabel: string; targetLabel: string } | null;
  setSelectedEdge: (edge: UIState['selectedEdge']) => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  showMyCareerOverlay: boolean;
  setShowMyCareerOverlay: (show: boolean) => void;
}

export const useUIStateStore = create<UIState>((set) => ({
  selectedJobId: '018f4b50-1234-7000-8000-000000000001', // 초기 백엔드 개발자 ID 기본값 매핑
  setSelectedJobId: (id) => set({ selectedJobId: id }),
  hoveredEdge: null,
  setHoveredEdge: (edge) => set({ hoveredEdge: edge }),
  selectedEdge: null,
  setSelectedEdge: (edge) => set({ selectedEdge: edge }),
  isDrawerOpen: false,
  setIsDrawerOpen: (open) => set({ isDrawerOpen: open }),
  showMyCareerOverlay: false,
  setShowMyCareerOverlay: (show) => set({ showMyCareerOverlay: show }),
}));
