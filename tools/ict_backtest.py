"""
ICT Sweep Backtest — XAU/USD (Limit Order Edition)
Simulates publishing a LIMIT order at the swept session level after each ICT sweep.

Signal format:
  BUY/SELL LIMIT at session_high/low (retest entry)
  SL: beyond sweep extreme + $1.50
  TP: 1:2 R:R from limit entry
  Valid: 6 hours — if not filled, EXPIRED (no loss)

Usage:
  python tools/ict_backtest.py
"""

import MetaTrader5 as mt5
from datetime import datetime
from tools.ict_strategy import (
    get_market_structure,
    get_session_levels,
    detect_sweep,
    find_order_block,
    calculate_trade,
    in_killzone,
    killzone_name,
    to_utc,
)

# ── CONFIG ────────────────────────────────────────────────
H1_COUNT       = 9999
H4_COUNT       = 9999
LIMIT_EXPIRY_H = 6     # hours before unset limit order expires
TIMEOUT_H      = 12    # hours to wait for SL/TP after limit fills
# ─────────────────────────────────────────────────────────


def load_data():
    if not mt5.initialize():
        raise RuntimeError("MT5 init failed: " + str(mt5.last_error()))
    h1 = mt5.copy_rates_from_pos("XAUUSD", mt5.TIMEFRAME_H1, 0, H1_COUNT)
    h4 = mt5.copy_rates_from_pos("XAUUSD", mt5.TIMEFRAME_H4, 0, H4_COUNT)
    mt5.shutdown()
    return list(h1), list(h4)


def get_h4_at_time(h4_candles, ts):
    return [c for c in h4_candles if c["time"] <= ts]


def simulate_limit_outcome(h1_candles, sweep_idx, direction, limit_price, sl, tp):
    """
    Phase 1: Scan forward up to LIMIT_EXPIRY_H candles for limit fill.
             BUY LIMIT fills when low <= limit_price.
             SELL LIMIT fills when high >= limit_price.
    Phase 2: From fill candle, scan up to TIMEOUT_H candles for SL or TP hit.
    Returns (outcome, exit_price, exit_time, total_candles_held)
    """
    fill_idx = None
    for offset in range(1, LIMIT_EXPIRY_H + 1):
        idx = sweep_idx + offset
        if idx >= len(h1_candles):
            break
        c = h1_candles[idx]
        if direction == "BUY"  and float(c["low"])  <= limit_price:
            fill_idx = idx
            break
        if direction == "SELL" and float(c["high"]) >= limit_price:
            fill_idx = idx
            break

    if fill_idx is None:
        exp = h1_candles[min(sweep_idx + LIMIT_EXPIRY_H, len(h1_candles) - 1)]
        return "EXPIRED", limit_price, to_utc(exp["time"]).strftime("%Y-%m-%d %H:%M"), LIMIT_EXPIRY_H

    for offset in range(0, TIMEOUT_H + 1):
        idx = fill_idx + offset
        if idx >= len(h1_candles):
            break
        c  = h1_candles[idx]
        hi = float(c["high"])
        lo = float(c["low"])
        ts = to_utc(c["time"]).strftime("%Y-%m-%d %H:%M")
        held = fill_idx - sweep_idx + offset

        if direction == "SELL":
            if hi >= sl: return "LOSS", round(sl, 2), ts, held
            if lo <= tp: return "WIN",  round(tp, 2), ts, held
        else:
            if lo <= sl: return "LOSS", round(sl, 2), ts, held
            if hi >= tp: return "WIN",  round(tp, 2), ts, held

    last = h1_candles[min(fill_idx + TIMEOUT_H, len(h1_candles) - 1)]
    return "TIMEOUT", round(float(last["close"]), 2), to_utc(last["time"]).strftime("%Y-%m-%d %H:%M"), TIMEOUT_H


