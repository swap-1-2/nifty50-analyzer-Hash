#!/usr/bin/env node

/**
 * Zerodha Access Token Generator
 * Run this script daily to get a fresh access token
 */

const KiteConnect = require('kiteconnect').KiteConnect;
require('dotenv').config();
const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const API_KEY = process.env.KITE_API_KEY || '6ri96x7qvpkfh96c';
const API_SECRET = process.env.KITE_API_SECRET || 'n6b1jfdvkuyrgqdkoyh8wzij5z114c1m';

if (!API_KEY || !API_SECRET) {
    console.error('❌ Error: API_KEY and API_SECRET not found in .env file');
    process.exit(1);
}

const kc = new KiteConnect({
    api_key: API_KEY
});

console.log('\n==============================================');
console.log('🔐 Zerodha Access Token Generator');
console.log('==============================================\n');

// Generate login URL manually since kc.login_url() might not be available
const loginUrl = `https://kite.zerodha.com/connect/login?api_key=${API_KEY}&v=3`;

console.log('📋 STEP 1: Open this URL in your browser:\n');
console.log('🔗 ' + loginUrl);
console.log('\n');

console.log('📋 STEP 2: Login with your Zerodha credentials and authorize the app\n');

console.log('📋 STEP 3: After authorization, you will be redirected to a URL like:');
console.log('   http://localhost:3000/callback?request_token=XXXXX&action=login&status=success\n');

rl.question('📝 Paste the request_token from the URL here: ', async (request_token) => {
    
    request_token = request_token.trim();
    
    if (!request_token || request_token === 'your_access_token_here') {
        console.error('\n❌ Invalid request_token. Please try again.');
        rl.close();
        process.exit(1);
    }
    
    try {
        console.log('\n⏳ Generating access token...\n');
        
        const session = await kc.generateSession(request_token, API_SECRET);
        
        console.log('✅ SUCCESS! Access token generated:\n');
        console.log('🔑 Access Token: ' + session.access_token);
        console.log('\n');
        
        // Update .env file
        const envPath = '.env';
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        // Replace the access token line
        if (envContent.includes('KITE_ACCESS_TOKEN=')) {
            envContent = envContent.replace(
                /KITE_ACCESS_TOKEN=.*/,
                `KITE_ACCESS_TOKEN=${session.access_token}`
            );
        } else {
            envContent += `\nKITE_ACCESS_TOKEN=${session.access_token}\n`;
        }
        
        fs.writeFileSync(envPath, envContent);
        
        console.log('✅ .env file updated successfully!\n');
        console.log('📊 You can now run your app with Zerodha data:');
        console.log('   npm run start:zerodha\n');
        console.log('⚠️  NOTE: This token expires at end of day. Run this script again tomorrow.\n');
        
    } catch (error) {
        console.error('\n❌ Error generating access token:');
        console.error(error.message);
        console.log('\n💡 Common issues:');
        console.log('   - Request token already used (get a new one from login URL)');
        console.log('   - Request token expired (valid for only a few minutes)');
        console.log('   - Wrong API credentials\n');
    }
    
    rl.close();
});
