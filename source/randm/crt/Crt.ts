/*
  fTelnet: An HTML5 WebSocket client
  Copyright (C) 2009-2013  Rick Parrish, R&M Software

  This file is part of fTelnet.

  fTelnet is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as
  published by the Free Software Foundation, either version 3 of the
  License, or any later version.

  fTelnet is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with fTelnet.  If not, see <http://www.gnu.org/licenses/>.
*/
/// <reference path='CharInfo.ts' />
/// <reference path='KeyPressEvent.ts' />
/// <reference path='cursor/Cursor.ts' />
/// <reference path='font/CrtFont.ts' />
/// <reference path='font/CrtFonts.ts' />
/// <reference path='../actionscript/Keyboard.ts' />
/// <reference path='../StringUtils.ts' />
class Crt {
    /// <summary>
    /// A class for manipulating a console window
    /// Compatibility with the Borland Pascal CRT unit was attempted, along with a few new additions
    /// </summary>

    // Events
    public static onfontchange: IEvent = new TypedEvent();
    public static onkeypressed: IEvent = new TypedEvent();
    public static onscreensizechange: IEvent = new TypedEvent();

    /*  Color Constants
    ¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯
    Use these color constants with SetPalette, SetAllPalette, TextColor, and
    TextBackground:
    */
    public static BLACK: number = 0;
    public static BLUE: number = 1;
    public static GREEN: number = 2;
    public static CYAN: number = 3;
    public static RED: number = 4;
    public static MAGENTA: number = 5;
    public static BROWN: number = 6;
    public static LIGHTGRAY: number = 7;
    public static DARKGRAY: number = 8;
    public static LIGHTBLUE: number = 9;
    public static LIGHTGREEN: number = 10;
    public static LIGHTCYAN: number = 11;
    public static LIGHTRED: number = 12;
    public static LIGHTMAGENTA: number = 13;
    public static YELLOW: number = 14;
    public static WHITE: number = 15;
    public static BLINK: number = 128;

    public static PETSCII_BLACK: number = 0;
    public static PETSCII_WHITE: number = 1;
    public static PETSCII_RED: number = 2;
    public static PETSCII_CYAN: number = 3;
    public static PETSCII_PURPLE: number = 4;
    public static PETSCII_GREEN: number = 5;
    public static PETSCII_BLUE: number = 6;
    public static PETSCII_YELLOW: number = 7;
    public static PETSCII_ORANGE: number = 8;
    public static PETSCII_BROWN: number = 9;
    public static PETSCII_LIGHTRED: number = 10;
    public static PETSCII_DARKGRAY: number = 11;
    public static PETSCII_GRAY: number = 12;
    public static PETSCII_LIGHTGREEN: number = 13;
    public static PETSCII_LIGHTBLUE: number = 14;
    public static PETSCII_LIGHTGRAY: number = 15;

    /* Private variables */
    private static _AllowDynamicFontResize: Boolean = true;
    private static _Atari: boolean = false;
    private static _ATASCIIEscaped: boolean = false;
    private static _BareLFtoCRLF: boolean = false;
    private static _Blink: boolean = true;
    private static _BlinkHidden: boolean = false;
    private static _Buffer: CharInfo[][] = null;
    private static _C64: boolean = false;
    private static _Canvas: HTMLCanvasElement = null;
    private static _CanvasContext: CanvasRenderingContext2D = null;
    private static _CharInfo: CharInfo = new CharInfo(null, Crt.LIGHTGRAY);
    private static _Container: HTMLElement = null;
    private static _Cursor: Cursor = null;
    private static _FlushBeforeWritePETSCII: number[] = [0x05, 0x07, 0x08, 0x09, 0x0A, 0x0D, 0x0E, 0x11, 0x12, 0x13, 0x14, 0x1c, 0x1d, 0x1e, 0x1f, 0x81, 0x8d, 0x8e, 0x90, 0x91, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0x9b, 0x9c, 0x9d, 0x9e, 0x9f];
    private static _Font: CrtFont = null;
    private static _InScrollBack: boolean = false;
    private static _KeyBuf: KeyPressEvent[] = [];
    private static _LastChar: number = 0x00;
    private static _LocalEcho: boolean = false;
    private static _ScreenSize: Point = new Point(80, 25);
    private static _ScrollBack: CharInfo[][] = null;
    private static _ScrollBackPosition: number = -1;
    private static _ScrollBackSize: number = 500;
    private static _ScrollBackTemp: CharInfo[][] = null;
    private static _TempCanvas: HTMLCanvasElement = null;
    private static _TempCanvasContext: CanvasRenderingContext2D = null;
    private static _Transparent: Boolean = false;
    private static _WindMin: number = 0;
    private static _WindMax: number = (80 - 1) | ((25 - 1) << 8);

    public static Init(container: HTMLElement): boolean {
        this._Container = container;

        this._Font = new CrtFont();
        this._Font.onchange.on((): void => { this.OnFontChanged(); });

        // Create the canvas
        this._Canvas = document.createElement('canvas');
        this._Canvas.id = 'fTelnetCrtCanvas';
        this._Canvas.innerHTML = 'Your browser does not support the HTML5 Canvas element!<br>The latest version of every major web browser supports this element, so please consider upgrading now:<ul><li><a href="http://www.mozilla.com/firefox/">Mozilla Firefox</a></li><li><a href="http://www.google.com/chrome">Google Chrome</a></li><li><a href="http://www.apple.com/safari/">Apple Safari</a></li><li><a href="http://www.opera.com/">Opera</a></li><li><a href="http://windows.microsoft.com/en-US/internet-explorer/products/ie/home">MS Internet Explorer</a></li></ul>';
        this._Canvas.style.zIndex = '50'; // TODO Maybe a constant from another file to help keep zindexes correct for different elements?
        this._Canvas.width = this._Font.Width * this._ScreenSize.x;
        if (DetectMobileBrowser.IsMobile) {
            this._Canvas.height = this._Font.Height * this._ScreenSize.y;
        } else {
            this._Canvas.height = this._Font.Height * (this._ScreenSize.y + this._ScrollBackSize);
        }

        // Check for Canvas support
        if (!this._Canvas.getContext) {
            console.log('fTelnet Error: Canvas not supported');
            return false;
        }

        // Add crt to container
        this._Container.appendChild(this._Canvas);

        // Register keydown and keypress handlers
        window.addEventListener('keydown', (ke: KeyboardEvent): void => { this.OnKeyDown(ke); }, false); // For special keys
        window.addEventListener('keypress', (ke: KeyboardEvent): void => { this.OnKeyPress(ke); }, false); // For regular keys
        window.addEventListener('resize', (): void => { this.OnResize(); }, false);

        // Reset the screen buffer
        this.InitBuffers(true);

        // Create the cursor
        this._Cursor = new Cursor(this._Container, CrtFont.ANSI_COLOURS[this.LIGHTGRAY], this._Font.Size);
        this._Cursor.onhide.on((): void => { this.OnBlinkHide(); });
        this._Cursor.onshow.on((): void => { this.OnBlinkShow(); });

        // Update the WindMin/WindMax records
        this._WindMin = 0;
        this._WindMax = (this._ScreenSize.x - 1) | ((this._ScreenSize.y - 1) << 8);

        // Create the context
        this._CanvasContext = this._Canvas.getContext('2d');
        this._CanvasContext.font = '12pt monospace';
        this._CanvasContext.textBaseline = 'top';

        // Create the buffer canvas and context for scrolling
        if (!DetectMobileBrowser.IsMobile) {
            this._TempCanvas = document.createElement('canvas');
            this._TempCanvas.width = this._Canvas.width;
            this._TempCanvas.height = this._Canvas.height;
            this._TempCanvasContext = this._TempCanvas.getContext('2d');
            this._TempCanvasContext.font = '12pt monospace';
            this._TempCanvasContext.textBaseline = 'top';
            
            // Black out the scrollback
            this._CanvasContext.fillStyle = 'black';
            this._CanvasContext.fillRect(0, 0, this._Canvas.width, this._Canvas.height);
        }

        // Clear the screen
        this.ClrScr();

        return true;
    }

    public static get Atari(): boolean {
        return this._Atari;
    }

    public static set Atari(value: boolean) {
        this._Atari = value;
    }

    public static Beep(): void {
        /*TODO
        var Duration = 44100 * 0.3; // 0.3 = 300ms
        var Frequency = 440; // 440hz

        */
    }

    public static get Blink(): boolean {
        return this._Blink;
    }

    public static set Blink(value: boolean) {
        this._Blink = value;
    }

    public static get BareLFtoCRLF(): boolean {
        return this._BareLFtoCRLF;
    }

    public static set BareLFtoCRLF(value: boolean) {
        this._BareLFtoCRLF = value;
    }

    public static get C64(): boolean {
        return this._C64;
    }

    public static set C64(value: boolean) {
        this._C64 = value;
    }

