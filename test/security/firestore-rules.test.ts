import fs from 'fs';
import path from 'path';

describe('Security Test Suite: Firestore Security Rules Validation', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const rulesPath = path.join(rootDir, 'firestore.rules');

  it('1. MUST have firestore.rules present in the project root', () => {
    expect(fs.existsSync(rulesPath)).toBe(true);
  });

  it('2. MUST enforce authentication and UID ownership on /users/{userId}', () => {
    const rules = fs.readFileSync(rulesPath, 'utf-8');

    // Verify rules_version
    expect(rules).toContain("rules_version = '2';");

    // Verify helper functions
    expect(rules).toContain('function isAuthenticated()');
    expect(rules).toContain('function isOwner(userId)');
    expect(rules).toContain('request.auth.uid == userId');

    // Verify user root matching
    expect(rules).toContain('match /users/{userId}');
    expect(rules).toContain('allow read, write: if isOwner(userId);');

    // Verify subcollections isolation
    expect(rules).toContain('match /journals/{journalId}');
    expect(rules).toContain('allow read, write, delete: if isOwner(userId);');

    expect(rules).toContain('match /memories/{memoryId}');
    expect(rules).toContain('match /goals/{goalId}');
    expect(rules).toContain('match /insights/{insightId}');
    expect(rules).toContain('match /rewinds/{rewindId}');

    // Verify default deny
    expect(rules).toContain('match /{document=**}');
    expect(rules).toContain('allow read, write: if false;');
  });
});
