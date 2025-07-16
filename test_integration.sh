#!/bin/bash

# Test script for Telegram integration
echo "🧪 Testing Telegram Integration..."

# Test 1: Check if server is running
echo "📡 Testing server..."
SERVER_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001)
if [ "$SERVER_RESPONSE" = "200" ]; then
    echo "✅ Server is running on port 3001"
else
    echo "❌ Server is not responding (HTTP $SERVER_RESPONSE)"
    exit 1
fi

# Test 2: Check API endpoints
echo "🔌 Testing API endpoints..."
API_RESPONSE=$(curl -s http://localhost:3001/api/v1)
if echo "$API_RESPONSE" | grep -q "Bingo Game API"; then
    echo "✅ API endpoints are working"
else
    echo "❌ API endpoints not responding correctly"
fi

# Test 3: Check Telegram bot info
echo "🤖 Testing Telegram bot..."
TELEGRAM_RESPONSE=$(curl -s http://localhost:3001/telegram/info)
if echo "$TELEGRAM_RESPONSE" | grep -q "configured"; then
    echo "✅ Telegram bot is configured"
else
    echo "❌ Telegram bot not configured"
fi

# Test 4: Check bot token validity
echo "🔑 Testing bot token..."
BOT_RESPONSE=$(curl -s "https://api.telegram.org/bot7833154988:AAEXGyd4QyKwssUxsty2Vw3dR-JExnR_MsA/getMe")
if echo "$BOT_RESPONSE" | grep -q "BlushBingo"; then
    echo "✅ Bot token is valid - @BlushBingo_bot"
else
    echo "❌ Bot token is invalid or bot is not accessible"
fi

# Test 5: Check frontend serving
echo "🌐 Testing frontend serving..."
FRONTEND_RESPONSE=$(curl -s http://localhost:3001 | grep -o '<title>.*</title>')
if [ ! -z "$FRONTEND_RESPONSE" ]; then
    echo "✅ Frontend is being served correctly"
    echo "   $FRONTEND_RESPONSE"
else
    echo "❌ Frontend not being served"
fi

# Test 6: Test with Telegram WebApp parameters
echo "🔗 Testing Telegram WebApp URL..."
WEBAPP_URL="http://localhost:3001?gameId=TEST123&userId=123456&firstName=TestUser"
WEBAPP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$WEBAPP_URL")
if [ "$WEBAPP_RESPONSE" = "200" ]; then
    echo "✅ WebApp URL responds correctly"
else
    echo "❌ WebApp URL not working (HTTP $WEBAPP_RESPONSE)"
fi

echo ""
echo "🚀 Integration Test Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎮 Game URL: http://localhost:3001"
echo "🤖 Bot: @BlushBingo_bot"
echo "🌐 WebApp Test: $WEBAPP_URL"
echo ""
echo "📱 To test with Telegram:"
echo "   1. Search for @BlushBingo_bot in Telegram"
echo "   2. Send /start command"
echo "   3. Click 'Create New Game' or 'Join Game'"
echo ""
echo "🔧 For public testing:"
echo "   1. Run: ngrok http 3001"
echo "   2. Update TELEGRAM_WEBAPP_URL in backend/.env with ngrok URL"
echo "   3. Restart server"
