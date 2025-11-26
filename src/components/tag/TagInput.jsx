import React, { useState, useRef, useEffect } from "react";

const TagInput = ({ tags = [], onChange, maxTags = 5, isDark }) => {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  // 태그 유효성 검사
  const validateTag = (tag) => {
    const trimmed = tag.trim();
    
    if (!trimmed) {
      return { valid: false, message: "태그를 입력하세요." };
    }
    
    if (trimmed.length < 2) {
      return { valid: false, message: "태그는 2자 이상이어야 합니다." };
    }
    
    if (trimmed.length > 20) {
      return { valid: false, message: "태그는 20자를 초과할 수 없습니다." };
    }
    
    // 특수문자 검사 (한글, 영문, 숫자, 하이픈, 언더스코어만 허용)
    const specialCharPattern = /[^가-힣a-zA-Z0-9\-_]/;
    if (specialCharPattern.test(trimmed)) {
      return { valid: false, message: "태그에 사용할 수 없는 문자가 포함되어 있습니다." };
    }
    
    if (tags.includes(trimmed)) {
      return { valid: false, message: "이미 추가된 태그입니다." };
    }
    
    if (tags.length >= maxTags) {
      return { valid: false, message: `태그는 최대 ${maxTags}개까지만 가능합니다.` };
    }
    
    return { valid: true, tag: trimmed };
  };

  // 태그 추가
  const addTag = (tag) => {
    const validation = validateTag(tag);
    
    if (validation.valid) {
      onChange([...tags, validation.tag]);
      setInputValue("");
      setError("");
    } else {
      setError(validation.message);
      setTimeout(() => setError(""), 2000);
    }
  };

  // 태그 삭제
  const removeTag = (indexToRemove) => {
    onChange(tags.filter((_, index) => index !== indexToRemove));
    setError("");
  };

  // 키 입력 처리
  const handleKeyDown = (e) => {
    const value = e.target.value;
    
    // Enter 또는 쉼표로 태그 추가
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (value.trim()) {
        addTag(value);
      }
    }
    
    // Backspace로 마지막 태그 삭제
    if (e.key === "Backspace" && !value && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  // 입력값 변경 처리
  const handleInputChange = (e) => {
    const value = e.target.value;
    // 앞뒤 공백 제거한 값만 허용
    if (value !== value.trim() && value.length > 0) {
      return;
    }
    setInputValue(value);
    if (error) setError("");
  };

  return (
    <div className="w-full">
      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        🏷️ 태그 (최대 {maxTags}개)
      </label>
      
      <div
        onClick={() => inputRef.current?.focus()}
        className={`
          min-h-[2.5rem] p-2 rounded-lg border cursor-text
          flex flex-wrap gap-2 items-center
          ${isDark 
            ? 'bg-gray-800 border-gray-600 focus-within:border-blue-500' 
            : 'bg-white border-gray-300 focus-within:border-blue-500'
          }
          ${error ? 'border-red-500' : ''}
        `}
      >
        {/* 태그 칩들 */}
        {tags.map((tag, index) => (
          <span
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              removeTag(index);
            }}
            className={`
              inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm
              cursor-pointer transition-all
              ${isDark
                ? 'bg-blue-900 text-blue-200 hover:bg-blue-800'
                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              }
            `}
          >
            #{tag}
          </span>
        ))}
        
        {/* 입력 필드 */}
        {tags.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? "태그를 입력하세요 (Enter 또는 쉼표로 추가)" : ""}
            className={`
              flex-1 min-w-[200px] outline-none bg-transparent text-sm
              ${isDark ? 'text-gray-200 placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}
            `}
            maxLength={20}
          />
        )}
      </div>
      
      {/* 에러 메시지 */}
      {error && (
        <p className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}
      
      {/* 안내 메시지 */}
      <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
        {tags.length}/{maxTags} · Enter 또는 쉼표(,)로 추가 · 태그 클릭 또는 Backspace로 삭제
      </p>
    </div>
  );
};

export default TagInput;