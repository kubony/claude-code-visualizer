import type { GraphMetadata } from '../types/graph';

interface LegendProps {
  metadata: GraphMetadata;
}

export function Legend({ metadata }: LegendProps) {
  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 shadow-lg">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">범례</h3>

      {/* Node types */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-sm">
            🤖
          </div>
          <span className="text-sm text-gray-300">Agent ({metadata.agentCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-xs">
            🔧
          </div>
          <span className="text-sm text-gray-300">Skill ({metadata.skillCount})</span>
        </div>
      </div>

      {/* Edge types */}
      <h3 className="text-sm font-semibold text-gray-400 mb-2">연결</h3>
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
            backgroundImage: 'repeating-linear-gradient(90deg, #F59E0B 0, #F59E0B 5px, transparent 5px, transparent 8px)'
          }} />
          <span className="text-xs text-gray-400">depends (Skill→Skill)</span>
        </div>
      </div>

      {/* Metadata */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          프로젝트: <span className="text-gray-400">{metadata.projectName}</span>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          생성: <span className="text-gray-400">
            {new Date(metadata.generatedAt).toLocaleString('ko-KR')}
          </span>
        </p>
      </div>
    </div>
  );
}
