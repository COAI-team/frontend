/**
 * Monaco Editor 유틸리티 함수들
 * CodeEditor.jsx에서 분리하여 Fast Refresh 문제 해결
 */

/**
 * 언어별 Monaco 언어 ID 매핑
 * 백엔드 LANGUAGES 테이블과 동기화된 11개 언어만 지원
 * 변경사항 (2025-12-13): 단순화된 언어명 사용
 */
export const LANGUAGE_MAP = {
  'C#': 'csharp',
  'C++': 'cpp',
  'Go': 'go',
  'Java': 'java',
  'JavaScript': 'javascript',
  'Kotlin': 'kotlin',
  'Python': 'python',
  'Rust': 'rust',
  'Swift': 'swift',
  'TypeScript': 'typescript',
  'SQL': 'sql',
};

/**
 * 백엔드 languageName을 codeTemplates 키로 매핑
 * 백엔드 LANGUAGES 테이블과 동기화된 11개 언어만 지원
 * 변경사항 (2025-12-13): 단순화된 언어명 사용
 */
export const LANGUAGE_NAME_TO_TEMPLATE_KEY = {
  'C#': 'C#',
  'C++': 'C++',
  'Go': 'Go',
  'Java': 'Java',
  'JavaScript': 'JavaScript',
  'Kotlin': 'Kotlin',
  'Python': 'Python',
  'Rust': 'Rust',
  'Swift': 'Swift',
  'TypeScript': 'TypeScript',
  'SQL': 'SQL',
};

/**
 * 알고리즘 문제에서 허용되는 언어 목록 (화이트리스트)
 * 백엔드 LANGUAGES 테이블과 동기화된 11개 언어만 지원
 * 변경사항 (2025-12-13): 단순화된 언어명 사용
 */
export const ALLOWED_LANGUAGES = new Set([
  'C#',
  'C++',
  'Go',
  'Java',
  'JavaScript',
  'Kotlin',
  'Python',
  'Rust',
  'Swift',
  'TypeScript',
  'SQL',
]);

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
  getAllText: (editor) => editor?.getValue() || '',

  // 특정 라인으로 이동
  goToLine: (editor, lineNumber) => {
    if (!editor) return;
    editor.revealLine(lineNumber);
    editor.setPosition({ lineNumber, column: 1 });
    editor.focus();
  },

  // 코드 포맷팅
  formatCode: (editor) => {
    editor?.getAction('editor.action.formatDocument')?.run();
  },

  // 전체 선택
  selectAll: (editor) => {
    editor?.getAction('editor.action.selectAll')?.run();
  },

  // 에디터 포커스
  focusEditor: (editor) => editor?.focus(),

  // 줄 수 가져오기
  getLineCount: (editor) => editor?.getModel()?.getLineCount() || 0,

  // 커서 위치 가져오기
  getCursorPosition: (editor) => {
    if (!editor) return { line: 1, column: 1 };
    const pos = editor.getPosition();
    return { line: pos.lineNumber, column: pos.column };
  },

  // 에러 마커 추가
  addErrorMarker: (editor, monaco, line, message) => {
    if (!editor || !monaco) return;
    const model = editor.getModel();
    monaco.editor.setModelMarkers(model, 'error', [{
      startLineNumber: line,
      startColumn: 1,
      endLineNumber: line,
      endColumn: model.getLineMaxColumn(line),
      message,
      severity: monaco.MarkerSeverity.Error
    }]);
  },

  // 마커 초기화
  clearMarkers: (editor, monaco) => {
    if (!editor || !monaco) return;
    monaco.editor.setModelMarkers(editor.getModel(), 'error', []);
  }
};

/**
 * 언어별 코드 템플릿
 * 백엔드 LANGUAGES 테이블과 동기화된 11개 언어만 지원
 * 변경사항 (2025-12-13): 단순화된 언어명 사용
 */
