import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { NodeCard } from './components/NodeCard';
import { BezierEdge } from './components/BezierEdge';
import { DetailPanel } from './components/DetailPanel';
import { Legend } from './components/Legend';
import { SearchBar } from './components/SearchBar';
import { CallStack } from './components/CallStack';
import { CommandBuilder } from './components/CommandBuilder';
import { useGraphData } from './hooks/useGraphData';
import { useActivityStream } from './hooks/useActivityStream';
import type { GraphNode, GraphEdge } from './types/graph';
import { isAgentNode } from './types/graph';

interface NodePosition {
  x: number;
  y: number;
}

const NODE_WIDTH = 240;
const NODE_HEIGHT = 140;
const HORIZONTAL_GAP = 200;
const VERTICAL_GAP = 80;


function App() {
  const { data, loading, error, reload } = useGraphData();
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [nodePositions, setNodePositions] = useState<Record<string, NodePosition>>({});
  const [viewTransform, setViewTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [edgeUpdateKey, setEdgeUpdateKey] = useState(0); // Force edge recalculation
  const [streamEnabled, setStreamEnabled] = useState(true);
  const [showCallStack, setShowCallStack] = useState(true);
  const [showCreatorSkills, setShowCreatorSkills] = useState(false);
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);

  // Activity stream for real-time visualization
  const { activeNodes, events, isConnected, error: streamError } = useActivityStream(streamEnabled);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef<{
    nodeId: string;
    startPos: NodePosition;
    startMouse: { x: number; y: number };
  } | null>(null);
  const panState = useRef<{ startX: number; startY: number } | null>(null);

  // Auto-layout: hierarchical columns
  // Parent agents (left) → Child agents (middle) → Skills (right)
  const calculateLayout = useCallback((nodes: GraphNode[], edges: GraphEdge[]): Record<string, NodePosition> => {
    // Count connections for each node (for sorting within columns)
    const connectionCount: Record<string, number> = {};
    nodes.forEach(n => connectionCount[n.id] = 0);
    edges.forEach(edge => {
      connectionCount[edge.source] = (connectionCount[edge.source] || 0) + 1;
      connectionCount[edge.target] = (connectionCount[edge.target] || 0) + 1;
    });

    // Build agent hierarchy from 'calls' edges
    const childAgents = new Set<string>();
    const parentAgents = new Set<string>();

    edges.forEach(edge => {
      if (edge.type === 'calls') {
        parentAgents.add(edge.source);
        childAgents.add(edge.target);
      }
    });

    // Calculate agent depth (0 = top-level parent, 1 = child, etc.)
    const agentDepth: Record<string, number> = {};
    const agents = nodes.filter(isAgentNode);

    // First pass: identify top-level parent agents (not called by anyone AND has child agents)
    agents.forEach(agent => {
      if (!childAgents.has(agent.id)) {
        // Check if this agent has child agents (calls other agents)
        const hasChildAgents = edges.some(e => e.type === 'calls' && e.source === agent.id);
        if (hasChildAgents) {
          agentDepth[agent.id] = 0; // Only true parent agents get depth 0
        }
      }
    });

    // BFS to calculate depths
    const queue = agents.filter(a => agentDepth[a.id] === 0).map(a => a.id);
    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentDepth = agentDepth[current];

      edges.forEach(edge => {
        if (edge.type === 'calls' && edge.source === current) {
          const childId = edge.target;
          if (agentDepth[childId] === undefined || agentDepth[childId] < currentDepth + 1) {
            agentDepth[childId] = currentDepth + 1;
            queue.push(childId);
          }
        }
      });
    }

    // Calculate max depth so far for positioning skill-only agents
    const currentMaxDepth = Object.values(agentDepth).length > 0
      ? Math.max(...Object.values(agentDepth), 0)
      : 0;

    // Agents without depth are skill-only agents - place them just before skills
    agents.forEach(agent => {
      if (agentDepth[agent.id] === undefined) {
        agentDepth[agent.id] = currentMaxDepth + 1; // Place skill-only agents right before skills
      }
    });

    // Find max depth for positioning skills
    const maxAgentDepth = Math.max(...Object.values(agentDepth), 0);

    // Group agents by depth and sort by connection count
    const agentsByDepth: Record<number, GraphNode[]> = {};
    agents.forEach(agent => {
      const depth = agentDepth[agent.id];
      if (!agentsByDepth[depth]) agentsByDepth[depth] = [];
      agentsByDepth[depth].push(agent);
    });

    // Sort each depth group by connection count
    Object.keys(agentsByDepth).forEach(depth => {
      agentsByDepth[Number(depth)].sort((a, b) => connectionCount[b.id] - connectionCount[a.id]);
    });

    const positions: Record<string, NodePosition> = {};

    // Start position
    const startX = 100;
    const startY = 80;

    // Position agents by depth (each depth is a column)
    Object.keys(agentsByDepth).forEach(depthStr => {
      const depth = Number(depthStr);
      const agentsAtDepth = agentsByDepth[depth];

      agentsAtDepth.forEach((agent, index) => {
        positions[agent.id] = {
          x: startX + depth * (NODE_WIDTH + HORIZONTAL_GAP),
          y: startY + index * (NODE_HEIGHT + VERTICAL_GAP),
        };
      });
    });

    // Get skills and sort by barycenter (average Y of connected agents) to minimize edge crossings
    const skills = nodes.filter(n => !isAgentNode(n));

    // Calculate barycenter for each skill
    const skillBarycenter: Record<string, number> = {};
    skills.forEach(skill => {
      const connectedAgentYs: number[] = [];
      edges.forEach(edge => {
        if (edge.target === skill.id && positions[edge.source]) {
          connectedAgentYs.push(positions[edge.source].y);
        }
      });
      // If no connections, use a large number to push to bottom
      skillBarycenter[skill.id] = connectedAgentYs.length > 0
        ? connectedAgentYs.reduce((a, b) => a + b, 0) / connectedAgentYs.length
        : Infinity;
    });

    // Sort skills by barycenter (lower Y = higher position)
    skills.sort((a, b) => skillBarycenter[a.id] - skillBarycenter[b.id]);

    // Position skills in the rightmost column (after all agent columns)
    const skillColumnX = startX + (maxAgentDepth + 1) * (NODE_WIDTH + HORIZONTAL_GAP);
    skills.forEach((skill, index) => {
      positions[skill.id] = {
        x: skillColumnX,
        y: startY + index * (NODE_HEIGHT + VERTICAL_GAP),
      };
    });

    return positions;
  }, []);

  // Initialize positions when data loads
  useEffect(() => {
    if (data?.nodes && data?.edges && Object.keys(nodePositions).length === 0) {
      setNodePositions(calculateLayout(data.nodes, data.edges));
    }
  }, [data, nodePositions, calculateLayout]);

  // Force edge recalculation after nodes are painted
  useEffect(() => {
    if (Object.keys(nodePositions).length > 0) {
      // Use requestAnimationFrame to wait for DOM paint
      const rafId = requestAnimationFrame(() => {
        setEdgeUpdateKey(prev => prev + 1);
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [nodePositions]);

  // Get handle position from DOM element
  const getHandlePosition = useCallback((handleId: string): { x: number; y: number } | null => {
    const handleElem = document.getElementById(handleId);
    if (!handleElem || !canvasRef.current) return null;

    const handleRect = handleElem.getBoundingClientRect();
    const canvasRect = canvasRef.current.getBoundingClientRect();

    // Get screen position relative to canvas
    const screenX = handleRect.left + handleRect.width / 2 - canvasRect.left;
    const screenY = handleRect.top + handleRect.height / 2 - canvasRect.top;

    // Convert to world coordinates (accounting for transform)
    const worldX = (screenX - viewTransform.x) / viewTransform.scale;
    const worldY = (screenY - viewTransform.y) / viewTransform.scale;

    return { x: worldX, y: worldY };
  }, [viewTransform]);

  // Get edge positions for rendering
  // All edges connect directly from box to box (no handles)
  const getEdgePositions = useCallback((edge: GraphEdge) => {
    const sourcePos = nodePositions[edge.source];
    const targetPos = nodePositions[edge.target];
    if (!sourcePos || !targetPos) return null;

    // All connections: horizontal (box to box)
    return {
      start: { x: sourcePos.x + NODE_WIDTH, y: sourcePos.y + 50 },
      end: { x: targetPos.x, y: targetPos.y + 50 },
    };
  }, [nodePositions]);

  // Handle node drag
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return;

    const pos = nodePositions[nodeId];
    if (!pos) return;

    dragInfo.current = {
      nodeId,
      startPos: { ...pos },
      startMouse: { x: e.clientX, y: e.clientY },
    };

    e.preventDefault();
  }, [nodePositions]);

  // Handle canvas pan
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (dragInfo.current) return;

    panState.current = {
      startX: e.clientX - viewTransform.x,
      startY: e.clientY - viewTransform.y,
    };

    e.preventDefault();
  }, [viewTransform]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragInfo.current) {
      const dx = (e.clientX - dragInfo.current.startMouse.x) / viewTransform.scale;
      const dy = (e.clientY - dragInfo.current.startMouse.y) / viewTransform.scale;

      setNodePositions(prev => ({
        ...prev,
        [dragInfo.current!.nodeId]: {
          x: dragInfo.current!.startPos.x + dx,
          y: dragInfo.current!.startPos.y + dy,
        },
      }));
    } else if (panState.current) {
      setViewTransform(prev => ({
        ...prev,
        x: e.clientX - panState.current!.startX,
        y: e.clientY - panState.current!.startY,
      }));
    }
  }, [viewTransform.scale]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    dragInfo.current = null;
    panState.current = null;
  }, []);

  // Handle zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(viewTransform.scale * delta, 0.3), 2);

    // Zoom toward mouse position
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scaleDiff = newScale - viewTransform.scale;

    setViewTransform(prev => ({
      scale: newScale,
      x: prev.x - (mouseX - prev.x) * (scaleDiff / prev.scale),
      y: prev.y - (mouseY - prev.y) * (scaleDiff / prev.scale),
    }));
  }, [viewTransform]);

  // Filter and highlight logic
  const { visibleNodes, highlightedEdges } = useMemo(() => {
    if (!data) return { visibleNodes: [], highlightedEdges: new Set<string>() };

    const matchesSearch = (node: GraphNode) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        node.name.toLowerCase().includes(term) ||
        node.description.toLowerCase().includes(term)
      );
    };

    const isCreatorSkill = (node: GraphNode) => {
      return node.type === 'skill' && (
        node.name.endsWith('-creator') ||
        node.name === 'agent-skill-visualizer'
      );
    };

    const shouldShowNode = (node: GraphNode) => {
      // Hide creator skills if toggle is off
      if (!showCreatorSkills && isCreatorSkill(node)) {
        return false;
      }
      return matchesSearch(node);
    };

    const connectedIds = new Set<string>();
    if (selectedNode) {
      connectedIds.add(selectedNode.id);
      data.edges.forEach(edge => {
        if (edge.source === selectedNode.id) connectedIds.add(edge.target);
        if (edge.target === selectedNode.id) connectedIds.add(edge.source);
      });
    }

    const highlightedEdges = new Set<string>();
    if (selectedNode) {
      data.edges.forEach(edge => {
        if (edge.source === selectedNode.id || edge.target === selectedNode.id) {
          highlightedEdges.add(`${edge.source}-${edge.target}`);
        }
      });
    }

    return {
      visibleNodes: data.nodes.filter(shouldShowNode),
      highlightedEdges,
    };
  }, [data, searchTerm, selectedNode, showCreatorSkills]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">그래프 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-white mb-2">데이터 로드 실패</h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={reload}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-900 flex overflow-hidden">
      {/* Main canvas area */}
      <div className="flex-1 relative">
        {/* Top bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center gap-4">
          <div className="flex-1 max-w-md">
            <SearchBar value={searchTerm} onChange={setSearchTerm} />
          </div>
          <button
            onClick={() => {
              setNodePositions(calculateLayout(data.nodes, data.edges));
              setViewTransform({ scale: 1, x: 0, y: 0 });
            }}
            className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            title="레이아웃 초기화"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-20">
          <Legend metadata={data.metadata} />
        </div>

        {/* Activity Stream Toggle */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={() => setShowCreatorSkills(!showCreatorSkills)}
            className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              showCreatorSkills ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'
            }`}
            title="Creator 스킬 표시/숨기기"
          >
            <span className="text-sm">🛠️</span>
            Creator
          </button>
          <button
            onClick={() => setShowCallStack(!showCallStack)}
            className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              showCallStack ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
            }`}
            title="Activity Stream 패널"
          >
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            Activity
          </button>
          <button
            onClick={() => setStreamEnabled(!streamEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              streamEnabled ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'
            }`}
            title={streamEnabled ? 'Live 모드 끄기' : 'Live 모드 켜기'}
          >
            {streamEnabled ? '🔴' : '⏸️'}
          </button>
        </div>

        {/* Call Stack Panel */}
        {showCallStack && (
          <div className="absolute top-16 right-4 z-20 w-72">
            <CallStack
              activeNodes={activeNodes}
              events={events}
              isConnected={isConnected}
              error={streamError}
            />
          </div>
        )}

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onClick={() => setSelectedNode(null)}
        >
          <div
            style={{
              transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`,
              transformOrigin: '0 0',
              width: '6000px',
              height: '4000px',
              position: 'relative',
            }}
          >
            {/* Edges (SVG layer) - z-10 to render above nodes */}
            <svg
              className="absolute inset-0 pointer-events-none z-10"
              style={{ width: '6000px', height: '4000px' }}
            >
              {data.edges.map(edge => {
                const positions = getEdgePositions(edge);
                if (!positions) return null;

                const edgeKey = `${edge.source}-${edge.target}`;
                const isHighlighted = highlightedEdges.has(edgeKey);
                const isDimmed = selectedNode && !highlightedEdges.has(edgeKey);

                return (
                  <BezierEdge
                    key={edgeKey}
                    start={positions.start}
                    end={positions.end}
                    type={edge.type}
                    isHighlighted={isHighlighted}
                    isDimmed={!!isDimmed}
                  />
                );
              })}
            </svg>

            {/* Nodes */}
            {visibleNodes.map(node => {
              const pos = nodePositions[node.id];
              if (!pos) return null;

              const isDimmed = selectedNode && selectedNode.id !== node.id &&
                !data.edges.some(e =>
                  (e.source === selectedNode.id && e.target === node.id) ||
                  (e.target === selectedNode.id && e.source === node.id)
                );

              return (
                <div
                  key={node.id}
                  style={{ opacity: isDimmed ? 0.3 : 1, transition: 'opacity 0.2s' }}
                >
                  <NodeCard
                    node={node}
                    position={pos}
                    isSelected={selectedNode?.id === node.id}
                    isActive={activeNodes.has(node.id)}
                    onMouseDown={handleNodeMouseDown}
                    onClick={setSelectedNode}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Side panel */}
      <div
        className={`w-96 bg-gray-800 border-l border-gray-700 transition-transform duration-300 ${
          selectedNode ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ position: 'absolute', right: 0, top: 0, bottom: 0 }}
      >
        <DetailPanel
          node={selectedNode}
          data={data}
          onClose={() => setSelectedNode(null)}
          onOpenCommandModal={() => setIsCommandModalOpen(true)}
        />
      </div>

      {/* Command Modal */}
      {isCommandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>⚡</span>
                Claude Code 실행
              </h2>
              <button
                onClick={() => setIsCommandModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              <CommandBuilder nodes={data.nodes} selectedNode={selectedNode} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
