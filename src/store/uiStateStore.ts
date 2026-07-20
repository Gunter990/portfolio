import { create } from 'zustand';

interface UIState {
  selectedJobId: string | null;
  setSelectedJobId: (id: string | null) => void;
  hoveredEdge: { id: string; source: string; target: string; label: string; count: number; days: number; x: number; y: number } | null;
  setHoveredEdge: (edge: UIState['hoveredEdge']) => void;
  hoveredNode: { label: string; category: string; x: number; y: number; width: number } | null;
  setHoveredNode: (node: UIState['hoveredNode']) => void;
  selectedEdge: { sourceId: string; targetId: string; sourceLabel: string; targetLabel: string } | null;
  setSelectedEdge: (edge: UIState['selectedEdge']) => void;
  selectedProfileId: string | null;
  setSelectedProfileId: (id: string | null) => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  showMyCareerOverlay: boolean;
  setShowMyCareerOverlay: (show: boolean) => void;
}

export const useUIStateStore = create<UIState>((set) => ({
  selectedJobId: null, // 초기 선택 없음 (튜토리얼 화면 표시)
  setSelectedJobId: (id) => set({ selectedJobId: id }),
  hoveredEdge: null,
  setHoveredEdge: (edge) => set({ hoveredEdge: edge }),
  hoveredNode: null,
  setHoveredNode: (node) => set({ hoveredNode: node }),
  selectedEdge: null,
  setSelectedEdge: (edge) => set({ selectedEdge: edge }),
  selectedProfileId: null,
  setSelectedProfileId: (id) => set({ selectedProfileId: id }),
  isDrawerOpen: false,
  setIsDrawerOpen: (open) => set({ isDrawerOpen: open }),
  showMyCareerOverlay: false,
  setShowMyCareerOverlay: (show) => set({ showMyCareerOverlay: show }),
}));
