// ============================================================
// TypeScript types for the Go-Vote application
// ============================================================

export type AdminRole = 'superadmin' | 'admin';

export interface AdminInfo {
  id: string;
  username: string;
  name: string;
  role: AdminRole;
}

// ============================================================
// EVENTS
// ============================================================

export type EventStatus = 'draft' | 'active' | 'finished' | 'closed';

export interface VotingEvent {
  id: string;
  name: string;
  slug: string;
  code: string;
  description: string | null;
  banner_url: string | null;
  start_at: string;
  end_at: string;
  status: EventStatus;
  min_choices: number;
  max_choices: number;
  allow_multiple_choices: boolean;
  is_result_public: boolean;
  total_candidates: number;
  total_voters: number;
  total_voted: number;
  created_at: string;
  updated_at: string;
}

export interface CreateEventRequest {
  name: string;
  description?: string;
  start_at: string;
  end_at: string;
  min_choices: number;
  max_choices: number;
  allow_multiple_choices: boolean;
  is_result_public: boolean;
}

// ============================================================
// CANDIDATES
// ============================================================

export type GenderType = 'male' | 'female' | 'other';

export interface Candidate {
  id: string;
  full_name: string;
  candidate_number: number | null;
  nik: string | null;
  birth_place: string | null;
  birth_date: string | null;
  gender: GenderType | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  education: string | null;
  organization_experience: string | null;
  current_position: string | null;
  vision: string | null;
  mission: string | null;
  work_program: string | null;
  goals: string | null;
  motto: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventCandidate {
  id: string;
  event_id: string;
  candidate_id: string;
  candidate_number: number;
  sort_order: number;
  full_name: string;
  photo_url: string | null;
  vision: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// VOTERS
// ============================================================

export type VoterStatus = 'active' | 'blocked';
export type EventVoterStatus = 'active' | 'blocked';

export interface Voter {
  id: string;
  full_name: string;
  identity_number: string | null;
  phone: string | null;
  email: string | null;
  group_name: string | null;
  unique_code: string;
  qr_code_url: string | null;
  is_anonymous: boolean;
  status: VoterStatus;
  created_at: string;
  updated_at: string;
}

export interface EventVoter {
  id: string;
  event_id: string;
  voter_id: string;
  assigned_at: string;
  has_voted: boolean;
  voted_at: string | null;
  status: EventVoterStatus;
  full_name: string;
  identity_number: string | null;
  group_name: string | null;
  unique_code: string;
  qr_code_url: string | null;
  is_anonymous: boolean;
  voter_status: VoterStatus;
}

// ============================================================
// VOTING (PUBLIC)
// ============================================================

export interface PublicVoterInfo {
  id: string;
  full_name: string;
  is_anonymous: boolean;
}

export interface PublicEventInfo {
  id: string;
  name: string;
  description: string | null;
  start_at: string;
  end_at: string;
  min_choices: number;
  max_choices: number;
  allow_multiple_choices: boolean;
  has_voted: boolean;
}

export interface ValidateCodeResponse {
  token: string;
  expires_at: string;
  voter: PublicVoterInfo;
  events: PublicEventInfo[];
}

// ============================================================
// RESULTS
// ============================================================

export interface CandidateResult {
  candidate_id: string;
  full_name: string;
  candidate_number: number;
  photo_url: string | null;
  vote_count: number;
  percentage: number;
  rank: number;
}

export interface EventResultResponse {
  event: {
    id: string;
    name: string;
    status: string;
  };
  total_voters: number;
  total_voted: number;
  total_not_voted: number;
  participation_pct: number;
  candidates: CandidateResult[];
}

// ============================================================
// DASHBOARD
// ============================================================

export interface DashboardStats {
  total_events: number;
  active_events: number;
  total_candidates: number;
  total_voters: number;
  total_voted: number;
  total_not_voted: number;
}

// ============================================================
// API RESPONSES
// ============================================================

export interface APIResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}
