import {
  JournalRepository,
  MemoryRepository,
  GoalRepository,
  RewindRepository,
} from '@/lib/firestore/repositories';
import * as adminFirestore from '@/lib/firebase/admin';

// In-memory mock for Firestore to verify collection paths & document isolation
describe('Security Test Suite: Firestore UID Isolation & Access Boundary', () => {
  let mockDoc: jest.Mock;
  let mockCollection: jest.Mock;
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();

    const mockSubDocRef = {
      id: 'doc-id-123',
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ id: 'doc-id-123', uid: 'user_A' }) }),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const mockSubCollection = {
      doc: jest.fn().mockReturnValue(mockSubDocRef),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ docs: [{ data: () => ({ id: 'doc-1', uid: 'user_A' }) }] }),
    };

    const mockUserDocRef = {
      collection: jest.fn().mockReturnValue(mockSubCollection),
    };

    mockCollection = jest.fn().mockReturnValue({
      doc: jest.fn((uid) => {
        return {
          collection: (subColName: string) => {
            return {
              ...mockSubCollection,
              _path: `users/${uid}/${subColName}`,
            };
          },
        };
      }),
    });

    mockDb = {
      collection: mockCollection,
    };

    jest.spyOn(adminFirestore, 'getAdminFirestore').mockReturnValue(mockDb as any);
  });

  it('1. MUST strictly scope Journal queries to the authenticated user path (users/{uid}/journals)', async () => {
    const userA_Col = JournalRepository.getCollection('user_A');
    expect((userA_Col as any)._path).toBe('users/user_A/journals');

    const userB_Col = JournalRepository.getCollection('user_B');
    expect((userB_Col as any)._path).toBe('users/user_B/journals');
    expect((userA_Col as any)._path).not.toBe((userB_Col as any)._path);
  });

  it('2. MUST reject empty or non-string UID with a security violation exception', () => {
    expect(() => JournalRepository.getCollection('')).toThrow('Security Violation: Invalid or empty UID');
    expect(() => JournalRepository.getCollection(null as any)).toThrow('Security Violation: Invalid or empty UID');
    expect(() => MemoryRepository.getCollection(undefined as any)).toThrow('Security Violation: Invalid or empty UID');
  });

  it('3. MUST reject path traversal attempts in UID', () => {
    expect(() => JournalRepository.getCollection('../admin')).toThrow('Security Violation: Malformed UID detected');
    expect(() => MemoryRepository.getCollection('user_A/journals/other')).toThrow('Security Violation: Malformed UID detected');
    expect(() => GoalRepository.getCollection('../../etc/passwd')).toThrow('Security Violation: Malformed UID detected');
  });

  it('4. MUST reject path traversal attempts in Document IDs', async () => {
    await expect(JournalRepository.getById('user_A', '../evil_doc')).rejects.toThrow('Security Violation: Malformed document ID');
    await expect(MemoryRepository.delete('user_A', 'doc/traversal')).rejects.toThrow('Security Violation: Malformed document ID');
  });

  it('5. MUST scope Memory, Goal, and Rewind repositories strictly by authenticated UID', () => {
    const memoryCol = MemoryRepository.getCollection('user_X');
    expect((memoryCol as any)._path).toBe('users/user_X/memories');

    const goalCol = GoalRepository.getCollection('user_X');
    expect((goalCol as any)._path).toBe('users/user_X/goals');

    const rewindCol = RewindRepository.getCollection('user_X');
    expect((rewindCol as any)._path).toBe('users/user_X/rewinds');
  });
});