def compute_stats(trades):
    if not trades:
        return {}

    expired  = [t for t in trades if t["outcome"] == "EXPIRED"]
    active   = [t for t in trades if t["outcome"] != "EXPIRED"]
    decided  = [t for t in active  if t["outcome"] != "TIMEOUT"]
    wins     = [t for t in decided if t["outcome"] == "WIN"]
    losses   = [t for t in decided if t["outcome"] == "LOSS"]
    timeouts = [t for t in active  if t["outcome"] == "TIMEOUT"]

    fill_rate = round(len(active) / len(trades) * 100, 1) if trades else 0
    win_rate  = round(len(wins) / len(decided) * 100, 1) if decided else 0
    gross_win  = sum(t["pnl_r"] for t in wins)
    gross_loss = abs(sum(t["pnl_r"] for t in losses))
    pf         = round(gross_win / gross_loss, 2) if gross_loss else float("inf")
    total_r    = round(sum(t["pnl_r"] for t in trades), 2)

    curve, peak, dd = 0.0, 0.0, 0.0
    for t in active:
        curve += t["pnl_r"]
        if curve > peak:
            peak = curve
        if peak - curve > dd:
            dd = peak - curve

    def kz_stats(kz):
        kzt = [t for t in active if t["killzone"] == kz]
        kzd = [t for t in kzt   if t["outcome"] != "TIMEOUT"]
        kzw = [t for t in kzd   if t["outcome"] == "WIN"]
        return {
            "trades":   len(kzt),
            "win_rate": round(len(kzw) / len(kzd) * 100, 1) if kzd else 0,
            "net_r":    round(sum(t["pnl_r"] for t in kzt), 2),
        }

    def bias_stats(bias):
        bt = [t for t in active if t["bias"] == bias]
        bd = [t for t in bt     if t["outcome"] != "TIMEOUT"]
        bw = [t for t in bd     if t["outcome"] == "WIN"]
        return {
            "trades":   len(bt),
            "win_rate": round(len(bw) / len(bd) * 100, 1) if bd else 0,
            "net_r":    round(sum(t["pnl_r"] for t in bt), 2),
        }

    return {
        "total":          len(trades),
        "expired":        len(expired),
        "filled":         len(active),
        "fill_rate":      fill_rate,
        "wins":           len(wins),
        "losses":         len(losses),
        "timeouts":       len(timeouts),
        "win_rate":       win_rate,
        "profit_factor":  pf,
        "total_r":        total_r,
        "max_drawdown":   round(dd, 2),
        "london":         kz_stats("London"),
        "ny":             kz_stats("NY"),
        "buy":            bias_stats("BUY"),
        "sell":           bias_stats("SELL"),
    }


def run_backtest(h1_candles, h4_candles, verbose=True):
    trades     = []
    skip_until = 0

    for i in range(100, len(h1_candles) - 1):
        if i < skip_until:
            continue

        c    = h1_candles[i]
        c_dt = to_utc(c["time"])

        # 1. Killzone
        if not in_killzone(c_dt):
            continue
        kz = killzone_name(c_dt)

        # 2. H4 bias (no lookahead)
        h4_window = get_h4_at_time(h4_candles, c["time"])
        if len(h4_window) < 10:
            continue
        bias, _, _ = get_market_structure(h4_window[-40:])
        if bias == "NEUTRAL":
            continue

        # 3. Session levels
        s_high, s_low, _ = get_session_levels(h1_candles[:i+1], c["time"])
        if s_high is None or s_low is None:
            continue

        # 4. Sweep detection (wick >= $2.00)
        sweep = detect_sweep(c, s_high, s_low, bias)
        if not sweep:
            continue

        # 5. Order Block — MANDATORY, skip if not found
        ob = find_order_block(h1_candles, i, bias, lookback=5)
        if ob is None:
            continue

        # 6. Limit entry at the swept session level (retrace entry)
        trade_params = calculate_trade(sweep, bias)
        limit = trade_params["entry"]  # = swept session level
        sl    = trade_params["sl"]
        tp    = trade_params["tp"]
        risk  = trade_params["risk"]

        if risk <= 0:
            continue

        # 7. Simulate limit order
        outcome, exit_price, exit_time, held = simulate_limit_outcome(
            h1_candles, i, bias, limit, sl, tp
        )

        pnl_r = 2.0 if outcome == "WIN" else (-1.0 if outcome == "LOSS" else 0.0)

        trade = {
            "entry_time":  c_dt.strftime("%Y-%m-%d %H:%M"),
            "direction":   bias,
            "limit":       limit,
            "sl":          sl,
            "tp":          tp,
            "risk":        risk,
            "exit_time":   exit_time,
            "exit_price":  exit_price,
            "outcome":     outcome,
            "pnl_r":       pnl_r,
            "killzone":    kz,
            "bias":        bias,
            "wick_size":   sweep.get("wick_size", 0),
        }
        trades.append(trade)

        if verbose:
            tag = "WIN  +2R" if outcome == "WIN" else ("LOSS -1R" if outcome == "LOSS" else ("EXPRD    " if outcome == "EXPIRED" else "TIME  0R"))
            print("  #" + str(len(trades)).ljust(3) + " " + trade["entry_time"] +
                  "  " + bias.ljust(4) +
                  "  Limit:" + str(limit) + "  SL:" + str(sl) + "  TP:" + str(tp) +
                  "  [" + kz + "]  -> " + tag)

        # Only skip forward on filled trades (EXPIRED = try again next signal)
        if outcome != "EXPIRED":
            skip_until = i + 1 + held

    return trades


