@echo off
set SERVER_USER=rd
set SERVER_IP=192.168.16.231
set REMOTE_PATH=/data/www/frontend/report2026
cd /d "d:\Sources\project-dashboard"

echo ========================================================
echo [1/4] DANG BUILD FRONTEND (Vite Production Build)...
echo ========================================================
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [LOI] Build that bai, dung tien trinh deploy!
    pause
    exit /b %ERRORLEVEL%
)

echo ========================================================
echo [2/4] DANG NEN BAN BUILD THANH report2026.tar.gz...
echo ========================================================
tar -czf report2026.tar.gz -C dist .

echo ========================================================
echo [3/4] DANG DAY GOI NEN LEN SERVER...
echo ========================================================
scp report2026.tar.gz %SERVER_USER%@%SERVER_IP%:/tmp/

echo ========================================================
echo [4/4] XOA BAN CU & REPLACE SACH SE VAO report2026...
echo ========================================================
ssh %SERVER_USER%@%SERVER_IP% "mkdir -p %REMOTE_PATH% && rm -rf %REMOTE_PATH%/* && tar -xzf /tmp/report2026.tar.gz -C %REMOTE_PATH% && rm -f /tmp/report2026.tar.gz"

del report2026.tar.gz

echo ========================================================
echo [XONG] FOLDER report2026 TREN SERVER DA DUOC REPLACED 100%!
echo ========================================================
timeout /t 3