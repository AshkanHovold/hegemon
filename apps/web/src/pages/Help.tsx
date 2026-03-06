import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { HELP_ARTICLES, HELP_CATEGORIES, type HelpArticle } from "../lib/helpData";
import GameIcon from "../components/GameIcon";

function ArticleCard({
  article,
  expanded,
  onToggle,
}: {
  article: HelpArticle;
  expanded: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (expanded && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [expanded]);

  return (
    <div
      id={article.id}
      ref={ref}
      className={`border rounded-xl transition-colors ${
        expanded
          ? "border-blue-500/30 bg-blue-500/5"
          : "border-gray-800 bg-gray-900 hover:border-gray-700"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-center gap-3"
        type="button"
      >
        {article.icon && (
          <GameIcon name={article.icon} size={24} className="shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white">
            {article.title}
          </div>
          <div className="text-xs text-gray-500 mt-0.5 truncate">
            {article.summary}
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="px-5 pb-5 pt-0 space-y-3 border-t border-gray-800/50 mt-0">
          <div className="pt-3" />
          {article.content.map((paragraph, i) => {
            // Render bullet lists
            if (paragraph.startsWith("- ")) {
              return (
                <div key={i} className="text-sm text-gray-400 leading-relaxed pl-3 border-l-2 border-gray-700">
                  {paragraph.slice(2)}
                </div>
              );
            }
            // Render numbered steps
            if (/^\d+\)/.test(paragraph)) {
              return (
                <div key={i} className="text-sm text-gray-400 leading-relaxed pl-3 border-l-2 border-blue-500/30">
                  {paragraph}
                </div>
              );
            }
            return (
              <p key={i} className="text-sm text-gray-400 leading-relaxed">
                {paragraph}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Help() {
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Help - Hegemon";
  }, []);

  // Handle hash-based deep linking (e.g., /game/help#combat-mechanics)
  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (hash) {
      const article = HELP_ARTICLES.find((a) => a.id === hash);
      if (article) {
        setExpandedId(hash);
        setActiveCategory(article.category);
        // Scroll after a short delay to let the DOM update
        setTimeout(() => {
          document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, [location.hash]);

  const searchLower = search.toLowerCase();

  const filteredArticles = HELP_ARTICLES.filter((a) => {
    if (search) {
      return (
        a.title.toLowerCase().includes(searchLower) ||
        a.summary.toLowerCase().includes(searchLower) ||
        a.content.some((c) => c.toLowerCase().includes(searchLower)) ||
        a.category.toLowerCase().includes(searchLower)
      );
    }
    if (activeCategory) {
      return a.category === activeCategory;
    }
    return true;
  });

  // Group by category
  const grouped = new Map<string, HelpArticle[]>();
  for (const article of filteredArticles) {
    const list = grouped.get(article.category) || [];
    list.push(article);
    grouped.set(article.category, list);
  }

  function handleToggle(id: string) {
    setExpandedId(expandedId === id ? null : id);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Help & Guide</h1>
        <p className="text-gray-500 text-sm mt-1">
          Learn how to play Hegemon — search topics or browse by category
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (e.target.value) setActiveCategory(null);
          }}
          placeholder="Search help topics... (e.g. energy, troops, market)"
          className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Category tabs */}
      {!search && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeCategory === null
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                : "text-gray-500 hover:text-gray-300 border border-transparent"
            }`}
          >
            All Topics
          </button>
          {HELP_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-gray-500 hover:text-gray-300 border border-transparent"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Search results count */}
      {search && (
        <div className="text-xs text-gray-500">
          {filteredArticles.length} result{filteredArticles.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
        </div>
      )}

      {/* Articles grouped by category */}
      {filteredArticles.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-gray-600 text-sm">No help articles found.</div>
          <button
            onClick={() => { setSearch(""); setActiveCategory(null); }}
            className="text-blue-400 hover:text-blue-300 text-sm mt-2"
          >
            Clear filters
          </button>
        </div>
      ) : (
        Array.from(grouped.entries()).map(([category, articles]) => (
          <div key={category}>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {category}
            </h2>
            <div className="space-y-2">
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  expanded={expandedId === article.id}
                  onToggle={() => handleToggle(article.id)}
                />
              ))}
            </div>
          </div>
        ))
      )}

      {/* Quick reference */}
      {!search && !activeCategory && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mt-8">
          <h2 className="text-base font-semibold text-white mb-4">Quick Reference</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-gray-400">
            <div>
              <div className="text-gray-500 font-medium mb-1">Energy Costs</div>
              <div className="space-y-0.5">
                <div>Build/Upgrade: <span className="text-blue-400">5</span></div>
                <div>Train troops: <span className="text-blue-400">3</span></div>
                <div>Attack: <span className="text-blue-400">25</span></div>
                <div>Cyber ops: <span className="text-blue-400">5-40</span></div>
              </div>
            </div>
            <div>
              <div className="text-gray-500 font-medium mb-1">Limits</div>
              <div className="space-y-0.5">
                <div>Max building level: <span className="text-amber-400">20</span></div>
                <div>Max construction queue: <span className="text-amber-400">2</span></div>
                <div>Max train batch: <span className="text-amber-400">1,000</span></div>
                <div>Attack cooldown: <span className="text-amber-400">10 min</span></div>
              </div>
            </div>
            <div>
              <div className="text-gray-500 font-medium mb-1">Market</div>
              <div className="space-y-0.5">
                <div>Buy fee: <span className="text-amber-400">3.5%</span></div>
                <div>Max order qty: <span className="text-amber-400">10,000</span></div>
                <div>Max price: <span className="text-amber-400">$100,000</span></div>
                <div>Commodities: <span className="text-gray-300">3</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