    public static get Canvas(): HTMLCanvasElement {
        return this._Canvas;
    }

    public static ClrBol(): void {
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
        this.FastWrite(StringUtils.NewString(' ', this.WhereX()), this.WindMinX + 1, this.WhereYA(), this._CharInfo);
    }

    public static ClrBos(): void {
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
        this.ScrollUpWindow(this.WhereY() - 1);
        this.ScrollDownWindow(this.WhereY() - 1);
        // Clear start of current row
        this.ClrBol();
    }

    public static ClrEol(): void {
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
        this.FastWrite(StringUtils.NewString(' ', (this.WindMaxX + 1) - this.WhereX() + 1), this.WhereXA(), this.WhereYA(), this._CharInfo);
    }

    public static ClrEos(): void {
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
        this.ScrollDownWindow(this.WindRows - this.WhereY());
        this.ScrollUpWindow(this.WindRows - this.WhereY());
        // Clear rest of current row
        this.ClrEol();
    }

    public static ClrLine(): void {
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
        this.FastWrite(StringUtils.NewString(' ', this.WindCols), this.WindMinX + 1, this.WhereYA(), this._CharInfo);
    }

    public static ClrScr(): void {
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
        this.ScrollUpWindow(this.WindRows);
        this.GotoXY(1, 1);
    }

    public static Conceal(): void {
        // Set the foreground to the background
        this.TextColor((this.TextAttr & 0xF0) >> 4);
    }

    public static get Cursor(): Cursor {
        return this._Cursor;
    }

    public static DelChar(count?: number): void {
        if (typeof count === 'undefined') { count = 1; }

        var i: number;
        for (i = this.WhereXA(); i <= this.WindMinX + this.WindCols - count; i++) {
            this.FastWrite(this._Buffer[this.WhereYA()][i + count].Ch, i, this.WhereYA(), this._Buffer[this.WhereYA()][i + count]);
        }
        for (i = this.WindMinX + this.WindCols + 1 - count; i <= this.WindMinX + this.WindCols; i++) {
            this.FastWrite(' ', i, this.WhereYA(), this._CharInfo);
        }
    }

    public static DelLine(count?: number): void {
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
        if (typeof count === 'undefined') { count = 1; }
        this.ScrollUpCustom(this.WindMinX + 1, this.WhereYA(), this.WindMaxX + 1, this.WindMaxY + 1, count, this._CharInfo);
    }

    public static EnterScrollBack(): void {
        // Non-mobile have modern scrollback
        if (!DetectMobileBrowser.IsMobile) return;

        if (!this._InScrollBack) {
            this._InScrollBack = true;

            var NewRow: CharInfo[];
            var X: number;
            var Y: number;

            // Make copy of current scrollback buffer in temp scrollback buffer
            this._ScrollBackTemp = [];
            for (Y = 0; Y < this._ScrollBack.length; Y++) {
                NewRow = [];
                for (X = 0; X < this._ScrollBack[Y].length; X++) {
                    NewRow.push(new CharInfo(this._ScrollBack[Y][X].Ch, this._ScrollBack[Y][X].Attr, this._ScrollBack[Y][X].Blink, this._ScrollBack[Y][X].Underline, this._ScrollBack[Y][X].Reverse));
                }
                this._ScrollBackTemp.push(NewRow);
            }

            // Add current screen to temp scrollback buffer
            // TODO Unused var YOffset: number = this._ScrollBackTemp.length - 1;
            for (Y = 1; Y <= this._ScreenSize.y; Y++) {
                NewRow = [];
                for (X = 1; X <= this._ScreenSize.x; X++) {
                    NewRow.push(new CharInfo(this._Buffer[Y][X].Ch, this._Buffer[Y][X].Attr, this._Buffer[Y][X].Blink, this._Buffer[Y][X].Underline, this._Buffer[Y][X].Reverse));
                }
                this._ScrollBackTemp.push(NewRow);
            }

            // Set our position in the scrollback
            this._ScrollBackPosition = this._ScrollBackTemp.length;
        }
    }

    public static FastWrite(text: string, x: number, y: number, charInfo: CharInfo, updateBuffer?: boolean): void {
        /// <summary>
        /// Writes a string of text at the desired X/Y coordinate with the given text attribute.
        /// 
        /// FastWrite is not window-relative, and it does not wrap text that goes beyond the right edge of the screen.
        /// </summary>
        /// <param name='AText' type='String'>The text to write</param>
        /// <param name='AX' type='Number' integer='true'>The 1-based column to start the text</param>
        /// <param name='AY' type='Number' integer='true'>The 1-based row to start the text</param>
        /// <param name='ACharInfo' type='CharInfo'>The text attribute to colour the text</param>
        /// <param name='AUpdateBuffer' type='Boolean' optional='true'>Whether to update the internal buffer or not 
        ///   (default is true)< / param>
        if (typeof updateBuffer === 'undefined') { updateBuffer = true; }

        if ((x <= this._ScreenSize.x) && (y <= this._ScreenSize.y)) {
            var Chars = [];
            var CharCodes = [];
            var TextLength;

            if (text === null) {
                TextLength = 1;
                Chars.push(null);
                CharCodes.push(this._Transparent ? CrtFont.TRANSPARENT_CHARCODE : 32);
            } else {
                TextLength = text.length;
                for (var i: number = 0; i < TextLength; i++) {
                    Chars.push(text.charAt(i));
                    CharCodes.push(text.charCodeAt(i));
                }
            }

            for (var i: number = 0; i < TextLength; i++) {
                var Char: ImageData = this._Font.GetChar(CharCodes[i], charInfo);
                if (Char) {
                    if (DetectMobileBrowser.IsMobile) {
                        if ((!this._InScrollBack) || (this._InScrollBack && !updateBuffer)) {
                            this._CanvasContext.putImageData(Char, (x - 1 + i) * this._Font.Width, (y - 1) * this._Font.Height);
                        }
                    } else {
                        this._CanvasContext.putImageData(Char, (x - 1 + i) * this._Font.Width, (y - 1 + this._ScrollBackSize) * this._Font.Height);
                    }
                }

                if (updateBuffer) {
                    this._Buffer[y][x + i].Ch = Chars[i];
                    this._Buffer[y][x + i].Attr = charInfo.Attr;
                    this._Buffer[y][x + i].Blink = charInfo.Blink;
                    this._Buffer[y][x + i].Underline = charInfo.Underline;
                    this._Buffer[y][x + i].Reverse = charInfo.Reverse;
                }

                if (x + i >= this._ScreenSize.x) { break; }
            }
        }
    }

    public static FillScreen(ch: string): void {
        var Line: string = StringUtils.NewString(ch.charAt(0), this.ScreenCols);

        for (var Y: number = 1; Y <= this.ScreenRows; Y++) {
            this.FastWrite(Line, 1, Y, this._CharInfo);
        }
    }

    public static get Font(): CrtFont {
        return this._Font;
    }

    public static GotoXY(x: number, y: number): void {
        /// <summary>
        /// Moves the cursor to the given coordinates within the virtual screen.
        /// </summary>
        /// <remarks>
        /// The upper-left corner of the virtual screen corresponds to (1, 1).
        /// 
        /// GotoXY is window-relative.
        /// </remarks>
        /// <param name='AX'>The 1-based column to move to</param>
        /// <param name='AY'>The 1-based row to move to</param>
        if ((x >= 1) && (y >= 1) && ((x - 1 + this.WindMinX) <= this.WindMaxX) && ((y - 1 + this.WindMinY) <= this.WindMaxY)) {
            this._Cursor.Position = new Point(x, y);
        }
    }

    public static HideCursor(): void {
        this._Cursor.Visible = false;
    }

    public static HighVideo(): void {
        /// <summary>
        /// Selects high-intensity characters.
        /// </summary>
        /// <remarks>
        /// There is a Byte variable in Crt TextAttr that is used to hold the current
        /// video attribute. HighVideo sets the high intensity bit of TextAttr's
        /// fore-ground color, thus mapping colors 0-7 onto colors 8-15.
        /// </remarks>
        this.TextAttr |= 0x08;
    }

    // TODO Have to do this here because the static constructor doesn't seem to like the X and Y variables
    private static InitBuffers(initScrollBack: boolean): void {
        this._Buffer = [];
        for (var Y: number = 1; Y <= this._ScreenSize.y; Y++) {
            this._Buffer[Y] = [];
            for (var X: number = 1; X <= this._ScreenSize.x; X++) {
                this._Buffer[Y][X] = new CharInfo(null, this.LIGHTGRAY, false, false, false);
            }
        }

        if (initScrollBack) {
            this._ScrollBack = [];
        }
    }

