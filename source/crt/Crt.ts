/*
  fTelnet: An HTML5 WebSocket client
  Copyright (C) Rick Parrish, R&M Software

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
class Crt {
    /// <summary>
    /// A class for manipulating a console window
    /// Compatibility with the Borland Pascal CRT unit was attempted, along with a few new additions
    /// </summary>

    // Events
    public onfontchange: IEvent = new TypedEvent();
    public onkeypressed: IEvent = new TypedEvent();
    public onmousereport: IEvent = new TypedEvent();
    public onscreensizechange: IEvent = new TypedEvent();

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
    private _AllowDynamicFontResize: boolean = true;
    private _Atari: boolean = false;
    private _ATASCIIEscaped: boolean = false;
    private _BareLFtoCRLF: boolean = false;
    private _BlinkHidden: boolean = false;
    private _Buffer: CharInfo[][];
    private _C64: boolean = false;
    private _Canvas: HTMLCanvasElement;
    private _CanvasContext: CanvasRenderingContext2D;
    private _CharInfo: CharInfo = new CharInfo(null);
    private _Container: HTMLElement;
    private _Cursor: Cursor;
    private _FlushBeforeWritePETSCII: number[] = [0x05, 0x07, 0x08, 0x09, 0x0A, 0x0D, 0x0E, 0x11, 0x12, 0x13, 0x14, 0x1c, 0x1d, 0x1e, 0x1f, 0x81, 0x8d, 0x8e, 0x90, 0x91, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0x9b, 0x9c, 0x9d, 0x9e, 0x9f];
    private _Font: CrtFont;
    private _InScrollback: boolean = false;
    private _KeyBuf: KeyPressEvent[] = [];
    private _LastChar: number = 0x00;
    private _LocalEcho: boolean = false;
    private _MouseDownPoint: Point;
    private _MouseMovePoint: Point;
    private _ReportMouse: boolean;
    private _ReportMouseSgr: boolean;
    private _ScreenSize: Point = new Point(80, 25);
    private _Scrollback: CharInfo[][];
    private _ScrollbackPosition: number = -1;
    private _ScrollbackSize: number = 250; // TODO Quick hack to make Edge happy, change back to 500 after finding IndexSizeError fix
    private _ScrollbackTemp: CharInfo[][];
    private _SkipRedrawWhenSameFontSize: boolean = false;
    private _TempCanvas: HTMLCanvasElement;
    private _TempCanvasContext: CanvasRenderingContext2D;
    private _Transparent: Boolean = false;
    private _UseModernScrollback: Boolean = false;
    private _WindMin: number = 0;
    private _WindMax: number = (80 - 1) | ((25 - 1) << 8);

    ///* Benchmark Variables */
    //private _BenchGetChar: Benchmark = new Benchmark();
    //private _BenchPutImage: Benchmark = new Benchmark();
    //private _BenchUpdateBuffer: Benchmark = new Benchmark();

    constructor(container: HTMLElement, useModernScrollback: boolean) {
        this._Container = container;
        this._UseModernScrollback = useModernScrollback;

        this._Font = new CrtFont();
        this._Font.onchange.on((oldSize: Point): void => { this.OnFontChanged(oldSize); });

        // Create the canvas
        this._Canvas = document.createElement('canvas');
        this._Canvas.className = 'fTelnetCrtCanvas';
        this._Canvas.innerHTML = 'Your browser does not support the HTML5 Canvas element!<br>The latest version of every major web browser supports this element, so please consider upgrading now:<ul><li><a href="http://www.mozilla.com/firefox/">Mozilla Firefox</a></li><li><a href="http://www.google.com/chrome">Google Chrome</a></li><li><a href="http://www.apple.com/safari/">Apple Safari</a></li><li><a href="http://www.opera.com/">Opera</a></li><li><a href="http://windows.microsoft.com/en-US/internet-explorer/products/ie/home">MS Internet Explorer</a></li></ul>';
        this._Canvas.style.zIndex = '50'; // TODO Maybe a constant from another file to help keep zindexes correct for different elements?
        this._Canvas.width = this._Font.Width * this._ScreenSize.x;
        if (this._UseModernScrollback) {
            this._Canvas.height = this._Font.Height * (this._ScreenSize.y + this._ScrollbackSize);
        } else {
            this._Canvas.height = this._Font.Height * this._ScreenSize.y;
            if (!!window.cordova) {
                // Fullscreen for mobile apps
                this._Canvas.style.width = '100%';
            }
        }

        // Handle events for copy/paste
        if (!DetectMobileBrowser.IsMobile) {
            this._Canvas.addEventListener('contextmenu', (e: Event): boolean => { e.preventDefault(); return false; }, false);
            this._Canvas.addEventListener('mousedown', (me: MouseEvent): void => { this.OnMouseDown(me); }, false);
            this._Canvas.addEventListener('mousemove', (me: MouseEvent): void => { this.OnMouseMove(me); }, false);
            this._Canvas.addEventListener('mouseup', (me: MouseEvent): void => { this.OnMouseUp(me); }, false);
            window.addEventListener('mouseup', (me: MouseEvent): void => { this.OnMouseUpForWindow(me); }, false);
        }

        // Check for Canvas support
        if (!this._Canvas.getContext) {
            console.log('fTelnet Error: Canvas not supported');
            // TODOX return false;
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
        this._Cursor = new Cursor(CrtFont.ANSI_COLOURS[Crt.LIGHTGRAY], this._Font.Size);
        this._Cursor.onhide.on((): void => { this.OnBlinkHide(); });
        this._Cursor.onshow.on((): void => { this.OnBlinkShow(); });

        // Update the WindMin/WindMax records
        this._WindMin = 0;
        this._WindMax = (this._ScreenSize.x - 1) | ((this._ScreenSize.y - 1) << 8);

        // Create the context
        var CanvasContext = this._Canvas.getContext('2d');
        if (CanvasContext === null) {
            console.log('fTelnet Error: _Canvas.getContext error');
            // TODOX return false;
        } else {
            this._CanvasContext = CanvasContext;
        }
        this._CanvasContext.font = '12pt monospace';
        this._CanvasContext.textBaseline = 'top';

        if (this._UseModernScrollback) {
            // Black out the scrollback
            this._CanvasContext.fillStyle = 'black';
            this._CanvasContext.fillRect(0, 0, this._Canvas.width, this._Canvas.height);
        }

        // Create the buffer canvas and context for scrolling
        this._TempCanvas = document.createElement('canvas');
        this._TempCanvas.width = this._Canvas.width;
        this._TempCanvas.height = this._Canvas.height;
        var TempCanvasContext = this._TempCanvas.getContext('2d');
        if (TempCanvasContext === null) {
            console.log('fTelnet Error: _TempCanvas.getContext error');
            // TODOX return false;
        } else {
            this._TempCanvasContext = TempCanvasContext;
        }
        this._TempCanvasContext.font = '12pt monospace';
        this._TempCanvasContext.textBaseline = 'top';

        // Clear the screen
        this.ClrScr();

        // TODOX return true;
    }

    public get AllowDynamicFontResize(): boolean {
        return this._AllowDynamicFontResize;
    }

    public set AllowDynamicFontResize(value: boolean) {
        this._AllowDynamicFontResize = value;
    }

    public get Atari(): boolean {
        return this._Atari;
    }

    public set Atari(value: boolean) {
        this._Atari = value;
    }

    public get BareLFtoCRLF(): boolean {
        return this._BareLFtoCRLF;
    }

    public set BareLFtoCRLF(value: boolean) {
        this._BareLFtoCRLF = value;
    }

    public Beep(): void {
        /*TODO
        var Duration = 44100 * 0.3; // 0.3 = 300ms
        var Frequency = 440; // 440hz

        */
    }

    public get C64(): boolean {
        return this._C64;
    }

    public set C64(value: boolean) {
        this._C64 = value;
    }

    public get Canvas(): HTMLCanvasElement {
        return this._Canvas;
    }

    public ClrBol(): void {
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

    public ClrBos(): void {
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

    public ClrEol(): void {
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

    public ClrEos(): void {
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

    public ClrLine(): void {
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

    public ClrScr(): void {
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

    public Conceal(): void {
        // Set the foreground to the background
        this.TextColor((this.TextAttr & 0xF0) >> 4);
    }

    public DelChar(count?: number): void {
        if (typeof count === 'undefined') { count = 1; }

        var i: number;
        for (i = this.WhereXA(); i <= this.WindMinX + this.WindCols - count; i++) {
            this.FastWrite(this._Buffer[this.WhereYA()][i + count].Ch, i, this.WhereYA(), this._Buffer[this.WhereYA()][i + count]);
        }
        for (i = this.WindMinX + this.WindCols + 1 - count; i <= this.WindMinX + this.WindCols; i++) {
            this.FastWrite(' ', i, this.WhereYA(), this._CharInfo);
        }
    }

    public DelLine(count?: number): void {
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

    public EnterScrollback(): void {
        // Don't run this function if modern scrollback is enabled
        if (this._UseModernScrollback) { return; }

        if (!this._InScrollback) {
            this._InScrollback = true;

            var NewRow: CharInfo[];
            var X: number;
            var Y: number;

            // Make copy of current scrollback buffer in temp scrollback buffer
            this._ScrollbackTemp = [];
            for (Y = 0; Y < this._Scrollback.length; Y++) {
                NewRow = [];
                for (X = 0; X < this._Scrollback[Y].length; X++) {
                    NewRow.push(new CharInfo(this._Scrollback[Y][X]));
                }
                this._ScrollbackTemp.push(NewRow);
            }

            // Add current screen to temp scrollback buffer
            // TODO Unused var YOffset: number = this._ScrollbackTemp.length - 1;
            for (Y = 1; Y <= this._ScreenSize.y; Y++) {
                NewRow = [];
                for (X = 1; X <= this._ScreenSize.x; X++) {
                    NewRow.push(new CharInfo(this._Buffer[Y][X]));
                }
                this._ScrollbackTemp.push(NewRow);
            }

            // Set our position in the scrollback
            this._ScrollbackPosition = this._ScrollbackTemp.length;
        }
    }

    public ExitScrollback(): void {
        // Restore the screen contents
        if (typeof this._Buffer !== 'undefined') {
            for (var Y = 1; Y <= this._ScreenSize.y; Y++) {
                for (var X = 1; X <= this._ScreenSize.x; X++) {
                    this.FastWrite(this._Buffer[Y][X].Ch, X, Y, this._Buffer[Y][X], false);
                }
            }
        }

        this._InScrollback = false;
    }

    public FastWrite(text: string, x: number, y: number, charInfo: CharInfo, updateBuffer?: boolean): void {
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
            var Chars: string[] = [];
            var CharCodes: number[] = [];
            var TextLength;

            if (typeof text === 'undefined') {
                TextLength = 1;
                Chars.push(' ');
                CharCodes.push(this._Transparent ? CrtFont.TRANSPARENT_CHARCODE : 32);
            } else {
                TextLength = text.length;
                for (var i: number = 0; i < TextLength; i++) {
                    Chars.push(text.charAt(i));
                    CharCodes.push(text.charCodeAt(i));
                }
            }

            for (var i: number = 0; i < TextLength; i++) {
                //this._BenchGetChar.Start();
                var BGetChar: Benchmark = Benchmarks.Start('GetChar');
                var Char: ImageData | undefined = this._Font.GetChar(CharCodes[i], charInfo);
                //this._BenchGetChar.Stop();
                BGetChar.Stop();

                //this._BenchPutImage.Start();
                var BPutImage: Benchmark = Benchmarks.Start('PutImage');
                if (typeof Char === 'undefined') {
                    this._Buffer[y][x + i].NeedsRedraw = true;
                } else {
                    if (this._UseModernScrollback) {
                        this._CanvasContext.putImageData(Char, (x - 1 + i) * this._Font.Width, (y - 1 + this._ScrollbackSize) * this._Font.Height);
                    } else {
                        if ((!this._InScrollback) || (this._InScrollback && !updateBuffer)) {
                            this._CanvasContext.putImageData(Char, (x - 1 + i) * this._Font.Width, (y - 1) * this._Font.Height);
                        }
                    }
                }
                //this._BenchPutImage.Stop();
                BPutImage.Stop();

                //this._BenchUpdateBuffer.Start();
                var BUpdateBuffer: Benchmark = Benchmarks.Start('UpdateBuffer');
                if (updateBuffer) {
                    var CharToUpdate: CharInfo = this._Buffer[y][x + i];
                    CharToUpdate.Set(charInfo);
                    CharToUpdate.Ch = Chars[i];
                }
                //this._BenchUpdateBuffer.Stop();
                BUpdateBuffer.Stop();

                if (x + i >= this._ScreenSize.x) { break; }
            }
        }
    }

    public FillScreen(ch: string): void {
        var Line: string = StringUtils.NewString(ch.charAt(0), this.ScreenCols);

        for (var Y: number = 1; Y <= this.ScreenRows; Y++) {
            this.FastWrite(Line, 1, Y, this._CharInfo);
        }
    }

    public get Font(): CrtFont {
        return this._Font;
    }

    public GotoXY(x: number, y: number): void {
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

    public HideCursor(): void {
        this._Cursor.Visible = false;
    }

    public HighVideo(): void {
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

    // TODOX Have to do this here because the static constructor doesn't seem to like the X and Y variables
    private InitBuffers(initScrollback: boolean): void {
        this._Buffer = [];
        for (var Y: number = 1; Y <= this._ScreenSize.y; Y++) {
            this._Buffer[Y] = [];
            for (var X: number = 1; X <= this._ScreenSize.x; X++) {
                this._Buffer[Y][X] = new CharInfo(null);
            }
        }

        if (initScrollback) {
            this._Scrollback = [];
        }
    }

    public InsChar(count?: number): void {
        if (typeof count === 'undefined') { count = 1; }

        var i: number;
        for (i = this.WindMinX + this.WindCols; i >= this.WhereXA() + count; i--) {
            this.FastWrite(this._Buffer[this.WhereYA()][i - count].Ch, i, this.WhereYA(), this._Buffer[this.WhereYA()][i - count]);
        }
        for (i = this.WhereXA(); i < this.WhereXA() + count; i++) {
            this.FastWrite(' ', i, this.WhereYA(), this._CharInfo);
        }
    }

    public InsLine(count?: number): void {
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

    public KeyPressed(): boolean {
        return (this._KeyBuf.length > 0);
    }

    public set LocalEcho(value: boolean) {
        this._LocalEcho = value;
    }

    public LowVideo(): void {
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

    private MousePositionToScreenPosition(x: number, y: number): Point {
        // Adjust for modern scrollback offset
        if (this._UseModernScrollback) {
            y -= this._ScrollbackSize * this._Font.Height;
        }

        // Convert to screen position
        return new Point(Math.floor(x / this._Font.Width) + 1, Math.floor(y / this._Font.Height) + 1);
    }

    public NormVideo(): void {
        /// <summary>
        /// Selects the original text attribute read from the cursor location at startup.
        /// </summary>
        /// <remarks>
        /// There is a Byte variable in Crt--TextAttr--that holds the current video
        /// attribute. NormVideo restores TextAttr to the value it had when the program
        /// was started.
        /// </remarks>
        this.TextBackground(Crt.BLACK);
        if (this._C64) {
            this.TextAttr = Crt.PETSCII_WHITE;
        } else {
            this.TextAttr = Crt.LIGHTGRAY;
        }
        this._CharInfo.Blink = false;
        this._CharInfo.Underline = false;
        this._CharInfo.Reverse = false;
    }

    private OnBlinkHide(): void {
        // Only hide the text if blink is enabled
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

        // Show the cursor
        // NB: We show the cursor on blink hide so that if the cursor is over a blink space we don't draw the character when it should be hidden
        this._CanvasContext.fillStyle = this._Cursor.Colour;
        if (this._UseModernScrollback) {
            this._CanvasContext.fillRect((this.WhereXA() - 1) * this._Font.Size.x, ((this.WhereYA() + this._ScrollbackSize) * this._Font.Size.y) - (this._Font.Size.y * 0.20), this._Font.Size.x, this._Font.Size.y * 0.20);
        } else {
            this._CanvasContext.fillRect((this.WhereXA() - 1) * this._Font.Size.x, (this.WhereYA() * this._Font.Size.y) - (this._Font.Size.y * 0.20), this._Font.Size.x, this._Font.Size.y * 0.20);
        }
        this._Cursor.LastPosition = new Point(this.WhereXA(), this.WhereYA());
    }

    private OnBlinkShow(): void {
        // Show the text if blink is enabled, or we need a reset (which happens when blink is diabled while in the hidden state)
        if (this._BlinkHidden) {
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

        // Hide the cursor
        // NB: We show the cursor on blink hide so that if the cursor is over a blink space we don't draw the character when it should be hidden
        // TODOX This is broken because the current position may not be where the cursor was last drawn
        //       For example if you hit enter or backspace while the cursor is shown, then the cursor will not be erased properly
        var X = this._Cursor.LastPosition.x;
        var Y = this._Cursor.LastPosition.y;
        var Cell = this._Buffer[Y][X];
        this.FastWrite(Cell.Ch, X, Y, Cell, false);
    }

    private OnFontChanged(oldSize: Point): void {
        // Check if the new font is the same size as the old font
        if ((oldSize.x == this._Font.Size.x) && (oldSize.y == this._Font.Size.y)) {
            // It's the same size, so check if we want to skip a redraw
            if (this._SkipRedrawWhenSameFontSize) {
                // We do want to skip a full redraw, but we still need to handle anything that changed since the font change was requested
                // This is because any calls to FastWrite that happened while the new font's PNG was being loaded won't have been written to the canvas yet
                if (typeof this._Buffer !== 'undefined') {
                    for (var Y: number = 1; Y <= this._ScreenSize.y; Y++) {
                        for (var X: number = 1; X <= this._ScreenSize.x; X++) {
                            if (this._Buffer[Y][X].NeedsRedraw) {
                                this.FastWrite(this._Buffer[Y][X].Ch, X, Y, this._Buffer[Y][X], false);
                                this._Buffer[Y][X].NeedsRedraw = false;
                            }
                        }
                    }
                }
                
                return;
            }
        }

        // Resize the cursor
        this._Cursor.Size = this._Font.Size;

        // Update the canvas
        this._Canvas.width = this._Font.Width * this._ScreenSize.x;
        if (this._UseModernScrollback) {
            this._Canvas.height = this._Font.Height * (this._ScreenSize.y + this._ScrollbackSize);
            this._CanvasContext.fillRect(0, 0, this._Canvas.width, this._Canvas.height);
        } else {
            this._Canvas.height = this._Font.Height * this._ScreenSize.y;
            // TODOX This is test code to auto-scale (which would be good for phones, that need to scale down)
            //// Try to go full width
            // var MaxHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
            // var NewWidth = this._Container.clientWidth;
            // var Ratio = NewWidth / this._Canvas.width;
            // var NewHeight = this._Canvas.height * Ratio;
            // if (NewHeight > MaxHeight) {
            //     // Result is too tall, so go full height instead
            //     NewHeight = MaxHeight;
            //     Ratio = NewHeight / this._Canvas.height;
            //     NewWidth = this._Canvas.width * Ratio;
            // }
            // this._Canvas.style.width = NewWidth + 'px';
            // this._Canvas.style.height = NewHeight + 'px';
        }
        this._TempCanvas.width = this._Canvas.width;
        this._TempCanvas.height = this._Canvas.height;

        // Restore the screen contents
        if (typeof this._Buffer !== 'undefined') {
            for (var Y: number = 1; Y <= this._ScreenSize.y; Y++) {
                for (var X: number = 1; X <= this._ScreenSize.x; X++) {
                    this.FastWrite(this._Buffer[Y][X].Ch, X, Y, this._Buffer[Y][X], false);
                    this._Buffer[Y][X].NeedsRedraw = false;
                }
            }
        }

        this.onfontchange.trigger();
    }

    private OnKeyDown(ke: KeyboardEvent): void {
        // Skip out if we've focused an input element
        if (!window.cordova) {
            if ((ke.target instanceof HTMLInputElement) || (ke.target instanceof HTMLTextAreaElement)) { return; }
        }

        if (this._InScrollback) {
            var i: number;
            var X: number;
            var XEnd: number;
            var YDest: number;
            var YSource: number;

            // TODO Handle HOME and END?
            if (ke.keyCode === KeyboardKeys.DOWN) {
                if (this._ScrollbackPosition < this._ScrollbackTemp.length) {
                    this._ScrollbackPosition += 1;
                    this.ScrollUpCustom(1, 1, this._ScreenSize.x, this._ScreenSize.y, 1, new CharInfo(null), false);

                    YDest = this._ScreenSize.y;
                    YSource = this._ScrollbackPosition - 1;
                    XEnd = Math.min(this._ScreenSize.x, this._ScrollbackTemp[YSource].length);
                    for (X = 0; X < XEnd; X++) {
                        this.FastWrite(this._ScrollbackTemp[YSource][X].Ch, X + 1, YDest, this._ScrollbackTemp[YSource][X], false);
                    }
                }
            } else if (ke.keyCode === KeyboardKeys.PAGE_DOWN) {
                for (i = 0; i < this._ScreenSize.y; i++) {
                    this.PushKeyDown(KeyboardKeys.DOWN, KeyboardKeys.DOWN, false, false, false);
                }
            } else if (ke.keyCode === KeyboardKeys.PAGE_UP) {
                for (i = 0; i < this._ScreenSize.y; i++) {
                    this.PushKeyDown(KeyboardKeys.UP, KeyboardKeys.UP, false, false, false);
                }
            } else if (ke.keyCode === KeyboardKeys.UP) {
                if (this._ScrollbackPosition > this._ScreenSize.y) {
                    this._ScrollbackPosition -= 1;
                    this.ScrollDownCustom(1, 1, this._ScreenSize.x, this._ScreenSize.y, 1, new CharInfo(null), false);

                    YDest = 1;
                    YSource = this._ScrollbackPosition - this._ScreenSize.y;
                    XEnd = Math.min(this._ScreenSize.x, this._ScrollbackTemp[YSource].length);
                    for (X = 0; X < XEnd; X++) {
                        this.FastWrite(this._ScrollbackTemp[YSource][X].Ch, X + 1, YDest, this._ScrollbackTemp[YSource][X], false);
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
                    case KeyboardKeys.BACKSPACE: keyString = '\x7E'; break;
                    case KeyboardKeys.DELETE: keyString = '\x7E'; break;
                    case KeyboardKeys.DOWN: keyString = '\x1D'; break;
                    case KeyboardKeys.ENTER: keyString = '\x9B'; break;
                    case KeyboardKeys.LEFT: keyString = '\x1E'; break;
                    case KeyboardKeys.RIGHT: keyString = '\x1F'; break;
                    case KeyboardKeys.SPACE: keyString = ' '; break;
                    case KeyboardKeys.TAB: keyString = '\x7F'; break;
                    case KeyboardKeys.UP: keyString = '\x1C'; break;
                }
            }
        } else if (this._C64) {
            switch (ke.keyCode) {
                // Handle special keys
                case KeyboardKeys.BACKSPACE: keyString = '\x14'; break;
                case KeyboardKeys.DELETE: keyString = '\x14'; break;
                case KeyboardKeys.DOWN: keyString = '\x11'; break;
                case KeyboardKeys.ENTER: keyString = '\r'; break;
                case KeyboardKeys.F1: keyString = '\x85'; break;
                case KeyboardKeys.F2: keyString = '\x89'; break;
                case KeyboardKeys.F3: keyString = '\x86'; break;
                case KeyboardKeys.F4: keyString = '\x8A'; break;
                case KeyboardKeys.F5: keyString = '\x87'; break;
                case KeyboardKeys.F6: keyString = '\x8B'; break;
                case KeyboardKeys.F7: keyString = '\x88'; break;
                case KeyboardKeys.F8: keyString = '\x8C'; break;
                case KeyboardKeys.HOME: keyString = '\x13'; break;
                case KeyboardKeys.INSERT: keyString = '\x94'; break;
                case KeyboardKeys.LEFT: keyString = '\x9D'; break;
                case KeyboardKeys.RIGHT: keyString = '\x1D'; break;
                case KeyboardKeys.SPACE: keyString = ' '; break;
                case KeyboardKeys.UP: keyString = '\x91'; break;
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
                    case KeyboardKeys.BACKSPACE: keyString = '\b'; break;
                    case KeyboardKeys.DELETE: keyString = '\x7F'; break;
                    case KeyboardKeys.DOWN: keyString = '\x1B[B'; break;
                    case KeyboardKeys.END: keyString = '\x1B[K'; break;
                    case KeyboardKeys.ENTER: keyString = '\r\n'; break;
                    case KeyboardKeys.ESCAPE: keyString = '\x1B'; break;
                    case KeyboardKeys.F1: keyString = '\x1BOP'; break;
                    case KeyboardKeys.F2: keyString = '\x1BOQ'; break;
                    case KeyboardKeys.F3: keyString = '\x1BOR'; break;
                    case KeyboardKeys.F4: keyString = '\x1BOS'; break;
                    case KeyboardKeys.F5: keyString = '\x1BOt'; break;
                    case KeyboardKeys.F6: keyString = '\x1B[17~'; break;
                    case KeyboardKeys.F7: keyString = '\x1B[18~'; break;
                    case KeyboardKeys.F8: keyString = '\x1B[19~'; break;
                    case KeyboardKeys.F9: keyString = '\x1B[20~'; break;
                    case KeyboardKeys.F10: keyString = '\x1B[21~'; break;
                    case KeyboardKeys.F11: keyString = '\x1B[23~'; break;
                    case KeyboardKeys.F12: keyString = '\x1B[24~'; break;
                    case KeyboardKeys.HOME: keyString = '\x1B[H'; break;
                    case KeyboardKeys.INSERT: keyString = '\x1B@'; break;
                    case KeyboardKeys.LEFT: keyString = '\x1B[D'; break;
                    case KeyboardKeys.PAGE_DOWN: keyString = '\x1B[U'; break;
                    case KeyboardKeys.PAGE_UP: keyString = '\x1B[V'; break;
                    case KeyboardKeys.RIGHT: keyString = '\x1B[C'; break;
                    case KeyboardKeys.SPACE: keyString = ' '; break;
                    case KeyboardKeys.TAB: keyString = '\t'; break;
                    case KeyboardKeys.UP: keyString = '\x1B[A'; break;
                }
            }
        }

        this._KeyBuf.push(new KeyPressEvent(ke, keyString));

        if ((keyString) || (ke.ctrlKey)) {
            ke.preventDefault();
            this.onkeypressed.trigger();
        }
    }

    private OnKeyPress(ke: KeyboardEvent): void {
        // Skip out if we've focused an input element
        if (!window.cordova) {
            if ((ke.target instanceof HTMLInputElement) || (ke.target instanceof HTMLTextAreaElement)) { return; }
        }

        if (this._InScrollback) { return; }

        var keyString: string = '';

        if (ke.altKey || ke.ctrlKey) { return; } // This is only meant for regular keypresses

        // Opera doesn't give us the charCode, so try which in that case
        var which: number = (typeof ke.charCode !== 'undefined') ? ke.charCode : ke.which;
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

    private OnMouseDown(me: MouseEvent): void {
        if (typeof me.offsetX !== 'undefined') {
            this._MouseDownPoint = this.MousePositionToScreenPosition(me.offsetX, me.offsetY);
        } else {
            var CanvasOffset = Offset.getOffset(this._Canvas);
            this._MouseDownPoint = this.MousePositionToScreenPosition(me.clientX - CanvasOffset.x, me.clientY - CanvasOffset.y);
        }
        this._MouseMovePoint = new Point(this._MouseDownPoint.x, this._MouseDownPoint.y);

        if (this._ReportMouse) {
            if (this._ReportMouseSgr) {
                this.onmousereport.trigger('\x1B[<' + me.button.toString() + ';' + this._MouseDownPoint.x.toString() + ';' + this._MouseDownPoint.y.toString() + 'M');
            } else {
                this.onmousereport.trigger('\x1B[M ' + me.button.toString() + '!' + (this._MouseDownPoint.x - 1).toString() + '!' + (this._MouseDownPoint.y - 1).toString());
            }
        }
    }

    private OnMouseMove(me: MouseEvent): void {
        // Bail if mouse is not down
        if (typeof this._MouseDownPoint === 'undefined') { return; }

        // Get new screen point
        var NewMovePoint: Point;
        if (typeof me.offsetX !== 'undefined') {
            NewMovePoint = this.MousePositionToScreenPosition(me.offsetX, me.offsetY);
        } else {
            var CanvasOffset = Offset.getOffset(this._Canvas);
            NewMovePoint = this.MousePositionToScreenPosition(me.clientX - CanvasOffset.x, me.clientY - CanvasOffset.y);
        }

        if (typeof this._MouseMovePoint !== 'undefined') {
            // Bail if move wasn't large enough
            if ((this._MouseMovePoint.x === NewMovePoint.x) && (this._MouseMovePoint.y === NewMovePoint.y)) { return; }

            // Check if we need to flip the points
            var DownPoint = new Point(this._MouseDownPoint.x, this._MouseDownPoint.y);
            var MovePoint = new Point(this._MouseMovePoint.x, this._MouseMovePoint.y);
            if ((DownPoint.y > MovePoint.y) || ((DownPoint.y === MovePoint.y) && (DownPoint.x > MovePoint.x))) {
                var TempPoint = DownPoint;
                DownPoint = MovePoint;
                MovePoint = TempPoint;
            }

            // Redraw each cell without highlighting
            for (var y: number = DownPoint.y; y <= MovePoint.y; y++) {
                // Determine how many cells to copy on this row
                var FirstX: number = (y === DownPoint.y) ? DownPoint.x : 1;
                var LastX: number = (y === MovePoint.y) ? MovePoint.x : this._ScreenSize.x;

                // And now copy the cells from this row
                for (var x: number = FirstX; x <= LastX; x++) {
                    var CI: CharInfo = this._Buffer[y][x];
                    CI.Reverse = false;
                    this.FastWrite(CI.Ch, x, y, CI, false);
                }
            }

            // Check if we need to flip the points
            DownPoint = new Point(this._MouseDownPoint.x, this._MouseDownPoint.y);
            MovePoint = new Point(NewMovePoint.x, NewMovePoint.y);
            if ((DownPoint.y > MovePoint.y) || ((DownPoint.y === MovePoint.y) && (DownPoint.x > MovePoint.x))) {
                var TempPoint = DownPoint;
                DownPoint = MovePoint;
                MovePoint = TempPoint;
            }

            // Redraw each cell with highlighting
            for (var y: number = DownPoint.y; y <= MovePoint.y; y++) {
                // Determine how many cells to copy on this row
                var FirstX: number = (y === DownPoint.y) ? DownPoint.x : 1;
                var LastX: number = (y === MovePoint.y) ? MovePoint.x : this._ScreenSize.x;

                // And now copy the cells from this row
                for (var x: number = FirstX; x <= LastX; x++) {
                    var CI: CharInfo = this._Buffer[y][x];
                    CI.Reverse = true;
                    this.FastWrite(CI.Ch, x, y, CI, false);
                }
            }
        }

        // Update move point
        this._MouseMovePoint = NewMovePoint;
    }

    private OnMouseUp(me: MouseEvent): void {
        // Get new screen point
        var UpPoint: Point;
        if (typeof me.offsetX !== 'undefined') {
            UpPoint = this.MousePositionToScreenPosition(me.offsetX, me.offsetY);
        } else {
            var CanvasOffset = Offset.getOffset(this._Canvas);
            UpPoint = this.MousePositionToScreenPosition(me.clientX - CanvasOffset.x, me.clientY - CanvasOffset.y);
        }

        if (typeof this._MouseDownPoint !== 'undefined') {
            // Ignore single cell copies
            var DownPoint = new Point(this._MouseDownPoint.x, this._MouseDownPoint.y);
            if ((DownPoint.x === UpPoint.x) && (DownPoint.y === UpPoint.y)) {
                // Single cell click, so check for hyperlink
                if ((typeof this._Buffer[DownPoint.y][DownPoint.x].Ch !== 'undefined') && (this._Buffer[DownPoint.y][DownPoint.x].Ch.charCodeAt(0) > 32) && (this._Buffer[DownPoint.y][DownPoint.x].Ch.charCodeAt(0) <= 126)) {
                    // Didn't click on a space, so backtrack to the previous space
                    var StartX = DownPoint.x;
                    var EndX = DownPoint.x;

                    // Find the previous space, or start of line TODO Find previous non-typable or space
                    while ((StartX > 1) && (typeof this._Buffer[DownPoint.y][StartX - 1].Ch !== 'undefined') && (this._Buffer[DownPoint.y][StartX - 1].Ch.charCodeAt(0) > 32) && (this._Buffer[DownPoint.y][StartX - 1].Ch.charCodeAt(0) <= 126)) {
                        StartX--;
                    }

                    // Find the next space, or end of line TODO Find next non-typable or space
                    while ((EndX < this._ScreenSize.x) && (typeof this._Buffer[DownPoint.y][EndX + 1].Ch !== 'undefined') && (this._Buffer[DownPoint.y][EndX + 1].Ch.charCodeAt(0) > 32) && (this._Buffer[DownPoint.y][EndX + 1].Ch.charCodeAt(0) <= 126)) {
                        EndX++;
                    }

                    // Build the string
                    var ClickedWord = '';
                    for (var x: number = StartX; x <= EndX; x++) {
                        ClickedWord += this._Buffer[DownPoint.y][x].Ch;
                    }

                    // Check for hyperlink
                    if ((ClickedWord.toLowerCase().indexOf('http://') === 0) || (ClickedWord.toLowerCase().indexOf('https://') === 0)) {
                        if (confirm('Would you like to open this url in a new window?\n\n' + ClickedWord)) {
                            window.open(ClickedWord);
                        }
                    }
                }
            } else {
                // Check if we need to flip the points
                if ((DownPoint.y > UpPoint.y) || ((DownPoint.y === UpPoint.y) && (DownPoint.x > UpPoint.x))) {
                    var TempPoint = DownPoint;
                    DownPoint = UpPoint;
                    UpPoint = TempPoint;
                }

                // Get the text behind those points
                var Text: string = '';
                for (var y: number = DownPoint.y; y <= UpPoint.y; y++) {
                    // Determine how many cells to copy on this row
                    var FirstX: number = (y === DownPoint.y) ? DownPoint.x : 1;
                    var LastX: number = (y === UpPoint.y) ? UpPoint.x : this._ScreenSize.x;

                    // And now copy the cells from this row
                    for (var x: number = FirstX; x <= LastX; x++) {
                        var CI: CharInfo = this._Buffer[y][x];
                        CI.Reverse = false;
                        this.FastWrite(CI.Ch, x, y, CI, false);

                        Text += (typeof this._Buffer[y][x].Ch === 'undefined') ? ' ' : this._Buffer[y][x].Ch;
                    }

                    // Add linefeeds, if necessary
                    if (y < DownPoint.y) { Text += '\r\n'; }
                }

                // Copy to the clipboard
                ClipboardHelper.SetData(Text);
            }
        }

        // Reset variables
        delete this._MouseDownPoint;
        delete this._MouseMovePoint;

        if (this._ReportMouse) {
            if (this._ReportMouseSgr) {
                this.onmousereport.trigger('\x1B[<' + me.button.toString() + ';' + UpPoint.x.toString() + ';' + UpPoint.y.toString() + 'm');
            } else {
                // SyncTerm source uses button=3 for mouse up
                this.onmousereport.trigger('\x1B[M 3!' + (UpPoint.x - 1).toString() + '!' + (UpPoint.y - 1).toString());
            }
        }
    }

    private OnMouseUpForWindow(me: MouseEvent): void {
        me = me; // Avoid unused parameter error

        // Mouse up over window, check if we need to erase the highlighting
        if ((typeof this._MouseDownPoint !== 'undefined') && (typeof this._MouseMovePoint !== 'undefined')) {
            var DownPoint = new Point(this._MouseDownPoint.x, this._MouseDownPoint.y);
            var MovePoint = new Point(this._MouseMovePoint.x, this._MouseMovePoint.y);

            // Bail if move wasn't large enough
            if ((DownPoint.x !== MovePoint.x) || (DownPoint.y !== MovePoint.y)) {

                // Check if we need to flip the points
                if ((DownPoint.y > MovePoint.y) || ((DownPoint.y === MovePoint.y) && (DownPoint.x > MovePoint.x))) {
                    var TempPoint = DownPoint;
                    DownPoint = MovePoint;
                    MovePoint = TempPoint;
                }

                // Redraw each cell without highlighting
                for (var y: number = DownPoint.y; y <= MovePoint.y; y++) {
                    // Determine how many cells to copy on this row
                    var FirstX: number = (y === DownPoint.y) ? DownPoint.x : 1;
                    var LastX: number = (y === MovePoint.y) ? MovePoint.x : this._ScreenSize.x;

                    // And now copy the cells from this row
                    for (var x: number = FirstX; x <= LastX; x++) {
                        var CI: CharInfo = this._Buffer[y][x];
                        CI.Reverse = false;
                        this.FastWrite(CI.Ch, x, y, CI, false);
                    }
                }
            }
        }

        // Reset variables with no copy since they didn't mouse up over the canvas
        delete this._MouseDownPoint;
        delete this._MouseMovePoint;
    }

    private OnResize(): void {
        // See if we can switch to a different font size
        if (this._AllowDynamicFontResize) {
            this.SetFont(this._Font.Name);
            // TODOX Added as part of auto-scale logic, not sure if needed this.OnFontChanged();
        }
    }

    public OutputBenchmarks(): void {
        Benchmarks.Alert();
        //var text = "";
        //text += "Bench GetChar: " + this._BenchGetChar.CumulativeElapsed + "\n";
        //text += "Bench PutImage: " + this._BenchPutImage.CumulativeElapsed + "\n";
        //text += "Bench UpdateBuffer: " + this._BenchUpdateBuffer.CumulativeElapsed + "\n";
        //alert(text);
    }

    public PushKeyDown(pushedCharCode: number, pushedKeyCode: number, ctrl: boolean, alt: boolean, shift: boolean): void {
        this.OnKeyDown(<KeyboardEvent>{
            altKey: alt,
            charCode: pushedCharCode,
            ctrlKey: ctrl,
            keyCode: pushedKeyCode,
            shiftKey: shift,
            preventDefault: function (): void { /* do nothing */ }
        });
    }

    public PushKeyPress(pushedCharCode: number, pushedKeyCode: number, ctrl: boolean, alt: boolean, shift: boolean): void {
        this.OnKeyPress(<KeyboardEvent>{
            altKey: alt,
            charCode: pushedCharCode,
            ctrlKey: ctrl,
            keyCode: pushedKeyCode,
            shiftKey: shift,
            preventDefault: function (): void { /* do nothing */ }
        });
    }

    public ReadKey(): KeyPressEvent | undefined {
        var KPE = this._KeyBuf.shift();
        if (typeof KPE === 'undefined') {
            return undefined;
        } else {
            if (this._LocalEcho) {
                this.Write(KPE.keyString);
            }
            return KPE;
        }
    }

    public get ReportMouse(): boolean {
        return this._ReportMouse;
    }

    public set ReportMouse(value: boolean) {
        this._ReportMouse = value;
    }

    public get ReportMouseSgr(): boolean {
        return this._ReportMouseSgr;
    }

    public set ReportMouseSgr(value: boolean) {
        this._ReportMouseSgr = value;
    }

    public ResetBenchmarks(): void {
        Benchmarks.Reset();
        //this._BenchGetChar.Reset();
        //this._BenchPutImage.Reset();
        //this._BenchUpdateBuffer.Reset();
    }

    public RestoreScreen(buffer: CharInfo[][], left: number, top: number, right: number, bottom: number): void {
        var Height: number = bottom - top + 1;
        var Width: number = right - left + 1;

        for (var Y: number = 0; Y < Height; Y++) {
            for (var X: number = 0; X < Width; X++) {
                this.FastWrite(buffer[Y][X].Ch, X + left, Y + top, buffer[Y][X]);
            }
        }
    }

    public ReverseVideo(): void {
        /// <summary>
        /// Reverses the foreground and background text attributes
        /// </summary>
        this.TextAttr = ((this.TextAttr & 0xF0) >> 4) | ((this.TextAttr & 0x0F) << 4);
    }

    public SaveScreen(left: number, top: number, right: number, bottom: number): CharInfo[][] {
        var Height: number = bottom - top + 1;
        var Width: number = right - left + 1;
        var Result: CharInfo[][] = [];

        for (var Y: number = 0; Y < Height; Y++) {
            Result[Y] = [];
            for (var X: number = 0; X < Width; X++) {
                Result[Y][X] = new CharInfo(this._Buffer[Y + top][X + left]);
            }
        }

        return Result;
    }

    public get ScreenCols(): number {
        return this._ScreenSize.x;
    }

    public get ScreenRows(): number {
        return this._ScreenSize.y;
    }

    public ScrollDownCustom(left: number, top: number, right: number, bottom: number, count: number, charInfo: CharInfo, updateBuffer?: boolean): void {
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
        // this._CanvasContext.fillStyle = '#' + StringUtils.PadLeft(CrtFont.ANSI_COLOURS[(charInfo.Attr & 0xF0) >> 4].toString(16), '0', 6);
        // Left = (left - 1) * this._Font.Width;
        // Top = (top - 1) * this._Font.Height;
        // Width = (right - left + 1) * this._Font.Width;
        // Height = (count * this._Font.Height);
        // this._CanvasContext.fillRect(Left, Top, Width, Height);
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
                    this._Buffer[Y][X].Set(this._Buffer[Y - count][X]);
                }
            }

            // Then, blank the contents that are not
            for (Y = top; Y <= count; Y++) {
                for (X = left; X <= right; X++) {
                    this._Buffer[Y][X].Set(charInfo);
                }
            }
        }
    }

    public ScrollDownScreen(count: number): void {
        /// <summary>
        /// Scrolls the screen down the given number of lines (leaving blanks at the top)
        /// </summary>
        /// <param name='ALines'>The number of lines to scroll</param>
        this.ScrollDownCustom(1, 1, this._ScreenSize.x, this._ScreenSize.y, count, this._CharInfo);
    }

    public ScrollDownWindow(count: number): void {
        /// <summary>
        /// Scrolls the current window down the given number of lines (leaving blanks at the top)
        /// </summary>
        /// <param name='ALines'>The number of lines to scroll</param>
        this.ScrollDownCustom(this.WindMinX + 1, this.WindMinY + 1, this.WindMaxX + 1, this.WindMaxY + 1, count, this._CharInfo);
    }

    public ScrollUpCustom(left: number, top: number, right: number, bottom: number, count: number, charInfo: CharInfo, updateBuffer?: boolean): void {
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

        if ((!this._InScrollback) || (this._InScrollback && !updateBuffer)) {
            var BScrollUp: Benchmark = Benchmarks.Start('ScrollUp');
            if (this._UseModernScrollback) {
                if ((left === 1) && (top === 1) && (right === this._ScreenSize.x) && (bottom === this._ScreenSize.y)) {
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
            } else {
                // Scroll
                var Left: number = (left - 1) * this._Font.Width;
                var Top: number = (top - 1 + count) * this._Font.Height;
                var Width: number = (right - left + 1) * this._Font.Width;
                var Height: number = ((bottom - top + 1 - count) * this._Font.Height);
                if (Height > 0) {
                    // From: http://stackoverflow.com/a/6003174/342378
                    this._TempCanvasContext.drawImage(this._Canvas, Left, Top, Width, Height, 0, 0, Width, Height);
                    Left = (left - 1) * this._Font.Width;
                    Top = (top - 1) * this._Font.Height;
                    this._CanvasContext.drawImage(this._TempCanvas, 0, 0, Width, Height, Left, Top, Width, Height);
                }
            }
            BScrollUp.Stop();

            // Blank
            // TODOX This fails for maskreet in Chrome -- looks like it sometimes decides to ignore the call to fillRect()
            // TODOX Been many versions since then, so maybe more reliable now, but needs Y-offset correction in modern scrollback mode
            //this._CanvasContext.fillStyle = '#' + StringUtils.PadLeft(CrtFont.ANSI_COLOURS[(charInfo.Attr & 0xF0) >> 4].toString(16), '0', 6);
            //Left = (left - 1) * this._Font.Width;
            //Top = (bottom - count) * this._Font.Height;
            //Width = (right - left + 1) * this._Font.Width;
            //Height = (count * this._Font.Height);
            //this._CanvasContext.fillRect(Left, Top, Width, Height);

            // Blank
            var BClearBottom: Benchmark = Benchmarks.Start('ClearBottom');
            for (var y: number = 0; y < count; y++) {
                for (var x: number = left; x <= right; x++) {
                    this.FastWrite(' ', x, bottom - count + 1 + y, charInfo, false);
                }
            }
            BClearBottom.Stop();
        }

        var BScrollUpdateBuffer: Benchmark = Benchmarks.Start('ScrollUpdateBuffer');
        if (updateBuffer) {
            // Now to adjust the buffer
            var NewRow: CharInfo[];
            var X: number;
            var Y: number;

            if (!this._UseModernScrollback) {
                // First, store the contents of the scrolled lines in the scrollback buffer
                for (Y = 0; Y < count; Y++) {
                    NewRow = [];
                    for (X = left; X <= right; X++) {
                        NewRow.push(new CharInfo(this._Buffer[Y + top][X]));
                    }
                    this._Scrollback.push(NewRow);
                }
                // Trim the scrollback to 1000 lines, if necessary
                var ScrollbackLength: number = this._Scrollback.length;
                while (ScrollbackLength > (this._ScrollbackSize - 2)) {
                    this._Scrollback.shift();
                    ScrollbackLength -= 1;
                }
            }

            // Then, shuffle the contents that are still visible
            for (Y = top; Y <= (bottom - count); Y++) {
                for (X = left; X <= right; X++) {
                    this._Buffer[Y][X].Set(this._Buffer[Y + count][X]);
                }
            }

            // Then, blank the contents that are not
            for (Y = bottom; Y > (bottom - count); Y--) {
                for (X = left; X <= right; X++) {
                    this._Buffer[Y][X].Set(charInfo);
                }
            }
        }
        BScrollUpdateBuffer.Stop();
    }

    public ScrollUpScreen(count: number): void {
        /// <summary>
        /// Scrolls the screen up the given number of lines (leaving blanks at the bottom)
        /// </summary>
        /// <param name='ALines'>The number of lines to scroll</param>
        this.ScrollUpCustom(1, 1, this._ScreenSize.x, this._ScreenSize.y, count, this._CharInfo);
    }

    public ScrollUpWindow(count: number): void {
        /// <summary>
        /// Scrolls the current window up the given number of lines (leaving blanks at the bottom)
        /// </summary>
        /// <param name='ALines'>The number of lines to scroll</param>
        this.ScrollUpCustom(this.WindMinX + 1, this.WindMinY + 1, this.WindMaxX + 1, this.WindMaxY + 1, count, this._CharInfo);
    }

    public SetBlink(value: boolean): void {
        this._CharInfo.Blink = value;
    }

    public SetBlinkRate(milliSeconds: number): void {
        this._Cursor.BlinkRate = milliSeconds;
    }

    public SetFont(font: string): boolean {
        /// <summary>
        /// Try to set the console font size to characters with the given X and Y size
        /// </summary>
        /// <param name='AX'>The horizontal size</param>
        /// <param name='AY'>The vertical size</param>
        /// <returns>True if the size was found and set, False if the size was not available</returns>

        // Request the new font
        if (this._UseModernScrollback) {
            // With modern scrollbar the container is the same width as the canvas, so we need to look at the parent container to see the maximum client size
            if (this._Container.parentElement === null) {
                // This should never happen, but needs to be here to make the compiler happy
                return this._Font.Load(font, Math.floor(this._Container.clientWidth / this._ScreenSize.x), Math.floor(window.innerHeight / this._ScreenSize.y));
            } else {
                return this._Font.Load(font, Math.floor(this._Container.parentElement.clientWidth / this._ScreenSize.x), Math.floor(window.innerHeight / this._ScreenSize.y));
            }
        } else {
            return this._Font.Load(font, Math.floor(this._Container.clientWidth / this._ScreenSize.x), Math.floor(window.innerHeight / this._ScreenSize.y));
        }
    }

    // TODO Doesn't seem to be working
    public SetScreenSize(columns: number, rows: number): void {
        // Check if we're in scrollback
        if (this._InScrollback) { return; }

        // Check if the requested size is already in use
        if ((columns === this._ScreenSize.x) && (rows === this._ScreenSize.y)) { return; }

        var X: number = 0;
        var Y: number = 0;

        // Save the old details
        var OldBuffer: CharInfo[][] = [];
        if (typeof this._Buffer !== 'undefined') {
            for (Y = 1; Y <= this._ScreenSize.y; Y++) {
                OldBuffer[Y] = [];
                for (X = 1; X <= this._ScreenSize.x; X++) {
                    OldBuffer[Y][X] = new CharInfo(this._Buffer[Y][X]);
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
        if (this._UseModernScrollback) {
            this._Canvas.height = this._Font.Height * (this._ScreenSize.y + this._ScrollbackSize);
            this._CanvasContext.fillRect(0, 0, this._Canvas.width, this._Canvas.height);
            this._TempCanvas.width = this._Canvas.width;
            this._TempCanvas.height = this._Canvas.height;
        } else {
            this._Canvas.height = this._Font.Height * this._ScreenSize.y;
        }

        // Restore the screen contents
        // TODO If new screen is smaller than old screen, restore bottom portion not top portion
        if (typeof this._Buffer !== 'undefined') {
            for (Y = 1; Y <= Math.min(this._ScreenSize.y, OldScreenSize.y); Y++) {
                for (X = 1; X <= Math.min(this._ScreenSize.x, OldScreenSize.x); X++) {
                    this.FastWrite(OldBuffer[Y][X].Ch, X, Y, OldBuffer[Y][X]);
                }
            }
        }

        // Let the program know about the update
        this.onscreensizechange.trigger();
    }

    public ShowCursor(): void {
        this._Cursor.Visible = true;
    }

    public set SkipRedrawWhenSameFontSize(value: boolean) {
        this._SkipRedrawWhenSameFontSize = value;
    }

    public get TextAttr(): number {
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

    public set TextAttr(value: number) {
        this._CharInfo.Back24 = CrtFont.ANSI_COLOURS[(value & 0xF0) >> 4];
        this._CharInfo.Fore24 = CrtFont.ANSI_COLOURS[value & 0x0F];
        this._CharInfo.Attr = value;
    }

    public TextBackground(colour: number): void {
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

    public TextBackground24(red: number, green: number, blue: number): void {
        this._CharInfo.Back24 = ((red & 0xFF) << 16) + ((green & 0xFF) << 8) + (blue & 0xFF);
    }

    public TextColor(colour: number): void {
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

    public TextColor24(red: number, green: number, blue: number): void {
        this._CharInfo.Fore24 = ((red & 0xFF) << 16) + ((green & 0xFF) << 8) + (blue & 0xFF);
    }

    public set Transparent(value: Boolean) {
        this._Transparent = value;
        // TODO Redraw
    }

    public WhereX(): number {
        /// <summary>
        /// Returns the CP's X coordinate of the current cursor location.
        /// </summary>
        /// <remarks>
        /// WhereX is window-specific.
        /// </remarks>
        /// <returns>The 1-based column of the window the cursor is currently in</returns>
        return this._Cursor.Position.x;
    }

    public WhereXA(): number {
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
    public WhereY(): number {
        return this._Cursor.Position.y;
    }

    public WhereYA(): number {
        /// <summary>
        /// Returns the CP's Y coordinate of the current cursor location.
        /// </summary>
        /// <remarks>
        /// WhereYA is now window-specific.
        /// </remarks>
        /// <returns>The 1-based row of the screen the cursor is currently in</returns>
        return this.WhereY() + this.WindMinY;
    }

    public get WindCols(): number {
        /// <summary>
        /// The number of columns found in the currently defined window
        /// </summary>
        return this.WindMaxX - this.WindMinX + 1;
    }

    public get WindMax(): number {
        /// <summary>
        /// The 0-based lower right coordinate of the current window
        /// </summary>
        return this._WindMax;
    }

    public get WindMaxX(): number {
        /// <summary>
        /// The 0-based left column of the current window
        /// </summary>
        return (this.WindMax & 0x00FF);
    }

    public get WindMaxY(): number {
        /// <summary>
        /// The 0-based right column of the current window
        /// </summary>
        return ((this.WindMax & 0xFF00) >> 8);
    }

    public get WindMin(): number {
        /// <summary>
        /// The 0-based upper left coordinate of the current window
        /// </summary>
        return this._WindMin;
    }

    public get WindMinX(): number {
        /// <summary>
        /// The 0-based top row of the current window
        /// </summary>
        return (this.WindMin & 0x00FF);
    }

    public get WindMinY(): number {
        /// <summary>
        /// The 0-based bottom row of the current window
        /// </summary>
        return ((this.WindMin & 0xFF00) >> 8);
    }

    public Window(left: number, top: number, right: number, bottom: number): void {
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
                this.GotoXY(1, 1);
            }
        }
    }

    public get WindRows(): number {
        /// <summary>
        /// The number of rows found in the currently defined window
        /// </summary>
        return this.WindMaxY - this.WindMinY + 1;
    }

    public Write(text: string): void {
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

    private WriteASCII(text: string): void {
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

    private WriteATASCII(text: string): void {
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

    private WritePETSCII(text: string): void {
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
                this.TextColor(Crt.PETSCII_WHITE);
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
                this.TextColor(Crt.PETSCII_RED);
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
                this.TextColor(Crt.PETSCII_GREEN);
            } else if (text.charCodeAt(i) === 0x1F) {
                // Changes the text color to blue. 
                this.TextColor(Crt.PETSCII_BLUE);
            } else if (text.charCodeAt(i) === 0x81) {
                // Changes the text color to orange. 
                this.TextColor(Crt.PETSCII_ORANGE);
            } else if (text.charCodeAt(i) === 0x8E) {
                // Select the uppercase/semigraphics character set. 
                this.SetFont('C64-Upper');
            } else if (text.charCodeAt(i) === 0x90) {
                // Changes the text color to black. 
                this.TextColor(Crt.PETSCII_BLACK);
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
                this.TextColor(Crt.PETSCII_BROWN);
            } else if (text.charCodeAt(i) === 0x96) {
                // Changes the text color to light red.
                this.TextColor(Crt.PETSCII_LIGHTRED);
            } else if (text.charCodeAt(i) === 0x97) {
                // Changes the text color to dark gray. 
                this.TextColor(Crt.PETSCII_DARKGRAY);
            } else if (text.charCodeAt(i) === 0x98) {
                // Changes the text color to gray. 
                this.TextColor(Crt.PETSCII_GRAY);
            } else if (text.charCodeAt(i) === 0x99) {
                // Changes the text color to light green. 
                this.TextColor(Crt.PETSCII_LIGHTGREEN);
            } else if (text.charCodeAt(i) === 0x9A) {
                // Changes the text color to light blue. 
                this.TextColor(Crt.PETSCII_LIGHTBLUE);
            } else if (text.charCodeAt(i) === 0x9B) {
                // Changes the text color to light gray. 
                this.TextColor(Crt.PETSCII_LIGHTGRAY);
            } else if (text.charCodeAt(i) === 0x9C) {
                // Changes the text color to purple. 
                this.TextColor(Crt.PETSCII_PURPLE);
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
                this.TextColor(Crt.PETSCII_YELLOW);
            } else if (text.charCodeAt(i) === 0x9F) {
                // Changes the text color to cyan. 
                this.TextColor(Crt.PETSCII_CYAN);
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

    public WriteLn(text?: string): void {
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
