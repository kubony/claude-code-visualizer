# Agent-Skill Visualizer

Claude Code 프로젝트의 에이전트와 스킬 관계를 D3.js 노드 그래프로 시각화하는 범용 스킬입니다.

## 특징

- 🔍 **자동 스캔**: `.claude/` 폴더에서 에이전트/스킬 메타데이터 추출
- 🎨 **인터랙티브 그래프**: D3.js force-directed 레이아웃
- 📱 **반응형**: 드래그, 줌, 패닝 지원
- 🔎 **검색**: 노드 필터링
- 📋 **상세 정보**: 클릭 시 메타데이터 패널
- 🔄 **범용성**: 어떤 Claude Code 프로젝트에서든 사용 가능

## 빠른 시작

```bash
# 1. 스킬 폴더로 이동
cd .claude/skills/agent-skill-visualizer

# 2. 프로젝트 스캔
python scripts/scan_agents_skills.py ../../../ \
  --output webapp/public/data/graph-data.json

# 3. 웹앱 실행
cd webapp
npm install
npm run dev
```

브라우저에서 http://localhost:5173 접속

## 폴더 구조

```
agent-skill-visualizer/
├── SKILL.md                    # 스킬 정의
├── README.md                   # 이 파일
├── scripts/
│   └── scan_agents_skills.py   # Python 스캐너
└── webapp/
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    ├── public/
    │   └── data/
    │       └── graph-data.json # 생성된 데이터
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── components/
        │   ├── GraphCanvas.tsx # D3.js 그래프
        │   ├── DetailPanel.tsx # 상세 정보
        │   ├── Legend.tsx      # 범례
        │   └── SearchBar.tsx   # 검색
        ├── hooks/
        │   └── useGraphData.ts
        ├── types/
        │   └── graph.ts
        └── styles/
            └── index.css
```

## 스캐너 옵션

```bash
python scripts/scan_agents_skills.py [project_path] [options]

옵션:
  --output, -o    출력 파일 경로 (기본: graph-data.json)

예시:
  # 현재 디렉토리 스캔
  python scripts/scan_agents_skills.py .

  # 특정 프로젝트 스캔
  python scripts/scan_agents_skills.py /path/to/project -o data.json
```

## npm 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 (http://localhost:5173) |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run scan` | 프로젝트 스캔 (상위 폴더) |

## 다른 프로젝트에서 사용하기

1. **스킬 복사**
   ```bash
   cp -r /path/to/agent-skill-visualizer /new/project/.claude/skills/
   ```

2. **데이터 생성**
   ```bash
   cd /new/project/.claude/skills/agent-skill-visualizer
   python scripts/scan_agents_skills.py /new/project \
     --output webapp/public/data/graph-data.json
   ```

3. **웹앱 실행**
   ```bash
   cd webapp
   npm install
   npm run dev
   ```

## 기술 스택

- **스캐너**: Python 3.8+ (표준 라이브러리만 사용)
- **프론트엔드**: React 18 + TypeScript
- **빌드**: Vite 5
- **스타일링**: Tailwind CSS 3
- **시각화**: D3.js 7

## 라이선스

MIT
