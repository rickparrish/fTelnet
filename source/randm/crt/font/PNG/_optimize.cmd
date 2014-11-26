@echo off

echo Running PngCrush
for %%f in (*.png) do pngcrush.exe -brute -c 0 -ow -reduce -rem alla -rem text -rem trns "%%f"

echo Running OptiPng 
for %%f in (*.png) do optipng.exe -o7 "%%f"

echo Updating ..\CrtFonts.txt
dir /b *.png > ..\CrtFonts.txt

echo Don't forget to update CrtFonts.ts (if necessary)
pause