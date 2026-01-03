import { useState, useEffect } from 'react';
import type { GraphNode } from '../types/graph';
import { isAgentNode, isSkillNode } from '../types/graph';

interface CommandBuilderProps {
  nodes: GraphNode[];
  selectedNode?: GraphNode | null;
}

const SSE_SERVER_URL = 'http://localhost:3001';

export function CommandBuilder({ nodes, selectedNode }: CommandBuilderProps) {
  const [instruction, setInstruction] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [message, setMessage] = useState('');
  const [skipPermissions, setSkipPermissions] = useState(false);

  // 에이전트와 스킬 분리
  const agents = nodes.filter(n => n.type === 'agent');
  const skills = nodes.filter(n => n.type === 'skill');

  // 선택된 노드에 따라 초기 지시사항 설정
  useEffect(() => {
    if (!selectedNode) return;

    if (isAgentNode(selectedNode)) {
      // 에이전트: "(에이전트명 에이전트를 사용해서 처리)"
      setInstruction(`(${selectedNode.name} 에이전트를 사용해서 처리)`);
      setSelectedAgent(selectedNode.name);
    } else if (isSkillNode(selectedNode)) {
      // 스킬: Claude가 Skill 도구로 호출하도록 자연어 형태
      setInstruction(`${selectedNode.name} 스킬을 실행해줘`);
    }
  }, [selectedNode]);

  const executeCommand = async () => {
    if (!instruction.trim()) {
      setMessage('⚠️ 지시사항을 입력하세요.');
      return;
    }

    setIsExecuting(true);
    setMessage('');

    try {
      const response = await fetch(`${SSE_SERVER_URL}/api/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instruction: instruction.trim(),
          skipPermissions
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`✅ ${result.message}`);
        setInstruction(''); // 입력창 초기화

        // 3초 후 메시지 자동 제거
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessage(`❌ 실행 실패: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ 서버 연결 실패: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const insertAgentReference = () => {
    if (selectedAgent) {
      setInstruction(prev => `${prev}\n(${selectedAgent} 에이전트를 사용해서 처리)`.trim());
    }
  };

  const quickCommands = [
    { label: '볼트 정리', cmd: '볼트 정리해줘' },
    { label: 'YAML 헤더 추가', cmd: 'YAML 헤더가 누락된 파일들에 헤더 추가해줘' },
    { label: '인물사전 업데이트', cmd: '최근 추가된 인물 파일들로 인물사전 업데이트해줘' },
  ];

  return (
    <div className="command-builder">
      {/* 에이전트 선택 */}
      <div className="flex items-center gap-2 mb-3">
        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-300"
        >
          <option value="">에이전트 선택...</option>
          {agents.map(agent => (
            <option key={agent.id} value={agent.name}>
              {agent.name}
            </option>
          ))}
        </select>
        <button
          onClick={insertAgentReference}
          disabled={!selectedAgent}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded transition-colors"
        >
          삽입
        </button>
      </div>

      {/* 빠른 명령 버튼 */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {quickCommands.map((quick, i) => (
          <button
            key={i}
            onClick={() => setInstruction(quick.cmd)}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded transition-colors"
          >
            {quick.label}
          </button>
        ))}
      </div>

      {/* 지시사항 입력 */}
      <textarea
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder="Claude Code에 보낼 지시사항을 입력하세요...&#10;&#10;예시:&#10;- 볼트 정리해줘&#10;- YAML 헤더가 누락된 파일들 찾아서 추가해줘&#10;- vault-organizer 에이전트로 전체 정리 실행"
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
        rows={4}
        disabled={isExecuting}
      />

      {/* 권한 확인 건너뛰기 옵션 */}
      <div className="mt-3">
        <label className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={skipPermissions}
            onChange={(e) => setSkipPermissions(e.target.checked)}
            className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
          />
          <span>권한 확인 건너뛰기 (--dangerously-skip-permissions)</span>
          <span className="text-xs text-yellow-500">⚠️ 신뢰할 수 있는 프로젝트에서만 사용</span>
        </label>
      </div>

      {/* 실행 버튼 */}
      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={executeCommand}
          disabled={isExecuting || !instruction.trim()}
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 text-white font-medium rounded-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isExecuting ? (
            <>
              <span className="animate-spin">⏳</span>
              실행 중...
            </>
          ) : (
            <>
              <span>▶️</span>
              실행
            </>
          )}
        </button>

        {/* 상태 메시지 */}
        {message && (
          <div className={`flex-1 px-4 py-2 rounded text-sm ${
            message.startsWith('✅')
              ? 'bg-green-900/30 text-green-400 border border-green-700'
              : 'bg-red-900/30 text-red-400 border border-red-700'
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* 안내 메시지 */}
      <p className="mt-3 text-xs text-gray-500">
        💡 실행하면 새로운 Claude Code 세션이 시작되며, 실시간 진행상황은 아래 그래프와 Activity Stream에서 확인할 수 있습니다.
      </p>
    </div>
  );
}