    public static InsChar(count?: number): void {
        if (typeof count === 'undefined') { count = 1; }

        var i: number;
        for (i = this.WindMinX + this.WindCols; i >= this.WhereXA() + count; i--) {
            this.FastWrite(this._Buffer[this.WhereYA()][i - count].Ch, i, this.WhereYA(), this._Buffer[this.WhereYA()][i - count]);
        }
        for (i = this.WhereXA(); i < this.WhereXA() + count; i++) {
            this.FastWrite(' ', i, this.WhereYA(), this._CharInfo);
        }
    }

    public static InsLine(count?: number): void {
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
        if (typeof count === 'undefined') { count = 1; }
        this.ScrollDownCustom(this.WindMinX + 1, this.WhereYA(), this.WindMaxX + 1, this.WindMaxY + 1, count, this._CharInfo);

    }

    public static KeyPressed(): boolean {
        return (this._KeyBuf.length > 0);
    }

    public static set LocalEcho(value: boolean) {
        this._LocalEcho = value;
    }

    public static LowVideo(): void {
        /// <summary>
        /// Selects low intensity characters.
        /// </summary>
        /// <remarks>
        /// There is a Byte variable in Crt--TextAttr--that holds the current video
        /// attribute. LowVideo clears the high-intensity bit of TextAttr's foreground
        /// color, thus mapping colors 8 to 15 onto colors 0 to 7.
        /// </remarks>
        this.TextAttr &= 0xF7;
    }

    public static NormVideo(): void {
        /// <summary>
        /// Selects the original text attribute read from the cursor location at startup.
        /// </summary>
        /// <remarks>
        /// There is a Byte variable in Crt--TextAttr--that holds the current video
        /// attribute. NormVideo restores TextAttr to the value it had when the program
        /// was started.
        /// </remarks>
        if (this._C64) {
            this._CharInfo.Attr = this.PETSCII_WHITE;
        } else {
            this._CharInfo.Attr = this.LIGHTGRAY;
        }
        this._CharInfo.Blink = false;
        this._CharInfo.Underline = false;
        this._CharInfo.Reverse = false;
    }

    private static OnBlinkHide(): void {
        // Only hide the text if blink is enabled
        if (this._Blink) {
            this._BlinkHidden = true;

            for (var Y: number = 1; Y <= this._ScreenSize.y; Y++) {
                for (var X: number = 1; X <= this._ScreenSize.x; X++) {
                    if (this._Buffer[Y][X].Blink) {
                        if (this._Buffer[Y][X].Ch !== ' ') {
                            this.FastWrite(' ', X, Y, this._Buffer[Y][X], false);
                        }
                    }
                }
            }
        }
    }

    private static OnBlinkShow(): void {
        // Show the text if blink is enabled, or we need a reset (which happens when blink is diabled while in the hidden state)
        if (this._Blink || this._BlinkHidden) {
            this._BlinkHidden = false;

            for (var Y: number = 1; Y <= this._ScreenSize.y; Y++) {
                for (var X: number = 1; X <= this._ScreenSize.x; X++) {
                    if (this._Buffer[Y][X].Blink) {
                        if (this._Buffer[Y][X].Ch !== ' ') {
                            this.FastWrite(this._Buffer[Y][X].Ch, X, Y, this._Buffer[Y][X], false);
                        }
                    }
                }
            }
        }

        // Reposition the cursor
        this._Cursor.WindowOffset = Offset.getOffset(this._Canvas);
    }

    private static OnFontChanged(): void {
        // Resize the cursor
        this._Cursor.Size = this._Font.Size;

        // Update the canvas
        this._Canvas.width = this._Font.Width * this._ScreenSize.x;
        if (DetectMobileBrowser.IsMobile) {
            this._Canvas.height = this._Font.Height * this._ScreenSize.y;
        } else {
            this._Canvas.height = this._Font.Height * (this._ScreenSize.y + this._ScrollBackSize);
            this._CanvasContext.fillRect(0, 0, this._Canvas.width, this._Canvas.height);
            this._TempCanvas.width = this._Canvas.width;
            this._TempCanvas.height = this._Canvas.height;
        }

        // Restore the screen contents
        if (this._Buffer !== null) {
            for (var Y: number = 1; Y <= this._ScreenSize.y; Y++) {
                for (var X: number = 1; X <= this._ScreenSize.x; X++) {
                    this.FastWrite(this._Buffer[Y][X].Ch, X, Y, this._Buffer[Y][X], false);
                }
            }
        }

        this.onfontchange.trigger();
    }

    private static OnKeyDown(ke: KeyboardEvent): void {
        // Skip out if we've focused an input element
        if ((ke.target instanceof HTMLInputElement) || (ke.target instanceof HTMLTextAreaElement)) { return; }

        if (this._InScrollBack) {
            var i: number;
            var X: number;
            var XEnd: number;
            var Y: number;
            var YDest: number;
            var YSource: number;

            // TODO Handle HOME and END?
            if (ke.keyCode === Keyboard.DOWN) {
                if (this._ScrollBackPosition < this._ScrollBackTemp.length) {
                    this._ScrollBackPosition += 1;
                    this.ScrollUpCustom(1, 1, this._ScreenSize.x, this._ScreenSize.y, 1, new CharInfo(' ', 7, false, false, false), false);

                    YDest = this._ScreenSize.y;
                    YSource = this._ScrollBackPosition - 1;
                    XEnd = Math.min(this._ScreenSize.x, this._ScrollBackTemp[YSource].length);
                    for (X = 0; X < XEnd; X++) {
                        this.FastWrite(this._ScrollBackTemp[YSource][X].Ch, X + 1, YDest, this._ScrollBackTemp[YSource][X], false);
                    }
                }
            } else if (ke.keyCode === Keyboard.ESCAPE) {
                // Restore the screen contents
                if (this._Buffer !== null) {
                    for (Y = 1; Y <= this._ScreenSize.y; Y++) {
                        for (X = 1; X <= this._ScreenSize.x; X++) {
                            this.FastWrite(this._Buffer[Y][X].Ch, X, Y, this._Buffer[Y][X], false);
                        }
                    }
                }

                this._InScrollBack = false;
            } else if (ke.keyCode === Keyboard.PAGE_DOWN) {
                for (i = 0; i < this._ScreenSize.y; i++) {
                    this.PushKeyDown(Keyboard.DOWN, Keyboard.DOWN, false, false, false);
                }
            } else if (ke.keyCode === Keyboard.PAGE_UP) {
                for (i = 0; i < this._ScreenSize.y; i++) {
                    this.PushKeyDown(Keyboard.UP, Keyboard.UP, false, false, false);
                }
            } else if (ke.keyCode === Keyboard.UP) {
                if (this._ScrollBackPosition > this._ScreenSize.y) {
                    this._ScrollBackPosition -= 1;
                    this.ScrollDownCustom(1, 1, this._ScreenSize.x, this._ScreenSize.y, 1, new CharInfo(' ', 7, false, false), false);

                    YDest = 1;
                    YSource = this._ScrollBackPosition - this._ScreenSize.y;
                    XEnd = Math.min(this._ScreenSize.x, this._ScrollBackTemp[YSource].length);
                    for (X = 0; X < XEnd; X++) {
                        this.FastWrite(this._ScrollBackTemp[YSource][X].Ch, X + 1, YDest, this._ScrollBackTemp[YSource][X], false);
                    }
                }
            }

            ke.preventDefault();

            return;
        }

        var keyString: string = '';

        if (this._Atari) {
            if (ke.ctrlKey) {
                if ((ke.keyCode >= 65) && (ke.keyCode <= 90)) {
                    switch (ke.keyCode) {
                        case 72: keyString = String.fromCharCode(126); break; // CTRL-H
                        case 74: keyString = String.fromCharCode(13); break; // CTRL-J
                        case 77: keyString = String.fromCharCode(155); break; // CTRL-M
                        default: keyString = String.fromCharCode(ke.keyCode - 64); break;
                    }
                } else if ((ke.keyCode >= 97) && (ke.keyCode <= 122)) {
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
                    case Keyboard.BACKSPACE: keyString = '\x7E'; break;
                    case Keyboard.DELETE: keyString = '\x7E'; break;
                    case Keyboard.DOWN: keyString = '\x1D'; break;
                    case Keyboard.ENTER: keyString = '\x9B'; break;
                    case Keyboard.LEFT: keyString = '\x1E'; break;
                    case Keyboard.RIGHT: keyString = '\x1F'; break;
                    case Keyboard.SPACE: keyString = ' '; break;
                    case Keyboard.TAB: keyString = '\x7F'; break;
                    case Keyboard.UP: keyString = '\x1C'; break;
                }
            }
        } else if (this._C64) {
            switch (ke.keyCode) {
                // Handle special keys
                case Keyboard.BACKSPACE: keyString = '\x14'; break;
                case Keyboard.DELETE: keyString = '\x14'; break;
                case Keyboard.DOWN: keyString = '\x11'; break;
                case Keyboard.ENTER: keyString = '\r'; break;
                case Keyboard.F1: keyString = '\x85'; break;
                case Keyboard.F2: keyString = '\x89'; break;
                case Keyboard.F3: keyString = '\x86'; break;
                case Keyboard.F4: keyString = '\x8A'; break;
                case Keyboard.F5: keyString = '\x87'; break;
                case Keyboard.F6: keyString = '\x8B'; break;
                case Keyboard.F7: keyString = '\x88'; break;
                case Keyboard.F8: keyString = '\x8C'; break;
                case Keyboard.HOME: keyString = '\x13'; break;
                case Keyboard.INSERT: keyString = '\x94'; break;
                case Keyboard.LEFT: keyString = '\x9D'; break;
                case Keyboard.RIGHT: keyString = '\x1D'; break;
                case Keyboard.SPACE: keyString = ' '; break;
                case Keyboard.UP: keyString = '\x91'; break;
            }
        } else {
            if (ke.ctrlKey) {
                // Handle control + letter keys
                if ((ke.keyCode >= 65) && (ke.keyCode <= 90)) {
                    keyString = String.fromCharCode(ke.keyCode - 64);
                } else if ((ke.keyCode >= 97) && (ke.keyCode <= 122)) {
                    keyString = String.fromCharCode(ke.keyCode - 96);
                }
            } else {
                switch (ke.keyCode) {
                    // Handle special keys
                    case Keyboard.BACKSPACE: keyString = '\b'; break;
                    case Keyboard.DELETE: keyString = '\x7F'; break;
                    case Keyboard.DOWN: keyString = '\x1B[B'; break;
                    case Keyboard.END: keyString = '\x1B[K'; break;
                    case Keyboard.ENTER: keyString = '\r\n'; break;
                    case Keyboard.ESCAPE: keyString = '\x1B'; break;
                    case Keyboard.F1: keyString = '\x1BOP'; break;
                    case Keyboard.F2: keyString = '\x1BOQ'; break;
                    case Keyboard.F3: keyString = '\x1BOR'; break;
                    case Keyboard.F4: keyString = '\x1BOS'; break;
                    case Keyboard.F5: keyString = '\x1BOt'; break;
                    case Keyboard.F6: keyString = '\x1B[17~'; break;
                    case Keyboard.F7: keyString = '\x1B[18~'; break;
                    case Keyboard.F8: keyString = '\x1B[19~'; break;
                    case Keyboard.F9: keyString = '\x1B[20~'; break;
                    case Keyboard.F10: keyString = '\x1B[21~'; break;
                    case Keyboard.F11: keyString = '\x1B[23~'; break;
                    case Keyboard.F12: keyString = '\x1B[24~'; break;
                    case Keyboard.HOME: keyString = '\x1B[H'; break;
                    case Keyboard.INSERT: keyString = '\x1B@'; break;
                    case Keyboard.LEFT: keyString = '\x1B[D'; break;
                    case Keyboard.PAGE_DOWN: keyString = '\x1B[U'; break;
                    case Keyboard.PAGE_UP: keyString = '\x1B[V'; break;
                    case Keyboard.RIGHT: keyString = '\x1B[C'; break;
                    case Keyboard.SPACE: keyString = ' '; break;
                    case Keyboard.TAB: keyString = '\t'; break;
                    case Keyboard.UP: keyString = '\x1B[A'; break;
                }
            }
        }

        this._KeyBuf.push(new KeyPressEvent(ke, keyString));

        if ((keyString) || (ke.ctrlKey)) {
            ke.preventDefault();
            this.onkeypressed.trigger();
        }
    }

