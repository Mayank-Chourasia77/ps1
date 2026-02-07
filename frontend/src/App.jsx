import React, { useState, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import axios from 'axios';

const formatNumber = (val) => {
  return new Intl.NumberFormat('en-US').format(val);
};

const App = () => {
  // --- STATE ---
  const [data, setData] = useState({ nodes: [], links: [] });
  const [metrics, setMetrics] = useState(null);
  const [optimized, setOptimized] = useState(false);
  const [insightLog, setInsightLog] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [congestionMode, setCongestionMode] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAiCollapsed, setIsAiCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Resizable Panels State
  const [sidebarWidth, setSidebarWidth] = useState(() => parseInt(localStorage.getItem('sidebarWidth')) || 384);
  const [insightsHeight, setInsightsHeight] = useState(() => parseInt(localStorage.getItem('insightsHeight')) || 350);
  const isResizing = useRef(null);

  // Persist sizes
  useEffect(() => {
    localStorage.setItem('sidebarWidth', sidebarWidth);
    localStorage.setItem('insightsHeight', insightsHeight);
  }, [sidebarWidth, insightsHeight]);

  // Global Resize Listeners
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current) return;

      if (isResizing.current.type === 'sidebar') {
        const delta = isResizing.current.startX - e.clientX;
        const newWidth = Math.max(300, Math.min(600, isResizing.current.startVal + delta));
        setSidebarWidth(newWidth);
      }

      if (isResizing.current.type === 'insights') {
        const delta = isResizing.current.startY - e.clientY;
        const newHeight = Math.max(200, Math.min(600, isResizing.current.startVal + delta));
        setInsightsHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      isResizing.current = null;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startResizing = (type, e) => {
    if (!isDesktop) return;
    e.preventDefault();
    isResizing.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      startVal: type === 'sidebar' ? sidebarWidth : insightsHeight
    };
    document.body.style.cursor = type === 'sidebar' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  };

  const graphRef = useRef();
  const [lastBottleneck, setLastBottleneck] = useState(null);

  // --- INITIAL LOAD ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/traffic-status');
      const { graph_data, metrics: apiMetrics, bottleneck } = res.data;

      const nodesSet = new Set();
      graph_data.forEach(l => {
        nodesSet.add(l.from);
        nodesSet.add(l.to);
      });

      const nodes = Array.from(nodesSet).map(id => ({
        id,
        val: id.match(/^\d+$/) ? 3 : 5
      }));

      const links = graph_data.map(l => ({
        source: l.from,
        target: l.to,
        congestion: l.congestion
      }));

      setData({ nodes, links });
      setMetrics(apiMetrics);
      setLastBottleneck(bottleneck);

      if (bottleneck && bottleneck.from) {
        // Auto-log bottleneck
        // addLog({ type: 'text', msg: `BOTTLENECK DETECTED: ${bottleneck.from} -> ${bottleneck.to}`, colorClass: 'text-accent-warning' });
      }

    } catch (err) {
      console.error(err);
      addLog({ type: 'text', msg: "CONNECTION ERROR: Backend unreachable.", colorClass: "text-accent-danger" });
    }
  };

  const handleAiInsight = async (poa, location, intent = null, query = null) => {
    setIsTyping(true);
    try {
      const res = await axios.post('http://127.0.0.1:8000/ai-insight', {
        poa: poa,
        location: location || "Network",
        congestion: 90,
        intent: intent,
        query: query
      });

      const { insight, format } = res.data;

      if (format === 'json') {
        try {
          const parsed = JSON.parse(insight);
          addLog({ type: 'structured', data: parsed });
        } catch (e) {
          addLog({ type: 'text', msg: insight, colorClass: "text-white" });
        }
      } else {
        addLog({ type: 'text', msg: insight, colorClass: "text-white" });
      }
    } catch (e) {
      addLog({ type: 'text', msg: `AI ERROR: ${e.message}`, colorClass: "text-accent-danger" });
    } finally {
      setIsTyping(false);
    }
  };

  const addLog = (entry) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setInsightLog(prev => [{ id: Date.now(), time, ...entry }, ...prev].slice(0, 10));
  };

  const handleAiQuery = (intent, label) => {
    if (!metrics) return;
    addLog({ type: 'text', msg: `QUERYING: ${label}...`, colorClass: "text-primary" });
    handleAiInsight(metrics.price_of_anarchy, lastBottleneck?.from, intent);
  };

  const handleUserSubmit = (e) => {
    e.preventDefault();
    if (!userQuery.trim() || !metrics) return;

    const q = userQuery;
    setUserQuery('');
    addLog({ type: 'text', msg: `USER: ${q}`, colorClass: "text-cyan-400" });
    handleAiInsight(metrics.price_of_anarchy, lastBottleneck?.from, null, q);
  };

  const MetricCard = ({ icon, title, value, subtext, trend, trendValue, trendOptimized, tooltip, progressBar }) => (
    <div className="group relative p-4 rounded-xl bg-[#182b34] border border-[#223c49] transition-all duration-300 hover:scale-[1.05] hover:shadow-[0_0_20px_rgba(13,166,242,0.15)] hover:border-primary/50 z-10">
      {/* Tooltip */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#0b1216] text-slate-300 text-[10px] px-3 py-1.5 rounded border border-[#223c49] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50">
        {tooltip}
        <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 size-2 bg-[#0b1216] border-b border-r border-[#223c49] rotate-45"></div>
      </div>

      <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <span className="material-symbols-outlined text-4xl">{icon}</span>
      </div>
      <p className="text-xs text-slate-400 uppercase font-medium mb-1">{title}</p>

      {progressBar ? (
        <div className="mt-2 text-xs">
          {progressBar}
          <div className="flex justify-between font-mono text-slate-400 mt-1">
            <span>Low</span>
            <span className="text-white">{value}</span>
            <span>High</span>
          </div>
        </div>
      ) : (
        <div className="flex items-end justify-between">
          <p className="text-2xl font-bold text-white font-mono">
            {value}
            {subtext && <span className="text-sm text-slate-500">{subtext}</span>}
          </p>
          {trend && (
            <div className={`flex items-center text-sm font-medium px-1.5 py-0.5 rounded ${trendOptimized ? 'text-accent-success bg-accent-success/10' : 'text-slate-500 bg-slate-800'}`}>
              <span className="material-symbols-outlined text-sm mr-0.5">{trend}</span>
              {trendValue}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display overflow-hidden h-screen flex flex-col">
      {/* Top Navigation */}
      <header className="flex-none flex items-center justify-between border-b border-[#223c49] bg-[#101d23] px-6 py-3 z-50">
        <div className="flex items-center gap-4">
          <div className="size-8 text-primary animate-pulse">
            <span className="material-symbols-outlined text-3xl">hub</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-widest text-white glow-text-primary">TRAFFIX AI</h1>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="size-2 rounded-full bg-accent-success animate-pulse"></span>
              SYSTEM ONLINE // V.2.4.0
            </div>
          </div>
        </div>
        {/* ... (Existing Nav Items) ... */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex bg-[#182b34] p-1 rounded-lg border border-[#223c49]">
            <button className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all bg-[#101d23] text-slate-400 hover:text-white">
              <span className="material-symbols-outlined text-[18px]">person</span>
              Profile
            </button>
            <button className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all bg-[#101d23] text-slate-400 hover:text-white ml-1">
              <span className="material-symbols-outlined text-[18px]">settings</span>
              Settings
            </button>
          </div>
          <button className="flex size-10 items-center justify-center rounded-lg bg-[#223c49] text-white hover:bg-[#315668] transition-colors relative">
            <span className="absolute top-2 right-2 size-2 bg-accent-danger rounded-full border border-[#223c49]"></span>
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div className="size-10 rounded-full overflow-hidden border border-[#223c49]">
            <img alt="User Profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-2wOJIh6UN6sTcTG6mA5zsjYpHlx6HkcaBqAGt6pTQ8VnqCptAaxp7A8qiY0P9hDB7FpX6zaRflb4atOAuqGcMmMbj7e7cyKv146duqkpkExuGmCNqNFgyUtrEiY9j3dU4mo0qi0z5_0btF3-682r5ot3BUEBytt2vdwyIQ7D-odVVW4bLwx92XL6Iydkj6oCGzczrTsxUFmlTsK7DeS-wVpePzBBXoEdUg_VmyFvgo9XMMLxDNI47IsD7pDWCIcMUdjRqD0uKPM" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <div className="absolute inset-0 bg-grid-pattern grid-bg opacity-10 pointer-events-none z-0"></div>

        {/* Left/Center: Visualization Map */}
        <section className="flex-1 flex flex-col relative z-10 p-4 gap-4 overflow-hidden min-h-[50vh] lg:min-h-0">
          {/* Map Controls */}
          <div className="flex justify-between items-start absolute top-6 left-6 right-6 z-20 pointer-events-none">
            <div className="pointer-events-auto glass-panel rounded-lg p-1 flex items-center shadow-lg">
              <div className="px-3 text-slate-400">
                <span className="material-symbols-outlined">search</span>
              </div>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none text-white placeholder-slate-500 focus:ring-0 w-32 md:w-64 text-sm font-mono focus:outline-none"
                placeholder="Search..."
                type="text"
              />
            </div>

            <div className="pointer-events-auto glass-panel p-1.5 rounded-xl shadow-2xl flex gap-1 border border-primary/30 glow-border-primary">
              <button
                onClick={() => setOptimized(false)}
                className={`group relative px-4 md:px-6 py-2 rounded-lg overflow-hidden transition-all duration-300 ${!optimized ? 'hover:bg-white/5' : ''}`}
              >
                {!optimized && <div className="absolute inset-0 bg-white/5"></div>}
                <div className="relative z-10 flex flex-col items-center">
                  <span className={`text-xs font-bold tracking-widest mb-0.5 ${!optimized ? 'text-white' : 'text-slate-400'}`}>CURRENT</span>
                </div>
              </button>
              <button
                onClick={() => { setOptimized(true); addLog({ type: 'text', msg: "OPTIMIZING...", colorClass: "text-accent-success" }); }}
                className={`group relative px-4 md:px-6 py-2 rounded-lg bg-primary shadow-lg overflow-hidden transition-all duration-300`}
              >
                {optimized ? (
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-cyan-400"></div>
                ) : (
                  <div className="absolute inset-0 bg-[#101d23] opacity-90"></div>
                )}
                <div className="relative z-10 flex flex-col items-center">
                  <span className={`text-xs font-bold tracking-widest mb-0.5 ${optimized ? 'text-white' : 'text-slate-500'}`}>OPTIMIZED</span>
                </div>
              </button>
            </div>

            <div className="pointer-events-auto flex flex-col gap-2">
              <div className="glass-panel rounded-lg p-1 flex flex-col shadow-lg">
                <button
                  className={`p-2 hover:bg-white/10 rounded ${congestionMode ? 'text-accent-danger' : 'text-slate-300'} hover:text-white`}
                  title="Toggle Heatmap Mode"
                  onClick={() => setCongestionMode(!congestionMode)}
                >
                  <span className="material-symbols-outlined">local_fire_department</span>
                </button>
              </div>
            </div>
          </div>

          {/* Visualization Viewport */}
          <div className="w-full h-full rounded-2xl overflow-hidden relative border border-[#223c49] bg-[#0b1216] shadow-inner group">
            <div className="scanline"></div>
            <img
              alt="City Map"
              className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen filter saturate-0 contrast-125 pointer-events-none"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBO2Abjox1UOMI6TOexLn1Up6XGLYSBhGjpWPjYKivQkh5i5Ev0TMwAhCh-LgKYo2VN28NtnEyvna-qFbKrp0_bHgqB5ZT9SkaU1k3brN9vToDQc1QIh2KVmt1zUnnjlLI00JcsH-lz5kX9FRq_h8RChjEM7SeQP_1CFyIAmVDLlw7Q05z4Cl_0TWPhE-8F7mLbEwXAuzZDh2rR1DMC7EF6hNFSFiXkqbSa88LtuJGvaU9Gipu1T2qQfoxMukBp-VDJRNj7wq6LFdA"
            />

            <div className="absolute inset-0 z-10">
              <ForceGraph2D
                ref={graphRef}
                graphData={data}
                backgroundColor="rgba(0,0,0,0)" // Transparent
                showNavInfo={false}
                nodeLabel="id"
                nodeColor={node => {
                  if (searchTerm && !node.id.toLowerCase().includes(searchTerm.toLowerCase())) return "#1e293b"; // Dimmed
                  if (searchTerm && node.id.toLowerCase().includes(searchTerm.toLowerCase())) return "#ef4444"; // Highlight match
                  return "#0da6f2"; // Default
                }}
                nodeRelSize={4}
                linkColor={link => {
                  if (searchTerm) {
                    const sourceMatch = typeof link.source === 'object' ? link.source.id.toLowerCase().includes(searchTerm.toLowerCase()) : link.source.toLowerCase().includes(searchTerm.toLowerCase());
                    const targetMatch = typeof link.target === 'object' ? link.target.id.toLowerCase().includes(searchTerm.toLowerCase()) : link.target.toLowerCase().includes(searchTerm.toLowerCase());
                    if (!sourceMatch && !targetMatch) return "#1e293b";
                  }
                  if (optimized) return "#10b981";
                  if (congestionMode) {
                    if (link.congestion > 70) return "#ff0000";
                    if (link.congestion > 40) return "#ff8800";
                    return "#334155";
                  }
                  if (link.congestion > 80) return "#ef4444";
                  if (link.congestion > 50) return "#f59e0b";
                  return "#334155";
                }}
                linkWidth={link => {
                  if (optimized) return 2;
                  if (congestionMode && link.congestion > 50) return 4;
                  return link.congestion > 50 ? 3 : 1;
                }}
                linkDirectionalParticles={optimized ? 2 : (link => link.congestion > 60 ? 4 : 0)}
                linkDirectionalParticleSpeed={optimized ? 0.01 : 0.005}
              />
            </div>
          </div>

          {/* Bottom Console: AI Insights */}
          <div
            style={isDesktop ? { height: insightsHeight } : { height: isAiCollapsed ? '48px' : '300px' }}
            className={`glass-panel rounded-xl border border-[#223c49] flex flex-col overflow-hidden relative shrink-0 transition-all duration-300`}
          >
            {/* Resizer Handle (Desktop Only) */}
            {isDesktop && <div
              className="absolute top-0 left-0 right-0 h-1 cursor-row-resize hover:bg-primary z-50"
              onMouseDown={(e) => startResizing('insights', e)}
            ></div>}

            {/* AI Control Header */}
            <div
              className="flex items-center justify-between px-4 py-2 bg-[#101d23]/80 border-b border-[#223c49] cursor-pointer"
              onClick={() => !isDesktop && setIsAiCollapsed(!isAiCollapsed)}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">terminal</span>
                <span className="text-xs font-bold text-slate-300 tracking-wider">AI INSIGHTS STREAM</span>
                {!isDesktop && (
                  <span className="material-symbols-outlined text-xs text-slate-500">
                    {isAiCollapsed ? 'expand_more' : 'expand_less'}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">LOG_ID: {Date.now().toString().slice(-4)}</span>
            </div>

            {/* AI Suggestions / Quick Actions */}
            <div className="px-4 py-2 flex gap-2 overflow-x-auto bg-black/20 border-b border-[#223c49]/50 shrink-0">
              <button onClick={() => handleAiQuery('cause', 'Why is traffic high?')} className="whitespace-nowrap px-3 py-1 rounded bg-[#182b34] hover:bg-primary/20 text-[10px] text-slate-300 hover:text-white border border-[#223c49] transition-colors">
                Cause?
              </button>
              <button onClick={() => handleAiQuery('routes', 'Suggest alternate routes')} className="whitespace-nowrap px-3 py-1 rounded bg-[#182b34] hover:bg-primary/20 text-[10px] text-slate-300 hover:text-white border border-[#223c49] transition-colors">
                Routes?
              </button>
              <button onClick={() => handleAiQuery('cooldown', 'Estimated cooldown time')} className="whitespace-nowrap px-3 py-1 rounded bg-[#182b34] hover:bg-primary/20 text-[10px] text-slate-300 hover:text-white border border-[#223c49] transition-colors">
                Cooldown?
              </button>
              <button onClick={() => handleAiQuery('strategy', 'Best intervention strategy')} className="whitespace-nowrap px-3 py-1 rounded bg-[#182b34] hover:bg-primary/20 text-[10px] text-slate-300 hover:text-white border border-[#223c49] transition-colors">
                Strategy?
              </button>
            </div>

            {/* Log Stream */}
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2">
              {insightLog.length === 0 ? (
                <>
                  <p className="text-slate-400"><span className="text-primary">[System]</span> Ready for analysis.</p>
                  <p className="text-slate-500 italic">Select an AI query or type below...</p>
                </>
              ) : (
                insightLog.map(l => (
                  <div key={l.id} className="animate-in fade-in slide-in-from-bottom-1 mb-2">
                    <p className="text-slate-400 mb-0.5">
                      <span className="text-primary">[{l.time}]</span>
                      {l.type === 'text' && <span className={`ml-2 ${l.colorClass}`}>{l.msg}</span>}
                    </p>

                    {l.type === 'structured' && (
                      <div className="ml-6 mt-1 flex flex-col gap-2 p-2 rounded bg-black/30 border border-[#223c49]">
                        {l.data.cause && <div className="flex gap-2"><span className="text-[10px] text-accent-danger uppercase border border-accent-danger/50 px-1 rounded h-fit mt-0.5">CAUSE</span><span className="text-slate-300">{l.data.cause}</span></div>}
                        {l.data.impact && <div className="flex gap-2"><span className="text-[10px] text-accent-warning uppercase border border-accent-warning/50 px-1 rounded h-fit mt-0.5">IMPACT</span><span className="text-slate-300">{l.data.impact}</span></div>}
                        {l.data.action && <div className="flex gap-2"><span className="text-[10px] text-accent-success uppercase border border-accent-success/50 px-1 rounded h-fit mt-0.5">ACTION</span><span className="text-white">{l.data.action}</span></div>}
                        {l.data.cooldown && <div className="flex gap-2"><span className="text-[10px] text-primary uppercase border border-primary/50 px-1 rounded h-fit mt-0.5">TIME</span><span className="text-primary">{l.data.cooldown}</span></div>}
                      </div>
                    )}
                  </div>
                ))
              )}
              {isTyping && <p className="text-slate-500 animate-pulse ml-6">AI is analyzing...</p>}
            </div>

            {/* Input Box */}
            <div className="p-2 border-t border-[#223c49] bg-[#101d23] shrink-0">
              <form onSubmit={handleUserSubmit} className="flex gap-2">
                <span className="text-primary self-center text-lg material-symbols-outlined">chevron_right</span>
                <input
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none text-white text-xs font-mono focus:ring-0 placeholder-slate-600 focus:outline-none h-8"
                  placeholder="Ask TRAFFIX..."
                  type="text"
                />
              </form>
            </div>
          </div>
        </section>

        {/* Right Sidebar: Metrics */}
        <aside
          style={isDesktop ? { width: sidebarWidth } : { width: '100%' }}
          className="flex-none bg-[#101d23] border-t lg:border-t-0 lg:border-l border-[#223c49] p-6 flex flex-col gap-6 z-20 overflow-y-auto relative h-[50vh] lg:h-auto"
        >
          {/* Resizer Handle (Desktop Only) */}
          {isDesktop && <div
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary z-50"
            onMouseDown={(e) => startResizing('sidebar', e)}
          ></div>}

          {/* PoA Gauge */}
          <div className="flex flex-col items-center relative py-4 shrink-0">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-4">Price of Anarchy</h3>
            <div className="relative size-48">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                <path className="text-[#182b34]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                {metrics && (
                  <path
                    className={optimized ? "text-accent-success" : "text-accent-warning drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray={optimized ? "100, 100" : `${(metrics.price_of_anarchy / 2) * 100}, 100`}
                    strokeLinecap="round"
                    strokeWidth="3"
                  ></path>
                )}
              </svg>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center flex flex-col">
                <span className="text-4xl font-bold text-white tracking-tighter">
                  {optimized ? "1.05" : metrics?.price_of_anarchy || "1.45"}
                </span>
                <span className={`text-xs font-mono mt-1 ${optimized ? 'text-accent-success' : 'text-accent-warning'}`}>
                  {optimized ? "OPTIMAL" : "INEFFICIENT"}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 text-center mt-2 px-4">
              The ratio of current travel time to the optimal travel time. Lower is better.
            </p>
          </div>
          <hr className="border-[#223c49]" />

          {/* Metrics Stack */}
          <div className="flex flex-col gap-4">
            <MetricCard
              icon="payments"
              title="Total Travel Cost"
              value={metrics ? (optimized ? formatNumber(metrics.optimal_cost) : formatNumber(metrics.nash_cost)) : "$42,890"}
              subtext="/hr"
              trend="trending_down"
              trendValue="12%"
              trendOptimized={optimized}
              tooltip="Aggregated cost of all vehicles in the network."
            />

            <MetricCard
              icon="schedule"
              title="Avg. System Latency"
              value={optimized ? "+0%" : `+${metrics ? Math.round((metrics.price_of_anarchy - 1) * 100) : 45}%`}
              subtext="vs opt"
              trend="trending_up"
              trendValue={optimized ? "Low" : "High"}
              trendOptimized={optimized}
              tooltip="Average delay experienced compared to free flow."
            />

            <MetricCard
              icon="traffic"
              title="Vehicle Throughput"
              value="12,400"
              subtext="/hr"
              trend="drag_handle"
              trendValue="Stable"
              trendOptimized={true} // Always stable for demo
              tooltip="Number of vehicles successfully exiting the network."
            />

            <MetricCard
              icon="co2"
              title="Carbon Output"
              progressBar={<div className="w-full bg-[#101d23] rounded-full h-2 mb-2 mt-2"><div className="bg-gradient-to-r from-green-500 to-yellow-500 h-2 rounded-full" style={{ width: optimized ? '30%' : '65%' }}></div></div>}
              value="650 tons"
              tooltip="Estimated CO2 emissions based on congestion levels."
            />
          </div>

          <div className="mt-auto pt-6 border-t border-[#223c49]">
            <button
              onClick={fetchData}
              className="w-full py-3 rounded-lg border border-primary text-primary hover:bg-primary hover:text-white transition-all font-bold text-sm tracking-widest flex items-center justify-center gap-2 group"
            >
              <span className="material-symbols-outlined group-hover:animate-spin">autorenew</span>
              RUN SIMULATION REPORT
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default App;