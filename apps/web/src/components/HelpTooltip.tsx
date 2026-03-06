import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { getArticle } from "../lib/helpData";

interface HelpTooltipProps {
  /** The help article ID to display */
  articleId: string;
  /** Optional size override */
  size?: "sm" | "md";
}

/**
 * Small (?) icon that shows a tooltip with the article summary on hover/click.
 * Links to the full help page article.
 */
export default function HelpTooltip({ articleId, size = "sm" }: HelpTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const article = getArticle(articleId);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!article) return null;

  const sz = size === "sm" ? "w-4 h-4 text-[10px]" : "w-5 h-5 text-xs";

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`${sz} rounded-full border border-gray-600 text-gray-500 hover:text-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center shrink-0 leading-none`}
        aria-label={`Help: ${article.title}`}
        type="button"
      >
        ?
      </button>
      {open && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl shadow-black/50 p-4 text-left">
          <div className="text-sm font-semibold text-white mb-1">
            {article.title}
          </div>
          <p className="text-xs text-gray-400 leading-relaxed mb-3">
            {article.summary}
          </p>
          {article.content.length > 0 && (
            <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-3">
              {article.content[0]}
            </p>
          )}
          <Link
            to={`/game/help#${article.id}`}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            onClick={() => setOpen(false)}
          >
            Read more &rarr;
          </Link>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 border-r border-b border-gray-700 rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}
