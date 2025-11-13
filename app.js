// Array to store fetched stock data
let stocksData = [];

// Nifty 50 stocks list (Updated November 2025)
const nifty50Stocks = [
    'RELIANCE.NS',      // Reliance Industries
    'TCS.NS',           // Tata Consultancy Services
    'HDFCBANK.NS',      // HDFC Bank
    'INFY.NS',          // Infosys
    'ICICIBANK.NS',     // ICICI Bank
    'HINDUNILVR.NS',    // Hindustan Unilever
    'ITC.NS',           // ITC
    'SBIN.NS',          // State Bank of India
    'BHARTIARTL.NS',    // Bharti Airtel
    'KOTAKBANK.NS',     // Kotak Mahindra Bank
    'LT.NS',            // Larsen & Toubro
    'ASIANPAINT.NS',    // Asian Paints
    'AXISBANK.NS',      // Axis Bank
    'MARUTI.NS',        // Maruti Suzuki
    'SUNPHARMA.NS',     // Sun Pharmaceutical
    'TITAN.NS',         // Titan Company
    'BAJFINANCE.NS',    // Bajaj Finance
    'ULTRACEMCO.NS',    // UltraTech Cement
    'NESTLEIND.NS',     // Nestle India
    'WIPRO.NS',         // Wipro
    'ONGC.NS',          // Oil & Natural Gas Corporation
    'NTPC.NS',          // NTPC
    'HCLTECH.NS',       // HCL Technologies
    'TECHM.NS',         // Tech Mahindra
    'POWERGRID.NS',     // Power Grid Corporation
    'TATAMOTORS.NS',    // Tata Motors
    'TATASTEEL.NS',     // Tata Steel
    'M&M.NS',           // Mahindra & Mahindra
    'ADANIENT.NS',      // Adani Enterprises
    'BAJAJFINSV.NS',    // Bajaj Finserv
    'COALINDIA.NS',     // Coal India
    'INDUSINDBK.NS',    // IndusInd Bank
    'DRREDDY.NS',       // Dr. Reddy's Laboratories
    'JSWSTEEL.NS',      // JSW Steel
    'GRASIM.NS',        // Grasim Industries
    'CIPLA.NS',         // Cipla
    'DIVISLAB.NS',      // Divi's Laboratories
    'HINDALCO.NS',      // Hindalco Industries
    'BPCL.NS',          // Bharat Petroleum
    'BRITANNIA.NS',     // Britannia Industries
    'EICHERMOT.NS',     // Eicher Motors
    'HEROMOTOCO.NS',    // Hero MotoCorp
    'APOLLOHOSP.NS',    // Apollo Hospitals
    'BAJAJ-AUTO.NS',    // Bajaj Auto
    'TATACONSUM.NS',    // Tata Consumer Products
    'ADANIPORTS.NS',    // Adani Ports
    'SHRIRAMFIN.NS',    // Shriram Finance
    'UPL.NS',           // UPL
    'SBILIFE.NS',       // SBI Life Insurance
    'LTIM.NS'           // LTIMindtree
];

// Display stocks being analyzed
function displayStocksList() {
    const stocksBadges = document.getElementById('stocksBadges');
    stocksBadges.innerHTML = nifty50Stocks.map(symbol => {
        const stockName = symbol.replace('.NS', '');
        return `<div class="stock-badge">${stockName}</div>`;
    }).join('');
}

// Calculate Simple Moving Average
function calculateSMA(prices, period) {
    if (prices.length < period) return 0;
    const sum = prices.reduce((acc, price) => acc + price, 0);
    return sum / period;
}

// Calculate ATR (Average True Range) - Excel LAMBDA equivalent
function calculateATR(highPrices, lowPrices, closePrices, period) {
    if (highPrices.length < period) return [];
    
    // Calculate True Range for each period
    const tr = highPrices.map((high, i) => {
        const low = lowPrices[i];
        const prevClose = i === 0 ? closePrices[i] : closePrices[i - 1];
        
        return Math.max(
            high - low,
            Math.abs(high - prevClose),
            Math.abs(low - prevClose)
        );
    });
    
    // Calculate ATR using SCAN logic from Excel
    const atr = [];
    for (let i = 0; i < highPrices.length; i++) {
        if (i < period - 1) {
            atr[i] = 0; // Placeholder, not used
        } else if (i === period - 1) {
            // First ATR is simple average of first 'period' TR values
            const sum = tr.slice(0, period).reduce((a, b) => a + b, 0);
            atr[i] = sum / period;
        } else {
            // Smoothed ATR using Wilder's method
            atr[i] = ((atr[i - 1] * (period - 1)) + tr[i]) / period;
        }
    }
    
    return atr;
}

