# Code-Nemsy Frontend

Code-Nemsy 프론트엔드는 React.js 기반으로 1vs1 코딩 배틀, 알고리즘 문제 풀이, AI 코드 분석, 커뮤니티 기능을 제공합니다. Vite.js 빌드 도구와 Tailwind CSS로 빠르고 반응형 UI를 구현했습니다.

## 기술 스택
프론트엔드는 현대적인 React 생태계를 활용하여 개발되었습니다.

- **프레임워크**: React.js (함수형 컴포넌트 & Hooks)
- **빌드 도구**: Vite.js
- **스타일링**: Tailwind CSS
- **인증**: GitHub OAuth, JWT 토큰 관리
- **상태 관리**: React Context (LoginContext, ThemeContext)
- **에디터**: Monaco Editor (코드 하이라이팅, 자동완성)
- **실시간 통신**: WebSocket (배틀, 튜터 모드)
- **배포**: Vercel (code-nemsy-frontend.vercel.app)

## 주요 기능
다양한 학습 및 커뮤니티 기능을 React 컴포넌트로 모듈화하여 구현했습니다.

- **GitHub OAuth 로그인**: 콜백 처리 및 계정 연동 (needLink 상태 관리)
- **알고리즘 문제 풀이**: Tutor 모드, 집중 모드, Monaco Editor 통합
- **1vs1 코딩 배틀**: Redis 연동 실시간 상태 동기화, WebSocket 푸시
- **AI 코드 분석**: GitHub 연동, RAG 기반 피드백, Langfuse 모니터링
- **커뮤니티**: 자유/코드 게시판, 태그 시스템, 통합 에디터 (이미지, 표, 이모티콘)
- **챗봇**: OpenAI API 연동 실시간 대화
- **결제**: Toss Payments 위젯 통합

## 핵심 Hooks & Context
상태 관리와 사용자 경험을 최적화한 커스텀 훅을 사용합니다.

- **LoginContext**: 인증 상태 전역 관리, LocalStorage 동기화
- **ThemeContext**: next-themes 기반 다크모드 전환
- **OAuth Hooks**: GitHub 로그인 흐름 및 리다이렉트 제어
- **WebSocket Hooks**: 배틀 상태 실시간 업데이트, Grace Period 처리

## 배포 (Vercel)
개발 중 발생한 주요 이슈와 해결 방법을 문서화했습니다.

- **TDZ 에러**: 변수 선언 순서 조정으로 해결
- **ThemeContext 지연**: Context 초기화 최적화
- **WebSocket 재연결**: SSE 중복 차감 방지 로직 추가 (Redis 마커)
- **XSS 방어**: React 자동 이스케이프 + 백엔드 화이트리스트 검증