    private static OnKeyPress(ke: KeyboardEvent): void {
        // Skip out if we've focused an input element
        if ((ke.target instanceof HTMLInputElement) || (ke.target instanceof HTMLTextAreaElement)) { return; }

        if (this._InScrollBack) { return; }

        var keyString: string = '';

        if (ke.altKey || ke.ctrlKey) { return; } // This is only meant for regular keypresses

        // Opera doesn't give us the charCode, so try which in that case
        var which: number = (ke.charCode !== null) ? ke.charCode : ke.which;
        if (this._Atari) {
            if ((which >= 33) && (which <= 122)) {
                keyString = String.fromCharCode(which);
            }
        } else if (this._C64) {
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
            // TODO This breaks input of French accented chars.  Is there a problem with the simplified check?
            // if ((which >= 33) && (which <= 126)) {
            if (which >= 33) {
                keyString = String.fromCharCode(which);
            }
        }

        this._KeyBuf.push(new KeyPressEvent(ke, keyString));

        if (keyString) {
            ke.preventDefault();
            this.onkeypressed.trigger();
        }
    }

    private static OnResize(): void {
        // See if we can switch to a different font size
        if (this._AllowDynamicFontResize) {
            Crt.SetFont(this._Font.Name);
        }
    }

    public static PushKeyDown(pushedCharCode: number, pushedKeyCode: number, ctrl: boolean, alt: boolean, shift: boolean): void {
        this.OnKeyDown(<KeyboardEvent>{
            altKey: alt,
            charCode: pushedCharCode,
            ctrlKey: ctrl,
            keyCode: pushedKeyCode,
            shiftKey: shift,
            preventDefault: function (): void { /* do nothing */ }
        });
    }

    public static PushKeyPress(pushedCharCode: number, pushedKeyCode: number, ctrl: boolean, alt: boolean, shift: boolean): void {
        this.OnKeyPress(<KeyboardEvent>{
            altKey: alt,
            charCode: pushedCharCode,
            ctrlKey: ctrl,
            keyCode: pushedKeyCode,
            shiftKey: shift,
            preventDefault: function (): void { /* do nothing */ }
        });
    }

    public static ReadKey(): KeyPressEvent {
        if (this._KeyBuf.length === 0) { return null; }

        var KPE: KeyPressEvent = this._KeyBuf.shift();
        if (this._LocalEcho) {
            this.Write(KPE.keyString);
        }
        return KPE;
    }

    public static ReDraw(): void {
        for (var Y: number = 1; Y <= this._ScreenSize.y; Y++) {
            for (var X: number = 1; X <= this._ScreenSize.x; X++) {
                this.FastWrite(this._Buffer[Y][X].Ch, X, Y, this._Buffer[Y][X], false);
            }
        }
    }

    public static RestoreScreen(buffer: CharInfo[][], left: number, top: number, right: number, bottom: number): void {
        var Height: number = bottom - top + 1;
        var Width: number = right - left + 1;

        for (var Y: number = 0; Y < Height; Y++) {
            for (var X: number = 0; X < Width; X++) {
                this.FastWrite(buffer[Y][X].Ch, X + left, Y + top, buffer[Y][X]);
            }
        }
    }

    public static ReverseVideo(): void {
        /// <summary>
        /// Reverses the foreground and background text attributes
        /// </summary>
        this.TextAttr = ((this.TextAttr & 0xF0) >> 4) | ((this.TextAttr & 0x0F) << 4);
    }

    public static SaveScreen(left: number, top: number, right: number, bottom: number): CharInfo[][] {
        var Height: number = bottom - top + 1;
        var Width: number = right - left + 1;
        var Result: CharInfo[][] = [];

        for (var Y: number = 0; Y < Height; Y++) {
            Result[Y] = [];
            for (var X: number = 0; X < Width; X++) {
                Result[Y][X] = new CharInfo(this._Buffer[Y + top][X + left].Ch, this._Buffer[Y + top][X + left].Attr, this._Buffer[Y + top][X + left].Blink, this._Buffer[Y + top][X + left].Underline, this._Buffer[Y + top][X + left].Reverse);
            }
        }

        return Result;
    }

    public static get ScreenCols(): number {
        return this._ScreenSize.x;
    }

    public static get ScreenRows(): number {
        return this._ScreenSize.y;
    }

