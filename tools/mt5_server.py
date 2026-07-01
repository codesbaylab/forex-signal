"""
MT5 MCP Server — XAU/USD Signal Tool
Reads candle data from MetaTrader 5 and publishes signals to the platform.

Setup:
  pip install MetaTrader5 mcp requests
  Set env vars: SIGNAL_API_URL, SIGNAL_PUBLISH_KEY
"""

import asyncio
import json
import os
from datetime import datetime, timezone, timedelta

import MetaTrader5 as mt5
import requests
from mcp.server import Server
from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions
from mcp.server.stdio import stdio_server
import mcp.types as types

TIMEFRAME_MAP = {
    "M1":  mt5.TIMEFRAME_M1,
    "M5":  mt5.TIMEFRAME_M5,
    "M15": mt5.TIMEFRAME_M15,
    "M30": mt5.TIMEFRAME_M30,
    "H1":  mt5.TIMEFRAME_H1,
    "H4":  mt5.TIMEFRAME_H4,
    "D1":  mt5.TIMEFRAME_D1,
    "W1":  mt5.TIMEFRAME_W1,
}

SYMBOL = "XAUUSD"
API_URL = os.environ.get("SIGNAL_API_URL", "http://localhost:3000")
API_KEY = os.environ.get("SIGNAL_PUBLISH_KEY", "")

server = Server("mt5-signals")


def mt5_init():
    if not mt5.initialize():
        raise RuntimeError(f"MT5 init failed: {mt5.last_error()}")


@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="get_candles",
            description="Get OHLCV candles for XAUUSD from MetaTrader 5. Use timeframe D1 for trend, H4 for structure, H1 for entry.",
            inputSchema={
                "type": "object",
                "properties": {
                    "timeframe": {
                        "type": "string",
                        "enum": ["M15", "H1", "H4", "D1"],
                        "description": "Candle timeframe"
                    },
                    "count": {
                        "type": "integer",
                        "description": "Number of candles to fetch (default 50)",
                        "default": 50
                    }
                },
                "required": ["timeframe"]
            }
        ),
        types.Tool(
            name="get_price",
            description="Get current live bid/ask price for XAUUSD",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        types.Tool(
            name="check_news",
            description="Check the economic calendar for high-impact USD news events. Always call this BEFORE publishing a signal. If high-impact news is within 2 hours, do NOT publish — skip the signal for today.",
            inputSchema={
                "type": "object",
                "properties": {
                    "hours_ahead": {
                        "type": "integer",
                        "description": "How many hours ahead to check for news (default 2)",
                        "default": 2
                    }
                }
            }
        ),
        types.Tool(
            name="open_trade",
            description="Open a market trade on XAUUSD in MetaTrader 5.",
            inputSchema={
                "type": "object",
                "properties": {
                    "direction": {"type": "string", "enum": ["BUY", "SELL"]},
                    "volume":    {"type": "number", "description": "Lot size (e.g. 0.01)", "default": 0.01},
                    "sl":        {"type": "number", "description": "Stop loss price"},
                    "tp":        {"type": "number", "description": "Take profit price"},
                    "comment":   {"type": "string", "description": "Order comment", "default": "SignalFX"}
                },
                "required": ["direction", "sl", "tp"]
            }
        ),
        types.Tool(
            name="close_trade",
            description="Close an open XAUUSD position by ticket number.",
            inputSchema={
                "type": "object",
                "properties": {
                    "ticket": {"type": "integer", "description": "Position ticket number to close"}
                },
                "required": ["ticket"]
            }
        ),
        types.Tool(
            name="get_positions",
            description="Get all currently open positions on XAUUSD.",
            inputSchema={"type": "object", "properties": {}}
        ),
        types.Tool(
            name="open_limit_trade",
            description="Place a pending LIMIT order on XAUUSD in MetaTrader 5. Use after ICT sweep is detected — the limit sits at the swept level and waits for price to retest it.",
            inputSchema={
                "type": "object",
                "properties": {
                    "direction":     {"type": "string", "enum": ["BUY", "SELL"]},
                    "entry":         {"type": "number", "description": "Limit price (below current for BUY, above for SELL)"},
                    "volume":        {"type": "number", "description": "Lot size", "default": 0.01},
                    "sl":            {"type": "number", "description": "Stop loss price"},
                    "tp":            {"type": "number", "description": "Take profit price"},
                    "expiry_hours":  {"type": "integer", "description": "Hours until pending order expires", "default": 6},
                },
                "required": ["direction", "entry", "sl", "tp"]
            }
        ),
        types.Tool(
            name="get_pending_orders",
            description="Get all pending (unfilled) limit orders on XAUUSD.",
            inputSchema={"type": "object", "properties": {}}
        ),
        types.Tool(
            name="cancel_order",
            description="Cancel a pending limit order by ticket number.",
            inputSchema={
                "type": "object",
                "properties": {
                    "ticket": {"type": "integer", "description": "Order ticket number to cancel"}
                },
                "required": ["ticket"]
            }
        ),
        types.Tool(
            name="publish_signal",
            description="Publish a LIMIT ORDER signal to the platform. Always call check_news first. Entry is the limit price (swept session level). Subscribers set this as a pending order — it fills only if price returns to that level within valid_hours.",
            inputSchema={
                "type": "object",
                "properties": {
                    "direction": {
                        "type": "string",
                        "enum": ["BUY", "SELL"],
                    },
                    "entry": {
                        "type": "number",
                        "description": "Limit entry price — the swept session level (session high for SELL, session low for BUY)"
                    },
                    "sl": {
                        "type": "number",
                        "description": "Stop loss — beyond sweep extreme + $1.50"
                    },
                    "tp": {
                        "type": "number",
                        "description": "Take profit — 1:2 R:R from limit entry"
                    },
                    "session": {
                        "type": "string",
                        "enum": ["London", "NY"],
                        "description": "Which killzone the sweep occurred in"
                    },
                    "valid_hours": {
                        "type": "integer",
                        "description": "Hours the limit order remains valid (default 6)",
                        "default": 6
                    },
                    "timeframe": {
                        "type": "string",
                        "enum": ["M15", "H1", "H4", "D1"],
                        "description": "Chart timeframe the signal is based on (default H4)",
                        "default": "H4"
                    },
                    "analysis": {
                        "type": "string",
                        "description": "Brief explanation: H4 bias, session swept, wick size, OB location"
                    }
                },
                "required": ["direction", "entry", "sl", "tp", "session", "analysis"]
            }
        ),
    ]


