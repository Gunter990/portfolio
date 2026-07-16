export interface Job {
  id: string;
  parent_job_id: string | null;
  title: string;
  industry: string;
  description: string | null;
  icon: string | null;
  display_order: number;
}

export interface StandardEvent {
  id: string;
  category: 'study' | 'project' | 'certificate' | 'career' | 'core_skill' | string;
  standard_title: string;
  description: string | null;
}

export interface Profile {
  id: string;
  nickname: string;
  avatar_url: string | null;
  bio: string | null;
}

export interface CareerNodeData {
  label: string;
  category: string;
  isMyPath?: boolean;
  connectionCount?: number;
  [key: string]: any;
}

export interface CareerEdgeData {
  weight: number;
  connectionCount: number;
  avgTransitionDays: number;
  isMyPath?: boolean;
  [key: string]: any;
}

export interface NotionPortfolio {
  profileId: string;
  nickname: string;
  avatarUrl: string | null;
  bio: string | null;
  skills: string[];
  experiences: {
    company: string;
    role: string;
    startDate: string;
    endDate: string | null;
    achievements: string[];
  }[];
  certificates: {
    name: string;
    date: string;
  }[];
  githubUrl?: string;
}
