'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Job } from '@/types';
import { Search, Star } from 'lucide-react';
import { useUIStateStore } from '@/store/uiStateStore';

interface JobSearchBarProps {
  starredIds: string[];
  toggleStar: (id: string) => void;
}

export default function JobSearchBar({ starredIds, toggleStar }: JobSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Job[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { setSelectedJobId } = useUIStateStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('id, title, industry, description, display_order, parent_job_id, icon, search_tags')
          .or(`title.ilike.%${query}%,search_tags.ilike.%${query}%`)
          .limit(10);

        if (!error && data) {
          setResults(data as Job[]);
        }
      } catch (err) {
        console.error('Job autocomplete error:', err);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  return (
    <div className="relative w-full max-w-lg" ref={dropdownRef}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="직업군 검색 (예: Backend, AI, Security)"
          className="w-full bg-[#fcfaf7] border border-[#e8dfd5] text-[#4a3e3d] rounded-full py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-[#f28c28]/40 focus:border-[#f28c28] transition-all text-sm shadow-sm placeholder-[#b0a295]"
        />
        <Search className="absolute left-4 w-5 h-5 text-[#b0a295]" />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#fcfaf7] border border-[#e8dfd5] rounded-2xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto divide-y divide-[#f2ebe1]">
          {results.map((job) => {
            const isStarred = starredIds.includes(job.id);
            return (
              <div
                key={job.id}
                onClick={() => {
                  setSelectedJobId(job.id);
                  setIsOpen(false);
                }}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-[#f5ece1] cursor-pointer transition-colors"
              >
                <div>
                  <div className="font-semibold text-sm text-[#4a3e3d]">{job.title}</div>
                  <div className="text-xs text-[#8c7b6e] mt-0.5">{job.industry}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStar(job.id);
                  }}
                  className="p-1.5 hover:bg-[#ebdcc8] rounded-full transition-colors"
                >
                  <Star
                    className={`w-4 h-4 transition-colors ${
                      isStarred ? 'fill-[#f28c28] text-[#f28c28]' : 'text-[#b0a295]'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
