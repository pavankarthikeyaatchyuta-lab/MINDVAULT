import { getAdminFirestore } from '@/lib/firebase/admin';
import {
  JournalEntry,
  MemoryItem,
  GoalItem,
  RewindReport,
  MemoryCategory,
  GoalStatus,
} from '@/types';

/**
 * Strict validation of authenticated UID to prevent empty or malformed path injections.
 * Enforces that only verified server-derived UIDs can access Firestore repositories.
 */
function assertValidAuthenticatedUid(authenticatedUid: string): void {
  if (!authenticatedUid || typeof authenticatedUid !== 'string' || authenticatedUid.trim().length === 0) {
    throw new Error('Security Violation: Invalid or empty authenticatedUid passed to Firestore repository.');
  }
  if (authenticatedUid.includes('/') || authenticatedUid.includes('..') || authenticatedUid.includes('\\')) {
    throw new Error('Security Violation: Malformed authenticatedUid detected.');
  }
}

/**
 * Recursively strips keys whose value is `undefined` from a plain object.
 * Firestore rejects `undefined` values — this utility lets optional fields
 * (e.g. location, summary, tags) be omitted cleanly instead of erroring.
 */
function stripUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj) || obj instanceof Date) {
    return obj;
  }
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (value === undefined) continue;
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      cleaned[key] = stripUndefined(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned as T;
}

function assertValidDocId(id: string): void {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new Error('Invalid document ID provided.');
  }
  if (id.includes('/') || id.includes('..') || id.includes('\\')) {
    throw new Error('Security Violation: Malformed document ID detected.');
  }
}

