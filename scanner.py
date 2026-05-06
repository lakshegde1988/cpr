"""
Power Play Scanner - Production Implementation
===============================================

Complete working example showing how to:
1. Load OHLCV data from SQLite
2. Scan multiple stocks for Power Play patterns
3. Export results to CSV/JSON
4. Display rankings

Usage:
    python scanner.py --db stocks.db --output results.csv
    python scanner.py --db stocks.db --symbol AAPL  # Single stock
"""

import pandas as pd
import numpy as np
import sqlite3
import json
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime
import argparse
from powerplay import detect_powerplay, PowerPlayDetector


class PowerPlayScanner:
    """
    Production-ready scanner for Power Play patterns.
    
    Features:
    - Load from SQLite database
    - Scan single or multiple stocks
    - Export results to CSV/JSON
    - Detailed logging and progress tracking
    """
    
    def __init__(self, db_path: str, min_score: float = 7.0, verbose: bool = True):
        """
        Initialize scanner.
        
        Args:
            db_path: Path to SQLite database
            min_score: Minimum score threshold (0-10)
            verbose: Print progress messages
        """
        self.db_path = db_path
        self.min_score = min_score
        self.verbose = verbose
        self.detector = PowerPlayDetector(min_score=min_score)
        self.results = []
    
    def scan_all(self) -> List[Dict]:
        """
        Scan all stocks in database for Power Play patterns.
        
        Returns:
            List of dicts with pattern results, sorted by score descending
        """
        self.results = []
        
        try:
            conn = sqlite3.connect(self.db_path)
            
            # Get unique symbols
            query = "SELECT DISTINCT symbol FROM stock_data ORDER BY symbol"
            symbols_df = pd.read_sql_query(query, conn)
            
            if symbols_df.empty:
                print("❌ No data found in database. Check table name: 'stock_data'")
                return []
            
            symbols = symbols_df['symbol'].unique()
            total = len(symbols)
            
            if self.verbose:
                print(f"\n📊 Starting scan of {total} stocks...")
                print(f"Minimum score threshold: {self.min_score}/10\n")
            
            for idx, symbol in enumerate(symbols, 1):
                try:
                    # Progress indicator
                    if self.verbose and idx % 50 == 0:
                        print(f"  ✓ Processed {idx}/{total} stocks...")
                    
                    # Load OHLCV data (last 250 days = ~1 year)
                    query = f"""
                        SELECT date, open, high, low, close, volume 
                        FROM stock_data 
                        WHERE symbol = '{symbol}' 
                        ORDER BY date ASC
                    """
                    df = pd.read_sql_query(query, conn)
                    
                    if df.empty or len(df) < 60:
                        continue
                    
                    # Standardize column names (case-insensitive)
                    df.columns = ['date', 'open', 'high', 'low', 'close', 'volume']
                    df.columns = [col.capitalize() for col in df.columns]
                    
                    # Run detection
                    result = self.detector.detect(df, symbol=symbol)
                    
                    if result:
                        self.results.append(result)
                
                except Exception as e:
                    if self.verbose:
                        print(f"  ⚠️  Error scanning {symbol}: {str(e)[:50]}")
                    continue
            
            conn.close()
            
        except Exception as e:
            print(f"❌ Database error: {e}")
            return []
        
        # Sort by score
        self.results.sort(key=lambda x: x['score'], reverse=True)
        
        if self.verbose:
            print(f"\n✅ Scan complete!")
            print(f"Found {len(self.results)} Power Play patterns\n")
        
        return self.results
    
    def scan_symbol(self, symbol: str) -> Optional[Dict]:
        """
        Scan single stock.
        
        Args:
            symbol: Stock symbol (e.g., 'AAPL')
        
        Returns:
            Dict with pattern result or None
        """
        try:
            conn = sqlite3.connect(self.db_path)
            
            query = f"""
                SELECT date, open, high, low, close, volume 
                FROM stock_data 
                WHERE symbol = '{symbol}' 
                ORDER BY date ASC
            """
            df = pd.read_sql_query(query, conn)
            conn.close()
            
            if df.empty:
                print(f"❌ No data found for {symbol}")
                return None
            
            if len(df) < 60:
                print(f"❌ Not enough data for {symbol} (need 60+ candles, got {len(df)})")
                return None
            
            # Standardize column names
            df.columns = ['date', 'open', 'high', 'low', 'close', 'volume']
            df.columns = [col.capitalize() for col in df.columns]
            
            result = self.detector.detect(df, symbol=symbol)
            
            if result:
                self.results = [result]
                if self.verbose:
                    print(f"\n✅ Power Play found in {symbol}!")
                return result
            else:
                if self.verbose:
                    print(f"\n❌ No Power Play pattern found in {symbol}")
                return None
        
        except Exception as e:
            print(f"❌ Error scanning {symbol}: {e}")
            return None
    
    def export_csv(self, output_path: str) -> None:
        """
        Export results to CSV.
        
        Args:
            output_path: Path to output CSV file
        """
        if not self.results:
            print("❌ No results to export. Run scan_all() first.")
            return
        
        # Flatten results for CSV
        flat_results = []
        for r in self.results:
            flat_r = {
                'symbol': r['symbol'],
                'pattern': r['pattern'],
                'stage': r['stage'],
                'score': r['score'],
                'move_pct': f"{r['move_pct']:.2%}",
                'pullback_pct': f"{r['pullback_pct']:.2%}",
                'consolidation_days': r['consolidation_days'],
                'tightness': r['tightness'],
                'distance_from_high': f"{r['distance_from_high']:.2%}",
                'current_price': f"{r['current_price']:.2f}",
                'consolidation_high': f"{r['consolidation_high']:.2f}",
                'ema_20': f"{r['ema_20']:.2f}",
                'ema_50': f"{r['ema_50']:.2f}",
            }
            flat_results.append(flat_r)
        
        df_export = pd.DataFrame(flat_results)
        df_export.to_csv(output_path, index=False)
        
        print(f"✅ Results exported to {output_path}")
        print(f"   Total results: {len(df_export)}")
    
    def export_json(self, output_path: str) -> None:
        """
        Export results to JSON.
        
        Args:
            output_path: Path to output JSON file
        """
        if not self.results:
            print("❌ No results to export. Run scan_all() first.")
            return
        
        # Convert floats for JSON serialization
        json_results = []
        for r in self.results:
            json_r = {
                'symbol': r['symbol'],
                'pattern': r['pattern'],
                'stage': r['stage'],
                'score': round(r['score'], 2),
                'move_pct': round(r['move_pct'], 4),
                'pullback_pct': round(r['pullback_pct'], 4),
                'consolidation_days': r['consolidation_days'],
                'tightness': r['tightness'],
                'distance_from_high': round(r['distance_from_high'], 4),
                'current_price': round(r['current_price'], 2),
                'consolidation_high': round(r['consolidation_high'], 2),
                'consolidation_low': round(r['consolidation_low'], 2),
                'ema_20': round(r['ema_20'], 2),
                'ema_50': round(r['ema_50'], 2),
                'candles_in_move': r['candles_in_move'],
                'score_details': {k: round(v, 2) for k, v in r['score_details'].items()},
            }
            json_results.append(json_r)
        
        with open(output_path, 'w') as f:
            json.dump(json_results, f, indent=2)
        
        print(f"✅ Results exported to {output_path}")
        print(f"   Total results: {len(json_results)}")
    
    def print_results(self, top_n: int = 10) -> None:
        """
        Print top results to console.
        
        Args:
            top_n: Number of top results to display
        """
        if not self.results:
            print("❌ No results to display. Run scan_all() first.")
            return
        
        print("\n" + "=" * 120)
        print("🎯 POWER PLAY PATTERNS - TOP RESULTS")
        print("=" * 120)
        print(f"\n{'Rank':<5} {'Symbol':<8} {'Score':<8} {'Move':<10} {'Pullback':<12} {'Cons Days':<10} {'Tightness':<12} {'Dist from High':<15}")
        print("-" * 120)
        
        for idx, result in enumerate(self.results[:top_n], 1):
            print(
                f"{idx:<5} "
                f"{result['symbol']:<8} "
                f"{result['score']:<8.1f} "
                f"{result['move_pct']:<10.1%} "
                f"{result['pullback_pct']:<12.1%} "
                f"{result['consolidation_days']:<10} "
                f"{result['tightness']:<12} "
                f"{result['distance_from_high']:<15.2%}"
            )
        
        print("\n" + "=" * 120)
        print(f"Showing {min(top_n, len(self.results))} of {len(self.results)} patterns\n")