export const codeTemplates = {
  default: `// 여기에 코드를 작성하세요
// 입력을 처리하고 결과를 출력하세요
`,

  'C#': `using System;

class Program {
    static int Solution(int n) {
        // TODO: 풀이 로직 구현
        return n;
    }

    static void Main() {
        string line = Console.ReadLine();
        if (!string.IsNullOrEmpty(line)) {
            int n = int.Parse(line.Trim());
            int result = Solution(n);
            Console.WriteLine(result);
        }
    }
}
`,

  'C++': `#include <iostream>
#include <vector>
#include <algorithm>
#include <string>
using namespace std;

int solution(int n) {
    // TODO: 풀이 로직 구현
    return n;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    cout.tie(NULL);

    int n;
    if (cin >> n) {
        int result = solution(n);
        cout << result << "\\n";
    }

    return 0;
}
`,

  'Go': `package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

func solution(n int) int {
	// TODO: 풀이 로직 구현
	return n
}

func main() {
	reader := bufio.NewReader(os.Stdin)
	line, _ := reader.ReadString('\\n')
	line = strings.TrimSpace(line)

	if line != "" {
		n, _ := strconv.Atoi(line)
		result := solution(n)
		fmt.Println(result)
	}
}
`,

  'Java': `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(System.out));

        String line = br.readLine();
        if (line != null) {
            int n = Integer.parseInt(line.trim());
            int result = solution(n);
            bw.write(String.valueOf(result));
            bw.newLine();
        }

        bw.flush();
        bw.close();
        br.close();
    }

    static int solution(int n) {
        // TODO: 풀이 로직 구현
        return n;
    }
}
`,

  'JavaScript': `const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (line) => {
  const input = line.trim();
  const result = solution(input);
  console.log(result);
  rl.close();
});

function solution(input) {
  // TODO: 풀이 로직 구현
  return input;
}
`,

  'Kotlin': `import java.util.Scanner

fun solution(n: Int): Int {
    // TODO: 풀이 로직 구현
    return n
}

fun main() {
    val sc = Scanner(System.\`in\`)
    if (sc.hasNextInt()) {
        val n = sc.nextInt()
        println(solution(n))
    }
}
`,

  'Python': `import sys
input = sys.stdin.readline

def solution():
    try:
        line = input().strip()
        if not line:
            return
        n = int(line)

        # TODO: 풀이 로직 구현
        result = n

        print(result)
    except ValueError:
        pass

if __name__ == "__main__":
    solution()
`,

  'Rust': `use std::io::{self, BufRead};

fn solution(n: i32) -> i32 {
    // TODO: 풀이 로직 구현
    n
}

fn main() {
    let stdin = io::stdin();
    let mut lines = stdin.lock().lines();

    if let Some(Ok(line)) = lines.next() {
        if let Ok(n) = line.trim().parse::<i32>() {
            let result = solution(n);
            println!("{}", result);
        }
    }
}
`,

  'Swift': `import Foundation

func solution(_ n: Int) -> Int {
    // TODO: 풀이 로직 구현
    return n
}

if let line = readLine(), let n = Int(line.trimmingCharacters(in: .whitespaces)) {
    let result = solution(n)
    print(result)
}
`,

  'TypeScript': `const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (line: string) => {
  const input = line.trim();
  const result = solution(input);
  console.log(result);
  rl.close();
});

function solution(input: string): string | number {
  // TODO: 풀이 로직 구현
  return input;
}
`,

  'SQL': `-- SQL 쿼리를 작성하세요
-- 테이블 구조는 문제 설명을 참고하세요
SELECT * FROM TABLE_NAME;
`
};

// ✅ 기본 에디터 옵션을 먼저 별도 상수로 정의
const BASE_EDITOR_OPTIONS = {
  selectOnLineNumbers: true,
  automaticLayout: true,
  scrollBeyondLastLine: false,
  minimap: { enabled: false },
  fontSize: 14,
  fontFamily: '"Fira Code", "JetBrains Mono", "Monaco", "Menlo", monospace',
  fontLigatures: true,
  lineNumbers: 'on',
  wordWrap: 'on',
  insertSpaces: true,
  renderWhitespace: 'boundary',
  bracketPairColorization: { enabled: true },
  formatOnPaste: true,
  formatOnType: true,
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnEnter: 'on',
  tabCompletion: 'on',
  cursorBlinking: 'smooth',
  cursorSmoothCaretAnimation: 'on',
  smoothScrolling: true,
  padding: { top: 16, bottom: 16 },
  scrollbar: {
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10
  }
};

// Monaco Editor 설정 옵션들
export const editorOptions = {
  base: BASE_EDITOR_OPTIONS,

  // 언어별 특별 설정
  getLanguageOptions: (language) => {
    switch (language) {
      case 'python':
      case 'java':
        return { ...BASE_EDITOR_OPTIONS, tabSize: 4 };
      default:
        return { ...BASE_EDITOR_OPTIONS, tabSize: 2 };
    }
  },

  // 읽기 전용 모드
  readOnly: {
    ...BASE_EDITOR_OPTIONS,
    readOnly: true,
    domReadOnly: true,
    cursorStyle: 'line-thin'
  }
};

// 코드 통계 계산
export const getCodeStats = (code) => {
  if (!code) return { lines: 0, chars: 0, words: 0 };
  const lines = code.split('\n').length;
  const chars = code.length;
  const words = code.trim().split(/\s+/).filter(Boolean).length;
  return { lines, chars, words };
};

// 시간 포맷팅
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};