def print_stats(stats, trades):
    period_start = trades[0]["entry_time"][:10] if trades else "-"
    period_end   = trades[-1]["entry_time"][:10] if trades else "-"

    print("\n" + "=" * 62)
    print("  BACKTEST RESULTS — XAU/USD ICT SWEEP (LIMIT ORDER)")
    print("  Period  : " + period_start + " to " + period_end)
    print("  Entry   : LIMIT at swept session level | Wick >= $2.00")
    print("  OB      : Mandatory | Expiry: " + str(LIMIT_EXPIRY_H) + "h | Timeout: " + str(TIMEOUT_H) + "h")
    print("=" * 62)
    print("  Signals published  : " + str(stats["total"]))
    print("  Limit filled       : " + str(stats["filled"]) + "  (" + str(stats["fill_rate"]) + "% fill rate)")
    print("  Expired (no fill)  : " + str(stats["expired"]))
    print()
    print("  -- On filled trades --")
    print("  Wins               : " + str(stats["wins"]))
    print("  Losses             : " + str(stats["losses"]))
    print("  Timeouts           : " + str(stats["timeouts"]))
    print("  Win rate           : " + str(stats["win_rate"]) + "%  (wins/decided)")
    print("  Profit factor      : " + str(stats["profit_factor"]))
    net = stats["total_r"]
    print("  Net R              : " + ("+" if net >= 0 else "") + str(net) + "R")
    print("  Max drawdown       : -" + str(stats["max_drawdown"]) + "R")
    print()
    print("  BY KILLZONE (filled only):")
    l = stats["london"]
    n = stats["ny"]
    print("    London  : " + str(l["trades"]) + " filled | " + str(l["win_rate"]) + "% WR | " + str(l["net_r"]) + "R")
    print("    NY Open : " + str(n["trades"]) + " filled | " + str(n["win_rate"]) + "% WR | " + str(n["net_r"]) + "R")
    print()
    print("  BY DIRECTION (filled only):")
    b = stats["buy"]
    s = stats["sell"]
    print("    BUY  : " + str(b["trades"]) + " filled | " + str(b["win_rate"]) + "% WR | " + str(b["net_r"]) + "R")
    print("    SELL : " + str(s["trades"]) + " filled | " + str(s["win_rate"]) + "% WR | " + str(s["net_r"]) + "R")
    print("=" * 62)


if __name__ == "__main__":
    print("Loading MT5 historical data...")
    h1, h4 = load_data()
    print("H1 candles: " + str(len(h1)) + "  (" +
          datetime.fromtimestamp(h1[0]["time"]).strftime("%Y-%m-%d") + " to " +
          datetime.fromtimestamp(h1[-1]["time"]).strftime("%Y-%m-%d") + ")")
    print("H4 candles: " + str(len(h4)))
    print()
    print("=" * 62)
    print("  TRADE LOG")
    print("=" * 62)

    trades = run_backtest(h1, h4, verbose=True)

    if not trades:
        print("  No signals found in this period.")
    else:
        stats = compute_stats(trades)
        print_stats(stats, trades)
