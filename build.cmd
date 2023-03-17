@echo off
cls
node node_modules\typescript\bin\tsc --build source %1
node postbuild.js

rem Copy updated files to the embed wizard repo
if exist C:\www\gh-pages\embed-v2.ftelnet.ca\ftelnet\ (
  echo Copying updated files to the embed wizard repo
  copy release\ftelnet*.js C:\www\gh-pages\embed-v2.ftelnet.ca\ftelnet
)