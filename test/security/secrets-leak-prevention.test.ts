import fs from 'fs';
import path from 'path';

describe('Security Test Suite: Secret Leak Prevention & Repository Cleanliness', () => {
  const rootDir = path.resolve(__dirname, '../../');

  it('1. MUST ensure .gitignore ignores all local env files and service account credentials', () => {
    const gitignorePath = path.join(rootDir, '.gitignore');
    expect(fs.existsSync(gitignorePath)).toBe(true);

    const content = fs.readFileSync(gitignorePath, 'utf-8');
    expect(content).toContain('.env');
    expect(content).toContain('.env*.local');
    expect(content).toContain('*.serviceaccount.json');
    expect(content).toContain('firebase-adminsdk*.json');
    expect(content).toContain('node_modules');
  });

  it('2. MUST ensure .env.example contains only placeholders and zero real secret values', () => {
    const envExamplePath = path.join(rootDir, '.env.example');
    expect(fs.existsSync(envExamplePath)).toBe(true);

    const content = fs.readFileSync(envExamplePath, 'utf-8');
    // Ensure no actual API key patterns exist
    expect(content).not.toMatch(/AIza[0-9A-Za-z-_]{35}/);
    expect(content).not.toContain('-----BEGIN PRIVATE KEY-----');
    expect(content).toContain('AIzaSyYourClientApiKeyPlaceholder');
  });

  it('3. MUST scan all source code files for hardcoded private keys or service account credentials', () => {
    const srcDir = path.join(rootDir, 'src');

    function scanDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js'))) {
          const fileContent = fs.readFileSync(fullPath, 'utf-8');
          // Check for private key leaks
          expect(fileContent).not.toContain('-----BEGIN PRIVATE KEY-----');
          expect(fileContent).not.toContain('-----BEGIN RSA PRIVATE KEY-----');
          // Check for actual live API keys
          expect(fileContent).not.toMatch(/AIza[0-9A-Za-z-_]{35}/);
        }
      }
    }

    scanDir(srcDir);
  });
});