    public static ScrollDownCustom(left: number, top: number, right: number, bottom: number, count: number, charInfo: CharInfo, updateBuffer?: boolean): void {
        /// <summary>
        /// Scrolls the given window down the given number of lines (leaving blank lines at the top), 
        /// filling the void with the given character with the given text attribute
        /// </summary>
        /// <param name='AX1'>The 1-based left column of the window</param>
        /// <param name='AY1'>The 1-based top row of the window</param>
        /// <param name='AX2'>The 1-based right column of the window</param>
        /// <param name='AY2'>The 1-based bottom row of the window</param>
        /// <param name='ALines'>The number of lines to scroll</param>
        /// <param name='ACh'>The character to fill the void with</param>
        /// <param name='ACharInfo'>The text attribute to fill the void with</param>

        // Handle optional parameters
        if (typeof updateBuffer === 'undefined') { updateBuffer = true; }

        // Validate the ALines parameter
        var MaxLines: number = bottom - top + 1;
        if (count > MaxLines) { count = MaxLines; }

        // Scroll -- TODO Hasn't been tested yet
        var Left: number = (left - 1) * this._Font.Width;
        var Top: number = (top - 1) * this._Font.Height;
        var Width: number = (right - left + 1) * this._Font.Width;
        var Height: number = ((bottom - top + 1 - count) * this._Font.Height);
        if (Height > 0) {
            var Buf: ImageData = this._CanvasContext.getImageData(Left, Top, Width, Height);
            Left = (left - 1) * this._Font.Width;
            Top = (top - 1 + count) * this._Font.Height;
            this._CanvasContext.putImageData(Buf, Left, Top);
        }

        // Blank -- TODO Hasn't been tested yet
        // TODO This fails for maskreet in Chrome -- looks like it sometimes decides to ignore the call to fillRect()
        //this._CanvasContext.fillStyle = '#' + StringUtils.PadLeft(CrtFont.ANSI_COLOURS[(charInfo.Attr & 0xF0) >> 4].toString(16), '0', 6);
        //Left = (left - 1) * this._Font.Width;
        //Top = (top - 1) * this._Font.Height;
        //Width = (right - left + 1) * this._Font.Width;
        //Height = (count * this._Font.Height);
        //this._CanvasContext.fillRect(Left, Top, Width, Height);
        var Blanks: string = StringUtils.PadLeft('', ' ', right - left + 1);
        for (var Line: number = 0; Line < count; Line++) {
            this.FastWrite(Blanks, left, top + Line, charInfo, false);
        }

        if (updateBuffer) {
            // Now to adjust the buffer
            var X: number = 0;
            var Y: number = 0;

            // First, shuffle the contents that are still visible
            for (Y = bottom; Y > count; Y--) {
                for (X = left; X <= right; X++) {
                    this._Buffer[Y][X].Ch = this._Buffer[Y - count][X].Ch;
                    this._Buffer[Y][X].Attr = this._Buffer[Y - count][X].Attr;
                    this._Buffer[Y][X].Blink = this._Buffer[Y - count][X].Blink;
                    this._Buffer[Y][X].Underline = this._Buffer[Y - count][X].Underline;
                    this._Buffer[Y][X].Reverse = this._Buffer[Y - count][X].Reverse;
                }
            }

            // Then, blank the contents that are not
            for (Y = top; Y <= count; Y++) {
                for (X = left; X <= right; X++) {
                    this._Buffer[Y][X].Ch = charInfo.Ch;
                    this._Buffer[Y][X].Attr = charInfo.Attr;
                    this._Buffer[Y][X].Blink = charInfo.Blink;
                    this._Buffer[Y][X].Underline = charInfo.Underline;
                    this._Buffer[Y][X].Reverse = charInfo.Reverse;
                }
            }
        }
    }

    public static ScrollDownScreen(count: number): void {
        /// <summary>
        /// Scrolls the screen down the given number of lines (leaving blanks at the top)
        /// </summary>
        /// <param name='ALines'>The number of lines to scroll</param>
        this.ScrollDownCustom(1, 1, this._ScreenSize.x, this._ScreenSize.y, count, this._CharInfo);
    }

    public static ScrollDownWindow(count: number): void {
        /// <summary>
        /// Scrolls the current window down the given number of lines (leaving blanks at the top)
        /// </summary>
        /// <param name='ALines'>The number of lines to scroll</param>
        this.ScrollDownCustom(this.WindMinX + 1, this.WindMinY + 1, this.WindMaxX + 1, this.WindMaxY + 1, count, this._CharInfo);
    }

    public static ScrollUpCustom(left: number, top: number, right: number, bottom: number, count: number, charInfo: CharInfo, updateBuffer?: boolean): void {
        /// <summary>
        /// Scrolls the given window up the given number of lines (leaving blank lines at the bottom), 
        /// filling the void with the given character with the given text attribute
        /// </summary>
        /// <param name='AX1'>The 1-based left column of the window</param>
        /// <param name='AY1'>The 1-based top row of the window</param>
        /// <param name='AX2'>The 1-based right column of the window</param>
        /// <param name='AY2'>The 1-based bottom row of the window</param>
        /// <param name='ALines'>The number of lines to scroll</param>
        /// <param name='ACh'>The character to fill the void with</param>
        /// <param name='ACharInfo'>The text attribute to fill the void with</param>

        // Handle optional parameters
        if (typeof updateBuffer === 'undefined') { updateBuffer = true; }

        // Validate the ALines parameter
        var MaxLines: number = bottom - top + 1;
        if (count > MaxLines) { count = MaxLines; }

        if ((!this._InScrollBack) || (this._InScrollBack && !updateBuffer)) {
            if (DetectMobileBrowser.IsMobile) {
                // Scroll
                var Left: number = (left - 1) * this._Font.Width;
                var Top: number = (top - 1 + count) * this._Font.Height;
                var Width: number = (right - left + 1) * this._Font.Width;
                var Height: number = ((bottom - top + 1 - count) * this._Font.Height);
                if (Height > 0) {
                    var Buf: ImageData = this._CanvasContext.getImageData(Left, Top, Width, Height);
                    Left = (left - 1) * this._Font.Width;
                    Top = (top - 1) * this._Font.Height;
                    this._CanvasContext.putImageData(Buf, Left, Top);
                }
            } else {
                if ((left == 1) && (top == 1) && (right == this._ScreenSize.x) && (bottom == this._ScreenSize.y)) {
                    // Scroll the lines into the scrollback region
                    var Left: number = 0;
                    var Top: number = count * this._Font.Height;
                    var Width: number = this._Canvas.width;
                    var Height: number = this._Canvas.height - Top;

                    // From: http://stackoverflow.com/a/6003174/342378
                    this._TempCanvasContext.drawImage(this._Canvas, 0, 0);
                    this._CanvasContext.drawImage(this._TempCanvas, 0, Top, Width, Height, 0, 0, Width, Height);
                } else {
                    // Just scroll the selected region and leave scrollback alone
                    // TODO Needs to be tested (likely needs Top to be adjusted for scrollback buffer size?)
                    var Left: number = (left - 1) * this._Font.Width;
                    var Top: number = (top - 1 + count) * this._Font.Height;
                    var Width: number = (right - left + 1) * this._Font.Width;
                    var Height: number = ((bottom - top + 1 - count) * this._Font.Height);
                    if (Height > 0) {
                        var Buf: ImageData = this._CanvasContext.getImageData(Left, Top, Width, Height);
                        Left = (left - 1) * this._Font.Width;
                        Top = (top - 1) * this._Font.Height;
                        this._CanvasContext.putImageData(Buf, Left, Top);
                    }
                }
            }

            // Blank
            // TODO This fails for maskreet in Chrome -- looks like it sometimes decides to ignore the call to fillRect()
            //this._CanvasContext.fillStyle = '#' + StringUtils.PadLeft(CrtFont.ANSI_COLOURS[(charInfo.Attr & 0xF0) >> 4].toString(16), '0', 6);
            //Left = (left - 1) * this._Font.Width;
            //Top = (bottom - count) * this._Font.Height;
            //Width = (right - left + 1) * this._Font.Width;
            //Height = (count * this._Font.Height);
            //this._CanvasContext.fillRect(Left, Top, Width, Height);

            // Doesn't handle transparency
            //var Blanks: string = StringUtils.PadLeft('', ' ', right - left + 1);
            //for (var Line: number = 0; Line < count; Line++) {
            //    this.FastWrite(Blanks, left, bottom - count + 1 + Line, charInfo, false);
            //}

            // TODO If this works the other custom scroller needs to be updated too
            for (var y: number = 0; y < count; y++) {
                for (var x: number = left; x <= right; x++) {
                    this.FastWrite(null, x, bottom - count + 1 + y, charInfo, false);
                }
            }
        }

        if (updateBuffer) {
            // Now to adjust the buffer
            var NewRow: CharInfo[];
            var X: number;
            var Y: number;

            if (DetectMobileBrowser.IsMobile) {
                // First, store the contents of the scrolled lines in the scrollback buffer
                for (Y = 0; Y < count; Y++) {
                    NewRow = [];
                    for (X = left; X <= right; X++) {
                        NewRow.push(new CharInfo(this._Buffer[Y + top][X].Ch, this._Buffer[Y + top][X].Attr, this._Buffer[Y + top][X].Blink, this._Buffer[Y + top][X].Underline, this._Buffer[Y + top][X].Reverse));
                    }
                    this._ScrollBack.push(NewRow);
                }
                // Trim the scrollback to 1000 lines, if necessary
                var ScrollBackLength: number = this._ScrollBack.length;
                while (ScrollBackLength > (this._ScrollBackSize - 2)) {
                    this._ScrollBack.shift();
                    ScrollBackLength -= 1;
                }
            }

            // Then, shuffle the contents that are still visible
            for (Y = top; Y <= (bottom - count); Y++) {
                for (X = left; X <= right; X++) {
                    this._Buffer[Y][X].Ch = this._Buffer[Y + count][X].Ch;
                    this._Buffer[Y][X].Attr = this._Buffer[Y + count][X].Attr;
                    this._Buffer[Y][X].Blink = this._Buffer[Y + count][X].Blink;
                    this._Buffer[Y][X].Underline = this._Buffer[Y + count][X].Underline;
                    this._Buffer[Y][X].Reverse = this._Buffer[Y + count][X].Reverse;
                }
            }

            // Then, blank the contents that are not
            for (Y = bottom; Y > (bottom - count); Y--) {
                for (X = left; X <= right; X++) {
                    this._Buffer[Y][X].Ch = charInfo.Ch;
                    this._Buffer[Y][X].Attr = charInfo.Attr;
                    this._Buffer[Y][X].Blink = charInfo.Blink;
                    this._Buffer[Y][X].Underline = charInfo.Underline;
                    this._Buffer[Y][X].Reverse = charInfo.Reverse;
                }
            }
        }
    }

