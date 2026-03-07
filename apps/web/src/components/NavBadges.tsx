import { useState, useEffect } from "react";
import { api } from "../lib/api";

/**
 * NavBadges component - exports unread message count badge.
 * Can be integrated into the Sidebar by another agent later.
 */

export function useUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchUnread() {
      try {
        const data = await api.get<{ count: number }>("/nation/messages/unread-count");
        setUnreadCount(data.count);
      } catch {
        // API not available yet
      }
    }
    fetchUnread();

    // Refresh every 30 seconds
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, []);

  return unreadCount;
}

interface BadgeProps {
  count: number;
  className?: string;
}

/** A small red badge showing a number (e.g. unread count). */
export function CountBadge({ count, className = "" }: BadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/** Combined component showing the message badge. */
export default function NavBadges() {
  const unreadCount = useUnreadCount();

  if (unreadCount <= 0) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
        </svg>
        <CountBadge count={unreadCount} />
      </div>
    </div>
  );
}
