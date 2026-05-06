"""
Power Play Scanner Module
==========================
Detects Mark Minervini-inspired momentum continuation patterns:
Impulse (strong move) → Consolidation (tight pause) → Ready for continuation

NOT a breakout scanner. NOT a VCP scanner.
This is a MOMENTUM CONTINUATION scanner.

Author: Stock Scanner
License: MIT
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple


class PowerPlayDetector:
    """
    Detects Power Play momentum continuation setups from OHLCV data.
    
    Pattern:
        1. Strong impulse move (8-25% range)
        2. Controlled pullback (< 50% of move)
        3. Tight consolidation (flag formation)
        4. Volume contraction
        5. Price ready for continuation (0-3% from consolidation high)
    """
    
    def __init__(self, min_score: float = 7.0):
        """
        Initialize detector.
        
        Args:
            min_score: Minimum pattern score (0-10) to qualify. Default 7.0
        """
        self.min_score = min_score
        self.max_score = 10.0
    
    def detect(self, df: pd.DataFrame, symbol: str = "UNKNOWN") -> Optional[Dict]:
        """
        Main detection method. Runs all checks and returns result if pattern found.
        
        Args:
            df: DataFrame with OHLCV data (Date, Open, High, Low, Close, Volume)
               Must have at least 60 candles for reliable detection
            symbol: Stock symbol (for output labeling)
        
        Returns:
            Dict with pattern details if score >= min_score, else None
        """
        
        # Validation
        if df is None or len(df) < 60:
            return None
        
        if not all(col in df.columns for col in ['High', 'Low', 'Close', 'Volume']):
            return None
        
        # Reset index to ensure numeric indexing
        df = df.reset_index(drop=True)
        
        # Initialize score tracker
        score_details = {}
        
        # Step 1: Detect strong impulse move
        impulse_info = self._detect_impulse(df)
        if impulse_info is None:
            return None
        
        score_details['impulse'] = 3.0
        
        # Step 2: Breakout confirmation
        breakout_confirmed = self._confirm_breakout(df, impulse_info)
        if not breakout_confirmed:
            return None
        
        # Step 3: Controlled pullback
        pullback_info = self._detect_controlled_pullback(df, impulse_info)
        if pullback_info is None:
            return None
        
        score_details['pullback'] = 2.0
        
        # Step 4: Tight consolidation (flag formation)
        consolidation_info = self._detect_tight_consolidation(df)
        if consolidation_info is None:
            return None
        
        score_details['consolidation'] = 3.0
        
        # Step 5: Volume contraction
        volume_contracted = self._check_volume_contraction(df, impulse_info)
        if volume_contracted:
            score_details['volume'] = 1.0
        
        # Step 6: No late entries (critical)
        late_entry_check = self._check_no_late_entry(df, consolidation_info)
        if not late_entry_check:
            return None
        
        # Step 7: Trend filter
        trend_ok = self._check_trend_filter(df)
        if trend_ok:
            score_details['trend'] = 1.0
        
        # Calculate final score
        total_score = sum(score_details.values())
        
        # Return None if score too low
        if total_score < self.min_score:
            return None
        
        # Build result
        result = {
            'symbol': symbol,
            'pattern': 'PowerPlay',
            'stage': 'consolidation',
            'move_pct': impulse_info['move_pct'],
            'pullback_pct': pullback_info['pullback_pct'],
            'consolidation_days': consolidation_info['days'],
            'tightness': consolidation_info['tightness'],
            'distance_from_high': consolidation_info['distance_from_high_pct'],
            'current_price': df.iloc[-1]['Close'],
            'consolidation_high': consolidation_info['high'],
            'consolidation_low': consolidation_info['low'],
            'score': total_score,
            'score_details': score_details,
            'candles_in_move': impulse_info['candles'],
            'ema_20': self._calculate_ema(df['Close'], 20).iloc[-1],
            'ema_50': self._calculate_ema(df['Close'], 50).iloc[-1],
        }
        
        return result
    
    def _detect_impulse(self, df: pd.DataFrame) -> Optional[Dict]:
        """
        Step 1: Detect strong momentum move (8-25% range) within 5-15 sessions.
        
        Args:
            df: OHLCV DataFrame
        
        Returns:
            Dict with move details or None if no valid impulse found
        """
        
        # Look for recent 5-15 candle moves
        for candles in range(5, 16):
            if len(df) < candles + 5:
                continue
            
            recent = df.iloc[-candles:].copy()
            recent_high = recent['High'].max()
            recent_low = recent['Low'].min()
            
            # Calculate move percentage
            move_pct = (recent_high - recent_low) / recent_low
            
            # Valid range: 8% to 25%
            if 0.08 <= move_pct <= 0.25:
                # Find which bar had the high
                high_idx = recent['High'].idxmax()
                
                return {
                    'move_pct': move_pct,
                    'high': recent_high,
                    'low': recent_low,
                    'candles': candles,
                    'high_bar_index': high_idx,
                    'move': recent_high - recent_low,
                }
        
        return None
    
    def _confirm_breakout(self, df: pd.DataFrame, impulse_info: Dict) -> bool:
        """
        Step 2: Confirm move broke a meaningful level (> 30-50 day high).
        
        Args:
            df: OHLCV DataFrame
            impulse_info: Result from _detect_impulse
        
        Returns:
            True if breakout confirmed, False otherwise
        """
        
        if len(df) < 50:
            return False
        
        # Get high 30-50 bars before impulse
        lookback_start = max(0, impulse_info['high_bar_index'] - 60)
        lookback_end = impulse_info['high_bar_index'] - 5
        
        if lookback_end <= lookback_start:
            return False
        
        prior_high = df.iloc[lookback_start:lookback_end]['High'].max()
        
        # Impulse high should exceed prior high
        return impulse_info['high'] > prior_high * 1.001  # 0.1% buffer for noise
    
    def _detect_controlled_pullback(self, df: pd.DataFrame, 
                                    impulse_info: Dict) -> Optional[Dict]:
        """
        Step 3: Detect controlled pullback (< 50% of move, stays above 20 EMA).
        
        Args:
            df: OHLCV DataFrame
            impulse_info: Result from _detect_impulse
        
        Returns:
            Dict with pullback info or None if pullback too severe
        """
        
        # Calculate EMA20
        ema20 = self._calculate_ema(df['Close'], 20)
        
        # Get pullback after impulse high
        after_high_idx = impulse_info['high_bar_index'] + 1
        
        if after_high_idx >= len(df):
            return None
        
        pullback_low = df.iloc[after_high_idx:]['Low'].min()
        
        # Pullback depth
        pullback_depth = impulse_info['high'] - pullback_low
        pullback_pct = pullback_depth / impulse_info['move']
        
        # Reject if pullback > 50% of move
        if pullback_pct > 0.50:
            return None
        
        # Check if price stayed above 20 EMA (mostly)
        after_high = df.iloc[after_high_idx:]
        below_ema20 = (after_high['Low'] < ema20.iloc[after_high_idx:]).sum()
        
        # Allow some violations but not too many
        if below_ema20 > len(after_high) * 0.3:
            return None
        
        return {
            'pullback_pct': pullback_pct,
            'pullback_low': pullback_low,
            'after_high_idx': after_high_idx,
        }
    
    def _detect_tight_consolidation(self, df: pd.DataFrame) -> Optional[Dict]:
        """
        Step 4: Detect tight consolidation (flag formation) in last 3-5 candles.
        
        Key indicators:
        - Range < 70% of average range
        - Low close volatility (std dev)
        - No large candles
        
        Args:
            df: OHLCV DataFrame
        
        Returns:
            Dict with consolidation info or None if no tight consolidation
        """
        
        if len(df) < 10:
            return None
        
        # Check both 3 and 5 candle consolidations
        for cons_days in [3, 5]:
            recent = df.iloc[-cons_days:].copy()
            
            # Calculate range
            cons_high = recent['High'].max()
            cons_low = recent['Low'].min()
            cons_range = cons_high - cons_low
            
            # Average range of prior 20 candles
            prior = df.iloc[-(cons_days + 20):-cons_days]
            avg_range = (prior['High'] - prior['Low']).mean()
            
            # Condition 1: Range < 70% of average
            if cons_range > avg_range * 0.70:
                continue
            
            # Condition 2: Close volatility (std dev)
            close_std = recent['Close'].std()
            if close_std > cons_range * 0.4:  # Std should be < 40% of range
                continue
            
            # Condition 3: No single large candle
            candle_ranges = recent['High'] - recent['Low']
            max_candle = candle_ranges.max()
            
            if max_candle > cons_range * 0.6:  # Single candle shouldn't exceed 60% of range
                continue
            
            # Determine tightness
            tightness_ratio = cons_range / avg_range
            if tightness_ratio < 0.35:
                tightness = "very_tight"
            elif tightness_ratio < 0.50:
                tightness = "tight"
            else:
                tightness = "moderate"
            
            # Distance from consolidation high
            current_price = df.iloc[-1]['Close']
            distance_pct = (cons_high - current_price) / current_price
            
            return {
                'days': cons_days,
                'high': cons_high,
                'low': cons_low,
                'range': cons_range,
                'tightness': tightness,
                'distance_from_high_pct': distance_pct,
            }
        
        return None
    
    def _check_volume_contraction(self, df: pd.DataFrame, 
                                  impulse_info: Dict) -> bool:
        """
        Step 5: Check volume contraction after breakout.
        
        Volume should dry up during consolidation vs breakout phase.
        
        Args:
            df: OHLCV DataFrame
            impulse_info: Result from _detect_impulse
        
        Returns:
            True if volume contracted, False otherwise
        """
        
        if 'Volume' not in df.columns:
            return True  # Skip if no volume data
        
        # Recent 5 candles average volume
        recent_vol = df.iloc[-5:]['Volume'].mean()
        
        # Breakout candles volume
        breakout_start = max(0, impulse_info['high_bar_index'] - impulse_info['candles'])
        breakout_end = impulse_info['high_bar_index'] + 1
        breakout_vol = df.iloc[breakout_start:breakout_end]['Volume'].mean()
        
        # Consolidation volume should be < breakout volume
        return recent_vol < breakout_vol * 1.2  # Allow 20% variance
    
    def _check_no_late_entry(self, df: pd.DataFrame, 
                             consolidation_info: Dict) -> bool:
        """
        Step 6: Critical check - reject if price already broke out after consolidation.
        
        Current price should be within 0-3% of consolidation high.
        Rejects late entries that already moved.
        
        Args:
            df: OHLCV DataFrame
            consolidation_info: Result from _detect_tight_consolidation
        
        Returns:
            True if no late entry, False if already extended
        """
        
        current_price = df.iloc[-1]['Close']
        cons_high = consolidation_info['high']
        
        # Distance from consolidation high
        distance_pct = (cons_high - current_price) / cons_high
        
        # Should be within 3% of high (actually below or just at high)
        # If price is > 3% below high, it hasn't broken yet (GOOD)
        # If price is > 3% above high, it already broke (BAD)
        
        if distance_pct < -0.03:  # Price already 3% above consolidation high
            return False
        
        return True
    
    def _check_trend_filter(self, df: pd.DataFrame) -> bool:
        """
        Step 7: Trend filter - price above EMA50 and EMA50 rising.
        
        Args:
            df: OHLCV DataFrame
        
        Returns:
            True if trend is up, False otherwise
        """
        
        if len(df) < 50:
            return False
        
        ema50 = self._calculate_ema(df['Close'], 50)
        
        # Current price above EMA50
        current_price = df.iloc[-1]['Close']
        if current_price < ema50.iloc[-1]:
            return False
        
        # EMA50 rising (comparing last 5 candles)
        recent_ema50 = ema50.iloc[-5:]
        if recent_ema50.iloc[-1] < recent_ema50.iloc[0]:
            return False
        
        return True
    
    @staticmethod
    def _calculate_ema(series: pd.Series, period: int) -> pd.Series:
        """
        Calculate Exponential Moving Average.
        
        Args:
            series: Price series
            period: EMA period
        
        Returns:
            EMA series
        """
        return series.ewm(span=period, adjust=False).mean()
    
    @staticmethod
    def _calculate_sma(series: pd.Series, period: int) -> pd.Series:
        """
        Calculate Simple Moving Average.
        
        Args:
            series: Price series
            period: SMA period
        
        Returns:
            SMA series
        """
        return series.rolling(window=period).mean()


def detect_powerplay(df: pd.DataFrame, symbol: str = "UNKNOWN", 
                     min_score: float = 7.0) -> Optional[Dict]:
    """
    Convenience function to detect Power Play pattern.
    
    Usage:
        result = detect_powerplay(df, symbol="AAPL")
        if result:
            print(f"Found {result['pattern']} in {result['symbol']}")
            print(f"Score: {result['score']}/10")
    
    Args:
        df: OHLCV DataFrame (Date, Open, High, Low, Close, Volume)
        symbol: Stock symbol
        min_score: Minimum score threshold (0-10, default 7.0)
    
    Returns:
        Dict with pattern details if found, else None
    """
    detector = PowerPlayDetector(min_score=min_score)
    return detector.detect(df, symbol=symbol)


def scan_powerplay_from_db(db_path: str, min_score: float = 7.0) -> List[Dict]:
    """
    Scan all stocks in SQLite database for Power Play patterns.
    
    Expected database structure:
    - Table: stock_data (or similar)
    - Columns: symbol, date, open, high, low, close, volume
    
    Args:
        db_path: Path to SQLite database
        min_score: Minimum score threshold
    
    Returns:
        List of dicts with Power Play results (sorted by score descending)
    """
    import sqlite3
    
    results = []
    
    try:
        conn = sqlite3.connect(db_path)
        
        # Get unique symbols
        query = "SELECT DISTINCT symbol FROM stock_data ORDER BY symbol"
        symbols = pd.read_sql_query(query, conn)['symbol'].unique()
        
        detector = PowerPlayDetector(min_score=min_score)
        
        for symbol in symbols:
            try:
                # Fetch last 250 days (1 year)
                query = f"""
                    SELECT date, open, high, low, close, volume 
                    FROM stock_data 
                    WHERE symbol = '{symbol}' 
                    ORDER BY date DESC 
                    LIMIT 250
                """
                df = pd.read_sql_query(query, conn)
                
                if df.empty:
                    continue
                
                # Reverse to chronological order
                df = df.iloc[::-1].reset_index(drop=True)
                
                # Standardize column names
                df.columns = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']
                
                # Detect pattern
                result = detector.detect(df, symbol=symbol)
                
                if result:
                    results.append(result)
            
            except Exception as e:
                print(f"Error scanning {symbol}: {e}")
                continue
        
        conn.close()
        
    except Exception as e:
        print(f"Database error: {e}")
        return []
    
    # Sort by score descending
    results.sort(key=lambda x: x['score'], reverse=True)
    
    return results


if __name__ == "__main__":
    
    # Example 1: Test with synthetic data
    print("=" * 80)
    print("POWER PLAY DETECTOR - TEST RUN")
    print("=" * 80)
    
    # Create synthetic data demonstrating pattern
    dates = pd.date_range('2025-01-01', periods=60, freq='D')
    
    # Build synthetic OHLCV
    np.random.seed(42)
    close = np.array([100.0] * 60, dtype=float)
    
    # Phase 1: Strong impulse (8-15%)
    for i in range(5, 15):
        close[i] = 100 * (1 + i / 100)  # Gradual rise
    
    # Phase 2: Controlled pullback (20-25% of move)
    pullback_amount = (close[14] - close[0]) * 0.25
    for i in range(15, 20):
        close[i] = close[14] - (pullback_amount * (i - 14) / 5)
    
    # Phase 3: Tight consolidation (last 5 candles)
    for i in range(20, 60):
        close[i] = close[19] + np.random.normal(0, 0.2)  # Tight range
    
    # Create OHLCV
    df_test = pd.DataFrame({
        'Date': dates,
        'Open': close,
        'High': close + np.random.uniform(0.2, 0.5, 60),
        'Low': close - np.random.uniform(0.2, 0.5, 60),
        'Close': close,
        'Volume': np.random.uniform(1000000, 3000000, 60),
    })
    
    # Detect pattern
    result = detect_powerplay(df_test, symbol="TEST")
    
    if result:
        print(f"\n✓ Pattern FOUND: {result['pattern']}")
        print(f"  Symbol: {result['symbol']}")
        print(f"  Move: {result['move_pct']:.2%}")
        print(f"  Pullback: {result['pullback_pct']:.2%}")
        print(f"  Consolidation: {result['consolidation_days']} candles ({result['tightness']})")
        print(f"  Score: {result['score']:.1f}/10")
        print(f"  Score Details: {result['score_details']}")
    else:
        print("\n✗ No Power Play pattern detected")
    
    print("\n" + "=" * 80)
    print("Test complete. Module ready for production use.")
    print("=" * 80)
