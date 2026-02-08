import React, { useState } from 'react';

// Schematic Coordinates (0-100% of container)
const NODES = {
    "Colaba": { x: 50, y: 95 },
    "CST / Fort": { x: 50, y: 88 },
    "Lower Parel": { x: 48, y: 78 },
    "Worli": { x: 42, y: 75 },
    "Dadar West": { x: 45, y: 70 },
    "Dadar East": { x: 55, y: 70 },
    "Bandra West": { x: 35, y: 60 },
    "Bandra East": { x: 45, y: 60 },
    "Sion": { x: 60, y: 60 },
    "Kurla": { x: 65, y: 50 },
    "Santacruz": { x: 35, y: 52 },
    "Vile Parle": { x: 35, y: 45 },
    "Andheri West": { x: 30, y: 38 },
    "Andheri East": { x: 40, y: 38 },
    "Goregaon": { x: 30, y: 28 },
    "Malad": { x: 30, y: 20 },
    "Borivali": { x: 30, y: 10 },
    "Powai": { x: 60, y: 30 },
    "Ghatkopar": { x: 70, y: 45 },
    "Chembur": { x: 70, y: 55 }
};

const NetworkMap = ({ data, simulationTime, optimized, onNodeSelect, selectedSource, selectedTarget }) => {
    const [hoveredNode, setHoveredNode] = useState(null);

    // Link rendering logic
    const renderLinks = () => {
        if (!data || !data.links) return null;

        return data.links.map((link, idx) => {
            const sourceId = link.source.id || link.source;
            const targetId = link.target.id || link.target;
            const start = NODES[sourceId];
            const end = NODES[targetId];

            if (!start || !end) return null;

            // Simulation Logic
            const isPeak = (simulationTime >= 8 && simulationTime <= 10) || (simulationTime >= 17 && simulationTime <= 20);
            const isCongested = (link.congestion > 70) || (isPeak && !optimized);

            // Determine Animation Class
            let animClass = "traffic-anim traffic-static"; // Default faint
            let strokeColor = "#334155";

            // If it's a main route or high congestion, animate it
            if (isCongested) {
                animClass = "traffic-anim slow";
                strokeColor = "#ef4444";
            } else if (optimized) {
                animClass = "traffic-anim fast";
                strokeColor = "#22c55e";
            } else if (link.congestion < 40) {
                animClass = "traffic-anim fast";
                strokeColor = "#22c55e";
            } else {
                animClass = "traffic-anim"; // Medium opacity handled by base class? No, let's explicit
                // actually we can use the 'traffic-anim' base with no modifier for medium? 
                // Let's use inline styles to be sure or add 'medium' class if defined
                strokeColor = "#f59e0b"; // Orange
            }

            // Force re-render with key
            const key = `${sourceId}-${targetId}-${Math.floor(simulationTime)}-${optimized}`;

            return (
                <g key={key}>
                    {/* Main Line */}
                    <line
                        x1={`${start.x}%`} y1={`${start.y}%`}
                        x2={`${end.x}%`} y2={`${end.y}%`}
                        className={animClass}
                        stroke={strokeColor}
                        strokeWidth="3"
                    />

                    {/* Ghost Line (Optimized Traffic Split) */}
                    {optimized && isCongested && (
                        <path
                            d={`M ${start.x} ${start.y} Q ${(start.x + end.x) / 2 + 5} ${(start.y + end.y) / 2 - 5} ${end.x} ${end.y}`}
                            fill="none"
                            stroke="#06b6d4"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                            className="opacity-60"
                        >
                            <animate attributeName="stroke-dashoffset" from="10" to="0" dur="1s" repeatCount="indefinite" />
                        </path>
                    )}
                </g>
            );
        });
    };

    return (
        <div className="w-full h-full relative bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
            {/* Grid Pattern */}
            <div className="absolute inset-0 schematic-grid opacity-30 pointer-events-none"></div>

            <svg className="w-full h-full">
                {/* Render Links */}
                {renderLinks()}

                {/* Render Nodes */}
                {Object.entries(NODES).map(([name, pos]) => {
                    const isSelected = name === selectedSource || name === selectedTarget;
                    return (
                        <g
                            key={name}
                            onClick={() => onNodeSelect(name)}
                            onMouseEnter={() => setHoveredNode(name)}
                            onMouseLeave={() => setHoveredNode(null)}
                            className="cursor-pointer transition-all duration-300"
                            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                        >
                            <circle
                                cx={`${pos.x}%`}
                                cy={`${pos.y}%`}
                                r={isSelected ? "8" : "5"}
                                fill={isSelected ? "#06b6d4" : "#0f172a"}
                                stroke={isSelected ? "#ffffff" : "#06b6d4"}
                                strokeWidth={isSelected ? "3" : "2"}
                                className={`${isSelected ? 'route-glow' : ''} hover:scale-150 transition-transform`}
                            />
                            {/* Label */}
                            <text
                                x={`${pos.x}%`}
                                y={`${pos.y + 4}%`}
                                textAnchor="middle"
                                fill="#94a3b8"
                                fontSize="80%" // SVG coordinates relative to viewbox, using % for responsiveness
                                className="text-[10px] font-mono pointer-events-none uppercase tracking-wider font-bold"
                            >
                                {name}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Hover Tooltip */}
            {hoveredNode && (
                <div
                    className="absolute z-50 pointer-events-none bg-slate-900/90 border border-cyan-500/50 p-2 rounded text-xs text-cyan-400 font-mono shadow-[0_0_15px_rgba(6,182,212,0.3)] backdrop-blur-sm"
                    style={{
                        left: `${NODES[hoveredNode].x}%`,
                        top: `${NODES[hoveredNode].y - 8}%`,
                        transform: 'translateX(-50%)'
                    }}
                >
                    <div className="font-bold text-white mb-1">{hoveredNode}</div>
                    <div>STATUS: ONLINE</div>
                    <div>LOAD: {Math.floor(Math.random() * 40 + 40)}%</div>
                </div>
            )}
        </div>
    );
};

export default NetworkMap;
