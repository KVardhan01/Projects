import React, { useState } from 'react';
import { REFERENCE_ITEMS, ReferenceItem } from '../data/referenceData';
import { BookMarked, Search, Code2, Sparkles, Copy, Check } from 'lucide-react';

export const ReferencePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['All', 'Concepts', 'Single Qubit Gates', 'Multi Qubit Gates', 'Algorithms', 'Physical & NISQ'];

  const filtered = REFERENCE_ITEMS.filter((item) => {
    const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchQuery =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.explanation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in pb-12">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-cyan-400 mb-1">
          <BookMarked className="w-4 h-4" />
          <span>Knowledge Base</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">
          Quantum Computing Reference & Manual
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
          Authoritative technical reference on quantum states, operator matrices, gate actions, mathematical definitions, Qiskit commands, and NISQ physical concepts.
        </p>

        {/* Search Bar */}
        <div className="mt-5 relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search gates, operators, algorithms..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 shadow-inner"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
              selectedCategory === cat
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Reference Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                  {item.category}
                </span>
                <h3 className="font-bold text-base text-slate-100 mt-1">{item.title}</h3>
              </div>

              {item.symbol && (
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold font-mono text-cyan-300 text-sm shadow-inner shrink-0">
                  {item.symbol}
                </div>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{item.explanation}</p>

            {item.matrixFormula && (
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono text-cyan-300">
                <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">Unitary Matrix:</span>
                <code>{item.matrixFormula}</code>
              </div>
            )}

            {item.qiskitSyntax && (
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 uppercase">Qiskit Command:</span>
                  <code className="text-teal-300">{item.qiskitSyntax}</code>
                </div>
                <button
                  onClick={() => handleCopy(item.id, item.qiskitSyntax!)}
                  className="p-1 rounded text-slate-400 hover:text-slate-100 transition-colors"
                  title="Copy Qiskit command"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}

            {item.useCases && item.useCases.length > 0 && (
              <div className="pt-2 border-t border-slate-800/60 flex flex-wrap gap-1">
                {item.useCases.map((uc, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/60 text-slate-400 border border-slate-700/60"
                  >
                    {uc}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
