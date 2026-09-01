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
 * Strict validation of UID to prevent empty or malformed path injections.
 */
function assertValidUid(uid: string): void {
  if (!uid || typeof uid !== 'string' || uid.trim().length === 0) {
    throw new Error('Security Violation: Invalid or empty UID passed to Firestore repository.');
  }
  if (uid.includes('/') || uid.includes('..')) {
    throw new Error('Security Violation: Malformed UID detected.');
  }
}

function assertValidDocId(id: string): void {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new Error('Invalid document ID provided.');
  }
  if (id.includes('/') || id.includes('..')) {
    throw new Error('Security Violation: Malformed document ID detected.');
  }
}

// =============================================================================
// 1. Journal Repository (UID-Scoped: users/{uid}/journals/{journalId})
// =============================================================================
export const JournalRepository = {
  getCollection(uid: string) {
    assertValidUid(uid);
    const db = getAdminFirestore();
    return db.collection('users').doc(uid).collection('journals');
  },

  async create(uid: string, data: Omit<JournalEntry, 'id' | 'uid' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> {
    const col = this.getCollection(uid);
    const now = new Date().toISOString();
    const docRef = col.doc();

    const entry: JournalEntry = {
      ...data,
      id: docRef.id,
      uid,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(entry);
    return entry;
  },

  async getById(uid: string, journalId: string): Promise<JournalEntry | null> {
    assertValidDocId(journalId);
    const docRef = this.getCollection(uid).doc(journalId);
    const snap = await docRef.get();
    if (!snap.exists) return null;
    return snap.data() as JournalEntry;
  },

  async list(uid: string, limitCount: number = 50): Promise<JournalEntry[]> {
    const col = this.getCollection(uid);
    const snap = await col.orderBy('createdAt', 'desc').limit(limitCount).get();
    return snap.docs.map((doc) => doc.data() as JournalEntry);
  },

  async update(uid: string, journalId: string, updates: Partial<Omit<JournalEntry, 'id' | 'uid' | 'createdAt'>>): Promise<JournalEntry> {
    assertValidDocId(journalId);
    const docRef = this.getCollection(uid).doc(journalId);
    const now = new Date().toISOString();
    const patch = { ...updates, updatedAt: now };

    await docRef.update(patch);
    const snap = await docRef.get();
    return snap.data() as JournalEntry;
  },

  async delete(uid: string, journalId: string): Promise<void> {
    assertValidDocId(journalId);
    const docRef = this.getCollection(uid).doc(journalId);
    await docRef.delete();
  },
};

// =============================================================================
// 2. Memory Repository (UID-Scoped: users/{uid}/memories/{memoryId})
// =============================================================================
export const MemoryRepository = {
  getCollection(uid: string) {
    assertValidUid(uid);
    const db = getAdminFirestore();
    return db.collection('users').doc(uid).collection('memories');
  },

  async create(uid: string, data: Omit<MemoryItem, 'id' | 'uid' | 'createdAt' | 'updatedAt'>): Promise<MemoryItem> {
    const col = this.getCollection(uid);
    const now = new Date().toISOString();
    const docRef = col.doc();

    const item: MemoryItem = {
      ...data,
      id: docRef.id,
      uid,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(item);
    return item;
  },

  async list(uid: string, category?: MemoryCategory): Promise<MemoryItem[]> {
    let query: FirebaseFirestore.Query = this.getCollection(uid);
    if (category) {
      query = query.where('category', '==', category);
    }
    const snap = await query.orderBy('createdAt', 'desc').get();
    return snap.docs.map((doc) => doc.data() as MemoryItem);
  },

  async getById(uid: string, memoryId: string): Promise<MemoryItem | null> {
    assertValidDocId(memoryId);
    const snap = await this.getCollection(uid).doc(memoryId).get();
    if (!snap.exists) return null;
    return snap.data() as MemoryItem;
  },

  async update(uid: string, memoryId: string, updates: Partial<Omit<MemoryItem, 'id' | 'uid' | 'createdAt'>>): Promise<MemoryItem> {
    assertValidDocId(memoryId);
    const docRef = this.getCollection(uid).doc(memoryId);
    const now = new Date().toISOString();
    await docRef.update({ ...updates, updatedAt: now });
    const snap = await docRef.get();
    return snap.data() as MemoryItem;
  },

  async delete(uid: string, memoryId: string): Promise<void> {
    assertValidDocId(memoryId);
    await this.getCollection(uid).doc(memoryId).delete();
  },
};

// =============================================================================
// 3. Goal Repository (UID-Scoped: users/{uid}/goals/{goalId})
// =============================================================================
export const GoalRepository = {
  getCollection(uid: string) {
    assertValidUid(uid);
    const db = getAdminFirestore();
    return db.collection('users').doc(uid).collection('goals');
  },

  async create(uid: string, data: Omit<GoalItem, 'id' | 'uid' | 'createdAt' | 'updatedAt'>): Promise<GoalItem> {
    const col = this.getCollection(uid);
    const now = new Date().toISOString();
    const docRef = col.doc();

    const goal: GoalItem = {
      ...data,
      id: docRef.id,
      uid,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(goal);
    return goal;
  },

  async list(uid: string, status?: GoalStatus): Promise<GoalItem[]> {
    let query: FirebaseFirestore.Query = this.getCollection(uid);
    if (status) {
      query = query.where('status', '==', status);
    }
    const snap = await query.orderBy('createdAt', 'desc').get();
    return snap.docs.map((doc) => doc.data() as GoalItem);
  },

  async getById(uid: string, goalId: string): Promise<GoalItem | null> {
    assertValidDocId(goalId);
    const snap = await this.getCollection(uid).doc(goalId).get();
    if (!snap.exists) return null;
    return snap.data() as GoalItem;
  },

  async update(uid: string, goalId: string, updates: Partial<Omit<GoalItem, 'id' | 'uid' | 'createdAt'>>): Promise<GoalItem> {
    assertValidDocId(goalId);
    const docRef = this.getCollection(uid).doc(goalId);
    const now = new Date().toISOString();
    await docRef.update({ ...updates, updatedAt: now });
    const snap = await docRef.get();
    return snap.data() as GoalItem;
  },

  async delete(uid: string, goalId: string): Promise<void> {
    assertValidDocId(goalId);
    await this.getCollection(uid).doc(goalId).delete();
  },
};

// =============================================================================
// 4. Rewind Repository (UID-Scoped: users/{uid}/rewinds/{rewindId})
// =============================================================================
export const RewindRepository = {
  getCollection(uid: string) {
    assertValidUid(uid);
    const db = getAdminFirestore();
    return db.collection('users').doc(uid).collection('rewinds');
  },

  async save(uid: string, data: Omit<RewindReport, 'id' | 'uid' | 'createdAt'>): Promise<RewindReport> {
    const col = this.getCollection(uid);
    const now = new Date().toISOString();
    const docRef = col.doc();

    const report: RewindReport = {
      ...data,
      id: docRef.id,
      uid,
      createdAt: now,
    };

    await docRef.set(report);
    return report;
  },

  async list(uid: string): Promise<RewindReport[]> {
    const snap = await this.getCollection(uid).orderBy('createdAt', 'desc').limit(20).get();
    return snap.docs.map((doc) => doc.data() as RewindReport);
  },

  async getById(uid: string, rewindId: string): Promise<RewindReport | null> {
    assertValidDocId(rewindId);
    const snap = await this.getCollection(uid).doc(rewindId).get();
    if (!snap.exists) return null;
    return snap.data() as RewindReport;
  },
};
