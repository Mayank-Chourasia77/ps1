import React from 'react';

// Explicit Node Positions for Mumbai Schematic
const NODE_POSITIONS = {
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

const NetworkGraph = ({ data, selectedSource, selectedTarget, optimized, onNodeSelect }) => {
    // Helper to get coordinates
    const getCoords = (nodeName) => NODE_POSITIONS[nodeName];

    // Render Background Links (Context)
    const renderBackgroundLinks = () => {
        if (!data || !data.links) return null;
        return data.links.map((link, idx) => {
            const u = link.source.id || link.source;
            const v = link.target.id || link.target;
            const start = getCoords(u);
            const end = getCoords(v);
            if (!start || !end) return null;

            return (
                <line
                    key={`bg-${idx}`}
                    x1={`${start.x}%`} y1={`${start.y}%`}
                    x2={`${end.x}%`} y2={`${end.y}%`}
                    stroke="#334155"
                    strokeWidth="1"
                    opacity="0.2"
                />
            );
        });
    };

    // Render Active Route
    const renderActiveRoute = () => {
        if (!selectedSource || !selectedTarget) return null;
        const start = getCoords(selectedSource);
        const end = getCoords(selectedTarget);
        if (!start || !end) return null;

        if (optimized) {
            // OPTIMIZED: Two paths
            // Path A: Straight Green Fast
            // Path B: Curved Dashed Green (Ghost)

            // Calculate Control Point for Curve (Offset by 20px roughly, implying % offset)
            // Simple quadratic curve offset
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;
            // Offset perpendicular? Or just generic offset. User said "Quadratic Bezier line (offset by 20px)"
            // In %, 20px is roughly 2-5%? Let's use 5% offset.
            const ctrlX = midX + 5;
            const ctrlY = midY - 5;

            return (
                <>
                    {/* Path A: Straight Green Fast */}
                    <line
                        x1={`${start.x}%`} y1={`${start.y}%`}
                        x2={`${end.x}%`} y2={`${end.y}%`}
                        className="flow-anim flow-fast"
                        strokeWidth="3"
                    />
                    {/* Path B: Curved Ghost */}
                    <path
                        d={`M ${start.x} ${start.y} Q ${ctrlX} ${ctrlY} ${end.x} ${end.y}`} // Note: d attribute expects unitless numbers typically, but here we need to map to SVG space. 
                        // Wait, SVG 'd' path commands in React with percentage coords often don't work directly if the SVG isn't viewing 0-100 space.
                        // But since 'line' works with %, does 'path'? 
                        // NO. 'path' 'd' attribute parses numbers as user units (pixels usually).
                        // To use %, we must set viewBox="0 0 100 100" and preserveAspectRatio="none".
                        // Then all numbers are treated as 0-100 space.

                        className="flow-anim flow-fast"
                        stroke="#22c55e"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray="5,5"
                        style={{ opacity: 0.6 }}
                    />
                </>
            );
        } else {
            // CURRENT: Single Red Slow
            return (
                <line
                    x1={`${start.x}%`} y1={`${start.y}%`}
                    x2={`${end.x}%`} y2={`${end.y}%`}
                    className="flow-anim flow-slow"
                    strokeWidth="3"
                />
            );
        }
    };

    // To make 'path d' work with logic 0-100, we use viewBox="0 0 100 100".
    // Accessing coordinates directly works then.

    return (
        <div className="w-full h-full relative bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
            {/* Metric Grid Background */}
            <div className="absolute inset-0 schematic-grid opacity-20 pointer-events-none"></div>

            <svg
                className="w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
            >
                {/* Background Network */}
                {renderBackgroundLinks()}

                {/* Selected Route */}
                {renderActiveRoute()}

                {/* Nodes */}
                {Object.entries(NODE_POSITIONS).map(([name, pos]) => {
                    const isSelected = name === selectedSource || name === selectedTarget;
                    return (
                        <g
                            key={name}
                            onClick={() => onNodeSelect(name)}
                            className="cursor-pointer hover:opacity-80"
                        >
                            <circle
                                cx={pos.x}
                                cy={pos.y}
                                r={isSelected ? 1.5 : 1}
                                fill={isSelected ? "#06b6d4" : "#0f172a"}
                                stroke={isSelected ? "#ffffff" : "#06b6d4"}
                                strokeWidth={0.3}
                            />
                            <text
                                x={pos.x}
                                y={pos.y + 3}
                                fontSize="2.5"
                                textAnchor="middle"
                                fill={isSelected ? "#ffffff" : "#64748b"}
                                className="font-mono font-bold uppercase"
                                style={{ pointerEvents: 'none' }}
                            >
                                {name}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export default NetworkGraph;
