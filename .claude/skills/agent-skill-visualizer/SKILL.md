---
name: agent-skill-visualizer
description: Claude Code 프로젝트의 에이전트와 스킬 관계를 D3.js 노드 그래프로 시각화합니다. 에이전트-스킬 의존성을 파악하고 구조를 탐색할 때 사용하세요.
---

# Agent-Skill Visualizer

Claude Code 프로젝트의 `.claude/` 폴더 구조를 분석하여 에이전트와 스킬 간의 관계를 인터랙티브한 노드 그래프로 시각화합니다.

## 사용 시점

- "에이전트 구조 보여줘"
- "스킬 의존성 확인해줘"
- "에이전트와 스킬 관계 시각화해줘"
- "프로젝트 구조 그래프로 보고 싶어"

## 실행 방법

### 1. 데이터 생성 (Python 스캐너)

```bash
cd .claude/skills/agent-skill-visualizer

# 현재 프로젝트 스캔
python scripts/scan_agents_skills.py ../../../ --output webapp/public/data/graph-data.json

# 다른 프로젝트 스캔
python scripts/scan_agents_skills.py /path/to/other/project --output graph-data.json
```

### 2. 웹앱 실행

```bash
cd webapp
npm install
npm run dev
# → http://localhost:5173
```

### 3. 빌드 후 배포

```bash
npm run build
# dist/ 폴더에 정적 파일 생성
npx serve dist
```

## 기능

- **노드 그래프**: D3.js force-directed 레이아웃
- **드래그 & 줌**: 노드 위치 조정, 확대/축소
- **노드 타입**: 🤖 Agent (파란색), 🔧 Skill (초록색)
- **연결 타입**: uses (실선), depends (점선)
- **검색**: 노드 이름/설명으로 필터링
- **상세 패널**: 노드 클릭 시 메타데이터 표시

## 범용성

이 스킬은 다른 Claude Code 프로젝트에서도 사용할 수 있습니다:

1. 스킬 폴더를 복사: `cp -r agent-skill-visualizer /new/project/.claude/skills/`
2. 데이터 생성: `python scripts/scan_agents_skills.py /new/project`
3. 웹앱 실행: `cd webapp && npm run dev`

## 출력 데이터 형식

```json
{
  "nodes": [
    { "id": "agent:name", "type": "agent", "name": "...", ... },
    { "id": "skill:name", "type": "skill", "name": "...", ... }
  ],
  "edges": [
    { "source": "agent:x", "target": "skill:y", "type": "uses" }
  ],
  "metadata": {
    "projectName": "...",
    "agentCount": 5,
    "skillCount": 6
  }
}
```
