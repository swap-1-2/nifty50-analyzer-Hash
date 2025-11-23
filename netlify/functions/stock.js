const axios = require('axios');
const KiteConnect = require('kiteconnect').KiteConnect;

// Debug: Log environment variables (with partial masking for security)
const apiKey = process.env.KITE_API_KEY;
const apiSecret = process.env.KITE_API_SECRET;
const accessToken = process.env.KITE_ACCESS_TOKEN;

console.log('[NETLIFY FUNCTION] Environment check:', {
    hasApiKey: !!apiKey,
    hasApiSecret: !!apiSecret,
    hasAccessToken: !!accessToken,
    apiKeyLength: apiKey?.length,
    apiKeyStart: apiKey?.substring(0, 4) + '****',
    apiKeyEnd: '****' + apiKey?.substring(apiKey.length - 4),
    accessTokenLength: accessToken?.length,
    accessTokenStart: accessToken?.substring(0, 4) + '****',
    accessTokenEnd: '****' + accessToken?.substring(accessToken.length - 4)
});

// Initialize Kite Connect
console.log('[NETLIFY FUNCTION] Initializing KiteConnect with API key:', apiKey?.substring(0, 4) + '****');
const kite = new KiteConnect({
    api_key: apiKey
});

// Set access token
if (accessToken) {
    console.log('[NETLIFY FUNCTION] Setting access token:', accessToken?.substring(0, 4) + '****' + accessToken?.substring(accessToken.length - 4));
    kite.setAccessToken(accessToken);
    console.log('[NETLIFY FUNCTION] Access token set successfully');
} else {
    console.error('[NETLIFY FUNCTION] WARNING: No access token found in environment variables');
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
        console.log(`[ZERODHA] Attempting to fetch ${symbol}`);
        console.log(`[ZERODHA] Using API Key: ${apiKey?.substring(0, 4)}****${apiKey?.substring(apiKey.length - 4)}`);
        console.log(`[ZERODHA] Using Access Token: ${accessToken?.substring(0, 4)}****${accessToken?.substring(accessToken.length - 4)}`);
        
        const instrumentToken = instrumentTokens[symbol];
        if (!instrumentToken) {
            throw new Error(`Instrument token not found for ${symbol}`);
        }
        
        console.log(`[ZERODHA] Instrument token for ${symbol}: ${instrumentToken}`);

        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 150);
        
        console.log(`[ZERODHA] Date range: ${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]}`);

        const data = await kite.getHistoricalData(
            instrumentToken,
            'day',
            fromDate.toISOString().split('T')[0],
            toDate.toISOString().split('T')[0]
        );
        
        console.log(`[ZERODHA] Successfully fetched ${data.length} days of data for ${symbol}`);

        return data;
    } catch (error) {
        console.error(`[ZERODHA] Error for ${symbol}:`, error.message);
        console.error(`[ZERODHA] Error details:`, JSON.stringify(error, null, 2));
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
        let source = 'zerodha';
        
        try {
            const zerodhaData = await getKiteHistoricalData(symbol);
            console.log(`[ZERODHA] Successfully fetched ${symbol}`);
            
            // Convert Zerodha format to Yahoo Finance format for compatibility
            const timestamps = zerodhaData.map(item => Math.floor(new Date(item.date).getTime() / 1000));
            const quotes = {
                open: zerodhaData.map(item => item.open),
                high: zerodhaData.map(item => item.high),
                low: zerodhaData.map(item => item.low),
                close: zerodhaData.map(item => item.close),
                volume: zerodhaData.map(item => item.volume)
            };
            
            data = {
                chart: {
                    result: [{
                        timestamp: timestamps,
                        indicators: {
                            quote: [quotes]
                        }
                    }]
                }
            };
        } catch (zerodhaError) {
            console.log(`[ZERODHA] Failed for ${symbol}, trying Yahoo Finance...`);
            source = 'yahoo';
            const yahooData = await getYahooFinanceData(symbol);
            
            // Yahoo data is already in the correct format
            const timestamps = yahooData.map(item => Math.floor(new Date(item.date).getTime() / 1000));
            const quotes = {
                open: yahooData.map(item => item.open),
                high: yahooData.map(item => item.high),
                low: yahooData.map(item => item.low),
                close: yahooData.map(item => item.close),
                volume: yahooData.map(item => item.volume)
            };
            
            data = {
                chart: {
                    result: [{
                        timestamp: timestamps,
                        indicators: {
                            quote: [quotes]
                        }
                    }]
                }
            };
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