@server.call_tool()
async def handle_call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    if name == "get_price":
        try:
            mt5_init()
            tick = mt5.symbol_info_tick(SYMBOL)
            if tick is None:
                return [types.TextContent(type="text", text=f"Error: {mt5.last_error()}")]
            result = {
                "symbol": SYMBOL,
                "bid": round(float(tick.bid), 2),
                "ask": round(float(tick.ask), 2),
                "spread": round(float(tick.ask - tick.bid), 2),
                "time": datetime.fromtimestamp(tick.time).isoformat(),
            }
            return [types.TextContent(type="text", text=json.dumps(result))]
        finally:
            mt5.shutdown()

    elif name == "get_candles":
        try:
            mt5_init()
            tf_key = arguments.get("timeframe", "H1")
            tf = TIMEFRAME_MAP.get(tf_key, mt5.TIMEFRAME_H1)
            count = int(arguments.get("count", 50))

            rates = mt5.copy_rates_from_pos(SYMBOL, tf, 0, count)
            if rates is None:
                return [types.TextContent(type="text", text=f"No data: {mt5.last_error()}")]

            candles = []
            for r in rates:
                candles.append({
                    "time": datetime.fromtimestamp(r["time"]).strftime("%Y-%m-%d %H:%M"),
                    "open":  round(float(r["open"]),  2),
                    "high":  round(float(r["high"]),  2),
                    "low":   round(float(r["low"]),   2),
                    "close": round(float(r["close"]), 2),
                    "vol":   int(r["tick_volume"]),
                })

            return [types.TextContent(type="text", text=json.dumps({
                "symbol": SYMBOL,
                "timeframe": tf_key,
                "count": len(candles),
                "candles": candles,
            }))]
        finally:
            mt5.shutdown()

    elif name == "check_news":
        hours_ahead = int(arguments.get("hours_ahead", 2))
        try:
            # ForexFactory community calendar — high-impact USD events
            resp = requests.get(
                "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
                timeout=10,
                headers={"User-Agent": "Mozilla/5.0"}
            )
            resp.raise_for_status()
            events = resp.json()
        except Exception as e:
            return [types.TextContent(type="text", text=json.dumps({
                "status": "error",
                "message": f"Could not fetch calendar: {e}. Proceed with caution.",
            }))]

        now_utc = datetime.now(timezone.utc)
        window_end = now_utc + timedelta(hours=hours_ahead)

        def parse_event_dt(ev):
            date_str = ev.get("date", "")
            if not date_str:
                return None
            try:
                # Format: "2026-07-01T13:30:00-04:00"
                return datetime.fromisoformat(date_str).astimezone(timezone.utc)
            except ValueError:
                return None

        high_usd = [e for e in events if e.get("impact") == "High" and e.get("country") in ("USD", "XAU")]

        upcoming = []
        for ev in high_usd:
            ev_dt = parse_event_dt(ev)
            if ev_dt and now_utc <= ev_dt <= window_end:
                upcoming.append({
                    "event":    ev.get("title"),
                    "time_utc": ev_dt.strftime("%H:%M UTC"),
                    "forecast": ev.get("forecast") or "-",
                    "previous": ev.get("previous") or "-",
                })

        if upcoming:
            return [types.TextContent(type="text", text=json.dumps({
                "safe_to_trade": False,
                "reason": f"{len(upcoming)} high-impact USD event(s) within {hours_ahead}h — skip signal today",
                "events": upcoming,
            }))]
        else:
            future = []
            for ev in high_usd:
                ev_dt = parse_event_dt(ev)
                if ev_dt and ev_dt > now_utc:
                    future.append((ev_dt, ev.get("title")))
            future.sort(key=lambda x: x[0])
            next_event = {"time_utc": future[0][0].strftime("%Y-%m-%d %H:%M UTC"), "event": future[0][1]} if future else None

            return [types.TextContent(type="text", text=json.dumps({
                "safe_to_trade": True,
                "reason": f"No high-impact USD news within {hours_ahead}h",
                "next_event": next_event,
            }))]

    elif name == "get_positions":
        try:
            mt5_init()
            positions = mt5.positions_get(symbol=SYMBOL)
            if positions is None or len(positions) == 0:
                return [types.TextContent(type="text", text=json.dumps({"positions": []}))]
            result = []
            for p in positions:
                result.append({
                    "ticket":    p.ticket,
                    "direction": "BUY" if p.type == 0 else "SELL",
                    "volume":    p.volume,
                    "open_price": round(p.price_open, 2),
                    "current":   round(p.price_current, 2),
                    "sl":        round(p.sl, 2),
                    "tp":        round(p.tp, 2),
                    "profit":    round(p.profit, 2),
                    "comment":   p.comment,
                })
            return [types.TextContent(type="text", text=json.dumps({"positions": result}))]
        finally:
            mt5.shutdown()

    elif name == "open_trade":
        try:
            mt5_init()
            tick = mt5.symbol_info_tick(SYMBOL)
            direction = arguments["direction"]
            volume    = float(arguments.get("volume", 0.01))
            sl        = float(arguments["sl"])
            tp        = float(arguments["tp"])
            comment   = arguments.get("comment", "SignalFX")

            order_type = mt5.ORDER_TYPE_BUY if direction == "BUY" else mt5.ORDER_TYPE_SELL
            price = tick.ask if direction == "BUY" else tick.bid

            request = {
                "action":       mt5.TRADE_ACTION_DEAL,
                "symbol":       SYMBOL,
                "volume":       volume,
                "type":         order_type,
                "price":        price,
                "sl":           sl,
                "tp":           tp,
                "deviation":    20,
                "magic":        20260701,
                "comment":      comment,
                "type_time":    mt5.ORDER_TIME_GTC,
                "type_filling": mt5.ORDER_FILLING_IOC,
            }

            result = mt5.order_send(request)
            if result.retcode == 10009:
                return [types.TextContent(type="text", text=json.dumps({
                    "status":  "opened",
                    "ticket":  result.order,
                    "deal":    result.deal,
                    "direction": direction,
                    "price":   round(price, 2),
                    "sl":      sl,
                    "tp":      tp,
                    "volume":  volume,
                }))]
            else:
                return [types.TextContent(type="text", text=json.dumps({
                    "status":  "failed",
                    "retcode": result.retcode,
                    "comment": result.comment,
                }))]
        finally:
            mt5.shutdown()

    elif name == "close_trade":
        try:
            mt5_init()
            ticket = int(arguments["ticket"])
            positions = mt5.positions_get(ticket=ticket)
            if not positions:
                return [types.TextContent(type="text", text=json.dumps({"status": "not found", "ticket": ticket}))]

            pos = positions[0]
            tick = mt5.symbol_info_tick(SYMBOL)
            close_type  = mt5.ORDER_TYPE_SELL if pos.type == 0 else mt5.ORDER_TYPE_BUY
            close_price = tick.bid if pos.type == 0 else tick.ask

            request = {
                "action":       mt5.TRADE_ACTION_DEAL,
                "symbol":       SYMBOL,
                "volume":       pos.volume,
                "type":         close_type,
                "position":     ticket,
                "price":        close_price,
                "deviation":    20,
                "magic":        20260701,
                "comment":      "close",
                "type_time":    mt5.ORDER_TIME_GTC,
                "type_filling": mt5.ORDER_FILLING_IOC,
            }

            result = mt5.order_send(request)
            if result.retcode == 10009:
                return [types.TextContent(type="text", text=json.dumps({
                    "status": "closed",
                    "ticket": ticket,
                    "profit": round(pos.profit, 2),
                }))]
            else:
                return [types.TextContent(type="text", text=json.dumps({
                    "status":  "failed",
                    "retcode": result.retcode,
                    "comment": result.comment,
                }))]
        finally:
            mt5.shutdown()

    elif name == "open_limit_trade":
        try:
            mt5_init()
            direction    = arguments["direction"]
            entry        = float(arguments["entry"])
            volume       = float(arguments.get("volume", 0.01))
            sl           = float(arguments["sl"])
            tp           = float(arguments["tp"])
            expiry_hours = int(arguments.get("expiry_hours", 6))

            order_type  = mt5.ORDER_TYPE_BUY_LIMIT if direction == "BUY" else mt5.ORDER_TYPE_SELL_LIMIT
            expiry_time = datetime.now() + timedelta(hours=expiry_hours)

            request = {
                "action":       mt5.TRADE_ACTION_PENDING,
                "symbol":       SYMBOL,
                "volume":       volume,
                "type":         order_type,
                "price":        entry,
                "sl":           sl,
                "tp":           tp,
                "deviation":    10,
                "magic":        20260701,
                "comment":      "SignalFX-LIMIT",
                "type_time":    mt5.ORDER_TIME_SPECIFIED,
                "expiration":   int(expiry_time.timestamp()),
                "type_filling": mt5.ORDER_FILLING_RETURN,
            }

            result = mt5.order_send(request)
            if result.retcode == 10009:
                return [types.TextContent(type="text", text=json.dumps({
                    "status":    "pending",
                    "ticket":    result.order,
                    "direction": direction,
                    "entry":     entry,
                    "sl":        sl,
                    "tp":        tp,
                    "expires":   expiry_time.strftime("%Y-%m-%d %H:%M UTC"),
                }))]
            else:
                return [types.TextContent(type="text", text=json.dumps({
                    "status":  "failed",
                    "retcode": result.retcode,
                    "comment": result.comment,
                }))]
        finally:
            mt5.shutdown()

    elif name == "get_pending_orders":
        try:
            mt5_init()
            orders = mt5.orders_get(symbol=SYMBOL)
            if orders is None or len(orders) == 0:
                return [types.TextContent(type="text", text=json.dumps({"pending_orders": []}))]
            result = []
            type_map = {
                mt5.ORDER_TYPE_BUY_LIMIT:  "BUY LIMIT",
                mt5.ORDER_TYPE_SELL_LIMIT: "SELL LIMIT",
                mt5.ORDER_TYPE_BUY_STOP:   "BUY STOP",
                mt5.ORDER_TYPE_SELL_STOP:  "SELL STOP",
            }
            for o in orders:
                result.append({
                    "ticket":     o.ticket,
                    "type":       type_map.get(o.type, str(o.type)),
                    "price":      round(o.price_open, 2),
                    "sl":         round(o.sl, 2),
                    "tp":         round(o.tp, 2),
                    "volume":     o.volume_initial,
                    "expires":    datetime.fromtimestamp(o.time_expiration).strftime("%Y-%m-%d %H:%M") if o.time_expiration else "GTC",
                    "comment":    o.comment,
                })
            return [types.TextContent(type="text", text=json.dumps({"pending_orders": result}))]
        finally:
            mt5.shutdown()

    elif name == "cancel_order":
        try:
            mt5_init()
            ticket = int(arguments["ticket"])
            request = {
                "action": mt5.TRADE_ACTION_REMOVE,
                "order":  ticket,
            }
            result = mt5.order_send(request)
            if result.retcode == 10009:
                return [types.TextContent(type="text", text=json.dumps({"status": "cancelled", "ticket": ticket}))]
            else:
                return [types.TextContent(type="text", text=json.dumps({
                    "status":  "failed",
                    "retcode": result.retcode,
                    "comment": result.comment,
                }))]
        finally:
            mt5.shutdown()

    elif name == "publish_signal":
        direction   = arguments["direction"]
        entry       = float(arguments["entry"])
        sl          = float(arguments["sl"])
        tp          = float(arguments["tp"])
        session     = arguments.get("session", "")
        valid_hours = int(arguments.get("valid_hours", 6))
        timeframe   = arguments.get("timeframe", "H4")
        analysis    = arguments.get("analysis", "")

        risk   = abs(entry - sl)
        reward = abs(tp - entry)
        rr     = round(reward / risk, 2) if risk > 0 else 0

        now_utc    = datetime.now(timezone.utc)
        valid_until = (now_utc + timedelta(hours=valid_hours)).strftime("%H:%M UTC")

        full_analysis = (
            f"[LIMIT ORDER — valid {valid_hours}h until {valid_until}]\n"
            f"Session: {session} Killzone | Setup: ICT Liquidity Sweep\n"
            f"{analysis}"
        )

        payload = {
            "pair":        "XAU/USD",
            "direction":   direction,
            "entryPrice":  entry,
            "stopLoss":    sl,
            "takeProfits": [{"level": 1, "price": tp}],
            "timeframe":   timeframe,
            "analysis":    full_analysis,
            "planAccess":  [],
            "publishNow":  True,
        }

        try:
            resp = requests.post(
                f"{API_URL}/api/signals",
                json=payload,
                headers={"x-api-key": API_KEY, "Content-Type": "application/json"},
                timeout=10,
            )
            data = resp.json()
            if data.get("success"):
                return [types.TextContent(type="text", text=json.dumps({
                    "status":    "published",
                    "signal_id": data["data"]["id"],
                    "direction": direction,
                    "entry":     entry,
                    "sl":        sl,
                    "tp":        tp,
                    "rr":        f"1:{rr}",
                    "valid_until": valid_until,
                }))]
            else:
                return [types.TextContent(type="text", text=f"Publish failed: {data.get('error')}")]
        except Exception as e:
            return [types.TextContent(type="text", text=f"Request error: {e}")]

    return [types.TextContent(type="text", text="Unknown tool")]


async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="mt5-signals",
                server_version="1.0.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )


if __name__ == "__main__":
    asyncio.run(main())
