import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { OrderSide, Commodity, OrderStatus } from "../generated/prisma/enums.js";
import { wsManager } from "../ws.js";

const MARKET_FEE = 0.035; // 3.5% buyer fee

const TRADEABLE_COMMODITIES: Commodity[] = [
  Commodity.MATERIALS,
  Commodity.TECH_POINTS,
  Commodity.FOOD,
];

interface PlaceOrderBody {
  side: string;
  commodity: string;
  price: number;
  quantity: number;
}

interface OrderBookQuery {
  commodity?: string;
}

interface TradesQuery {
  commodity?: string;
  limit?: string;
}

interface PriceHistoryQuery {
  commodity?: string;
  period?: string;
}

interface CancelParams {
  id: string;
}

/** Map a Commodity enum to the nation resource field name */
function commodityToField(c: Commodity): "materials" | "techPoints" | "food" {
  switch (c) {
    case Commodity.MATERIALS:
      return "materials";
    case Commodity.TECH_POINTS:
      return "techPoints";
    case Commodity.FOOD:
      return "food";
    default:
      throw new Error(`Cannot trade commodity: ${c}`);
  }
}

export async function marketRoutes(app: FastifyInstance) {
  app.addHook("onRequest", requireAuth);

  // ── GET /market/orders  - Order book ──────────────────────────────────
  app.get<{ Querystring: OrderBookQuery }>(
    "/market/orders",
    async (req, reply) => {
      const commodity = req.query.commodity as Commodity | undefined;
      if (commodity && !TRADEABLE_COMMODITIES.includes(commodity)) {
        return reply.status(400).send({
          error: "Invalid commodity",
          valid: TRADEABLE_COMMODITIES,
        });
      }

      const round = await prisma.round.findFirst({ where: { active: true } });
      if (!round) return reply.status(404).send({ error: "No active round" });

      const where = {
        roundId: round.id,
        status: { in: [OrderStatus.OPEN, OrderStatus.PARTIAL] as OrderStatus[] },
        ...(commodity ? { commodity } : {}),
      };

      // Bids: BUY orders, highest price first
      const bidRows = await prisma.marketOrder.findMany({
        where: { ...where, side: OrderSide.BUY },
        orderBy: [{ price: "desc" }, { createdAt: "asc" }],
      });

      // Asks: SELL orders, lowest price first
      const askRows = await prisma.marketOrder.findMany({
        where: { ...where, side: OrderSide.SELL },
        orderBy: [{ price: "asc" }, { createdAt: "asc" }],
      });

      // Aggregate by price level
      const aggregate = (
        rows: typeof bidRows
      ): { price: number; totalQty: number }[] => {
        const map = new Map<number, number>();
        for (const row of rows) {
          const remaining = row.quantity - row.filled;
          map.set(row.price, (map.get(row.price) || 0) + remaining);
        }
        return Array.from(map.entries()).map(([price, totalQty]) => ({
          price,
          totalQty,
        }));
      };

      return reply.send({ bids: aggregate(bidRows), asks: aggregate(askRows) });
    }
  );

  // ── GET /market/my-orders ─────────────────────────────────────────────
  app.get("/market/my-orders", async (req, reply) => {
    const round = await prisma.round.findFirst({ where: { active: true } });
    if (!round) return reply.status(404).send({ error: "No active round" });

    const nation = await prisma.nation.findUnique({
      where: {
        userId_roundId: { userId: req.user!.id, roundId: round.id },
      },
    });
    if (!nation) return reply.status(404).send({ error: "No nation in current round" });

    const orders = await prisma.marketOrder.findMany({
      where: { nationId: nation.id, roundId: round.id },
      orderBy: { createdAt: "desc" },
    });

    return reply.send({
      orders: orders.map((o) => ({
        id: o.id,
        side: o.side,
        commodity: o.commodity,
        price: o.price,
        quantity: o.quantity,
        filled: o.filled,
        status: o.status,
        createdAt: o.createdAt,
      })),
    });
  });

  // ── POST /market/orders  - Place a new order ─────────────────────────
  app.post<{ Body: PlaceOrderBody }>(
    "/market/orders",
    async (req, reply) => {
      const { side, commodity, price, quantity } = req.body;

      // Validate inputs
      if (!side || !(side in OrderSide)) {
        return reply.status(400).send({ error: "Invalid side (BUY or SELL)" });
      }
      if (!commodity || !TRADEABLE_COMMODITIES.includes(commodity as Commodity)) {
        return reply.status(400).send({
          error: "Invalid commodity",
          valid: TRADEABLE_COMMODITIES,
        });
      }
      if (!price || price <= 0) {
        return reply.status(400).send({ error: "Price must be > 0" });
      }
      if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
        return reply.status(400).send({ error: "Quantity must be a positive integer" });
      }
      if (quantity > 10000) {
        return reply.status(400).send({ error: "Quantity max is 10000" });
      }
      if (price > 100000) {
        return reply.status(400).send({ error: "Price max is 100000" });
      }

      const orderSide = side as OrderSide;
      const orderCommodity = commodity as Commodity;
      const resourceField = commodityToField(orderCommodity);

      const round = await prisma.round.findFirst({ where: { active: true } });
      if (!round) return reply.status(404).send({ error: "No active round" });

      const nation = await prisma.nation.findUnique({
        where: {
          userId_roundId: { userId: req.user!.id, roundId: round.id },
        },
      });
      if (!nation) return reply.status(404).send({ error: "No nation in current round" });

      // Validate resources
      if (orderSide === OrderSide.BUY) {
        const totalCost = price * quantity * (1 + MARKET_FEE);
        if (nation.cash < totalCost) {
          return reply.status(400).send({
            error: "Not enough cash",
            need: totalCost,
            have: nation.cash,
          });
        }
      } else {
        // SELL: must have the commodity
        const available = nation[resourceField] as number;
        if (available < quantity) {
          return reply.status(400).send({
            error: `Not enough ${resourceField}`,
            need: quantity,
            have: available,
          });
        }
      }

      // Reserve resources upfront
      if (orderSide === OrderSide.BUY) {
        const totalCost = price * quantity * (1 + MARKET_FEE);
        await prisma.nation.update({
          where: { id: nation.id },
          data: { cash: { decrement: totalCost } },
        });
      } else {
        await prisma.nation.update({
          where: { id: nation.id },
          data: { [resourceField]: { decrement: quantity } },
        });
      }

      // Create the order
      const order = await prisma.marketOrder.create({
        data: {
          roundId: round.id,
          nationId: nation.id,
          side: orderSide,
          commodity: orderCommodity,
          price,
          quantity,
          filled: 0,
          status: OrderStatus.OPEN,
        },
      });

      // ── Matching engine (wrapped in transaction for atomicity) ──
      const txResult = await prisma.$transaction(async (tx) => {
        let remainingQty = quantity;
        let totalMatchedQty = 0;
        const matchedNationIds: string[] = [];

        if (orderSide === OrderSide.BUY) {
          // Match against SELL orders at <= buy price, lowest ask first (price-time priority)
          const matchable = await tx.marketOrder.findMany({
            where: {
              roundId: round.id,
              side: OrderSide.SELL,
              commodity: orderCommodity,
              price: { lte: price },
              status: { in: [OrderStatus.OPEN, OrderStatus.PARTIAL] },
              nationId: { not: nation.id }, // don't self-trade
            },
            orderBy: [{ price: "asc" }, { createdAt: "asc" }],
          });

          for (const sell of matchable) {
            if (remainingQty <= 0) break;

            const sellRemaining = sell.quantity - sell.filled;
            const fillQty = Math.min(remainingQty, sellRemaining);
            const fillPrice = sell.price; // execute at the resting order's price

            // Update the sell order
            const newSellFilled = sell.filled + fillQty;
            const sellStatus =
              newSellFilled >= sell.quantity ? OrderStatus.FILLED : OrderStatus.PARTIAL;

            await tx.marketOrder.update({
              where: { id: sell.id },
              data: {
                filled: newSellFilled,
                status: sellStatus,
                ...(sellStatus === OrderStatus.FILLED ? { filledAt: new Date() } : {}),
              },
            });

            // Transfer resources:
            // Buyer gets the commodity
            // Seller gets cash (at fill price, no fee)
            const cashToSeller = fillPrice * fillQty;

            await tx.nation.update({
              where: { id: nation.id },
              data: { [resourceField]: { increment: fillQty } },
            });

            await tx.nation.update({
              where: { id: sell.nationId },
              data: { cash: { increment: cashToSeller } },
            });

            // Refund buyer the difference if fill price < order price
            // The buyer reserved (price * qty * 1.035) but only pays (fillPrice * fillQty * 1.035)
            if (fillPrice < price) {
              const refund = (price - fillPrice) * fillQty * (1 + MARKET_FEE);
              await tx.nation.update({
                where: { id: nation.id },
                data: { cash: { increment: refund } },
              });
            }

            remainingQty -= fillQty;
            totalMatchedQty += fillQty;
            matchedNationIds.push(sell.nationId);
          }
        } else {
          // SELL order: match against BUY orders at >= sell price, highest bid first
          const matchable = await tx.marketOrder.findMany({
            where: {
              roundId: round.id,
              side: OrderSide.BUY,
              commodity: orderCommodity,
              price: { gte: price },
              status: { in: [OrderStatus.OPEN, OrderStatus.PARTIAL] },
              nationId: { not: nation.id },
            },
            orderBy: [{ price: "desc" }, { createdAt: "asc" }],
          });

          for (const buy of matchable) {
            if (remainingQty <= 0) break;

            const buyRemaining = buy.quantity - buy.filled;
            const fillQty = Math.min(remainingQty, buyRemaining);
            const fillPrice = buy.price; // execute at the resting order's price

            // Update the buy order
            const newBuyFilled = buy.filled + fillQty;
            const buyStatus =
              newBuyFilled >= buy.quantity ? OrderStatus.FILLED : OrderStatus.PARTIAL;

            await tx.marketOrder.update({
              where: { id: buy.id },
              data: {
                filled: newBuyFilled,
                status: buyStatus,
                ...(buyStatus === OrderStatus.FILLED ? { filledAt: new Date() } : {}),
              },
            });

            // Transfer resources:
            // Buyer gets the commodity
            // Seller gets cash at fill price
            const cashToSeller = fillPrice * fillQty;

            await tx.nation.update({
              where: { id: buy.nationId },
              data: { [resourceField]: { increment: fillQty } },
            });

            await tx.nation.update({
              where: { id: nation.id },
              data: { cash: { increment: cashToSeller } },
            });

            // If the resting buy order was at a higher price than the sell, the buyer
            // already reserved cash at their price. The difference stays as fee savings
            // (buyer paid less than max). Refund the difference to the buyer.
            if (fillPrice > price) {
              // Actually the buyer reserved at buy.price. They pay fillPrice = buy.price.
              // No refund needed in this direction since fillPrice === buy.price.
            }

            remainingQty -= fillQty;
            totalMatchedQty += fillQty;
            matchedNationIds.push(buy.nationId);
          }
        }

        // Update the new order's fill status
        const newFilled = totalMatchedQty;
        let newStatus: OrderStatus;
        if (newFilled >= quantity) {
          newStatus = OrderStatus.FILLED;
        } else if (newFilled > 0) {
          newStatus = OrderStatus.PARTIAL;
        } else {
          newStatus = OrderStatus.OPEN;
        }

        const updatedOrder = await tx.marketOrder.update({
          where: { id: order.id },
          data: {
            filled: newFilled,
            status: newStatus,
            ...(newStatus === OrderStatus.FILLED ? { filledAt: new Date() } : {}),
          },
        });

        return { updatedOrder, totalMatchedQty, remainingQty, newStatus, matchedNationIds };
      });

      const { updatedOrder, totalMatchedQty, matchedNationIds } = txResult;

      // Notify matched counterparties in real-time
      if (matchedNationIds.length > 0) {
        wsManager.sendToMany(matchedNationIds, "order_filled", {
          commodity: orderCommodity,
        });
        // Also notify the order placer
        wsManager.sendTo(nation.id, "order_matched", {
          commodity: orderCommodity,
          matchedQty: totalMatchedQty,
        });
      }

      return reply.status(201).send({
        order: {
          id: updatedOrder.id,
          side: updatedOrder.side,
          commodity: updatedOrder.commodity,
          price: updatedOrder.price,
          quantity: updatedOrder.quantity,
          filled: updatedOrder.filled,
          status: updatedOrder.status,
          createdAt: updatedOrder.createdAt,
        },
        matchedQty: totalMatchedQty,
      });
    }
  );

  // ── DELETE /market/orders/:id  - Cancel an order ──────────────────────
  app.delete<{ Params: CancelParams }>(
    "/market/orders/:id",
    async (req, reply) => {
      const round = await prisma.round.findFirst({ where: { active: true } });
      if (!round) return reply.status(404).send({ error: "No active round" });

      const nation = await prisma.nation.findUnique({
        where: {
          userId_roundId: { userId: req.user!.id, roundId: round.id },
        },
      });
      if (!nation) return reply.status(404).send({ error: "No nation in current round" });

      const order = await prisma.marketOrder.findUnique({
        where: { id: req.params.id },
      });

      if (!order) return reply.status(404).send({ error: "Order not found" });
      if (order.nationId !== nation.id) {
        return reply.status(403).send({ error: "Not your order" });
      }
      if (order.status === OrderStatus.FILLED || order.status === OrderStatus.CANCELLED) {
        return reply.status(400).send({ error: "Order is already " + order.status.toLowerCase() });
      }

      const remaining = order.quantity - order.filled;
      const resourceField = commodityToField(order.commodity as Commodity);

      // Refund the unreserved resources
      if (order.side === OrderSide.BUY) {
        const refund = order.price * remaining * (1 + MARKET_FEE);
        await prisma.nation.update({
          where: { id: nation.id },
          data: { cash: { increment: refund } },
        });
      } else {
        // SELL: return the unsold commodity
        await prisma.nation.update({
          where: { id: nation.id },
          data: { [resourceField]: { increment: remaining } },
        });
      }

      const cancelled = await prisma.marketOrder.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELLED },
      });

      return reply.send({
        order: {
          id: cancelled.id,
          side: cancelled.side,
          commodity: cancelled.commodity,
          price: cancelled.price,
          quantity: cancelled.quantity,
          filled: cancelled.filled,
          status: cancelled.status,
          createdAt: cancelled.createdAt,
        },
      });
    }
  );

  // ── GET /market/trades  - Recent filled trades ────────────────────────
  app.get<{ Querystring: TradesQuery }>(
    "/market/trades",
    async (req, reply) => {
      const commodity = req.query.commodity as Commodity | undefined;
      const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);

      if (commodity && !TRADEABLE_COMMODITIES.includes(commodity)) {
        return reply.status(400).send({
          error: "Invalid commodity",
          valid: TRADEABLE_COMMODITIES,
        });
      }

      const round = await prisma.round.findFirst({ where: { active: true } });
      if (!round) return reply.status(404).send({ error: "No active round" });

      const trades = await prisma.marketOrder.findMany({
        where: {
          roundId: round.id,
          status: OrderStatus.FILLED,
          ...(commodity ? { commodity } : {}),
        },
        orderBy: { filledAt: "desc" },
        take: limit,
      });

      return reply.send({
        trades: trades.map((t) => ({
          id: t.id,
          commodity: t.commodity,
          price: t.price,
          quantity: t.quantity,
          side: t.side,
          createdAt: t.createdAt,
          filledAt: t.filledAt,
        })),
      });
    }
  );

  // ── GET /market/price-history  - Price history by commodity ────
  app.get<{ Querystring: PriceHistoryQuery }>(
    "/market/price-history",
    async (req, reply) => {
      const commodity = req.query.commodity as Commodity | undefined;
      const period = req.query.period || "24h";

      if (!commodity || !TRADEABLE_COMMODITIES.includes(commodity)) {
        return reply.status(400).send({
          error: "Invalid or missing commodity",
          valid: TRADEABLE_COMMODITIES,
        });
      }

      // Parse period to ms
      let periodMs: number;
      switch (period) {
        case "1h":
          periodMs = 60 * 60 * 1000;
          break;
        case "6h":
          periodMs = 6 * 60 * 60 * 1000;
          break;
        case "24h":
          periodMs = 24 * 60 * 60 * 1000;
          break;
        case "7d":
          periodMs = 7 * 24 * 60 * 60 * 1000;
          break;
        default:
          periodMs = 24 * 60 * 60 * 1000;
      }

      const since = new Date(Date.now() - periodMs);

      const round = await prisma.round.findFirst({ where: { active: true } });
      if (!round) return reply.status(404).send({ error: "No active round" });

      // Fetch filled orders for this commodity in the time range
      const filledOrders = await prisma.marketOrder.findMany({
        where: {
          roundId: round.id,
          commodity: commodity,
          status: OrderStatus.FILLED,
          filledAt: { gte: since },
        },
        orderBy: { filledAt: "asc" },
        select: {
          price: true,
          quantity: true,
          filledAt: true,
        },
      });

      // Group by 30-min buckets
      const BUCKET_MS = 30 * 60 * 1000;
      const buckets = new Map<
        number,
        { totalPrice: number; totalQty: number }
      >();

      for (const order of filledOrders) {
        if (!order.filledAt) continue;
        const bucketTs =
          Math.floor(order.filledAt.getTime() / BUCKET_MS) * BUCKET_MS;
        const existing = buckets.get(bucketTs) || {
          totalPrice: 0,
          totalQty: 0,
        };
        existing.totalPrice += order.price * order.quantity;
        existing.totalQty += order.quantity;
        buckets.set(bucketTs, existing);
      }

      const history = Array.from(buckets.entries())
        .sort(([a], [b]) => a - b)
        .map(([ts, data]) => ({
          timestamp: new Date(ts).toISOString(),
          avgPrice:
            data.totalQty > 0
              ? Math.round((data.totalPrice / data.totalQty) * 100) / 100
              : 0,
          volume: data.totalQty,
        }));

      return reply.send({ commodity, period, history });
    }
  );
}
