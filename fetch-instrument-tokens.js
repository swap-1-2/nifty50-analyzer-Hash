#!/usr/bin/env node

/**
 * Fetch all NSE instrument tokens for Nifty 50 stocks
 */

const KiteConnect = require('kiteconnect').KiteConnect;
require('dotenv').config();
const fs = require('fs');

const API_KEY = process.env.KITE_API_KEY;
const ACCESS_TOKEN = process.env.KITE_ACCESS_TOKEN;

if (!API_KEY || !ACCESS_TOKEN) {
    console.error('❌ Error: KITE_API_KEY and KITE_ACCESS_TOKEN not found in .env file');
    process.exit(1);
}

const kc = new KiteConnect({
    api_key: API_KEY
});

kc.setAccessToken(ACCESS_TOKEN);

// Nifty 50 stock symbols (without .NS)
const nifty50Symbols = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
    'HINDUNILVR', 'ITC', 'SBIN', 'BHARTIARTL', 'KOTAKBANK',
    'LT', 'ASIANPAINT', 'AXISBANK', 'MARUTI', 'SUNPHARMA',
    'TITAN', 'BAJFINANCE', 'ULTRACEMCO', 'NESTLEIND', 'WIPRO',
    'ONGC', 'NTPC', 'HCLTECH', 'TECHM', 'POWERGRID',
    'TATAMOTORS', 'TATASTEEL', 'M&M', 'ADANIENT', 'BAJAJFINSV',
    'COALINDIA', 'INDUSINDBK', 'DRREDDY', 'JSWSTEEL', 'GRASIM',
    'CIPLA', 'DIVISLAB', 'HINDALCO', 'BPCL', 'BRITANNIA',
    'EICHERMOT', 'HEROMOTOCO', 'APOLLOHOSP', 'BAJAJ-AUTO', 'TATACONSUM',
    'ADANIPORTS', 'SHRIRAMFIN', 'UPL', 'SBILIFE', 'LTIM'
];

console.log('\n🔍 Fetching NSE instruments...\n');

kc.getInstruments(['NSE'])
    .then(instruments => {
        console.log(`✅ Fetched ${instruments.length} instruments from NSE\n`);
        
        const tokenMapping = {};
        const notFound = [];
        
        // Find tokens for Nifty 50 stocks
        nifty50Symbols.forEach(symbol => {
            const instrument = instruments.find(i => 
                i.tradingsymbol === symbol && 
                i.exchange === 'NSE' && 
                i.instrument_type === 'EQ'
            );
            
            if (instrument) {
                tokenMapping[symbol] = instrument.instrument_token.toString();
                console.log(`✓ ${symbol.padEnd(15)} → ${instrument.instrument_token}`);
            } else {
                notFound.push(symbol);
                console.log(`✗ ${symbol.padEnd(15)} → NOT FOUND`);
            }
        });
        
        console.log(`\n📊 Found ${Object.keys(tokenMapping).length} out of ${nifty50Symbols.length} stocks\n`);
        
        if (notFound.length > 0) {
            console.log('⚠️  Not found:', notFound.join(', '));
            console.log('\n');
        }
        
        // Generate JavaScript object code
        const jsCode = `// Zerodha instrument tokens for Nifty 50 stocks
// Auto-generated on ${new Date().toLocaleString('en-IN')}
const instrumentTokens = {
${Object.entries(tokenMapping).map(([symbol, token]) => `    '${symbol}': '${token}'`).join(',\n')}
};

module.exports = instrumentTokens;
`;
        
        // Save to file
        fs.writeFileSync('instrument-tokens.js', jsCode);
        console.log('✅ Saved to: instrument-tokens.js\n');
        
        // Also print for copy-paste
        console.log('📋 Copy this to server-zerodha.js:\n');
        console.log('const instrumentTokens = {');
        Object.entries(tokenMapping).forEach(([symbol, token]) => {
            console.log(`    '${symbol}': '${token}',`);
        });
        console.log('};\n');
        
    })
    .catch(error => {
        console.error('❌ Error fetching instruments:', error.message);
        if (error.message.includes('Invalid session')) {
            console.log('\n💡 Your access token may have expired. Run: node get-access-token.js\n');
        }
    });