def create_sample_database(output_path: str = "stocks.db") -> None:
    """
    Create sample SQLite database with test data.
    
    This creates realistic OHLCV data for testing.
    
    Args:
        output_path: Path to database file
    """
    import sqlite3
    from datetime import datetime, timedelta
    
    print(f"📝 Creating sample database: {output_path}")
    
    conn = sqlite3.connect(output_path)
    cursor = conn.cursor()
    
    # Create table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS stock_data (
            id INTEGER PRIMARY KEY,
            symbol TEXT NOT NULL,
            date TEXT NOT NULL,
            open REAL NOT NULL,
            high REAL NOT NULL,
            low REAL NOT NULL,
            close REAL NOT NULL,
            volume REAL NOT NULL,
            UNIQUE(symbol, date)
        )
    """)
    
    # Add sample data for testing
    symbols = ['TEST1', 'TEST2', 'TEST3', 'AAPL', 'MSFT', 'GOOGL']
    base_date = datetime(2025, 1, 1)
    
    for symbol in symbols:
        base_price = np.random.uniform(50, 200)
        
        for day in range(250):
            date = (base_date + timedelta(days=day)).strftime('%Y-%m-%d')
            
            # Simulate realistic OHLCV
            open_price = base_price * np.random.uniform(0.98, 1.02)
            close_price = open_price * np.random.uniform(0.97, 1.03)
            high_price = max(open_price, close_price) * np.random.uniform(1.00, 1.02)
            low_price = min(open_price, close_price) * np.random.uniform(0.98, 1.00)
            volume = np.random.uniform(1e6, 5e6)
            
            # Random trend component
            if day % 10 == 0:
                base_price *= np.random.uniform(0.98, 1.05)
            
            try:
                cursor.execute("""
                    INSERT INTO stock_data (symbol, date, open, high, low, close, volume)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (symbol, date, open_price, high_price, low_price, close_price, volume))
            except sqlite3.IntegrityError:
                pass
    
    conn.commit()
    conn.close()
    
    print(f"✅ Sample database created with {len(symbols)} stocks, 250 days each")
    print(f"   Database file: {output_path}\n")