    public static ScrollUpScreen(count: number): void {
        /// <summary>
        /// Scrolls the screen up the given number of lines (leaving blanks at the bottom)
        /// </summary>
        /// <param name='ALines'>The number of lines to scroll</param>
        this.ScrollUpCustom(1, 1, this._ScreenSize.x, this._ScreenSize.y, count, this._CharInfo);
    }

    public static ScrollUpWindow(count: number): void {
        /// <summary>
        /// Scrolls the current window up the given number of lines (leaving blanks at the bottom)
        /// </summary>
        /// <param name='ALines'>The number of lines to scroll</param>
        this.ScrollUpCustom(this.WindMinX + 1, this.WindMinY + 1, this.WindMaxX + 1, this.WindMaxY + 1, count, this._CharInfo);
    }

    public static SetBlink(value: boolean): void {
        this._CharInfo.Blink = value;
    }

    public static SetBlinkRate(milliSeconds: number): void {
        this._Cursor.BlinkRate = milliSeconds;
    }

    public static SetFont(font: string): boolean {
        /// <summary>
        /// Try to set the console font size to characters with the given X and Y size
        /// </summary>
        /// <param name='AX'>The horizontal size</param>
        /// <param name='AY'>The vertical size</param>
        /// <returns>True if the size was found and set, False if the size was not available</returns>

        // Request the new font
        if (DetectMobileBrowser.IsMobile) {
            return this._Font.Load(font, Math.floor(this._Container.clientWidth / this._ScreenSize.x), Math.floor(window.innerHeight / this._ScreenSize.y));
        } else {
            // With modern scrollbar the container is the same width as the canvas, so we need to look at the parent container to see the maximum client size
            return this._Font.Load(font, Math.floor(this._Container.parentElement.clientWidth / this._ScreenSize.x), Math.floor(window.innerHeight / this._ScreenSize.y));
        }
    }

    // TODO Doesn't seem to be working
    public static SetScreenSize(columns: number, rows: number): void {
        // Check if we're in scrollback
        if (this._InScrollBack) { return; }

        // Check if the requested size is already in use
        if ((columns === this._ScreenSize.x) && (rows === this._ScreenSize.y)) { return; }

        var X: number = 0;
        var Y: number = 0;

        // Save the old details
        var OldBuffer: CharInfo[][];
        if (this._Buffer !== null) {
            OldBuffer = [];
            for (Y = 1; Y <= this._ScreenSize.y; Y++) {
                OldBuffer[Y] = [];
                for (X = 1; X <= this._ScreenSize.x; X++) {
                    OldBuffer[Y][X] = new CharInfo(this._Buffer[Y][X].Ch, this._Buffer[Y][X].Attr, this._Buffer[Y][X].Blink, this._Buffer[Y][X].Underline, this._Buffer[Y][X].Reverse);
                }
            }
        }
        var OldScreenSize: Point = new Point(this._ScreenSize.x, this._ScreenSize.y);

        // Set the new console screen size
        this._ScreenSize.x = columns;
        this._ScreenSize.y = rows;

        // Update the WindMin/WindMax records
        this._WindMin = 0;
        this._WindMax = (this._ScreenSize.x - 1) | ((this._ScreenSize.y - 1) << 8);

        // Reset the screen buffer 
        this.InitBuffers(false);

        // Update the canvas
        this._Canvas.width = this._Font.Width * this._ScreenSize.x;
        if (DetectMobileBrowser.IsMobile) {
            this._Canvas.height = this._Font.Height * this._ScreenSize.y;
        } else {
            this._Canvas.height = this._Font.Height * (this._ScreenSize.y + this._ScrollBackSize);
            this._CanvasContext.fillRect(0, 0, this._Canvas.width, this._Canvas.height);
            this._TempCanvas.width = this._Canvas.width;
            this._TempCanvas.height = this._Canvas.height;
        }

        // Restore the screen contents
        // TODO If new screen is smaller than old screen, restore bottom portion not top portion
        if (OldBuffer !== null) {
            for (Y = 1; Y <= Math.min(this._ScreenSize.y, OldScreenSize.y); Y++) {
                for (X = 1; X <= Math.min(this._ScreenSize.x, OldScreenSize.x); X++) {
                    this.FastWrite(OldBuffer[Y][X].Ch, X, Y, OldBuffer[Y][X]);
                }
            }
        }

        // Let the program know about the update
        this.onscreensizechange.trigger();
    }

    public static ShowCursor(): void {
        this._Cursor.Visible = true;
    }

    public static get TextAttr(): number {
        /// <summary>
        /// Stores currently selected text attributes
        /// </summary>
        /// <remarks>
        /// The text attributes are normally set through calls to TextColor and
        /// TextBackground.
        ///
        /// However, you can also set them by directly storing a value in TextAttr.
        /// </remarks>
        return this._CharInfo.Attr;
    }

    public static set TextAttr(value: number) {
        this._CharInfo.Attr = value;
    }

    public static TextBackground(colour: number): void {
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
        /// <param name='AColor'>The colour to set the background to</param>
        this.TextAttr = (this.TextAttr & 0x0F) | ((colour & 0x0F) << 4);
    }

    public static TextColor(colour: number): void {
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
        /// <param name='AColor'>The colour to set the foreground to</param>
        this.TextAttr = (this.TextAttr & 0xF0) | (colour & 0x0F);
    }

    public static set Transparent(value: Boolean) {
        this._Transparent = value;
        // TODO Redraw
    }

    public static WhereX(): number {
        /// <summary>
        /// Returns the CP's X coordinate of the current cursor location.
        /// </summary>
        /// <remarks>
        /// WhereX is window-specific.
        /// </remarks>
        /// <returns>The 1-based column of the window the cursor is currently in</returns>
        return this._Cursor.Position.x;
    }

    public static WhereXA(): number {
        /// <summary>
        /// Returns the CP's X coordinate of the current cursor location.
        /// </summary>
        /// <remarks>
        /// WhereXA is not window-specific.
        /// </remarks>
        /// <returns>The 1-based column of the screen the cursor is currently in</returns>
        return this.WhereX() + this.WindMinX;
    }

    /// <summary>
    /// Returns the CP's Y coordinate of the current cursor location.
    /// </summary>
    /// <remarks>
    /// WhereY is window-specific.
    /// </remarks>
    /// <returns>The 1-based row of the window the cursor is currently in</returns>
    public static WhereY(): number {
        return this._Cursor.Position.y;
    }

    public static WhereYA(): number {
        /// <summary>
        /// Returns the CP's Y coordinate of the current cursor location.
        /// </summary>
        /// <remarks>
        /// WhereYA is now window-specific.
        /// </remarks>
        /// <returns>The 1-based row of the screen the cursor is currently in</returns>
        return this.WhereY() + this.WindMinY;
    }

    public static get WindCols(): number {
        /// <summary>
        /// The number of columns found in the currently defined window
        /// </summary>
        return this.WindMaxX - this.WindMinX + 1;
    }

    public static get WindMax(): number {
        /// <summary>
        /// The 0-based lower right coordinate of the current window
        /// </summary>
        return this._WindMax;
    }

    public static get WindMaxX(): number {
        /// <summary>
        /// The 0-based left column of the current window
        /// </summary>
        return (this.WindMax & 0x00FF);
    }

    public static get WindMaxY(): number {
        /// <summary>
        /// The 0-based right column of the current window
        /// </summary>
        return ((this.WindMax & 0xFF00) >> 8);
    }

    public static get WindMin(): number {
        /// <summary>
        /// The 0-based upper left coordinate of the current window
        /// </summary>
        return this._WindMin;
    }

    public static get WindMinX(): number {
        /// <summary>
        /// The 0-based top row of the current window
        /// </summary>
        return (this.WindMin & 0x00FF);
    }

    public static get WindMinY(): number {
        /// <summary>
        /// The 0-based bottom row of the current window
        /// </summary>
        return ((this.WindMin & 0xFF00) >> 8);
    }

