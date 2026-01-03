import React from 'react';
import type { GraphNode } from '../types/graph';
import { isAgentNode, isSkillNode } from '../types/graph';

interface NodeCardProps {
  node: GraphNode;
  position: { x: number; y: number };
  isSelected: boolean;
  isActive?: boolean;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onClick: (node: GraphNode) => void;
}

const NodeHeader: React.FC<{ node: GraphNode }> = ({ node }) => {
  const isAgent = isAgentNode(node);

  const config = isAgent
    ? { icon: '🤖', color: 'bg-blue-600', label: 'AGENT' }
    : { icon: '🔧', color: 'bg-emerald-600', label: 'SKILL' };

  return (
    <div className={`flex items-center justify-between px-4 py-2.5 text-white rounded-t-lg ${config.color}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{config.icon}</span>
        <h3 className="font-semibold text-sm">{node.name}</h3>
      </div>
      <span className="text-xs px-2 py-0.5 bg-white/20 rounded-full font-medium">
        {config.label}
      </span>
    </div>
  );
};

const Handle: React.FC<{
  id: string;
  type: 'input' | 'output';
  label: string;
}> = ({ id, type, label }) => {
  const isInput = type === 'input';

  return (
    <div className="relative flex items-center h-8 my-0.5">
      <div
        id={id}
        className="absolute top-1/2 w-3 h-3 rounded-full bg-gray-400 border-2 border-gray-600 cursor-pointer hover:bg-indigo-400 transition-colors"
        style={{
          transform: 'translateY(-50%)',
          ...(isInput ? { left: '-6px' } : { right: '-6px' }),
        }}
      />
      <span
        className={`text-xs text-gray-400 ${isInput ? 'ml-4' : 'mr-4 ml-auto'}`}
      >
        {label}
      </span>
    </div>
  );
};

export const NodeCard: React.FC<NodeCardProps> = ({
  node,
  position,
  isSelected,
  isActive = false,
  onMouseDown,
  onClick,
}) => {
  const isAgent = isAgentNode(node);
  const isSkill = isSkillNode(node);

  // All nodes connect directly without handles
  const inputs: any[] = [];
  const outputs: any[] = [];

  const contentHeight = Math.max(inputs.length, outputs.length) * 28 + 20;

  const activeClass = isActive
    ? isAgent
      ? 'ring-4 ring-blue-500/50 animate-pulse-glow-blue'
      : 'ring-4 ring-emerald-500/50 animate-pulse-glow-green'
    : '';

  return (
    <div
      className={`absolute bg-gray-800 rounded-lg shadow-xl border-2 transition-all cursor-move select-none ${
        isSelected
          ? 'border-indigo-500 ring-2 ring-indigo-500/30'
          : isActive
            ? isAgent
              ? 'border-blue-400'
              : 'border-emerald-400'
            : 'border-gray-700 hover:border-gray-600'
      } ${activeClass}`}
      style={{
        left: position.x,
        top: position.y,
        width: 240,
        minHeight: 100,
        ...(isActive && {
          animation: 'pulse-glow 1.5s ease-in-out infinite',
        }),
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onMouseDown(e, node.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(node);
      }}
    >
      <NodeHeader node={node} />

      <div
        className="relative px-4 py-3"
        style={{ minHeight: contentHeight }}
      >
        {/* Inputs */}
        {inputs.map((input) => (
          <Handle
            key={input.id}
            id={input.id}
            type="input"
            label={input.label}
          />
        ))}

        {/* Outputs */}
        {outputs.map((output) => (
          <Handle
            key={output.id}
            id={output.id}
            type="output"
            label={output.label}
          />
        ))}

        {/* Description */}
        <p className="text-xs text-gray-400 line-clamp-2 mt-1">
          {node.description.slice(0, 80)}
          {node.description.length > 80 ? '...' : ''}
        </p>

        {/* Badges for skills */}
        {isSkill && (
          <div className="flex gap-1 mt-2">
            {node.hasScripts && (
              <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                Scripts
              </span>
            )}
            {node.hasWebapp && (
              <span className="text-xs px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded">
                Webapp
              </span>
            )}
          </div>
        )}

        {/* Model badge for agents */}
        {isAgent && node.model && (
          <div className="mt-2">
            <span className="text-xs px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded">
              {node.model}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(NodeCard);
