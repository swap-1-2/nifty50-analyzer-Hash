# Zerodha Kite Connect Integration Setup Guide

## Prerequisites
1. Zerodha trading account
2. Kite Connect App created at https://kite.trade/

## Step-by-Step Setup

### 1. Create Kite Connect App
- Go to https://kite.trade/
- Login with your Zerodha credentials
- Click "Create new app"
- Fill in the details:
  - App name: "Nifty50 Stock Analyzer"
  - Redirect URL: http://localhost:3000/callback
  - App type: Connect

### 2. Get API Credentials
After creating the app, you'll get:
- **API Key** (visible immediately)
- **API Secret** (visible immediately)

### 3. Setup Environment File
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```
   KITE_API_KEY=your_api_key_here
   KITE_API_SECRET=your_api_secret_here
   KITE_ACCESS_TOKEN=your_access_token_here
   ```

### 4. Generate Access Token (One-time daily)

**Option A: Using the server endpoint**
1. Start the server:
   ```bash
   node server-zerodha.js
   ```

2. Get login URL:
   - Visit: http://localhost:3000/api/kite/login-url
   - Copy the `loginUrl` and open in browser

3. Login and authorize:
   - Login with your Zerodha credentials
   - Authorize the app
   - You'll be redirected to: http://localhost:3000/callback?request_token=XXXXX&action=login&status=success

4. Copy the `request_token` from URL

5. Generate access token:
   ```bash
   curl -X POST http://localhost:3000/api/kite/session \
     -H "Content-Type: application/json" \
     -d '{"request_token": "YOUR_REQUEST_TOKEN_HERE"}'
   ```

6. Copy the `access_token` and add it to `.env` file

**Option B: Using Python script**
```python
from kiteconnect import KiteConnect

api_key = "your_api_key"
api_secret = "your_api_secret"

kite = KiteConnect(api_key=api_key)
print(kite.login_url())
# Open this URL in browser, login, get request_token from redirect URL

request_token = "request_token_from_url"
data = kite.generate_session(request_token, api_secret=api_secret)
print(data["access_token"])
# Add this to .env file
```

### 5. Get Instrument Tokens (One-time)

After setting up access token:
1. Visit: http://localhost:3000/api/instruments
2. Find your stocks and note their instrument_token
3. Update the `instrumentTokens` mapping in `server-zerodha.js`

Example mapping:
```javascript
const instrumentTokens = {
    'RELIANCE': '738561',
    'TCS': '2953217',
    'HDFCBANK': '341249',
    // ... add all 50 stocks
};
```

### 6. Run the Application

```bash
npm start
```

Or use the Zerodha-enabled server:
```bash
node server-zerodha.js
```

## API Endpoints

### Historical Data
- `GET /api/stock/:symbol` - Get historical data (tries Kite first, falls back to Yahoo)

### Live Quotes
- `GET /api/quote/:symbol` - Get live market quote from Zerodha

### Instruments
- `GET /api/instruments` - Get all NSE instruments with tokens

### Authentication
- `GET /api/kite/login-url` - Get Kite login URL
- `POST /api/kite/session` - Generate access token from request token

## Important Notes

1. **Access Token Expires Daily**: You need to regenerate access token every day
2. **Subscription Required**: Kite Connect requires a paid subscription (₹2000/month)
3. **Rate Limits**: Kite API has rate limits:
   - Historical: 3 requests/second
   - Quotes: 1 request/second
   - Order placement: 10 requests/second

4. **Market Hours**: Live data only available during market hours (9:15 AM - 3:30 PM IST)

5. **Instrument Tokens**: Must be fetched once and mapped correctly

## Troubleshooting

### "Invalid session" error
- Regenerate access token (expires daily)

### "Instrument token not found"
- Update the `instrumentTokens` mapping with correct tokens from /api/instruments

### Data not updating
- Check if market is open
- Verify access token is valid
- Check Kite Connect subscription status

## Pricing

Zerodha Kite Connect charges:
- ₹2,000/month for historical and live data access
- This is separate from your trading charges

## Alternative: Continue with Yahoo Finance

If you don't want to subscribe to Kite Connect, the app will continue working with Yahoo Finance (delayed data). Simply don't add the Kite credentials to `.env` file.
