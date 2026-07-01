"""
ICT Sweep Strategy — XAU/USD
Core logic shared between live analysis and backtester.

Concepts:
  - H4 market structure (BOS) for bias
  - PDH/PDL as liquidity levels
  - H1 sweep: candle wicks past level, body closes back
  - Order Block: last opposing candle before the move
  - Killzones: London 07-09 UTC, NY 12-14 UTC
  - SL above/below sweep extreme + $1.50 buffer
  - TP at 1:2 R:R
"""

from datetime import datetime, timezone


# ── HELPERS ──────────────────────────────────────────────

def candle_is_bullish(c):
    return float(c["close"]) > float(c["open"])

def candle_is_bearish(c):
    return float(c["close"]) < float(c["open"])

def in_killzone(dt_utc):
    h = dt_utc.hour
    return (7 <= h < 10) or (12 <= h < 15)

def killzone_name(dt_utc):
    h = dt_utc.hour
    if 7 <= h < 10:  return "London"
    if 12 <= h < 15: return "NY"
    return ""

def to_utc(timestamp):
    return datetime.fromtimestamp(timestamp, tz=timezone.utc)


# ── STEP 1: H4 MARKET STRUCTURE ──────────────────────────

def get_market_structure(h4_candles):
    """
    Returns 'BUY', 'SELL', or 'NEUTRAL' based on H4 swing structure.
    Looks at last 3 swing highs and lows.
    """
    highs, lows = [], []
    for i in range(1, len(h4_candles) - 1):
        if h4_candles[i]["high"] > h4_candles[i-1]["high"] and h4_candles[i]["high"] > h4_candles[i+1]["high"]:
            highs.append(float(h4_candles[i]["high"]))
        if h4_candles[i]["low"] < h4_candles[i-1]["low"] and h4_candles[i]["low"] < h4_candles[i+1]["low"]:
            lows.append(float(h4_candles[i]["low"]))

    if len(highs) < 2 or len(lows) < 2:
        return "NEUTRAL", highs, lows

    # Last two swing highs and lows
    last_hh = highs[-1] < highs[-2]   # lower high = bearish
    last_ll = lows[-1]  < lows[-2]    # lower low  = bearish

    if last_hh and last_ll:
        return "SELL", highs, lows
    if not last_hh and not last_ll:
        return "BUY", highs, lows
    return "NEUTRAL", highs, lows


# ── STEP 2: LIQUIDITY LEVELS ──────────────────────────────

def get_session_levels(h1_candles, reference_ts):
    """
    Get the high/low of the session BEFORE the current killzone.
    - London killzone (07-10): use Asian session (00-06 UTC same day)
    - NY killzone (12-15): use London morning (07-12 UTC same day)

    These are where retail stops cluster — the real ICT liquidity targets.
    Returns (session_high, session_low, session_name)
    """
    ref_dt = to_utc(reference_ts)
    hour   = ref_dt.hour
    ref_date = ref_dt.date()

    if 7 <= hour < 10:
        # London: sweep Asian session range (00:00-06:59 UTC)
        session_candles = [
            c for c in h1_candles
            if to_utc(c["time"]).date() == ref_date and 0 <= to_utc(c["time"]).hour < 7
        ]
        session_name = "Asian"
    elif 12 <= hour < 15:
        # NY: sweep London session range (07:00-11:59 UTC)
        session_candles = [
            c for c in h1_candles
            if to_utc(c["time"]).date() == ref_date and 7 <= to_utc(c["time"]).hour < 12
        ]
        session_name = "London"
    else:
        return None, None, ""

    if not session_candles:
        return None, None, session_name

    s_high = round(max(float(c["high"]) for c in session_candles), 2)
    s_low  = round(min(float(c["low"])  for c in session_candles), 2)
    return s_high, s_low, session_name


