@echo off
chcp 65001 >nul
title Farm Game - Excel to JSON Converter

echo ======================================================
echo      Exporting Excel to JSON configs...
echo ======================================================
echo.

cd /d "%~dp0"
node export_config.js

if %errorlevel% equ 0 goto success
goto error

:success
echo.
echo [SUCCESS] Configs updated in assets/resources/configs/
goto end

:error
echo.
echo [ERROR] Export failed! Check if Excel is open or code error.
goto end

:end
echo.
echo ======================================================
echo Operation complete. Press any key to exit...
pause >nul