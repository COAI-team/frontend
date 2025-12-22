import hljs from 'highlight.js';

// HTML 디코딩
export const decodeHTML = (html) => {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};

// 코드 블록 구조 변환
export const processCodeBlocks = (container, isDark) => {
  // Monaco 코드 블록 처리
  container.querySelectorAll('pre[data-type="monaco-code-block"]').forEach(block => {
    const code = block.dataset.code;
    const language = block.dataset.language || 'plaintext';

    if (code) {
      const decodedCode = decodeHTML(code);

      block.innerHTML = '';
      block.className = 'code-block-wrapper';
      delete block.dataset.type;
      delete block.dataset.code;
      delete block.dataset.language;

      const header = document.createElement('div');
      header.className = 'code-header';
      
      const languageSpan = document.createElement('span');
      languageSpan.className = 'code-language';
      languageSpan.textContent = language; // innerHTML 대신 textContent
      
      header.appendChild(languageSpan);

      const pre = document.createElement('pre');
      pre.style.margin = '0';
      pre.style.backgroundColor = isDark ? '#1e1e1e' : '#f6f8fa';
      
      const codeElement = document.createElement('code');
      codeElement.className = `language-${language}`;
      codeElement.textContent = decodedCode;
      codeElement.style.display = 'block';
      codeElement.style.padding = '1rem';
      codeElement.style.fontSize = '0.875rem';
      codeElement.style.lineHeight = '1.5';
      codeElement.style.fontFamily = 'monospace';

      pre.appendChild(codeElement);
      block.appendChild(header);
      block.appendChild(pre);
    }
  });

  // TipTap 일반 코드 블록 처리
  container.querySelectorAll('pre > code:not([class*="language-"])').forEach(codeElement => {
    if (!codeElement.className.includes('language-')) {
      codeElement.className = 'language-plaintext';
    }
  });
};

// 하이라이팅 적용
export const applyHighlighting = (container) => {
  if (!container) return;

  container.querySelectorAll('code[class*="language-"]:not([data-highlighted])').forEach(block => {
    hljs.highlightElement(block);
  });
};
