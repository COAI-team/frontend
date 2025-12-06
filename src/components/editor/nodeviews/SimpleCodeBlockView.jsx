import React, { useEffect, useRef } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import Prism from 'prismjs';

import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';

import '../../../styles/simplecodeblock.css';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'html', label: 'HTML', prismLang: 'markup' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'json', label: 'JSON' },
  { value: 'plaintext', label: 'Plain Text' },
];

const SimpleCodeBlockView = ({ node, updateAttributes }) => {
  const [isDark, setIsDark] = React.useState(false);
  const preRef = useRef(null);

  React.useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (preRef.current) {
      const codeElement = preRef.current.querySelector('code');
      if (codeElement) {
        Prism.highlightElement(codeElement);
      }
    }
  }, [node.textContent, node.attrs.language]);

  const language = node.attrs.language || 'plaintext';
  const langConfig = LANGUAGES.find(l => l.value === language);
  const prismLanguage = langConfig?.prismLang || language;

  return (
    <NodeViewWrapper className="simple-code-block-wrapper">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem 0.75rem',
          fontSize: '0.75rem',
        }}
      >
        <span style={{ 
          color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
          fontWeight: 500,
          fontSize: '0.7rem',
          letterSpacing: '0.5px'
        }}>
          CODE
        </span>
        <select
          contentEditable={false}
          suppressContentEditableWarning
          value={language}
          onChange={(e) => {
            e.preventDefault();
            updateAttributes({ language: e.target.value });
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>
      <pre ref={preRef}>
        <NodeViewContent 
          as="code" 
          className={`language-${prismLanguage}`}
        />
      </pre>
    </NodeViewWrapper>
  );
};

export default SimpleCodeBlockView;