// =============================================================================
// 1. Journal Repository (UID-Scoped: users/{authenticatedUid}/journals/{journalId})
// =============================================================================
export const JournalRepository = {
  getCollection(authenticatedUid: string) {
    assertValidAuthenticatedUid(authenticatedUid);
    const db = getAdminFirestore();
    return db.collection('users').doc(authenticatedUid).collection('journals');
  },

  async create(authenticatedUid: string, data: Omit<JournalEntry, 'id' | 'uid' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> {
    const col = this.getCollection(authenticatedUid);
    const now = new Date().toISOString();
    const docRef = col.doc();

    const entry: JournalEntry = {
      ...data,
      id: docRef.id,
      uid: authenticatedUid,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(stripUndefined(entry));
    return entry;
  },

  async getById(authenticatedUid: string, journalId: string): Promise<JournalEntry | null> {
    assertValidDocId(journalId);
    const docRef = this.getCollection(authenticatedUid).doc(journalId);
    const snap = await docRef.get();
    if (!snap.exists) return null;
    return snap.data() as JournalEntry;
  },

  async list(authenticatedUid: string, limitCount: number = 50): Promise<JournalEntry[]> {
    const col = this.getCollection(authenticatedUid);
    const snap = await col.orderBy('createdAt', 'desc').limit(limitCount).get();
    return snap.docs.map((doc) => doc.data() as JournalEntry);
  },

  async update(authenticatedUid: string, journalId: string, updates: Partial<Omit<JournalEntry, 'id' | 'uid' | 'createdAt'>>): Promise<JournalEntry> {
    assertValidDocId(journalId);
    const docRef = this.getCollection(authenticatedUid).doc(journalId);
    const now = new Date().toISOString();
    const patch = stripUndefined({ ...updates, updatedAt: now });

    await docRef.update(patch);
    const snap = await docRef.get();
    return snap.data() as JournalEntry;
  },

  async delete(authenticatedUid: string, journalId: string): Promise<void> {
    assertValidDocId(journalId);
    const docRef = this.getCollection(authenticatedUid).doc(journalId);
    await docRef.delete();
  },
};

// =============================================================================
// 2. Memory Repository (UID-Scoped: users/{authenticatedUid}/memories/{memoryId})
// =============================================================================
export const MemoryRepository = {
  getCollection(authenticatedUid: string) {
    assertValidAuthenticatedUid(authenticatedUid);
    const db = getAdminFirestore();
    return db.collection('users').doc(authenticatedUid).collection('memories');
  },

  async create(authenticatedUid: string, data: Omit<MemoryItem, 'id' | 'uid' | 'createdAt' | 'updatedAt'>): Promise<MemoryItem> {
    const col = this.getCollection(authenticatedUid);
    const now = new Date().toISOString();
    const docRef = col.doc();

    const item: MemoryItem = {
      ...data,
      id: docRef.id,
      uid: authenticatedUid,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(stripUndefined(item));
    return item;
  },

  async list(authenticatedUid: string, category?: MemoryCategory): Promise<MemoryItem[]> {
    let query: FirebaseFirestore.Query = this.getCollection(authenticatedUid);
    if (category) {
      query = query.where('category', '==', category);
    }
    const snap = await query.orderBy('createdAt', 'desc').get();
    return snap.docs.map((doc) => doc.data() as MemoryItem);
  },

  async getById(authenticatedUid: string, memoryId: string): Promise<MemoryItem | null> {
    assertValidDocId(memoryId);
    const snap = await this.getCollection(authenticatedUid).doc(memoryId).get();
    if (!snap.exists) return null;
    return snap.data() as MemoryItem;
  },

  async update(authenticatedUid: string, memoryId: string, updates: Partial<Omit<MemoryItem, 'id' | 'uid' | 'createdAt'>>): Promise<MemoryItem> {
    assertValidDocId(memoryId);
    const docRef = this.getCollection(authenticatedUid).doc(memoryId);
    const now = new Date().toISOString();
    await docRef.update(stripUndefined({ ...updates, updatedAt: now }));
    const snap = await docRef.get();
    return snap.data() as MemoryItem;
  },

  async delete(authenticatedUid: string, memoryId: string): Promise<void> {
    assertValidDocId(memoryId);
    await this.getCollection(authenticatedUid).doc(memoryId).delete();
  },
};

// =============================================================================
// 3. Goal Repository (UID-Scoped: users/{authenticatedUid}/goals/{goalId})
// =============================================================================
export const GoalRepository = {
  getCollection(authenticatedUid: string) {
    assertValidAuthenticatedUid(authenticatedUid);
    const db = getAdminFirestore();
    return db.collection('users').doc(authenticatedUid).collection('goals');
  },

  async create(authenticatedUid: string, data: Omit<GoalItem, 'id' | 'uid' | 'createdAt' | 'updatedAt'>): Promise<GoalItem> {
    const col = this.getCollection(authenticatedUid);
    const now = new Date().toISOString();
    const docRef = col.doc();

    const goal: GoalItem = {
      ...data,
      id: docRef.id,
      uid: authenticatedUid,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(stripUndefined(goal));
    return goal;
  },

  async list(authenticatedUid: string, status?: GoalStatus): Promise<GoalItem[]> {
    let query: FirebaseFirestore.Query = this.getCollection(authenticatedUid);
    if (status) {
      query = query.where('status', '==', status);
    }
    const snap = await query.orderBy('createdAt', 'desc').get();
    return snap.docs.map((doc) => doc.data() as GoalItem);
  },

  async getById(authenticatedUid: string, goalId: string): Promise<GoalItem | null> {
    assertValidDocId(goalId);
    const snap = await this.getCollection(authenticatedUid).doc(goalId).get();
    if (!snap.exists) return null;
    return snap.data() as GoalItem;
  },

  async update(authenticatedUid: string, goalId: string, updates: Partial<Omit<GoalItem, 'id' | 'uid' | 'createdAt'>>): Promise<GoalItem> {
    assertValidDocId(goalId);
    const docRef = this.getCollection(authenticatedUid).doc(goalId);
    const now = new Date().toISOString();
    await docRef.update(stripUndefined({ ...updates, updatedAt: now }));
    const snap = await docRef.get();
    return snap.data() as GoalItem;
  },

  async delete(authenticatedUid: string, goalId: string): Promise<void> {
    assertValidDocId(goalId);
    await this.getCollection(authenticatedUid).doc(goalId).delete();
  },
};

// =============================================================================
// 4. Rewind Repository (UID-Scoped: users/{authenticatedUid}/rewinds/{rewindId})
// =============================================================================
export const RewindRepository = {
  getCollection(authenticatedUid: string) {
    assertValidAuthenticatedUid(authenticatedUid);
    const db = getAdminFirestore();
    return db.collection('users').doc(authenticatedUid).collection('rewinds');
  },

  async save(authenticatedUid: string, data: Omit<RewindReport, 'id' | 'uid' | 'createdAt'>): Promise<RewindReport> {
    const col = this.getCollection(authenticatedUid);
    const now = new Date().toISOString();
    const docRef = col.doc();

    const report: RewindReport = {
      ...data,
      id: docRef.id,
      uid: authenticatedUid,
      createdAt: now,
    };

    await docRef.set(stripUndefined(report));
    return report;
  },

  async list(authenticatedUid: string): Promise<RewindReport[]> {
    const snap = await this.getCollection(authenticatedUid).orderBy('createdAt', 'desc').limit(20).get();
    return snap.docs.map((doc) => doc.data() as RewindReport);
  },

  async getById(authenticatedUid: string, rewindId: string): Promise<RewindReport | null> {
    assertValidDocId(rewindId);
    const snap = await this.getCollection(authenticatedUid).doc(rewindId).get();
    if (!snap.exists) return null;
    return snap.data() as RewindReport;
  },
};