    public static Window(left: number, top: number, right: number, bottom: number): void {
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
        /// <param name='AX1'>The 1-based left column of the window</param>
        /// <param name='AY1'>The 1-based top row of the window</param>
        /// <param name='AX2'>The 1-based right column of the window</param>
        /// <param name='AY2'>The 1-based bottom row of the window</param>
        if ((left >= 1) && (top >= 1) && (left <= right) && (top <= bottom)) {
            if ((right <= this._ScreenSize.x) && (bottom <= this._ScreenSize.y)) {
                this._WindMin = (left - 1) + ((top - 1) << 8);
                this._WindMax = (right - 1) + ((bottom - 1) << 8);
                this._Cursor.WindowOffset = new Point(left - 1, top - 1);
                this.GotoXY(1, 1);
            }
        }
    }

    public static get WindRows(): number {
        /// <summary>
        /// The number of rows found in the currently defined window
        /// </summary>
        return this.WindMaxY - this.WindMinY + 1;
    }

    public static Write(text: string): void {
        /// <summary>
        /// Writes a given line of text to the screen.
        /// </summary>
        /// <remarks>
        /// Text is wrapped if it exceeds the right edge of the window
        /// </remarks>
        /// <param name='AText'>The text to print to the screen</param>
        if (this._Atari) {
            this.WriteATASCII(text);
        } else if (this._C64) {
            this.WritePETSCII(text);
        } else {
            this.WriteASCII(text);
        }
    }

    private static WriteASCII(text: string): void {
        if (typeof text === 'undefined') { text = ''; }

        var X: number = this.WhereX();
        var Y: number = this.WhereY();
        var Buf: string = '';

        for (var i: number = 0; i < text.length; i++) {
            var DoGoto: boolean = false;

            if (text.charCodeAt(i) === 0x00) {
                // NULL, ignore
                i += 0; // Make JSLint happy (doesn't like empty block)
            } else if (text.charCodeAt(i) === 0x07) {
                this.Beep();
            } else if (text.charCodeAt(i) === 0x08) {
                // Backspace, need to flush buffer before moving cursor
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                if (X > 1) { X -= 1; }
                DoGoto = true;

                Buf = '';
            } else if (text.charCodeAt(i) === 0x09) {
                // Tab, need to flush buffer before moving cursor
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                Buf = '';

                // Figure out where the next tabstop is
                if (X === this.WindCols) {
                    // Cursor is in last position, tab goes to the first position of the next line
                    X = 1;
                    Y += 1;
                } else {
                    // Cursor goes to the next multiple of 8
                    X += 8 - (X % 8);

                    // Make sure we didn't tab beyond the width of the window (can happen if width of window is not 
                    // divisible by 8)
                    X = Math.min(X, this.WindCols);
                }
                DoGoto = true;
            } else if (text.charCodeAt(i) === 0x0A) {
                // Line feed, need to flush buffer before moving cursor
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                if (this._BareLFtoCRLF && (this._LastChar !== 0x0D)) {
                    // Bare LF, so pretend we also got a CR
                    X = 1;
                } else {
                    X += Buf.length;
                }
                Y += 1;
                DoGoto = true;

                Buf = '';
            } else if (text.charCodeAt(i) === 0x0C) {
                // Clear the screen
                this.ClrScr();

                // Reset the variables
                X = 1;
                Y = 1;
                Buf = '';
            } else if (text.charCodeAt(i) === 0x0D) {
                // Carriage return, need to flush buffer before moving cursor
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X = 1;
                DoGoto = true;

                Buf = '';
            } else if (text.charCodeAt(i) !== 0) {
                // Append character to buffer
                Buf += String.fromCharCode(text.charCodeAt(i) & 0xFF);

                // Check if we've passed the right edge of the window
                if ((X + Buf.length) > this.WindCols) {
                    // We have, need to flush buffer before moving cursor
                    this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                    Buf = '';

                    X = 1;
                    Y += 1;
                    DoGoto = true;
                }
            }

            // Store the last character (we use this for BareLFtoCRLF)
            this._LastChar = text.charCodeAt(i);

            // Check if we've passed the bottom edge of the window
            if (Y > this.WindRows) {
                // We have, need to scroll the window one line
                Y = this.WindRows;
                this.ScrollUpWindow(1);
                DoGoto = true;
            }

            if (DoGoto) { this.GotoXY(X, Y); }
        }

        // Flush remaining text in buffer if we have any
        if (Buf.length > 0) {
            this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
            X += Buf.length;
            this.GotoXY(X, Y);
        }
    }

    private static WriteATASCII(text: string): void {
        if (typeof text === 'undefined') { text = ''; }

        var X: number = this.WhereX();
        var Y: number = this.WhereY();
        var Buf: string = '';

        for (var i: number = 0; i < text.length; i++) {
            var DoGoto: boolean = false;

            if (text.charCodeAt(i) === 0x00) {
                // NULL, ignore
                i += 0; // Make JSLint happy (doesn't like empty block)
            } if ((text.charCodeAt(i) === 0x1B) && (!this._ATASCIIEscaped)) {
                // Escape
                this._ATASCIIEscaped = true;
            } else if ((text.charCodeAt(i) === 0x1C) && (!this._ATASCIIEscaped)) {
                // Cursor up, need to flush buffer before moving cursor
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                Y = (Y > 1) ? Y - 1 : this.WindRows;
                DoGoto = true;

                Buf = '';
            } else if ((text.charCodeAt(i) === 0x1D) && (!this._ATASCIIEscaped)) {
                // Cursor down, need to flush buffer before moving cursor
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                Y = (Y < this.WindRows) ? Y + 1 : 1;
                DoGoto = true;

                Buf = '';
            } else if ((text.charCodeAt(i) === 0x1E) && (!this._ATASCIIEscaped)) {
                // Cursor left, need to flush buffer before moving cursor
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                X = (X > 1) ? X - 1 : this.WindCols;
                DoGoto = true;

                Buf = '';
            } else if ((text.charCodeAt(i) === 0x1F) && (!this._ATASCIIEscaped)) {
                // Cursor right, need to flush buffer before moving cursor
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                X = (X < this.WindCols) ? X + 1 : 1;
                DoGoto = true;

                Buf = '';
            } else if ((text.charCodeAt(i) === 0x7D) && (!this._ATASCIIEscaped)) {
                // Clear the screen
                this.ClrScr();

                // Reset the variables
                X = 1;
                Y = 1;
                Buf = '';
            } else if ((text.charCodeAt(i) === 0x7E) && (!this._ATASCIIEscaped)) {
                // Backspace, need to flush buffer before moving cursor
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                Buf = '';
                DoGoto = true;

                if (X > 1) {
                    X -= 1;
                    this.FastWrite(' ', X, this.WhereYA(), this._CharInfo);
                }
            } else if ((text.charCodeAt(i) === 0x7F) && (!this._ATASCIIEscaped)) {
                // Tab, need to flush buffer before moving cursor
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                Buf = '';

                // Figure out where the next tabstop is
                if (X === this.WindCols) {
                    // Cursor is in last position, tab goes to the first position of the next line
                    X = 1;
                    Y += 1;
                } else {
                    // Cursor goes to the next multiple of 8
                    X += 8 - (X % 8);
                }
                DoGoto = true;
            } else if ((text.charCodeAt(i) === 0x9B) && (!this._ATASCIIEscaped)) {
                // Line feed, need to flush buffer before moving cursor
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X = 1;
                Y += 1;
                DoGoto = true;

                Buf = '';
            } else if ((text.charCodeAt(i) === 0x9C) && (!this._ATASCIIEscaped)) {
                // Delete line, need to flush buffer before doing so
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X = 1;
                Buf = '';

                this.GotoXY(X, Y);
                this.DelLine();
            } else if ((text.charCodeAt(i) === 0x9D) && (!this._ATASCIIEscaped)) {
                // Insert line, need to flush buffer before doing so
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X = 1;
                Buf = '';

                this.GotoXY(X, Y);
                this.InsLine();
            } else if ((text.charCodeAt(i) === 0xFD) && (!this._ATASCIIEscaped)) {
                this.Beep();
            } else if ((text.charCodeAt(i) === 0xFE) && (!this._ATASCIIEscaped)) {
                // Delete character, need to flush buffer before doing so
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                Buf = '';

                this.GotoXY(X, Y);
                this.DelChar();
            } else if ((text.charCodeAt(i) === 0xFF) && (!this._ATASCIIEscaped)) {
                // Insert character, need to flush buffer before doing so
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                Buf = '';

                this.GotoXY(X, Y);
                this.InsChar();
            } else {
                // Append character to buffer (but handle lantronix filter)
                if ((text.charCodeAt(i) === 0x00) && (this._LastChar === 0x0D)) {
                    // LANtronix always sends 0 after 13, so we'll ignore it
                    Buf += ''; // Make JSLint happy
                } else {
                    // Add key to buffer
                    Buf += String.fromCharCode(text.charCodeAt(i) & 0xFF);
                }
                this._ATASCIIEscaped = false;
                this._LastChar = text.charCodeAt(i);

                // Check if we've passed the right edge of the window
                if ((X + Buf.length) > this.WindCols) {
                    // We have, need to flush buffer before moving cursor
                    this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                    Buf = '';

                    X = 1;
                    Y += 1;
                    DoGoto = true;
                }
            }

            // Check if we've passed the bottom edge of the window
            if (Y > this.WindRows) {
                // We have, need to scroll the window one line
                Y = this.WindRows;
                this.ScrollUpWindow(1);
                DoGoto = true;
            }

            if (DoGoto) { this.GotoXY(X, Y); }
        }

        // Flush remaining text in buffer if we have any
        if (Buf.length > 0) {
            this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
            X += Buf.length;
            this.GotoXY(X, Y);
        }
    }

