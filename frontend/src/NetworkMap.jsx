import React from 'react';

// Real Mumbai Schematic - Geographically Accurate
const STATIONS = [
    { id: "Borivali", x: 30, y: 10 },
    { id: "Malad", x: 30, y: 20 },
    { id: "Andheri", x: 35, y: 35 }, // Hub
    { id: "Bandra", x: 30, y: 50 },
    { id: "Dadar", x: 35, y: 65 },
    { id: "Lower Parel", x: 30, y: 75 },
    { id: "Churchgate", x: 35, y: 90 },
    { id: "Thane", x: 70, y: 15 }, // Eastern Suburbs
    { id: "Ghatkopar", x: 70, y: 35 },
    { id: "Kurla", x: 60, y: 50 },
    { id: "Vashi", x: 85, y: 60 }
];

const CONNECTIONS = [
    // Western Line (The Main Backbone)
    ["Borivali", "Malad"],
    ["Malad", "Andheri"],
    ["Andheri", "Bandra"],
    ["Bandra", "Dadar"],
    ["Dadar", "Lower Parel"],
    ["Lower Parel", "Churchgate"],
    // Eastern / Central Line
    ["Thane", "Ghatkopar"],
    ["Ghatkopar", "Kurla"],
    ["Kurla", "Dadar"],
    // Key Connectors
    ["Andheri", "Ghatkopar"], // Metro Link
    ["Bandra", "Kurla"], // BKC Connector
    ["Dadar", "Vashi"] // Harbour Link
];

// Helper to get station coordinates by ID
const getStation = (id) => STATIONS.find(s => s.id === id);

// Simple pathfinding: Find all edges on a route between two stations
const findPath = (from, to) => {
    // BFS for shortest path
    const visited = new Set();
    const queue = [[from, []]];

    while (queue.length > 0) {
        const [current, path] = queue.shift();
        if (current === to) return path;
        if (visited.has(current)) continue;
        visited.add(current);

        for (const [a, b] of CONNECTIONS) {
            let next = null;
            if (a === current && !visited.has(b)) next = b;
            if (b === current && !visited.has(a)) next = a;
            if (next) {
                queue.push([next, [...path, [current, next]]]);
            }
        }
    }
    return [];
};

const NetworkMap = ({
    selectedSource,
    selectedTarget,
    optimized,
    onNodeSelect,
    simulationTime
}) => {
    // Calculate the active path
    const activePath = (selectedSource && selectedTarget)
        ? findPath(selectedSource, selectedTarget)
        : [];

    // Check if an edge is on the active path
    const isEdgeOnPath = (from, to) => {
        return activePath.some(([a, b]) =>
            (a === from && b === to) || (a === to && b === from)
        );
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
                {/* Render All Connections (Grey Background) */}
                {CONNECTIONS.map(([from, to], idx) => {
                    const start = getStation(from);
                    const end = getStation(to);
                    if (!start || !end) return null;

                    const onPath = isEdgeOnPath(from, to);

                    // Determine style based on mode
                    let strokeColor = "#334155"; // Default grey
                    let animClass = "";
                    let strokeWidth = 0.4;
                    let opacity = 0.3;

                    if (onPath) {
                        strokeWidth = 1;
                        opacity = 1;
                        if (optimized) {
                            strokeColor = "#22c55e"; // Green
                            animClass = "flow-line anim-fast";
                        } else {
                            strokeColor = "#ef4444"; // Red
                            animClass = "flow-line anim-slow";
                        }
                    }

                    return (
                        <line
                            key={`conn-${idx}`}
                            x1={start.x}
                            y1={start.y}
                            x2={end.x}
                            y2={end.y}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            opacity={opacity}
                            className={animClass}
                            strokeLinecap="round"
                        />
                    );
                })}

                {/* Ghost Line for Optimized Mode (Traffic Split Visualizer) */}
                {optimized && activePath.length > 0 && activePath.map(([from, to], idx) => {
                    const start = getStation(from);
                    const end = getStation(to);
                    if (!start || !end) return null;

                    return (
                        <path
                            key={`ghost-${idx}`}
                            d={`M ${start.x} ${start.y} Q ${(start.x + end.x) / 2 + 4} ${(start.y + end.y) / 2 - 4} ${end.x} ${end.y}`}
                            fill="none"
                            stroke="#06b6d4"
                            strokeWidth="0.3"
                            strokeDasharray="1,1"
                            className="flow-line anim-fast"
                            opacity="0.5"
                        />
                    );
                })}

                {/* Render All Stations */}
                {STATIONS.map((station) => {
                    const isSelected = station.id === selectedSource || station.id === selectedTarget;
                    const isSource = station.id === selectedSource;

                    return (
                        <g
                            key={station.id}
                            onClick={() => onNodeSelect(station.id)}
                            className="cursor-pointer"
                        >
                            {/* Outer Glow */}
                            {isSelected && (
                                <circle
                                    cx={station.x}
                                    cy={station.y}
                                    r="3.5"
                                    fill="none"
                                    stroke={isSource ? "#06b6d4" : "#f59e0b"}
                                    strokeWidth="0.15"
                                    opacity="0.6"
                                    className="animate-pulse"
                                />
                            )}

                            {/* Station Dot */}
                            <circle
                                cx={station.x}
                                cy={station.y}
                                r={isSelected ? 2 : 1.2}
                                fill={isSelected ? (isSource ? "#06b6d4" : "#f59e0b") : "#1e293b"}
                                stroke={isSelected ? "#ffffff" : "#06b6d4"}
                                strokeWidth={isSelected ? 0.3 : 0.15}
                            />

                            {/* Station Label */}
                            <text
                                x={station.x}
                                y={station.y + 4.5}
                                fontSize="2.2"
                                textAnchor="middle"
                                fill={isSelected ? "#ffffff" : "#64748b"}
                                className="font-mono font-bold uppercase"
                                style={{ pointerEvents: 'none' }}
                            >
                                {station.id}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-2 left-2 flex items-center gap-4 text-[8px] font-mono text-slate-400 bg-slate-900/90 px-3 py-1.5 rounded border border-slate-700">
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-0.5 bg-red-500"></div>
                    <span>CURRENT (JAM)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-0.5 bg-green-500"></div>
                    <span>OPTIMIZED</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-0.5 bg-cyan-500 opacity-60"></div>
                    <span>SPLIT</span>
                </div>
            </div>

            {/* Title */}
            <div className="absolute top-2 left-2 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                Mumbai Rail Network // Schematic
            </div>
        </div>
    );
};

export default NetworkMap;
