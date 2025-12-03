/**
 * Monaco Editor 유틸리티 함수들
 * CodeEditor.jsx에서 분리하여 Fast Refresh 문제 해결
 */

// 언어별 Monaco 언어 ID 매핑
export const LANGUAGE_MAP = {
  // C/C++
  'C (Clang)': 'c',
  'C11': 'c',
  'C++17': 'cpp',
  'C++20': 'cpp',
  // Java
  'Java 17': 'java',
  'Java 11': 'java',
  // Python
  'Python 3': 'python',
  'PyPy3': 'python',
  // JS/TS
  'node.js': 'javascript',
  'TypeScript': 'typescript',
  // Others
  'Go': 'go',
  'Rust': 'rust',
  'Kotlin (JVM)': 'kotlin',
  'Swift': 'swift',
  'C#': 'csharp',
  'PHP': 'php',
  'Ruby': 'ruby',
  'SQL': 'sql',
  'Bash': 'shell',
  'Assembly (64bit)': 'plaintext', // Monaco might not support assembly out of box
  'D': 'plaintext',
  'Fortran': 'plaintext',
  'Haskell': 'haskell', // Monaco supports haskell?
  'Lua': 'lua',
  'Objective-C': 'objective-c',
  'OCaml': 'ocaml', // Monaco supports ocaml?
  'Pascal': 'pascal',
  'Perl': 'perl',
  'R': 'r',
  'Scala': 'scala' // Monaco supports scala?
};

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

// 언어별 코드 템플릿
export const codeTemplates = {
  default: `// 여기에 코드를 작성하세요
// 입력을 처리하고 결과를 출력하세요
`,
  'node.js': `// JavaScript (Node.js) 코드를 작성하세요
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (line) => {
  // 입력 처리
  const input = line.trim();
  
  // 여기에 풀이 코드를 작성하세요
  const result = solution(input);
  
  console.log(result);
  rl.close();
});

function solution(input) {
  // TODO: 풀이 로직 구현
  return input;
}
`,

  'Python 3': `# Python 3 코드를 작성하세요
import sys
input = sys.stdin.readline

def solution():
    # 입력 처리
    try:
        line = input().strip()
        if not line:
            return
        n = int(line)
        
        # TODO: 풀이 로직 구현
        result = n
        
        # 출력
        print(result)
    except ValueError:
        pass

if __name__ == "__main__":
    solution()
`,

  'Java 17': `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(System.out));
        
        // 입력 처리
        String line = br.readLine();
        if (line != null) {
            int n = Integer.parseInt(line.trim());
            
            // TODO: 풀이 로직 구현
            int result = solution(n);
            
            // 출력
            bw.write(String.valueOf(result));
            bw.newLine();
        }
        
        bw.flush();
        bw.close();
        br.close();
    }
    
    static int solution(int n) {
        return n;
    }
}
`,

  'C++17': `#include <iostream>
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
    
    // 입력 처리
    int n;
    if (cin >> n) {
        // 풀이 실행
        int result = solution(n);
        
        // 출력
        cout << result << "\\n";
    }
    
    return 0;
}
`,

  'C (Clang)': `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int solution(int n) {
    // TODO: 풀이 로직 구현
    return n;
}

int main() {
    // 입력 처리
    int n;
    if (scanf("%d", &n) == 1) {
        // 풀이 실행
        int result = solution(n);
        
        // 출력
        printf("%d\\n", result);
    }
    
    return 0;
}
`,

  'SQL': `-- SQL 쿼리를 작성하세요
-- 테이블 구조는 문제 설명을 참고하세요
SELECT * FROM TABLE_NAME;
`,

  // Aliases & Other Languages
  'PyPy3': `# PyPy3 코드를 작성하세요
import sys
input = sys.stdin.readline

def solution():
    # 입력 처리
    try:
        line = input().strip()
        if not line:
            return
        n = int(line)
        
        # TODO: 풀이 로직 구현
        result = n
        
        # 출력
        print(result)
    except ValueError:
        pass

if __name__ == "__main__":
    solution()
`,

  'Java 11': `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(System.out));
        
        // 입력 처리
        String line = br.readLine();
        if (line != null) {
            int n = Integer.parseInt(line.trim());
            
            // TODO: 풀이 로직 구현
            int result = solution(n);
            
            // 출력
            bw.write(String.valueOf(result));
            bw.newLine();
        }
        
        bw.flush();
        bw.close();
        br.close();
    }
    
    static int solution(int n) {
        return n;
    }
}
`,

  'C++20': `#include <iostream>
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
    
    // 입력 처리
    int n;
    if (cin >> n) {
        // 풀이 실행
        int result = solution(n);
        
        // 출력
        cout << result << "\\n";
    }
    
    return 0;
}
`,

  'C11': `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int solution(int n) {
    // TODO: 풀이 로직 구현
    return n;
}

int main() {
    // 입력 처리
    int n;
    if (scanf("%d", &n) == 1) {
        // 풀이 실행
        int result = solution(n);
        
        // 출력
        printf("%d\\n", result);
    }
    
    return 0;
}
`,

  'TypeScript': `// TypeScript 코드를 작성하세요
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (line: string) => {
  // 입력 처리
  const input = line.trim();
  
  // 여기에 풀이 코드를 작성하세요
  const result = solution(input);
  
  console.log(result);
  rl.close();
});

function solution(input: string): string | number {
  // TODO: 풀이 로직 구현
  return input;
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

  'Kotlin (JVM)': `import java.util.Scanner

fun solution(n: Int): Int {
    // TODO: 풀이 로직 구현
    return n
}

fun main(args: Array<String>) {
    val sc = Scanner(System.\`in\`)
    if (sc.hasNextInt()) {
        val n = sc.nextInt()
        println(solution(n))
    }
}
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