    private static WritePETSCII(text: string): void {
        if (typeof text === 'undefined') { text = ''; }

        var X: number = this.WhereX();
        var Y: number = this.WhereY();
        var Buf: string = '';

        for (var i: number = 0; i < text.length; i++) {
            var DoGoto: boolean = false;

            // Check if this is a control code (so we need to flush buffered text first)
            if ((Buf !== '') && (this._FlushBeforeWritePETSCII.indexOf(text.charCodeAt(i)) !== -1)) {
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                DoGoto = true;
                Buf = '';
            }

            if (text.charCodeAt(i) === 0x00) {
                // NULL, ignore
                i += 0; // Make JSLint happy (doesn't like empty block)
            } else if (text.charCodeAt(i) === 0x05) {
                // Changes the text color to white. 
                this.TextColor(this.PETSCII_WHITE);
            } else if (text.charCodeAt(i) === 0x07) {
                // Beep (extra, not documented)
                this.Beep();
            } else if (text.charCodeAt(i) === 0x08) {
                // TODO Disables changing the character set using the SHIFT + Commodore key combination. 
                console.log('PETSCII 0x08');
            } else if (text.charCodeAt(i) === 0x09) {
                // TODO Enables changing the character set using the SHIFT + Commodore key combination. 
                console.log('PETSCII 0x09');
            } else if (text.charCodeAt(i) === 0x0A) {
                // Ignore, 0x0D will handle linefeeding
                i += 0; // Make JSLint happy (doesn't like empty block)
            } else if ((text.charCodeAt(i) === 0x0D) || (text.charCodeAt(i) === 0x8D)) {
                // Carriage return; next character will go in the first column of the following text line. 
                // As opposed to traditional ASCII-based system, no LINE FEED character needs to be sent in conjunction 
                // with this Carriage return character in the PETSCII system. 
                X = 1;
                Y += 1;
                this._CharInfo.Reverse = false;
                DoGoto = true;
            } else if (text.charCodeAt(i) === 0x0E) {
                // Select the lowercase/uppercase character set. 
                this.SetFont('C64-Lower');
            } else if (text.charCodeAt(i) === 0x11) {
                // Cursor down: Next character will be printed in subsequent column one text line further down the screen. 
                Y += 1;
                DoGoto = true;
            } else if (text.charCodeAt(i) === 0x12) {
                // Reverse on: Selects reverse video text. 
                this._CharInfo.Reverse = true;
            } else if (text.charCodeAt(i) === 0x13) {
                // Home: Next character will be printed in the upper left-hand corner of the screen. 
                X = 1;
                Y = 1;
                DoGoto = true;
            } else if (text.charCodeAt(i) === 0x14) {
                // Delete, or 'backspace'; erases the previous character and moves the cursor one character position to the left. 
                if ((X > 1) || (Y > 1)) {
                    if (X === 1) {
                        X = this.WindCols;
                        Y -= 1;
                    } else {
                        X -= 1;
                    }

                    this.GotoXY(X, Y);
                    this.DelChar(1);
                }
            } else if (text.charCodeAt(i) === 0x1C) {
                // Changes the text color to red. 
                this.TextColor(this.PETSCII_RED);
            } else if (text.charCodeAt(i) === 0x1D) {
                // Advances the cursor one character position without printing anything. 
                if (X === this.WindCols) {
                    X = 1;
                    Y += 1;
                } else {
                    X += 1;
                }
                DoGoto = true;
            } else if (text.charCodeAt(i) === 0x1E) {
                // Changes the text color to green. 
                this.TextColor(this.PETSCII_GREEN);
            } else if (text.charCodeAt(i) === 0x1F) {
                // Changes the text color to blue. 
                this.TextColor(this.PETSCII_BLUE);
            } else if (text.charCodeAt(i) === 0x81) {
                // Changes the text color to orange. 
                this.TextColor(this.PETSCII_ORANGE);
            } else if (text.charCodeAt(i) === 0x8E) {
                // Select the uppercase/semigraphics character set. 
                this.SetFont('C64-Upper');
            } else if (text.charCodeAt(i) === 0x90) {
                // Changes the text color to black. 
                this.TextColor(this.PETSCII_BLACK);
            } else if (text.charCodeAt(i) === 0x91) {
                // Cursor up: Next character will be printed in subsequent column one text line further up the screen. 
                if (Y > 1) {
                    Y -= 1;
                    DoGoto = true;
                }
            } else if (text.charCodeAt(i) === 0x92) {
                // Reverse off: De-selects reverse video text. 
                this._CharInfo.Reverse = false;
            } else if (text.charCodeAt(i) === 0x93) {
                // Clears screen of any text, and causes the next character to be printed at the upper left-hand corner of 
                // the text screen. 
                this.ClrScr();
                X = 1;
                Y = 1;
            } else if (text.charCodeAt(i) === 0x94) {
                // Insert: Makes room for extra characters at the current cursor position, by 'pushing' existing characters 
                // at that position further to the right. 
                this.GotoXY(X, Y);
                this.InsChar(1);
            } else if (text.charCodeAt(i) === 0x95) {
                // Changes the text color to brown. 
                this.TextColor(this.PETSCII_BROWN);
            } else if (text.charCodeAt(i) === 0x96) {
                // Changes the text color to light red.
                this.TextColor(this.PETSCII_LIGHTRED);
            } else if (text.charCodeAt(i) === 0x97) {
                // Changes the text color to dark gray. 
                this.TextColor(this.PETSCII_DARKGRAY);
            } else if (text.charCodeAt(i) === 0x98) {
                // Changes the text color to gray. 
                this.TextColor(this.PETSCII_GRAY);
            } else if (text.charCodeAt(i) === 0x99) {
                // Changes the text color to light green. 
                this.TextColor(this.PETSCII_LIGHTGREEN);
            } else if (text.charCodeAt(i) === 0x9A) {
                // Changes the text color to light blue. 
                this.TextColor(this.PETSCII_LIGHTBLUE);
            } else if (text.charCodeAt(i) === 0x9B) {
                // Changes the text color to light gray. 
                this.TextColor(this.PETSCII_LIGHTGRAY);
            } else if (text.charCodeAt(i) === 0x9C) {
                // Changes the text color to purple. 
                this.TextColor(this.PETSCII_PURPLE);
            } else if (text.charCodeAt(i) === 0x9D) {
                // Moves the cursor one character position backwards, without printing or deleting anything. 
                if ((X > 1) || (Y > 1)) {
                    if (X === 1) {
                        X = this.WindCols;
                        Y -= 1;
                    } else {
                        X -= 1;
                    }
                    DoGoto = true;
                }
            } else if (text.charCodeAt(i) === 0x9E) {
                // Changes the text color to yellow. 
                this.TextColor(this.PETSCII_YELLOW);
            } else if (text.charCodeAt(i) === 0x9F) {
                // Changes the text color to cyan. 
                this.TextColor(this.PETSCII_CYAN);
            } else if (text.charCodeAt(i) !== 0) {
                // Append character to buffer
                Buf += String.fromCharCode(text.charCodeAt(i) & 0xFF);

                // Check if we've passed the right edge of the window
                if ((X + Buf.length) > this.WindCols) {
                    // We have, need to flush buffer before moving cursor
                    this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                    Buf = '';

                    X = 1;
                    Y += 1;
                    DoGoto = true;
                }
            }

            // Check if we've passed the bottom edge of the window
            if (Y > this.WindRows) {
                // We have, need to scroll the window one line
                Y = this.WindRows;
                this.ScrollUpWindow(1);
                DoGoto = true;
            }

            if (DoGoto) { this.GotoXY(X, Y); }
        }

        // Flush remaining text in buffer if we have any
        if (Buf.length > 0) {
            this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
            X += Buf.length;
            this.GotoXY(X, Y);
        }
    }

    public static WriteLn(text?: string): void {
        /// <summary>
        /// Writes a given line of text to the screen, followed by a carriage return and line feed.
        /// </summary>
        /// <remarks>
        /// Text is wrapped if it exceeds the right edge of the window
        /// </remarks>
        /// <param name='AText'>The text to print to the screen</param>
        if (typeof text === 'undefined') { text = ''; }
        this.Write(text + '\r\n');
    }
}
