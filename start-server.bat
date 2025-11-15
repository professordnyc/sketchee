@echo off
echo Starting Sketchee MVP Server...
echo.
echo Server will run at: http://localhost:8080
echo Main app: http://localhost:8080/index-final.html
echo.
echo Press Ctrl+C to stop the server
echo.

REM Try different server options
if exist "node_modules" (
    echo Using npm http-server...
    npx http-server . -p 8080 -o -c-1
) else if exist "C:\Program Files\Python311\python.exe" (
    echo Using Python server...
    python -m http.server 8080
) else if exist "C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python311\python.exe" (
    echo Using Python server...
    python -m http.server 8080
) else (
    echo.
    echo No server found. Please:
    echo 1. Install Node.js and run: npm install
    echo 2. Or install Python 3
    echo 3. Or open index-final.html directly in browser
    echo.
    pause
)
