#!/usr/bin/env python3
"""
SSE (Server-Sent Events) 서버.

.claude/stream.jsonl 파일을 tail하며 실시간으로 브라우저에 스트리밍합니다.

Usage:
    python stream_server.py [--port PORT] [--log-file PATH]

Examples:
    python stream_server.py
    python stream_server.py --port 3001
    python stream_server.py --log-file /path/to/.claude/stream.jsonl
"""

import argparse
import os
import subprocess
import sys
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
from pathlib import Path
import threading
import json

# 기본 설정
DEFAULT_PORT = 3001
SCRIPT_DIR = Path(__file__).parent
# scripts -> agent-skill-visualizer -> skills -> .claude -> obsidian
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent.parent
DEFAULT_LOG_FILE = PROJECT_ROOT / ".claude" / "stream.jsonl"


class SSEHandler(BaseHTTPRequestHandler):
    """SSE 요청 핸들러"""

    log_file = DEFAULT_LOG_FILE

    def do_GET(self):
        if self.path == "/events":
            self.send_sse_response()
        elif self.path == "/health":
            self.send_health_response()
        elif self.path == "/":
            self.send_index_response()
        else:
            self.send_error(404, "Not Found")

    def do_POST(self):
        """POST 요청 처리"""
        if self.path == "/api/execute":
            self.handle_execute()
        else:
            self.send_error(404, "Not Found")

    def do_OPTIONS(self):
        """CORS preflight 처리"""
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def send_cors_headers(self):
        """CORS 헤더 추가"""
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def send_sse_response(self):
        """SSE 스트림 응답"""
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.send_cors_headers()
        self.end_headers()

        # 로그 파일이 없으면 생성
        if not self.log_file.exists():
            self.log_file.parent.mkdir(parents=True, exist_ok=True)
            self.log_file.touch()

        try:
            # tail -f로 파일 실시간 추적
            proc = subprocess.Popen(
                ["tail", "-f", "-n", "0", str(self.log_file)],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )

            # 연결 확인 이벤트 전송
            self.wfile.write(b"event: connected\n")
            self.wfile.write(b"data: {\"status\": \"connected\"}\n\n")
            self.wfile.flush()

            for line in iter(proc.stdout.readline, b''):
                if not line.strip():
                    continue
                try:
                    # JSON 유효성 검사
                    json.loads(line.decode('utf-8'))
                    self.wfile.write(b"event: activity\n")
                    self.wfile.write(f"data: {line.decode('utf-8')}".encode())
                    self.wfile.write(b"\n")
                    self.wfile.flush()
                except json.JSONDecodeError:
                    continue
                except BrokenPipeError:
                    break

            proc.terminate()

        except BrokenPipeError:
            pass
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)

    def send_health_response(self):
        """헬스 체크 응답"""
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_cors_headers()
        self.end_headers()
        response = json.dumps({
            "status": "ok",
            "log_file": str(self.log_file),
            "log_exists": self.log_file.exists()
        })
        self.wfile.write(response.encode())

    def send_index_response(self):
        """인덱스 페이지 (테스트용)"""
        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.send_cors_headers()
        self.end_headers()
        html = """
<!DOCTYPE html>
<html>
<head>
    <title>Activity Stream</title>
    <style>
        body { font-family: monospace; padding: 20px; background: #1a1a2e; color: #eee; }
        h1 { color: #3b82f6; }
        #events { background: #16213e; padding: 10px; border-radius: 8px; max-height: 500px; overflow-y: auto; }
        .event { padding: 8px; margin: 4px 0; border-radius: 4px; }
        .start { background: #065f46; }
        .end { background: #7c2d12; }
        .agent { border-left: 4px solid #3b82f6; }
        .skill { border-left: 4px solid #10b981; }
    </style>
</head>
<body>
    <h1>🔴 Activity Stream</h1>
    <p>Listening for events from <code>.claude/stream.jsonl</code></p>
    <div id="events"></div>
    <script>
        const events = new EventSource('/events');
        const container = document.getElementById('events');

        events.addEventListener('connected', (e) => {
            container.innerHTML += '<div class="event">✅ Connected to stream</div>';
        });

        events.addEventListener('activity', (e) => {
            const data = JSON.parse(e.data);
            const div = document.createElement('div');
            div.className = `event ${data.event} ${data.type}`;
            div.innerHTML = `<strong>${data.event.toUpperCase()}</strong> ${data.type}: <code>${data.name}</code> <small>(${new Date(data.ts).toLocaleTimeString()})</small>`;
            container.appendChild(div);
            container.scrollTop = container.scrollHeight;
        });

        events.onerror = () => {
            container.innerHTML += '<div class="event">❌ Connection lost. Retrying...</div>';
        };
    </script>
</body>
</html>
"""
        self.wfile.write(html.encode())

    def handle_execute(self):
        """명령 실행 핸들러 - 새 터미널 탭에서 실행"""
        try:
            # 요청 본문 읽기
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))

            instruction = data.get('instruction', '')
            skip_permissions = data.get('skipPermissions', False)

            if not instruction:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({"error": "instruction is required"}).encode())
                return

            # 따옴표 이스케이프 (bash 작은따옴표용)
            # 작은따옴표 내에서는 작은따옴표만 이스케이프 필요: ' -> '\''
            escaped_instruction = instruction.replace("'", "'\\''")

            # Claude Code 명령어 생성 (작은따옴표 사용)
            if skip_permissions:
                cmd = f"claude --dangerously-skip-permissions '{escaped_instruction}'"
            else:
                cmd = f"claude '{escaped_instruction}'"

            # 디버깅: 생성된 명령어 출력
            print(f"🔧 skipPermissions={skip_permissions}")
            print(f"📝 Generated command: cd {PROJECT_ROOT} && {cmd}")

            # AppleScript로 새 터미널 탭 열고 Claude Code 실행
            # do script는 자동으로 새 탭/창 생성 (Terminal 설정에 따라)
            applescript = f'''
            tell application "Terminal"
                activate
                do script "cd {PROJECT_ROOT} && {cmd}"
            end tell
            '''

            # AppleScript 실행
            result = subprocess.run(
                ['osascript', '-e', applescript],
                capture_output=True,
                text=True
            )

            if result.returncode != 0:
                raise Exception(f"AppleScript failed: {result.stderr}")

            # 성공 응답
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_cors_headers()
            self.end_headers()

            response = {
                "status": "started",
                "instruction": instruction,
                "message": "터미널 탭에서 Claude Code 실행 시작. 진행상황을 터미널에서 확인하세요."
            }
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))

            skip_flag = " (skip-permissions)" if skip_permissions else ""
            print(f"✅ Execute started in Terminal{skip_flag}: instruction='{instruction[:50]}...'")

        except json.JSONDecodeError:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Invalid JSON"}).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
            print(f"❌ Execute error: {e}", file=sys.stderr)

    def log_message(self, format, *args):
        """로그 메시지 포맷"""
        print(f"[{self.log_date_time_string()}] {args[0]}")


class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    """멀티스레드 HTTP 서버 (SSE 연결 블로킹 방지)"""
    daemon_threads = True


def main():
    parser = argparse.ArgumentParser(description="Activity Stream SSE Server")
    parser.add_argument("--port", "-p", type=int, default=DEFAULT_PORT,
                        help=f"Server port (default: {DEFAULT_PORT})")
    parser.add_argument("--log-file", "-l", type=Path, default=DEFAULT_LOG_FILE,
                        help=f"Log file path (default: {DEFAULT_LOG_FILE})")
    args = parser.parse_args()

    SSEHandler.log_file = args.log_file

    server = ThreadingHTTPServer(("0.0.0.0", args.port), SSEHandler)
    print(f"🚀 SSE Server started on http://localhost:{args.port}")
    print(f"📁 Watching: {args.log_file}")
    print(f"📡 Events endpoint: http://localhost:{args.port}/events")
    print(f"🏥 Health check: http://localhost:{args.port}/health")
    print(f"\nPress Ctrl+C to stop\n")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
        server.shutdown()


if __name__ == "__main__":
    main()
