@echo off
REM ����Node.js������
echo Starting Node.js server...
start cmd /k "node server-stream.js"

REM ��Google Chrome�����
echo Opening Google Chrome...
start chrome http://localhost:3000

REM ��ʾ���
echo Server started and Chrome opened.
pause