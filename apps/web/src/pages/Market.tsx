import { useState, useEffect, useCallback } from "react";
import { useGame } from "../context/GameContext";
import { api, ApiError } from "../lib/api";
import { timeAgo, commodityLabel } from "../lib/format";
import GameIcon from "../components/GameIcon";
import HelpTooltip from "../components/HelpTooltip";

interface PricePoint {
  timestamp: string;
  avgPrice: number;
}

function PriceChart({ data }: { data: PricePoint[] }) {
  if (data.length < 2)
    return (
      <div className="h-48 bg-gray-800 rounded-lg flex flex-col items-center justify-center border border-gray-700 gap-2">
        <GameIcon name="resource-materials" size={32} className="opacity-30" />
        <span className="text-sm text-gray-600">Not enough price data yet</span>
      </div>
    );

  const prices = data.map((d) => d.avgPrice);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const w = 600;
  const h = 180;
  const pad = 20;
  const points = data
    .map((d, i) => {
      const x = pad + (i / (data.length - 1)) * (w - 2 * pad);
      const y = h - pad - ((d.avgPrice - min) / range) * (h - 2 * pad);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-48">
      <polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={points} />
    </svg>
  );
}

type CommodityKey = "MATERIALS" | "TECH_POINTS" | "FOOD";

const TABS: { key: CommodityKey; label: string; color: string; iconName: string }[] = [
  { key: "MATERIALS", label: "Materials", color: "text-slate-300", iconName: "resource-materials" },
  { key: "TECH_POINTS", label: "Tech Points", color: "text-cyan-400", iconName: "resource-tech" },
  { key: "FOOD", label: "Food", color: "text-emerald-400", iconName: "resource-food" },
];

interface BookLevel {
  price: number;
  totalQty: number;
}

interface OrderBookData {
  bids: BookLevel[];
  asks: BookLevel[];
}

interface MyOrder {
  id: string;
  side: "BUY" | "SELL";
  commodity: string;
  price: number;
  quantity: number;
  filled: number;
  status: string;
  createdAt: string;
}

interface Trade {
  id: string;
  commodity: string;
  price: number;
  quantity: number;
  side: string;
  createdAt: string;
  filledAt: string | null;
}

export default function Market() {
  const { nation, refreshNation } = useGame();
  const [activeTab, setActiveTab] = useState<CommodityKey>("MATERIALS");
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [orderPrice, setOrderPrice] = useState("");
  const [orderQty, setOrderQty] = useState("");

  const [orderBook, setOrderBook] = useState<OrderBookData>({
    bids: [],
    asks: [],
  });
  const [myOrders, setMyOrders] = useState<MyOrder[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);

  const [bookLoading, setBookLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);

  // ── Fetch order book ────────────────────────────────────────────────
  const fetchOrderBook = useCallback(async () => {
    setBookLoading(true);
    try {
      const data = await api.get<OrderBookData>(
        `/market/orders?commodity=${activeTab}`
      );
      setOrderBook(data);
    } catch (err) {
      setError("Failed to load order book");
    } finally {
      setBookLoading(false);
    }
  }, [activeTab]);

  // ── Fetch user's orders ─────────────────────────────────────────────
  const fetchMyOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const data = await api.get<{ orders: MyOrder[] }>("/market/my-orders");
      setMyOrders(data.orders);
    } catch (err) {
      setError("Failed to load your orders");
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // ── Fetch recent trades ─────────────────────────────────────────────
  const fetchTrades = useCallback(async () => {
    setTradesLoading(true);
    try {
      const data = await api.get<{ trades: Trade[] }>(
        `/market/trades?commodity=${activeTab}&limit=20`
      );
      setTrades(data.trades);
    } catch (err) {
      setError("Failed to load recent trades");
    } finally {
      setTradesLoading(false);
    }
  }, [activeTab]);

  // ── Fetch price history ────────────────────────────────────────────
  const fetchPriceHistory = useCallback(async () => {
    try {
      const data = await api.get<{ history: PricePoint[] }>(
        `/market/price-history?commodity=${activeTab}&period=24h`
      );
      setPriceHistory(data.history);
    } catch {
      setPriceHistory([]);
    }
  }, [activeTab]);

  useEffect(() => { document.title = "Market - Hegemon"; }, []);

  // Fetch data on mount and when tab changes
  useEffect(() => {
    fetchOrderBook();
    fetchTrades();
    fetchPriceHistory();
  }, [fetchOrderBook, fetchTrades, fetchPriceHistory]);

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  // Auto-clear success messages
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // ── Place order ─────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    const price = parseFloat(orderPrice);
    const quantity = parseInt(orderQty, 10);

    if (!price || price <= 0) {
      setError("Enter a valid price");
      return;
    }
    if (!quantity || quantity <= 0) {
      setError("Enter a valid quantity");
      return;
    }

    setPlacing(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const data = await api.post<{ order: MyOrder; matchedQty: number }>(
        "/market/orders",
        {
          side: orderSide,
          commodity: activeTab,
          price,
          quantity,
        }
      );

      const matched = data.matchedQty;
      if (matched > 0) {
        setSuccessMsg(
          `Order placed! ${matched.toLocaleString()} units matched immediately.`
        );
      } else {
        setSuccessMsg("Order placed on the book.");
      }

      setOrderPrice("");
      setOrderQty("");

      // Refresh everything
      await Promise.all([fetchOrderBook(), fetchMyOrders(), fetchTrades()]);
      await refreshNation();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to place order");
      }
    } finally {
      setPlacing(false);
    }
  };

  // ── Cancel order ────────────────────────────────────────────────────
  const handleCancel = async (orderId: string) => {
    setCancellingId(orderId);
    setError(null);

    try {
      await api.delete(`/market/orders/${orderId}`);
      setSuccessMsg("Order cancelled.");
      await Promise.all([fetchOrderBook(), fetchMyOrders()]);
      await refreshNation();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to cancel order");
      }
    } finally {
      setCancellingId(null);
    }
  };

  // ── Derived values ──────────────────────────────────────────────────
  const book = orderBook;
  const maxQty = Math.max(
    ...book.bids.map((b) => b.totalQty),
    ...book.asks.map((a) => a.totalQty),
    1
  );

  const bestBid = book.bids.length > 0 ? book.bids[0].price : 0;
  const bestAsk = book.asks.length > 0 ? book.asks[0].price : 0;
  const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0;
  const mid = bestAsk > 0 && bestBid > 0 ? (bestAsk + bestBid) / 2 : 0;

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          Market Exchange <HelpTooltip articleId="market-overview" size="md" />
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Trade commodities with other nations
        </p>
      </div>

      {/* Resource bar */}
      {nation && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 bg-gray-900 border border-gray-800 rounded-xl px-5 py-3 text-sm">
          <div>
            <span className="text-gray-500">Cash: </span>
            <span className="text-amber-400 font-medium font-mono">
              ${nation.cash.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Materials: </span>
            <span className="text-slate-300 font-medium font-mono">
              {nation.materials.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Tech Points: </span>
            <span className="text-cyan-400 font-medium font-mono">
              {nation.techPoints.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Food: </span>
            <span className="text-emerald-400 font-medium font-mono">
              {nation.food.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      )}

      {/* Status messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-2 text-sm text-emerald-400">
          {successMsg}
        </div>
      )}

      {/* Commodity tabs */}
      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-gray-800 text-white border border-gray-700"
                : "text-gray-500 hover:text-gray-300 border border-transparent"
            }`}
          >
            <span className={`flex items-center gap-1.5 ${activeTab === tab.key ? tab.color : ""}`}>
              <GameIcon name={tab.iconName} size={16} />
              {tab.label}
            </span>
          </button>
        ))}
        <div className="ml-auto text-sm text-gray-500 flex items-center gap-2">
          <span>Market fee:</span>
          <span className="text-amber-400 font-medium">3.5%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order book */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Order Book</h2>
            {bookLoading && (
              <span className="text-xs text-gray-600 animate-pulse">
                Loading...
              </span>
            )}
          </div>

          {book.bids.length === 0 && book.asks.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-600 text-sm">
              No open orders for {commodityLabel(activeTab)}
            </div>
          ) : (
            <div className="grid grid-cols-2 divide-x divide-gray-800">
              {/* Bids */}
              <div>
                <div className="grid grid-cols-2 text-xs text-gray-500 px-4 py-2 border-b border-gray-800">
                  <span>Bid Price</span>
                  <span className="text-right">Quantity</span>
                </div>
                {book.bids.length === 0 ? (
                  <div className="px-4 py-4 text-gray-600 text-xs text-center">
                    No bids
                  </div>
                ) : (
                  book.bids.map((bid, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-2 text-sm px-4 py-1.5 relative"
                    >
                      <div
                        className="absolute inset-0 bg-emerald-500/5"
                        style={{
                          width: `${(bid.totalQty / maxQty) * 100}%`,
                        }}
                      />
                      <span className="text-emerald-400 font-mono relative z-10">
                        ${bid.price.toFixed(2)}
                      </span>
                      <span className="text-right text-gray-300 font-mono relative z-10">
                        {bid.totalQty.toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Asks */}
              <div>
                <div className="grid grid-cols-2 text-xs text-gray-500 px-4 py-2 border-b border-gray-800">
                  <span>Ask Price</span>
                  <span className="text-right">Quantity</span>
                </div>
                {book.asks.length === 0 ? (
                  <div className="px-4 py-4 text-gray-600 text-xs text-center">
                    No asks
                  </div>
                ) : (
                  book.asks.map((ask, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-2 text-sm px-4 py-1.5 relative"
                    >
                      <div
                        className="absolute inset-0 right-0 left-auto bg-red-500/5"
                        style={{
                          width: `${(ask.totalQty / maxQty) * 100}%`,
                        }}
                      />
                      <span className="text-red-400 font-mono relative z-10">
                        ${ask.price.toFixed(2)}
                      </span>
                      <span className="text-right text-gray-300 font-mono relative z-10">
                        {ask.totalQty.toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Spread */}
          <div className="border-t border-gray-800 px-4 py-2 text-xs text-gray-500 flex justify-between">
            <span>Spread: ${spread.toFixed(2)}</span>
            <span>Mid: ${mid > 0 ? mid.toFixed(2) : "--"}</span>
          </div>
        </div>

        {/* Place order */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            Place Order <HelpTooltip articleId="market-trading" />
          </h2>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setOrderSide("BUY")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                orderSide === "BUY"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-800 text-gray-500 hover:text-gray-300"
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setOrderSide("SELL")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                orderSide === "SELL"
                  ? "bg-red-600 text-white"
                  : "bg-gray-800 text-gray-500 hover:text-gray-300"
              }`}
            >
              Sell
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Price per unit
              </label>
              <input
                type="number"
                step="0.01"
                value={orderPrice}
                onChange={(e) => setOrderPrice(e.target.value)}
                placeholder="0.00"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Quantity
              </label>
              <input
                type="number"
                value={orderQty}
                onChange={(e) => setOrderQty(e.target.value)}
                placeholder="0"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            {orderPrice && orderQty && (
              <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="text-amber-400">
                    $
                    {(
                      parseFloat(orderPrice) * parseFloat(orderQty)
                    ).toLocaleString()}
                  </span>
                </div>
                {orderSide === "BUY" && (
                  <div className="flex justify-between">
                    <span>Fee (3.5%):</span>
                    <span className="text-gray-500">
                      $
                      {(
                        parseFloat(orderPrice) *
                        parseFloat(orderQty) *
                        0.035
                      ).toFixed(0)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-700 pt-1">
                  <span>
                    {orderSide === "BUY" ? "Total cost:" : "You receive:"}
                  </span>
                  <span className="text-white font-medium">
                    $
                    {(
                      parseFloat(orderPrice) *
                      parseFloat(orderQty) *
                      (orderSide === "BUY" ? 1.035 : 1)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={placing || !orderPrice || !orderQty}
              className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                orderSide === "BUY"
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-red-600 hover:bg-red-500 text-white"
              }`}
            >
              {placing
                ? "Placing..."
                : orderSide === "BUY"
                  ? "Place Buy Order"
                  : "Place Sell Order"}
            </button>
          </div>
        </div>
      </div>

      {/* Price chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-3">
          Price History
        </h2>
        <PriceChart data={priceHistory} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Your orders */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Your Orders</h2>
            {ordersLoading && (
              <span className="text-xs text-gray-600 animate-pulse">
                Loading...
              </span>
            )}
          </div>
          <div className="divide-y divide-gray-800">
            {myOrders.length === 0 ? (
              <div className="px-5 py-6 text-center text-gray-600 text-sm">
                No orders yet
              </div>
            ) : (
              myOrders.map((order) => (
                <div
                  key={order.id}
                  className="px-5 py-3 flex items-center justify-between"
                >
                  <div>
                    <span
                      className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                        order.side === "BUY"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {order.side === "BUY" ? "Buy" : "Sell"}
                    </span>
                    <span className="text-sm text-gray-300 ml-2">
                      {commodityLabel(order.commodity)}
                    </span>
                    <span className="text-xs text-gray-600 ml-2">
                      @ ${order.price.toFixed(2)}
                    </span>
                    {order.status === "CANCELLED" && (
                      <span className="text-xs text-gray-600 ml-2">
                        (cancelled)
                      </span>
                    )}
                    {order.status === "FILLED" && (
                      <span className="text-xs text-emerald-600 ml-2">
                        (filled)
                      </span>
                    )}
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="text-sm text-gray-300 tabular-nums">
                      {order.filled.toLocaleString()} /{" "}
                      {order.quantity.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-600">
                      {timeAgo(order.createdAt)}
                    </span>
                    {(order.status === "OPEN" || order.status === "PARTIAL") && (
                      <button
                        onClick={() => handleCancel(order.id)}
                        disabled={cancellingId === order.id}
                        className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                      >
                        {cancellingId === order.id ? "..." : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent trades */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              Recent Trades
            </h2>
            {tradesLoading && (
              <span className="text-xs text-gray-600 animate-pulse">
                Loading...
              </span>
            )}
          </div>
          <div className="divide-y divide-gray-800">
            {trades.length === 0 ? (
              <div className="px-5 py-6 text-center text-gray-600 text-sm">
                No trades yet for {commodityLabel(activeTab)}
              </div>
            ) : (
              trades.map((trade) => (
                <div
                  key={trade.id}
                  className="px-5 py-2.5 flex items-center justify-between text-sm"
                >
                  <span
                    className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                      trade.side === "BUY"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {trade.side === "BUY" ? "Buy" : "Sell"}
                  </span>
                  <span className="text-gray-300 font-mono tabular-nums">
                    ${trade.price.toFixed(2)}
                  </span>
                  <span className="text-gray-400 tabular-nums">
                    {trade.quantity.toLocaleString()}
                  </span>
                  <span className="text-gray-600 text-xs">
                    {timeAgo(trade.filledAt || trade.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