// Calculate Supertrend - Excel LAMBDA equivalent
function calculateSupertrend(highPrices, lowPrices, closePrices, period = 10, multiplier = 2) {
    if (highPrices.length < period) return { value: 0, trend: 'neutral' };
    
    const atr = calculateATR(highPrices, lowPrices, closePrices, period);
    
    // Calculate basic upper and lower bands
    const basic_upper = highPrices.map((high, i) => {
        const low = lowPrices[i];
        const hl2 = (high + low) / 2;
        return hl2 + multiplier * atr[i];
    });
    
    const basic_lower = highPrices.map((high, i) => {
        const low = lowPrices[i];
        const hl2 = (high + low) / 2;
        return hl2 - multiplier * atr[i];
    });
    
    // Calculate final upper band using SCAN logic
    const final_upper = [];
    for (let i = 0; i < highPrices.length; i++) {
        if (i <= period - 1) {
            final_upper[i] = basic_upper[period - 1];
        } else {
            const prev = final_upper[i - 1];
            if (basic_upper[i] < prev || closePrices[i - 1] > prev) {
                final_upper[i] = basic_upper[i];
            } else {
                final_upper[i] = prev;
            }
        }
    }
    
    // Calculate final lower band using SCAN logic
    const final_lower = [];
    for (let i = 0; i < highPrices.length; i++) {
        if (i <= period - 1) {
            final_lower[i] = basic_lower[period - 1];
        } else {
            const prev = final_lower[i - 1];
            if (basic_lower[i] > prev || closePrices[i - 1] < prev) {
                final_lower[i] = basic_lower[i];
            } else {
                final_lower[i] = prev;
            }
        }
    }
    
    // Calculate supertrend using SCAN logic
    const supertrend = [];
    for (let i = 0; i < highPrices.length; i++) {
        if (i <= period - 1) {
            supertrend[i] = final_upper[period - 1];
        } else {
            const prev = supertrend[i - 1];
            
            if (prev === final_upper[i - 1] && closePrices[i] <= final_upper[i]) {
                supertrend[i] = final_upper[i];
            } else if (prev === final_upper[i - 1] && closePrices[i] >= final_upper[i]) {
                supertrend[i] = final_lower[i];
            } else if (prev === final_lower[i - 1] && closePrices[i] >= final_lower[i]) {
                supertrend[i] = final_lower[i];
            } else if (prev === final_lower[i - 1] && closePrices[i] <= final_lower[i]) {
                supertrend[i] = final_upper[i];
            } else {
                supertrend[i] = prev;
            }
        }
    }
    
    const lastIdx = supertrend.length - 1;
    const stValue = supertrend[lastIdx];
    const trend = closePrices[lastIdx] > stValue ? 'up' : 'down';
    
    return {
        value: stValue,
        trend: trend
    };
}

