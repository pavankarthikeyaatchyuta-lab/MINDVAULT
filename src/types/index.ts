export type MemoryCategory =
  | 'EVENT'
  | 'PERSON'
  | 'PLACE'
  | 'GOAL'
  | 'DECISION'
  | 'ACHIEVEMENT'
  | 'IDEA'
  | 'CONCERN'
  | 'PREFERENCE';

export type GoalStatus = 'active' | 'completed' | 'paused' | 'archived';

export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface JournalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface JournalEntry {
  id: string;
  uid: string;
  title: string;
  content: string;
  messages: JournalMessage[];
  summary?: string;
  topics?: string[];
  location?: {
    placeId?: string;
    name: string;
    formattedAddress?: string;
    latitude?: number;
    longitude?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MemoryItem {
  id: string;
  uid: string;
  category: MemoryCategory;
  title: string;
  description: string;
  sourceJournalId: string;
  sourceDate: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GoalItem {
  id: string;
  uid: string;
  title: string;
  description?: string;
  status: GoalStatus;
  sourceJournalIds: string[];
  targetDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RewindPeriod {
  type: '7d' | '30d' | '90d' | 'all';
  startDate: string;
  endDate: string;
}

export interface RewindReport {
  id: string;
  uid: string;
  period: RewindPeriod;
  whatOccupiedYourMind: string[];
  importantMoments: { title: string; description: string; date: string; sourceJournalId?: string }[];
  recurringThemes: { theme: string; count: number; description: string }[];
  goals: { title: string; status: GoalStatus; sourceJournalId?: string }[];
  decisions: { title: string; rationale: string; date: string; sourceJournalId?: string }[];
  whatChanged: string[];
  unfinishedThoughts: { thought: string; sourceJournalId?: string }[];
  momentWorthRemembering: { title: string; description: string; date: string; sourceJournalId: string };
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface EvidenceItem {
  sourceType: 'journal' | 'memory' | 'goal';
  sourceId: string;
  title: string;
  date: string;
  content: string;
  relevance: number;
}

export interface AskSourceReference {
  sourceType: 'journal' | 'memory' | 'goal';
  sourceId: string;
  title: string;
  date: string;
  excerpt?: string;
}

export interface AskJournalResult {
  answer: string;
  confidence: 'high' | 'medium' | 'low';
  sources: AskSourceReference[];
}

export type TimelineFilterType =
  | 'ALL'
  | 'JOURNAL'
  | 'ACHIEVEMENT'
  | 'DECISION'
  | 'IDEA'
  | 'GOAL'
  | 'EVENT'
  | 'PERSON'
  | 'PLACE'
  | 'CONCERN'
  | 'PREFERENCE';

export interface TimelineItem {
  id: string;
  type: TimelineFilterType;
  title: string;
  description: string;
  date: string;
  sourceJournalId?: string;
  sourceMemoryId?: string;
  tags?: string[];
}

export interface TimelineChangeInsight {
  earlierThemes: string[];
  recentThemes: string[];
  shiftSummary: string;
}

export interface MapPlaceMemoryRef {
  id: string;
  title: string;
  description: string;
  date: string;
  sourceJournalId: string;
}

export interface MapPlaceJournalRef {
  id: string;
  title: string;
  date: string;
}

export type LocationPrecision = 'exact' | 'city' | 'unresolved';
export type CoordinateSource = 'EXPLICIT_COORDINATES' | 'KNOWN_CITY_DATABASE' | 'UNRESOLVED';

export interface MapPlaceNode {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  precision: LocationPrecision;
  coordinateSource: CoordinateSource;
  mentionsCount: number;
  lastMentioned: string;
  memories: MapPlaceMemoryRef[];
  journals: MapPlaceJournalRef[];
}

export interface InsightsReport {
  summary: string;
  periodStats: {
    totalJournals: number;
    totalMemories: number;
    activeDays: number;
  };
  recurringThemes: {
    theme: string;
    count: number;
    description: string;
  }[];
  emergingInterests: {
    interest: string;
    earlierCount: number;
    recentCount: number;
    explanation: string;
  }[];
  goalMomentum: {
    goal: string;
    status: 'active' | 'completed' | 'dormant';
    sourceJournalId?: string;
  }[];
  peopleAndPlaces: {
    topPeople: { name: string; mentions: number }[];
    topPlaces: { name: string; mentions: number }[];
  };
  changes: {
    area: string;
    shift: string;
  }[];
  personalPatterns: string[];
  reflection: string;
  sources: {
    sourceType: 'journal' | 'memory';
    sourceId: string;
    title: string;
  }[];
  isEmpty?: boolean;
}


