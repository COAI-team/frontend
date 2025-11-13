import React from "react";

const LANGUAGES = [
  "javascript",
  "typescript",
  "java",
  "sql",
  "kotlin",
  "c",
  "cpp",
  "python",
  "json",
  "xml",
];

const CodeBlockLangDropdown = ({ language, onChange }) => {
  return (
    <select
      className="bg-[#2a2a2a] text-gray-200 px-2 py-1 rounded"
      value={language}
      onChange={(e) => onChange(e.target.value)}
    >
      {LANGUAGES.map((lang) => (
        <option key={lang} value={lang}>
          {lang.toUpperCase()}
        </option>
      ))}
    </select>
  );
};

export default CodeBlockLangDropdown;
