import type { GraphMetadata } from '../types/graph';

interface LegendProps {
  metadata: GraphMetadata;
}

export function Legend({ metadata }: LegendProps) {
  const hasGlobal = (metadata.globalAgentCount || 0) + (metadata.globalSkillCount || 0) + (metadata.globalCommandCount || 0) > 0;
  const totalAgents = metadata.agentCount + (metadata.globalAgentCount || 0);
  const totalSkills = metadata.skillCount + (metadata.globalSkillCount || 0);
  const totalCommands = (metadata.commandCount || 0) + (metadata.globalCommandCount || 0);

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 shadow-lg">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">Legend</h3>

      {/* Node types */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-sm">
            🤖
          </div>
          <span className="text-sm text-gray-300">Agent ({totalAgents})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-xs">
            🔧
          </div>
          <span className="text-sm text-gray-300">Skill ({totalSkills})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-xs">
            ⚡
          </div>
          <span className="text-sm text-gray-300">Command ({totalCommands})</span>
        </div>
      </div>

      {/* Scope types */}
      {hasGlobal && (
        <>
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Scope</h3>
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-4 border-2 border-gray-600 rounded" />
              <span className="text-xs text-gray-400">Local (.claude/)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-4 border-2 border-dashed border-orange-500/50 rounded flex items-center justify-center">
                <span className="text-[8px]">🌐</span>
              </div>
              <span className="text-xs text-gray-400">Global (~/.claude/)</span>
            </div>
          </div>
        </>
      )}

      {/* Edge types */}
      <h3 className="text-sm font-semibold text-gray-400 mb-2">Edges</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-indigo-500" />
          <span className="text-xs text-gray-400">uses (Agent→Skill)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5" style={{
            backgroundImage: 'repeating-linear-gradient(90deg, #a855f7 0, #a855f7 6px, transparent 6px, transparent 8px, #a855f7 8px, #a855f7 10px, transparent 10px, transparent 12px)'
          }} />
          <span className="text-xs text-gray-400">calls (Agent→Agent)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5" style={{
            backgroundImage: 'repeating-linear-gradient(90deg, #10b981 0, #10b981 4px, transparent 4px, transparent 6px)'
          }} />
          <span className="text-xs text-gray-400">orchestrates (Skill→Agent)</span>
        </div>
      </div>

      {/* Metadata */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          Project: <span className="text-gray-400">{metadata.projectName}</span>
        </p>
        {hasGlobal && (
          <p className="text-xs text-gray-500 mt-1">
            Local: <span className="text-gray-400">{metadata.agentCount}A/{metadata.skillCount}S/{metadata.commandCount}C</span>
            {' · '}
            Global: <span className="text-orange-400">{metadata.globalAgentCount}A/{metadata.globalSkillCount}S/{metadata.globalCommandCount}C</span>
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Generated: <span className="text-gray-400">
            {new Date(metadata.generatedAt).toLocaleString('ko-KR')}
          </span>
        </p>
      </div>
    </div>
  );
}
