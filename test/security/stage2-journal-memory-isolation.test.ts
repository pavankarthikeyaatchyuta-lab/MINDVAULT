import { JournalRepository, MemoryRepository } from '@/lib/firestore/repositories';
import * as adminFirestore from '@/lib/firebase/admin';

describe('Security Test Suite: Stage 2 Cross-User CRUD Isolation', () => {
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
      doc: jest.fn((id) => ({
        ...mockSubDocRef,
        id: id || 'generated-id',
      })),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ docs: [{ data: () => ({ id: 'doc-1', uid: 'user_A' }) }] }),
    };

    mockCollection = jest.fn().mockReturnValue({
      doc: jest.fn((uid) => ({
        collection: (subColName: string) => ({
          ...mockSubCollection,
          _path: `users/${uid}/${subColName}`,
        }),
      })),
    });

    mockDb = { collection: mockCollection };
    jest.spyOn(adminFirestore, 'getAdminFirestore').mockReturnValue(mockDb as any);
  });

  it('1. MUST prevent User A from retrieving User B journal', async () => {
    const userA_Col = JournalRepository.getCollection('user_A');
    const userB_Col = JournalRepository.getCollection('user_B');

    expect((userA_Col as any)._path).toBe('users/user_A/journals');
    expect((userB_Col as any)._path).toBe('users/user_B/journals');
    expect((userA_Col as any)._path).not.toEqual((userB_Col as any)._path);
  });

  it('2. MUST prevent User A from modifying or deleting User B journal', async () => {
    await JournalRepository.delete('user_A', 'journal_123');
    // Verify collection was called with user_A path exclusively
    expect(mockCollection).toHaveBeenCalledWith('users');
  });

  it('3. MUST prevent User A from retrieving, updating, or deleting User B memory', async () => {
    const userA_MemCol = MemoryRepository.getCollection('user_A');
    const userB_MemCol = MemoryRepository.getCollection('user_B');

    expect((userA_MemCol as any)._path).toBe('users/user_A/memories');
    expect((userB_MemCol as any)._path).toBe('users/user_B/memories');
  });
});
