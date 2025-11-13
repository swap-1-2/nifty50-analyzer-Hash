# 🔐 Quick Guide: Get Zerodha Access Token

## Super Simple Method (Recommended)

### Step 1: Run the Helper Script
```bash
node get-access-token.js
```

### Step 2: Follow the Instructions
The script will:
1. Show you a login URL
2. Ask you to open it in your browser
3. After you login and authorize, ask you to paste the `request_token`
4. Automatically generate and save your access token to `.env`

### Step 3: Start the App
```bash
npm run start:zerodha
```

---

## Manual Method (Alternative)

If the script doesn't work, follow these steps manually:

### Step 1: Get the Login URL
Open your terminal and run:
```bash
node -e "const KC = require('kiteconnect').KiteConnect; const kc = new KC({api_key:'6ri96x7qvpkfh96c'}); console.log(kc.login_url())"
```

### Step 2: Open URL in Browser
Copy the URL and open it in your browser. It will look like:
```
https://kite.zerodha.com/connect/login?api_key=6ri96x7qvpkfh96c&v=3
```

### Step 3: Login & Authorize
- Login with your Zerodha credentials
- Click "Authorize" when prompted
- You'll be redirected to a URL like:
  ```
  http://localhost:3000/callback?request_token=abc123xyz&action=login&status=success
  ```

### Step 4: Copy the Request Token
From the redirected URL, copy the `request_token` value (the part after `request_token=` and before `&`)

Example: If URL is `http://localhost:3000/callback?request_token=abc123xyz&action=login`
Then your request_token is: `abc123xyz`

### Step 5: Generate Access Token
Run this command (replace `YOUR_REQUEST_TOKEN` with your actual token):
```bash
node -e "const KC = require('kiteconnect').KiteConnect; const kc = new KC({api_key:'6ri96x7qvpkfh96c'}); kc.generateSession('YOUR_REQUEST_TOKEN', 'n6b1jfdvkuyrgqdkoyh8wzij5z114c1m').then(s => console.log('Access Token:', s.access_token)).catch(e => console.error(e))"
```

### Step 6: Update .env File
Copy the access token from the output and update your `.env` file:
```
KITE_ACCESS_TOKEN=your_generated_access_token_here
```

### Step 7: Start the App
```bash
npm run start:zerodha
```

---

## Important Notes

⏰ **Token Expires Daily**: Access tokens expire at the end of each day. You need to regenerate it daily.

🔄 **Quick Regeneration**: Just run `node get-access-token.js` every morning before market hours.

💡 **Tip**: Create a script or reminder to run this every trading day morning.

---

## Troubleshooting

### "Request token invalid or expired"
- Request tokens are valid for only 5-10 minutes
- Get a new login URL and try again quickly

### "Invalid API credentials"
- Check if your API_KEY and API_SECRET in `.env` are correct
- Go to https://kite.trade/ to verify

### "Session not found"
- Your access token expired (happens daily)
- Regenerate using the script

### Browser shows error page
- Make sure the redirect URL in your Kite app is: `http://localhost:3000/callback`
- The page won't load (that's okay), just copy the URL from address bar

---

## Need Help?

If you get stuck, here's the fastest way:
1. Run: `node get-access-token.js`
2. Copy the URL it shows
3. Open in browser
4. Login
5. Copy the full redirected URL
6. Paste just the `request_token=XXXXX` part when asked
7. Done! 🎉