def get_pdh_pdl(h1_candles, reference_ts):
    """
    Returns (PDH, PDL) — previous TRADING day's high and low.
    Handles weekend gaps by finding the last day that actually has candles.
    """
    ref_day = to_utc(reference_ts).date()

    days = {}
    for c in h1_candles:
        d = to_utc(c["time"]).date()
        if d >= ref_day:
            continue
        if d not in days:
            days[d] = {"highs": [], "lows": []}
        days[d]["highs"].append(float(c["high"]))
        days[d]["lows"].append(float(c["low"]))

    if not days:
        return None, None

    last_trading_day = max(days.keys())
    return (
        round(max(days[last_trading_day]["highs"]), 2),
        round(min(days[last_trading_day]["lows"]),  2),
    )


def get_equal_levels(h1_candles, lookback=20, tolerance=2.0):
    """
    Find equal highs and equal lows (within $tolerance).
    Returns list of (price, 'high'/'low') tuples.
    """
    recent = h1_candles[-lookback:]
    swing_highs, swing_lows = [], []

    for i in range(1, len(recent) - 1):
        if recent[i]["high"] > recent[i-1]["high"] and recent[i]["high"] > recent[i+1]["high"]:
            swing_highs.append(float(recent[i]["high"]))
        if recent[i]["low"] < recent[i-1]["low"] and recent[i]["low"] < recent[i+1]["low"]:
            swing_lows.append(float(recent[i]["low"]))

    equal_highs, equal_lows = [], []
    for i in range(len(swing_highs)):
        for j in range(i+1, len(swing_highs)):
            if abs(swing_highs[i] - swing_highs[j]) <= tolerance:
                level = round((swing_highs[i] + swing_highs[j]) / 2, 2)
                if level not in equal_highs:
                    equal_highs.append(level)

    for i in range(len(swing_lows)):
        for j in range(i+1, len(swing_lows)):
            if abs(swing_lows[i] - swing_lows[j]) <= tolerance:
                level = round((swing_lows[i] + swing_lows[j]) / 2, 2)
                if level not in equal_lows:
                    equal_lows.append(level)

    return equal_highs, equal_lows


# ── STEP 3: SWEEP DETECTION ───────────────────────────────

def detect_sweep(candle, session_high, session_low, bias):
    """
    Check if this H1 candle swept a session liquidity level.

    SELL sweep: wick above session_high, close back below session_high
    BUY  sweep: wick below session_low,  close back above session_low

    The wick must be meaningful (>= $1.00) to filter noise.
    Returns dict with sweep info or None.
    """
    high  = float(candle["high"])
    low   = float(candle["low"])
    close = float(candle["close"])

    if bias == "SELL" and session_high:
        wick = round(high - session_high, 2)
        if high > session_high and close < session_high and wick >= 1.0:
            return {
                "type":          "SELL",
                "swept_level":   session_high,
                "sweep_high":    round(high, 2),
                "wick_size":     wick,
                "close":         round(close, 2),
            }

    if bias == "BUY" and session_low:
        wick = round(session_low - low, 2)
        if low < session_low and close > session_low and wick >= 1.0:
            return {
                "type":         "BUY",
                "swept_level":  session_low,
                "sweep_low":    round(low, 2),
                "wick_size":    wick,
                "close":        round(close, 2),
            }

    return None


# ── STEP 4: ORDER BLOCK ───────────────────────────────────

def find_order_block(h1_candles, sweep_index, bias, lookback=6):
    """
    Find the Order Block — last opposing candle before the sweep.

    For SELL sweep: last BULLISH H1 candle before the sweep candle
    For BUY  sweep: last BEARISH H1 candle before the sweep candle

    Returns dict with OB high/low or None.
    """
    start = max(0, sweep_index - lookback)
    search = h1_candles[start:sweep_index]

    if bias == "SELL":
        for c in reversed(search):
            if candle_is_bullish(c):
                return {
                    "high": round(float(c["high"]), 2),
                    "low":  round(float(c["low"]),  2),
                    "open": round(float(c["open"]), 2),
                    "close":round(float(c["close"]),2),
                    "time": to_utc(c["time"]).strftime("%Y-%m-%d %H:%M UTC"),
                }

    if bias == "BUY":
        for c in reversed(search):
            if candle_is_bearish(c):
                return {
                    "high": round(float(c["high"]), 2),
                    "low":  round(float(c["low"]),  2),
                    "open": round(float(c["open"]), 2),
                    "close":round(float(c["close"]),2),
                    "time": to_utc(c["time"]).strftime("%Y-%m-%d %H:%M UTC"),
                }

    return None


