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
/// <reference path='ButtonStyle.ts' />
/// <reference path='MouseButton.ts' />
/// <reference path='RIPParserState.ts' />
/// <reference path='../BitmapFont.ts' />
/// <reference path='../FillStyle.ts' />
/// <reference path='../Graph.ts' />
/// <reference path='../LineStyle.ts' />
/// <reference path='../StrokeFont.ts' />
/// <reference path='../TextJustification.ts' />
/// <reference path='../../actionscript/Point.ts' />
/// <reference path='../../actionscript/Rectangle.ts' />
/// <reference path='../../ansi/Ansi.ts' />
/// <reference path='../../crt/Crt.ts' />
class RIP {
    /* Private variables */
    private static _Benchmark: Benchmark = new Benchmark();
    private static _Buffer: string = '';
    private static _ButtonInverted: boolean = false;
    private static _ButtonPressed: number = -1;
    private static _ButtonStyle: ButtonStyle = new ButtonStyle();
    private static _Clipboard: ImageData = null;
    private static _Command: string = '';
    private static _DoTextCommand: boolean = false;
    private static _InputBuffer: number[] = [];
    private static _IconsLoading: number = 0;
    private static _KeyBuf: any[] = [];
    private static _LastWasEscape: boolean = false;
    private static _Level: number = 0;
    private static _LineStartedWithRIP: boolean = false;
    private static _LineStarting: boolean = true;
    private static _MouseFields: any[] = [];
    private static _RIPParserState: number = RIPParserState.None;
    private static _SubLevel: number = 0;

    // TODO OnEnterFrame is where action happens, and MouseDown is for buttons
    //// Add the enter frame event listener, where the real parsing happens
    //Graph.Canvas.addEventListener(Event.ENTER_FRAME, OnEnterFrame);
    //Graph.Canvas.addEventListener(MouseEvent.MOUSE_DOWN, OnMouseDown);

    // Define a rectangular text region
    // Status: Not Implemented
    public static BeginText(x1: number, y1: number, x2: number, y2: number): void {
        console.log('BeginText() is not handled');
    }

