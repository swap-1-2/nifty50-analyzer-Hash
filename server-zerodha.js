const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const KiteConnect = require('kiteconnect').KiteConnect;
require('dotenv').config();

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());

// Serve static files
app.use(express.static(__dirname));

// Zerodha Kite Connect Configuration
let kc = null;
let useKiteAPI = false;

// Initialize Kite Connect if credentials are provided
if (process.env.KITE_API_KEY && process.env.KITE_ACCESS_TOKEN) {
    try {
        kc = new KiteConnect({
            api_key: process.env.KITE_API_KEY
        });
        kc.setAccessToken(process.env.KITE_ACCESS_TOKEN);
        useKiteAPI = true;
        console.log('✅ Zerodha Kite Connect initialized successfully!');
    } catch (error) {
        console.error('❌ Failed to initialize Kite Connect:', error.message);
        console.log('📊 Falling back to Yahoo Finance...');
    }
} else {
    console.log('⚠️  Kite API credentials not found in .env file');
    console.log('📊 Using Yahoo Finance for data...');
}

// Zerodha instrument mapping (NSE symbols without .NS)
// Auto-generated instrument tokens for Nifty 50
const instrumentTokens = {
    'RELIANCE': '738561',
    'TCS': '2953217',
    'HDFCBANK': '341249',
    'INFY': '408065',
    'ICICIBANK': '1270529',
    'HINDUNILVR': '356865',
    'ITC': '424961',
    'SBIN': '779521',
    'BHARTIARTL': '2714625',
    'KOTAKBANK': '492033',
    'LT': '2939649',
    'ASIANPAINT': '60417',
    'AXISBANK': '1510401',
    'MARUTI': '2815745',
    'SUNPHARMA': '857857',
    'TITAN': '897537',
    'BAJFINANCE': '81153',
    'ULTRACEMCO': '2952193',
    'NESTLEIND': '4598529',
    'WIPRO': '969473',
    'ONGC': '633601',
    'NTPC': '2977281',
    'HCLTECH': '1850625',
    'TECHM': '3465729',
    'POWERGRID': '3834113',
    'TATAMOTORS': '884737',
    'TATASTEEL': '895745',
    'M&M': '519937',
    'ADANIENT': '6401',
    'BAJAJFINSV': '4268801',
    'COALINDIA': '5215745',
    'INDUSINDBK': '1346049',
    'DRREDDY': '225537',
    'JSWSTEEL': '3001089',
    'GRASIM': '315393',
    'CIPLA': '177665',
    'DIVISLAB': '2800641',
    'HINDALCO': '348929',
    'BPCL': '134657',
    'BRITANNIA': '140033',
    'EICHERMOT': '232961',
    'HEROMOTOCO': '345089',
    'APOLLOHOSP': '40193',
    'BAJAJ-AUTO': '4267265',
    'TATACONSUM': '878593',
    'ADANIPORTS': '3861249',
    'SHRIRAMFIN': '1102337',
    'UPL': '2889473',
    'SBILIFE': '5582849',
    'LTIM': '4561409'
};

// Get historical data from Zerodha Kite
async function getKiteHistoricalData(symbol, days = 150) {
    try {
        const cleanSymbol = symbol.replace('.NS', '');
        const instrumentToken = instrumentTokens[cleanSymbol];
        
        if (!instrumentToken) {
            throw new Error(`Instrument token not found for ${cleanSymbol}`);
        }
        
        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);
        
        // Fetch historical data
        const historicalData = await kc.getHistoricalData(
            instrumentToken,
            'day',
            fromDate.toISOString().split('T')[0],
            toDate.toISOString().split('T')[0]
        );
        
        // Convert Kite format to our format (similar to Yahoo Finance)
        const timestamps = historicalData.map(d => Math.floor(new Date(d.date).getTime() / 1000));
        const closes = historicalData.map(d => d.close);
        const highs = historicalData.map(d => d.high);
        const lows = historicalData.map(d => d.low);
        
        return {
            chart: {
                result: [{
                    meta: {
                        symbol: symbol,
                        currency: 'INR'
                    },
                    timestamp: timestamps,
                    indicators: {
                        quote: [{
                            close: closes,
                            high: highs,
                            low: lows
                        }]
                    }
                }]
            }
        };
    } catch (error) {
        throw error;
    }
}