// Fetch stock data from Yahoo Finance API via proxy
async function fetchStockData(symbol) {
    try {
        // Use local proxy server instead of direct API call
        const url = `/api/stock/${symbol}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.chart && data.chart.result && data.chart.result[0]) {
            const result = data.chart.result[0];
            const timestamps = result.timestamp;
            const rawPrices = result.indicators.quote[0].close;
            const rawHighPrices = result.indicators.quote[0].high;
            const rawLowPrices = result.indicators.quote[0].low;
            
            // Create array of valid price entries with their timestamps
            const validEntries = [];
            for (let i = 0; i < rawPrices.length; i++) {
                if (rawPrices[i] !== null && rawHighPrices[i] !== null && rawLowPrices[i] !== null) {
                    validEntries.push({
                        price: rawPrices[i],
                        high: rawHighPrices[i],
                        low: rawLowPrices[i],
                        timestamp: timestamps[i],
                        date: new Date(timestamps[i] * 1000)
                    });
                }
            }
            
            if (validEntries.length < 100) {
                console.warn(`Not enough data for ${symbol} - only ${validEntries.length} days`);
                return null;
            }
            
            // Get the last closed price (most recent trading day)
            const lastEntry = validEntries[validEntries.length - 1];
            const lastClosedPrice = lastEntry.price;
            const lastDate = lastEntry.date;
            const dateStr = lastDate.toLocaleDateString('en-IN', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
            });
            
            // Calculate all SMAs
            const allPrices = validEntries.map(e => e.price);
            const allHighPrices = validEntries.map(e => e.high);
            const allLowPrices = validEntries.map(e => e.low);
            
            const sma10 = calculateSMA(allPrices.slice(-10), 10);
            const sma20 = calculateSMA(allPrices.slice(-20), 20);
            const sma50 = calculateSMA(allPrices.slice(-50), 50);
            const sma100 = calculateSMA(allPrices.slice(-100), 100);
            
            // Calculate Supertrend (10, 2)
            const supertrend = calculateSupertrend(allHighPrices, allLowPrices, allPrices, 10, 2);
            
            // Calculate gap percentages
            const gap10 = ((lastClosedPrice - sma10) / sma10 * 100);
            const gap20 = ((lastClosedPrice - sma20) / sma20 * 100);
            const gap50 = ((lastClosedPrice - sma50) / sma50 * 100);
            const gap100 = ((lastClosedPrice - sma100) / sma100 * 100);
            
            console.log(`${symbol}: Price=₹${lastClosedPrice.toFixed(2)} | ST(10,2)=₹${supertrend.value.toFixed(2)} [${supertrend.trend.toUpperCase()}] | SMA10=₹${sma10.toFixed(2)}`);
            
            return {
                symbol: symbol,
                name: symbol.replace('.NS', ''),
                currentPrice: lastClosedPrice,
                sma10: sma10,
                sma20: sma20,
                sma50: sma50,
                sma100: sma100,
                gap10: gap10,
                gap20: gap20,
                gap50: gap50,
                gap100: gap100,
                supertrend: supertrend.value,
                supertrendTrend: supertrend.trend,
                aboveSupertrend: supertrend.trend === 'up',
                aboveSMA10: lastClosedPrice > sma10,
                aboveSMA20: lastClosedPrice > sma20,
                aboveSMA50: lastClosedPrice > sma50,
                aboveSMA100: lastClosedPrice > sma100,
                lastDate: dateStr
            };
        }
        return null;
    } catch (error) {
        console.error(`Error fetching ${symbol}:`, error);
        return null;
    }
}

// Fetch all stocks data with rate limiting
async function fetchAllStocks() {
    const refreshBtn = document.getElementById('refreshBtn');
    const stocksGrid = document.getElementById('stocksGrid');
    
    refreshBtn.disabled = true;
    stocksGrid.innerHTML = '<div class="loading">Fetching stock data...</div>';
    
    stocksData = [];
    
    // Fetch in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < nifty50Stocks.length; i += batchSize) {
        const batch = nifty50Stocks.slice(i, i + batchSize);
        const promises = batch.map(symbol => fetchStockData(symbol));
        const results = await Promise.all(promises);
        
        stocksData.push(...results.filter(r => r !== null));
        
        // Update UI after each batch
        updateUI();
        
        // Wait a bit between batches to avoid rate limiting
        if (i + batchSize < nifty50Stocks.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    refreshBtn.disabled = false;
    updateLastUpdate();
}

// Update the UI with stock data
function updateUI() {
    // Calculate statistics for each SMA
    const stats = {
        sma10: { above: 0, below: 0, totalGap: 0 },
        sma20: { above: 0, below: 0, totalGap: 0 },
        sma50: { above: 0, below: 0, totalGap: 0 },
        sma100: { above: 0, below: 0, totalGap: 0 }
    };
    
    stocksData.forEach(stock => {
        if (stock.aboveSMA10) stats.sma10.above++; else stats.sma10.below++;
        if (stock.aboveSMA20) stats.sma20.above++; else stats.sma20.below++;
        if (stock.aboveSMA50) stats.sma50.above++; else stats.sma50.below++;
        if (stock.aboveSMA100) stats.sma100.above++; else stats.sma100.below++;
        
        stats.sma10.totalGap += stock.gap10;
        stats.sma20.totalGap += stock.gap20;
        stats.sma50.totalGap += stock.gap50;
        stats.sma100.totalGap += stock.gap100;
    });
    
    const totalStocks = stocksData.length;
    
    // Calculate average gaps
    const avgGap10 = totalStocks > 0 ? (stats.sma10.totalGap / totalStocks).toFixed(2) : 0;
    const avgGap20 = totalStocks > 0 ? (stats.sma20.totalGap / totalStocks).toFixed(2) : 0;
    const avgGap50 = totalStocks > 0 ? (stats.sma50.totalGap / totalStocks).toFixed(2) : 0;
    const avgGap100 = totalStocks > 0 ? (stats.sma100.totalGap / totalStocks).toFixed(2) : 0;
    
    // Update old stats (keeping for backward compatibility)
    document.getElementById('aboveCount').textContent = stats.sma10.above;
    document.getElementById('belowCount').textContent = stats.sma10.below;
    document.getElementById('percentageAbove').textContent = `${((stats.sma10.above / totalStocks) * 100).toFixed(1)}%`;
    
    const stocksGrid = document.getElementById('stocksGrid');
    
    if (stocksData.length === 0) {
        stocksGrid.innerHTML = '<div class="loading">No data available</div>';
        return;
    }
    
    // Sort stocks: above SMA10 first, then by name
    const sortedStocks = [...stocksData].sort((a, b) => {
        if (a.aboveSMA10 === b.aboveSMA10) {
            return a.name.localeCompare(b.name);
        }
        return b.aboveSMA10 - a.aboveSMA10;
    });
    
    stocksGrid.innerHTML = `
        <div class="sma-summary-grid">
            <div class="sma-summary-card">
                <h3>SMA 10</h3>
                <div class="sma-stats">
                    <div class="stat-row"><span class="label">Above:</span><span class="value green">${stats.sma10.above}</span></div>
                    <div class="stat-row"><span class="label">Below:</span><span class="value red">${stats.sma10.below}</span></div>
                    <div class="stat-row"><span class="label">Avg Gap:</span><span class="value ${avgGap10 >= 0 ? 'green' : 'red'}">${avgGap10}%</span></div>
                </div>
            </div>
            <div class="sma-summary-card">
                <h3>SMA 20</h3>
                <div class="sma-stats">
                    <div class="stat-row"><span class="label">Above:</span><span class="value green">${stats.sma20.above}</span></div>
                    <div class="stat-row"><span class="label">Below:</span><span class="value red">${stats.sma20.below}</span></div>
                    <div class="stat-row"><span class="label">Avg Gap:</span><span class="value ${avgGap20 >= 0 ? 'green' : 'red'}">${avgGap20}%</span></div>
                </div>
            </div>
            <div class="sma-summary-card">
                <h3>SMA 50</h3>
                <div class="sma-stats">
                    <div class="stat-row"><span class="label">Above:</span><span class="value green">${stats.sma50.above}</span></div>
                    <div class="stat-row"><span class="label">Below:</span><span class="value red">${stats.sma50.below}</span></div>
                    <div class="stat-row"><span class="label">Avg Gap:</span><span class="value ${avgGap50 >= 0 ? 'green' : 'red'}">${avgGap50}%</span></div>
                </div>
            </div>
            <div class="sma-summary-card">
                <h3>SMA 100</h3>
                <div class="sma-stats">
                    <div class="stat-row"><span class="label">Above:</span><span class="value green">${stats.sma100.above}</span></div>
                    <div class="stat-row"><span class="label">Below:</span><span class="value red">${stats.sma100.below}</span></div>
                    <div class="stat-row"><span class="label">Avg Gap:</span><span class="value ${avgGap100 >= 0 ? 'green' : 'red'}">${avgGap100}%</span></div>
                </div>
            </div>
        </div>
        <div class="stocks-detail-grid">
        ${sortedStocks.map(stock => `
            <div class="stock-card ${stock.aboveSMA10 ? 'above' : 'below'}">
                <div class="stock-name">${stock.name}</div>
                <div class="stock-info">
                    <span class="stock-price">₹${stock.currentPrice.toFixed(2)}</span>
                </div>
                <div class="supertrend-indicator">
                    <span class="supertrend-badge ${stock.supertrendTrend === 'up' ? 'up' : 'down'}" title="Supertrend(10,2): ₹${stock.supertrend.toFixed(2)}">
                        ST: ${stock.supertrendTrend === 'up' ? '📈' : '📉'} ₹${stock.supertrend.toFixed(2)}
                    </span>
                </div>
                <div class="sma-indicators">
                    <span class="sma-badge ${stock.aboveSMA10 ? 'above' : 'below'}" title="SMA 10: ₹${stock.sma10.toFixed(2)}">10: ${stock.gap10.toFixed(1)}%</span>
                    <span class="sma-badge ${stock.aboveSMA20 ? 'above' : 'below'}" title="SMA 20: ₹${stock.sma20.toFixed(2)}">20: ${stock.gap20.toFixed(1)}%</span>
                    <span class="sma-badge ${stock.aboveSMA50 ? 'above' : 'below'}" title="SMA 50: ₹${stock.sma50.toFixed(2)}">50: ${stock.gap50.toFixed(1)}%</span>
                    <span class="sma-badge ${stock.aboveSMA100 ? 'above' : 'below'}" title="SMA 100: ₹${stock.sma100.toFixed(2)}">100: ${stock.gap100.toFixed(1)}%</span>
                </div>
                <div class="stock-info" style="font-size: 0.8rem; color: #718096; margin-top: 5px;">
                    <span>As of: ${stock.lastDate}</span>
                </div>
            </div>
        `).join('')}
        </div>
    `;
    
    // Update recommended stocks section
    updateRecommendedStocks();
}

// Function to identify and display recommended stocks in buy zone
function updateRecommendedStocks() {
    const recommendedGrid = document.getElementById('recommendedGrid');
    
    if (stocksData.length === 0) {
        recommendedGrid.innerHTML = '<div class="loading-small">No data available</div>';
        return;
    }
    
    // Criteria for buy zone:
    // 1. Supertrend = UP (price above supertrend)
    // 2. Price above SMA 10, 20, and 50
    // 3. Preferably above SMA 100 too
    
    const buyZoneStocks = stocksData.filter(stock => {
        return stock.supertrendTrend === 'up' && 
               stock.aboveSMA10 && 
               stock.aboveSMA20 && 
               stock.aboveSMA50;
    }).sort((a, b) => {
        // Sort by number of SMAs above (more is better)
        const aScore = (a.aboveSMA10 ? 1 : 0) + (a.aboveSMA20 ? 1 : 0) + 
                      (a.aboveSMA50 ? 1 : 0) + (a.aboveSMA100 ? 1 : 0);
        const bScore = (b.aboveSMA10 ? 1 : 0) + (b.aboveSMA20 ? 1 : 0) + 
                      (b.aboveSMA50 ? 1 : 0) + (b.aboveSMA100 ? 1 : 0);
        return bScore - aScore;
    });
    
    if (buyZoneStocks.length === 0) {
        recommendedGrid.innerHTML = `
            <div class="no-recommendations">
                <p>⚠️ No stocks currently in strong buy zone</p>
                <p class="small-text">Waiting for better entry signals based on Supertrend & SMA alignment</p>
            </div>
        `;
        return;
    }
    
    recommendedGrid.innerHTML = buyZoneStocks.map(stock => `
        <div class="recommended-card">
            <div class="recommended-header">
                <h3>${stock.name}</h3>
                <span class="recommended-price">₹${stock.currentPrice.toFixed(2)}</span>
            </div>
            <div class="recommended-signals">
                <span class="signal-badge success">📈 Supertrend UP</span>
                ${stock.aboveSMA10 ? '<span class="signal-badge success">✓ Above SMA 10</span>' : ''}
                ${stock.aboveSMA20 ? '<span class="signal-badge success">✓ Above SMA 20</span>' : ''}
                ${stock.aboveSMA50 ? '<span class="signal-badge success">✓ Above SMA 50</span>' : ''}
                ${stock.aboveSMA100 ? '<span class="signal-badge success">✓ Above SMA 100</span>' : '<span class="signal-badge warning">⚠ Below SMA 100</span>'}
            </div>
            <div class="recommended-info">
                <div class="info-row">
                    <span>Supertrend:</span>
                    <span class="value-green">₹${stock.supertrend.toFixed(2)}</span>
                </div>
                <div class="info-row">
                    <span>Distance from ST:</span>
                    <span class="value-green">+${((stock.currentPrice - stock.supertrend) / stock.supertrend * 100).toFixed(2)}%</span>
                </div>
            </div>
            <div class="recommended-footer">
                <span class="date-text">As of: ${stock.lastDate}</span>
            </div>
        </div>
    `).join('');
}

// Update last update timestamp
function updateLastUpdate() {
    const now = new Date();
    const timeString = now.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
    document.getElementById('lastUpdate').textContent = timeString;
}

// Event listeners
document.getElementById('refreshBtn').addEventListener('click', fetchAllStocks);

// Initial load
displayStocksList();
fetchAllStocks();
