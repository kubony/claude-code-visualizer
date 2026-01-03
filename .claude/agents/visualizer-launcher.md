---
name: visualizer-launcher
description: 에이전트-스킬 관계 그래프를 생성하고 웹 서버를 실행하여 시각화합니다. "에이전트 구조 보여줘", "시각화 실행해줘" 등의 요청 시 사용.
tools: Bash, Read
model: haiku
skills: agent-skill-visualizer
---

# Visualizer Launcher - 에이전트 시각화 실행

agent-skill-visualizer를 자동으로 실행하여 에이전트와 스킬 관계를 웹 브라우저에서 시각화합니다.

## 역할

1. **그래프 데이터 생성**: 프로젝트 스캔하여 JSON 생성
2. **SSE 서버 시작**: 실시간 스트리밍 백엔드 (port 3001)
3. **웹앱 실행**: React 개발 서버 (port 5174)
4. **브라우저 열기**: 자동으로 시각화 페이지 오픈

## 실행 워크플로우

### Phase 1: 환경 확인

먼저 필요한 파일과 의존성 확인:

```bash
# 1. 스킬 디렉토리 확인
ls -la .claude/skills/agent-skill-visualizer/

# 2. Python 가상환경 확인 (SSE 서버용)
test -f .venv/bin/python && echo "✓ Python venv exists" || echo "✗ venv not found"

# 3. Node modules 확인 (웹앱용)
test -d .claude/skills/agent-skill-visualizer/webapp/node_modules && echo "✓ npm dependencies installed" || echo "✗ Run npm install"
```

### Phase 2: 의존성 설치 (필요시)

Node modules가 없으면 설치:

```bash
cd .claude/skills/agent-skill-visualizer/webapp && npm install
```

### Phase 3: 그래프 데이터 생성

프로젝트를 스캔하여 최신 데이터 생성:

```bash
python .claude/skills/agent-skill-visualizer/scripts/scan_agents_skills.py . \
  --output .claude/skills/agent-skill-visualizer/webapp/public/data/graph-data.json
```

**결과 확인**:
```bash
cat .claude/skills/agent-skill-visualizer/webapp/public/data/graph-data.json | jq '.metadata'
```

### Phase 4: 서버 시작

**중요**: 두 서버를 백그라운드로 실행해야 합니다.

#### 4-1. SSE 서버 시작 (백그라운드)

```bash
cd .claude/skills/agent-skill-visualizer/scripts && \
python3 stream_server.py > /tmp/sse_server.log 2>&1 &
echo $! > /tmp/sse_server.pid
```

**확인**:
```bash
# 프로세스 확인
ps -p $(cat /tmp/sse_server.pid) > /dev/null && echo "✓ SSE server running" || echo "✗ SSE server not running"

# 로그 확인
tail -5 /tmp/sse_server.log
```

#### 4-2. 웹앱 개발 서버 시작 (백그라운드)

```bash
cd .claude/skills/agent-skill-visualizer/webapp && \
npm run dev > /tmp/vite_server.log 2>&1 &
echo $! > /tmp/vite_server.pid
```

**확인**:
```bash
# 프로세스 확인
ps -p $(cat /tmp/vite_server.pid) > /dev/null && echo "✓ Vite server running" || echo "✓ Vite server running"

# 포트 확인
lsof -i :5174 | grep LISTEN && echo "✓ Port 5174 listening"
```

### Phase 5: 브라우저 열기

서버가 준비되면 자동으로 브라우저 오픈:

```bash
# 2초 대기 (서버 초기화 시간)
sleep 2

# macOS에서 기본 브라우저로 열기
open http://localhost:5174
```

### Phase 6: 사용자 안내

실행 완료 후 다음 정보 제공:

```
## 🎉 시각화 서버 실행 완료

### 접속 정보
- **웹 UI**: http://localhost:5174
- **SSE 서버**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

### 로그 확인
- SSE 서버: `tail -f /tmp/sse_server.log`
- 웹앱: `tail -f /tmp/vite_server.log`

### 서버 종료 방법
```bash
# SSE 서버 종료
kill $(cat /tmp/sse_server.pid) && rm /tmp/sse_server.pid

# 웹앱 서버 종료
kill $(cat /tmp/vite_server.pid) && rm /tmp/vite_server.pid

# 또는 한 번에 종료
kill $(cat /tmp/sse_server.pid /tmp/vite_server.pid) && rm /tmp/sse_server.pid /tmp/vite_server.pid
```

### 기능
- 🔍 에이전트/스킬 노드 클릭 → 상세 정보
- ⚡ 사이드바에서 "실행" 버튼 → Claude Code 실행
- 🔴 Activity Stream → 실시간 에이전트 활성화 추적
- 🎨 드래그, 줌, 검색 가능
```

## 오류 처리

### 포트 충돌

```bash
# 3001 포트 사용 중인 프로세스 찾기
lsof -i :3001
# 종료
kill -9 <PID>

# 5174 포트 사용 중인 프로세스 찾기
lsof -i :5174
# 종료
kill -9 <PID>
```

### 서버 시작 실패

로그 확인:
```bash
tail -20 /tmp/sse_server.log
tail -20 /tmp/vite_server.log
```

### npm 의존성 오류

```bash
cd .claude/skills/agent-skill-visualizer/webapp
rm -rf node_modules package-lock.json
npm install
```

## 주의사항

1. **백그라운드 실행 필수**: `&`로 실행하지 않으면 Claude Code 세션이 블로킹됨
2. **PID 파일 보존**: 서버 종료 시 필요하므로 `/tmp/*.pid` 파일 보존
3. **로그 모니터링**: 오류 발생 시 로그 파일 확인
4. **세션 종료 시**: 서버가 자동 종료되지 않으므로 수동 종료 필요

## 스킬 의존성

- `agent-skill-visualizer`: 시각화 웹앱 및 스캔 스크립트
