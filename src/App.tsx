import React, { useState, useEffect } from "react";
import { 
  Scale, 
  Sparkles, 
  History, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Info, 
  ArrowRight, 
  ChevronRight, 
  Zap, 
  Car, 
  Briefcase, 
  Home, 
  Code, 
  AlertCircle,
  TrendingUp,
  FileText,
  Table,
  Compass,
  AlertTriangle,
  Flame,
  UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  DecisionAnalysisResponse, 
  DecisionHistoryItem 
} from "./types";

// Dynamic preset configurations for optimal user exploration
const PRESETS = [
  {
    icon: Car,
    label: "EV vs. Hybrid Car",
    dilemma: "Should I buy a fully electric vehicle (EV) or a hybrid car?",
    optionA: "Fully Electric Vehicle (EV)",
    optionB: "Hybrid / Plug-in Hybrid Car",
    context: "I drive 35 miles daily, have a garage with charging potential, but take quarterly 450-mile family road trips."
  },
  {
    icon: Briefcase,
    label: "Startup vs. Corp Job",
    dilemma: "Should I accept a remote startup offer or stay at my stable corporate hybrid job?",
    optionA: "Remote Startup Role",
    optionB: "Stable Corporate Role",
    context: "The startup pays 15% more with equity, but corporate has excellent 401k matching and solid job security."
  },
  {
    icon: Code,
    label: "Build vs. Buy Auth",
    dilemma: "Should our dev team build a custom authentication system or buy an external service?",
    optionA: "Custom In-House Auth",
    optionB: "SaaS Auth Provider (e.g. Auth0)",
    context: "We have a team of 3 developers, a tight 6-week timeline to launch, and strict security compliance requirements."
  },
  {
    icon: Home,
    label: "Rent vs. Buy Home",
    dilemma: "Should I rent an apartment or buy a starter home this year?",
    optionA: "Rent a High-End Apartment",
    optionB: "Buy a Starter Home",
    context: "Interest rates are high, but rental prices are climbing. I plan to live in this metropolitan area for 3 to 5 years."
  }
];

const LOADING_STEPS = [
  "Structuring context...",
  "Evaluating trade-offs & hidden costs...",
  "Running SWOT quadrant heuristics...",
  "Synthesizing comparative criteria...",
  "Fusing factors to break the tie..."
];

