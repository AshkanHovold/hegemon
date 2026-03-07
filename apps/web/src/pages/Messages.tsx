import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { useToast } from "../components/Toast";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  subject: string;
  body: string;
  read: boolean;
  createdAt: string;
}

interface NationSearchResult {
  id: string;
  name: string;
}

export default function Messages() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);

  // Compose form state
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [searchResults, setSearchResults] = useState<NationSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    document.title = "Messages - Hegemon";
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const data = await api.get<{ messages: Message[] }>("/nation/messages");
      setMessages(data.messages);
    } catch {
      // API not available yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  async function handleExpand(msg: Message) {
    if (expandedId === msg.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(msg.id);

    // Mark as read
    if (!msg.read) {
      try {
        await api.patch(`/nation/messages/${msg.id}/read`, {});
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, read: true } : m))
        );
      } catch {
        // Ignore errors
      }
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/nation/messages/${id}`);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (expandedId === id) setExpandedId(null);
      toast("success", "Message deleted");
    } catch {
      toast("error", "Failed to delete message");
    }
  }

  async function handleSearchNations(query: string) {
    setRecipientSearch(query);
    setRecipientId(null);
    setRecipientName("");
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const data = await api.get<{ nations: NationSearchResult[] }>(
        `/nation/search?q=${encodeURIComponent(query)}`
      );
      setSearchResults(data.nations);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  function selectRecipient(nation: NationSearchResult) {
    setRecipientId(nation.id);
    setRecipientName(nation.name);
    setRecipientSearch(nation.name);
    setSearchResults([]);
  }

  async function handleSend() {
    if (!recipientId || !subject.trim() || !body.trim()) {
      toast("error", "Please fill in all fields");
      return;
    }
    setSending(true);
    try {
      await api.post("/nation/messages", {
        receiverId: recipientId,
        subject: subject.trim(),
        body: body.trim(),
      });
      toast("success", "Message sent");
      setShowCompose(false);
      setRecipientSearch("");
      setRecipientId(null);
      setRecipientName("");
      setSubject("");
      setBody("");
      await fetchMessages();
    } catch {
      toast("error", "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Messages
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {loading ? "Loading..." : `${messages.length} messages`}
          </p>
        </div>
        <button
          onClick={() => setShowCompose(!showCompose)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {showCompose ? "Cancel" : "Compose"}
        </button>
      </div>

      {/* Compose Form */}
      {showCompose && (
        <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">New Message</h2>

          {/* Recipient */}
          <div className="relative">
            <label className="block text-xs text-gray-500 mb-1.5">To</label>
            <input
              type="text"
              value={recipientSearch}
              onChange={(e) => handleSearchNations(e.target.value)}
              placeholder="Search nations..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
            />
            {recipientName && (
              <span className="text-xs text-emerald-400 mt-1 block">
                Sending to: {recipientName}
              </span>
            )}
            {searchResults.length > 0 && (
              <div className="absolute z-10 top-full mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-xl">
                {searchResults.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => selectRecipient(n)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                  >
                    {n.name}
                  </button>
                ))}
              </div>
            )}
            {searching && (
              <span className="text-xs text-gray-500 mt-1 block">
                Searching...
              </span>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Message subject"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={5}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={sending || !recipientId || !subject.trim() || !body.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {sending ? "Sending..." : "Send Message"}
          </button>
        </div>
      )}

      {/* Message List */}
      {!loading && messages.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-500 text-sm">No messages yet.</p>
        </div>
      )}

      <div className="space-y-2">
        {messages.map((msg) => {
          const isExpanded = expandedId === msg.id;

          return (
            <div
              key={msg.id}
              className={`bg-gray-900 border rounded-xl transition-colors ${
                msg.read
                  ? "border-gray-800"
                  : "border-blue-500/30"
              }`}
            >
              {/* Message header - clickable */}
              <button
                onClick={() => handleExpand(msg)}
                className="w-full text-left px-5 py-4 flex items-center gap-4"
              >
                {/* Unread indicator */}
                <div className="flex-shrink-0">
                  {!msg.read ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-700" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-sm font-medium truncate ${
                        msg.read ? "text-gray-400" : "text-white"
                      }`}
                    >
                      {msg.senderName}
                    </span>
                    <span className="text-xs text-gray-600 flex-shrink-0">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                  <div
                    className={`text-sm truncate ${
                      msg.read ? "text-gray-500" : "text-gray-300"
                    }`}
                  >
                    {msg.subject}
                  </div>
                  {!isExpanded && (
                    <div className="text-xs text-gray-600 truncate mt-0.5">
                      {msg.body}
                    </div>
                  )}
                </div>
              </button>

              {/* Expanded body */}
              {isExpanded && (
                <div className="px-5 pb-4 border-t border-gray-800">
                  <div className="pt-4 text-sm text-gray-300 whitespace-pre-wrap">
                    {msg.body}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => {
                        setShowCompose(true);
                        setRecipientSearch(msg.senderName);
                        setRecipientId(msg.senderId);
                        setRecipientName(msg.senderName);
                        setSubject(
                          msg.subject.startsWith("Re: ")
                            ? msg.subject
                            : `Re: ${msg.subject}`
                        );
                      }}
                      className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors border border-gray-700"
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="bg-red-700/30 hover:bg-red-700/50 text-red-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors border border-red-500/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
