import React from 'react';

// Static Metro-Style Network Data
const NODES = [
    { id: "Borivali", x: 20, y: 10 },
    { id: "Malad", x: 20, y: 25 },
    { id: "Andheri", x: 25, y: 40 },
    { id: "Bandra", x: 30, y: 55 },
    { id: "Dadar", x: 35, y: 70 },
    { id: "Churchgate", x: 40, y: 85 },
    { id: "Thane", x: 60, y: 15 },
    { id: "Ghatkopar", x: 60, y: 40 },
    { id: "Kurla", x: 50, y: 55 },
    { id: "Vashi", x: 80, y: 60 }
];

const EDGES = [
    ["Borivali", "Malad"],
    ["Malad", "Andheri"],
    ["Andheri", "Bandra"],
    ["Bandra", "Dadar"],
    ["Dadar", "Churchgate"],
    ["Thane", "Ghatkopar"],
    ["Ghatkopar", "Kurla"],
    ["Kurla", "Dadar"],
    ["Dadar", "Vashi"] // The Sea Link
];

// Helper to get node coordinates by ID
const getNodeById = (id) => NODES.find(n => n.id === id);

const NetworkMap = ({
    selectedSource,
    selectedTarget,
    optimized,
    onNodeSelect,
    simulationTime,
    isPlaying
}) => {

    // Determine if an edge is part of the selected route
    const isEdgeOnRoute = (from, to) => {
        if (!selectedSource || !selectedTarget) return false;
        // Simple direct edge check (for more complex routes, use pathfinding)
        return (from === selectedSource && to === selectedTarget) ||
            (from === selectedTarget && to === selectedSource);
    };

    // Calculate edge color and animation speed based on simulation
    const getEdgeStyle = (from, to) => {
        const isPeak = (simulationTime >= 8 && simulationTime <= 11) ||
            (simulationTime >= 17 && simulationTime <= 20);
        const onRoute = isEdgeOnRoute(from, to);

        if (onRoute) {
            if (optimized) {
                return { className: 'flow-anim flow-fast', stroke: '#22c55e' }; // Green
            } else {
                return { className: 'flow-anim flow-slow', stroke: '#ef4444' }; // Red
            }
        }

        // Background edges
        if (isPeak && !optimized) {
            return { className: 'flow-anim flow-slow', stroke: '#f59e0b', opacity: 0.4 }; // Orange
        }
        return { className: '', stroke: '#334155', opacity: 0.3 }; // Dim gray
    };

    return (
        <div className="w-full h-full relative bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
            {/* Grid Background */}
            <div className="absolute inset-0 schematic-grid opacity-20 pointer-events-none"></div>

            <svg
                className="w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Render All Edges */}
                {EDGES.map(([from, to], idx) => {
                    const start = getNodeById(from);
                    const end = getNodeById(to);
                    if (!start || !end) return null;

                    const style = getEdgeStyle(from, to);
                    const isOnRoute = isEdgeOnRoute(from, to);

                    return (
                        <g key={`edge-${idx}`}>
                            {/* Main Edge Line */}
                            <line
                                x1={start.x}
                                y1={start.y}
                                x2={end.x}
                                y2={end.y}
                                stroke={style.stroke}
                                strokeWidth={isOnRoute ? 0.8 : 0.4}
                                opacity={style.opacity || 1}
                                className={style.className}
                                strokeLinecap="round"
                            />

                            {/* Ghost Line for Optimized Traffic Split */}
                            {isOnRoute && optimized && (
                                <path
                                    d={`M ${start.x} ${start.y} Q ${(start.x + end.x) / 2 + 3} ${(start.y + end.y) / 2 - 5} ${end.x} ${end.y}`}
                                    fill="none"
                                    stroke="#06b6d4"
                                    strokeWidth="0.3"
                                    strokeDasharray="1,1"
                                    className="flow-anim flow-fast"
                                    opacity="0.6"
                                />
                            )}
                        </g>
                    );
                })}

                {/* Render All Nodes */}
                {NODES.map((node) => {
                    const isSelected = node.id === selectedSource || node.id === selectedTarget;
                    const isSource = node.id === selectedSource;
                    const isTarget = node.id === selectedTarget;

                    return (
                        <g
                            key={node.id}
                            onClick={() => onNodeSelect(node.id)}
                            className="cursor-pointer"
                            style={{ transition: 'transform 0.2s' }}
                        >
                            {/* Outer Glow for Selected Nodes */}
                            {isSelected && (
                                <circle
                                    cx={node.x}
                                    cy={node.y}
                                    r="3"
                                    fill="none"
                                    stroke={isSource ? "#06b6d4" : "#f59e0b"}
                                    strokeWidth="0.2"
                                    opacity="0.5"
                                    className="animate-pulse"
                                />
                            )}

                            {/* Node Circle */}
                            <circle
                                cx={node.x}
                                cy={node.y}
                                r={isSelected ? 1.8 : 1.2}
                                fill={isSelected ? (isSource ? "#06b6d4" : "#f59e0b") : "#1e293b"}
                                stroke={isSelected ? "#ffffff" : "#06b6d4"}
                                strokeWidth={isSelected ? 0.4 : 0.2}
                            />

                            {/* Node Label */}
                            <text
                                x={node.x}
                                y={node.y + 4}
                                fontSize="2"
                                textAnchor="middle"
                                fill={isSelected ? "#ffffff" : "#64748b"}
                                className="font-mono font-bold uppercase"
                                style={{ pointerEvents: 'none' }}
                            >
                                {node.id}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-2 left-2 flex items-center gap-4 text-[8px] font-mono text-slate-500 bg-slate-900/80 px-2 py-1 rounded">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-green-500"></div>
                    <span>OPTIMIZED</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-red-500"></div>
                    <span>CONGESTED</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-cyan-500 opacity-50"></div>
                    <span>SPLIT</span>
                </div>
            </div>
        </div>
    );
};

export default NetworkMap;