export default function App() {
  // Form State
  const [dilemma, setDilemma] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [context, setContext] = useState("");
  
  // App Logic State
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<DecisionAnalysisResponse | null>(null);
  const [history, setHistory] = useState<DecisionHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"proscons" | "comparison" | "swot">("proscons");
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  // Load decision history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("tiebreaker_history");
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
        if (parsed.length > 0) {
          // Default to showing the latest saved analysis on load
          setActiveAnalysis(parsed[0].result);
          setSelectedHistoryId(parsed[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to parse history from localStorage", err);
    }
  }, []);

  // Interval timer to cycle through realistic loading steps
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const saveToHistory = (newAnalysis: DecisionAnalysisResponse, originalInputs: { dilemma: string; optionA: string; optionB: string; context?: string }) => {
    const newItem: DecisionHistoryItem = {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleString(),
      dilemma: originalInputs.dilemma,
      optionA: originalInputs.optionA || "Option A",
      optionB: originalInputs.optionB || "Option B",
      context: originalInputs.context,
      result: newAnalysis
    };

    const updatedHistory = [newItem, ...history];
    setHistory(updatedHistory);
    localStorage.setItem("tiebreaker_history", JSON.stringify(updatedHistory));
    setSelectedHistoryId(newItem.id);
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    localStorage.setItem("tiebreaker_history", JSON.stringify(updated));
    
    if (selectedHistoryId === id) {
      if (updated.length > 0) {
        setActiveAnalysis(updated[0].result);
        setSelectedHistoryId(updated[0].id);
      } else {
        setActiveAnalysis(null);
        setSelectedHistoryId(null);
      }
    }
  };

  const selectHistoryItem = (item: DecisionHistoryItem) => {
    setActiveAnalysis(item.result);
    setSelectedHistoryId(item.id);
    
    // Fill the form fields for editing or re-evaluating
    setDilemma(item.dilemma);
    setOptionA(item.optionA);
    setOptionB(item.optionB);
    setContext(item.context || "");
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setDilemma(preset.dilemma);
    setOptionA(preset.optionA);
    setOptionB(preset.optionB);
    setContext(preset.context);
    setError(null);
  };

  const clearForm = () => {
    setDilemma("");
    setOptionA("");
    setOptionB("");
    setContext("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dilemma.trim()) {
      setError("Please describe your dilemma first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/decide", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          dilemma: dilemma.trim(),
          optionA: optionA.trim() || undefined,
          optionB: optionB.trim() || undefined,
          context: context.trim() || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Internal Server Error during evaluation.");
      }

      const data: DecisionAnalysisResponse = await response.json();
      setActiveAnalysis(data);
      saveToHistory(data, {
        dilemma: dilemma.trim(),
        optionA: optionA.trim(),
        optionB: optionB.trim(),
        context: context.trim()
      });
    } catch (err: any) {
      setError(err.message || "Failed to contact analysis server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1115] font-sans text-[#E2E8F0] flex flex-col antialiased">
      {/* Upper Navigation/Header */}
      <header className="border-b border-[#2D3139] bg-[#0F1115] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Scale id="app-logo-icon" className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight font-display text-white">THE TIE BREAKER</h1>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">AI Decision Intelligence</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1.5 bg-[#1A1D23] border border-[#2D3139] rounded-md text-xs text-[#94A3B8]">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-400 animate-pulse" /> Powered by Gemini 3.5
            </span>
          </div>
        </div>
      </header>

      {/* Main Grid Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input Panel & Preset Heuristics (span 5) */}
        <section className="lg:col-span-5 flex flex-col space-y-6">
          
          {/* Quick-select Presets */}
          <div className="bg-[#1A1D23] rounded-2xl p-4 border border-[#2D3139] shadow-xs">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 font-display">
              Popular Presets
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((preset, index) => {
                const IconComponent = preset.icon;
                return (
                  <button
                    key={index}
                    onClick={() => applyPreset(preset)}
                    className="flex items-start text-left p-2.5 rounded-xl border border-[#2D3139] hover:border-indigo-500 hover:bg-[#1F232B] bg-[#0F1115]/30 transition-all duration-150 group"
                  >
                    <div className="p-1.5 rounded-lg bg-[#0F1115] text-slate-400 group-hover:bg-indigo-950 group-hover:text-indigo-400 mr-2.5 transition-colors">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{preset.label}</p>
                      <p className="text-[10px] text-slate-500 truncate w-32 mt-0.5">
                        {preset.optionA} vs {preset.optionB}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Core Decision Input Form */}
          <div className="bg-[#1A1D23] rounded-2xl p-5 border border-[#2D3139] shadow-sm flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#2D3139]">
              <h2 className="font-bold text-lg font-display text-white flex items-center">
                <Compass className="w-5 h-5 mr-2 text-indigo-400" /> New Decision Frame
              </h2>
              <button 
                type="button" 
                onClick={clearForm}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium"
              >
                Clear Fields
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Dilemma Input */}
                <div>
                  <label htmlFor="dilemma" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    1. What is the decision you need to make? <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="dilemma"
                    rows={3}
                    required
                    value={dilemma}
                    onChange={(e) => setDilemma(e.target.value)}
                    placeholder="e.g. Should I rent an apartment or buy a starter home?"
                    className="w-full rounded-xl border border-[#2D3139] p-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-950 transition-all placeholder:text-slate-500 bg-[#0F1115] text-white"
                  />
                </div>

                {/* Options Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="optionA" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Option A <span className="text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <input
                      id="optionA"
                      type="text"
                      value={optionA}
                      onChange={(e) => setOptionA(e.target.value)}
                      placeholder="e.g. Rent Apartment"
                      className="w-full rounded-xl border border-[#2D3139] p-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-950 transition-all placeholder:text-slate-500 bg-[#0F1115] text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="optionB" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Option B <span className="text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <input
                      id="optionB"
                      type="text"
                      value={optionB}
                      onChange={(e) => setOptionB(e.target.value)}
                      placeholder="e.g. Buy Starter Home"
                      className="w-full rounded-xl border border-[#2D3139] p-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-950 transition-all placeholder:text-slate-500 bg-[#0F1115] text-white"
                    />
                  </div>
                </div>

                {/* Personal Context / Constraints */}
                <div>
                  <label htmlFor="context" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Personal constraints & context <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    id="context"
                    rows={3}
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="e.g., I'll live here for 3-5 years, mortgage rates are 6.8%, and I want zero maintenance stress."
                    className="w-full rounded-xl border border-[#2D3139] p-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-950 transition-all placeholder:text-slate-500 bg-[#0F1115] text-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Providing specific criteria or constraints guarantees a much more precise tie-breaking recommendation.
                  </p>
                </div>
              </div>

              {/* Submit Button Section */}
              <div className="pt-4 border-t border-[#2D3139] mt-6">
                {error && (
                  <div className="mb-3 p-3 bg-rose-950/20 border border-rose-900/30 text-rose-300 text-xs rounded-xl flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !dilemma.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 px-4 font-bold text-sm transition-all duration-150 flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                      <span>Analyzing Options...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-indigo-200" />
                      <span>Evaluate & Break Tie</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* History Panel */}
          {history.length > 0 && (
            <div className="bg-[#1A1D23] rounded-2xl p-5 border border-[#2D3139] shadow-sm max-h-[320px] flex flex-col">
              <h3 className="font-bold text-xs text-slate-500 tracking-wide uppercase mb-3 font-display">
                Decision Log ({history.length})
              </h3>
              <div className="space-y-2 overflow-y-auto pr-1 flex-1">
                {history.map((item) => {
                  const isSelected = selectedHistoryId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => selectHistoryItem(item)}
                      className={`group flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                        isSelected 
                          ? "border-indigo-500/50 bg-indigo-950/20 shadow-xs" 
                          : "border-[#2D3139] bg-[#0F1115]/30 hover:bg-[#1F232B] hover:border-[#3F4450]"
                      }`}
                    >
                      <div className="min-w-0 flex-1 mr-3">
                        <p className={`text-xs font-semibold truncate ${isSelected ? "text-indigo-400" : "text-white"}`}>
                          {item.result.title || item.dilemma}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-[10px] text-slate-500">{item.timestamp}</span>
                          <span className="text-[10px] bg-[#1A1D23] text-slate-300 border border-[#2D3139] px-1.5 py-0.2 rounded-md">
                            Verdict: {item.result.verdict.recommendedOption}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0">
                        <ChevronRight className={`w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors ${isSelected ? "text-indigo-400" : ""}`} />
                        <button
                          onClick={(e) => deleteHistoryItem(item.id, e)}
                          className="p-1 rounded-md text-slate-600 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                          title="Delete decision"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </section>

        {/* Right Column: Active Decision Canvas (span 7) */}
        <section className="lg:col-span-7 flex flex-col min-h-[500px]">
          <AnimatePresence mode="wait">
            
            {/* Loading State */}
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex-1 bg-[#1A1D23] border border-[#2D3139] rounded-3xl p-8 flex flex-col items-center justify-center space-y-6 shadow-xs"
              >
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-indigo-950/50 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <Scale className="w-10 h-10 text-indigo-500 animate-bounce" />
                </div>
                
                <div className="text-center space-y-2 max-w-sm">
                  <h3 className="font-bold text-lg font-display text-white">The Tie Breaker is weighing choices...</h3>
                  <p className="text-sm text-slate-400">Evaluating critical trade-offs, computing SWOT arrays, and formatting detailed recommendations.</p>
                </div>

                <div className="w-full max-w-xs bg-[#0F1115] border border-[#2D3139] rounded-full h-1.5 overflow-hidden">
                  <motion.div 
                    className="bg-indigo-500 h-full rounded-full"
                    animate={{ width: ["10%", "40%", "70%", "95%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                  />
                </div>

                <div className="text-xs bg-indigo-950/40 text-indigo-300 border border-indigo-500/20 px-3.5 py-1.5 rounded-full font-semibold flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2 animate-ping"></span>
                  Current step: {LOADING_STEPS[loadingStep]}
                </div>
              </motion.div>
            )}

            {/* Results Output State */}
            {!loading && activeAnalysis && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 flex-1 flex flex-col"
              >
                {/* Decision Title Card */}
                <div className="bg-gradient-to-r from-[#1A1D23] to-[#2D3139] text-white rounded-3xl p-6 border border-[#2D3139] shadow-md relative overflow-hidden">
                  <div className="absolute -right-16 -top-16 w-44 h-44 bg-indigo-500/10 rounded-full blur-xl" />
                  <div className="absolute right-8 bottom-4 text-white/5 font-display text-7xl font-black uppercase select-none pointer-events-none">
                    Verdict
                  </div>
                  
                  <div className="relative">
                    <span className="text-[10px] bg-indigo-950/40 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest font-semibold">
                      Decision Intelligence
                    </span>
                    <h2 className="text-2xl font-bold font-display mt-2.5 leading-tight text-white">{activeAnalysis.title}</h2>
                  </div>
                </div>

                {/* The Verdict Panel */}
                <div className="bg-[#1A1D23] border border-[#2D3139] rounded-3xl p-6 relative overflow-hidden">
                  {/* Gauge & Key Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    
                    {/* Verdict Recommendation & Title (cols 8) */}
                    <div className="md:col-span-8 space-y-4">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 rounded-lg bg-indigo-950/30 text-indigo-400">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Recommended Verdict</span>
                      </div>
                      
                      <div>
                        <h3 className="text-3xl font-black font-display tracking-tight leading-none bg-gradient-to-r from-indigo-400 to-indigo-200 bg-clip-text text-transparent">
                          {activeAnalysis.verdict.recommendedOption}
                        </h3>
                      </div>
                      
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {activeAnalysis.verdict.summary}
                      </p>
                    </div>

                    {/* Confidence Meter (cols 4) */}
                    <div className="md:col-span-4 flex flex-col items-center justify-center p-4 border border-[#2D3139] bg-[#0F1115]/40 rounded-2xl relative">
                      <div className="text-center">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Confidence</span>
                        <div className="text-4xl font-extrabold text-white tracking-tight font-display">
                          {activeAnalysis.verdict.confidenceScore}%
                        </div>
                        
                        {/* Dynamic rating bar */}
                        <div className="w-24 bg-[#0F1115] h-1.5 rounded-full mx-auto mt-2.5 overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-full rounded-full" 
                            style={{ width: `${activeAnalysis.verdict.confidenceScore}%` }}
                          />
                        </div>
                        
                        <span className="text-[10px] text-slate-400 block mt-1.5 font-medium">
                          {activeAnalysis.verdict.confidenceScore >= 80 
                            ? "Highly Definitive" 
                            : activeAnalysis.verdict.confidenceScore >= 60 
                            ? "Slight Preference" 
                            : "Marginal Tie"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Key Deciding Factor banner */}
                  <div className="mt-5 p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-2xl flex items-start space-x-3">
                    <Flame className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">The Tie-Breaking Decider</h4>
                      <p className="text-xs text-indigo-200 mt-0.5 font-medium leading-relaxed">
                        {activeAnalysis.verdict.keyDecidingFactor}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Analytical Perspectives Views Tabs */}
                <div className="flex-1 flex flex-col space-y-4">
                  
                  {/* Tab Selector Buttons */}
                  <div className="bg-[#0F1115] border border-[#2D3139] p-1 rounded-xl grid grid-cols-3 gap-1">
                    <button
                      onClick={() => setActiveTab("proscons")}
                      className={`flex items-center justify-center py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                        activeTab === "proscons"
                          ? "bg-[#1A1D23] text-indigo-400 border border-[#2D3139] shadow-xs"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 mr-1.5" />
                      Pros & Cons
                    </button>
                    <button
                      onClick={() => setActiveTab("comparison")}
                      className={`flex items-center justify-center py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                        activeTab === "comparison"
                          ? "bg-[#1A1D23] text-indigo-400 border border-[#2D3139] shadow-xs"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Table className="w-3.5 h-3.5 mr-1.5" />
                      Comparison Matrix
                    </button>
                    <button
                      onClick={() => setActiveTab("swot")}
                      className={`flex items-center justify-center py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                        activeTab === "swot"
                          ? "bg-[#1A1D23] text-indigo-400 border border-[#2D3139] shadow-xs"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      SWOT Quadrants
                    </button>
                  </div>

                  {/* Perspective Screens */}
                  <div className="flex-grow bg-[#1A1D23] border border-[#2D3139] rounded-3xl p-5 shadow-xs">
                    
                    {/* View 1: Pros & Cons Lists */}
                    {activeTab === "proscons" && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between pb-3 border-b border-[#2D3139]">
                          <h3 className="font-bold text-sm text-white uppercase tracking-wider font-display">
                            Side-by-Side Trade-off Balance
                          </h3>
                          <div className="flex space-x-4 text-[11px] text-slate-500">
                            <span className="flex items-center"><CheckCircle2 className="w-3 h-3 text-emerald-400 mr-1" /> Pro</span>
                            <span className="flex items-center"><XCircle className="w-3 h-3 text-rose-400 mr-1" /> Con</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {activeAnalysis.options.map((opt, optIdx) => (
                            <div key={optIdx} className="space-y-4">
                              <div className="p-3 bg-[#0F1115] rounded-xl border border-[#2D3139] flex items-center justify-between text-white">
                                <h4 className="font-bold text-sm font-display truncate">
                                  {optIdx === 0 ? "Option A: " : "Option B: "}{opt.name}
                                </h4>
                              </div>

                              {/* Pros list */}
                              <div className="space-y-2">
                                <h5 className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase flex items-center">
                                  Pros ({opt.pros.length})
                                </h5>
                                {opt.pros.length === 0 ? (
                                  <p className="text-xs text-slate-500 italic">No pros evaluated.</p>
                                ) : (
                                  opt.pros.map((pro, pIdx) => (
                                    <div key={pIdx} className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-950/10 flex justify-between items-start space-x-2 text-xs text-slate-300">
                                      <div className="flex items-start space-x-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                        <span className="leading-relaxed">{pro.point}</span>
                                      </div>
                                      <div className="flex space-x-0.5 shrink-0 ml-2" title={`Impact: ${pro.impact}/5`}>
                                        {Array.from({ length: 5 }).map((_, i) => (
                                          <div
                                            key={i}
                                            className={`w-1.5 h-1.5 rounded-full ${
                                              i < pro.impact ? "bg-emerald-500" : "bg-[#2D3139]"
                                            }`}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>

                              {/* Cons list */}
                              <div className="space-y-2 pt-2">
                                <h5 className="text-[10px] font-bold tracking-wider text-rose-400 uppercase flex items-center">
                                  Cons ({opt.cons.length})
                                </h5>
                                {opt.cons.length === 0 ? (
                                  <p className="text-xs text-slate-500 italic">No cons evaluated.</p>
                                ) : (
                                  opt.cons.map((con, cIdx) => (
                                    <div key={cIdx} className="p-2.5 rounded-lg border border-rose-500/20 bg-rose-950/10 flex justify-between items-start space-x-2 text-xs text-slate-300">
                                      <div className="flex items-start space-x-1.5">
                                        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                                        <span className="leading-relaxed">{con.point}</span>
                                      </div>
                                      <div className="flex space-x-0.5 shrink-0 ml-2" title={`Impact: ${con.impact}/5`}>
                                        {Array.from({ length: 5 }).map((_, i) => (
                                          <div
                                            key={i}
                                            className={`w-1.5 h-1.5 rounded-full ${
                                              i < con.impact ? "bg-rose-500" : "bg-[#2D3139]"
                                            }`}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* View 2: Comparison Matrix Table */}
                    {activeTab === "comparison" && (
                      <div className="space-y-4">
                        <div className="pb-3 border-b border-[#2D3139]">
                          <h3 className="font-bold text-sm text-white uppercase tracking-wider font-display">
                            Criteria Evaluation Matrix
                          </h3>
                        </div>

                        <div className="overflow-x-auto border border-[#2D3139] rounded-xl">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-[#0F1115] border-b border-[#2D3139]">
                                <th className="p-3 font-semibold text-slate-400 uppercase tracking-wider w-1/4">Criteria</th>
                                <th className="p-3 font-semibold text-slate-200 w-1/3">
                                  {activeAnalysis.options[0]?.name || "Option A"}
                                </th>
                                <th className="p-3 font-semibold text-slate-200 w-1/3">
                                  {activeAnalysis.options[1]?.name || "Option B"}
                                </th>
                                <th className="p-3 font-semibold text-indigo-400 uppercase tracking-wider w-12 text-center">Winner</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2D3139]">
                              {activeAnalysis.comparisonTable.map((row, idx) => (
                                <tr key={idx} className="hover:bg-[#0F1115]/20 transition-colors">
                                  <td className="p-3 font-bold text-slate-300 font-display bg-[#0F1115]/10">
                                    {row.criterion}
                                  </td>
                                  <td className="p-3 text-slate-400 leading-relaxed">
                                    {row.optionA_val}
                                  </td>
                                  <td className="p-3 text-slate-400 leading-relaxed">
                                    {row.optionB_val}
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-950/30 text-indigo-300 border border-indigo-500/20">
                                      {row.winner}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex items-center space-x-1.5 p-2 bg-[#0F1115] border border-[#2D3139] rounded-lg text-[10px] text-slate-500">
                          <Info className="w-3.5 h-3.5 shrink-0" />
                          <span>Gemini parses these parameters across high-priority axes specific to your choice profile.</span>
                        </div>
                      </div>
                    )}

                    {/* View 3: SWOT Quadrants */}
                    {activeTab === "swot" && (
                      <div className="space-y-4">
                        <div className="pb-3 border-b border-[#2D3139] flex items-center justify-between">
                          <h3 className="font-bold text-sm text-white uppercase tracking-wider font-display">
                            SWOT Strategic Framework
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Strengths */}
                          <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 space-y-2">
                            <div className="flex items-center space-x-2 text-emerald-400 font-bold font-display text-sm">
                              <span className="w-6 h-6 rounded-lg bg-emerald-900/30 text-emerald-300 border border-emerald-500/20 flex items-center justify-center text-xs">S</span>
                              <h4>Strengths (Internal / Positive)</h4>
                            </div>
                            <ul className="space-y-1.5 list-none pl-0">
                              {activeAnalysis.swotAnalysis.strengths.map((str, idx) => (
                                <li key={idx} className="text-xs text-slate-300 leading-relaxed flex items-start">
                                  <span className="text-emerald-400 mr-2 shrink-0">•</span>
                                  <span>{str}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Weaknesses */}
                          <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-950/10 space-y-2">
                            <div className="flex items-center space-x-2 text-rose-400 font-bold font-display text-sm">
                              <span className="w-6 h-6 rounded-lg bg-rose-900/30 text-rose-300 border border-rose-500/20 flex items-center justify-center text-xs">W</span>
                              <h4>Weaknesses (Internal / Negative)</h4>
                            </div>
                            <ul className="space-y-1.5 list-none pl-0">
                              {activeAnalysis.swotAnalysis.weaknesses.map((weak, idx) => (
                                <li key={idx} className="text-xs text-slate-300 leading-relaxed flex items-start">
                                  <span className="text-rose-400 mr-2 shrink-0">•</span>
                                  <span>{weak}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Opportunities */}
                          <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-950/10 space-y-2">
                            <div className="flex items-center space-x-2 text-indigo-400 font-bold font-display text-sm">
                              <span className="w-6 h-6 rounded-lg bg-indigo-900/30 text-indigo-300 border border-indigo-500/20 flex items-center justify-center text-xs">O</span>
                              <h4>Opportunities (External / Positive)</h4>
                            </div>
                            <ul className="space-y-1.5 list-none pl-0">
                              {activeAnalysis.swotAnalysis.opportunities.map((opp, idx) => (
                                <li key={idx} className="text-xs text-slate-300 leading-relaxed flex items-start">
                                  <span className="text-indigo-400 mr-2 shrink-0">•</span>
                                  <span>{opp}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Threats */}
                          <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-950/10 space-y-2">
                            <div className="flex items-center space-x-2 text-amber-400 font-bold font-display text-sm">
                              <span className="w-6 h-6 rounded-lg bg-amber-900/30 text-amber-300 border border-amber-500/20 flex items-center justify-center text-xs">T</span>
                              <h4>Threats (External / Negative)</h4>
                            </div>
                            <ul className="space-y-1.5 list-none pl-0">
                              {activeAnalysis.swotAnalysis.threats.map((thr, idx) => (
                                <li key={idx} className="text-xs text-slate-300 leading-relaxed flex items-start">
                                  <span className="text-amber-400 mr-2 shrink-0">•</span>
                                  <span>{thr}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </motion.div>
            )}

            {/* Empty Screen Template */}
            {!loading && !activeAnalysis && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 bg-[#1A1D23] border border-[#2D3139] rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-6 shadow-xs"
              >
                <div className="w-16 h-16 rounded-2xl bg-indigo-950/40 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                  <Scale className="w-8 h-8" />
                </div>
                
                <div className="space-y-2 max-w-sm">
                  <h3 className="font-extrabold text-xl font-display text-white">Your Tie-Breaking Canvas is Blank</h3>
                  <p className="text-sm text-slate-400">
                    Weigh critical alternatives instantly. Enter a dilemma on the left, use a popular preset, or recall an analysis from the log.
                  </p>
                </div>

                {/* Micro instructions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-lg pt-4">
                  <div className="p-3 bg-[#0F1115] border border-[#2D3139] rounded-xl text-center">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Step 1</span>
                    <span className="text-xs text-slate-400 font-medium">Define your options</span>
                  </div>
                  <div className="p-3 bg-[#0F1115] border border-[#2D3139] rounded-xl text-center">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Step 2</span>
                    <span className="text-xs text-slate-400 font-medium">Apply custom context</span>
                  </div>
                  <div className="p-3 bg-[#0F1115] border border-[#2D3139] rounded-xl text-center">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Step 3</span>
                    <span className="text-xs text-slate-400 font-medium">Resolve & compare</span>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </section>

      </main>

      {/* Humble professional footer */}
      <footer className="border-t border-[#2D3139] bg-[#0F1115] py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 The Tie Breaker. Evaluated objectively by artificial intelligence.</p>
          <p className="mt-1 sm:mt-0 font-mono text-[10px]">Version 1.1.0 (Full Stack Edition)</p>
        </div>
      </footer>
    </div>
  );
}
