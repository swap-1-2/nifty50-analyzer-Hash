const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());

// Serve static files
app.use(express.static(__dirname));

// Cache for NSE cookies
let nseSession = {
    cookies: '',
    timestamp: 0
};

// Function to get fresh NSE session
async function getNSESession() {
    const now = Date.now();
    // Refresh session every 5 minutes
    if (nseSession.cookies && (now - nseSession.timestamp) < 300000) {
        return nseSession.cookies;
    }
    
    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        };
        
        const response = await axios.get('https://www.nseindia.com', { 
            headers,
            timeout: 10000
        });
        
        const cookies = response.headers['set-cookie'];
        if (cookies) {
            nseSession.cookies = cookies.map(cookie => cookie.split(';')[0]).join('; ');
            nseSession.timestamp = now;
            return nseSession.cookies;
        }
    } catch (error) {
        console.error('Failed to get NSE session:', error.message);
    }
    
    return '';
}

// Yahoo Finance endpoint (primary source due to NSE restrictions)
app.get('/api/stock/:symbol', async (req, res) => {
    try {
        const symbol = req.params.symbol;
        
        // Use Yahoo Finance as it's more reliable and doesn't have strict bot protection
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
        
        // Yahoo Finance returns high, low, close data which we need for Supertrend
        res.json(response.data);
    } catch (error) {
        console.error(`Error fetching ${req.params.symbol}:`, error.message);
        res.status(500).json({ error: 'Failed to fetch stock data' });
    }
});

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ Server running successfully!`);
    console.log(`🌐 Open your browser and go to: http://localhost:${PORT}`);
    console.log(`📊 Stock Analysis App is running...`);
    console.log(`⏹️  Press Ctrl+C to stop the server\n`);
});
