@echo off
echo 🧪 Testing Telegram Integration...

REM Test 1: Check if server is running
echo 📡 Testing server...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3001' -UseBasicParsing; if ($response.StatusCode -eq 200) { Write-Host '✅ Server is running on port 3001' -ForegroundColor Green } else { Write-Host '❌ Server returned status:' $response.StatusCode -ForegroundColor Red } } catch { Write-Host '❌ Server is not responding' -ForegroundColor Red }"

REM Test 2: Check API endpoints
echo 🔌 Testing API endpoints...
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/v1'; if ($response.message -like '*Bingo Game API*') { Write-Host '✅ API endpoints are working' -ForegroundColor Green } else { Write-Host '❌ API endpoints not responding correctly' -ForegroundColor Red } } catch { Write-Host '❌ API test failed' -ForegroundColor Red }"

REM Test 3: Check Telegram bot info
echo 🤖 Testing Telegram bot...
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:3001/telegram/info'; if ($response.configured -eq $true) { Write-Host '✅ Telegram bot is configured' -ForegroundColor Green } else { Write-Host '❌ Telegram bot not configured' -ForegroundColor Red } } catch { Write-Host '❌ Telegram test failed' -ForegroundColor Red }"

REM Test 4: Check bot token validity
echo 🔑 Testing bot token...
powershell -Command "try { $response = Invoke-RestMethod -Uri 'https://api.telegram.org/bot7833154988:AAEXGyd4QyKwssUxsty2Vw3dR-JExnR_MsA/getMe'; if ($response.result.username -eq 'BlushBingo_bot') { Write-Host '✅ Bot token is valid - @BlushBingo_bot' -ForegroundColor Green } else { Write-Host '❌ Bot token issue' -ForegroundColor Red } } catch { Write-Host '❌ Bot token test failed' -ForegroundColor Red }"

REM Test 5: Check frontend serving
echo 🌐 Testing frontend serving...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3001' -UseBasicParsing; if ($response.Content -like '*<title>*') { Write-Host '✅ Frontend is being served correctly' -ForegroundColor Green } else { Write-Host '❌ Frontend not being served' -ForegroundColor Red } } catch { Write-Host '❌ Frontend test failed' -ForegroundColor Red }"

echo.
echo 🚀 Integration Test Summary:
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🎮 Game URL: http://localhost:3001
echo 🤖 Bot: @BlushBingo_bot
echo 🌐 WebApp Test: http://localhost:3001?gameId=TEST123^&userId=123456^&firstName=TestUser
echo.
echo 📱 To test with Telegram:
echo    1. Search for @BlushBingo_bot in Telegram
echo    2. Send /start command
echo    3. Click 'Create New Game' or 'Join Game'
echo.
echo 🔧 For public testing:
echo    1. Run: ngrok http 3001
echo    2. Update TELEGRAM_WEBAPP_URL in backend/.env with ngrok URL
echo    3. Restart server

pause
