@echo off
REM 启动Node.js服务器
echo Starting Node.js server...
start cmd /k "node server-stream.js"

REM 打开Google Chrome浏览器
echo Opening Google Chrome...
start chrome http://localhost:3000

REM 提示完成
echo Server started and Chrome opened.
pause