// Endpoint to get stock data (Kite or Yahoo Finance)
app.get('/api/stock/:symbol', async (req, res) => {
    try {
        const symbol = req.params.symbol;
        
        // Try Kite API first if available
        if (useKiteAPI && kc) {
            try {
                console.log(`📡 [ZERODHA] Fetching ${symbol}...`);
                const data = await getKiteHistoricalData(symbol);
                console.log(`✅ [ZERODHA] Success: ${symbol}`);
                res.json(data);
                return;
            } catch (kiteError) {
                console.warn(`⚠️  [ZERODHA FAILED] ${symbol}: ${kiteError.message}`);
                console.log(`🔄 [FALLBACK] Using Yahoo Finance for ${symbol}...`);
            }
        }
        
        // Fallback to Yahoo Finance
        console.log(`📊 [YAHOO] Fetching ${symbol}...`);
        const now = new Date();
        const endDate = Math.floor(now.getTime() / 1000);
        const startDate = endDate - (150 * 24 * 60 * 60);
        
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startDate}&period2=${endDate}&interval=1d`;
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 15000
        });
        
        console.log(`✅ [YAHOO] Success: ${symbol}`);
        res.json(response.data);
    } catch (error) {
        console.error(`❌ [ERROR] ${req.params.symbol}: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch stock data' });
    }
});

// Endpoint to get live market quote from Zerodha
app.get('/api/quote/:symbol', async (req, res) => {
    try {
        if (!useKiteAPI || !kc) {
            return res.status(503).json({ error: 'Kite API not configured' });
        }
        
        const cleanSymbol = req.params.symbol.replace('.NS', '');
        const instrumentToken = instrumentTokens[cleanSymbol];
        
        if (!instrumentToken) {
            return res.status(404).json({ error: 'Instrument token not found' });
        }
        
        const quote = await kc.getQuote([`NSE:${cleanSymbol}`]);
        res.json(quote);
    } catch (error) {
        console.error(`Error fetching quote for ${req.params.symbol}:`, error.message);
        res.status(500).json({ error: 'Failed to fetch quote' });
    }
});

// Endpoint to get instrument tokens (call this once to populate the mapping)
app.get('/api/instruments', async (req, res) => {
    try {
        if (!useKiteAPI || !kc) {
            return res.status(503).json({ error: 'Kite API not configured' });
        }
        
        const instruments = await kc.getInstruments(['NSE']);
        
        // Filter for equity instruments only
        const equityInstruments = instruments.filter(i => i.segment === 'NSE' && i.instrument_type === 'EQ');
        
        res.json(equityInstruments);
    } catch (error) {
        console.error('Error fetching instruments:', error.message);
        res.status(500).json({ error: 'Failed to fetch instruments' });
    }
});

// Login URL generator
app.get('/api/kite/login-url', (req, res) => {
    if (!process.env.KITE_API_KEY) {
        return res.status(503).json({ error: 'Kite API key not configured' });
    }
    
    const loginUrl = `https://kite.zerodha.com/connect/login?api_key=${process.env.KITE_API_KEY}&v=3`;
    res.json({ loginUrl });
});

// Generate access token from request token
app.post('/api/kite/session', express.json(), async (req, res) => {
    try {
        const { request_token } = req.body;
        
        if (!process.env.KITE_API_KEY || !process.env.KITE_API_SECRET) {
            return res.status(503).json({ error: 'Kite API credentials not configured' });
        }
        
        const tempKc = new KiteConnect({
            api_key: process.env.KITE_API_KEY
        });
        
        const session = await tempKc.generateSession(request_token, process.env.KITE_API_SECRET);
        
        res.json({
            access_token: session.access_token,
            message: 'Save this access_token in your .env file as KITE_ACCESS_TOKEN'
        });
    } catch (error) {
        console.error('Error generating session:', error.message);
        res.status(500).json({ error: 'Failed to generate session' });
    }
});

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Server running successfully!`);
    console.log(`🌐 Open your browser and go to: http://localhost:${PORT}`);
    console.log(`📊 Stock Analysis App is running...`);
    console.log(`${'='.repeat(60)}`);
    if (useKiteAPI) {
        console.log(`🔌 DATA SOURCE: Zerodha Kite Connect (LIVE DATA)`);
        console.log(`📡 Status: CONNECTED`);
        console.log(`💡 You will see [ZERODHA] tags in logs for live data`);
    } else {
        console.log(`📈 DATA SOURCE: Yahoo Finance (Delayed Data)`);
        console.log(`⚠️  Zerodha not configured - using Yahoo fallback`);
    }
    console.log(`${'='.repeat(60)}`);
    console.log(`⏹️  Press Ctrl+C to stop the server\n`);
});
