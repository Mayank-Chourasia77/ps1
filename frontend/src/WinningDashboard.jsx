import React, { useState, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import axios from 'axios';
import { Activity, Brain, Radio, ShieldCheck, Zap, AlertTriangle, Layers, Crosshair } from 'lucide-react';

const WinningDashboard = () => {
  const [data, setData] = useState({ nodes: [], links: [] });
  const [metrics, setMetrics] = useState(null);
  const [insight, setInsight] = useState("ESTABLISHING NEURAL LINK...");
  const [optimized, setOptimized] = useState(false);
  const [dimensions, setDimensions] = useState({ w: window.innerWidth, h: window.innerHeight });
  const graphRef = useRef();

  // 1. RESIZE HANDLER (Keeps graph full screen)
  useEffect(() => {
    const handleResize = () => setDimensions({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 2. DATA FETCHING
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:8000/traffic-status');
        const rawData = res.data.graph_data;
        const apiMetrics = res.data.metrics;

        const nodes = new Set();
        const links = rawData.map(row => {
          nodes.add(row.from);
          nodes.add(row.to);
          return { source: row.from, target: row.to, congestion: row.congestion };
        });

        setData({
          nodes: Array.from(nodes).map(id => ({ 
            id, 
            group: id.match(/^\d+$/) ? 2 : 1, 
            val: id.match(/^\d+$/) ? 2 : 15 // Make cities BIGGER
          })),
          links: links
        });
        setMetrics(apiMetrics);

        // TRIGGER AI
        if (apiMetrics) fetchInsight(apiMetrics.price_of_anarchy, res.data.bottleneck.from);

      } catch (err) {
        console.error(err);
        setInsight("ERROR: CANNOT CONNECT TO TRAFFIC GRID.");
      }
    };
    fetchData();
  }, []);

  const fetchInsight = async (poa, location) => {
    setInsight(`DETECTED ANOMALY (PoA: ${poa}). REQUESTING FEATHERLESS ANALYSIS...`);
    try {
      const res = await axios.post('http://127.0.0.1:8000/ai-insight', {
        poa: poa,
        location: location,
        congestion: 100
      });
      // Simple typewriter effect
      let i = 0;
      setInsight("");
      const txt = res.data.insight;
      const interval = setInterval(() => {
        setInsight(prev => prev + txt.charAt(i));
        i++;
        if (i >= txt.length) clearInterval(interval);
      }, 20);
    } catch (e) {
      setInsight("FEATHERLESS AI: UNAUTHORIZED. CHECK API KEY.");
    }
  };

  return (
    <div className="relative w-screen h-screen bg-[#020617] overflow-hidden text-cyan-50 font-mono">
      
      {/* --- LAYER 1: THE GRAPH (BACKGROUND) --- */}
      <div className="absolute inset-0 z-0 opacity-80">
        <ForceGraph2D
          ref={graphRef}
          width={dimensions.w}
          height={dimensions.h}
          graphData={data}
          backgroundColor="#020617"
          nodeLabel="id"
          // NODE STYLING
          nodeColor={node => node.group === 1 ? "#06b6d4" : "#1e293b"} 
          nodeRelSize={8}
          // LINK STYLING
          linkColor={link => {
            if (optimized) return "#22c55e"; // Green Mode
            return link.congestion === 100 ? "#ef4444" : (link.congestion > 50 ? "#f59e0b" : "#1e293b");
          }}
          linkWidth={link => link.congestion > 80 ? 4 : 1}
          // PARTICLES
          linkDirectionalParticles={optimized ? 2 : 4}
          linkDirectionalParticleSpeed={optimized ? 0.02 : 0.005}
          linkDirectionalParticleWidth={3}
          linkDirectionalParticleColor={() => optimized ? "#86efac" : "#ffffff"}
        />
      </div>

      {/* --- LAYER 2: SCANLINES & GRID OVERLAY --- */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-t from-[#020617] via-transparent to-[#020617]"></div>

      {/* --- LAYER 3: HUD INTERFACE (FOREGROUND) --- */}
      
      {/* TOP BAR */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10 pointer-events-none">
        <div className="flex items-center gap-4">
          <div className="p-2 border border-cyan-500/30 bg-cyan-950/30 rounded backdrop-blur-md">
            <Layers className="text-cyan-400" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
              TRAFFIX<span className="text-white">OS</span>
            </h1>
            <div className="text-[10px] text-cyan-500/70 tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              SYSTEM ONLINE
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <div className="text-xs text-slate-500 font-bold">MUMBAI SECTOR 4</div>
          <div className="text-xl font-bold font-mono text-slate-300">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* LEFT SIDEBAR (CONTROLS) */}
      <div className="absolute top-32 left-6 w-96 flex flex-col gap-4 z-20">
        
        {/* METRIC CARD 1: PRICE OF ANARCHY */}
        <div className="p-6 bg-slate-900/80 backdrop-blur-xl border-l-4 border-l-cyan-500 border-y border-r border-slate-700/50 rounded-r-xl shadow-2xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-cyan-400 font-bold tracking-widest">EFFICIENCY METRIC</span>
            <Activity size={16} className={optimized ? "text-green-500" : "text-red-500"} />
          </div>
          <div className="text-6xl font-black text-white mb-2 tracking-tighter">
            {metrics ? (optimized ? "1.05" : metrics.price_of_anarchy) : "---"}
            <span className="text-lg text-slate-500 ml-2 font-normal">x</span>
          </div>
          <div className={`text-xs font-bold px-2 py-1 inline-block rounded ${optimized ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
            {optimized ? "OPTIMAL STATE" : "CRITICAL INEFFICIENCY"}
          </div>
        </div>

        {/* TOGGLE SWITCH */}
        <div className="pointer-events-auto">
          <label className={`flex items-center justify-between p-5 bg-slate-900/90 backdrop-blur-xl border border-slate-700 hover:border-cyan-500 transition-all cursor-pointer rounded-xl group ${optimized ? "shadow-[0_0_30px_rgba(34,197,94,0.2)]" : ""}`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${optimized ? "bg-green-500/20" : "bg-slate-800"}`}>
                <ShieldCheck className={optimized ? "text-green-400" : "text-slate-400"} size={24} />
              </div>
              <div>
                <div className="font-bold text-white group-hover:text-cyan-400 transition">MECHANISM DESIGN</div>
                <div className="text-[10px] text-slate-400">Reroute to System Optimum</div>
              </div>
            </div>
            {/* Custom Toggle UI */}
            <div className="relative w-14 h-8 bg-slate-950 rounded-full border border-slate-700 overflow-hidden">
               <input type="checkbox" className="sr-only" checked={optimized} onChange={() => setOptimized(!optimized)} />
               <div className={`absolute inset-0 bg-green-500 transition-opacity duration-300 ${optimized ? "opacity-100" : "opacity-0"}`}></div>
               <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${optimized ? "translate-x-6" : "translate-x-0"}`}></div>
            </div>
          </label>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 gap-2">
           <div className="bg-slate-900/80 backdrop-blur p-4 rounded border border-slate-700">
              <div className="text-[10px] text-slate-400 mb-1">CURRENT COST</div>
              <div className="text-2xl font-bold">{metrics?.nash_cost || 0}</div>
           </div>
           <div className="bg-slate-900/80 backdrop-blur p-4 rounded border border-slate-700">
              <div className="text-[10px] text-green-400 mb-1">OPTIMAL COST</div>
              <div className="text-2xl font-bold text-green-400">{metrics?.optimal_cost || 0}</div>
           </div>
        </div>
      </div>

      {/* BOTTOM PANEL: AI LOGS */}
      <div className="absolute bottom-6 left-6 right-6 h-48 bg-black/80 backdrop-blur-xl border-t border-cyan-500/30 flex flex-col z-20">
        <div className="h-8 bg-cyan-950/30 flex items-center px-4 gap-2 border-b border-cyan-500/20">
          <Brain size={14} className="text-cyan-400" />
          <span className="text-xs font-bold text-cyan-400 tracking-widest">FEATHERLESS COGNITION ENGINE</span>
        </div>
        <div className="flex-1 p-4 font-mono text-sm overflow-y-auto text-slate-300">
          <span className="text-cyan-500 mr-2">{">"}</span>
          {insight}
          <span className="animate-pulse inline-block w-2 h-4 bg-cyan-500 ml-1 align-middle"></span>
        </div>
      </div>

    </div>
  );
};

export default WinningDashboard;