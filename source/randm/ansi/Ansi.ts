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
var Ansi = 0;
var TAnsi = function () {
    this.onesc5n = function () { }; // Do nothing
    this.onesc6n = function () { }; // Do nothing
    this.onesc255n = function () { }; // Do nothing
    this.onescQ = function () { }; // Do nothing
    this.onripdetect = function () { }; // Do nothing
    this.onripdisable = function () { }; // Do nothing
    this.onripenable = function () { }; // Do nothing

    var ANSI_COLORS = [0, 4, 2, 6, 1, 5, 3, 7];

    var that = this;
    var FAnsiAttr;
    var FAnsiBuffer;
    var FAnsiIntermediates;
    var FAnsiParams;
    var FAnsiParserState;
    var FAnsiXY;

    // Source for most commands: http://cvs.synchro.net/cgi-bin/viewcvs.cgi/*checkout*/src/conio/cterm.txt?content-type=text%2Fplain&revision=HEAD
    // Commands not found in above document noted with NOT IN CTERM.TXT
    var AnsiCommand = function (ACommand) {
        var Colour = 0;
        var X = 0;
        var Y = 0;
        var Z = 0;

        switch (ACommand) {
            case "!": /* CSI [ p1 ] !
                            RIP detect
                            Defaults: p1 = 0
                            p1 = 0 performs RIP detect
                            p1 = 1 disables RIP parsing (treat RIPscrip commands as raw text)
                            p1 = 2 enables RIP parsing
                            SOURCE: Unknown 
                            NOT IN CTERM.TXT */
                if (FAnsiParams.length < 1) { FAnsiParams.push("0"); }
                switch (parseInt(FAnsiParams.shift(), 10)) {
                    case 0: that.onripdetect(); break;
                    case 1: that.onripdisable(); break;
                    case 2: that.onripenable(); break;
                    default: trace("Unknown ESC sequence: PB(" + FAnsiParams.toString() + ") IB(" + FAnsiIntermediates.toString() + ") FB(" + ACommand + ")"); break;
                }
                break;
            case "@": /* CSI [ p1 ] @
	                        Insert Character(s)
	                        Defaults: p1 = 1
	                        Moves text from the current position to the right edge p1 characters
	                        to the right, with rightmost charaters going off-screen and the
	                        resulting hole being filled with the current attribute.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (FAnsiParams.length < 1) { FAnsiParams.push("1"); }
                X = Math.max(1, parseInt(FAnsiParams.shift(), 10));
                Crt.InsChar(" ", X);
                break;
            case "{": /* CSI = [ p1 [ ; p2 ] ] {
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
                trace("Unhandled ESC sequence: Indicates that a font block is following");
                break;
            case "A": /* CSI [ p1 ] A
	                        Cursor Up
	                        Defaults: p1 = 1
	                        Moves the cursor position up p1 lines from the current position.
	                        Attempting to move past the screen boundaries stops the cursor
	                        at the screen boundary.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (FAnsiParams.length < 1) { FAnsiParams.push("1"); }
                Y = Math.max(1, parseInt(FAnsiParams.shift(), 10));
                Y = Math.max(1, Crt.WhereY() - Y);
                Crt.GotoXY(Crt.WhereX(), Y);
                break;
            case "B": /* CSI [ p1 ] B
	                        Cursor Down
	                        Defaults: p1 = 1
	                        Moves the cursor position down p1 lines from the current position.
	                        Attempting to move past the screen boundaries stops the cursor
	                        at the screen boundary.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (FAnsiParams.length < 1) { FAnsiParams.push("1"); }
                Y = Math.max(1, parseInt(FAnsiParams.shift(), 10));
                Y = Math.min(Crt.WindRows, Crt.WhereY() + Y);
                Crt.GotoXY(Crt.WhereX(), Y);
                break;
            case "C": /* CSI [ p1 ] C
	                        Cursor Right
	                        Defaults: p1 = 1
	                        Moves the cursor position right p1 columns from the current position.
	                        Attempting to move past the screen boundaries stops the cursor
	                        at the screen boundary.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (FAnsiParams.length < 1) { FAnsiParams.push("1"); }
                X = Math.max(1, parseInt(FAnsiParams.shift(), 10));
                X = Math.min(Crt.WindCols, Crt.WhereX() + X);
                Crt.GotoXY(X, Crt.WhereY());
                break;
            case "c": /* CSI [ p1 ] c
	                        Device Attributes
	                        Defaults: p1 = 0
	                        If p1 is 0, CTerm will reply with the sequence:
	                        CSI [ = 67;84;101;114;109;pN... c
	                        64;84;101;114;109 is the ASCII values of the "CTerm" string.  pN is the
	                        CVS revision ID of CTerm with dots converted to semi-colons.
	                        Use the CVS revision to detect if a specific feature is available.  If
	                        you are adding features to a forked version of cterm, please do so by
	                        adding an extra parameter to the end, not by incrementing any existing
	                        one!
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (FAnsiParams.length < 1) { FAnsiParams.push("0"); }
                trace("Unhandled ESC sequence: Device Attributes");
                break;
            case "D":
                if (FAnsiIntermediates.length === 0) {
                    /* CSI [ p1 ] D
                        Cursor Left
                        Defaults: p1 = 1
                        Moves the cursor position left p1 columns from the current position.
                        Attempting to move past the screen boundaries stops the cursor
                        at the screen boundary.
                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                    if (FAnsiParams.length < 1) { FAnsiParams.push("1"); }
                    X = Math.max(1, parseInt(FAnsiParams.shift(), 10));
                    X = Math.max(1, Crt.WhereX() - X);
                    Crt.GotoXY(X, Crt.WhereY());
                } else if (FAnsiIntermediates.indexOf(' ') !== -1) {
                    /* CSI [ p1 [ ; p2 ] ] sp D
	                    Font Selection
	                    Defaults: p1 = 0  p2 = 0
	                    "sp" indicates a single space character.
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
                    while (FAnsiParams.length < 2) { FAnsiParams.push("0"); }
                    X = parseInt(FAnsiParams.shift(), 10);
                    Y = parseInt(FAnsiParams.shift(), 10);
                    trace("Unhandled ESC sequence: Font Selection (set font " + X + " to " + Y + ")");
                    break;
                }
                break;
            case "E": /* CSI [ p1 ] E
	                        Cursor Next Line
	                        Defaults: p1 = 1
	                        Moves the cursor to the first column of the line p1 down from the current position.
	                        Moving past the bottom of the screen scrolls the screen up the remaining
	                        number of lines filling newly added lines with the current attribute.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (FAnsiParams.length < 1) { FAnsiParams.push("1"); }
                Y = Math.max(1, parseInt(FAnsiParams.shift(), 10));
                Y = Math.min(Crt.WindRows, Crt.WhereY() + Y);
                Crt.GotoXY(1, Y);
                break;
            case "F": /* CSI [ p1 ] F
	                        Cursor Preceding Line
	                        Defaults: p1 = 1
	                        Moves the cursor to the first column if the row p1 up from the current position.
	                        Attempting to move past the screen boundaries stops the cursor
	                        at the screen boundary.
                            SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (FAnsiParams.length < 1) { FAnsiParams.push("1"); }
                Y = Math.max(1, parseInt(FAnsiParams.shift(), 10));
                Y = Math.max(1, Crt.WhereY() - Y);
                Crt.GotoXY(1, Y);
                break;
            case "G": /* CSI [ p1 ] G
	                        Cursor Character Absolute
	                        Defaults: p1 = 1
	                        Movies the cursor to column p1 of the current row.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (FAnsiParams.length < 1) { FAnsiParams.push("1"); }
                X = Math.max(1, parseInt(FAnsiParams.shift(), 10));
                if ((X >= 1) && (X <= Crt.WindCols)) {
                    Crt.GotoXY(X, Crt.WhereY());
                }
                break;
            case "H":
            case "f": /* CSI [ p1 [ ; p2 ] ] H
                         CSI [ p1 [ ; p2 ] ] f
	                        Cusror Position
	                        Defaults: p1 = 1  p2 = 1
	                        Moves the cursor to the p2th column of the p1th line.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                while (FAnsiParams.length < 2) { FAnsiParams.push("1"); }
                Y = Math.max(1, parseInt(FAnsiParams.shift(), 10));
                X = Math.max(1, parseInt(FAnsiParams.shift(), 10));
                Crt.GotoXY(X, Y);
                break;
            case "h":
                if (FAnsiParams.length < 1) { FAnsiParams.push("0"); }
                switch (FAnsiParams[0]) {
                    case '=255': /* CSI = 255 h
	                                NON-STANDARD EXTENSION
	                                Enable DoorWay Mode
                                    SOURCE: BANSI.TXT */
                        trace("Unhandled ESC sequence: Enable DoorWay Mode");
                        break;
                    case '?6': /* CSI ? 6 h
	                                NON-STANDARD EXTENSION
                                    Enable origin mode.
                                    In this mode, position parameters are relative to the top left of the
                                    scrolling region, not the screen.
                                    SOURCE: Digital VT102 User Guide */
                        trace("Unhandled ESC sequence: Enable origin mode");
                        break;
                    case '?7': /* CSI ? 7 h
	                                NON-STANDARD EXTENSION
                                    Enable auto wrap.
                                    This is the normal mode in which a write to the last column of a
                                    row will move the cursor to the start of the next line triggering a
                                    scroll if required to create a new line.
                                    SOURCE: Digital VT102 User Guide */
                        trace("Unhandled ESC sequence: Enable auto wrap");
                        break;
                    case '?25': /* CSI ? 25 h
	                                NON-STANDARD EXTENSION
	                                Display the cursor
	                                SOURCE: "Installing and Using the VT320 Video Terminal" */
                        Crt.ShowCursor();
                        break;
                    case '?31': /* CSI ? 31 h
	                                NON-STANDARD EXTENSION
	                                Enable alt character set
	                                With this mode set, the bright (1) graphic rendition selects characters
	                                from an alternate character set. */
                        trace("Unhandled ESC sequence: Enable alt character set");
                        break;
                    case '?32': /* CSI ? 32 h
	                                NON-STANDARD EXTENSION
	                                Bright Intensity Enable
	                                Reverses CSI ? 32 l */
                        trace("Unhandled ESC sequence: Bright Intensity Enable");
                        break;
                    case '?33': /* CSI ? 33 h
	                                NON-STANDARD EXTENSION
	                                Blink to Bright Intensity Background
	                                With this mode set, the blink (5,6) graphic renditions cause the
	                                background colour to be high intensity rather than causing blink */
                        trace("Unhandled ESC sequence: Blink to Bright Intensity Background");
                        break;
                    default:
                        trace("Unknown ESC sequence: PB(" + FAnsiParams.toString() + ") IB(" + FAnsiIntermediates.toString() + ") FB(" + ACommand + ")");
                        break;
                }
                break;
            case "J": /* CSI [ p1 ] J
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
                if (FAnsiParams.length < 1) { FAnsiParams.push("0"); }
                switch (parseInt(FAnsiParams.shift(), 10)) {
                    case 0: Crt.ClrEos(); break;
                    case 1: Crt.ClrBos(); break;
                    case 2: Crt.ClrScr(); break;
                }
                break;
            case "K": /* CSI [ p1 ] K
	                        Erase in Line
	                        Defaults: p1 = 0
	                        Erases from the current line according to the value pf p1
	                        0 - Erase from the current position to the end of the line.
	                        1 - Erase from the current position to the start of the line.
	                        2 - Erase entire line.
	                        Erased characters are set to the current attribute.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (FAnsiParams.length < 1) { FAnsiParams.push("0"); }
                switch (parseInt(FAnsiParams.shift(), 10)) {
                    case 0: Crt.ClrEol(); break;
                    case 1: Crt.ClrBol(); break;
                    case 2: Crt.ClrLine(); break;
                }
                break;
            case "L": /* CSI [ p1 ] L
	                        Insert Line(s)
	                        Defaults: p1 = 1
	                        Inserts p1 lines at the current line position.  The current line and
	                        those after it are scrolled down and the new empty lines are filled with
	                        the current attribute.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (FAnsiParams.length < 1) { FAnsiParams.push("1"); }
                Y = Math.max(1, parseInt(FAnsiParams.shift(), 10));
                Crt.InsLine(Y);
                break;
            case "l":
                if (FAnsiParams.length < 1) { FAnsiParams.push("0"); }
                switch (FAnsiParams[0]) {
                    case '=255': /* CSI = 255 l
	                                NON-STANDARD EXTENSION
	                                Disable DoorWay Mode
                                    SOURCE: BANSI.TXT */
                        trace("Unhandled ESC sequence: Disable DoorWay Mode");
                        break;
                    case '?6': /* CSI ? 6 l
	                                NON-STANDARD EXTENSION
                                    Disable origin mode.
                                    In this mode, position parameters are relative to the top left of the
                                    screen, not the scrolling region.
                                    SOURCE: Digital VT102 User Guide */
                        trace("Unhandled ESC sequence: Disable origin mode");
                        break;
                    case '?7': /* CSI ? 7 l
	                                NON-STANDARD EXTENSION
                                    Disable auto wrap.
                                    This mode causes a write to the last column of a to leave the
                                    cursor where it was before the write occured, overwriting anything
                                    which was previously written to the same position.
                                    SOURCE: Digital VT102 User Guide */
                        trace("Unhandled ESC sequence: Disable auto wrap");
                        break;
                    case '?25': /* CSI ? 25 l
	                                NON-STANDARD EXTENSION
	                                Hide the cursor
	                                SOURCE: "Installing and Using the VT320 Video Terminal" */
                        Crt.HideCursor();
                        break;
                    case '?31': /* CSI ? 31 l
	                                NON-STANDARD EXTENSION
	                                Disable alt character set
	                                Reverses CSI ? 31 h */
                        trace("Unhandled ESC sequence: Disable alt character set");
                        break;
                    case '?32': /* CSI ? 32 l
	                                NON-STANDARD EXTENSION
	                                Bright Intensity Disable
	                                Reverses CSI ? 32 h */
                        trace("Unhandled ESC sequence: Bright Intensity Disable");
                        break;
                    case '?33': /* CSI ? 33 l
	                                NON-STANDARD EXTENSION
	                                Blink Normal
	                                Reverses CSI ? 33 h */
                        trace("Unhandled ESC sequence: Blink Normal");
                        break;
                    default:
                        trace("Unknown ESC sequence: PB(" + FAnsiParams.toString() + ") IB(" + FAnsiIntermediates.toString() + ") FB(" + ACommand + ")");
                        break;
                }
                break;
            case "M":
                if (FAnsiParams[0][0] === '=') {
                    /* CSI = [p1] M
	                    NON-STANDARD EXTENSION.
	                    Defaults:  p1 = 0
	                    Sets the current state of ANSI music parsing.
	                    0 - Only CSI | will introduce an ANSI music string.
	                    1 - Both CSI | and CSI N will introduce an ANSI music string.
	                    2 - CSI |, CSI N, and CSI M will all intriduce and ANSI music string.
	                        In this mode, Delete Line will not be available.

	                    SOURCE: CTerm only. */
                    if (FAnsiParams.length < 1) { FAnsiParams.push("0"); }
                    X = parseInt(FAnsiParams.shift(), 10);
                    switch (X) {
                        case 0: trace("Unhandled ESC sequence: Only CSI | will introduce an ANSI music string."); break;
                        case 1: trace("Unhandled ESC sequence: Both CSI | and CSI N will introduce an ANSI music string."); break;
                        case 2: trace("Unhandled ESC sequence: CSI |, CSI N, and CSI M will all intriduce and ANSI music string."); break;
                        default: trace("Unknown ESC sequence: PB(" + FAnsiParams.toString() + ") IB(" + FAnsiIntermediates.toString() + ") FB(" + ACommand + ")");
                    }
                } else {
                    /* CSI [ p1 ] M
	                    Delete Line(s) / "ANSI" Music
	                    Defaults: p1 = 1
	                    Deletes the current line and the p1 - 1 lines after it scrolling the
	                    first non-deleted line up to the current line and filling the newly
	                    empty lines at the end of the screen with the current attribute.
	                    If "ANSI" Music is fully enabled (CSI = 2 M), performs "ANSI" music
	                    instead.
	                    See "ANSI" MUSIC section for more details.

	                    SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf
	                    SOURCE: BANSI.TXT */
                    if (FAnsiParams.length < 1) { FAnsiParams.push("1"); }
                    Y = Math.max(1, parseInt(FAnsiParams.shift(), 10));
                    Crt.DelLine(Y);
                }
                break;
            case "m": /* CSI [ p1 [ ; pX ... ] ] m
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
                if (FAnsiParams.length < 1) { FAnsiParams.push("0"); }
                while (FAnsiParams.length > 0) {
                    X = parseInt(FAnsiParams.shift(), 10);
                    switch (X) {
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
                            FAnsiAttr = Crt.TextAttr;
                            Crt.Conceal();
                            break;
                        case 21: // NOT IN CTERM.TXT Underline: Double (not widely supported)
                            break;
                        case 22: //	Normal intensity
                            Crt.LowVideo();
                            break;
                        case 24: // NOT IN CTERM.TXT Underline: None
                            break;
                        case 25: // Steady (Not blinking)
                            Crt.SetBlink(false);
                            break;
                        case 27: // Positive Image - Reverses FG and BG  NOTE: This should be a separate attribute than 7 but this implementation makes them equal
                            Crt.ReverseVideo();
                            break;
                        case 28: // NOT IN CTERM.TXT Reveal (conceal off)
                            Crt.TextAttr = FAnsiAttr;
                            break;
                        case 30: // Set foreground color, normal intensity
                        case 31:
                        case 32:
                        case 33:
                        case 34:
                        case 35:
                        case 36:
                        case 37:
                            Colour = ANSI_COLORS[X - 30];
                            if (Crt.TextAttr % 16 > 7) { Colour += 8; }
                            Crt.TextColor(Colour);
                            break;
                        case 39: // Default foreground (same as white)
                            Colour = ANSI_COLORS[37 - 30];
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
                            Colour = ANSI_COLORS[X - 40];
                            Crt.TextBackground(Colour);
                            break;
                        case 49: // Default background (same as black)
                            Colour = ANSI_COLORS[40 - 40];
                            Crt.TextBackground(Colour);
                            break;
                    }
                }
                break;
            case "N": /* CSI N
	                        "ANSI" Music / Not implemented.
	                        If "ANSI" Music is set to BananaCom (CSI = 1 M) or fully enabled
	                        (CSI = 2 M) performs "ANSI" muisic.  See "ANSI" MUSIC section for more
	                        details.
	                        SOURCE: BANSI.TXT */
                trace("Unhandled ESC sequence: ANSI Music");
                break;
            case "n":  /* CSI [ p1 ] n
	                        Device Status Report
	                        Defaults: p1 = 0
	                        A request for a status report.  CTerm handles the following three
	                        requests:
	                        5	- Request a DSR
		                          CTerm will always reply with CSI 0 n indicating 
		                          "ready, no malfunction detected"
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
                if (FAnsiParams.length < 1) { FAnsiParams.push("0"); }
                X = parseInt(FAnsiParams.shift(), 10);
                switch (X) {
                    case 5: that.onesc5n(); break;
                    case 6: that.onesc6n(); break;
                    case 255: that.onesc255n(); break;
                    default: trace("Unknown ESC sequence: PB(" + FAnsiParams.toString() + ") IB(" + FAnsiIntermediates.toString() + ") FB(" + ACommand + ")");
                }
                break;
            case "P": /* CSI [ p1 ] P
	                        Delete Character
	                        Defaults: p1 = 1
	                        Deletes the character at the current position by shifting all characters
	                        from the current column + p1 left to the current column.  Opened blanks
	                        at the end of the line are filled with the current attribute.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (FAnsiParams.length < 1) { FAnsiParams.push("1"); }
                X = Math.max(1, parseInt(FAnsiParams.shift(), 10));
                Crt.DelChar(X);
                break;
            case "Q": /* CSI p1 ; p2 ; p3 Q
                            NON-STANDARD EXTENSION.
                            Change the current font.
                            p1 is the code page
                            p2 is the width
                            p2 is the height 
                            SOURCE: fTelnet / HtmlTerm
                            NOT IN CTERM.TXT */
                while (FAnsiParams.length < 3) { FAnsiParams.push("0"); }
                X = parseInt(FAnsiParams.shift(), 10);
                Y = parseInt(FAnsiParams.shift(), 10);
                Z = parseInt(FAnsiParams.shift(), 10);
                that.onescQ(new ESCQEvent(X, Y, Z));
                break;
            case "r":
                if (FAnsiIntermediates.length === 0) {
                    trace("Unknown ESC sequence: PB(" + FAnsiParams.toString() + ") IB(" + FAnsiIntermediates.toString() + ") FB(" + ACommand + ")");
                } else if (FAnsiIntermediates[0].indexOf('*') !== -1) {
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
                    trace("Unhandled ESC sequence: Set the output emulation speed.");
                } else if (FAnsiIntermediates[0].indexOf(']') !== -1) {
                    /* CSI [ p1 [ ; p2 ] ] r
	                    NON-STANDARD EXTENSION.
                        Set Top and Bottom Margins
                        Defaults: p1 = 1
                                  p2 = last line on screen
                        Selects top and bottom margins, defining the scrolling region. P1 is
                        the line number of the first line in the scrolling region. P2 is the line
                        number of the bottom line. */
                    trace("Unhandled ESC sequence: Set Top and Bottom Margins");
                } else {
                    trace("Unknown ESC sequence: PB(" + FAnsiParams.toString() + ") IB(" + FAnsiIntermediates.toString() + ") FB(" + ACommand + ")");
                }
                break;
            case "S": /* CSI [ p1 ] S
	                        Scroll Up
	                        Defaults: p1 = 1
	                        Scrolls all text on the screen up p1 lines.  New lines emptied at the
	                        bottom are filled with the current attribute.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (FAnsiParams.length < 1) { FAnsiParams.push("1"); }
                Y = Math.max(1, parseInt(FAnsiParams.shift(), 10));
                Crt.ScrollUpScreen(Y);
                break;
            case "s":
                if (FAnsiIntermediates.length === 0) {
                    /* CSI s
	                    NON-STANDARD EXTENSION
	                    Save Current Position
	                    Saves the current cursor position for later restoring with CSI u
	                    although this is non-standard, it's so widely used in the BBS world
	                    that any terminal program MUST implement it.
	                    SOURCE: ANSI.SYS */
                    FAnsiXY = new Point(Crt.WhereX(), Crt.WhereY());
                } else {
                    /* CSI ? [ p1 [ pX ... ] ] s
	                    NON-STANDARD EXTENSION
                        Save Mode Setting
                        Saves the current mode states as specified by CSI l and CSI h.  If
                        p1 is omitted, saves all such states.  If pX is included, saves only
                        the specified states (arguments to CSI l/h).
                        SOURCE: SyncTERM only */
                    trace("Unhandled ESC sequence: Save Mode Setting");
                }
                break;
            case "T": /* CSI [ p1 ] T
	                        Scroll Down
	                        Defaults: p1 = 1
	                        Scrolls all text on the screen down p1 lines.  New lines emptied at the
	                        top are filled with the current attribute.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (FAnsiParams.length < 1) { FAnsiParams.push("1"); }
                Y = Math.max(1, parseInt(FAnsiParams.shift(), 10));
                Crt.ScrollDownWindow(Y);
                break;
            case "U": /* CSI U
	                        NON-STANDARD (Disabled in current code)
	                        Clear screen with default attribute.
	                        This code is *supposed* to go to the "next page" according to the
	                        ANSI/ECMA specs with CSI V going to "previous page"
	                        SOURCE: BANSI.TXT */
                trace("Unhandled ESC sequence: Clear screen with default attribute");
                break;
            case "u":
                if (FAnsiIntermediates.length === 0) {
                    /* CSI u
	                    NON-STANDARD EXTENSION
	                    Restore Cursor Position
	                    Move the cursor to the last position saved by CSI s.  If no position has
	                    been saved, the cursor is not moved.
	                    SOURCE: ANSI.SYS */
                    Crt.GotoXY(FAnsiXY.x, FAnsiXY.y);
                } else {
                    /* CSI ? [ p1 [ pX ... ] ]  u
	                    NON-STANDARD EXTENSION
                        Restore Mode Setting
                        Saves the current mode states as specified by CSI l and CSI h.  If
                        p1 is omitted, saves all such states.  If pX is included, restores
                        all the specified states (arguments to CSI l/h)
                        SOURCE: SyncTERM only */
                    trace("Unhandled ESC sequence: Restore Mode Setting");
                }
                break;
            case "X": /* CSI [ p1 ] X
	                        Erase Character
	                        Defaults: p1 = 1
	                        Erase p1 characters starting at the current character.  Will not erase past the end
	                        of line.
	                        Erased characters are set to the current attribute.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                if (FAnsiParams.length < 1) { FAnsiParams.push("1"); }
                X = Math.max(1, parseInt(FAnsiParams.shift(), 10));
                Crt.DelChar(X);
                break;
            case "Z": /* CSI [ p1 ] Z
	                        Cursor Backward Tabulation
	                        Defaults: p1 = 1
	                        Move the cursor to the p1th preceeding tab stop.  Will not go past the
	                        start of the line.
	                        SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                trace("Unhandled ESC sequnce: Cursor Backward Tabulation");
                break;
            default:
                trace("Unknown ESC sequence: PB(" + FAnsiParams.toString() + ") IB(" + FAnsiIntermediates.toString() + ") FB(" + ACommand + ")");
                break;
        }
    };

    this.ClrBol = function () {
        return "\x1B[1K";
    };

    this.ClrBos = function () {
        return "\x1B[1J";
    };

    this.ClrEol = function () {
        return "\x1B[K";
    };

    this.ClrEos = function () {
        return "\x1B[J";
    };

    this.ClrLine = function () {
        return "\x1B[2K";
    };

    this.ClrScr = function () {
        return "\x1B[2J";
    };

    this.CursorDown = function (ACount) {
        if (ACount === 1) {
            return "\x1B[B";
        } else {
            return "\x1B[" + ACount.toString() + "B";
        }
    };

    this.CursorLeft = function (ACount) {
        if (ACount === 1) {
            return "\x1B[D";
        } else {
            return "\x1B[" + ACount.toString() + "D";
        }
    };

    this.CursorPosition = function (ARows, ACols) {
        if (ARows === undefined) { ARows = Crt.WhereYA(); }
        if (ACols === undefined) { ACols = Crt.WhereXA(); }

        return "\x1B[" + ARows + ";" + ACols + "R";
    };

    this.CursorRestore = function () {
        return "\x1B[u";
    };

    this.CursorRight = function (ACount) {
        if (ACount === 1) {
            return "\x1B[C";
        } else {
            return "\x1B[" + ACount.toString() + "C";
        }
    };

    this.CursorSave = function () {
        return "\x1B[s";
    };

    this.CursorUp = function (ACount) {
        if (ACount === 1) {
            return "\x1B[A";
        } else {
            return "\x1B[" + ACount.toString() + "A";
        }
    };

    this.GotoX = function (AX) {
        if (AX === 1) {
            return that.CursorLeft(255);
        }
        else {
            return that.CursorLeft(255) + that.CursorRight(AX - 1);
        }
    };

    this.GotoXY = function (AX, AY) {
        return "\x1B[" + AY.toString() + ";" + AX.toString() + "H";
    };

    this.GotoY = function (AY) {
        if (AY === 1) {
            return that.CursorUp(255);
        }
        else {
            return that.CursorUp(255) + that.CursorDown(AY - 1);
        }
    };

    this.TextAttr = function (AAttr) {
        return that.TextColor(AAttr % 16) + that.TextBackground(Math.floor(AAttr / 16));
    };

    this.TextBackground = function (AColour) {
        while (AColour >= 8) { AColour -= 8; }
        return "\x1B[" + (40 + ANSI_COLORS[AColour]).toString() + "m";
    };

    this.TextColor = function (AColour) {
        switch (AColour % 16) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7: return "\x1B[0;" + (30 + ANSI_COLORS[AColour % 16]).toString() + "m" + that.TextBackground(Crt.TextAttr / 16);
            case 8:
            case 9:
            case 10:
            case 11:
            case 12:
            case 13:
            case 14:
            case 15: return "\x1B[1;" + (30 + ANSI_COLORS[(AColour % 16) - 8]).toString() + "m";
        }

        return "";
    };

    this.Write = function (AText) {
        // Check for Atari/C64 mode, which doesn't use ANSI
        if (Crt.Atari || Crt.C64) {
            Crt.Write(AText);
        } else {
            var Buffer = "";

            var i;
            for (i = 0; i < AText.length; i++) {
                if (AText.charAt(i) === "\x1B") {
                    FAnsiParserState = AnsiParserState.Escape;
                }
                else if (FAnsiParserState === AnsiParserState.Escape) {
                    if (AText.charAt(i) === '[') {
                        FAnsiParserState = AnsiParserState.Bracket;
                        FAnsiBuffer = "";

                        while (FAnsiParams.length > 0) { FAnsiParams.pop(); }
                        while (FAnsiIntermediates.length > 0) { FAnsiIntermediates.pop(); }
                    } else {
                        Buffer += AText.charAt(i);
                        FAnsiParserState = AnsiParserState.None;
                    }
                }
                else if (FAnsiParserState === AnsiParserState.Bracket) {
                    if ((AText.charAt(i) >= '0') && (AText.charAt(i) <= '?')) {
                        // It's a parameter byte
                        FAnsiBuffer += AText.charAt(i);
                        FAnsiParserState = AnsiParserState.ParameterByte;
                    } else if ((AText.charAt(i) >= ' ') && (AText.charAt(i) <= '/')) {
                        // It's an intermediate byte
                        FAnsiBuffer += AText.charAt(i);
                        FAnsiParserState = AnsiParserState.IntermediateByte;
                    } else if ((AText.charAt(i) >= '@') && (AText.charAt(i) <= '~')) {
                        // Final byte, output whatever we have buffered
                        Crt.Write(Buffer);
                        Buffer = "";

                        // Handle the command
                        AnsiCommand(AText.charAt(i));

                        // Reset the parser state
                        FAnsiParserState = AnsiParserState.None;
                    } else {
                        // Invalid sequence
                        Buffer += AText.charAt(i);
                        FAnsiParserState = AnsiParserState.None;
                    }
                } else if (FAnsiParserState === AnsiParserState.ParameterByte) {
                    if ((AText.charAt(i)) === ';') {
                        // Start of new parameter
                        FAnsiParams.push((FAnsiBuffer === '') ? '0' : FAnsiBuffer);
                        FAnsiBuffer = "";
                    } else if ((AText.charAt(i) >= '0') && (AText.charAt(i) <= '?')) {
                        // Additional parameter byte
                        FAnsiBuffer += AText.charAt(i);
                    } else if ((AText.charAt(i) >= ' ') && (AText.charAt(i) <= '/')) {
                        // Intermediate byte, push buffer to new parameter
                        FAnsiParams.push((FAnsiBuffer === '') ? '0' : FAnsiBuffer);
                        FAnsiBuffer = "";

                        FAnsiIntermediates.push(AText.charAt(i));
                        FAnsiParserState = AnsiParserState.IntermediateByte;
                    } else if ((AText.charAt(i) >= '@') && (AText.charAt(i) <= '~')) {
                        // Final byte, push buffer to new parameter
                        FAnsiParams.push((FAnsiBuffer === '') ? '0' : FAnsiBuffer);
                        FAnsiBuffer = "";

                        // Output whatever we have buffered
                        Crt.Write(Buffer);
                        Buffer = "";

                        // Handle the command
                        AnsiCommand(AText.charAt(i));

                        // Reset the parser state
                        FAnsiParserState = AnsiParserState.None;
                    } else {
                        // Invalid command
                        Buffer += AText.charAt(i);
                        FAnsiParserState = AnsiParserState.None;
                    }
                } else if (FAnsiParserState === AnsiParserState.IntermediateByte) {
                    if ((AText.charAt(i) >= '0') && (AText.charAt(i) <= '?')) {
                        // Parameter byte, which is illegal at this point
                        Buffer += AText.charAt(i);
                        FAnsiParserState = AnsiParserState.None;
                    } else if ((AText.charAt(i) >= ' ') && (AText.charAt(i) <= '/')) {
                        // Additional intermediate byte
                        FAnsiIntermediates.push(AText.charAt(i));
                    } else if ((AText.charAt(i) >= '@') && (AText.charAt(i) <= '~')) {
                        // Final byte byte, output whatever we have buffered
                        Crt.Write(Buffer);
                        Buffer = "";

                        // Handle the command
                        AnsiCommand(AText.charAt(i));

                        // Reset the parser state
                        FAnsiParserState = AnsiParserState.None;
                    } else {
                        // Invalid command
                        Buffer += AText.charAt(i);
                        FAnsiParserState = AnsiParserState.None;
                    }
                } else {
                    Buffer += AText.charAt(i);
                }
            }

            Crt.Write(Buffer);
        }
    };

    this.WriteLn = function (AText) {
        that.Write(AText + "\r\n");
    };

    // Constructor
    FAnsiAttr = 7;
    FAnsiBuffer = "";
    FAnsiIntermediates = [];
    FAnsiParams = [];
    FAnsiParserState = AnsiParserState.None;
    FAnsiXY = new Point(1, 1);
};
Ansi = new TAnsi();
