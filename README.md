# 🚀 CPR Alpha: Monthly CPR Positional Scanner

**CPR Alpha** is a high-performance positional trading dashboard designed to identify high-conviction market setups using the **Monthly Central Pivot Range (CPR)**. Built for professional traders, it transforms raw NSE market data into actionable intelligence through advanced classification and a premium, responsive interface.

---

## 💎 Key Features

### 📊 Advanced Market Scanning
- **High-Velocity Scans**: Analyze entire universes (F&O, Nifty 50, Midcap 150) in seconds using parallel processing.
*   **Monthly CPR Accuracy**: Precision calculation of Pivot, TC (Top Central), and BC (Bottom Central) levels.
*   **Strategy-Based Filtering**: Instantly filter for **Inside CPR**, **Narrow CPR**, and **High-Conviction (Inside + Narrow)** setups.

### 🧠 Intelligent Classification
- **CPR Relationship**: Automatically detects *Inside Value*, *Higher Value*, *Overlapping*, and *Outside Value* relationships.
- **Width Analysis**: Classifies pivots as *Narrow*, *Medium*, or *Wide* based on historical volatility.
- **Pivot Trend Detection**: Real-time structure analysis to determine if an asset is in a *Strong Bullish*, *Bearish*, or *Neutral* phase.

### 📱 Premium UX/UI
- **Dashboard Interface**: A modern, dark-themed layout with a fixed sidebar for desktop and a compact, action-first design for mobile.
- **Responsive Card System**: Switches from a detailed table on desktop to a high-density card view on mobile to eliminate horizontal scrolling.
- **Deep-Dive Analysis**: Comprehensive detail views providing strategic bias, entry/exit zones, and trend intelligence.

---

## 🛠️ Tech Stack

- **Core**: [Next.js 14+](https://nextjs.org/) (App Router)
- **Logic**: TypeScript with advanced mathematical modeling for CPR.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with a curated dark-mode design system.
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data Source**: Real-time price actions and monthly OHLC historical data.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18.x or higher
- npm or yarn

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd cpr-alpha
npm install
```

### 3. Running Locally
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

- `app/`: Next.js 14 App Router (Pages & API Routes).
- `components/`: Modular UI components (Sidebar, ScannerTable, DetailView).
- `hooks/`: Custom React hooks for business logic (`useScanner`).
- `lib/cpr/`: Core mathematical models, analysis logic, and universe definitions.
- `public/`: Asset universes in JSON format.

---

## 📈 Methodology

The scanner follows the **Central Pivot Range** methodology, which focuses on the relationship between price and the central pivots to determine market conviction:
- **Inside CPR**: Indicates a "coiling" market ready for a massive breakout.
- **Narrow CPR**: Suggests low volatility and an imminent trending move.
- **Relationship Analysis**: Uses the previous month's value area to determine the current month's directional bias.

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License
This project is for educational and analytical purposes only. Trade at your own risk.
