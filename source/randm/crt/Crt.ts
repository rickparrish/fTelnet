/*
  HtmlTerm: An HTML5 WebSocket client
  Copyright (C) 2009-2013  Rick Parrish, R&M Software

  This file is part of HtmlTerm.

  HtmlTerm is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  any later version.

  HtmlTerm is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with HtmlTerm.  If not, see <http://www.gnu.org/licenses/>.
*/
var Crt = function () { }; // Do nothing
var TCrt = function () {
    /// <summary>
    /// A class for manipulating a console window
    /// Compatibility with the Borland Pascal CRT unit was attempted, along with a few new additions
    /// </summary>

    /*  Color Constants
    ¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯
    Use these color constants with SetPalette, SetAllPalette, TextColor, and
    TextBackground:
    */
    this.BLACK = 0;
    this.BLUE = 1;
    this.GREEN = 2;
    this.CYAN = 3;
    this.RED = 4;
    this.MAGENTA = 5;
    this.BROWN = 6;
    this.LIGHTGRAY = 7;
    this.DARKGRAY = 8;
    this.LIGHTBLUE = 9;
    this.LIGHTGREEN = 10;
    this.LIGHTCYAN = 11;
    this.LIGHTRED = 12;
    this.LIGHTMAGENTA = 13;
    this.YELLOW = 14;
    this.WHITE = 15;
    this.BLINK = 128;

    this.PETSCII_BLACK = 0;
    this.PETSCII_WHITE = 1;
    this.PETSCII_RED = 2;
    this.PETSCII_CYAN = 3;
    this.PETSCII_PURPLE = 4;
    this.PETSCII_GREEN = 5;
    this.PETSCII_BLUE = 6;
    this.PETSCII_YELLOW = 7;
    this.PETSCII_ORANGE = 8;
    this.PETSCII_BROWN = 9;
    this.PETSCII_LIGHTRED = 10;
    this.PETSCII_DARKGRAY = 11;
    this.PETSCII_GRAY = 12;
    this.PETSCII_LIGHTGREEN = 13;
    this.PETSCII_LIGHTBLUE = 14;
    this.PETSCII_LIGHTGRAY = 15;

    /* Private variables */
    var that = this;
    var FAtari;
    var FATASCIIEscaped;
    var FBitmap;
    var FBlink;
    var FBlinkHidden;
    var FBuffer;
    var FC64;
    var FCanvas;
    var FCharInfo;
    var FContext;
    var FCursor;
    var FFlushBeforeWritePETSCII;
    var FFont;
    var FInScrollBack;
    var FKeyBuf;
    var FLastChar;
    var FLocalEcho;
    var FScreenSize;
    var FScrollBack;
    var FScrollBackPosition;
    var FScrollBackSize;
    var FScrollBackTemp;
    var FWindMin;
    var FWindMax;

    // Sigh: Chrome 7.0.517 stable has a canvas problem.
    // http://code.google.com/p/chromium/issues/detail?id=60336
    var brokenCanvasUpdate = (navigator.userAgent.toLowerCase().indexOf("chrome/7.0.517") !== -1);

    // Private methods
    var InitBuffers = function (AInitScrollBack) { }; // Do nothing
    var OnBlinkHide = function (e) { }; // Do nothing
    var OnBlinkShow = function (e) { }; // Do nothing
    var OnFontChanged = function (e) { }; // Do nothing
    var OnKeyDown = function (ke) { }; // Do nothing
    var OnKeyPress = function (ke) { }; // Do nothing

    Array.prototype.InitTwoDimensions = function (y, x) {
        var i;
        for (i = 0; i <= y; i++) {
            this[i] = [x + 1];
        }
    };

    this.Init = function (AParent) {
        // Init variables
        FAtari = false;
        FATASCIIEscaped = false;
        // FBitmap
        FBlink = true;
        FBlinkHidden = false;
        // FBuffer
        FC64 = false;
        // FCanvas
        FCharInfo = new TCharInfo(" ", that.LIGHTGRAY, false, false, false);
        // FCursor
        FFlushBeforeWritePETSCII = [0x05, 0x07, 0x08, 0x09, 0x0A, 0x0D, 0x0E, 0x11, 0x12, 0x13, 0x14, 0x1c, 0x1d, 0x1e, 0x1f, 0x81, 0x8d, 0x8e, 0x90, 0x91, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0x9b, 0x9c, 0x9d, 0x9e, 0x9f];
        FFont = new TFont();
        FFont.onchange = OnFontChanged;
        FInScrollBack = false;
        FKeyBuf = [];
        FLastChar = 0;
        FLocalEcho = false;
        FScreenSize = new Point(80, 25);
        // FScrollBack
        FScrollBackPosition = -1;
        FScrollBackSize = 1000;
        // FScrollBackTemp
        // FWindMin
        // FWindMax

        // Create the canvas
        FCanvas = document.createElement('canvas');
        FCanvas.id = "HtmlTermCanvas";
        FCanvas.innerHTML = 'Your browser does not support the HTML5 Canvas element!<br>The latest version of every major web browser supports this element, so please consider upgrading now:<ul><li><a href="http://www.mozilla.com/firefox/">Mozilla Firefox</a></li><li><a href="http://www.google.com/chrome">Google Chrome</a></li><li><a href="http://www.apple.com/safari/">Apple Safari</a></li><li><a href="http://www.opera.com/">Opera</a></li><li><a href="http://windows.microsoft.com/en-US/internet-explorer/products/ie/home">MS Internet Explorer</a></li></ul>';
        FCanvas.width = FFont.Width * FScreenSize.x;
        FCanvas.height = FFont.Height * FScreenSize.y;
        AParent.appendChild(FCanvas);

        if (!FCanvas.getContext) {
            trace("HtmlTerm Error: Canvas not supported");
            return false;
        }

        // Register keydown and keypress handlers
        window.addEventListener("keydown", OnKeyDown, false); // For special keys
        window.addEventListener("keypress", OnKeyPress, false); // For regular keys

        // Reset the screen buffer
        InitBuffers(true);

        // Create the cursor
        FCursor = new TCursor(AParent, FFont.ANSI_COLOURS[that.LIGHTGRAY], FFont.Size);
        FCursor.onhide = OnBlinkHide;
        FCursor.onshow = OnBlinkShow;

        // Update the WindMin/WindMax records
        FWindMin = 0;
        FWindMax = (FScreenSize.x - 1) | ((FScreenSize.y - 1) << 8);

        // Create the context
        FContext = FCanvas.getContext('2d');
        FContext.font = '12pt monospace';
        FContext.textBaseline = 'top';
        that.ClrScr();

        return true;
    };

    this.__defineGetter__("Atari", function () {
        return FAtari;
    });

    this.__defineSetter__("Atari", function (AAtari) {
        FAtari = AAtari;
    });

    this.Beep = function () {
        /*TODO
        var Duration = 44100 * 0.3; // 0.3 = 300ms
        var Frequency = 440; // 440hz

        */
    };

    this.__defineGetter__("bitmapData", function () {
        return FBitmap.bitmapData;
    });

    this.__defineGetter__("Blink", function () {
        return FBlink;
    });

    this.__defineSetter__("Blink", function (ABlink) {
        FBlink = ABlink;
    });

    this.__defineGetter__("C64", function () {
        return FC64;
    });

    this.__defineSetter__("C64", function (AC64) {
        FC64 = AC64;
    });

    this.__defineGetter__("Canvas", function () {
        return FCanvas;
    });

    this.ClrBol = function () {
        /// <summary>
        /// Clears all characters from the cursor position to the start of the line
        /// without moving the cursor.
        /// </summary>
        /// <remarks>
        /// All character positions are set to blanks with the currently defined text
        /// attributes. Thus, if TextBackground is not black, the current cursor
        /// position to the left edge becomes the background color.
        ///
        /// ClrBol is window-relative.
        /// </remarks>
        that.FastWrite(StringUtils.NewString(' ', that.WhereX()), that.WindMinX + 1, that.WhereYA(), FCharInfo);
    };

    this.ClrBos = function () {
        /// <summary>
        /// Clears the active window from the cursor's current line to the start of the window
        /// </summary>
        /// <remarks>
        /// Sets all character positions from the cursor's current line to the start of the window
        /// to blanks with the currently defined text attributes. Thus, if TextBackground is not
        /// black, the entire screen becomes the background color. This also applies to characters 
        /// cleared by ClrEol, InsLine, and DelLine, and to empty lines created by scrolling.
        ///
        /// ClrBos is window-relative.
        /// </remarks>
        // Clear rows before current row
        that.ScrollUpWindow(that.WhereY() - 1);
        that.ScrollDownWindow(that.WhereY() - 1);
        // Clear start of current row
        that.ClrBol();
    };

    this.ClrEol = function () {
        /// <summary>
        /// Clears all characters from the cursor position to the end of the line
        /// without moving the cursor.
        /// </summary>
        /// <remarks>
        /// All character positions are set to blanks with the currently defined text
        /// attributes. Thus, if TextBackground is not black, the current cursor
        /// position to the right edge becomes the background color.
        ///
        /// ClrEol is window-relative.
        /// </remarks>
        that.FastWrite(StringUtils.NewString(' ', (that.WindMaxX + 1) - that.WhereX() + 1), that.WhereXA(), that.WhereYA(), FCharInfo);
    };

    this.ClrEos = function () {
        /// <summary>
        /// Clears the active window from the cursor's current line to the end of the window
        /// </summary>
        /// <remarks>
        /// Sets all character positions from the cursor's current line to the end of the window
        /// to blanks with the currently defined text attributes. Thus, if TextBackground is not
        /// black, the entire screen becomes the background color. This also applies to characters 
        /// cleared by ClrEol, InsLine, and DelLine, and to empty lines created by scrolling.
        ///
        /// ClrEos is window-relative.
        /// </remarks>
        // Clear rows after current row
        that.ScrollDownWindow(that.WindRows - that.WhereY());
        that.ScrollUpWindow(that.WindRows - that.WhereY());
        // Clear rest of current row
        that.ClrEol();
    };

    this.ClrLine = function () {
        /// <summary>
        /// Clears all characters from the cursor position's current line
        /// without moving the cursor.
        /// </summary>
        /// <remarks>
        /// All character positions are set to blanks with the currently defined text
        /// attributes. Thus, if TextBackground is not black, the current cursor
        /// position's line becomes the background color.
        ///
        /// ClrLine is window-relative.
        /// </remarks>
        that.FastWrite(StringUtils.NewString(' ', that.WindCols), that.WindMinX + 1, that.WhereYA(), FCharInfo);
    };

    this.ClrScr = function () {
        /// <summary>
        /// Clears the active windows and returns the cursor to the upper-left corner.
        /// </summary>
        /// <remarks>
        /// Sets all character positions to blanks with the currently defined text
        /// attributes. Thus, if TextBackground is not black, the entire screen becomes
        /// the background color. This also applies to characters cleared by ClrEol,
        /// InsLine, and DelLine, and to empty lines created by scrolling.
        ///
        /// ClrScr is window-relative.
        /// </remarks>
        that.ScrollUpWindow(that.WindRows);
        that.GotoXY(1, 1);
    };

    this.Conceal = function () {
        // Set the foreground to the background
        that.TextColor((that.TextAttr & 0xF0) >> 4);
    };

    this.__defineGetter__("Cursor", function () {
        return FCursor;
    });

    this.DelChar = function (AChars) {
        if (AChars === undefined) { AChars = 1; }

        var i;
        for (i = that.WhereXA() ; i <= that.WindMinX + that.WindCols - AChars; i++) {
            that.FastWrite(FBuffer[that.WhereYA()][i + AChars].Ch, i, that.WhereYA(), FBuffer[that.WhereYA()][i + AChars]);
        }
        for (i = that.WindMinX + that.WindCols + 1 - AChars; i <= that.WindMinX + that.WindCols; i++) {
            that.FastWrite(" ", i, that.WhereYA(), FCharInfo);
        }
    };

    this.DelLine = function (ALines) {
        /// <summary>
        /// Deletes the line containing the cursor.
        /// </summary>
        /// <remarks>
        /// The line containing the cursor is deleted, and all lines below are moved one
        /// line up (using the BIOS scroll routine). A new line is added at the bottom.
        ///
        /// All character positions are set to blanks with the currently defined text
        /// attributes. Thus, if TextBackground is not black, the new line becomes the
        /// background color.
        /// </remarks>
        if (ALines === undefined) { ALines = 1; }
        that.ScrollUpCustom(that.WindMinX + 1, that.WhereYA(), that.WindMaxX + 1, that.WindMaxY + 1, ALines, FCharInfo);
    };

    this.EnterScrollBack = function () {
        if (!FInScrollBack) {
            FInScrollBack = true;

            var NewRow;
            var X;
            var Y;

            // Make copy of current scrollback buffer in temp scrollback buffer
            FScrollBackTemp = [];
            for (Y = 0; Y < FScrollBack.length; Y++) {
                NewRow = [];
                for (X = 0; X < FScrollBack[Y].length; X++) {
                    NewRow.push(new TCharInfo(FScrollBack[Y][X].Ch, FScrollBack[Y][X].Attr, FScrollBack[Y][X].Blink, FScrollBack[Y][X].Underline, FScrollBack[Y][X].Reverse));
                }
                FScrollBackTemp.push(NewRow);
            }

            // Add current screen to temp scrollback buffer
            var YOffset = FScrollBackTemp.length - 1;
            for (Y = 1; Y <= FScreenSize.y; Y++) {
                NewRow = [];
                for (X = 1; X <= FScreenSize.x; X++) {
                    NewRow.push(new TCharInfo(FBuffer[Y][X].Ch, FBuffer[Y][X].Attr, FBuffer[Y][X].Blink, FBuffer[Y][X].Underline, FBuffer[Y][X].Reverse));
                }
                FScrollBackTemp.push(NewRow);
            }

            // Set our position in the scrollback
            FScrollBackPosition = FScrollBackTemp.length;

            // Display footer showing we're in scrollback mode 
            that.ScrollUpCustom(1, 1, FScreenSize.x, FScreenSize.y, 1, new TCharInfo(" ", 31, false, false, false), false);
            that.FastWrite("SCROLLBACK (" + (FScrollBackPosition - (FScreenSize.y - 1) + 1) + "/" + (FScrollBackTemp.length - (FScreenSize.y - 1) + 1) + "): Use Up/Down or PgUp/PgDn to navigate and Esc when done", 1, FScreenSize.y, new TCharInfo(" ", 31, false, false, false), false);
        }
    };

    this.FastWrite = function (AText, AX, AY, ACharInfo, AUpdateBuffer) {
        /// <summary>
        /// Writes a string of text at the desired X/Y coordinate with the given text attribute.
        /// 
        /// FastWrite is not window-relative, and it does not wrap text that goes beyond the right edge of the screen.
        /// </summary>
        /// <param name="AText" type="String">The text to write</param>
        /// <param name="AX" type="Number" integer="true">The 1-based column to start the text</param>
        /// <param name="AY" type="Number" integer="true">The 1-based row to start the text</param>
        /// <param name="ACharInfo" type="TCharInfo">The text attribute to colour the text</param>
        /// <param name="AUpdateBuffer" type="Boolean" optional="true">Whether to update the internal buffer or not (default is true)</param>
        if (AUpdateBuffer === undefined) { AUpdateBuffer = true; }

        if ((AX <= FScreenSize.x) && (AY <= FScreenSize.y)) {
            var i;
            for (i = 0; i < AText.length; i++) {
                var Char = FFont.GetChar(AText.charCodeAt(i), ACharInfo);
                if (Char) {
                    if ((!FInScrollBack) || (FInScrollBack && !AUpdateBuffer)) {
                        FContext.putImageData(Char, (AX - 1 + i) * FFont.Width, (AY - 1) * FFont.Height);
                    }
                }

                if (AUpdateBuffer) {
                    FBuffer[AY][AX + i].Ch = AText.charAt(i);
                    FBuffer[AY][AX + i].Attr = ACharInfo.Attr;
                    FBuffer[AY][AX + i].Blink = ACharInfo.Blink;
                    FBuffer[AY][AX + i].Underline = ACharInfo.Underline;
                    FBuffer[AY][AX + i].Reverse = ACharInfo.Reverse;
                }

                if (AX + i >= FScreenSize.x) { break; }
            }
        }
    };

    this.FillScreen = function (AChar) {
        var Line = StringUtils.NewString(AChar.charAt(0), that.ScreenCols);

        var Y;
        for (Y = 1; Y <= that.ScreenRows; Y++) {
            that.FastWrite(Line, 1, Y, FCharInfo);
        }
    };

    this.__defineGetter__("Font", function () {
        return FFont;
    });

    this.GetCharInfo = function () {
        return FCharInfo;
    };

    this.GotoXY = function (AX, AY) {
        /// <summary>
        /// Moves the cursor to the given coordinates within the virtual screen.
        /// </summary>
        /// <remarks>
        /// The upper-left corner of the virtual screen corresponds to (1, 1).
        /// 
        /// GotoXY is window-relative.
        /// </remarks>
        /// <param name="AX">The 1-based column to move to</param>
        /// <param name="AY">The 1-based row to move to</param>
        if ((AX >= 1) && (AY >= 1) && ((AX - 1 + that.WindMinX) <= that.WindMaxX) && ((AY - 1 + that.WindMinY) <= that.WindMaxY)) {
            FCursor.Position = new Point(AX, AY);
        }
    };

    this.HideCursor = function () {
        FCursor.Visible = false;
    };

    this.HighVideo = function () {
        /// <summary>
        /// Selects high-intensity characters.
        /// </summary>
        /// <remarks>
        /// There is a Byte variable in Crt TextAttr that is used to hold the current
        /// video attribute. HighVideo sets the high intensity bit of TextAttr's
        /// fore-ground color, thus mapping colors 0-7 onto colors 8-15.
        /// </remarks>
        that.TextAttr |= 0x08;
    };

    // Have to do this here because the static constructor doesn't seem to like the X and Y variables
    InitBuffers = function (AInitScrollBack) {
        FBuffer = [];
        FBuffer.InitTwoDimensions(FScreenSize.y, FScreenSize.x);

        var X;
        var Y;
        for (Y = 1; Y <= FScreenSize.y; Y++) {
            for (X = 1; X <= FScreenSize.x; X++) {
                FBuffer[Y][X] = new TCharInfo(" ", that.LIGHTGRAY, false, false, false);
            }
        }

        if (AInitScrollBack) {
            FScrollBack = [];
        }
    };

    this.InsChar = function (AChars) {
        if (AChars === undefined) { AChars = 1; }

        var i;
        for (i = that.WindMinX + that.WindCols; i >= that.WhereXA() + AChars; i--) {
            that.FastWrite(FBuffer[that.WhereYA()][i - AChars].Ch, i, that.WhereYA(), FBuffer[that.WhereYA()][i - AChars]);
        }
        for (i = that.WhereXA() ; i < that.WhereXA() + AChars; i++) {
            that.FastWrite(" ", i, that.WhereYA(), FCharInfo);
        }
    };

    this.InsLine = function (ALines) {
        /// <summary>
        /// Inserts an empty line at the cursor position.
        /// </summary>
        /// <remarks>
        /// All lines below the inserted line are moved down one line, and the bottom
        /// line scrolls off the screen (using the BIOS scroll routine).
        ///
        /// All character positions are set to blanks with the currently defined text
        /// attributes. Thus, if TextBackground is not black, the new line becomes the
        /// background color.
        /// 
        /// InsLine is window-relative.
        /// </remarks>
        if (ALines === undefined) { ALines = 1; }
        that.ScrollDownCustom(that.WindMinX + 1, that.WhereYA(), that.WindMaxX + 1, that.WindMaxY + 1, ALines, FCharInfo);

    };

    this.KeyPressed = function () {
        return (FKeyBuf.length > 0);
    };

    this.__defineSetter__("LocalEcho", function (ALocalEcho) {
        FLocalEcho = ALocalEcho;
    });

    this.LowVideo = function () {
        /// <summary>
        /// Selects low intensity characters.
        /// </summary>
        /// <remarks>
        /// There is a Byte variable in Crt--TextAttr--that holds the current video
        /// attribute. LowVideo clears the high-intensity bit of TextAttr's foreground
        /// color, thus mapping colors 8 to 15 onto colors 0 to 7.
        /// </remarks>
        that.TextAttr &= 0xF7;
    };

    this.NormVideo = function () {
        /// <summary>
        /// Selects the original text attribute read from the cursor location at startup.
        /// </summary>
        /// <remarks>
        /// There is a Byte variable in Crt--TextAttr--that holds the current video
        /// attribute. NormVideo restores TextAttr to the value it had when the program
        /// was started.
        /// </remarks>
        if (FC64) {
            FCharInfo.Attr = that.PETSCII_WHITE;
        } else {
            FCharInfo.Attr = that.LIGHTGRAY;
        }
        FCharInfo.Blink = false;
        FCharInfo.Underline = false;
        FCharInfo.Reverse = false;
    };

    OnBlinkHide = function (e) {
        // Only hide the text if blink is enabled
        if (FBlink) {
            FBlinkHidden = true;

            var X;
            var Y;
            for (Y = 1; Y <= FScreenSize.y; Y++) {
                for (X = 1; X <= FScreenSize.x; X++) {
                    if (FBuffer[Y][X].Blink) {
                        if (FBuffer[Y][X].Ch !== " ") {
                            that.FastWrite(" ", X, Y, FBuffer[Y][X], false);
                        }
                    }
                }
            }
        }

        // Fix for broken Chrome
        if (brokenCanvasUpdate) { Crt.Canvas.style.opacity = 0.999; }
    };

    OnBlinkShow = function (e) {
        // Show the text if blink is enabled, or we need a reset (which happens when blink is diabled while in the hidden state)
        if (FBlink || FBlinkHidden) {
            FBlinkHidden = false;

            var X;
            var Y;
            for (Y = 1; Y <= FScreenSize.y; Y++) {
                for (X = 1; X <= FScreenSize.x; X++) {
                    if (FBuffer[Y][X].Blink) {
                        if (FBuffer[Y][X].Ch !== " ") {
                            that.FastWrite(FBuffer[Y][X].Ch, X, Y, FBuffer[Y][X], false);
                        }
                    }
                }
            }
        }

        // Reposition the cursor
        FCursor.WindowOffset = getElementPosition(FCanvas);

        // Fix for broken Chrome
        if (brokenCanvasUpdate) { Crt.Canvas.style.opacity = 1; }
    };

    OnFontChanged = function (e) {
        // Resize the cursor
        FCursor.Size = FFont.Size;

        // Update the bitmap
        FCanvas.height = FFont.Height * FScreenSize.y;
        FCanvas.width = FFont.Width * FScreenSize.x;

        // Restore the screen contents
        var X;
        var Y;
        if (FBuffer !== null) {
            for (Y = 1; Y <= FScreenSize.y; Y++) {
                for (X = 1; X <= FScreenSize.x; X++) {
                    that.FastWrite(FBuffer[Y][X].Ch, X, Y, FBuffer[Y][X], false);
                }
            }
        }
    };

    OnKeyDown = function (ke) {
        // Skip out if we've focused an input element
        if ((ke.target instanceof HTMLInputElement) || (ke.target instanceof HTMLTextAreaElement)) { return; }

        if (FInScrollBack) {
            var i;
            var X;
            var XEnd;
            var Y;
            var YDest;
            var YSource;

            if (ke.keyCode === Keyboard.DOWN) {
                if (FScrollBackPosition < FScrollBackTemp.length) {
                    FScrollBackPosition += 1;
                    that.ScrollUpCustom(1, 1, FScreenSize.x, FScreenSize.y - 1, 1, new TCharInfo(' ', 7, false, false, false), false);
                    that.FastWrite("SCROLLBACK (" + (FScrollBackPosition - (FScreenSize.y - 1) + 1) + "/" + (FScrollBackTemp.length - (FScreenSize.y - 1) + 1) + "): Use Up/Down or PgUp/PgDn to navigate and Esc when done ", 1, FScreenSize.y, new TCharInfo(' ', 31), false);

                    YDest = FScreenSize.y - 1;
                    YSource = FScrollBackPosition - 1;
                    XEnd = Math.min(FScreenSize.x, FScrollBackTemp[YSource].length);
                    for (X = 0; X < XEnd; X++) {
                        that.FastWrite(FScrollBackTemp[YSource][X].Ch, X + 1, YDest, FScrollBackTemp[YSource][X], false);
                    }
                }
            } else if (ke.keyCode === Keyboard.ESCAPE) {
                // Restore the screen contents
                if (FBuffer !== null) {
                    for (Y = 1; Y <= FScreenSize.y; Y++) {
                        for (X = 1; X <= FScreenSize.x; X++) {
                            that.FastWrite(FBuffer[Y][X].Ch, X, Y, FBuffer[Y][X], false);
                        }
                    }
                }

                FInScrollBack = false;
            } else if (ke.keyCode === Keyboard.PAGE_DOWN) {
                for (i = 0; i < (FScreenSize.y - 1) ; i++) {
                    // TODO Not working
                    OnKeyDown(new KeyboardEvent("keydown", true, false, 0, Keyboard.DOWN));
                }
            } else if (ke.keyCode === Keyboard.PAGE_UP) {
                for (i = 0; i < (FScreenSize.y - 1) ; i++) {
                    // TODO Not working
                    OnKeyDown(new KeyboardEvent("keydown", true, false, 0, Keyboard.UP));
                }
            } else if (ke.keyCode === Keyboard.UP) {
                if (FScrollBackPosition > (FScreenSize.y - 1)) {
                    FScrollBackPosition -= 1;
                    that.ScrollDownCustom(1, 1, FScreenSize.x, FScreenSize.y - 1, 1, new TCharInfo(" ", 7, false, false), false);
                    that.FastWrite("SCROLLBACK (" + (FScrollBackPosition - (FScreenSize.y - 1) + 1) + "/" + (FScrollBackTemp.length - (FScreenSize.y - 1) + 1) + "): Use Up/Down or PgUp/PgDn to navigate and Esc when done ", 1, FScreenSize.y, new TCharInfo(' ', 31), false);

                    YDest = 1;
                    YSource = FScrollBackPosition - (FScreenSize.y - 1);
                    XEnd = Math.min(FScreenSize.x, FScrollBackTemp[YSource].length);
                    for (X = 0; X < XEnd; X++) {
                        that.FastWrite(FScrollBackTemp[YSource][X].Ch, X + 1, YDest, FScrollBackTemp[YSource][X], false);
                    }
                }
            }

            ke.preventDefault();

            return;
        }

        var keyString = "";

        if (FAtari) {
            if (ke.ctrlKey) {
                if ((ke.keyCode >= 65) && (ke.keyCode <= 90)) {
                    switch (ke.keyCode) {
                        case 72: keyString = String.fromCharCode(126); break; // CTRL-H
                        case 74: keyString = String.fromCharCode(13); break; // CTRL-J
                        case 77: keyString = String.fromCharCode(155); break; // CTRL-M
                        default: keyString = String.fromCharCode(ke.keyCode - 64); break;
                    }
                }
                else if ((ke.keyCode >= 97) && (ke.keyCode <= 122)) {
                    switch (ke.keyCode) {
                        case 104: keyString = String.fromCharCode(126); break; // CTRL-H
                        case 106: keyString = String.fromCharCode(13); break; // CTRL-J
                        case 109: keyString = String.fromCharCode(155); break; // CTRL-M
                        default: keyString = String.fromCharCode(ke.keyCode - 96); break;
                    }
                }
            } else {
                switch (ke.keyCode) {
                    // Handle special keys                                                                                                  
                    case Keyboard.BACKSPACE: keyString = "\x7E"; break;
                    case Keyboard.DELETE: keyString = "\x7E"; break;
                    case Keyboard.DOWN: keyString = "\x1D"; break;
                    case Keyboard.ENTER: keyString = "\x9B"; break;
                    case Keyboard.LEFT: keyString = "\x1E"; break;
                    case Keyboard.RIGHT: keyString = "\x1F"; break;
                    case Keyboard.SPACE: keyString = " "; break;
                    case Keyboard.TAB: keyString = "\x7F"; break;
                    case Keyboard.UP: keyString = "\x1C"; break;
                }
            }
        } else if (FC64) {
            switch (ke.keyCode) {
                // Handle special keys                                                                                                  
                case Keyboard.BACKSPACE: keyString = "\x14"; break;
                case Keyboard.DELETE: keyString = "\x14"; break;
                case Keyboard.DOWN: keyString = "\x11"; break;
                case Keyboard.ENTER: keyString = "\r"; break;
                case Keyboard.F1: keyString = "\x85"; break;
                case Keyboard.F2: keyString = "\x89"; break;
                case Keyboard.F3: keyString = "\x86"; break;
                case Keyboard.F4: keyString = "\x8A"; break;
                case Keyboard.F5: keyString = "\x87"; break;
                case Keyboard.F6: keyString = "\x8B"; break;
                case Keyboard.F7: keyString = "\x88"; break;
                case Keyboard.F8: keyString = "\x8C"; break;
                case Keyboard.HOME: keyString = "\x13"; break;
                case Keyboard.INSERT: keyString = "\x94"; break;
                case Keyboard.LEFT: keyString = "\x9D"; break;
                case Keyboard.RIGHT: keyString = "\x1D"; break;
                case Keyboard.SPACE: keyString = " "; break;
                case Keyboard.UP: keyString = "\x91"; break;
            }
        } else {
            if (ke.ctrlKey) {
                // Handle control + letter keys
                if ((ke.keyCode >= 65) && (ke.keyCode <= 90)) {
                    keyString = String.fromCharCode(ke.keyCode - 64);
                }
                else if ((ke.keyCode >= 97) && (ke.keyCode <= 122)) {
                    keyString = String.fromCharCode(ke.keyCode - 96);
                }
            } else {
                switch (ke.keyCode) {
                    // Handle special keys                                                                                                  
                    case Keyboard.BACKSPACE: keyString = "\b"; break;
                    case Keyboard.DELETE: keyString = "\x7F"; break;
                    case Keyboard.DOWN: keyString = "\x1B[B"; break;
                    case Keyboard.END: keyString = "\x1B[K"; break;
                    case Keyboard.ENTER: keyString = "\r\n"; break;
                    case Keyboard.ESCAPE: keyString = "\x1B"; break;
                    case Keyboard.F1: keyString = "\x1BOP"; break;
                    case Keyboard.F2: keyString = "\x1BOQ"; break;
                    case Keyboard.F3: keyString = "\x1BOR"; break;
                    case Keyboard.F4: keyString = "\x1BOS"; break;
                    case Keyboard.F5: keyString = "\x1BOt"; break;
                    case Keyboard.F6: keyString = "\x1B[17~"; break;
                    case Keyboard.F7: keyString = "\x1B[18~"; break;
                    case Keyboard.F8: keyString = "\x1B[19~"; break;
                    case Keyboard.F9: keyString = "\x1B[20~"; break;
                    case Keyboard.F10: keyString = "\x1B[21~"; break;
                    case Keyboard.F11: keyString = "\x1B[23~"; break;
                    case Keyboard.F12: keyString = "\x1B[24~"; break;
                    case Keyboard.HOME: keyString = "\x1B[H"; break;
                    case Keyboard.INSERT: keyString = "\x1B@"; break;
                    case Keyboard.LEFT: keyString = "\x1B[D"; break;
                    case Keyboard.PAGE_DOWN: keyString = "\x1B[U"; break;
                    case Keyboard.PAGE_UP: keyString = "\x1B[V"; break;
                    case Keyboard.RIGHT: keyString = "\x1B[C"; break;
                    case Keyboard.SPACE: keyString = " "; break;
                    case Keyboard.TAB: keyString = "\t"; break;
                    case Keyboard.UP: keyString = "\x1B[A"; break;
                }
            }
        }

        FKeyBuf.push(new KeyPressEvent(ke, keyString));

        if ((keyString) || (ke.ctrlKey)) {
            ke.preventDefault();
        }
    };

    OnKeyPress = function (ke) {
        // Skip out if we've focused an input element
        if ((ke.target instanceof HTMLInputElement) || (ke.target instanceof HTMLTextAreaElement)) { return; }

        if (FInScrollBack) { return; }

        var keyString = "";

        if (ke.ctrlKey) { return; } // This is only meant for regular keypresses

        // Opera doesn't give us the charCode, so try which in that case
        var which = (ke.charCode !== null) ? ke.charCode : ke.which;
        if (FAtari) {
            if ((which >= 33) && (which <= 122)) {
                keyString = String.fromCharCode(which);
            }
        } else if (FC64) {
            if ((which >= 33) && (which <= 64)) {
                keyString = String.fromCharCode(which);
            } else if ((which >= 65) && (which <= 90)) {
                keyString = String.fromCharCode(which).toLowerCase();
            } else if ((which >= 91) && (which <= 95)) {
                keyString = String.fromCharCode(which);
            } else if ((which >= 97) && (which <= 122)) {
                keyString = String.fromCharCode(which).toUpperCase();
            }
        } else {
            if ((which >= 33) && (which <= 126)) {
                keyString = String.fromCharCode(which);
            }
        }

        FKeyBuf.push(new KeyPressEvent(ke, keyString));
    };

    this.PushKeyDown = function (pushedCharCode, pushedKeyCode, ctrl, alt, shift) {
        OnKeyDown({
            altKey: alt,
            charCode: pushedCharCode,
            ctrlKey: ctrl,
            keyCode: pushedKeyCode,
            shiftKey: shift,
            preventDefault: function () { /* do nothing */ }
        });
    };

    this.PushKeyPress = function (pushedCharCode, pushedKeyCode, ctrl, alt, shift) {
        OnKeyPress({
            altKey: alt,
            charCode: pushedCharCode,
            ctrlKey: ctrl,
            keyCode: pushedKeyCode,
            shiftKey: shift,
            preventDefault: function () { /* do nothing */ }
        });
    };

    this.ReadKey = function () {
        if (FKeyBuf.length === 0) { return null; }

        var KPE = FKeyBuf.shift();
        if (FLocalEcho) {
            that.Write(KPE.keyString);
        }
        return KPE;
    };

    this.ReDraw = function () {
        var X;
        var Y;
        for (Y = 1; Y <= FScreenSize.y; Y++) {
            for (X = 1; X <= FScreenSize.x; X++) {
                that.FastWrite(FBuffer[Y][X].Ch, X, Y, FBuffer[Y][X], false);
            }
        }
    };

    this.RestoreScreen = function (ABuffer, ALeft, ATop, ARight, ABottom) {
        var Height = ABottom - ATop + 1;
        var Width = ARight - ALeft + 1;

        var Y;
        var X;
        for (Y = 0; Y < Height; Y++) {
            for (X = 0; X < Width; X++) {
                trace("Restoring: " + ABuffer[Y][X].Ch + " to " + ALeft + ":" + ATop);
                that.FastWrite(ABuffer[Y][X].Ch, X + ALeft, Y + ATop, ABuffer[Y][X]);
            }
        }
    };

    this.ReverseVideo = function () {
        /// <summary>
        /// Reverses the foreground and background text attributes
        /// </summary>
        that.TextAttr = ((that.TextAttr & 0xF0) >> 4) | ((that.TextAttr & 0x0F) << 4);
    };

    this.SaveScreen = function (ALeft, ATop, ARight, ABottom) {
        var Height = ABottom - ATop + 1;
        var Width = ARight - ALeft + 1;
        var Result = [];

        var Y;
        var X;
        for (Y = 0; Y < Height; Y++) {
            Result[Y] = [];
            for (X = 0; X < Width; X++) {
                Result[Y][X] = new TCharInfo(FBuffer[Y + ATop][X + ALeft].Ch, FBuffer[Y + ATop][X + ALeft].Attr, FBuffer[Y + ATop][X + ALeft].Blink, FBuffer[Y + ATop][X + ALeft].Underline, FBuffer[Y + ATop][X + ALeft].Reverse);
            }
        }
			
        return Result;
    };

    this.__defineGetter__("ScreenCols", function () {
        return FScreenSize.x;
    });

    this.__defineGetter__("ScreenRows", function () {
        return FScreenSize.y;
    });

    this.ScrollDownCustom = function (AX1, AY1, AX2, AY2, ALines, ACharInfo, AUpdateBuffer) {
        /// <summary>
        /// Scrolls the given window down the given number of lines (leaving blank lines at the top), filling the void with the given character with the given text attribute
        /// </summary>
        /// <param name="AX1">The 1-based left column of the window</param>
        /// <param name="AY1">The 1-based top row of the window</param>
        /// <param name="AX2">The 1-based right column of the window</param>
        /// <param name="AY2">The 1-based bottom row of the window</param>
        /// <param name="ALines">The number of lines to scroll</param>
        /// <param name="ACh">The character to fill the void with</param>
        /// <param name="ACharInfo">The text attribute to fill the void with</param>

        // Handle optional parameters
        if (typeof AUpdateBuffer === "undefined") { AUpdateBuffer = true; }

        // Validate the ALines parameter
        var MaxLines = AY2 - AY1 + 1;
        if (ALines > MaxLines) { ALines = MaxLines; }

        var Back = (ACharInfo.Attr & 0xF0) >> 4;

        // Scroll -- TODO Hasn't been tested yet
        var Left = (AX1 - 1) * FFont.Width;
        var Top = (AY1 - 1) * FFont.Height;
        var Width = (AX2 - AX1 + 1) * FFont.Width;
        var Height = ((AY2 - AY1 + 1 - ALines) * FFont.Height);
        if (Height > 0) {
            var Buf = FContext.getImageData(Left, Top, Width, Height);
            Left = (AX1 - 1) * FFont.Width;
            Top = (AY1 - 1 + ALines) * FFont.Height;
            FContext.putImageData(Buf, Left, Top);
        }

        // Blank -- TODO Hasn't been tested yet
        FContext.fillStyle = FFont.ANSI_COLOURS[(ACharInfo.Attr & 0xF0) >> 4];
        Left = (AX1 - 1) * FFont.Width;
        Top = (AY1 - 1) * FFont.Height;
        Width = (AX2 - AX1 + 1) * FFont.Width;
        Height = (ALines * FFont.Height);
        FContext.fillRect(Left, Top, Width, Height);

        if (AUpdateBuffer) {
            // Now to adjust the buffer
            var X = 0;
            var Y = 0;

            // First, shuffle the contents that are still visible
            for (Y = AY2; Y > ALines; Y--) {
                for (X = AX1; X <= AX2; X++) {
                    FBuffer[Y][X].Ch = FBuffer[Y - ALines][X].Ch;
                    FBuffer[Y][X].Attr = FBuffer[Y - ALines][X].Attr;
                    FBuffer[Y][X].Blink = FBuffer[Y - ALines][X].Blink;
                    FBuffer[Y][X].Underline = FBuffer[Y - ALines][X].Underline;
                    FBuffer[Y][X].Reverse = FBuffer[Y - ALines][X].Reverse;
                }
            }

            // Then, blank the contents that are not
            for (Y = AY1; Y <= ALines; Y++) {
                for (X = AX1; X <= AX2; X++) {
                    FBuffer[Y][X].Ch = ACharInfo.Ch;
                    FBuffer[Y][X].Attr = ACharInfo.Attr;
                    FBuffer[Y][X].Blink = ACharInfo.Blink;
                    FBuffer[Y][X].Underline = ACharInfo.Underline;
                    FBuffer[Y][X].Reverse = ACharInfo.Reverse;
                }
            }
        }
    };

    this.ScrollDownScreen = function (ALines) {
        /// <summary>
        /// Scrolls the screen down the given number of lines (leaving blanks at the top)
        /// </summary>
        /// <param name="ALines">The number of lines to scroll</param>
        that.ScrollDownCustom(1, 1, FScreenSize.x, FScreenSize.y, ALines, FCharInfo);
    };

    this.ScrollDownWindow = function (ALines) {
        /// <summary>
        /// Scrolls the current window down the given number of lines (leaving blanks at the top)
        /// </summary>
        /// <param name="ALines">The number of lines to scroll</param>
        that.ScrollDownCustom(that.WindMinX + 1, that.WindMinY + 1, that.WindMaxX + 1, that.WindMaxY + 1, ALines, FCharInfo);
    };

    this.ScrollUpCustom = function (AX1, AY1, AX2, AY2, ALines, ACharInfo, AUpdateBuffer) {
        /// <summary>
        /// Scrolls the given window up the given number of lines (leaving blank lines at the bottom), filling the void with the given character with the given text attribute
        /// </summary>
        /// <param name="AX1">The 1-based left column of the window</param>
        /// <param name="AY1">The 1-based top row of the window</param>
        /// <param name="AX2">The 1-based right column of the window</param>
        /// <param name="AY2">The 1-based bottom row of the window</param>
        /// <param name="ALines">The number of lines to scroll</param>
        /// <param name="ACh">The character to fill the void with</param>
        /// <param name="ACharInfo">The text attribute to fill the void with</param>

        // Handle optional parameters
        if (typeof AUpdateBuffer === "undefined") { AUpdateBuffer = true; }

        // Validate the ALines parameter
        var MaxLines = AY2 - AY1 + 1;
        if (ALines > MaxLines) { ALines = MaxLines; }

        var Back = (ACharInfo.Attr & 0xF0) >> 4;

        if ((!FInScrollBack) || (FInScrollBack && !AUpdateBuffer)) {
            // Scroll
            var Left = (AX1 - 1) * FFont.Width;
            var Top = (AY1 - 1 + ALines) * FFont.Height;
            var Width = (AX2 - AX1 + 1) * FFont.Width;
            var Height = ((AY2 - AY1 + 1 - ALines) * FFont.Height);
            if (Height > 0) {
                var Buf = FContext.getImageData(Left, Top, Width, Height);
                Left = (AX1 - 1) * FFont.Width;
                Top = (AY1 - 1) * FFont.Height;
                FContext.putImageData(Buf, Left, Top);
            }

            // Blank
            FContext.fillStyle = FFont.ANSI_COLOURS[(ACharInfo.Attr & 0xF0) >> 4];
            Left = (AX1 - 1) * FFont.Width;
            Top = (AY2 - ALines) * FFont.Height;
            Width = (AX2 - AX1 + 1) * FFont.Width;
            Height = (ALines * FFont.Height);
            FContext.fillRect(Left, Top, Width, Height);
        }

        if (AUpdateBuffer) {
            // Now to adjust the buffer
            var NewRow;
            var X;
            var Y;

            // First, store the contents of the scrolled lines in the scrollback buffer
            for (Y = 0; Y < ALines; Y++) {
                NewRow = [];
                for (X = AX1; X <= AX2; X++) {
                    NewRow.push(new TCharInfo(FBuffer[Y + AY1][X].Ch, FBuffer[Y + AY1][X].Attr, FBuffer[Y + AY1][X].Blink, FBuffer[Y + AY1][X].Underline, FBuffer[Y + AY1][X].Reverse));
                }
                FScrollBack.push(NewRow);
            }
            // Trim the scrollback to 1000 lines, if necessary
            var FScrollBackLength = FScrollBack.length;
            while (FScrollBackLength > (FScrollBackSize - 2)) {
                FScrollBack.shift();
                FScrollBackLength -= 1;
            }

            // Then, shuffle the contents that are still visible
            for (Y = AY1; Y <= (AY2 - ALines) ; Y++) {
                for (X = AX1; X <= AX2; X++) {
                    FBuffer[Y][X].Ch = FBuffer[Y + ALines][X].Ch;
                    FBuffer[Y][X].Attr = FBuffer[Y + ALines][X].Attr;
                    FBuffer[Y][X].Blink = FBuffer[Y + ALines][X].Blink;
                    FBuffer[Y][X].Underline = FBuffer[Y + ALines][X].Underline;
                    FBuffer[Y][X].Reverse = FBuffer[Y + ALines][X].Reverse;
                }
            }

            // Then, blank the contents that are not
            for (Y = AY2; Y > (AY2 - ALines) ; Y--) {
                for (X = AX1; X <= AX2; X++) {
                    FBuffer[Y][X].Ch = ACharInfo.Ch;
                    FBuffer[Y][X].Attr = ACharInfo.Attr;
                    FBuffer[Y][X].Blink = ACharInfo.Blink;
                    FBuffer[Y][X].Underline = ACharInfo.Underline;
                    FBuffer[Y][X].Reverse = ACharInfo.Reverse;
                }
            }
        }
    };

    this.ScrollUpScreen = function (ALines) {
        /// <summary>
        /// Scrolls the screen up the given number of lines (leaving blanks at the bottom)
        /// </summary>
        /// <param name="ALines">The number of lines to scroll</param>
        that.ScrollUpCustom(1, 1, FScreenSize.x, FScreenSize.y, ALines, FCharInfo);
    };

    this.ScrollUpWindow = function (ALines) {
        /// <summary>
        /// Scrolls the current window up the given number of lines (leaving blanks at the bottom)
        /// </summary>
        /// <param name="ALines">The number of lines to scroll</param>
        that.ScrollUpCustom(that.WindMinX + 1, that.WindMinY + 1, that.WindMaxX + 1, that.WindMaxY + 1, ALines, FCharInfo);
    };

    this.SetBlink = function (ABlink) {
        FCharInfo.Blink = ABlink;
    };

    this.SetBlinkRate = function (AMS) {
        FCursor.BlinkRate = AMS;
    };

    this.SetCharInfo = function (ACharInfo) {
        FCharInfo = new TCharInfo(ACharInfo.Ch, ACharInfo.Attr, ACharInfo.Blink, ACharInfo.Underline, ACharInfo.Reverse);
    };

    this.SetFont = function (ACodePage, AWidth, AHeight) {
        /// <summary>
        /// Try to set the console font size to characters with the given X and Y size
        /// </summary>
        /// <param name="AX">The horizontal size</param>
        /// <param name="AY">The vertical size</param>
        /// <returns>True if the size was found and set, False if the size was not available</returns>

        // Request the new font
        FFont.Load(ACodePage, AWidth, AHeight);
    };

    this.SetScreenSize = function (AColumns, ARows) {
        // Check if we're in scrollback
        if (FInScrollBack) { return; }

        // Check if the requested size is already in use
        if ((AColumns === FScreenSize.x) && (ARows === FScreenSize.y)) { return; }

        var X = 0;
        var Y = 0;

        // Save the old details
        var FOldBuffer;
        if (FBuffer !== null) {
            FOldBuffer = [];
            FOldBuffer.InitTwoDimensions(FScreenSize.x, FScreenSize.y);
            for (Y = 1; Y <= FScreenSize.y; Y++) {
                for (X = 1; X <= FScreenSize.x; X++) {
                    FOldBuffer[Y][X] = new TCharInfo(FBuffer[Y][X].Ch, FBuffer[Y][X].Attr, FBuffer[Y][X].Blink, FBuffer[Y][X].Underline, FBuffer[Y][X].Reverse);
                }
            }
        }
        var FOldScreenSize = new Point(FScreenSize.x, FScreenSize.y);

        // Set the new console screen size
        FScreenSize.x = AColumns;
        FScreenSize.y = ARows;

        // Update the WindMin/WindMax records
        FWindMin = 0;
        FWindMax = (FScreenSize.x - 1) | ((FScreenSize.y - 1) << 8);

        // Reset the screen buffer 
        InitBuffers(false);

        // Update the bitmap
        // TODO Why is this commented out?
        /*FBitmap.bitmapData = new BitmapData(FFont.Width * FScreenSize.x, FFont.Height * FScreenSize.y, false, 0);
        FCanvas.width = FBitmap.width;
        FCanvas.height = FBitmap.height;*/

        // Restore the screen contents
        // TODO If new screen is smaller than old screen, restore bottom portion not top portion
        if (FOldBuffer !== null) {
            for (Y = 1; Y <= Math.min(FScreenSize.y, FOldScreenSize.y) ; Y++) {
                for (X = 1; X <= Math.min(FScreenSize.x, FOldScreenSize.x) ; X++) {
                    that.FastWrite(FOldBuffer[Y][X].Ch, X, Y, FOldBuffer[Y][X]);
                }
            }
        }

        // Let the program know about the update
        // TODO Is the commented or uncommented code correct?
        //FCanvas.dispatchEvent(that.SCREEN_SIZE_CHANGED);
        var evObj = document.createEvent('Events');
        evObj.initEvent(that.SCREEN_SIZE_CHANGED, true, false);
        FCanvas.dispatchEvent(evObj);
    };

    this.ShowCursor = function () {
        FCursor.Visible = true;
    };

    this.__defineGetter__("TextAttr", function () {
        /// <summary>
        /// Stores currently selected text attributes
        /// </summary>
        /// <remarks>
        /// The text attributes are normally set through calls to TextColor and
        /// TextBackground.
        ///
        /// However, you can also set them by directly storing a value in TextAttr.
        /// </remarks>
        return FCharInfo.Attr;
    });

    this.__defineSetter__("TextAttr", function (AAttr) {
        FCharInfo.Attr = AAttr;
    });

    this.TextBackground = function (AColor) {
        /// <summary>
        /// Selects the background color.
        /// </summary>
        /// <remarks>
        /// Color is an integer expression in the range 0..7, corresponding to one of
        /// the first eight text color constants. There is a byte variable in
        /// Crt--TextAttr--that is used to hold the current video attribute.
        /// TextBackground sets bits 4-6 of TextAttr to Color.
        ///
        /// The background of all characters subsequently written will be in the
        /// specified color.
        /// </remarks>
        /// <param name="AColor">The colour to set the background to</param>
        that.TextAttr = (that.TextAttr & 0x0F) | ((AColor & 0x0F) << 4);
    };

    this.TextColor = function (AColor) {
        /// <summary>
        /// Selects the foreground character color.
        /// </summary>
        /// <remarks>
        /// Color is an integer expression in the range 0..15, corresponding to one of
        /// the text color constants defined in Crt.
        ///
        /// There is a byte-type variable Crt--TextAttr--that is used to hold the
        /// current video attribute. TextColor sets bits 0-3 to Color. If Color is
        /// greater than 15, the blink bit (bit 7) is also set; otherwise, it is
        /// cleared.
        ///
        /// You can make characters blink by adding 128 to the color value. The Blink
        /// constant is defined for that purpose; in fact, for compatibility with Turbo
        /// Pascal 3.0, any Color value above 15 causes the characters to blink. The
        /// foreground of all characters subsequently written will be in the specified
        /// color.
        /// </remarks>
        /// <param name="AColor">The colour to set the foreground to</param>
        that.TextAttr = (that.TextAttr & 0xF0) | (AColor & 0x0F);
    };

    this.WhereX = function () {
        /// <summary>
        /// Returns the CP's X coordinate of the current cursor location.
        /// </summary>
        /// <remarks>
        /// WhereX is window-specific.
        /// </remarks>
        /// <returns>The 1-based column of the window the cursor is currently in</returns>
        return FCursor.Position.x;
    };

    this.WhereXA = function () {
        /// <summary>
        /// Returns the CP's X coordinate of the current cursor location.
        /// </summary>
        /// <remarks>
        /// WhereXA is not window-specific.
        /// </remarks>
        /// <returns>The 1-based column of the screen the cursor is currently in</returns>
        return that.WhereX() + that.WindMinX;
    };

    /// <summary>
    /// Returns the CP's Y coordinate of the current cursor location.
    /// </summary>
    /// <remarks>
    /// WhereY is window-specific.
    /// </remarks>
    /// <returns>The 1-based row of the window the cursor is currently in</returns>
    this.WhereY = function () {
        return FCursor.Position.y;
    };

    this.WhereYA = function () {
        /// <summary>
        /// Returns the CP's Y coordinate of the current cursor location.
        /// </summary>
        /// <remarks>
        /// WhereYA is now window-specific.
        /// </remarks>
        /// <returns>The 1-based row of the screen the cursor is currently in</returns>
        return that.WhereY() + that.WindMinY;
    };

    this.__defineGetter__("WindCols", function () {
        /// <summary>
        /// The number of columns found in the currently defined window
        /// </summary>
        return that.WindMaxX - that.WindMinX + 1;
    });

    this.__defineGetter__("WindMax", function () {
        /// <summary>
        /// The 0-based lower right coordinate of the current window
        /// </summary>
        return FWindMax;
    });

    this.__defineGetter__("WindMaxX", function () {
        /// <summary>
        /// The 0-based left column of the current window
        /// </summary>
        return (that.WindMax & 0x00FF);
    });

    this.__defineGetter__("WindMaxY", function () {
        /// <summary>
        /// The 0-based right column of the current window
        /// </summary>
        return ((that.WindMax & 0xFF00) >> 8);
    });

    this.__defineGetter__("WindMin", function () {
        /// <summary>
        /// The 0-based upper left coordinate of the current window
        /// </summary>
        return FWindMin;
    });

    this.__defineGetter__("WindMinX", function () {
        /// <summary>
        /// The 0-based top row of the current window
        /// </summary>
        return (that.WindMin & 0x00FF);
    });

    this.__defineGetter__("WindMinY", function () {
        /// <summary>
        /// The 0-based bottom row of the current window
        /// </summary>
        return ((that.WindMin & 0xFF00) >> 8);
    });

    this.Window = function (AX1, AY1, AX2, AY2) {
        /// <summary>
        /// Defines a text window on the screen.
        /// </summary>
        /// <remarks>
        /// X1 and Y1 are the coordinates of the upper left corner of the window, and X2
        /// and Y2 are the coordinates of the lower right corner. The upper left corner
        /// of the screen corresponds to (1, 1). The minimum size of a text window is
        /// one column by one line. If the coordinates are invalid in any way, the call
        /// to Window is ignored.
        ///
        /// The default window is (1, 1, 80, 25) in 25-line mode, and (1, 1, 80, 43) in
        /// 43-line mode, corresponding to the entire screen.
        ///
        /// All screen coordinates (except the window coordinates themselves) are
        /// relative to the current window. For instance, GotoXY(1, 1) will always
        /// position the cursor in the upper left corner of the current window.
        ///
        /// Many Crt procedures and functions are window-relative, including ClrEol,
        /// ClrScr, DelLine, GotoXY, InsLine, WhereX, WhereY, Read, Readln, Write,
        /// Writeln.
        ///
        /// WindMin and WindMax store the current window definition. A call to the
        /// Window procedure always moves the cursor to (1, 1).
        /// </remarks>
        /// <param name="AX1">The 1-based left column of the window</param>
        /// <param name="AY1">The 1-based top row of the window</param>
        /// <param name="AX2">The 1-based right column of the window</param>
        /// <param name="AY2">The 1-based bottom row of the window</param>
        if ((AX1 >= 1) && (AY1 >= 1) && (AX1 <= AX2) && (AY1 <= AY2)) {
            if ((AX2 <= FScreenSize.x) && (AY2 <= FScreenSize.y)) {
                FWindMin = (AX1 - 1) + ((AY1 - 1) << 8);
                FWindMax = (AX2 - 1) + ((AY2 - 1) << 8);
                FCursor.WindowOffset = new Point(AX1 - 1, AY1 - 1);
                that.GotoXY(1, 1);
            }
        }
    };

    this.__defineGetter__("WindRows", function () {
        /// <summary>
        /// The number of rows found in the currently defined window
        /// </summary>
        return that.WindMaxY - that.WindMinY + 1;
    });

    this.Write = function (AText) {
        /// <summary>
        /// Writes a given line of text to the screen.
        /// </summary>
        /// <remarks>
        /// Text is wrapped if it exceeds the right edge of the window
        /// </remarks>
        /// <param name="AText">The text to print to the screen</param>
        if (FAtari) {
            that.WriteATASCII(AText);
        } else if (FC64) {
            that.WritePETSCII(AText);
        } else {
            that.WriteASCII(AText);
        }
    };

    this.WriteASCII = function (AText) {
        if (AText === undefined) { AText = ""; }

        var X = that.WhereX();
        var Y = that.WhereY();
        var Buf = "";

        var i;
        for (i = 0; i < AText.length; i++) {
            var DoGoto = false;

            if (AText.charCodeAt(i) === 0x00) {
                // NULL, ignore
                i += 0; // Make JSLint happy (doesn't like empty block)
            }
            else if (AText.charCodeAt(i) === 0x07) {
                that.Beep();
            }
            else if (AText.charCodeAt(i) === 0x08) {
                // Backspace, need to flush buffer before moving cursor
                that.FastWrite(Buf, that.WhereXA(), that.WhereYA(), FCharInfo);
                X += Buf.length;
                if (X > 1) { X -= 1; }
                DoGoto = true;

                Buf = "";
            }
            else if (AText.charCodeAt(i) === 0x09) {
                // Tab, need to flush buffer before moving cursor
                that.FastWrite(Buf, that.WhereXA(), that.WhereYA(), FCharInfo);
                X += Buf.length;
                Buf = "";

                // Figure out where the next tabstop is
                if (X === that.WindCols) {
                    // Cursor is in last position, tab goes to the first position of the next line
                    X = 1;
                    Y += 1;
                } else {
                    // Cursor goes to the next multiple of 8
                    X += 8 - (X % 8);

                    // Make sure we didn't tab beyond the width of the window (can happen if width of window is not divisible by 8)
                    X = Math.min(X, that.WindCols);
                }
                DoGoto = true;
            }
            else if (AText.charCodeAt(i) === 0x0A) {
                // Line feed, need to flush buffer before moving cursor
                that.FastWrite(Buf, that.WhereXA(), that.WhereYA(), FCharInfo);
                X += Buf.length;
                Y += 1;
                DoGoto = true;

                Buf = "";
            }
            else if (AText.charCodeAt(i) === 0x0C) {
                // Clear the screen
                that.ClrScr();

                // Reset the variables
                X = 1;
                Y = 1;
                Buf = "";
            }
            else if (AText.charCodeAt(i) === 0x0D) {
                // Carriage return, need to flush buffer before moving cursor
                that.FastWrite(Buf, that.WhereXA(), that.WhereYA(), FCharInfo);
                X = 1;
                DoGoto = true;

                Buf = "";
            }
            else if (AText.charCodeAt(i) !== 0) {
                // Append character to buffer
                Buf += String.fromCharCode(AText.charCodeAt(i) & 0xFF);

                // Check if we've passed the right edge of the window
                if ((X + Buf.length) > that.WindCols) {
                    // We have, need to flush buffer before moving cursor
                    that.FastWrite(Buf, that.WhereXA(), that.WhereYA(), FCharInfo);
                    Buf = "";

                    X = 1;
                    Y += 1;
                    DoGoto = true;
                }
            }

            // Check if we've passed the bottom edge of the window
            if (Y > that.WindRows) {
                // We have, need to scroll the window one line
                Y = that.WindRows;
                that.ScrollUpWindow(1);
                DoGoto = true;
            }

            if (DoGoto) { that.GotoXY(X, Y); }
        }

        // Flush remaining text in buffer if we have any
        if (Buf.length > 0) {
            that.FastWrite(Buf, that.WhereXA(), that.WhereYA(), FCharInfo);
            X += Buf.length;
            that.GotoXY(X, Y);
        }
    };

    this.WriteATASCII = function (AText) {
        if (AText === undefined) { AText = ""; }

        var X = that.WhereX();
        var Y = that.WhereY();
        var Buf = "";

        var i;
        for (i = 0; i < AText.length; i++) {
            // trace(AText.charCodeAt(i));
            var DoGoto = false;

            if (AText.charCodeAt(i) === 0x00) {
                // NULL, ignore
                i += 0; // Make JSLint happy (doesn't like empty block)
            }
            if ((AText.charCodeAt(i) === 0x1B) && (!FATASCIIEscaped)) {
                // Escape
                FATASCIIEscaped = true;
            }
            else if ((AText.charCodeAt(i) === 0x1C) && (!FATASCIIEscaped)) {
                // Cursor up, need to flush buffer before moving cursor
                that.FastWrite(Buf, that.WhereXA(), that.WhereYA(), FCharInfo);
                X += Buf.length;
                Y = (Y > 1) ? Y - 1 : that.WindRows;
                DoGoto = true;

                Buf = "";
            }
            else if ((AText.charCodeAt(i) === 0x1D) && (!FATASCIIEscaped)) {
                // Cursor down, need to flush buffer before moving cursor
                that.FastWrite(Buf, that.WhereXA(), that.WhereYA(), FCharInfo);
                X += Buf.length;
                Y = (Y < that.WindRows) ? Y + 1 : 1;
                DoGoto = true;

                Buf = "";
            }
            else if ((AText.charCodeAt(i) === 0x1E) && (!FATASCIIEscaped)) {
                // Cursor left, need to flush buffer before moving cursor
                that.FastWrite(Buf, that.WhereXA(), that.WhereYA(), FCharInfo);
                X += Buf.length;
                X = (X > 1) ? X - 1 : that.WindCols;
                DoGoto = true;

                Buf = "";
            }
            else if ((AText.charCodeAt(i) === 0x1F) && (!FATASCIIEscaped)) {
                // Cursor right, need to flush buffer before moving cursor
                that.FastWrite(Buf, that.WhereXA(), that.WhereYA(), FCharInfo);
                X += Buf.length;
                X = (X < that.WindCols) ? X + 1 : 1;
                DoGoto = true;

                Buf = "";
            }
            else if ((AText.charCodeAt(i) === 0x7D) && (!FATASCIIEscaped)) {
                // Clear the screen
                that.ClrScr();

                // Reset the variables
                X = 1;
                Y = 1;
                Buf = "";
            }
            else if ((AText.charCodeAt(i) === 0x7E) && (!FATASCIIEscaped)) {
                // Backspace, need to flush buffer before moving cursor
                that.FastWrite(Buf, that.WhereXA(), that.WhereYA(), FCharInfo);
                X += Buf.length;
                Buf = "";
                DoGoto = true;

                if (X > 1) {
                    X -= 1;
                    that.FastWrite(" ", X, that.WhereYA(), FCharInfo);
                }
            }
            else if ((AText.charCodeAt(i) === 0x7F) && (!FATASCIIEscaped)) {
                // Tab, need to flush buffer before moving cursor
                that.FastWrite(Buf, that.WhereXA(), that.WhereYA(), FCharInfo);
                X += Buf.length;
                Buf = "";

                // Figure out where the next tabstop is
                if (X === that.WindCols) {
                    // Cursor is in last position, tab goes to the first position of the next line
                    X = 1;
                    Y += 1;
                } else {
                    // Cursor goes to the next multiple of 8
                    X += 8 - (X % 8);
                }
                DoGoto = true;
            }
            else if ((AText.charCodeAt(i) === 0x9B) && (!FATASCIIEscaped)) {
                // Line feed, need to flush buffer before moving cursor
                that.FastWrite(Buf, that.WhereXA(), that.WhereYA(), FCharInfo);
                X = 1;
                Y += 1;
                DoGoto = true;

                Buf = "";
            }
            else if ((AText.charCodeAt(i) === 0x9C) && (!FATASCIIEscaped)) {
                // Delete line, need to flush buffer before doing so
                that.FastWrite(Buf, that.WhereXA(), that.WhereYA(), FCharInfo);
                X = 1;
                Buf = "";

                that.GotoXY(X, Y);
                that.DelLine();
            }
            else if ((AText.charCodeAt(i) === 0x9D) && (!FATASCIIEscaped)) {
                // Insert line, need to flush buffer before doing so
                that.FastWrite(Buf, that.WhereXA(), that.WhereYA(), FCharInfo);
                X = 1;
                Buf = "";

                that.GotoXY(X, Y);
                that.InsLine();
            }
            else if ((AText.charCodeAt(i) === 0xFD) && (!FATASCIIEscaped)) {
                that.Beep();
            }
            else if ((AText.charCodeAt(i) === 0xFE) && (!FATASCIIEscaped)) {
                // Delete character, need to flush buffer before doing so
                that.FastWrite(Buf, that.WhereXA(), that.WhereYA(), FCharInfo);
                X += Buf.length;
                Buf = "";

                that.GotoXY(X, Y);
                that.DelChar();
            }
            else if ((AText.charCodeAt(i) === 0xFF) && (!FATASCIIEscaped)) {
                // Insert character, need to flush buffer before doing so
                that.FastWrite(Buf, that.WhereXA(), that.WhereYA(), FCharInfo);
                X += Buf.length;
                Buf = "";

                that.GotoXY(X, Y);
                that.InsChar();
            }
            else {
                // Append character to buffer (but handle lantronix filter)
                if ((AText.charCodeAt(i) === 0x00) && (FLastChar === 0x0D)) {
                    // LANtronix always sends 0 after 13, so we'll ignore it
                    Buf += ""; // Make JSLint happy
                } else {
                    // Add key to buffer
                    Buf += String.fromCharCode(AText.charCodeAt(i) & 0xFF);
                }
                FATASCIIEscaped = false;
                FLastChar = AText.charCodeAt(i);

                // Check if we've passed the right edge of the window
                if ((X + Buf.length) > that.WindCols) {
                    // We have, need to flush buffer before moving cursor
                    that.FastWrite(Buf, that.WhereXA(), that.WhereYA(), FCharInfo);
                    Buf = "";

                    X = 1;
                    Y += 1;
                    DoGoto = true;
                }
            }

            // Check if we've passed the bottom edge of the window
            if (Y > that.WindRows) {
                // We have, need to scroll the window one line
                Y = that.WindRows;
                that.ScrollUpWindow(1);
                DoGoto = true;
            }

            if (DoGoto) { that.GotoXY(X, Y); }
        }

        // Flush remaining text in buffer if we have any
        if (Buf.length > 0) {
            that.FastWrite(Buf, that.WhereXA(), that.WhereYA(), FCharInfo);
            X += Buf.length;
            that.GotoXY(X, Y);
        }
    };

    this.WritePETSCII = function (AText) {
        if (AText === undefined) { AText = ""; }

        var X = that.WhereX();
        var Y = that.WhereY();
        var Buf = "";

        var i;
        for (i = 0; i < AText.length; i++) {
            var DoGoto = false;

            // Check if this is a control code (so we need to flush buffered text first)
            if ((Buf !== "") && (FFlushBeforeWritePETSCII.indexOf(AText.charCodeAt(i)) !== -1)) {
                that.FastWrite(Buf, that.WhereXA(), that.WhereYA(), FCharInfo);
                X += Buf.length;
                DoGoto = true;
                Buf = "";
            }

            if (AText.charCodeAt(i) === 0x00) {
                // NULL, ignore
                i += 0; // Make JSLint happy (doesn't like empty block)
            }
            else if (AText.charCodeAt(i) === 0x05) {
                // Changes the text color to white. 
                that.TextColor(that.PETSCII_WHITE);
            }
            else if (AText.charCodeAt(i) === 0x07) {
                // Beep (extra, not documented)
                that.Beep();
            }
            else if (AText.charCodeAt(i) === 0x08) {
                // TODO Disables changing the character set using the SHIFT + Commodore key combination. 
                trace("PETSCII 0x08");
            }
            else if (AText.charCodeAt(i) === 0x09) {
                // TODO Enables changing the character set using the SHIFT + Commodore key combination. 
                trace("PETSCII 0x09");
            }
            else if (AText.charCodeAt(i) === 0x0A) {
                // Ignore, 0x0D will handle linefeeding
                i += 0; // Make JSLint happy (doesn't like empty block)
            }
            else if ((AText.charCodeAt(i) === 0x0D) || (AText.charCodeAt(i) === 0x8D)) {
                // Carriage return; next character will go in the first column of the following text line. 
                // As opposed to traditional ASCII-based system, no LINE FEED character needs to be sent in conjunction with this Carriage return character in the PETSCII system. 
                X = 1;
                Y += 1;
                FCharInfo.Reverse = false;
                DoGoto = true;
            }
            else if (AText.charCodeAt(i) === 0x0E) {
                // Select the lowercase/uppercase character set. 
                that.SetFont("PETSCII-Lower", 16, 16);
            }
            else if (AText.charCodeAt(i) === 0x11) {
                // Cursor down: Next character will be printed in subsequent column one text line further down the screen. 
                Y += 1;
                DoGoto = true;
            }
            else if (AText.charCodeAt(i) === 0x12) {
                // Reverse on: Selects reverse video text. 
                FCharInfo.Reverse = true;
            }
            else if (AText.charCodeAt(i) === 0x13) {
                // Home: Next character will be printed in the upper left-hand corner of the screen. 
                X = 1;
                Y = 1;
                DoGoto = true;
            }
            else if (AText.charCodeAt(i) === 0x14) {
                // Delete, or "backspace"; erases the previous character and moves the cursor one character position to the left. 
                if ((X > 1) || (Y > 1)) {
                    if (X === 1) {
                        X = that.WindCols;
                        Y -= 1;
                    } else {
                        X -= 1;
                    }

                    that.GotoXY(X, Y);
                    that.DelChar(1);
                }
            }
            else if (AText.charCodeAt(i) === 0x1C) {
                // Changes the text color to red. 
                that.TextColor(that.PETSCII_RED);
            }
            else if (AText.charCodeAt(i) === 0x1D) {
                // Advances the cursor one character position without printing anything. 
                if (X === that.WindCols) {
                    X = 1;
                    Y += 1;
                } else {
                    X += 1;
                }
                DoGoto = true;
            }
            else if (AText.charCodeAt(i) === 0x1E) {
                // Changes the text color to green. 
                that.TextColor(that.PETSCII_GREEN);
            }
            else if (AText.charCodeAt(i) === 0x1F) {
                // Changes the text color to blue. 
                that.TextColor(that.PETSCII_BLUE);
            }
            else if (AText.charCodeAt(i) === 0x81) {
                // Changes the text color to orange. 
                that.TextColor(that.PETSCII_ORANGE);
            }
            else if (AText.charCodeAt(i) === 0x8E) {
                // Select the uppercase/semigraphics character set. 
                that.SetFont("PETSCII-Upper", 16, 16);
            }
            else if (AText.charCodeAt(i) === 0x90) {
                // Changes the text color to black. 
                that.TextColor(that.PETSCII_BLACK);
            }
            else if (AText.charCodeAt(i) === 0x91) {
                // Cursor up: Next character will be printed in subsequent column one text line further up the screen. 
                if (Y > 1) {
                    Y -= 1;
                    DoGoto = true;
                }
            }
            else if (AText.charCodeAt(i) === 0x92) {
                // Reverse off: De-selects reverse video text. 
                FCharInfo.Reverse = false;
            }
            else if (AText.charCodeAt(i) === 0x93) {
                // Clears screen of any text, and causes the next character to be printed at the upper left-hand corner of the text screen. 
                that.ClrScr();
                X = 1;
                Y = 1;
            }
            else if (AText.charCodeAt(i) === 0x94) {
                // Insert: Makes room for extra characters at the current cursor position, by "pushing" existing characters at that position further to the right. 
                that.GotoXY(X, Y);
                that.InsChar(1);
            }
            else if (AText.charCodeAt(i) === 0x95) {
                // Changes the text color to brown. 
                that.TextColor(that.PETSCII_BROWN);
            }
            else if (AText.charCodeAt(i) === 0x96) {
                // Changes the text color to light red.
                that.TextColor(that.PETSCII_LIGHTRED);
            }
            else if (AText.charCodeAt(i) === 0x97) {
                // Changes the text color to dark gray. 
                that.TextColor(that.PETSCII_DARKGRAY);
            }
            else if (AText.charCodeAt(i) === 0x98) {
                // Changes the text color to gray. 
                that.TextColor(that.PETSCII_GRAY);
            }
            else if (AText.charCodeAt(i) === 0x99) {
                // Changes the text color to light green. 
                that.TextColor(that.PETSCII_LIGHTGREEN);
            }
            else if (AText.charCodeAt(i) === 0x9A) {
                // Changes the text color to light blue. 
                that.TextColor(that.PETSCII_LIGHTBLUE);
            }
            else if (AText.charCodeAt(i) === 0x9B) {
                // Changes the text color to light gray. 
                that.TextColor(that.PETSCII_LIGHTGRAY);
            }
            else if (AText.charCodeAt(i) === 0x9C) {
                // Changes the text color to purple. 
                that.TextColor(that.PETSCII_PURPLE);
            }
            else if (AText.charCodeAt(i) === 0x9D) {
                // Moves the cursor one character position backwards, without printing or deleting anything. 
                if ((X > 1) || (Y > 1)) {
                    if (X === 1) {
                        X = that.WindCols;
                        Y -= 1;
                    } else {
                        X -= 1;
                    }
                    DoGoto = true;
                }
            }
            else if (AText.charCodeAt(i) === 0x9E) {
                // Changes the text color to yellow. 
                that.TextColor(that.PETSCII_YELLOW);
            }
            else if (AText.charCodeAt(i) === 0x9F) {
                // Changes the text color to cyan. 
                that.TextColor(that.PETSCII_CYAN);
            }
            else if (AText.charCodeAt(i) !== 0) {
                // Append character to buffer
                Buf += String.fromCharCode(AText.charCodeAt(i) & 0xFF);

                // Check if we've passed the right edge of the window
                if ((X + Buf.length) > that.WindCols) {
                    // We have, need to flush buffer before moving cursor
                    that.FastWrite(Buf, that.WhereXA(), that.WhereYA(), FCharInfo);
                    Buf = "";

                    X = 1;
                    Y += 1;
                    DoGoto = true;
                }
            }

            // Check if we've passed the bottom edge of the window
            if (Y > that.WindRows) {
                // We have, need to scroll the window one line
                Y = that.WindRows;
                that.ScrollUpWindow(1);
                DoGoto = true;
            }

            if (DoGoto) { that.GotoXY(X, Y); }
        }

        // Flush remaining text in buffer if we have any
        if (Buf.length > 0) {
            that.FastWrite(Buf, that.WhereXA(), that.WhereYA(), FCharInfo);
            X += Buf.length;
            that.GotoXY(X, Y);
        }
    };

    this.WriteLn = function (AText) {
        /// <summary>
        /// Writes a given line of text to the screen, followed by a carriage return and line feed.
        /// </summary>
        /// <remarks>
        /// Text is wrapped if it exceeds the right edge of the window
        /// </remarks>
        /// <param name="AText">The text to print to the screen</param>
        if (AText === undefined) { AText = ""; }
        that.Write(AText + "\r\n");
    };
};
Crt = new TCrt();
