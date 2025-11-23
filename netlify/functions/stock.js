const axios = require('axios');
const KiteConnect = require('kiteconnect').KiteConnect;

// Initialize Kite Connect
const kite = new KiteConnect({
    api_key: process.env.KITE_API_KEY
});

// Set access token
if (process.env.KITE_ACCESS_TOKEN) {
    kite.setAccessToken(process.env.KITE_ACCESS_TOKEN);
}

// Instrument tokens mapping
const instrumentTokens = {
    'ADANIPORTS.NS': 3861249,
    'ASIANPAINT.NS': 60417,
    'AXISBANK.NS': 1510401,
    'BAJAJ-AUTO.NS': 4267265,
    'BAJFINANCE.NS': 81153,
    'BAJAJFINSV.NS': 4268801,
    'BHARTIARTL.NS': 2714625,
    'BPCL.NS': 134657,
    'BRITANNIA.NS': 140033,
    'CIPLA.NS': 177665,
    'COALINDIA.NS': 5215745,
    'DIVISLAB.NS': 2800641,
    'DRREDDY.NS': 225537,
    'EICHERMOT.NS': 232961,
    'GRASIM.NS': 315393,
    'HCLTECH.NS': 1850625,
    'HDFCBANK.NS': 341249,
    'HDFCLIFE.NS': 119553,
    'HEROMOTOCO.NS': 345089,
    'HINDALCO.NS': 348929,
    'HINDUNILVR.NS': 356865,
    'ICICIBANK.NS': 1270529,
    'INDUSINDBK.NS': 1346049,
    'INFY.NS': 408065,
    'ITC.NS': 424961,
    'JSWSTEEL.NS': 3001089,
    'KOTAKBANK.NS': 492033,
    'LT.NS': 2939649,
    'M&M.NS': 519937,
    'MARUTI.NS': 2815745,
    'NESTLEIND.NS': 4598529,
    'NTPC.NS': 2977281,
    'ONGC.NS': 633601,
    'POWERGRID.NS': 3834113,
    'RELIANCE.NS': 738561,
    'SBILIFE.NS': 5582849,
    'SBIN.NS': 779521,
    'SHREECEM.NS': 794369,
    'SUNPHARMA.NS': 857857,
    'TATAMOTORS.NS': 884737,
    'TATASTEEL.NS': 895745,
    'TCS.NS': 2953217,
    'TECHM.NS': 3465729,
    'TITAN.NS': 897537,
    'ULTRACEMCO.NS': 2952193,
    'UPL.NS': 2889473,
    'WIPRO.NS': 969473,
    'ADANIENT.NS': 6401,
    'APOLLOHOSP.NS': 2918401,
    'LTIM.NS': 15083009
};

// Fetch data from Zerodha
async function getKiteHistoricalData(symbol) {
    try {
        const instrumentToken = instrumentTokens[symbol];
        if (!instrumentToken) {
            throw new Error(`Instrument token not found for ${symbol}`);
        }

        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 150);

        const data = await kite.getHistoricalData(
            instrumentToken,
            'day',
            fromDate.toISOString().split('T')[0],
            toDate.toISOString().split('T')[0]
        );

        return data;
    } catch (error) {
        console.error(`[ZERODHA] Error for ${symbol}:`, error.message);
        throw error;
    }
}

// Fetch data from Yahoo Finance (fallback)
async function getYahooFinanceData(symbol) {
    try {
        const period1 = Math.floor(Date.now() / 1000) - (150 * 24 * 60 * 60);
        const period2 = Math.floor(Date.now() / 1000);
        
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d`;
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });

        const result = response.data.chart.result[0];
        const timestamps = result.timestamp;
        const quotes = result.indicators.quote[0];

        const data = timestamps.map((timestamp, index) => ({
            date: new Date(timestamp * 1000).toISOString().split('T')[0],
            open: quotes.open[index],
            high: quotes.high[index],
            low: quotes.low[index],
            close: quotes.close[index],
            volume: quotes.volume[index]
        }));

        return data;
    } catch (error) {
        console.error(`[YAHOO] Error for ${symbol}:`, error.message);
        throw error;
    }
}

// Netlify serverless function handler
exports.handler = async (event, context) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Extract symbol from path
    const pathParts = event.path.split('/');
    const symbol = pathParts[pathParts.length - 1];

    if (!symbol) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Symbol parameter is required' })
        };
    }

    try {
        console.log(`[REQUEST] Fetching data for ${symbol}`);

        // Try Zerodha first
        let data;
        try {
            data = await getKiteHistoricalData(symbol);
            console.log(`[ZERODHA] Successfully fetched ${symbol}`);
        } catch (zerodhaError) {
            console.log(`[ZERODHA] Failed for ${symbol}, trying Yahoo Finance...`);
            data = await getYahooFinanceData(symbol);
            console.log(`[YAHOO] Successfully fetched ${symbol}`);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error(`[ERROR] Failed to fetch ${symbol}:`, error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to fetch stock data',
                message: error.message 
            })
        };
    }
};
