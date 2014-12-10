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
/// <reference path='AnsiParserState.ts' />
/// <reference path='../../3rdparty/TypedEvent.ts' />
class Ansi {
    // Events
    public static onesc5n: IEvent = new TypedEvent();
    public static onesc6n: IEvent = new TypedEvent();
    public static onesc255n: IEvent = new TypedEvent();
    public static onescQ: IMessageEvent = new TypedEvent();
    public static onripdetect: IEvent = new TypedEvent();
    public static onripdisable: IEvent = new TypedEvent();
    public static onripenable: IEvent = new TypedEvent();

    private static ANSI_COLORS: number[] = [0, 4, 2, 6, 1, 5, 3, 7];

    private static _AnsiAttr: number = 7;
    private static _AnsiBuffer: string = '';
    private static _AnsiIntermediates: string[] = [];
    private static _AnsiParams: string[] = [];
    private static _AnsiParserState: AnsiParserState = AnsiParserState.None;
    private static _AnsiXY: Point = new Point(1, 1);

    // Source for most commands: 
    // http://cvs.synchro.net/cgi-bin/viewcvs.cgi/*checkout*/src/conio/cterm.txt?content-type=text%2Fplain&revision=HEAD
    // Commands not found in above document noted with NOT IN CTERM.TXT
    private static AnsiCommand(finalByte: string): void {
        var Colour: number = 0;
        var x: number = 0;
        var y: number = 0;
        var z: number = 0;

        switch (finalByte) {
            case '!': /* CSI [ p1 ] !
                            RIP detect
                            Defaults: p1 = 0
                            p1 = 0 performs RIP detect
                            p1 = 1 disables RIP parsing (treat RIPscrip commands as raw text)
                            p1 = 2 enables RIP parsing
                            SOURCE: Unknown 
                            NOT IN CTERM.TXT */
                if (this._AnsiParams.length < 1) { this._AnsiParams.push('0'); }
                switch (parseInt(this._AnsiParams.shift(), 10)) {
                    case 0: this.onripdetect.trigger(); break;
                    case 1: this.onripdisable.trigger(); break;
                    case 2: this.onripenable.trigger(); break;
                    default:
                        console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                        break;
                }
                break;
            case '@': /* CSI [ p1 ] @
	                        Insert Character(s)
	                        Defaults: p1 = 1
	                        Moves text from the current position to the right edge p1 characters
	                        to the right, with rightmost charaters going off-screen and the
	                        resulting hole being filled with the current attribute.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (this._AnsiParams.length < 1) { this._AnsiParams.push('1'); }
                x = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                Crt.InsChar(x);
                break;
            case '{': /* CSI = [ p1 [ ; p2 ] ] {
                        NON-STANDARD EXTENSION.
                        Defaults:  p1 = 255  p2 = 0
                        Indicates that a font block is following.
                        p1 indicates the font slot to place the loaded font into.  This must
                        be higher than the last default defined font (See CSI sp D for list
                        of predefined fonts)  p2 indicates font size according to the
                        following table:
                        0 - 8x16 font, 4096 bytes.
                        1 - 8x14 font, 3586 bytes.
                        2 - 8x8 font, 2048 bytes.

                        SOURCE: CTerm only. */
                console.log('Unhandled ESC sequence: Indicates that a font block is following');
                break;
            case 'A': /* CSI [ p1 ] A
	                        Cursor Up
	                        Defaults: p1 = 1
	                        Moves the cursor position up p1 lines from the current position.
	                        Attempting to move past the screen boundaries stops the cursor
	                        at the screen boundary.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (this._AnsiParams.length < 1) { this._AnsiParams.push('1'); }
                y = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                y = Math.max(1, Crt.WhereY() - y);
                Crt.GotoXY(Crt.WhereX(), y);
                break;
            case 'B': /* CSI [ p1 ] B
	                        Cursor Down
	                        Defaults: p1 = 1
	                        Moves the cursor position down p1 lines from the current position.
	                        Attempting to move past the screen boundaries stops the cursor
	                        at the screen boundary.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (this._AnsiParams.length < 1) { this._AnsiParams.push('1'); }
                y = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                y = Math.min(Crt.WindRows, Crt.WhereY() + y);
                Crt.GotoXY(Crt.WhereX(), y);
                break;
            case 'C': /* CSI [ p1 ] C
	                        Cursor Right
	                        Defaults: p1 = 1
	                        Moves the cursor position right p1 columns from the current position.
	                        Attempting to move past the screen boundaries stops the cursor
	                        at the screen boundary.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (this._AnsiParams.length < 1) { this._AnsiParams.push('1'); }
                x = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                x = Math.min(Crt.WindCols, Crt.WhereX() + x);
                Crt.GotoXY(x, Crt.WhereY());
                break;
            case 'c': /* CSI [ p1 ] c
	                        Device Attributes
	                        Defaults: p1 = 0
	                        If p1 is 0, CTerm will reply with the sequence:
	                        CSI [ = 67;84;101;114;109;pN... c
	                        64;84;101;114;109 is the ASCII values of the 'CTerm' string.  pN is the
	                        CVS revision ID of CTerm with dots converted to semi-colons.
	                        Use the CVS revision to detect if a specific feature is available.  If
	                        you are adding features to a forked version of cterm, please do so by
	                        adding an extra parameter to the end, not by incrementing any existing
	                        one!
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (this._AnsiParams.length < 1) { this._AnsiParams.push('0'); }
                console.log('Unhandled ESC sequence: Device Attributes');
                break;
            case 'D':
                if (this._AnsiIntermediates.length === 0) {
                    /* CSI [ p1 ] D
                        Cursor Left
                        Defaults: p1 = 1
                        Moves the cursor position left p1 columns from the current position.
                        Attempting to move past the screen boundaries stops the cursor
                        at the screen boundary.
                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                    if (this._AnsiParams.length < 1) { this._AnsiParams.push('1'); }
                    x = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                    x = Math.max(1, Crt.WhereX() - x);
                    Crt.GotoXY(x, Crt.WhereY());
                } else if (this._AnsiIntermediates.indexOf(' ') !== -1) {
                    /* CSI [ p1 [ ; p2 ] ] sp D
                        Font Selection
                        Defaults: p1 = 0  p2 = 0
                        'sp' indicates a single space character.
                        Sets font p1 to be the one indicated bu p2.  Currently only the primary
                        font (Font zero) and secondary font (Font one) are supported.  p2 must 
                        be between 0 and 255.  Not all output types support font selection.  Only
                        X11 and SDL currently do.
                        Currently included fonts are:
                            0  - Codepage 437 English
                            1  - Codepage 1251 Cyrillic, (swiss)
                            2  - Russian koi8-r
                            3  - ISO-8859-2 Central European
                            4  - ISO-8859-4 Baltic wide (VGA 9bit mapped)
                            5  - Codepage 866 (c) Russian
                            6  - ISO-8859-9 Turkish
                            7  - haik8 codepage (use only with armscii8 screenmap)
                            8  - ISO-8859-8 Hebrew
                            9  - Ukrainian font koi8-u
                            10 - ISO-8859-15 West European, (thin)
                            11 - ISO-8859-4 Baltic (VGA 9bit mapped)
                            12 - Russian koi8-r (b)
                            13 - ISO-8859-4 Baltic wide
                            14 - ISO-8859-5 Cyrillic
                            15 - ARMSCII-8 Character set
                            16 - ISO-8859-15 West European
                            17 - Codepage 850 Multilingual Latin I, (thin)
                            18 - Codepage 850 Multilingual Latin I
                            19 - Codepage 885 Norwegian, (thin)
                            20 - Codepage 1251 Cyrillic
                            21 - ISO-8859-7 Greek
                            22 - Russian koi8-r (c)
                            23 - ISO-8859-4 Baltic
                            24 - ISO-8859-1 West European
                            25 - Codepage 866 Russian
                            26 - Codepage 437 English, (thin)
                            27 - Codepage 866 (b) Russian
                            28 - Codepage 885 Norwegian
                            29 - Ukrainian font cp866u
                            30 - ISO-8859-1 West European, (thin)
                            31 - Codepage 1131 Belarusian, (swiss)
                            32 - Commodore 64 (UPPER)
                            33 - Commodore 64 (Lower)
                            34 - Commodore 128 (UPPER)
                            35 - Commodore 128 (Lower)
                            36 - Atari
                            37 - P0T NOoDLE (Amiga) 
                            38 - mO'sOul (Amiga)    
                            39 - MicroKnight (Amiga)
                            40 - Topaz (Amiga)      
                        Not all fonts are supported in all modes.  If a font is not supported in
                        the current mode, no action is taken.
                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                    while (this._AnsiParams.length < 2) { this._AnsiParams.push('0'); }
                    x = parseInt(this._AnsiParams.shift(), 10);
                    y = parseInt(this._AnsiParams.shift(), 10);
                    if ((x === 0) && (y >= 0) && (y <= 40)) {
                        // TODO Should pick based on available screen space, not on biggest to smallest
                        Crt.SetFont('SyncTerm-' + y.toString(10));
                    } else {
                        console.log('Unhandled ESC sequence: Secondary Font Selection (set font ' + x + ' to ' + y + ')');
                    }
                    break;
                }
                break;
            case 'E': /* CSI [ p1 ] E
	                        Cursor Next Line
	                        Defaults: p1 = 1
	                        Moves the cursor to the first column of the line p1 down from the current position.
	                        Moving past the bottom of the screen scrolls the screen up the remaining
	                        number of lines filling newly added lines with the current attribute.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (this._AnsiParams.length < 1) { this._AnsiParams.push('1'); }
                y = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                y = Math.min(Crt.WindRows, Crt.WhereY() + y);
                Crt.GotoXY(1, y);
                break;
            case 'F': /* CSI [ p1 ] F
	                        Cursor Preceding Line
	                        Defaults: p1 = 1
	                        Moves the cursor to the first column if the row p1 up from the current position.
	                        Attempting to move past the screen boundaries stops the cursor
	                        at the screen boundary.
                            SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (this._AnsiParams.length < 1) { this._AnsiParams.push('1'); }
                y = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                y = Math.max(1, Crt.WhereY() - y);
                Crt.GotoXY(1, y);
                break;
            case 'G': /* CSI [ p1 ] G
	                        Cursor Character Absolute
	                        Defaults: p1 = 1
	                        Movies the cursor to column p1 of the current row.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (this._AnsiParams.length < 1) { this._AnsiParams.push('1'); }
                x = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                if ((x >= 1) && (x <= Crt.WindCols)) {
                    Crt.GotoXY(x, Crt.WhereY());
                }
                break;
            case 'H':
            case 'f': /* CSI [ p1 [ ; p2 ] ] H
                         CSI [ p1 [ ; p2 ] ] f
	                        Cusror Position
	                        Defaults: p1 = 1  p2 = 1
	                        Moves the cursor to the p2th column of the p1th line.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                while (this._AnsiParams.length < 2) { this._AnsiParams.push('1'); }
                y = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                x = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                Crt.GotoXY(x, y);
                break;
            case 'h':
                if (this._AnsiParams.length < 1) { this._AnsiParams.push('0'); }
                switch (this._AnsiParams[0]) {
                    case '=255': /* CSI = 255 h
	                                NON-STANDARD EXTENSION
	                                Enable DoorWay Mode
                                    SOURCE: BANSI.TXT */
                        console.log('Unhandled ESC sequence: Enable DoorWay Mode');
                        break;
                    case '?6': /* CSI ? 6 h
	                                NON-STANDARD EXTENSION
                                    Enable origin mode.
                                    In this mode, position parameters are relative to the top left of the
                                    scrolling region, not the screen.
                                    SOURCE: Digital VT102 User Guide */
                        console.log('Unhandled ESC sequence: Enable origin mode');
                        break;
                    case '?7': /* CSI ? 7 h
	                                NON-STANDARD EXTENSION
                                    Enable auto wrap.
                                    This is the normal mode in which a write to the last column of a
                                    row will move the cursor to the start of the next line triggering a
                                    scroll if required to create a new line.
                                    SOURCE: Digital VT102 User Guide */
                        console.log('Unhandled ESC sequence: Enable auto wrap');
                        break;
                    case '?25': /* CSI ? 25 h
	                                NON-STANDARD EXTENSION
	                                Display the cursor
	                                SOURCE: 'Installing and Using the VT320 Video Terminal' */
                        Crt.ShowCursor();
                        break;
                    case '?31': /* CSI ? 31 h
	                                NON-STANDARD EXTENSION
	                                Enable alt character set
	                                With this mode set, the bright (1) graphic rendition selects characters
	                                from an alternate character set. */
                        console.log('Unhandled ESC sequence: Enable alt character set');
                        break;
                    case '?32': /* CSI ? 32 h
	                                NON-STANDARD EXTENSION
	                                Bright Intensity Enable
	                                Reverses CSI ? 32 l */
                        console.log('Unhandled ESC sequence: Bright Intensity Enable');
                        break;
                    case '?33': /* CSI ? 33 h
	                                NON-STANDARD EXTENSION
	                                Blink to Bright Intensity Background
	                                With this mode set, the blink (5,6) graphic renditions cause the
	                                background colour to be high intensity rather than causing blink */
                        console.log('Unhandled ESC sequence: Blink to Bright Intensity Background');
                        break;
                    default:
                        console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                        break;
                }
                break;
            case 'J': /* CSI [ p1 ] J
	                        Erase in Page
	                        Defaults: p1 = 0
	                        Erases from the current screen according to the value of p1
	                        0 - Erase from the current position to the end of the screen.
	                        1 - Erase from the current position to the start of the screen.
	                        2 - Erase entire screen.  As a violation of ECMA-048, also moves
	                            the cursor to position 1/1 as a number of BBS programs assume
	                            this behaviour.
	                        Erased characters are set to the current attribute.

	                        SOURCE BANSI.TXT */
                if (this._AnsiParams.length < 1) { this._AnsiParams.push('0'); }
                switch (parseInt(this._AnsiParams.shift(), 10)) {
                    case 0: Crt.ClrEos(); break;
                    case 1: Crt.ClrBos(); break;
                    case 2: Crt.ClrScr(); break;
                }
                break;
            case 'K': /* CSI [ p1 ] K
	                        Erase in Line
	                        Defaults: p1 = 0
	                        Erases from the current line according to the value pf p1
	                        0 - Erase from the current position to the end of the line.
	                        1 - Erase from the current position to the start of the line.
	                        2 - Erase entire line.
	                        Erased characters are set to the current attribute.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (this._AnsiParams.length < 1) { this._AnsiParams.push('0'); }
                switch (parseInt(this._AnsiParams.shift(), 10)) {
                    case 0: Crt.ClrEol(); break;
                    case 1: Crt.ClrBol(); break;
                    case 2: Crt.ClrLine(); break;
                }
                break;
            case 'L': /* CSI [ p1 ] L
	                        Insert Line(s)
	                        Defaults: p1 = 1
	                        Inserts p1 lines at the current line position.  The current line and
	                        those after it are scrolled down and the new empty lines are filled with
	                        the current attribute.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (this._AnsiParams.length < 1) { this._AnsiParams.push('1'); }
                y = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                Crt.InsLine(y);
                break;
            case 'l':
                if (this._AnsiParams.length < 1) { this._AnsiParams.push('0'); }
                switch (this._AnsiParams[0]) {
                    case '=255': /* CSI = 255 l
	                                NON-STANDARD EXTENSION
	                                Disable DoorWay Mode
                                    SOURCE: BANSI.TXT */
                        console.log('Unhandled ESC sequence: Disable DoorWay Mode');
                        break;
                    case '?6': /* CSI ? 6 l
	                                NON-STANDARD EXTENSION
                                    Disable origin mode.
                                    In this mode, position parameters are relative to the top left of the
                                    screen, not the scrolling region.
                                    SOURCE: Digital VT102 User Guide */
                        console.log('Unhandled ESC sequence: Disable origin mode');
                        break;
                    case '?7': /* CSI ? 7 l
	                                NON-STANDARD EXTENSION
                                    Disable auto wrap.
                                    This mode causes a write to the last column of a to leave the
                                    cursor where it was before the write occured, overwriting anything
                                    which was previously written to the same position.
                                    SOURCE: Digital VT102 User Guide */
                        console.log('Unhandled ESC sequence: Disable auto wrap');
                        break;
                    case '?25': /* CSI ? 25 l
	                                NON-STANDARD EXTENSION
	                                Hide the cursor
	                                SOURCE: 'Installing and Using the VT320 Video Terminal' */
                        Crt.HideCursor();
                        break;
                    case '?31': /* CSI ? 31 l
	                                NON-STANDARD EXTENSION
	                                Disable alt character set
	                                Reverses CSI ? 31 h */
                        console.log('Unhandled ESC sequence: Disable alt character set');
                        break;
                    case '?32': /* CSI ? 32 l
	                                NON-STANDARD EXTENSION
	                                Bright Intensity Disable
	                                Reverses CSI ? 32 h */
                        console.log('Unhandled ESC sequence: Bright Intensity Disable');
                        break;
                    case '?33': /* CSI ? 33 l
	                                NON-STANDARD EXTENSION
	                                Blink Normal
	                                Reverses CSI ? 33 h */
                        console.log('Unhandled ESC sequence: Blink Normal');
                        break;
                    default:
                        console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                        break;
                }
                break;
            case 'M':
                if (this._AnsiParams[0][0] === '=') {
                    /* CSI = [p1] M
                        NON-STANDARD EXTENSION.
                        Defaults:  p1 = 0
                        Sets the current state of ANSI music parsing.
                        0 - Only CSI | will introduce an ANSI music string.
                        1 - Both CSI | and CSI N will introduce an ANSI music string.
                        2 - CSI |, CSI N, and CSI M will all intriduce and ANSI music string.
                            In this mode, Delete Line will not be available.

                        SOURCE: CTerm only. */
                    if (this._AnsiParams.length < 1) { this._AnsiParams.push('0'); }
                    x = parseInt(this._AnsiParams.shift(), 10);
                    switch (x) {
                        case 0:
                            console.log('Unhandled ESC sequence: Only CSI | will introduce an ANSI music string.');
                            break;
                        case 1:
                            console.log('Unhandled ESC sequence: Both CSI | and CSI N will introduce an ANSI music string.');
                            break;
                        case 2:
                            console.log('Unhandled ESC sequence: CSI |, CSI N, and CSI M will all intriduce and ANSI music string.');
                            break;
                        default:
                            console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                            break;
                    }
                } else {
                    /* CSI [ p1 ] M
                        Delete Line(s) / 'ANSI' Music
                        Defaults: p1 = 1
                        Deletes the current line and the p1 - 1 lines after it scrolling the
                        first non-deleted line up to the current line and filling the newly
                        empty lines at the end of the screen with the current attribute.
                        If 'ANSI' Music is fully enabled (CSI = 2 M), performs 'ANSI' music
                        instead.
                        See 'ANSI' MUSIC section for more details.

                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf
                        SOURCE: BANSI.TXT */
                    if (this._AnsiParams.length < 1) { this._AnsiParams.push('1'); }
                    y = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                    Crt.DelLine(y);
                }
                break;
            case 'm': /* CSI [ p1 [ ; pX ... ] ] m
	                        Select Graphic Rendition
	                        Defaults: p1 = 0
	                        Sets or clears one or more text attributes.  Unlimited parameters are
	                        supported and are applied in received order.  The following are
	                        supoprted:
	                                                                     Blink Bold FG BG (Modified)
	                        0 -  Default attribute, white on black          X    X  X  X
	                        1 -  Bright Intensity                                X
	                        2 -  Dim intensty                                    X
	                        5 -  Blink (By definition, slow blink)          X
	                        6 -  Blink (By definition, fast blink)          X
	                             NOTE: Both blinks are the same speed.     
	                        7 -  Negative Image - Reverses FG and BG                X  X
	                        8 -  Concealed characters, sets the                     X
	                             forground colour to the background     
		                         colour.     
	                        22 - Normal intensity                                X
	                        25 - Steady (Not blinking)                      X
	                        27 - Positive Image - Reverses FG and BG                X  X
	                             NOTE: This should be a separate     
		                               attribute than 7 but this     
			                           implementation makes them equal     
	                        30 - Black foreground                                   X
	                        31 - Red foreground                                     X
	                        32 - Green foreground                                   X
	                        33 - Yellow foreground                                  X
	                        34 - Blue foreground                                    X
	                        35 - Magenta foreground                                 X
	                        36 - Cyan foreground                                    X
	                        37 - White foreground                                   X
	                        39 - Default foreground (same as white)	                X
	                        40 - Black background                                      X
	                        41 - Red background                                        X
	                        42 - Green background                                      X
	                        43 - Yellow background                                     X
	                        44 - Blue background                                       X
	                        45 - Magenta background                                    X
	                        46 - Cyan background                                       X
	                        47 - White background                                      X
	                        49 - Default background (same as black)                    X
	                        All others are ignored.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (this._AnsiParams.length < 1) { this._AnsiParams.push('0'); }
                while (this._AnsiParams.length > 0) {
                    x = parseInt(this._AnsiParams.shift(), 10);
                    switch (x) {
                        case 0: // Default attribute, white on black
                            Crt.NormVideo();
                            break;
                        case 1: // Bright Intensity
                            Crt.HighVideo();
                            break;
                        case 2: // Dim intensty
                            Crt.LowVideo();
                            break;
                        case 3: // NOT IN CTERM.TXT Italic: on (not widely supported)
                            break;
                        case 4: // NOT IN CTERM.TXT Underline: Single
                            break;
                        case 5: // Blink (By definition, slow blink)
                            Crt.SetBlink(true);
                            Crt.SetBlinkRate(500);
                            break;
                        case 6: // Blink (By definition, fast blink)
                            Crt.SetBlink(true);
                            Crt.SetBlinkRate(250);
                            break;
                        case 7: // Negative Image - Reverses FG and BG
                            Crt.ReverseVideo();
                            break;
                        case 8: // Concealed characters, sets the forground colour to the background colour.
                            this._AnsiAttr = Crt.TextAttr;
                            Crt.Conceal();
                            break;
                        case 21: // NOT IN CTERM.TXT Underline: Double (not widely supported)
                            break;
                        case 22: // Normal intensity
                            Crt.LowVideo();
                            break;
                        case 24: // NOT IN CTERM.TXT Underline: None
                            break;
                        case 25: // Steady (Not blinking)
                            Crt.SetBlink(false);
                            break;
                        case 27: // Positive Image - Reverses FG and BG  
                            // NOTE: This should be a separate attribute than 7 but this implementation makes them equal
                            Crt.ReverseVideo();
                            break;
                        case 28: // NOT IN CTERM.TXT Reveal (conceal off)
                            Crt.TextAttr = this._AnsiAttr;
                            break;
                        case 30: // Set foreground color, normal intensity
                        case 31:
                        case 32:
                        case 33:
                        case 34:
                        case 35:
                        case 36:
                        case 37:
                            Colour = this.ANSI_COLORS[x - 30];
                            if (Crt.TextAttr % 16 > 7) { Colour += 8; }
                            Crt.TextColor(Colour);
                            break;
                        case 39: // Default foreground (same as white)
                            Colour = this.ANSI_COLORS[37 - 30];
                            if (Crt.TextAttr % 16 > 7) { Colour += 8; }
                            Crt.TextColor(Colour);
                            break;
                        case 40: // Set background color, normal intensity
                        case 41:
                        case 42:
                        case 43:
                        case 44:
                        case 45:
                        case 46:
                        case 47:
                            Colour = this.ANSI_COLORS[x - 40];
                            Crt.TextBackground(Colour);
                            break;
                        case 49: // Default background (same as black)
                            Colour = this.ANSI_COLORS[40 - 40];
                            Crt.TextBackground(Colour);
                            break;
                    }
                }
                break;
            case 'N': /* CSI N
	                        'ANSI' Music / Not implemented.
	                        If 'ANSI' Music is set to BananaCom (CSI = 1 M) or fully enabled
	                        (CSI = 2 M) performs 'ANSI' muisic.  See 'ANSI' MUSIC section for more
	                        details.
	                        SOURCE: BANSI.TXT */
                console.log('Unhandled ESC sequence: ANSI Music');
                break;
            case 'n':  /* CSI [ p1 ] n
	                        Device Status Report
	                        Defaults: p1 = 0
	                        A request for a status report.  CTerm handles the following three
	                        requests:
	                        5	- Request a DSR
		                          CTerm will always reply with CSI 0 n indicating 
		                          'ready, no malfunction detected'
	                        6	- Request active cursor position
		                          CTerm will reply with CSI y ; x R where y is the current line
		                          and x is
		                          the current row.
	                        255	- NON-STANDARD EXTENSION
		                          Replies as though a CSI [ 6 n was recieved with the cursor in
		                          the bottom right corner.  ie: Returns the terminal size as a
		                          position report.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf
		                        (parameters 5 and 6 only)
	                        SOURCE: BANSI.TXT (parameter 255) */
                if (this._AnsiParams.length < 1) { this._AnsiParams.push('0'); }
                x = parseInt(this._AnsiParams.shift(), 10);
                switch (x) {
                    case 5: this.onesc5n.trigger(); break;
                    case 6: this.onesc6n.trigger(); break;
                    case 255: this.onesc255n.trigger(); break;
                    default:
                        console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                        break;
                }
                break;
            case 'P': /* CSI [ p1 ] P
	                        Delete Character
	                        Defaults: p1 = 1
	                        Deletes the character at the current position by shifting all characters
	                        from the current column + p1 left to the current column.  Opened blanks
	                        at the end of the line are filled with the current attribute.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (this._AnsiParams.length < 1) { this._AnsiParams.push('1'); }
                x = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                Crt.DelChar(x);
                break;
            case 'Q': /* CSI p1 ; p2 ; p3 Q
                            NON-STANDARD EXTENSION.
                            Change the current font.
                            p1 is the code page
                            p2 is the width
                            p2 is the height 
                            SOURCE: fTelnet
                            NOT IN CTERM.TXT */
                while (this._AnsiParams.length < 3) { this._AnsiParams.push('0'); }
                x = parseInt(this._AnsiParams.shift(), 10);
                y = parseInt(this._AnsiParams.shift(), 10);
                z = parseInt(this._AnsiParams.shift(), 10);
                this.onescQ.trigger(x.toString(10));
                break;
            case 'r':
                if (this._AnsiIntermediates.length === 0) {
                    console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                } else if (this._AnsiIntermediates[0].indexOf('*') !== -1) {
                    /* CSI [ p1 [ ; p2 ] ] * r
                        NON-STANDARD EXTENSION.
                        Set the output emulation speed.
                        If p1 or p2 are omitted, causes output speed emulation to stop
                        p1 may be empty.
                        Sequence is ignored if p1 is not empty, 0, or 1.
                        The value of p2 sets the output speed emulation as follows:
                        Value		Speed
                        -----		-----
                        empty, 0	Unlimited
                        1		300
                        2		600
                        3		1200
                        4		2400
                        5		4800
                        6		9600
                        7		19200
                        8		38400
                        9		57600
                        10		76800
                        11		115200
                        SOURCE: VT4xx Specification from http://www.vt100.net/ */
                    console.log('Unhandled ESC sequence: Set the output emulation speed.');
                } else if (this._AnsiIntermediates[0].indexOf(']') !== -1) {
                    /* CSI [ p1 [ ; p2 ] ] r
                        NON-STANDARD EXTENSION.
                        Set Top and Bottom Margins
                        Defaults: p1 = 1
                                  p2 = last line on screen
                        Selects top and bottom margins, defining the scrolling region. P1 is
                        the line number of the first line in the scrolling region. P2 is the line
                        number of the bottom line. */
                    console.log('Unhandled ESC sequence: Set Top and Bottom Margins');
                } else {
                    console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                }
                break;
            case 'S': /* CSI [ p1 ] S
	                        Scroll Up
	                        Defaults: p1 = 1
	                        Scrolls all text on the screen up p1 lines.  New lines emptied at the
	                        bottom are filled with the current attribute.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (this._AnsiParams.length < 1) { this._AnsiParams.push('1'); }
                y = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                Crt.ScrollUpScreen(y);
                break;
            case 's':
                if (this._AnsiIntermediates.length === 0) {
                    /* CSI s
                        NON-STANDARD EXTENSION
                        Save Current Position
                        Saves the current cursor position for later restoring with CSI u
                        although this is non-standard, it's so widely used in the BBS world
                        that any terminal program MUST implement it.
                        SOURCE: ANSI.SYS */
                    this._AnsiXY = new Point(Crt.WhereX(), Crt.WhereY());
                } else {
                    /* CSI ? [ p1 [ pX ... ] ] s
                        NON-STANDARD EXTENSION
                        Save Mode Setting
                        Saves the current mode states as specified by CSI l and CSI h.  If
                        p1 is omitted, saves all such states.  If pX is included, saves only
                        the specified states (arguments to CSI l/h).
                        SOURCE: SyncTERM only */
                    console.log('Unhandled ESC sequence: Save Mode Setting');
                }
                break;
            case 'T': /* CSI [ p1 ] T
	                        Scroll Down
	                        Defaults: p1 = 1
	                        Scrolls all text on the screen down p1 lines.  New lines emptied at the
	                        top are filled with the current attribute.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (this._AnsiParams.length < 1) { this._AnsiParams.push('1'); }
                y = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                Crt.ScrollDownWindow(y);
                break;
            case 'U': /* CSI U
	                        NON-STANDARD (Disabled in current code)
	                        Clear screen with default attribute.
	                        This code is *supposed* to go to the 'next page' according to the
	                        ANSI/ECMA specs with CSI V going to 'previous page'
	                        SOURCE: BANSI.TXT */
                console.log('Unhandled ESC sequence: Clear screen with default attribute');
                break;
            case 'u':
                if (this._AnsiIntermediates.length === 0) {
                    /* CSI u
                        NON-STANDARD EXTENSION
                        Restore Cursor Position
                        Move the cursor to the last position saved by CSI s.  If no position has
                        been saved, the cursor is not moved.
                        SOURCE: ANSI.SYS */
                    Crt.GotoXY(this._AnsiXY.x, this._AnsiXY.y);
                } else {
                    /* CSI ? [ p1 [ pX ... ] ]  u
                        NON-STANDARD EXTENSION
                        Restore Mode Setting
                        Saves the current mode states as specified by CSI l and CSI h.  If
                        p1 is omitted, saves all such states.  If pX is included, restores
                        all the specified states (arguments to CSI l/h)
                        SOURCE: SyncTERM only */
                    console.log('Unhandled ESC sequence: Restore Mode Setting');
                }
                break;
            case 'X': /* CSI [ p1 ] X
	                        Erase Character
	                        Defaults: p1 = 1
	                        Erase p1 characters starting at the current character.  Will not erase past the end
	                        of line.
	                        Erased characters are set to the current attribute.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (this._AnsiParams.length < 1) { this._AnsiParams.push('1'); }
                x = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                Crt.DelChar(x);
                break;
            case 'Z': /* CSI [ p1 ] Z
	                        Cursor Backward Tabulation
	                        Defaults: p1 = 1
	                        Move the cursor to the p1th preceeding tab stop.  Will not go past the
	                        start of the line.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                console.log('Unhandled ESC sequnce: Cursor Backward Tabulation');
                break;
            default:
                console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                break;
        }
    }

    public static ClrBol(): string {
        return '\x1B[1K';
    }

    public static ClrBos(): string {
        return '\x1B[1J';
    }

    public static ClrEol(): string {
        return '\x1B[K';
    }

    public static ClrEos(): string {
        return '\x1B[J';
    }

    public static ClrLine(): string {
        return '\x1B[2K';
    }

    public static ClrScr(): string {
        return '\x1B[2J';
    }

    public static CursorDown(count: number): string {
        if (count === 1) {
            return '\x1B[B';
        } else {
            return '\x1B[' + count.toString() + 'B';
        }
    }

    public static CursorLeft(count: number): string {
        if (count === 1) {
            return '\x1B[D';
        } else {
            return '\x1B[' + count.toString() + 'D';
        }
    }

    public static CursorPosition(x?: number, y?: number): string {
        if (typeof x === 'undefined') { x = Crt.WhereXA(); }
        if (typeof y === 'undefined') { y = Crt.WhereYA(); }

        return '\x1B[' + y + ';' + x + 'R';
    }

    public static CursorRestore(): string {
        return '\x1B[u';
    }

    public static CursorRight(count: number): string {
        if (count === 1) {
            return '\x1B[C';
        } else {
            return '\x1B[' + count.toString() + 'C';
        }
    }

    public static CursorSave(): string {
        return '\x1B[s';
    }

    public static CursorUp(count: number): string {
        if (count === 1) {
            return '\x1B[A';
        } else {
            return '\x1B[' + count.toString() + 'A';
        }
    }

    public static GotoX(x: number): string {
        if (x === 1) {
            return this.CursorLeft(255);
        } else {
            return this.CursorLeft(255) + this.CursorRight(x - 1);
        }
    }

    public static GotoXY(x: number, y: number): string {
        return '\x1B[' + y.toString() + ';' + x.toString() + 'H';
    }

    public static GotoY(y: number): string {
        if (y === 1) {
            return this.CursorUp(255);
        } else {
            return this.CursorUp(255) + this.CursorDown(y - 1);
        }
    }

    public static TextAttr(attr: number): string {
        return this.TextColor(attr % 16) + this.TextBackground(Math.floor(attr / 16));
    }

    public static TextBackground(colour: number): string {
        while (colour >= 8) { colour -= 8; }
        return '\x1B[' + (40 + this.ANSI_COLORS[colour]).toString() + 'm';
    }

    public static TextColor(colour: number): string {
        switch (colour % 16) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
                return '\x1B[0;' + (30 + this.ANSI_COLORS[colour % 16]).toString() + 'm' + this.TextBackground(Crt.TextAttr / 16);
            case 8:
            case 9:
            case 10:
            case 11:
            case 12:
            case 13:
            case 14:
            case 15: return '\x1B[1;' + (30 + this.ANSI_COLORS[(colour % 16) - 8]).toString() + 'm';
        }

        return '';
    }

    public static Write(text: string): void {
        // Check for Atari/C64 mode, which doesn't use ANSI
        if (Crt.Atari || Crt.C64) {
            Crt.Write(text);
        } else {
            var Buffer: string = '';

            for (var i: number = 0; i < text.length; i++) {
                if (text.charAt(i) === '\x1B') {
                    this._AnsiParserState = AnsiParserState.Escape;
                } else if (this._AnsiParserState === AnsiParserState.Escape) {
                    if (text.charAt(i) === '[') {
                        this._AnsiParserState = AnsiParserState.Bracket;
                        this._AnsiBuffer = '';

                        while (this._AnsiParams.length > 0) { this._AnsiParams.pop(); }
                        while (this._AnsiIntermediates.length > 0) { this._AnsiIntermediates.pop(); }
                    } else {
                        Buffer += text.charAt(i);
                        this._AnsiParserState = AnsiParserState.None;
                    }
                } else if (this._AnsiParserState === AnsiParserState.Bracket) {
                    if (text.charAt(i) === '!') {
                        // Handle ESC[!, which is rip detect
                        Crt.Write(Buffer);
                        Buffer = '';

                        // Handle the command
                        this.AnsiCommand(text.charAt(i));

                        // Reset the parser state
                        this._AnsiParserState = AnsiParserState.None;
                    } else if ((text.charAt(i) >= '0') && (text.charAt(i) <= '?')) {
                        // It's a parameter byte
                        this._AnsiBuffer += text.charAt(i);
                        this._AnsiParserState = AnsiParserState.ParameterByte;
                    } else if ((text.charAt(i) >= ' ') && (text.charAt(i) <= '/')) {
                        // It's an intermediate byte
                        this._AnsiBuffer += text.charAt(i);
                        this._AnsiParserState = AnsiParserState.IntermediateByte;
                    } else if ((text.charAt(i) >= '@') && (text.charAt(i) <= '~')) {
                        // Final byte, output whatever we have buffered
                        Crt.Write(Buffer);
                        Buffer = '';

                        // Handle the command
                        this.AnsiCommand(text.charAt(i));

                        // Reset the parser state
                        this._AnsiParserState = AnsiParserState.None;
                    } else {
                        // Invalid sequence
                        Buffer += text.charAt(i);
                        this._AnsiParserState = AnsiParserState.None;
                    }
                } else if (this._AnsiParserState === AnsiParserState.ParameterByte) {
                    if (text.charAt(i) === '!') {
                        // Handle ESC[0!, which is rip detect (or ESC[1! or ESC[2! which are disable/enable)
                        this._AnsiParams.push((this._AnsiBuffer === '') ? '0' : this._AnsiBuffer);
                        this._AnsiBuffer = '';

                        // Output whatever we have buffered
                        Crt.Write(Buffer);
                        Buffer = '';

                        // Handle the command
                        this.AnsiCommand(text.charAt(i));

                        // Reset the parser state
                        this._AnsiParserState = AnsiParserState.None;
                    } else if (text.charAt(i) === ';') {
                        // Start of new parameter
                        this._AnsiParams.push((this._AnsiBuffer === '') ? '0' : this._AnsiBuffer);
                        this._AnsiBuffer = '';
                    } else if ((text.charAt(i) >= '0') && (text.charAt(i) <= '?')) {
                        // Additional parameter byte
                        this._AnsiBuffer += text.charAt(i);
                    } else if ((text.charAt(i) >= ' ') && (text.charAt(i) <= '/')) {
                        // Intermediate byte, push buffer to new parameter
                        this._AnsiParams.push((this._AnsiBuffer === '') ? '0' : this._AnsiBuffer);
                        this._AnsiBuffer = '';

                        this._AnsiIntermediates.push(text.charAt(i));
                        this._AnsiParserState = AnsiParserState.IntermediateByte;
                    } else if ((text.charAt(i) >= '@') && (text.charAt(i) <= '~')) {
                        // Final byte, push buffer to new parameter
                        this._AnsiParams.push((this._AnsiBuffer === '') ? '0' : this._AnsiBuffer);
                        this._AnsiBuffer = '';

                        // Output whatever we have buffered
                        Crt.Write(Buffer);
                        Buffer = '';

                        // Handle the command
                        this.AnsiCommand(text.charAt(i));

                        // Reset the parser state
                        this._AnsiParserState = AnsiParserState.None;
                    } else {
                        // Invalid command
                        Buffer += text.charAt(i);
                        this._AnsiParserState = AnsiParserState.None;
                    }
                } else if (this._AnsiParserState === AnsiParserState.IntermediateByte) {
                    if ((text.charAt(i) >= '0') && (text.charAt(i) <= '?')) {
                        // Parameter byte, which is illegal at this point
                        Buffer += text.charAt(i);
                        this._AnsiParserState = AnsiParserState.None;
                    } else if ((text.charAt(i) >= ' ') && (text.charAt(i) <= '/')) {
                        // Additional intermediate byte
                        this._AnsiIntermediates.push(text.charAt(i));
                    } else if ((text.charAt(i) >= '@') && (text.charAt(i) <= '~')) {
                        // Final byte byte, output whatever we have buffered
                        Crt.Write(Buffer);
                        Buffer = '';

                        // Handle the command
                        this.AnsiCommand(text.charAt(i));

                        // Reset the parser state
                        this._AnsiParserState = AnsiParserState.None;
                    } else {
                        // Invalid command
                        Buffer += text.charAt(i);
                        this._AnsiParserState = AnsiParserState.None;
                    }
                } else {
                    Buffer += text.charAt(i);
                }
            }

            Crt.Write(Buffer);
        }
    }

    public static WriteLn(text: string): void {
        this.Write(text + '\r\n');
    }
}
