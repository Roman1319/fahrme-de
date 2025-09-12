/**
 * Утилиты для санитизации HTML контента
 */

// Простая санитизация HTML - удаляет потенциально опасные теги и атрибуты
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // Удаляем потенциально опасные теги
  const dangerousTags = [
    'script', 'iframe', 'object', 'embed', 'form', 'input', 'button',
    'link', 'meta', 'style', 'base', 'applet', 'frame', 'frameset'
  ];
  
  let sanitized = html;
  
  // Удаляем опасные теги и их содержимое
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gi');
    sanitized = sanitized.replace(regex, '');
    
    // Удаляем самозакрывающиеся теги
    const selfClosingRegex = new RegExp(`<${tag}[^>]*/?>`, 'gi');
    sanitized = sanitized.replace(selfClosingRegex, '');
  });
  
  // Удаляем опасные атрибуты
  const dangerousAttributes = [
    'onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur',
    'onchange', 'onsubmit', 'onreset', 'onselect', 'onkeydown', 'onkeyup',
    'onkeypress', 'onmousedown', 'onmouseup', 'onmousemove', 'onmouseout',
    'oncontextmenu', 'ondblclick', 'onabort', 'onbeforeunload', 'onerror',
    'onhashchange', 'onload', 'onpageshow', 'onpagehide', 'onresize',
    'onscroll', 'onunload', 'onbeforeprint', 'onafterprint'
  ];
  
  dangerousAttributes.forEach(attr => {
    const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });
  
  // Удаляем javascript: протоколы
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Удаляем data: протоколы (кроме безопасных изображений)
  sanitized = sanitized.replace(/data:(?!image\/(png|jpg|jpeg|gif|webp|svg))/gi, '');
  
  return sanitized;
}

// Проверяет, содержит ли HTML потенциально опасный контент
export function isHtmlSafe(html: string): boolean {
  if (!html) return true;
  
  const dangerousPatterns = [
    /<script[^>]*>/i,
    /<iframe[^>]*>/i,
    /<object[^>]*>/i,
    /<embed[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<form[^>]*>/i,
    /<input[^>]*>/i,
    /<button[^>]*>/i
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(html));
}

// Безопасный рендер HTML с санитизацией
export function createSafeHtml(html: string): { __html: string } {
  return {
    __html: sanitizeHtml(html)
  };
}
