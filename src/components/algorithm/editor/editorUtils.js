/**
 * Monaco Editor 유틸리티 함수들
 * CodeEditor.jsx에서 분리하여 Fast Refresh 문제 해결
 */

// 에디터 유틸리티 함수들
export const editorUtils = {
    // 커서 위치에 텍스트 삽입
    insertTextAtCursor: (editor, monaco, text) => {
      if (!editor || !monaco) return;
      
      const selection = editor.getSelection();
      const range = new monaco.Range(
        selection.startLineNumber,
        selection.startColumn,
        selection.endLineNumber,
        selection.endColumn
      );
      editor.executeEdits("", [{ range, text }]);
    },
  
    // 선택된 텍스트 가져오기
    getSelectedText: (editor) => {
      if (!editor) return '';
      const selection = editor.getSelection();
      return editor.getModel().getValueInRange(selection);
    },
  
    // 전체 텍스트 가져오기
    getAllText: (editor) => {
      if (!editor) return '';
      return editor.getValue();
    },
  
    // 특정 라인으로 이동
    goToLine: (editor, lineNumber) => {
      if (!editor) return;
      editor.revealLine(lineNumber);
      editor.setPosition({ lineNumber, column: 1 });
    },
  
    // 코드 포맷팅
    formatCode: (editor) => {
      if (!editor) return;
      editor.getAction('editor.action.formatDocument').run();
    },
  
    // 전체 선택
    selectAll: (editor) => {
      if (!editor) return;
      editor.getAction('editor.action.selectAll').run();
    },
  
    // 에디터 포커스
    focusEditor: (editor) => {
      if (!editor) return;
      editor.focus();
    }
  };
  
  // 언어별 코드 템플릿
  export const codeTemplates = {
    javascript: `// JavaScript 코드를 작성하세요
  function solution() {
      // 여기에 코드를 작성하세요
      
  }
  
  solution();`,
  
    python: `# Python 코드를 작성하세요
  def solution():
      # 여기에 코드를 작성하세요
      pass
  
  solution()`,
  
    java: `public class Solution {
      public static void main(String[] args) {
          // Java 코드를 작성하세요
          
      }
  }`,
  
    cpp: `#include <iostream>
  using namespace std;
  
  int main() {
      // C++ 코드를 작성하세요
      
      return 0;
  }`,
  
    c: `#include <stdio.h>
  
  int main() {
      // C 코드를 작성하세요
      
      return 0;
  }`
  };
  
  // Monaco Editor 설정 옵션들
  export const editorOptions = {
    base: {
      selectOnLineNumbers: true,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      minimap: { enabled: false },
      fontSize: 14,
      fontFamily: '"Fira Code", "Monaco", "Menlo", monospace',
      lineNumbers: 'on',
      wordWrap: 'on',
      insertSpaces: true,
      renderWhitespace: 'boundary',
      bracketPairColorization: { enabled: true },
      formatOnPaste: true,
      formatOnType: true,
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      tabCompletion: 'on'
    },
  
    // 언어별 특별 설정
    getLanguageOptions: (language) => {
      const baseOptions = editorOptions.base;
      
      switch (language) {
        case 'python':
          return { ...baseOptions, tabSize: 4 };
        case 'java':
          return { ...baseOptions, tabSize: 4 };
        default:
          return { ...baseOptions, tabSize: 2 };
      }
    }
  };