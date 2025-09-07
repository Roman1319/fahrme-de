#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Проверяем только подозрительные ellipsis (не spread operator)
const suspiciousPatterns = [
  /\.\.\.\s*$/,  // три точки в конце строки (не в комментарии)
  /\.\.\.\s*[^.\s]/,  // три точки не в spread operator и не в комментарии
  /…\s*$/,  // многоточие в конце строки
];

// Проверяем незакрытые конструкции
const unclosedPatterns = [
  /^\.\.\.$/,  // строка состоит только из ...
  /^…$/,  // строка состоит только из …
];

// Исключаем валидные случаи
const validPatterns = [
  /\.\.\.\s*\/\//,  // комментарии
  /\.\.\.\s*\/\*/,  // многострочные комментарии
  /\.\.\.\s*['"`]/,  // строки
  /\.\.\.\s*[a-zA-Z_$]/,  // spread operator
  /\.\.\.\s*\{/,  // spread в объектах
  /\.\.\.\s*\[/,  // spread в массивах
  /\.\.\.\s*\(/,  // spread в функциях
  /<[^>]*>.*\.\.\./,  // HTML с многоточием (UI тексты)
  /console\.(log|warn|error).*\.\.\./,  // console с многоточием
  /placeholder.*\.\.\./,  // placeholder с многоточием
  /Loading\.\.\./,  // Loading тексты
  /Lade.*\.\.\./,  // Lade тексты
  /Uploading\.\.\./,  // Uploading тексты
  /Redirecting\.\.\./,  // Redirecting тексты
  /Speichern.*\.\.\./,  // Speichern тексты
  /Bilder werden verarbeitet\.\.\./,  // Обработка изображений
  /Ich kann lesen…/,  // Комментарии с многоточием
];

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const issues = [];
    
    lines.forEach((line, index) => {
      // Проверяем подозрительные ellipsis
      suspiciousPatterns.forEach(pattern => {
        if (pattern.test(line)) {
          // Проверяем, что это не валидный случай
          const isValid = validPatterns.some(validPattern => validPattern.test(line));
          if (!isValid) {
            issues.push({
              line: index + 1,
              content: line.trim(),
              pattern: pattern.toString(),
              type: 'suspicious_ellipsis'
            });
          }
        }
      });
      
      // Проверяем незакрытые конструкции (критические ошибки)
      unclosedPatterns.forEach(pattern => {
        if (pattern.test(line.trim())) {
          issues.push({
            line: index + 1,
            content: line.trim(),
            pattern: pattern.toString(),
            type: 'unclosed_construction'
          });
        }
      });
    });
    
    // Проверяем незакрытые JSX-теги и фигурные скобки в конце файла
    const trimmedContent = content.trim();
    if (trimmedContent) {
      // Проверяем незакрытые фигурные скобки в конце файла
      const openBraces = (trimmedContent.match(/\{/g) || []).length;
      const closeBraces = (trimmedContent.match(/\}/g) || []).length;
      if (openBraces > closeBraces) {
        issues.push({
          line: lines.length,
          content: 'Unclosed braces detected',
          type: 'unclosed_braces'
        });
      }
      
      // Проверяем только явно незакрытые JSX-теги в конце файла
      if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
        const lastLine = lines[lines.length - 1]?.trim();
        // Ищем открытый тег без закрывающего в последней строке
        if (lastLine && /<[A-Za-z][A-Za-z0-9]*[^>]*>[^<]*$/.test(lastLine) && !lastLine.includes('</')) {
          issues.push({
            line: lines.length,
            content: 'Unclosed JSX tag at end of file',
            type: 'unclosed_jsx'
          });
        }
      }
    }
    
    return issues;
  } catch (error) {
    return [{ error: error.message }];
  }
}

function scanDirectory(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const issues = [];
  
  function walkDir(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    items.forEach(item => {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        walkDir(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        const fileIssues = checkFile(fullPath);
        if (fileIssues.length > 0) {
          issues.push({
            file: fullPath,
            issues: fileIssues
          });
        }
      }
    });
  }
  
  walkDir(dir);
  return issues;
}

// Основная логика
const srcDir = path.join(__dirname, '..', 'src');
const issues = scanDirectory(srcDir);

// Также проверяем корневые файлы
const rootFiles = ['test-ellipsis.ts', 'test-ellipsis.js'];
rootFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    const fileIssues = checkFile(filePath);
    if (fileIssues.length > 0) {
      issues.push({
        file: filePath,
        issues: fileIssues
      });
    }
  }
});

if (issues.length > 0) {
  console.error('❌ Найдены проблемы:');
  issues.forEach(({ file, issues: fileIssues }) => {
    console.error(`\n📁 ${file}:`);
    fileIssues.forEach(issue => {
      if (issue.error) {
        console.error(`  ❌ Ошибка: ${issue.error}`);
      } else {
        const icon = issue.type === 'unclosed_construction' || issue.type === 'unclosed_braces' || issue.type === 'unclosed_jsx' 
          ? '🚨' : '⚠️';
        console.error(`  ${icon} Строка ${issue.line}: ${issue.content} (${issue.type})`);
      }
    });
  });
  process.exit(1);
} else {
  console.log('✅ Проблем не найдено');
  process.exit(0);
}
