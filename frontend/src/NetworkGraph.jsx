import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getPacketVisualState } from './SimulationEngine';

// Mumbai Node Layout - 2D Grid Coordinates (0-100% scale)
const NODE_LAYOUT = {
    // North Corridor
    'Borivali': { x: 20, y: 8 },
    'Malad': { x: 22, y: 18 },
    'Goregaon': { x: 25, y: 28 },
    'Andheri West': { x: 18, y: 38 },
    'Andheri East': { x: 35, y: 38 },
    'Vile Parle': { x: 28, y: 45 },
    // Central Corridor
    'Santacruz': { x: 30, y: 52 },
    'Bandra West': { x: 18, y: 58 },
    'Bandra East': { x: 38, y: 58 },
    'Kurla': { x: 55, y: 55 },
    // South-Central
    'Dadar West': { x: 22, y: 68 },
    'Dadar East': { x: 38, y: 68 },
    'Sion': { x: 52, y: 68 },
    'Worli': { x: 15, y: 78 },
    'Lower Parel': { x: 28, y: 78 },
    // East Corridor
    'Powai': { x: 55, y: 35 },
    'Ghatkopar': { x: 65, y: 48 },
    'Chembur': { x: 70, y: 65 },
    // South
    'Colaba': { x: 22, y: 92 },
    'CST / Fort': { x: 35, y: 88 }
};

// Fallback for unknown nodes
const getNodePosition = (nodeName) => {
    return NODE_LAYOUT[nodeName] || { x: 50, y: 50 };
};

const NetworkGraph = ({
    edges = [],
    isOptimized = false,
    selectedPath = null,
    simulationStep = 0,
    onNodeClick = () => { }
}) => {
    const svgRef = useRef(null);
    const [animationKey, setAnimationKey] = useState(0);

    // Process unique edges (deduplicate bidirectional)
    const uniqueEdges = useMemo(() => {
        const edgeMap = new Map();
        edges.forEach(edge => {
            const key = [edge.from, edge.to].sort().join('-');
            if (!edgeMap.has(key)) {
                edgeMap.set(key, edge);
            } else {
                // Average congestion for bidirectional edges
                const existing = edgeMap.get(key);
                existing.congestion = (existing.congestion + edge.congestion) / 2;
            }
        });
        return Array.from(edgeMap.values());
    }, [edges]);

    // Extract unique nodes
    const nodes = useMemo(() => {
        const nodeSet = new Set();
        edges.forEach(e => {
            nodeSet.add(e.from);
            nodeSet.add(e.to);
        });
        return Array.from(nodeSet);
    }, [edges]);

    // Trigger re-animation on optimization toggle
    useEffect(() => {
        setAnimationKey(prev => prev + 1);
    }, [isOptimized, simulationStep]);

    // Check if edge is part of selected path
    const isEdgeInPath = (edge) => {
        if (!selectedPath || !selectedPath.edges) return false;
        return selectedPath.edges.some(pe =>
            (pe.from === edge.from && pe.to === edge.to) ||
            (pe.from === edge.to && pe.to === edge.from)
        );
    };

    return (
        <div className="relative w-full h-full bg-gradient-to-b from-[#0a1628] to-[#0d1f2d] rounded-xl overflow-hidden border border-cyan-900/30">
            {/* Grid Background */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e3a5f" strokeWidth="0.5" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Main Network SVG */}
            <svg
                ref={svgRef}
                viewBox="0 0 100 100"
                className="w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    {/* Glow Filters */}
                    <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="0.5" result="blur" />
                        <feFlood floodColor="#22c55e" floodOpacity="0.6" />
                        <feComposite in2="blur" operator="in" />
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="0.5" result="blur" />
                        <feFlood floodColor="#ef4444" floodOpacity="0.6" />
                        <feComposite in2="blur" operator="in" />
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="0.3" result="blur" />
                        <feFlood floodColor="#06b6d4" floodOpacity="0.8" />
                        <feComposite in2="blur" operator="in" />
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* LAYER 1: Base Roads (Dark Grey Physical Links) */}
                {uniqueEdges.map((edge, idx) => {
                    const from = getNodePosition(edge.from);
                    const to = getNodePosition(edge.to);
                    return (
                        <line
                            key={`base-${idx}`}
                            x1={from.x}
                            y1={from.y}
                            x2={to.x}
                            y2={to.y}
                            stroke="#1e293b"
                            strokeWidth="0.8"
                            strokeLinecap="round"
                        />
                    );
                })}

                {/* LAYER 2: Animated Packet Streams */}
                {uniqueEdges.map((edge, idx) => {
                    const from = getNodePosition(edge.from);
                    const to = getNodePosition(edge.to);
                    const visual = getPacketVisualState(edge.congestion || 0.1, isOptimized);
                    const inPath = isEdgeInPath(edge);

                    return (
                        <g key={`stream-${idx}-${animationKey}`}>
                            {/* The Packet Stream Line */}
                            <line
                                x1={from.x}
                                y1={from.y}
                                x2={to.x}
                                y2={to.y}
                                stroke={inPath ? '#06b6d4' : visual.color}
                                strokeWidth={inPath ? 0.6 : 0.4}
                                strokeDasharray="0.8 0.8"
                                strokeLinecap="round"
                                opacity={visual.opacity}
                                filter={inPath ? 'url(#glow-cyan)' : (visual.state === 'CONGESTION' ? 'url(#glow-red)' : '')}
                                style={{
                                    animation: `packet-flow ${visual.animationSpeed}s linear infinite`
                                }}
                            />
                        </g>
                    );
                })}

                {/* LAYER 3: Node Circles */}
                {nodes.map((nodeName, idx) => {
                    const pos = getNodePosition(nodeName);
                    const isInPath = selectedPath?.path?.includes(nodeName);
                    return (
                        <g key={`node-${idx}`} className="cursor-pointer" onClick={() => onNodeClick(nodeName)}>
                            {/* Outer Ring */}
                            <circle
                                cx={pos.x}
                                cy={pos.y}
                                r={isInPath ? 2.2 : 1.8}
                                fill="none"
                                stroke={isInPath ? '#06b6d4' : '#334155'}
                                strokeWidth="0.3"
                                filter={isInPath ? 'url(#glow-cyan)' : ''}
                            />
                            {/* Inner Dot */}
                            <circle
                                cx={pos.x}
                                cy={pos.y}
                                r={isInPath ? 1.2 : 0.9}
                                fill={isInPath ? '#06b6d4' : (isOptimized ? '#22c55e' : '#475569')}
                            />
                            {/* Label */}
                            <text
                                x={pos.x}
                                y={pos.y + 3.5}
                                textAnchor="middle"
                                fontSize="1.8"
                                fill={isInPath ? '#06b6d4' : '#94a3b8'}
                                fontFamily="monospace"
                                fontWeight={isInPath ? 'bold' : 'normal'}
                            >
                                {nodeName.length > 10 ? nodeName.substring(0, 8) + '..' : nodeName}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-[#0a1628]/80 backdrop-blur-sm p-3 rounded-lg border border-cyan-900/30 text-xs">
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-0.5 bg-green-500 rounded"></span>
                    <span className="text-green-400">Free Flow</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-0.5 bg-amber-500 rounded"></span>
                    <span className="text-amber-400">Moderate</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-0.5 bg-red-500 rounded"></span>
                    <span className="text-red-400">Congestion</span>
                </div>
            </div>

            {/* CSS Animations */}
            <style>{`
        @keyframes packet-flow {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -10; }
        }
      `}</style>
        </div>
    );
};

export default NetworkGraph;
