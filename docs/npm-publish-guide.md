# npm 패키지 배포 가이드

이 문서는 `viewcc` npm 패키지의 구조와 배포 방법을 설명합니다.

---

## 패키지 정보

| 항목 | 값 |
|------|-----|
| **패키지명** | `viewcc` |
| **npm 링크** | https://www.npmjs.com/package/viewcc |
| **사용법** | `npx viewcc` |
| **Node.js 요구사항** | >= 18.0.0 |

---

## 프로젝트 구조

```
claude-code-visualizer/
├── package.json          # npm 패키지 설정 (viewcc)
├── tsconfig.json         # TypeScript 설정
├── bin/
│   └── claude-viz.js     # CLI 진입점 (#!/usr/bin/env node)
├── src/                  # TypeScript 소스
│   ├── cli.ts            # CLI 메인 로직
│   ├── scanner.ts        # 에이전트/스킬 스캐너
│   ├── server.ts         # Express 서버
│   └── utils.ts          # 유틸리티 함수
├── lib/                  # 컴파일된 JavaScript (tsc 출력)
│   ├── cli.js
│   ├── scanner.js
│   ├── server.js
│   └── utils.js
├── dist/                 # 웹앱 빌드 결과 (복사됨)
│   └── assets/
└── .claude/skills/agent-skill-visualizer/webapp/
    ├── package.json      # 웹앱 package.json
    └── dist/             # Vite 빌드 출력
```

---

## package.json 핵심 설정

### 1. 기본 정보

```json
{
  "name": "viewcc",
  "version": "1.6.1",
  "description": "Interactive graph visualization for Claude Code agents and skills",
  "main": "./lib/cli.js",
  "type": "module"
}
```

### 2. CLI 바이너리 설정

```json
{
  "bin": {
    "viewcc": "./bin/claude-viz.js"
  }
}
```

`npx viewcc` 실행 시 `bin/claude-viz.js`가 호출됩니다.

### 3. 배포 파일 목록

```json
{
  "files": [
    "bin/",      # CLI 진입점
    "lib/",      # 컴파일된 JS
    "dist/",     # 웹앱 빌드
    "README.md",
    "LICENSE"
  ]
}
```

`npm publish` 시 위 파일들만 패키지에 포함됩니다.

### 4. 빌드 스크립트

```json
{
  "scripts": {
    "build": "tsc && npm run build:webapp && npm run copy:dist",
    "build:webapp": "cd .claude/skills/agent-skill-visualizer/webapp && npm run build",
    "copy:dist": "mkdir -p dist && cp -r .claude/skills/agent-skill-visualizer/webapp/dist/* dist/",
    "prepublishOnly": "npm run build"
  }
}
```

| 스크립트 | 설명 |
|---------|------|
| `build` | 전체 빌드 (TS + 웹앱 + 복사) |
| `build:webapp` | React 웹앱 빌드 (Vite) |
| `copy:dist` | 웹앱 빌드 결과를 루트 dist/로 복사 |
| `prepublishOnly` | `npm publish` 전 자동 빌드 |

---

## 빌드 프로세스

### 전체 빌드 흐름

```
1. tsc
   └── src/*.ts → lib/*.js (TypeScript 컴파일)

2. npm run build:webapp
   └── webapp/src/* → webapp/dist/* (Vite 빌드)

3. npm run copy:dist
   └── webapp/dist/* → ./dist/* (루트로 복사)
```

### 수동 빌드

```bash
# 전체 빌드
npm run build

# TypeScript만 빌드
npx tsc

# 웹앱만 빌드
cd .claude/skills/agent-skill-visualizer/webapp
npm run build
```

---

## 버전 업 & 배포

### 1. 버전 규칙 (Semantic Versioning)

| 변경 유형 | 버전 증가 | 예시 |
|----------|----------|------|
| 버그 수정 | patch | 1.6.0 → 1.6.1 |
| 새 기능 | minor | 1.6.0 → 1.7.0 |
| 호환성 깨짐 | major | 1.6.0 → 2.0.0 |

### 2. 버전 업 체크리스트

**두 개의 package.json 버전을 동기화해야 합니다:**

1. **루트 package.json** (npm 배포용)
   ```
   ./package.json → "version": "1.6.1"
   ```

2. **웹앱 package.json** (내부 참조용)
   ```
   .claude/skills/agent-skill-visualizer/webapp/package.json → "version": "1.6.1"
   ```

### 3. 버전 업 명령어

```bash
# 루트 버전 업
npm version patch  # 1.6.0 → 1.6.1
npm version minor  # 1.6.0 → 1.7.0
npm version major  # 1.6.0 → 2.0.0

# 웹앱 버전 수동 동기화
cd .claude/skills/agent-skill-visualizer/webapp
# package.json의 version 필드 수정
```

### 4. 배포 명령어

```bash
# 배포 (2FA 인증 필요)
npm publish --access public
```

> **참고**: `prepublishOnly` 스크립트가 자동으로 `npm run build`를 실행합니다.

### 5. 배포 전 테스트

```bash
# 로컬 테스트
npm run build
npm link
viewcc

# 다른 프로젝트에서 테스트
cd /path/to/other/project
npx viewcc
```

---

## Git 태그 관리

버전 배포 시 Git 태그도 함께 생성합니다:

```bash
# 태그 생성
git tag v1.6.1

# 태그 푸시
git push --tags

# 또는 한 번에
git tag v1.6.1 && git push && git push --tags
```

---

## 문제 해결

### 이미 배포된 버전 오류

```
npm error You cannot publish over the previously published versions: 1.6.0
```

**해결**: `package.json`의 버전을 올려야 합니다.

### 빌드 실패

```bash
# node_modules 재설치
rm -rf node_modules package-lock.json
npm install

# 웹앱도 재설치
cd .claude/skills/agent-skill-visualizer/webapp
rm -rf node_modules package-lock.json
npm install
```

### TypeScript 오류

```bash
# 타입 체크
npx tsc --noEmit

# 빌드 (오류 무시하고 JS 생성)
npx tsc
```

---

## 참고 링크

- [npm publish 공식 문서](https://docs.npmjs.com/cli/v10/commands/npm-publish)
- [Semantic Versioning](https://semver.org/lang/ko/)
- [package.json 설정](https://docs.npmjs.com/cli/v10/configuring-npm/package-json)
