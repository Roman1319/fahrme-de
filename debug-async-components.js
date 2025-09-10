const fs = require('fs');
const path = require('path');

// Функция для поиска всех файлов с расширением .tsx и .ts
function findFiles(dir, extensions = ['.tsx', '.ts']) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      // Пропускаем node_modules и .next
      if (!['node_modules', '.next', '.git'].includes(file)) {
        results = results.concat(findFiles(filePath, extensions));
      }
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

// Функция для проверки файла на async компоненты
function checkFileForAsyncComponents(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const issues = [];
    
    // Проверяем на 'use client' директиву
    const hasUseClient = content.includes("'use client'");
    
    if (hasUseClient) {
      // Ищем async функции в клиентских компонентах
      lines.forEach((line, index) => {
        const lineNum = index + 1;
        
        // Ищем async функции
        if (line.includes('async function') || line.includes('async =') || line.includes('async(')) {
          issues.push({
            type: 'async function',
            line: lineNum,
            content: line.trim(),
            file: filePath
          });
        }
        
        // Ищем export default async
        if (line.includes('export default') && line.includes('async')) {
          issues.push({
            type: 'async component',
            line: lineNum,
            content: line.trim(),
            file: filePath
          });
        }
        
        // Ищем await в не-async функциях
        if (line.includes('await ') && !line.includes('async')) {
          issues.push({
            type: 'await without async',
            line: lineNum,
            content: line.trim(),
            file: filePath
          });
        }
      });
    }
    
    return issues;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return [];
  }
}

// Основная функция
function debugAsyncComponents() {
  console.log('🔍 Поиск async компонентов в проекте...\n');
  
  const srcDir = path.join(__dirname, 'src');
  const files = findFiles(srcDir);
  
  let totalIssues = 0;
  const allIssues = [];
  
  files.forEach(file => {
    const issues = checkFileForAsyncComponents(file);
    if (issues.length > 0) {
      allIssues.push(...issues);
      totalIssues += issues.length;
    }
  });
  
  if (totalIssues === 0) {
    console.log('✅ Async компонентов не найдено!');
  } else {
    console.log(`❌ Найдено ${totalIssues} проблем с async компонентами:\n`);
    
    // Группируем по файлам
    const issuesByFile = {};
    allIssues.forEach(issue => {
      if (!issuesByFile[issue.file]) {
        issuesByFile[issue.file] = [];
      }
      issuesByFile[issue.file].push(issue);
    });
    
    Object.keys(issuesByFile).forEach(file => {
      console.log(`📁 ${file}:`);
      issuesByFile[file].forEach(issue => {
        console.log(`  ${issue.type.toUpperCase()}: строка ${issue.line}`);
        console.log(`  ${issue.content}`);
        console.log('');
      });
    });
  }
  
  // Дополнительная проверка на динамические импорты
  console.log('\n🔍 Проверка на динамические импорты...');
  let dynamicImports = 0;
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('await import(') || content.includes('import(')) {
        console.log(`⚠️  Динамический импорт в ${file}`);
        dynamicImports++;
      }
    } catch (error) {
      // Игнорируем ошибки чтения
    }
  });
  
  if (dynamicImports === 0) {
    console.log('✅ Динамических импортов не найдено');
  }
  
  console.log('\n🎯 РЕЗУЛЬТАТ:');
  console.log(`- Async проблем: ${totalIssues}`);
  console.log(`- Динамических импортов: ${dynamicImports}`);
  
  if (totalIssues > 0) {
    console.log('\n💡 РЕКОМЕНДАЦИИ:');
    console.log('1. Уберите async из всех функций в клиентских компонентах');
    console.log('2. Используйте .then() вместо await в клиентских компонентах');
    console.log('3. Оберните async логику в внутренние async функции');
  }
}

// Запускаем дебаг
debugAsyncComponents();