    // Define a Mouse Button
    // Status: Partially Implemented
    public static Button(x1: number, y1: number, x2: number, y2: number, hotkey: number, flags: number, text: string): void {
        // Fix bad co-ordinates
        if ((x2 > 0) && (x1 > x2)) {
            var TempX: number = x1;
            x1 = x2;
            x2 = TempX;
        }
        if ((y2 > 0) && (y1 > y2)) {
            var TempY: number = y1;
            y1 = y2;
            y2 = TempY;
        }

        var OldColour: number = Graph.GetColour();
        var OldFillSettings: FillSettings = Graph.GetFillSettings();
        var TempFillSettings: FillSettings = Graph.GetFillSettings();

        // Split the text portion (which is 3 items separated by <>)
        var iconfile: string = '';
        var label: string = '';
        var hostcommand: string = '';
        var textarray: string[] = text.split('<>');
        if (textarray.length >= 3) hostcommand = this.HandleCtrlKeys(textarray[2]);
        if (textarray.length >= 2) label = textarray[1];
        if (textarray.length >= 1) iconfile = textarray[0];

        if ((this._ButtonStyle.flags & 128) === 128) {
            console.log('Button() doesn\'t support the icon type');
            return;
        } else if ((this._ButtonStyle.flags & 1) === 1) {
            console.log('Button() doesn\'t support the clipboard type');
            return;
        }

        // Get width and height of button
        var Size: Rectangle;
        var InvertCoords: Rectangle;
        if ((this._ButtonStyle.width === 0) || (this._ButtonStyle.height === 0)) {
            Size = new Rectangle(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
            InvertCoords = new Rectangle(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
        } else {
            Size = new Rectangle(x1, y1, this._ButtonStyle.width, this._ButtonStyle.height);
            InvertCoords = new Rectangle(x1, y1, this._ButtonStyle.width, this._ButtonStyle.height);
            x2 = Size.right;
            y2 = Size.bottom;
        }

        // Draw button face
        TempFillSettings.Style = FillStyle.Solid;
        TempFillSettings.Colour = this._ButtonStyle.surface;
        Graph.SetFillSettings(TempFillSettings);
        Graph.Bar(x1, y1, x2, y2);
        Graph.SetFillSettings(OldFillSettings);

        // Add bevel, if necessary
        //var BevelSize: number = 0;
        if ((this._ButtonStyle.flags & 512) === 512) {
            Graph.SetLineStyle(LineStyle.Solid, 0, 1);// TODO Must restore at end
            Graph.SetFillStyle(FillStyle.Solid, this._ButtonStyle.bright);// TODO Must restore at end
            Graph.SetColour(this._ButtonStyle.bright);

            var Trapezoid: Point[] = [];
            Trapezoid.push(new Point(x1 - this._ButtonStyle.bevelsize, y1 - this._ButtonStyle.bevelsize));
            Trapezoid.push(new Point(x1 - 1, y1 - 1));
            Trapezoid.push(new Point(x2 + 1, y1 - 1));
            Trapezoid.push(new Point(x2 + this._ButtonStyle.bevelsize, y1 - this._ButtonStyle.bevelsize));
            Graph.FillPoly(Trapezoid);
            Trapezoid[3] = new Point(x1 - this._ButtonStyle.bevelsize, y2 + this._ButtonStyle.bevelsize);
            Trapezoid[2] = new Point(x1 - 1, y2 + 1);
            Graph.FillPoly(Trapezoid);
            Graph.SetFillStyle(FillStyle.Solid, this._ButtonStyle.dark);
            Graph.SetColour(this._ButtonStyle.dark);
            Trapezoid[0] = new Point(x2 + this._ButtonStyle.bevelsize, y2 + this._ButtonStyle.bevelsize);
            Trapezoid[1] = new Point(x2 + 1, y2 + 1);
            Graph.FillPoly(Trapezoid);
            Trapezoid[3] = new Point(x2 + this._ButtonStyle.bevelsize, y1 - this._ButtonStyle.bevelsize);
            Trapezoid[2] = new Point(x2 + 1, y1 - 1);
            Graph.FillPoly(Trapezoid);
            Graph.SetColour(this._ButtonStyle.cornercolour);
            Graph.Line(x1 - this._ButtonStyle.bevelsize, y1 - this._ButtonStyle.bevelsize, x1 - 1, y1 - 1);
            Graph.Line(x1 - this._ButtonStyle.bevelsize, y2 + this._ButtonStyle.bevelsize, x1 - 1, y2 + 1);
            Graph.Line(x2 + 1, y1 - 1, x2 + this._ButtonStyle.bevelsize, y1 - this._ButtonStyle.bevelsize);
            Graph.Line(x2 + 1, y2 + 1, x2 + this._ButtonStyle.bevelsize, y2 + this._ButtonStyle.bevelsize);

            Size.left -= this._ButtonStyle.bevelsize;
            Size.top -= this._ButtonStyle.bevelsize;
            Size.width += this._ButtonStyle.bevelsize;
            Size.height += this._ButtonStyle.bevelsize;
            InvertCoords.left -= this._ButtonStyle.bevelsize;
            InvertCoords.top -= this._ButtonStyle.bevelsize;
            InvertCoords.width += this._ButtonStyle.bevelsize;
            InvertCoords.height += this._ButtonStyle.bevelsize;
        }

        // Add chisel, if necessary
        if ((this._ButtonStyle.flags & 8) === 8) {
            var xchisel: number;
            var ychisel: number;

            var Height: number = y2 - y1;
            if ((Height >= 0) && (Height <= 11)) {
                xchisel = 1;
                ychisel = 1;
            } else if ((Height >= 12) && (Height <= 24)) {
                xchisel = 3;
                ychisel = 2;
            } else if ((Height >= 25) && (Height <= 39)) {
                xchisel = 4;
                ychisel = 3;
            } else if ((Height >= 40) && (Height <= 74)) {
                xchisel = 6;
                ychisel = 5;
            } else if ((Height >= 75) && (Height <= 149)) {
                xchisel = 7;
                ychisel = 5;
            } else if ((Height >= 150) && (Height <= 199)) {
                xchisel = 8;
                ychisel = 6;
            } else if ((Height >= 200) && (Height <= 249)) {
                xchisel = 10;
                ychisel = 7;
            } else if ((Height >= 250) && (Height <= 299)) {
                xchisel = 11;
                ychisel = 8;
            } else {
                xchisel = 13;
                ychisel = 9;
            }

            Graph.SetColour(this._ButtonStyle.bright);
            Graph.Rectangle(x1 + xchisel + 1, y1 + ychisel + 1, x2 - xchisel, y2 - ychisel);

            Graph.SetColour(this._ButtonStyle.dark);
            Graph.Rectangle(x1 + xchisel, y1 + ychisel, x2 - (xchisel + 1), y2 - (ychisel + 1));
            Graph.PutPixel(x1 + xchisel, y2 - ychisel, this._ButtonStyle.dark);
            Graph.PutPixel(x2 - xchisel, y1 + ychisel, this._ButtonStyle.dark);
        }
        Graph.SetColour(OldColour);

        // Add recessed, if necessary
        if ((this._ButtonStyle.flags & 16) === 16) {
            Graph.SetColour(0);
            Graph.Rectangle(x1 - this._ButtonStyle.bevelsize - 1, y1 - this._ButtonStyle.bevelsize - 1, x2 + this._ButtonStyle.bevelsize + 1, y2 + this._ButtonStyle.bevelsize + 1);

            Graph.SetColour(this._ButtonStyle.dark);
            Graph.Line(x1 - this._ButtonStyle.bevelsize - 2, y1 - this._ButtonStyle.bevelsize - 2, x2 + this._ButtonStyle.bevelsize + 2, y1 - this._ButtonStyle.bevelsize - 2);
            Graph.Line(x1 - this._ButtonStyle.bevelsize - 2, y1 - this._ButtonStyle.bevelsize - 2, x1 - this._ButtonStyle.bevelsize - 2, y2 + this._ButtonStyle.bevelsize + 2);

            Graph.SetColour(this._ButtonStyle.bright);
            Graph.Line(x2 + this._ButtonStyle.bevelsize + 2, y1 - this._ButtonStyle.bevelsize - 2, x2 + this._ButtonStyle.bevelsize + 2, y2 + this._ButtonStyle.bevelsize + 2);
            Graph.Line(x1 - this._ButtonStyle.bevelsize - 2, y2 + this._ButtonStyle.bevelsize + 2, x2 + this._ButtonStyle.bevelsize + 2, y2 + this._ButtonStyle.bevelsize + 2);

            Graph.SetColour(OldColour);

            Size.left -= 2;
            Size.top -= 2;
            Size.width += 2;
            Size.height += 2;
        }

        // Add sunken, if necessary
        if ((this._ButtonStyle.flags & 32768) === 32768) {
            Graph.SetColour(this._ButtonStyle.dark);
            Graph.Line(x1, y1, x2, y1);
            Graph.Line(x1, y1, x1, y2);

            Graph.SetColour(this._ButtonStyle.bright);
            Graph.Line(x1, y2, x2, y2);
            Graph.Line(x2, y1, x2, y2);

            Graph.SetColour(OldColour);
        }

        // Draw label
        if (label !== '') {
            var labelx: number;
            var labely: number;
            switch (this._ButtonStyle.orientation) {
                case 0: // above
                    labelx = Size.left + Math.floor(Size.width / 2) - Math.floor(Graph.TextWidth(label) / 2);
                    labely = Size.top - Graph.TextHeight(label);
                    break;
                case 1: // left
                    labelx = Size.left - Graph.TextWidth(label);
                    labely = Size.top + Math.floor(Size.height / 2) - Math.floor(Graph.TextHeight(label) / 2);
                    break;
                case 2: // middle
                    labelx = Size.left + Math.floor(Size.width / 2) - Math.floor(Graph.TextWidth(label) / 2);
                    labely = Size.top + Math.floor(Size.height / 2) - Math.floor(Graph.TextHeight(label) / 2);
                    break;
                case 3: // right
                    labelx = Size.right;
                    labely = Size.top + Math.floor(Size.height / 2) - Math.floor(Graph.TextHeight(label) / 2);
                    break;
                case 4: // below
                    labelx = Size.left + Math.floor(Size.width / 2) - Math.floor(Graph.TextWidth(label) / 2);
                    labely = Size.bottom;
                    break;
            }
            if ((this._ButtonStyle.flags & 32) === 32) {
                Graph.SetColour(this._ButtonStyle.dback);
                Graph.OutTextXY(labelx + 1, labely + 1, label);
            }
            Graph.SetColour(this._ButtonStyle.dfore);
            Graph.OutTextXY(labelx, labely, label);
            Graph.SetColour(OldColour);
        }

        // Store mouse button, if necessary
        if ((this._ButtonStyle.flags & 1024) === 1024) {
            //TODO this._MouseFields.push(new MouseButton(InvertCoords, hostcommand, this._ButtonStyle.flags, String.fromCharCode(hotkey)));
        }
    }

    // Copy screen region up/down
    // Status: Not Implemented
    public static CopyRegion(x1: number, y1: number, x2: number, y2: number, desty: number): void {
        console.log('CopyRegion() is not handled');
    }

    // Define a text variable
    // Status: Not Implemented
    public static Define(flags: number, text: string): void {
        console.log('Define() is not handled');
    }

    // End a rectangular text region
    // Status: Not Implemented
    public static EndText(): void {
        console.log('EndText() is not handled');
    }

    // Enter block transfer mode with host
    // Status: Not Implemented
    public static EnterBlockMode(mode: number, protocol: number, filetype: number, filename: string): void {
        console.log('EnterBlockMode() is not handled');
    }

    // Query existing information on a particular file
    // Status: Not Implemented
    public static FileQuery(mode: number, filename: string): void {
        console.log('FileQuery() is not handled');
    }

    // TODO Also make this handle the @@ text variables (and rename function)
    private static HandleCtrlKeys(AHostCommand: string): string {
        var Result: string = AHostCommand;
        for (var i: number = 1; i <= 26; i++) {
            // For example, replaces ^a or ^A with ASCII 1, ^z or ^Z with ASCII 26
            Result = Result.replace('^' + String.fromCharCode(64 + i), String.fromCharCode(i));
            Result = Result.replace('^' + String.fromCharCode(96 + i), String.fromCharCode(i));
        }
        Result = Result.replace('^@', String.fromCharCode(0));
        Result = Result.replace('^[', String.fromCharCode(27));
        return Result;
    }

    private static HandleMouseButton(AButton: MouseButton): void {
        // Check if we should reset the window
        if (AButton.DoResetScreen()) {
            this.ResetWindows();
        }

        // Check for a host command
        if (AButton.HostCommand !== '') {
            if ((AButton.HostCommand.length > 2) && (AButton.HostCommand.substr(0, 2) === '((') && (AButton.HostCommand.substr(AButton.HostCommand.length - 2, 2) === '))')) {
                // TODO PopUp.show(AButton.HostCommand, OnPopUpClick); 
            } else {
                for (var i: number = 0; i < AButton.HostCommand.length; i++) {
                    // TODO this._KeyBuf.push(new KeyPressEvent(KEY_PRESSED, new KeyboardEvent(KeyboardEvent.KEY_DOWN), AButton.HostCommand.charAt(i)));
                }
            }
        }
    }

    private static IsCommandCharacter(Ch: string, Level: number): boolean {
        var CommandChars: string = '';
        switch (Level) {
            case 0:
                CommandChars = '@#*=>AaBCcEeFgHIiLlmOoPpQRSsTVvWwXYZ';
                break;
            case 1:
                CommandChars = 'BCDEFGIKMPRTtUW' + '\x1B';
                break;
            case 9:
                CommandChars = '\x1B';
                break;
        }
        return (CommandChars.indexOf(Ch) !== -1);
    }

    public static KeyPressed(): boolean {
        // TODO
        //while (Crt.KeyPressed()) {
        //	var KPE: KeyPressEvent = Crt.ReadKey();
        //	var Handled: boolean = false;

        //	for (var i: number = 0; i < this._MouseFields.length; i++) {
        //		var MB: MouseButton = this._MouseFields[i];
        //		if ((MB.HotKey !== '') && (MB.HotKey.toUpperCase() === KPE.keyString.toUpperCase())) {
        //			HandleMouseButton(MB);
        //			Handled = true;
        //			break;
        //		}
        //	}

        //	if (!Handled) this._KeyBuf.push(KPE);	
        //}
        return (this._KeyBuf.length > 0);
    }

    // Destroys all previously defined hot mouse regions
    // Status: Fully Implemented 
    public static KillMouseFields(): void {
        this._MouseFields = [];
    }

    // Loads and displays a disk-based icon to screen
    // Status: Partially Implemented
    private static LoadIcon(x: number, y: number, mode: number, clipboard: number, filename: string): void {
        return; // TODO No icons to load for this test
        if (mode !== 0) {
            console.log('LoadIcon() only supports COPY mode');
            mode = 0;
        }

        // Ensure the filename ends with .ICN
        filename = filename.toUpperCase();
        if (filename.indexOf('.') === -1) filename += '.ICN';

        // Load from remote server since it's not in the cache
        // TODO
        //var Icon: RMURLLoader = new RMURLLoader();
        //Icon.addEventListener(Event.COMPLETE, OnIconLoadComplete);
        //Icon.addEventListener(IOErrorEvent.IO_ERROR, OnIconLoadIOError);
        //Icon.dataFormat = URLLoaderDataFormat.BINARY;
        //Icon.parameters['x'] = x;
        //Icon.parameters['y'] = y;
        //Icon.parameters['mode'] = mode;
        //Icon.parameters['clipboard'] = clipboard;
        //Icon.parameters['filename'] = filename;

        //try {
        //	this._IconsLoading++;
        //	Icon.load(new URLRequest(FIconPath + filename));
        //} catch (e: Error) {
        //	// Ignore, not much we can do here
        //	this._IconsLoading--;
        //}
    }

    private static OnIconLoadComplete(e: Event): void {
        // TODO
        //try {
        //	var loader: RMURLLoader = RMURLLoader(e.target);

        //	var left: number = loader.parameters['x'];
        //	var top: number = loader.parameters['y'];

        //	// Get the byte array
        //	var BA: ByteArray = loader.data;
        //	BA.endian = Endian.LITTLE_ENDIAN;

        //	// Store the image in a sharedobject for later use
        //	var SO: SharedObject
        //	try {
        //		SO = SharedObject.getLocal(loader.parameters['filename'], 'fTelnet');
        //		var SOBA: ByteArray = new ByteArray();
        //		SOBA.writeBytes(BA);
        //		SO.data['bytes'] = SOBA;
        //		SO.flush();
        //		SO.close();
        //	} catch (e: Error) {
        //		// Ignore
        //	}				

        //	// Get the image width and height
        //	BA.position = 0;
        //	var width: number = BA.readUnsignedShort();
        //	var height: number = BA.readUnsignedShort();

        //	// Get the raw bytes
        //	var InV: Vector.<uint> = new Vector.<uint>();
        //	while (BA.bytesAvailable > 0) {
        //		InV.push(BA.readUnsignedByte());
        //	}

        //	// Get the output vector
        //	var BD: BitmapData = new BitmapData(width, height);
        //	var OutV: Vector.<uint> = BD.getVector(new Rectangle(0, 0, width, height));
        //	var Offset: number = 0;

        //	var Colour: number;
        //	var bytes_per_plane: number = Math.floor((width - 1) / 8) + 1;
        //	var plane_offset0: number = (bytes_per_plane * 0);
        //	var plane_offset1: number = (bytes_per_plane * 1);
        //	var plane_offset2: number = (bytes_per_plane * 2);
        //	var plane_offset3: number = (bytes_per_plane * 3);
        //	var row_offset: number;
        //	var byte_offset: number;
        //	var right_shift: number;
        //	for (var y: number = 0; y < height; ++y) {
        //		row_offset = ((bytes_per_plane * 4) * y); // 4 = number of planes

        //		for (var x: number = 0; x < width; ++x) {
        //			byte_offset = Math.floor(x / 8);
        //			right_shift = 7 - (x & 7);

        //			// here we roll in each bit from each plane, culminating
        //			// in a 4-bit number that represents our color number in
        //			// the 16-color palette
        //			Colour = (InV[row_offset + plane_offset0 + byte_offset] >> right_shift) & 0x01; 
        //			Colour <<= 1;
        //			Colour |= (InV[row_offset + plane_offset1 + byte_offset] >> right_shift) & 0x01;
        //			Colour <<= 1;
        //			Colour |= (InV[row_offset + plane_offset2 + byte_offset] >> right_shift) & 0x01;
        //			Colour <<= 1;
        //			Colour |= (InV[row_offset + plane_offset3 + byte_offset] >> right_shift) & 0x01;
        //			OutV[Offset++] = Graph.CURRENT_PALETTE[Colour];
        //		}
        //	}
        //	BD.setVector(new Rectangle(0, 0, width, height), OutV);
        //	Graph.PutImage(left, top, BD, WriteMode.Copy);

        //	if (loader.parameters['clipboard'] === 1) {
        //		FClipboard = BD;
        //	}
        //} catch (e: Error) {
        //	console.log('Error loading icon: ' + e);
        //}

        //this._IconsLoading--;
    }

    private static OnIconLoadIOError(ioe: ErrorEvent): void {
        console.log('Error loading icon: ' + ioe);
        this._IconsLoading--;
    }

    public static Parse(AData: string): void {
        var ADatalength: number = AData.length;
        for (var i: number = 0; i < ADatalength; i++) {
            this._InputBuffer.push(AData.charCodeAt(i));
        }
        this.OnEnterFrame(null); // TODO hackish way to get the processing done
    }

    private static OnEnterFrame(e: Event): void
    {
        while (this._InputBuffer.length > 0) {
            // Don't process anything if we're waiting on an icon to load from the HTTP server
            // Need to do this in case we load an icon in clipboard mode, since the call to 
            // PutImage() will not work right since we don't have the data in the clipboard yet
            if (this._IconsLoading > 0) return;

            // Don't process anything if we're waiting for the stroke font to load from the HTTP server
            // Need to do this in case we want to write in stroke font mode, since the fonts are loaded remotely
            //TODO if (!BitmapFont.Loaded) return;
            //TODO if (!StrokeFont.Loaded) return;

            var Code: number = this._InputBuffer.shift();
            var Ch: string = String.fromCharCode(Code);

            switch (this._RIPParserState) {
                case RIPParserState.None:
                    if ((Ch === '!') && (this._LineStarting)) {
                        this._Buffer = '';
                        this._DoTextCommand = false;
                        this._LineStartedWithRIP = true;
                        this._LineStarting = false;
                        this._RIPParserState = RIPParserState.GotExclamation;
                    } else if ((Ch === '|') && (this._LineStartedWithRIP)) {
                        this._Buffer = '';
                        this._DoTextCommand = false;
                        this._RIPParserState = RIPParserState.GotPipe;
                    } else {
                        this._LineStarting = (Code === 10);
                        if (this._LineStarting) this._LineStartedWithRIP = false;
                        Ansi.Write(Ch);
                    }
                    break;
                case RIPParserState.GotExclamation:
                    if (Ch === '|') {
                        this._RIPParserState = RIPParserState.GotPipe;
                    } else {
                        Ansi.Write('!' + Ch);
                        this._RIPParserState = RIPParserState.None;
                    }
                    break;
                case RIPParserState.GotPipe:
                    this._Buffer = '';
                    this._DoTextCommand = false;

                    if ((Ch >= '0') && (Ch <= '9')) {
                        this._Level = parseInt(Ch, 10);
                        this._RIPParserState = RIPParserState.GotLevel;
                    } else if (this.IsCommandCharacter(Ch, 0)) {
                        this._Command = Ch;
                        this._Level = 0;
                        this._SubLevel = 0;
                        this._RIPParserState = RIPParserState.GotCommand;
                    } else {
                        Ansi.Write('|' + Ch);
                        this._RIPParserState = RIPParserState.None;
                    }
                    break;
                case RIPParserState.GotLevel:
                    if ((Ch >= '0') && (Ch <= '9')) {
                        this._SubLevel = parseInt(Ch, 10);
                        this._RIPParserState = RIPParserState.GotSubLevel;
                    } else if (this.IsCommandCharacter(Ch, this._Level)) {
                        this._Command = Ch;
                        this._SubLevel = 0;
                        this._RIPParserState = RIPParserState.GotCommand;
                    } else {
                        Ansi.Write('|' + this._Level.toString() + Ch);
                        this._RIPParserState = RIPParserState.None;
                    }
                    break;
                case RIPParserState.GotSubLevel:
                    // TODO Could be up to 8 sublevels altogether, so gotta handle that here
                    if (this.IsCommandCharacter(Ch, this._Level)) {
                        this._Command = Ch;
                        this._RIPParserState = RIPParserState.GotCommand;
                    } else {
                        Ansi.Write('|' + this._Level.toString() + this._SubLevel.toString() + Ch);
                        this._RIPParserState = RIPParserState.None;
                    }
                    break;
                case RIPParserState.GotCommand:
                    if (Ch === '\\') {
                        if (this._LastWasEscape) {
                            this._LastWasEscape = false;
                            this._Buffer += '\\';
                        } else {
                            this._LastWasEscape = true;
                        }
                    } else if (Ch === '!') {
                        if (this._LastWasEscape) {
                            this._LastWasEscape = false;
                            this._Buffer += '!';
                        } else {
                            // TODO This shouldn't happen, so what do we do if it does?
                        }
                    } else if (Ch === '|') {
                        if (this._LastWasEscape) {
                            this._LastWasEscape = false;
                            this._Buffer += '|';
                        } else {
                            // New command starting
                            this._RIPParserState = RIPParserState.GotPipe;
                            this._DoTextCommand = true;
                        }
                    } else if (Code === 10) {
                        if (this._LastWasEscape) {
                            // Line wrap, ignore
                        } else {
                            // End of line, allow a text command to execute
                            this._DoTextCommand = true;
                            this._LineStarting = true;
                            this._LineStartedWithRIP = false;
                        }
                    } else if (Code === 13) {
                        // Always ignore CR
                    } else {
                        this._Buffer += Ch;
                        this._LastWasEscape = false;
                    }
                    break;
            }

            // Some commands have 0 parameters, so we need to handle them in the same loop that we moved to GotCommand
            if ((this._RIPParserState === RIPParserState.GotCommand) || (this._DoTextCommand)) {
                var Points: number;

                switch (this._Level) {
                    case 0:
                        switch (this._Command) {
                            case '@': // text_xy
                                if (this._DoTextCommand) {
                                    this._DoTextCommand = false;
                                    this.RIP_TEXT_XY();
                                    if (this._RIPParserState === RIPParserState.GotCommand) this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case '#': // no more
                                this.RIP_NO_MORE();
                                this._RIPParserState = RIPParserState.None;
                                break;
                            case '*': // reset windows
                                this.RIP_RESET_WINDOWS();
                                this._RIPParserState = RIPParserState.None;
                                break;
                            case '=': // line style
                                if (this._Buffer.length === 8) {
                                    this.RIP_LINE_STYLE();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case '>': // erase eol
                                this.RIP_ERASE_EOL();
                                this._RIPParserState = RIPParserState.None;
                                break;
                            case 'A': // arc
                                if (this._Buffer.length === 10) {
                                    this.RIP_ARC();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'a': // one palette
                                if (this._Buffer.length === 4) {
                                    this.RIP_ONE_PALETTE();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'B': // bar
                                if (this._Buffer.length === 8) {
                                    this.RIP_BAR();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'C': // circle
                                if (this._Buffer.length === 6) {
                                    this.RIP_CIRCLE();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'c': // colour
                                if (this._Buffer.length === 2) {
                                    this.RIP_COLOUR();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'E': // erase view
                                this.RIP_ERASE_VIEW();
                                this._RIPParserState = RIPParserState.None;
                                break;
                            case 'e': // erase window
                                this.RIP_ERASE_WINDOW();
                                this._RIPParserState = RIPParserState.None;
                                break;
                            case 'F': // fill
                                if (this._Buffer.length === 6) {
                                    this.RIP_FILL();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'g': // gotoxy
                                if (this._Buffer.length === 4) {
                                    this.RIP_GOTOXY();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'H': // home
                                this.RIP_HOME();
                                this._RIPParserState = RIPParserState.None;
                                break;
                            case 'I': // pie slice
                                if (this._Buffer.length === 10) {
                                    this.RIP_PIE_SLICE();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'i': // oval pie slice
                                if (this._Buffer.length === 12) {
                                    this.RIP_OVAL_PIE_SLICE();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'L': // line
                                if (this._Buffer.length === 8) {
                                    this.RIP_LINE();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'l': // polyline
                                if (this._Buffer.length >= 2) {
                                    Points = parseInt(this._Buffer.substr(0, 2), 36);
                                    if (this._Buffer.length === (2 + (4 * Points))) {
                                        this.RIP_POLYLINE();
                                        this._RIPParserState = RIPParserState.None;
                                    }
                                }
                                break;
                            case 'm': // move
                                if (this._Buffer.length === 4) {
                                    this.RIP_MOVE();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'O': // oval
                                if (this._Buffer.length === 12) {
                                    this.RIP_OVAL();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'o': // filled oval
                                if (this._Buffer.length === 8) {
                                    this.RIP_FILLED_OVAL();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'P': // polygon
                                if (this._Buffer.length >= 2) {
                                    Points = parseInt(this._Buffer.substr(0, 2), 36);
                                    if (this._Buffer.length === (2 + (4 * Points))) {
                                        this.RIP_POLYGON();
                                        this._RIPParserState = RIPParserState.None;
                                    }
                                }
                                break;
                            case 'p': // filled polygon
                                if (this._Buffer.length >= 2) {
                                    Points = parseInt(this._Buffer.substr(0, 2), 36);
                                    if (this._Buffer.length === (2 + (4 * Points))) {
                                        this.RIP_FILLED_POLYGON();
                                        this._RIPParserState = RIPParserState.None;
                                    }
                                }
                                break;
                            case 'Q': // set palette
                                if (this._Buffer.length === 32) {
                                    this.RIP_SET_PALETTE();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'R': // rectangle
                                if (this._Buffer.length === 8) {
                                    this.RIP_RECTANGLE();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'S': // fill style
                                if (this._Buffer.length === 4) {
                                    this.RIP_FILL_STYLE();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 's': // fill pattern
                                if (this._Buffer.length === 18) {
                                    this.RIP_FILL_PATTERN();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'T': // text
                                if (this._DoTextCommand) {
                                    this._DoTextCommand = false;
                                    this.RIP_TEXT();
                                    if (this._RIPParserState === RIPParserState.GotCommand) this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'V': // oval arc
                                if (this._Buffer.length === 12) {
                                    this.RIP_OVAL_ARC();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'v': // view port
                                if (this._Buffer.length === 8) {
                                    this.RIP_VIEWPORT();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'W': // write mode
                                if (this._Buffer.length === 2) {
                                    this.RIP_WRITE_MODE();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'w': // text window
                                if (this._Buffer.length === 10) {
                                    this.RIP_TEXT_WINDOW();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'X': // pixel
                                if (this._Buffer.length === 4) {
                                    this.RIP_PIXEL();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'Y': // font style
                                if (this._Buffer.length === 8) {
                                    // Peek to see what font is being requested
                                    // TODO So we need WaitingForStrokeFont after all!
                                    var font: number = parseInt(this._Buffer.substr(0, 2), 36);
                                    if (font > 0) {
                                        // Stroke font, ensure it has loaded
                                        if (StrokeFont.Loaded) {
                                            this.RIP_FONT_STYLE();
                                            this._RIPParserState = RIPParserState.None;
                                        } else {
                                            // TODO FWaitingForStrokeFont = true;
                                        }
                                    } else {
                                        this.RIP_FONT_STYLE();
                                        this._RIPParserState = RIPParserState.None;
                                    }
                                }
                                break;
                            case 'Z': // bezier
                                if (this._Buffer.length === 18) {
                                    this.RIP_BEZIER();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                        }
                        break;
                    case 1:
                        switch (this._Command) {
                            case '\x1B': // query
                                if (this._DoTextCommand) {
                                    this._DoTextCommand = false;
                                    this.RIP_QUERY();
                                    if (this._RIPParserState === RIPParserState.GotCommand) this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'B': // button style
                                if (this._Buffer.length === 36) {
                                    this.RIP_BUTTON_STYLE();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'C': // get image
                                if (this._Buffer.length === 9) {
                                    this.RIP_GET_IMAGE();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'D': // define
                                if (this._DoTextCommand) {
                                    this._DoTextCommand = false;
                                    this.RIP_DEFINE();
                                    if (this._RIPParserState === RIPParserState.GotCommand) this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'E': // end text
                                this.RIP_END_TEXT();
                                this._RIPParserState = RIPParserState.None;
                                break;
                            case 'F': // file query
                                if (this._DoTextCommand) {
                                    this._DoTextCommand = false;
                                    this.RIP_FILE_QUERY();
                                    if (this._RIPParserState === RIPParserState.GotCommand) this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'G': // copy region
                                if (this._Buffer.length === 12) {
                                    this.RIP_COPY_REGION();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'I': // load icon
                                if (this._DoTextCommand) {
                                    this._DoTextCommand = false;
                                    this.RIP_LOAD_ICON();
                                    if (this._RIPParserState === RIPParserState.GotCommand) this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'K': // kill mouse fields
                                this.RIP_KILL_MOUSE_FIELDS();
                                this._RIPParserState = RIPParserState.None;
                                break;
                            case 'M': // mouse
                                if (this._DoTextCommand) {
                                    this._DoTextCommand = false;
                                    this.RIP_MOUSE();
                                    if (this._RIPParserState === RIPParserState.GotCommand) this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'P': // put image
                                if (this._Buffer.length === 7) {
                                    this.RIP_PUT_IMAGE();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'R': // read scene
                                if (this._DoTextCommand) {
                                    this._DoTextCommand = false;
                                    this.RIP_READ_SCENE();
                                    if (this._RIPParserState === RIPParserState.GotCommand) this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'T': // begin text
                                if (this._Buffer.length === 10) {
                                    this.RIP_BEGIN_TEXT();
                                    this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 't': // region text
                                if (this._DoTextCommand) {
                                    this._DoTextCommand = false;
                                    this.RIP_REGION_TEXT();
                                    if (this._RIPParserState === RIPParserState.GotCommand) this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'U': // button
                                if (this._DoTextCommand) {
                                    this._DoTextCommand = false;
                                    this.RIP_BUTTON();
                                    if (this._RIPParserState === RIPParserState.GotCommand) this._RIPParserState = RIPParserState.None;
                                }
                                break;
                            case 'W': // write icon
                                if (this._DoTextCommand) {
                                    this._DoTextCommand = false;
                                    this.RIP_WRITE_ICON();
                                    if (this._RIPParserState === RIPParserState.GotCommand) this._RIPParserState = RIPParserState.None;
                                }
                                break;
                        }
                        break;
                    case 9:
                        if (this._Command === '\x1B') {
                            if (this._DoTextCommand) {
                                this._DoTextCommand = false;
                                this.RIP_ENTER_BLOCK_MODE();
                                if (this._RIPParserState === RIPParserState.GotCommand) this._RIPParserState = RIPParserState.None;
                            }
                        }
                        break;
                }

            }
        }
    }

    private static OnMouseDown(me: MouseEvent): void {
        // TODO
        //for (var i: number = this._MouseFields.length - 1; i >= 0; i--) {
        //	var MB: MouseButton = this._MouseFields[i];
        //	
        //	// Hit test for this button
        //	if (me.localX < MB.Coords.left) continue;
        //	if (me.localX > MB.Coords.right) continue;
        //	if (me.localY < MB.Coords.top) continue;
        //	if (me.localY > MB.Coords.bottom) continue;
        //	
        //	// We're in the region, add events
        //	Graph.Canvas.removeEventListener(MouseEvent.MOUSE_DOWN, OnMouseDown);
        //	Graph.Canvas.addEventListener(MouseEvent.MOUSE_MOVE, OnMouseMove);
        //	Graph.Canvas.addEventListener(MouseEvent.MOUSE_UP, OnMouseUp);
        //	
        //	// Invert button
        //	if (MB.IsInvertable()) {
        //		Graph.Invert(MB.Coords.left, MB.Coords.top, MB.Coords.right, MB.Coords.bottom);
        //	}
        //	FButtonInverted = true;
        //	this._ButtonPressed = i;
        //	break;
        //}
    }

    private static OnMouseMove(me: MouseEvent): void {
        // TODO
        //var MB: MouseButton = this._MouseFields[this._ButtonPressed];
        //
        //// Hit test for this button
        //var Over: boolean = true;
        //if (me.localX < MB.Coords.left) Over = false;
        //if (me.localX > MB.Coords.right) Over = false;
        //if (me.localY < MB.Coords.top) Over = false;
        //if (me.localY > MB.Coords.bottom) Over = false;

        //// Check if we need to change the inversion
        //if ((MB.IsInvertable()) && (Over !== FButtonInverted)) {
        //	Graph.Invert(MB.Coords.left, MB.Coords.top, MB.Coords.right, MB.Coords.bottom);
        //	FButtonInverted = Over;
        //}
    }

    private static OnMouseUp(me: MouseEvent): void {
        // TODO
        //Graph.Canvas.removeEventListener(MouseEvent.MOUSE_UP, OnMouseUp);
        //Graph.Canvas.removeEventListener(MouseEvent.MOUSE_MOVE, OnMouseMove);
        //Graph.Canvas.addEventListener(MouseEvent.MOUSE_DOWN, OnMouseDown);
        //
        //var MB: MouseButton = this._MouseFields[this._ButtonPressed];
        //
        //// Hit test for this button
        //var Over: boolean = true;
        //if (me.localX < MB.Coords.left) Over = false;
        //if (me.localX > MB.Coords.right) Over = false;
        //if (me.localY < MB.Coords.top) Over = false;
        //if (me.localY > MB.Coords.bottom) Over = false;
        //
        //if (Over) {
        //	if (MB.IsInvertable() && FButtonInverted) {
        //		Graph.Invert(MB.Coords.left, MB.Coords.top, MB.Coords.right, MB.Coords.bottom);
        //	}
        //	FButtonInverted = false;
        //	this._ButtonPressed = -1;
        //	
        //	HandleMouseButton(MB);				
        //}
    }

    private static OnPopUpClick(AResponse: string): void {
        for (var i: number = 0; i < AResponse.length; i++) {
            // TODO this._KeyBuf.push(new KeyPressEvent(KEY_PRESSED, new KeyboardEvent(KeyboardEvent.KEY_DOWN), AResponse.charAt(i)));
        }
    }

    // Draw a Poly-Line (multi-faceted line)
    // Status: Fully Implemented, since Line() handles the logic
    public static PolyLine(points: Point[]): void {
        // Display each line
        var pointslength: number = points.length;
        for (var i: number = 1; i < pointslength; i++) {
            Graph.Line(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
        }
    }

    // Query the contents of a text variable
    // Status: Partially Implemented
    // Notes: lots to do here!
    public static Query(mode: number, text: string): void {
        if (mode !== 0) {
            console.log('Query() only supports immediate execution');
            mode = 0;
        }

        if (text === '$ETW$') {
            Graph.ClearTextWindow();
        } else if (text === '$SBAROFF$') {
            // We don't have a status-bar anyway, so nothing to do here
        } else {
            console.log('Query(' + text + ') is not handled');
        }
    }

    // TODO
    //public static ReadKey(): KeyPressEvent
    //{
    //	if (this._KeyBuf.length === 0) return null;

    //	return this._KeyBuf.shift();
    //}

    // Playback local .RIP file
    // Status: Not Implemented
    public static ReadScene(filename: string): void {
        console.log('ReadScene() is not handled');
    }

    // Display a line of text in rectangular text region
    // Status: Not Implemented
    public static RegionText(justify: number, text: string): void {
        console.log('RegionText() is not handled');
    }

    // Clear Graphics/Text Windows & reset to full screen
    // Status: Fully Implemented, since the logic is all handled elsewhere
    public static ResetWindows(): void {
        this.KillMouseFields();

        Graph.SetTextWindow(0, 0, 79, 42, 1, 0);
        Crt.ClrScr(); // No need to call ClearTextWindow() since GraphDefaults() will clear the whole screen

        Graph.GraphDefaults();

        this._Clipboard = null;
    }

    private static RIP_ARC(): void {
        var xcenter: number = parseInt(this._Buffer.substr(0, 2), 36);
        var ycenter: number = parseInt(this._Buffer.substr(2, 2), 36);
        var startangle: number = parseInt(this._Buffer.substr(4, 2), 36);
        var endangle: number = parseInt(this._Buffer.substr(6, 2), 36);
        var radius: number = parseInt(this._Buffer.substr(8, 2), 36);

        this._Benchmark.Start();
        Graph.Arc(xcenter, ycenter, startangle, endangle, radius);
        console.log(this._Benchmark.Elapsed + " Arc(" + xcenter + ", " + ycenter + ", " +  startangle + ", " +  endangle + ", " +  radius + ");");
    }

    private static RIP_BAR(): void {
        var x1: number = parseInt(this._Buffer.substr(0, 2), 36);
        var y1: number = parseInt(this._Buffer.substr(2, 2), 36);
        var x2: number = parseInt(this._Buffer.substr(4, 2), 36);
        var y2: number = parseInt(this._Buffer.substr(6, 2), 36);

        this._Benchmark.Start();
        Graph.Bar(x1, y1, x2, y2);
        console.log(this._Benchmark.Elapsed + " Bar(" + x1 + ", " + y1 + ", " + x2 + ", " + y2 + ");");
    }

    private static RIP_BEGIN_TEXT(): void {
        var x1: number = parseInt(this._Buffer.substr(0, 2), 36);
        var y1: number = parseInt(this._Buffer.substr(2, 2), 36);
        var x2: number = parseInt(this._Buffer.substr(4, 2), 36);
        var y2: number = parseInt(this._Buffer.substr(6, 2), 36);
        var reserved: number = parseInt(this._Buffer.substr(8, 2), 36);

        this._Benchmark.Start();
        this.BeginText(x1, y1, x2, y2);
        console.log(this._Benchmark.Elapsed + " BeginText(" + x1 + ", " + y1 + ", " + x2 + ", " + y2 + ");");
    }

    private static RIP_BEZIER(): void {
        var x1: number = parseInt(this._Buffer.substr(0, 2), 36);
        var y1: number = parseInt(this._Buffer.substr(2, 2), 36);
        var x2: number = parseInt(this._Buffer.substr(4, 2), 36);
        var y2: number = parseInt(this._Buffer.substr(6, 2), 36);
        var x3: number = parseInt(this._Buffer.substr(8, 2), 36);
        var y3: number = parseInt(this._Buffer.substr(10, 2), 36);
        var x4: number = parseInt(this._Buffer.substr(12, 2), 36);
        var y4: number = parseInt(this._Buffer.substr(14, 2), 36);
        var count: number = parseInt(this._Buffer.substr(16, 2), 36);

        this._Benchmark.Start();
        Graph.Bezier(x1, y1, x2, y2, x3, y3, x4, y4, count);
        console.log(this._Benchmark.Elapsed + " Bezier(" + x1 + ", " + y1 + ", " +  x2 + ", " +  y2 + ", " +  x3 + ", " +  y3 + ", " +  x4 + ", " +  y4 + ", " + count + ");");
    }

    private static RIP_BUTTON(): void {
        var x1: number = parseInt(this._Buffer.substr(0, 2), 36);
        var y1: number = parseInt(this._Buffer.substr(2, 2), 36);
        var x2: number = parseInt(this._Buffer.substr(4, 2), 36);
        var y2: number = parseInt(this._Buffer.substr(6, 2), 36);
        var hotkey: number = parseInt(this._Buffer.substr(8, 2), 36);
        var flags: number = parseInt(this._Buffer.substr(10, 1), 36);
        var reserved: number = parseInt(this._Buffer.substr(11, 1), 36);
        var text: string = this._Buffer.substr(12, this._Buffer.length - 12);

        this._Benchmark.Start();
        this.Button(x1, y1, x2, y2, hotkey, flags, text);
        console.log(this._Benchmark.Elapsed + " Button(" + x1 + ", " + y1 + ", " + x2 + ", " + y2 + ", " + hotkey + ", " + flags + ", " + text + ");");
    }

    private static RIP_BUTTON_STYLE(): void {
        var width: number = parseInt(this._Buffer.substr(0, 2), 36);
        var height: number = parseInt(this._Buffer.substr(2, 2), 36);
        var orientation: number = parseInt(this._Buffer.substr(4, 2), 36);
        var flags: number = parseInt(this._Buffer.substr(6, 4), 36);
        var bevelsize: number = parseInt(this._Buffer.substr(10, 2), 36);
        var dfore: number = parseInt(this._Buffer.substr(12, 2), 36);
        var dback: number = parseInt(this._Buffer.substr(14, 2), 36);
        var bright: number = parseInt(this._Buffer.substr(16, 2), 36);
        var dark: number = parseInt(this._Buffer.substr(18, 2), 36);
        var surface: number = parseInt(this._Buffer.substr(20, 2), 36);
        var groupid: number = parseInt(this._Buffer.substr(22, 2), 36);
        var flags2: number = parseInt(this._Buffer.substr(24, 2), 36);
        var underlinecolour: number = parseInt(this._Buffer.substr(26, 2), 36);
        var cornercolour: number = parseInt(this._Buffer.substr(28, 2), 36);
        var reserved: number = parseInt(this._Buffer.substr(30, 6), 36);

        this._Benchmark.Start();
        this.SetButtonStyle(width, height, orientation, flags, bevelsize, dfore, dback, bright, dark, surface, groupid, flags2, underlinecolour, cornercolour);
        console.log(this._Benchmark.Elapsed + " SetButtonStyle(" + width + ", " + height + ", " + orientation + ", " + flags + ", " + bevelsize + ", " + dfore + ", " + dback + ", " + bright + ", " + dark + ", " + surface + ", " + groupid + ", " + flags2 + ", " + underlinecolour + ", " + cornercolour + ");");
    }

    private static RIP_CIRCLE(): void {
        var xcenter: number = parseInt(this._Buffer.substr(0, 2), 36);
        var ycenter: number = parseInt(this._Buffer.substr(2, 2), 36);
        var radius: number = parseInt(this._Buffer.substr(4, 2), 36);

        this._Benchmark.Start();
        Graph.Circle(xcenter, ycenter, radius);
        console.log(this._Benchmark.Elapsed + " Circle(" + xcenter + ", " + ycenter + ", " + radius + ");");
    }

    private static RIP_COLOUR(): void {
        var colour: number = parseInt(this._Buffer.substr(0, 2), 36);

        this._Benchmark.Start();
        Graph.SetColour(colour);
        console.log(this._Benchmark.Elapsed + " SetColour(" + colour + ");");
    }

    private static RIP_COPY_REGION(): void {
        var x1: number = parseInt(this._Buffer.substr(0, 2), 36);
        var y1: number = parseInt(this._Buffer.substr(2, 2), 36);
        var x2: number = parseInt(this._Buffer.substr(4, 2), 36);
        var y2: number = parseInt(this._Buffer.substr(6, 2), 36);
        var reserved: number = parseInt(this._Buffer.substr(8, 2), 36);
        var desty: number = parseInt(this._Buffer.substr(10, 2), 36);

        this._Benchmark.Start();
        this.CopyRegion(x1, y1, x2, y2, desty);
        console.log(this._Benchmark.Elapsed + " CopyRegion(" + x1 + ", " + y1 + ", " + x2 + ", " + y2 + ", " + desty + ");");
    }

    // Define a text variable
    // Status: Not Implemented
    private static RIP_DEFINE(): void {
        var flags: number = parseInt(this._Buffer.substr(0, 3), 36);
        var reserved: number = parseInt(this._Buffer.substr(3, 2), 36);
        var text: string = this._Buffer.substr(5, this._Buffer.length - 5);

        this._Benchmark.Start();
        this.Define(flags, text);
        console.log(this._Benchmark.Elapsed + " Define(" + flags + ", " + text + ");");
    }

    private static RIP_END_TEXT(): void {
        this._Benchmark.Start();
        this.EndText();
        console.log(this._Benchmark.Elapsed + " EndText();");
    }

    // Enter block transfer mode with host
    // Status: Not Implemented
    private static RIP_ENTER_BLOCK_MODE(): void {
        var mode: number = parseInt(this._Buffer.substr(0, 1), 36);
        var protocol: number = parseInt(this._Buffer.substr(1, 1), 36);
        var filetype: number = parseInt(this._Buffer.substr(2, 2), 36);
        var reserved: number = parseInt(this._Buffer.substr(4, 4), 36);
        var filename: string = this._Buffer.substr(8, this._Buffer.length - 8);

        this._Benchmark.Start();
        this.EnterBlockMode(mode, protocol, filetype, filename);
        console.log(this._Benchmark.Elapsed + " EnterBlockMode(" + mode + ", " + protocol + ", " + filetype + ", " + filename + ");");
    }

    private static RIP_ERASE_EOL(): void {
        this._Benchmark.Start();
        Graph.EraseEOL();
        console.log(this._Benchmark.Elapsed + " EraseEOL();");
    }

    private static RIP_ERASE_VIEW(): void {
        this._Benchmark.Start();
        Graph.ClearViewPort();
        console.log(this._Benchmark.Elapsed + " EraseView();");
    }

    private static RIP_ERASE_WINDOW(): void {
        this._Benchmark.Start();
        Graph.ClearTextWindow();
        console.log(this._Benchmark.Elapsed + " EraseWindow();");
    }

    // Query existing information on a particular file
    // Status: Not Implemented
    private static RIP_FILE_QUERY(): void {
        var mode: number = parseInt(this._Buffer.substr(0, 2), 36);
        var reserved: number = parseInt(this._Buffer.substr(2, 4), 36);
        var filename: string = this._Buffer.substr(6, this._Buffer.length - 6);

        this._Benchmark.Start();
        this.FileQuery(mode, filename);
        console.log(this._Benchmark.Elapsed + " FileQuery(" + mode + ", " + filename + ");");
    }

    private static RIP_FILL(): void {
        var x: number = parseInt(this._Buffer.substr(0, 2), 36);
        var y: number = parseInt(this._Buffer.substr(2, 2), 36);
        var border: number = parseInt(this._Buffer.substr(4, 2), 36);

        this._Benchmark.Start();
        Graph.FloodFill(x, y, border);
        console.log(this._Benchmark.Elapsed + " Fill(" + x + ", " + y + ", " + border + ");");
    }

    private static RIP_FILL_PATTERN(): void {
        var c1: number = parseInt(this._Buffer.substr(0, 2), 36);
        var c2: number = parseInt(this._Buffer.substr(2, 2), 36);
        var c3: number = parseInt(this._Buffer.substr(4, 2), 36);
        var c4: number = parseInt(this._Buffer.substr(6, 2), 36);
        var c5: number = parseInt(this._Buffer.substr(8, 2), 36);
        var c6: number = parseInt(this._Buffer.substr(10, 2), 36);
        var c7: number = parseInt(this._Buffer.substr(12, 2), 36);
        var c8: number = parseInt(this._Buffer.substr(14, 2), 36);
        var colour: number = parseInt(this._Buffer.substr(16, 2), 36);

        this._Benchmark.Start();
        Graph.SetFillStyle(FillStyle.User, colour);
        Graph.SetFillPattern([c1, c2, c3, c4, c5, c6, c7, c8], colour);
        console.log(this._Benchmark.Elapsed + " SetFillPattern(" + c1 + ", " + c2 + ", " + c3 + ", " + c4 + ", " + c5 + ", " + c6 + ", " + c7 + ", " + c8 + ", " + colour + ");");
    }

    private static RIP_FILL_STYLE(): void {
        var pattern: number = parseInt(this._Buffer.substr(0, 2), 36);
        var colour: number = parseInt(this._Buffer.substr(2, 2), 36);

        this._Benchmark.Start();
        Graph.SetFillStyle(pattern, colour);
        console.log(this._Benchmark.Elapsed + " SetFillStyle(" + pattern + ", " + colour + ");");
    }

    private static RIP_FILLED_OVAL(): void {
        var xcenter: number = parseInt(this._Buffer.substr(0, 2), 36);
        var ycenter: number = parseInt(this._Buffer.substr(2, 2), 36);
        var xradius: number = parseInt(this._Buffer.substr(4, 2), 36);
        var yradius: number = parseInt(this._Buffer.substr(6, 2), 36);

        this._Benchmark.Start();
        Graph.FillEllipse(xcenter, ycenter, xradius, yradius);
        console.log(this._Benchmark.Elapsed + " Graph.FillEllipse(" + xcenter + ", " + ycenter + ", " + xradius + ", " + yradius + ");");
    }

    private static RIP_FILLED_POLYGON(): void {
        this._Benchmark.Start();
        var count: number = parseInt(this._Buffer.substr(0, 2), 36);
        var points: Point[] = []; // TODO new Vector.<Point>(count);

        if (count >= 2) {
            for (var i: number = 0; i < count; i++) {
                points[i] = new Point(parseInt(this._Buffer.substr(2 + (i * 4), 2), 36), parseInt(this._Buffer.substr(4 + (i * 4), 2), 36));
            }
            points.push(new Point(points[0].x, points[0].y));

            Graph.FillPoly(points);
            console.log(this._Benchmark.Elapsed + " FillPoly(" + points.toString() + ");");
        } else {
            console.log('RIP_FILLED_POLYGON with ' + count + ' points is not allowed');
        }
    }

    private static RIP_FONT_STYLE(): void {
        var font: number = parseInt(this._Buffer.substr(0, 2), 36);
        var direction: number = parseInt(this._Buffer.substr(2, 2), 36);
        var size: number = parseInt(this._Buffer.substr(4, 2), 36);
        var reserved: number = parseInt(this._Buffer.substr(6, 2), 36);

        this._Benchmark.Start();
        Graph.SetTextStyle(font, direction, size);
        console.log(this._Benchmark.Elapsed + " SetFontStyle(" + font + ", " + direction + ", " + size + ");");
    }

    private static RIP_GET_IMAGE(): void {
        var x1: number = parseInt(this._Buffer.substr(0, 2), 36);
        var y1: number = parseInt(this._Buffer.substr(2, 2), 36);
        var x2: number = parseInt(this._Buffer.substr(4, 2), 36);
        var y2: number = parseInt(this._Buffer.substr(6, 2), 36);
        var reserved: number = parseInt(this._Buffer.substr(7, 1), 36);

        if ((x1 > x2) || (y1 > y2)) {
            console.log('TODO Invalid coordinates: ' + x1 + ',' + y1 + ' to ' + x2 + ',' + y2);
            return;
        }

        this._Benchmark.Start();
        this._Clipboard = Graph.GetImage(x1, y1, x2, y2);
        console.log(this._Benchmark.Elapsed + " GetImage(" + x1 + ", " + y1 + ", " + x2 + ", " + y2 + ");");
    }

    private static RIP_GOTOXY(): void {
        var x: number = parseInt(this._Buffer.substr(0, 2), 36);
        var y: number = parseInt(this._Buffer.substr(2, 2), 36);

        this._Benchmark.Start();
        Crt.GotoXY(x, y);
        console.log(this._Benchmark.Elapsed + " Crt.GotoXY(" + x + ", " + y + ");");
    }

    private static RIP_HOME(): void {
        this._Benchmark.Start();
        Crt.GotoXY(1, 1);
        console.log(this._Benchmark.Elapsed + " Crt.GotoXY(1, 1);");
    }

    private static RIP_KILL_MOUSE_FIELDS(): void {
        this._Benchmark.Start();
        this.KillMouseFields();
        console.log(this._Benchmark.Elapsed + " KillMouseFields();");
    }

    private static RIP_LINE(): void {
        var x1: number = parseInt(this._Buffer.substr(0, 2), 36);
        var y1: number = parseInt(this._Buffer.substr(2, 2), 36);
        var x2: number = parseInt(this._Buffer.substr(4, 2), 36);
        var y2: number = parseInt(this._Buffer.substr(6, 2), 36);

        this._Benchmark.Start();
        Graph.Line(x1, y1, x2, y2);
        console.log(this._Benchmark.Elapsed + " Line(" + x1 + ", " + y1 + ", " + x2 + ", " + y2 + ");");
    }

    private static RIP_LINE_STYLE(): void {
        var style: number = parseInt(this._Buffer.substr(0, 2), 36);
        var userpattern: number = parseInt(this._Buffer.substr(2, 4), 36);
        var thickness: number = parseInt(this._Buffer.substr(6, 2), 36);

        this._Benchmark.Start();
        Graph.SetLineStyle(style, userpattern, thickness);
        console.log(this._Benchmark.Elapsed + " SetLineStyle(" + style + ", " + userpattern + ", " + thickness + ");");
    }

    private static RIP_LOAD_ICON(): void {
        var x: number = parseInt(this._Buffer.substr(0, 2), 36);
        var y: number = parseInt(this._Buffer.substr(2, 2), 36);
        var mode: number = parseInt(this._Buffer.substr(4, 2), 36);
        var clipboard: number = parseInt(this._Buffer.substr(6, 1), 36);
        var reserved: number = parseInt(this._Buffer.substr(7, 2), 36);
        var filename: string = this._Buffer.substr(9, this._Buffer.length - 9);

        this._Benchmark.Start();
        this.LoadIcon(x, y, mode, clipboard, filename);
        console.log(this._Benchmark.Elapsed + " LoadIcon(" + x + ", " + y + ", " + mode + ", " + clipboard + ", " + filename + ");");
    }

    // Defines a rectangular hot mouse region
    // Status: Not Implemented
    private static RIP_MOUSE(): void {
        var num: number = parseInt(this._Buffer.substr(0, 2), 36);
        var x1: number = parseInt(this._Buffer.substr(2, 2), 36);
        var y1: number = parseInt(this._Buffer.substr(4, 2), 36);
        var x2: number = parseInt(this._Buffer.substr(6, 2), 36);
        var y2: number = parseInt(this._Buffer.substr(8, 2), 36);
        var invert: number = parseInt(this._Buffer.substr(10, 1), 36);
        var clear: number = parseInt(this._Buffer.substr(11, 1), 36);
        var reserved: number = parseInt(this._Buffer.substr(12, 5), 36);
        var hostcommand: string = this._Buffer.substr(17, this._Buffer.length - 17);

        this._Benchmark.Start();
        // TODO Move this into a function
        var flags: number = 0;
        if (invert === 1) flags |= 2;
        if (clear === 1) flags |= 4;
        this._MouseFields.push(new MouseButton(new Rectangle(x1, y1, x2 - x1 + 1, y2 - y1 + 1), hostcommand, flags, ''));
        console.log(this._Benchmark.Elapsed + " this._MouseFields.push(new MouseButton(new Rectangle(" + x1 + ", " + y1 + ", " + (x2 - x1 + 1) + ", " + (y2 - y1 + 1) + "), " + hostcommand + ", " + flags + ", " + "''));");
    }

    private static RIP_MOVE(): void {
        var x: number = parseInt(this._Buffer.substr(0, 2), 36);
        var y: number = parseInt(this._Buffer.substr(2, 2), 36);

        this._Benchmark.Start();
        Graph.MoveTo(x, y);
        console.log(this._Benchmark.Elapsed + " Graph.MoveTo(" + x + ", " + y + ");");
    }

    private static RIP_NO_MORE(): void {
        // Nothing to do here
    }

    private static RIP_ONE_PALETTE(): void {
        var colour: number = parseInt(this._Buffer.substr(0, 2), 36);
        var value: number = parseInt(this._Buffer.substr(2, 2), 36);

        this._Benchmark.Start();
        Graph.SetPalette(colour, value);
        console.log(this._Benchmark.Elapsed + " OnePalette(" + colour + ", " + value + ");");
    }

    private static RIP_OVAL(): void {
        var xcenter: number = parseInt(this._Buffer.substr(0, 2), 36);
        var ycenter: number = parseInt(this._Buffer.substr(2, 2), 36);
        var startangle: number = parseInt(this._Buffer.substr(4, 2), 36);
        var endangle: number = parseInt(this._Buffer.substr(6, 2), 36);
        var xradius: number = parseInt(this._Buffer.substr(8, 2), 36);
        var yradius: number = parseInt(this._Buffer.substr(10, 2), 36);

        this._Benchmark.Start();
        Graph.Ellipse(xcenter, ycenter, startangle, endangle, xradius, yradius);
        console.log(this._Benchmark.Elapsed + " Oval(" + xcenter + ", " + ycenter + ", " +  startangle + ", " +  endangle + ", " +  xradius + ", " +  yradius + ");");
    }

    private static RIP_OVAL_ARC(): void {
        var xcenter: number = parseInt(this._Buffer.substr(0, 2), 36);
        var ycenter: number = parseInt(this._Buffer.substr(2, 2), 36);
        var startangle: number = parseInt(this._Buffer.substr(4, 2), 36);
        var endangle: number = parseInt(this._Buffer.substr(6, 2), 36);
        var xradius: number = parseInt(this._Buffer.substr(8, 2), 36);
        var yradius: number = parseInt(this._Buffer.substr(10, 2), 36);

        this._Benchmark.Start();
        Graph.Ellipse(xcenter, ycenter, startangle, endangle, xradius, yradius);
        console.log(this._Benchmark.Elapsed + " OvalArc(" + xcenter + ", " + ycenter + ", " +  startangle + ", " +  endangle + ", " +  xradius + ", " +  yradius + ");");
    }

    private static RIP_OVAL_PIE_SLICE(): void {
        var xcenter: number = parseInt(this._Buffer.substr(0, 2), 36);
        var ycenter: number = parseInt(this._Buffer.substr(2, 2), 36);
        var startangle: number = parseInt(this._Buffer.substr(4, 2), 36);
        var endangle: number = parseInt(this._Buffer.substr(6, 2), 36);
        var xradius: number = parseInt(this._Buffer.substr(8, 2), 36);
        var yradius: number = parseInt(this._Buffer.substr(10, 2), 36);

        this._Benchmark.Start();
        Graph.Sector(xcenter, ycenter, startangle, endangle, xradius, yradius);
        console.log(this._Benchmark.Elapsed + " Graph.Sector(" + xcenter + ", " + ycenter + ", " +  startangle + ", " +  endangle + ", " +  xradius + ", " +  yradius + ");");
    }

    private static RIP_PIE_SLICE(): void {
        var xcenter: number = parseInt(this._Buffer.substr(0, 2), 36);
        var ycenter: number = parseInt(this._Buffer.substr(2, 2), 36);
        var startangle: number = parseInt(this._Buffer.substr(4, 2), 36);
        var endangle: number = parseInt(this._Buffer.substr(6, 2), 36);
        var radius: number = parseInt(this._Buffer.substr(8, 2), 36);

        this._Benchmark.Start();
        Graph.PieSlice(xcenter, ycenter, startangle, endangle, radius);
        console.log(this._Benchmark.Elapsed + " Graph.PieSlice(" + xcenter + ", " + ycenter + ", " +  startangle + ", " +  endangle + ", " +  radius + ");");
    }

    private static RIP_PIXEL(): void {
        var x: number = parseInt(this._Buffer.substr(0, 2), 36);
        var y: number = parseInt(this._Buffer.substr(2, 2), 36);

        this._Benchmark.Start();
        Graph.PutPixel(x, y, Graph.GetColour());
        console.log(this._Benchmark.Elapsed + " Pixel(" + x + ", " + y + ");");
    }

    private static RIP_POLYGON(): void {
        this._Benchmark.Start();
        var count: number = parseInt(this._Buffer.substr(0, 2), 36);
        var points: Point[] = []; // TODO new Vector.<Point>(count);

        for (var i: number = 0; i < count; i++) {
            points[i] = new Point(parseInt(this._Buffer.substr(2 + (i * 4), 2), 36), parseInt(this._Buffer.substr(4 + (i * 4), 2), 36));
        }
        points.push(new Point(points[0].x, points[0].y));

        Graph.DrawPoly(points);
        console.log(this._Benchmark.Elapsed + " DrawPoly(" + points.toString() + ");");
    }

    private static RIP_POLYLINE(): void {
        this._Benchmark.Start();
        var count: number = parseInt(this._Buffer.substr(0, 2), 36);
        var points: Point[] = []; // TODO new Vector.<Point>(count);

        for (var i: number = 0; i < count; i++) {
            points[i] = new Point(parseInt(this._Buffer.substr(2 + (i * 4), 2), 36), parseInt(this._Buffer.substr(4 + (i * 4), 2), 36));
        }

        Graph.DrawPoly(points);
        console.log(this._Benchmark.Elapsed + " DrawPoly(" + points.toString() + ");");
    }

    private static RIP_PUT_IMAGE(): void {
        var x: number = parseInt(this._Buffer.substr(0, 2), 36);
        var y: number = parseInt(this._Buffer.substr(2, 2), 36);
        var mode: number = parseInt(this._Buffer.substr(4, 2), 36);
        var reserved: number = parseInt(this._Buffer.substr(6, 1), 36);

        this._Benchmark.Start();
        Graph.PutImage(x, y, this._Clipboard, mode);
        console.log(this._Benchmark.Elapsed + " PutImage(" + x + ", " + y + ", " + mode + ");");
    }

    private static RIP_QUERY(): void {
        var mode: number = parseInt(this._Buffer.substr(0, 1), 36);
        var reserved: number = parseInt(this._Buffer.substr(1, 3), 36);
        var text: string = this._Buffer.substr(4, this._Buffer.length - 4);

        this._Benchmark.Start();
        this.Query(mode, text);
        console.log(this._Benchmark.Elapsed + " Query(" + mode + ", " + text + ");");
    }

    // Playback local .RIP file
    // Status: Not Implemented
    private static RIP_READ_SCENE(): void {
        var reserved: number = parseInt(this._Buffer.substr(0, 8), 36);
        var filename: string = this._Buffer.substr(8, this._Buffer.length - 8);

        this._Benchmark.Start();
        this.ReadScene(filename);
        console.log(this._Benchmark.Elapsed + " ReadScene(" + filename + ");");
    }

    private static RIP_RECTANGLE(): void {
        var x1: number = parseInt(this._Buffer.substr(0, 2), 36);
        var y1: number = parseInt(this._Buffer.substr(2, 2), 36);
        var x2: number = parseInt(this._Buffer.substr(4, 2), 36);
        var y2: number = parseInt(this._Buffer.substr(6, 2), 36);

        this._Benchmark.Start();
        Graph.Rectangle(x1, y1, x2, y2);
        console.log(this._Benchmark.Elapsed + " Rectangle(" + x1 + ", " + y1 + ", " + x2 + ", " + y2 + ");");
    }

    // Display a line of text in rectangular text region
    // Status: Not Implemented
    private static RIP_REGION_TEXT(): void {
        var justify: number = parseInt(this._Buffer.substr(0, 1), 36);
        var text: string = this._Buffer.substr(1, this._Buffer.length - 1);

        this._Benchmark.Start();
        this.RegionText(justify, text);
        console.log(this._Benchmark.Elapsed + " RegionText(" + justify + ", " + text + ");");
    }

    private static RIP_RESET_WINDOWS(): void {
        this._Benchmark.Start();
        this.ResetWindows();
        console.log(this._Benchmark.Elapsed + " ResetWindows();");
    }

    private static RIP_SET_PALETTE(): void {
        var c1: number = parseInt(this._Buffer.substr(0, 2), 36);
        var c2: number = parseInt(this._Buffer.substr(2, 2), 36);
        var c3: number = parseInt(this._Buffer.substr(4, 2), 36);
        var c4: number = parseInt(this._Buffer.substr(6, 2), 36);
        var c5: number = parseInt(this._Buffer.substr(8, 2), 36);
        var c6: number = parseInt(this._Buffer.substr(10, 2), 36);
        var c7: number = parseInt(this._Buffer.substr(12, 2), 36);
        var c8: number = parseInt(this._Buffer.substr(14, 2), 36);
        var c9: number = parseInt(this._Buffer.substr(16, 2), 36);
        var c10: number = parseInt(this._Buffer.substr(18, 2), 36);
        var c11: number = parseInt(this._Buffer.substr(20, 2), 36);
        var c12: number = parseInt(this._Buffer.substr(22, 2), 36);
        var c13: number = parseInt(this._Buffer.substr(24, 2), 36);
        var c14: number = parseInt(this._Buffer.substr(26, 2), 36);
        var c15: number = parseInt(this._Buffer.substr(28, 2), 36);
        var c16: number = parseInt(this._Buffer.substr(30, 2), 36);

        this._Benchmark.Start();
        Graph.SetAllPalette([c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14, c15, c16]);
        console.log(this._Benchmark.Elapsed + " SetPalette(" + c1 + ", " + c2 + ", " + c3 + ", " + c4 + ", " + c5 + ", " + c6 + ", " + c7 + ", " + c8 + ", " + c9 + ", " + c10 + ", " + c11 + ", " + c12 + ", " + c13 + ", " + c14 + ", " + c15 + ", " + c16 + ");");
    }

    private static RIP_TEXT(): void {
        var text: string = this._Buffer;

        this._Benchmark.Start();
        Graph.SetTextJustify(TextJustification.Left, TextJustification.Top);
        Graph.OutText(text);
        console.log(this._Benchmark.Elapsed + " OutText(" + text + ");");
    }

    private static RIP_TEXT_WINDOW(): void {
        var x1: number = parseInt(this._Buffer.substr(0, 2), 36);
        var y1: number = parseInt(this._Buffer.substr(2, 2), 36);
        var x2: number = parseInt(this._Buffer.substr(4, 2), 36);
        var y2: number = parseInt(this._Buffer.substr(6, 2), 36);
        var wrap: number = parseInt(this._Buffer.substr(8, 1), 36);
        var size: number = parseInt(this._Buffer.substr(9, 1), 36);

        this._Benchmark.Start();
        Graph.SetTextWindow(x1, y1, x2, y2, wrap, size);
        console.log(this._Benchmark.Elapsed + " SetTextWindow(" + x1 + ", " + y1 + ", " + x2 + ", " + y2 + ", " + wrap + ", " + size + ");");
    }

    private static RIP_TEXT_XY(): void {
        var x: number = parseInt(this._Buffer.substr(0, 2), 36);
        var y: number = parseInt(this._Buffer.substr(2, 2), 36);
        var text: string = this._Buffer.substr(4, this._Buffer.length - 4);

        this._Benchmark.Start();
        Graph.SetTextJustify(TextJustification.Left, TextJustification.Top);
        Graph.OutTextXY(x, y, text);
        console.log(this._Benchmark.Elapsed + " TextXY(" + x + ", " + y + ", " + text + ");");
    }

    private static RIP_VIEWPORT(): void {
        var x1: number = parseInt(this._Buffer.substr(0, 2), 36);
        var y1: number = parseInt(this._Buffer.substr(2, 2), 36);
        var x2: number = parseInt(this._Buffer.substr(4, 2), 36);
        var y2: number = parseInt(this._Buffer.substr(6, 2), 36);

        this._Benchmark.Start();
        Graph.SetViewPort(x1, y1, x2, y2, true);
        console.log(this._Benchmark.Elapsed + " SetViewPort(" + x1 + ", " + y1 + ", " + x2 + ", " + y2 + ");");
    }

    // Write contents of the clipboard (icon) to disk
    // Status: Not Implemented
    private static RIP_WRITE_ICON(): void {
        var reserved: number = parseInt(this._Buffer.substr(0, 1), 36);
        var filename: string = this._Buffer.substr(1, this._Buffer.length - 1);

        this._Benchmark.Start();
        this.WriteIcon(filename);
        console.log(this._Benchmark.Elapsed + " WriteIcon(" + filename + ");");
    }

    private static RIP_WRITE_MODE(): void {
        var mode: number = parseInt(this._Buffer.substr(0, 2), 36);

        this._Benchmark.Start();
        Graph.SetWriteMode(mode);
        console.log(this._Benchmark.Elapsed + " SetWriteMode(" + mode + ");");
    }

    // Button style definition
    // Status: Partially Implemented
    // Notes: TButtonStyle shouldn't use ints for things that dont make sense, should add additional fields to expand flags
    public static SetButtonStyle(width: number, height: number, orientation: number, flags: number, bevelsize: number, dfore: number, dback: number, bright: number, dark: number, surface: number, groupid: number, flags2: number, underlinecolour: number, cornercolour: number): void {
        this._ButtonStyle.width = width;
        this._ButtonStyle.height = height;
        this._ButtonStyle.orientation = orientation;
        this._ButtonStyle.flags = flags;
        this._ButtonStyle.bevelsize = bevelsize;
        this._ButtonStyle.dfore = dfore;
        this._ButtonStyle.dback = dback;
        this._ButtonStyle.bright = bright;
        this._ButtonStyle.dark = dark;
        this._ButtonStyle.surface = surface;
        this._ButtonStyle.groupid = groupid;
        this._ButtonStyle.flags2 = flags2;
        this._ButtonStyle.underlinecolour = underlinecolour;
        this._ButtonStyle.cornercolour = cornercolour;
    }

    // Write contents of the clipboard (icon) to disk
    // Status: Not Implemented
    public static WriteIcon(filename: string): void {
        console.log('WriteIcon() is not handled');
    }
}