# ── STEP 5: TRADE PARAMETERS ─────────────────────────────

def calculate_trade(sweep, bias, entry_price=None):
    """
    Calculate SL and TP for a LIMIT order entry.
    entry_price: if None, uses the swept level itself (session high/low) as the limit price.
    SL: beyond the sweep extreme + $1.50 buffer.
    TP: 1:2 R:R from the limit entry.
    """
    if bias == "SELL":
        limit = entry_price if entry_price is not None else sweep["swept_level"]
        sl    = round(sweep["sweep_high"] + 1.50, 2)
        risk  = round(sl - limit, 2)
        tp    = round(limit - (risk * 2), 2)
    else:
        limit = entry_price if entry_price is not None else sweep["swept_level"]
        sl    = round(sweep["sweep_low"] - 1.50, 2)
        risk  = round(limit - sl, 2)
        tp    = round(limit + (risk * 2), 2)

    return {
        "entry":  limit,
        "sl":     sl,
        "tp":     tp,
        "risk":   risk,
        "reward": round(risk * 2, 2),
    }


# ── FULL SIGNAL CHECK ─────────────────────────────────────

def run_ict_analysis(h4_candles, h1_candles, current_index=None):
    """
    Run full ICT analysis on a set of candles.
    current_index: index in h1_candles to analyze (default = last candle).

    Returns dict with full analysis result.
    """
    if current_index is None:
        current_index = len(h1_candles) - 1

    current = h1_candles[current_index]
    current_dt = to_utc(current["time"])

    result = {
        "time":      current_dt.strftime("%Y-%m-%d %H:%M UTC"),
        "signal":    None,
        "bias":      None,
        "pdh":       None,
        "pdl":       None,
        "sweep":     None,
        "ob":        None,
        "trade":     None,
        "reason":    [],
    }

    # 1. Killzone check
    if not in_killzone(current_dt):
        result["reason"].append("Outside killzone (need London 07-09 or NY 12-14 UTC)")
        return result

    # 2. Market structure
    bias, _, _ = get_market_structure(h4_candles)
    result["bias"] = bias
    if bias == "NEUTRAL":
        result["reason"].append("H4 structure is neutral - no clear bias")
        return result

    # 3. Liquidity levels
    pdh, pdl = get_pdh_pdl(h1_candles, current["time"])
    result["pdh"] = pdh
    result["pdl"] = pdl
    if pdh is None or pdl is None:
        result["reason"].append("Could not determine PDH/PDL")
        return result

    # 4. Sweep detection
    sweep = detect_sweep(current, pdh, pdl, bias)
    result["sweep"] = sweep
    if not sweep:
        result["reason"].append(
            "No sweep — waiting for price to wick above PDH " + str(pdh) + " (SELL)"
            if bias == "SELL" else
            "No sweep — waiting for price to wick below PDL " + str(pdl) + " (BUY)"
        )
        return result

    # 5. Order Block
    ob = find_order_block(h1_candles, current_index, bias)
    result["ob"] = ob
    if not ob:
        result["reason"].append("Sweep found but no Order Block identified")
        return result

    # 6. Trade parameters
    entry_price = round(float(h1_candles[min(current_index + 1, len(h1_candles)-1)]["open"]), 2)
    trade = calculate_trade(sweep, bias, entry_price)
    result["trade"] = trade
    result["signal"] = bias
    result["reason"].append("ICT sweep confirmed with Order Block")

    return result
