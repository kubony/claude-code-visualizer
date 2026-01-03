import type { GraphNode, GraphData } from '../types/graph';
import { isAgentNode, isSkillNode } from '../types/graph';

interface DetailPanelProps {
  node: GraphNode | null;
  data: GraphData;
  onClose: () => void;
  onOpenCommandModal: () => void;
}

export function DetailPanel({ node, data, onClose, onOpenCommandModal }: DetailPanelProps) {
  if (!node) {
    return (
      <div className="p-6 text-gray-400">
        <p className="text-center">노드를 클릭하여 상세 정보를 확인하세요</p>
      </div>
    );
  }

  // Find connected nodes
  const connections = data.edges
    .filter(e => e.source === node.id || e.target === node.id)
    .map(e => {
      const isSource = e.source === node.id;
      const connectedId = isSource ? e.target : e.source;
      const connectedNode = data.nodes.find(n => n.id === connectedId);
      return {
        node: connectedNode,
        type: e.type,
        direction: isSource ? 'outgoing' : 'incoming'
      };
    })
    .filter(c => c.node);

  return (
    <div className="p-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{isAgentNode(node) ? '🤖' : '🔧'}</span>
          <div>
            <h2 className="text-xl font-bold text-white">{node.name}</h2>
            <span className={`text-xs px-2 py-1 rounded-full ${
              isAgentNode(node)
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-green-500/20 text-green-400'
            }`}>
              {node.type.toUpperCase()}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Close panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ===== YAML Metadata Section ===== */}
      <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">YAML 메타데이터</h3>

        <div className="space-y-2 text-sm">
          {/* Name */}
          <div className="flex">
            <span className="text-gray-500 w-20 flex-shrink-0">name:</span>
            <span className="text-emerald-400">{node.name}</span>
          </div>

          {/* Description (from YAML) */}
          <div className="flex">
            <span className="text-gray-500 w-20 flex-shrink-0">description:</span>
            <span className="text-gray-300 text-xs leading-relaxed">{node.description}</span>
          </div>

          {/* Agent-specific YAML fields */}
          {isAgentNode(node) && (
            <>
              {node.model && (
                <div className="flex">
                  <span className="text-gray-500 w-20 flex-shrink-0">model:</span>
                  <span className="text-yellow-400">{node.model}</span>
                </div>
              )}
              {node.tools.length > 0 && (
                <div className="flex">
                  <span className="text-gray-500 w-20 flex-shrink-0">tools:</span>
                  <span className="text-cyan-400">[{node.tools.join(', ')}]</span>
                </div>
              )}
              {node.subagents && node.subagents.length > 0 && (
                <div className="flex">
                  <span className="text-gray-500 w-20 flex-shrink-0">subagents:</span>
                  <span className="text-purple-400">[{node.subagents.join(', ')}]</span>
                </div>
              )}
              {node.skills && node.skills.length > 0 && (
                <div className="flex">
                  <span className="text-gray-500 w-20 flex-shrink-0">skills:</span>
                  <span className="text-green-400">[{node.skills.join(', ')}]</span>
                </div>
              )}
            </>
          )}

          {/* Skill-specific YAML fields */}
          {isSkillNode(node) && (
            <>
              <div className="flex">
                <span className="text-gray-500 w-20 flex-shrink-0">hasScripts:</span>
                <span className={node.hasScripts ? 'text-green-400' : 'text-gray-500'}>{node.hasScripts ? 'true' : 'false'}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-20 flex-shrink-0">hasWebapp:</span>
                <span className={node.hasWebapp ? 'text-green-400' : 'text-gray-500'}>{node.hasWebapp ? 'true' : 'false'}</span>
              </div>
            </>
          )}

          {/* File path */}
          <div className="flex">
            <span className="text-gray-500 w-20 flex-shrink-0">filePath:</span>
            <code className="text-purple-400 text-xs break-all">{node.filePath}</code>
          </div>

          {/* Connections */}
          {connections.length > 0 && (
            <div className="flex">
              <span className="text-gray-500 w-20 flex-shrink-0">연결:</span>
              <div className="flex flex-col gap-1">
                {connections.map((conn, i) => (
                  <span key={i} className="text-sm">
                    <span className="text-gray-400">{conn.direction === 'outgoing' ? '→' : '←'}</span>
                    {' '}
                    <span className={conn.node?.type === 'agent' ? 'text-blue-400' : 'text-green-400'}>
                      {conn.node?.name}
                    </span>
                    {' '}
                    <span className="text-gray-500 text-xs">({conn.type})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== Divider ===== */}
      <div className="border-t border-gray-600 my-4"></div>

      {/* ===== Content Section ===== */}

      {/* Agent-specific: System Prompt */}
      {isAgentNode(node) && node.systemPrompt && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">시스템 프롬프트</h3>
          <pre className="text-xs bg-gray-800 p-3 rounded overflow-x-auto whitespace-pre-wrap text-gray-300 max-h-60">
            {node.systemPrompt}
          </pre>
        </div>
      )}

      {/* Skill-specific: Triggers */}
      {isSkillNode(node) && node.triggers.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">트리거</h3>
          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
            {node.triggers.map((trigger, i) => (
              <li key={i}>{trigger}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Execute Button - Fixed at bottom */}
      <div className="sticky bottom-0 left-0 right-0 pt-4 pb-2 bg-gradient-to-t from-gray-800 via-gray-800 to-transparent">
        <button
          onClick={onOpenCommandModal}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <span>⚡</span>
          Claude Code 실행
        </button>
      </div>
    </div>
  );
}
