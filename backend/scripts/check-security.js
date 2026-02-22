#!/usr/bin/env node

/**
 * Security check script
 * Verifies that no hardcoded fallback secrets exist in compiled code
 */

const fs = require('fs');
const path = require('path');

// Patterns that indicate fallback secrets are being used (security risk)
const FORBIDDEN_PATTERNS = [
  // Match: process.env.JWT_SECRET || 'fallback_secret'
  /process\.env\.JWT_SECRET\s*\|\|\s*['"]fallback_secret['"]/gi,
  /process\.env\.JWT_SECRET\s*\|\|\s*['"]your-secret-key['"]/gi,
  // Match: || 'fallback_secret' (any context)
  /\|\|\s*['"]fallback_secret['"]/gi,
  /\|\|\s*['"]your-secret-key['"]/gi,
];

// Patterns that are OK (validation checks, not fallbacks)
const ALLOWED_PATTERNS = [
  // Allow: if (process.env.JWT_SECRET === 'fallback_secret') - this is validation
  /if\s*\([^)]*JWT_SECRET\s*===?\s*['"]fallback_secret['"]/gi,
  /if\s*\([^)]*JWT_SECRET\s*===?\s*['"]your-secret-key['"]/gi,
];

const FORBIDDEN_MESSAGES = [
  'JWT_SECRET || fallback_secret',
  'JWT_SECRET || your-secret-key',
  '|| fallback_secret',
  '|| your-secret-key',
];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  FORBIDDEN_PATTERNS.forEach((pattern, index) => {
    if (pattern.test(content)) {
      const lines = content.split('\n');
      lines.forEach((line, lineNum) => {
        if (pattern.test(line)) {
          // Check if this line matches an allowed pattern (validation, not fallback)
          const isAllowed = ALLOWED_PATTERNS.some(allowedPattern => allowedPattern.test(line));
          
          if (!isAllowed) {
            issues.push({
              file: filePath,
              line: lineNum + 1,
              pattern: FORBIDDEN_MESSAGES[index],
              content: line.trim(),
            });
          }
        }
      });
    }
  });

  return issues;
}

function checkDirectory(dir, issues = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and dist (these are checked separately)
      if (file !== 'node_modules' && file !== 'dist') {
        checkDirectory(filePath, issues);
      }
    } else if (file.endsWith('.js') && !file.endsWith('.test.js')) {
      // Check compiled JS files (but not test files)
      const fileIssues = checkFile(filePath);
      issues.push(...fileIssues);
    }
  });

  return issues;
}

// Main check
console.log('🔒 Running security check for hardcoded secrets...\n');

const distPath = path.join(__dirname, '../dist');
const srcPath = path.join(__dirname, '../src');

let allIssues = [];

// Check dist folder (compiled code)
if (fs.existsSync(distPath)) {
  console.log('Checking dist/ folder...');
  const distIssues = checkDirectory(distPath);
  allIssues.push(...distIssues);
}

// Check src folder for any .js files (shouldn't exist, but check anyway)
console.log('Checking src/ folder for .js files...');
const srcIssues = checkDirectory(srcPath);
allIssues.push(...srcIssues);

if (allIssues.length > 0) {
  console.error('\n❌ SECURITY VIOLATION DETECTED!\n');
  console.error('Found hardcoded fallback secrets in the following files:\n');
  
  allIssues.forEach((issue) => {
    console.error(`  File: ${issue.file}`);
    console.error(`  Line: ${issue.line}`);
    console.error(`  Pattern: ${issue.pattern}`);
    console.error(`  Content: ${issue.content.substring(0, 100)}...\n`);
  });

  console.error('⚠️  CRITICAL: Hardcoded fallback secrets are a security risk!');
  console.error('   The application should fail if JWT_SECRET is not set, not use a fallback.\n');
  process.exit(1);
} else {
  console.log('✅ No hardcoded fallback secrets found.\n');
  process.exit(0);
}
