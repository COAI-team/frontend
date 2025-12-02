import React, { useEffect, useState } from "react";

const LANGUAGES = [
  // 알고리즘 문제 풀이용
  { value: "python", label: "Python" },
  { value: "python3", label: "Python3" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "csharp", label: "C#" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "kotlin", label: "Kotlin" },
  { value: "swift", label: "Swift" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "ruby", label: "Ruby" },
  { value: "php", label: "PHP" },
  { value: "dart", label: "Dart" },
  { value: "scala", label: "Scala" },
  { value: "elixir", label: "Elixir" },
  { value: "erlang", label: "Erlang" },
  { value: "racket", label: "Racket" },

  // 일반 코드/설정 파일용
  { value: "sql", label: "SQL" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "xml", label: "XML" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
  { value: "shell", label: "Shell" },
];

const CodeBlockLangDropdown = ({ language, onChange }) => {
  const [isDark, setIsDark] = useState(false);

  // 다크모드 감지
  useEffect(() => {
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

  return (
    <select
      className="px-2 py-1 rounded text-sm border transition-colors duration-200"
      style={{
        backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
        color: isDark ? '#e1e1e1' : '#1f2328',
        borderColor: isDark ? '#444444' : '#d0d7de'
      }}
      value={language}
      onChange={(e) => onChange(e.target.value)}
    >
      {LANGUAGES.map((lang) => (
        <option 
          key={lang.value} 
          value={lang.value}
        >
          {lang.label}
        </option>
      ))}
    </select>
  );
};

export default CodeBlockLangDropdown;