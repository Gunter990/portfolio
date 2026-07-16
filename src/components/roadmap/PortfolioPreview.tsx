'use client';

import React from 'react';
import { ExternalLink, Award, Briefcase, Code, Link2 } from 'lucide-react';
import { NotionPortfolio } from '@/types';

interface PortfolioPreviewProps {
  portfolio: Omit<NotionPortfolio, 'profileId' | 'nickname' | 'avatarUrl' | 'bio'>;
  nickname: string;
  avatarUrl: string | null;
  bio: string | null;
}

export default function PortfolioPreview({ portfolio, nickname, avatarUrl, bio }: PortfolioPreviewProps) {
  return (
    <div className="bg-[#fcfaf7] rounded-3xl border border-[#e8dfd5] p-5 shadow-sm space-y-6">
      
      {/* 프로필 헤더 */}
      <div className="flex items-center gap-4 border-b border-[#f2ebe1] pb-4">
        {avatarUrl && (
          <img src={avatarUrl} alt={nickname} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
        )}
        <div>
          <div className="font-extrabold text-base text-[#4a3e3d]">{nickname}</div>
          {bio && <div className="text-xs text-[#8c7b6e] mt-1">{bio}</div>}
        </div>
      </div>

      {/* 보유 기술 목록 */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#8c7b6e]">
          <Code className="w-4 h-4 text-[#f28c28]" />
          <span>보유 기술 스택 (Notion Sync)</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {portfolio.skills.map((skill) => (
            <span
              key={skill}
              className="bg-[#fcfaf7] border border-[#e8dfd5] text-[#4a3e3d] text-xs px-2.5 py-1 rounded-full font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* 경력 사항 */}
      <div className="space-y-3.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#8c7b6e]">
          <Briefcase className="w-4 h-4 text-[#f28c28]" />
          <span>경력 (Experiences)</span>
        </div>
        <div className="space-y-3">
          {portfolio.experiences.map((exp, idx) => (
            <div key={idx} className="border-l-2 border-[#e8dfd5] pl-3.5 py-0.5 space-y-1">
              <div className="text-xs font-bold text-[#4a3e3d]">
                {exp.role} @ <span className="text-[#f28c28]">{exp.company}</span>
              </div>
              <div className="text-[10px] text-[#b0a295]">
                {exp.startDate} ~ {exp.endDate || '재직 중'}
              </div>
              <ul className="list-disc list-inside text-xs text-[#8c7b6e] space-y-1 mt-1 pl-1">
                {exp.achievements.map((ach, aIdx) => (
                  <li key={aIdx}>{ach}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 자격증 정보 */}
      {portfolio.certificates && portfolio.certificates.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#8c7b6e]">
            <Award className="w-4 h-4 text-[#f28c28]" />
            <span>취득 자격증 (Certificates)</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {portfolio.certificates.map((cert, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs bg-[#f5ece1]/30 border border-[#e8dfd5]/40 rounded-xl px-3.5 py-2">
                <span className="font-semibold text-[#4a3e3d]">{cert.name}</span>
                <span className="text-[10px] text-[#b0a295]">{cert.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 깃허브 링크 */}
      {portfolio.githubUrl && (
        <div className="pt-2 border-t border-[#f2ebe1]">
          <a
            href={portfolio.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-2xl bg-[#4a3e3d] text-[#fcfaf7] text-xs font-bold hover:bg-[#382f2e] transition-colors"
          >
            <span>GitHub 저장소 방문하기</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
