'use client';

import React from 'react';
import { Reorder, motion, AnimatePresence } from 'framer-motion';
import { Star, X } from 'lucide-react';
import { Job } from '@/types';
import { useUIStateStore } from '@/store/uiStateStore';

interface StarredJobBarProps {
  starredJobs: Job[];
  setStarredIds: (ids: string[]) => void;
  toggleStar: (id: string) => void;
}

export default function StarredJobBar({ starredJobs, setStarredIds, toggleStar }: StarredJobBarProps) {
  const { selectedJobId, setSelectedJobId } = useUIStateStore();

  const handleReorder = (newJobs: Job[]) => {
    setStarredIds(newJobs.map((j) => j.id));
  };

  return (
    <div className="w-full mt-4">
      <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-[#8c7b6e]">
        <Star className="w-3.5 h-3.5 fill-[#f28c28] text-[#f28c28]" />
        <span>고정된 관심 직업 (순서 드래그 변경 가능)</span>
      </div>

      {starredJobs.length === 0 ? (
        <div className="text-xs text-[#b0a295] bg-[#f5ece1]/40 border border-dashed border-[#e8dfd5] rounded-xl px-4 py-3 text-center">
          자주 찾는 직업을 즐겨찾기하여 상단에 고정해 보세요.
        </div>
      ) : (
        <Reorder.Group
          axis="x"
          values={starredJobs}
          onReorder={handleReorder}
          className="flex flex-wrap gap-2 overflow-x-auto pb-1 max-w-full"
        >
          <AnimatePresence initial={false}>
            {starredJobs.map((job) => {
              const isSelected = selectedJobId === job.id;
              return (
                <Reorder.Item
                  key={job.id}
                  value={job}
                  className="list-none focus:outline-none"
                >
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setSelectedJobId(job.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer border shadow-sm select-none transition-all ${
                      isSelected
                        ? 'bg-[#f28c28] text-white border-[#f28c28]'
                        : 'bg-[#fcfaf7] text-[#4a3e3d] border-[#e8dfd5] hover:bg-[#f5ece1]'
                    }`}
                  >
                    <span>{job.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(job.id);
                      }}
                      className={`p-0.5 rounded-full transition-colors ${
                        isSelected ? 'hover:bg-white/20 text-white' : 'hover:bg-[#ebdcc8] text-[#b0a295]'
                      }`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                </Reorder.Item>
              );
            })}
          </AnimatePresence>
        </Reorder.Group>
      )}
    </div>
  );
}