def main():
    """Command-line interface for scanner."""
    
    parser = argparse.ArgumentParser(
        description='Power Play Momentum Continuation Scanner',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Scan all stocks (create sample DB first):
  python scanner.py --create-sample
  python scanner.py --db stocks.db --output results.csv
  
  # Scan single stock:
  python scanner.py --db stocks.db --symbol AAPL
  
  # Export to JSON:
  python scanner.py --db stocks.db --output results.json --export json
  
  # Custom score threshold:
  python scanner.py --db stocks.db --min-score 6.5 --output results.csv
        """
    )
    
    parser.add_argument('--db', type=str, default='stocks.db',
                       help='Path to SQLite database (default: stocks.db)')
    parser.add_argument('--create-sample', action='store_true',
                       help='Create sample database for testing')
    parser.add_argument('--symbol', type=str, default=None,
                       help='Scan single symbol (e.g., AAPL)')
    parser.add_argument('--output', type=str, default=None,
                       help='Output file (CSV/JSON)')
    parser.add_argument('--export', type=str, choices=['csv', 'json'], default='csv',
                       help='Export format (default: csv)')
    parser.add_argument('--min-score', type=float, default=7.0,
                       help='Minimum score threshold (default: 7.0)')
    parser.add_argument('--top', type=int, default=10,
                       help='Show top N results (default: 10)')
    parser.add_argument('--quiet', action='store_true',
                       help='Suppress progress messages')
    
    args = parser.parse_args()
    
    # Create sample database if requested
    if args.create_sample:
        create_sample_database(args.db)
        return
    
    # Check if database exists
    if not Path(args.db).exists():
        print(f"❌ Database not found: {args.db}")
        print(f"\n💡 Tip: Create sample database with:")
        print(f"   python scanner.py --create-sample")
        return
    
    # Initialize scanner
    scanner = PowerPlayScanner(
        db_path=args.db,
        min_score=args.min_score,
        verbose=not args.quiet
    )
    
    # Run scan
    if args.symbol:
        # Single stock
        result = scanner.scan_symbol(args.symbol)
        if result:
            scanner.print_results(top_n=1)
    else:
        # All stocks
        scanner.scan_all()
        scanner.print_results(top_n=args.top)
    
    # Export results
    if args.output and scanner.results:
        if args.export == 'json':
            scanner.export_json(args.output)
        else:
            scanner.export_csv(args.output)


if __name__ == "__main__":
    main()
