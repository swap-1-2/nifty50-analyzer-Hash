# Nifty 50 Stock Analysis App

A responsive web application that shows how many Nifty 50 stocks are trading above their 10-day Simple Moving Average (SMA).

## Features

- ✅ Real-time data for all Nifty 50 stocks
- 📊 Visual statistics showing stocks above/below 10-day SMA
- 📱 Fully responsive design (mobile, tablet, desktop)
- 🔄 Refresh button to update data
- 🎨 Beautiful gradient UI with modern design
- 📈 Individual stock cards with price and SMA information
- 💼 Displays all 50 stocks being analyzed
- 🔒 Backend proxy to handle CORS restrictions

## How to Run

Due to CORS restrictions from Yahoo Finance API, this app requires a Node.js backend proxy server.

### Prerequisites
- Node.js (version 12 or higher)

### Installation & Running

1. **Install Dependencies**
```bash
cd "/Users/swapniljoshi/Documents/Stock"
npm install
```

2. **Start the Server**
```bash
npm start
```

3. **Open Your Browser**
   - The server will start on `http://localhost:3000`
   - Open your browser and go to: `http://localhost:3000`

### Alternative: Manual Node.js Start
```bash
node server-node.js
```

## How to Use

1. Start the server (see above)
2. The app will automatically fetch data for all Nifty 50 stocks
3. Click "Refresh Data" button to update the information
4. View statistics at the top showing:
   - Number of stocks above SMA
   - Number of stocks below SMA
   - Percentage of stocks above SMA
5. Scroll down to see individual stock details

## Architecture

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js + Express (proxy server)
- **Data Source**: Yahoo Finance API
- **CORS Solution**: Backend proxy handles API requests

## Technical Details

- Uses Yahoo Finance API to fetch stock data
- Calculates 10-day Simple Moving Average
- Pure HTML, CSS, and JavaScript (no external dependencies)
- Implements rate limiting to avoid API throttling
- Batch processing for efficient data fetching

## Stock Data

The app tracks all 50 stocks in the Nifty 50 index including:
- Reliance, TCS, HDFC Bank, Infosys
- ICICI Bank, HUL, ITC, SBI
- And 42 more major Indian companies

## Note

This is for educational purposes only. Stock market data may have delays and should not be used for actual trading decisions.
