/**
 * Monaco Editor 유틸리티 함수들
 * CodeEditor.jsx에서 분리하여 Fast Refresh 문제 해결
 */

// 언어별 Monaco 언어 ID 매핑
export const LANGUAGE_MAP = {
  // C/C++
  'C (Clang)': 'c',
  'C11': 'c',
  'C17': 'c',
  'C23': 'c',
  'C90': 'c',
  'C99': 'c',
  'C++17': 'cpp',
  'C++20': 'cpp',
  'C++ (Clang)': 'cpp',
  'C++11': 'cpp',
  'C++14': 'cpp',
  'C++23': 'cpp',
  'C++26': 'cpp',
  'C++98': 'cpp',
  // Java
  'Java 17': 'java',
  'Java 11': 'java',
  'Java (JDK 17)': 'java',
  'Java (JDK 21)': 'java',
  'Java 15': 'java',
  'Java 19': 'java',
  'Java 21': 'java',
  'Java 8': 'java',
  'Java 8 (OpenJDK)': 'java',
  // Python
  'Python 3': 'python',
  'Python 2': 'python',
  'PyPy3': 'python',
  'PyPy2': 'python',
  // JS/TS
  'node.js': 'javascript',
  'TypeScript': 'typescript',
  // Others
  'Go': 'go',
  'Rust': 'rust',
  'Rust 2018': 'rust',
  'Rust 2021': 'rust',
  'Kotlin (JVM)': 'kotlin',
  'Kotlin (Native)': 'kotlin',
  'Swift': 'swift',
  'Swift (Apple)': 'swift',
  'C#': 'csharp',
  'MonoDevelop C#': 'csharp',
  'PHP': 'php',
  'Ruby': 'ruby',
  'SQL': 'sql',
  'Bash': 'shell',
  'Haskell': 'haskell',
  'Lua': 'lua',
  'Objective-C': 'objective-c',
  'Objective-C++': 'objective-c',
  'OCaml': 'ocaml',
  'Pascal': 'pascal',
  'Pascal (FPC)': 'pascal',
  'Perl': 'perl',
  'Perl 6': 'perl',
  'R': 'r',
  'Scala': 'scala',
  // Unsupported (plaintext)
  'Assembly (64bit)': 'plaintext',
  'Assembly (32bit)': 'plaintext',
  'D': 'plaintext',
  'D (LDC)': 'plaintext',
  'Fortran': 'plaintext',
  'Ada': 'plaintext',
  'Algol 68': 'plaintext',
  'AWK': 'plaintext',
  'Befunge': 'plaintext',
  'Brainf**k': 'plaintext',
  'Ceylon': 'plaintext',
  'Clojure': 'plaintext',
  'Cobol': 'plaintext',
  'Cobra': 'plaintext',
};

// 백엔드 languageName을 codeTemplates 키로 매핑
export const LANGUAGE_NAME_TO_TEMPLATE_KEY = {
  // C variants -> use 'C (Clang)' template
  'C (Clang)': 'C (Clang)',
  'C11': 'C11',
  'C17': 'C (Clang)',
  'C23': 'C (Clang)',
  'C90': 'C (Clang)',
  'C99': 'C (Clang)',
  'C#': 'C (Clang)', // C# uses C template as fallback
  // C++ variants -> use specific templates
  'C++ (Clang)': 'C++17',
  'C++11': 'C++17',
  'C++14': 'C++17',
  'C++17': 'C++17',
  'C++20': 'C++20',
  'C++23': 'C++20',
  'C++26': 'C++20',
  'C++98': 'C++17',
  // Java variants -> use 'Java 17' template
  'Java (JDK 17)': 'Java 17',
  'Java (JDK 21)': 'Java 17',
  'Java 11': 'Java 11',
  'Java 15': 'Java 17',
  'Java 17': 'Java 17',
  'Java 19': 'Java 17',
  'Java 21': 'Java 17',
  'Java 8': 'Java 17',
  'Java 8 (OpenJDK)': 'Java 17',
  // Python variants
  'Python 2': 'Python 3',
  'Python 3': 'Python 3',
  'PyPy2': 'PyPy3',
  'PyPy3': 'PyPy3',
  // JavaScript/TypeScript
  'node.js': 'node.js',
  'TypeScript': 'TypeScript',
  'MonoDevelop C#': 'node.js', // Fallback
  // Others
  'Go': 'Go',
  'Rust': 'Rust',
  'Rust 2018': 'Rust',
  'Rust 2021': 'Rust',
  'Kotlin (JVM)': 'Kotlin (JVM)',
  'Kotlin (Native)': 'Kotlin (JVM)',
  'Swift': 'C++17', // Fallback to C++ template
  'Swift (Apple)': 'C++17',
  'PHP': 'Python 3', // Fallback
  'Ruby': 'Python 3', // Fallback
  'Bash': 'Python 3', // Fallback
  'Haskell': 'Python 3', // Fallback
  'Lua': 'Python 3', // Fallback
  'Objective-C': 'C (Clang)',
  'Objective-C++': 'C++17',
  'OCaml': 'Python 3', // Fallback
  'Pascal': 'C (Clang)', // Fallback
  'Pascal (FPC)': 'C (Clang)',
  'Perl': 'Python 3', // Fallback
  'Perl 6': 'Python 3',
  'SQL': 'SQL',
};

// 알고리즘 문제에서 허용되는 언어 목록 (화이트리스트)
export const ALLOWED_LANGUAGES = new Set([
  'C++17',
  'C++20',
  'C++ (Clang)',
  'C++11',
  'C++14',
  'Java 17',
  'Java 11',
  'Java (JDK 17)',
  'Java (JDK 21)',
  'Python 3',
  'Python 2',
  'node.js',
  'TypeScript',
  'C#',
  'MonoDevelop C#',
  'C (Clang)',
  'C11',
  'Go',
  'Kotlin (JVM)',
  'Swift',
  'Swift (Apple)',
  'Rust',
  'Rust 2018',
  'Rust 2021',
  'Ruby',
  'PHP',
  // Note: Dart, Scala, Elixir, Erlang, Racket이 백엔드 데이터에 없음
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