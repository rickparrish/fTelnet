package randm.graph.rip
{
	import flash.display.Bitmap;
	import flash.display.BitmapData;
	import flash.display.Loader;
	import flash.display.PixelSnapping;
	import flash.display.Shape;
	import flash.display.Sprite;
	import flash.events.*;
	import flash.geom.Point;
	import flash.geom.Rectangle;
	import flash.net.SharedObject;
	import flash.net.URLLoaderDataFormat;
	import flash.net.URLRequest;
	import flash.system.ApplicationDomain;
	import flash.text.Font;
	import flash.text.TextDisplayMode;
	import flash.text.TextField;
	import flash.text.TextFieldAutoSize;
	import flash.text.TextFormat;
	import flash.ui.Keyboard;
	import flash.utils.ByteArray;
	import flash.utils.Dictionary;
	import flash.utils.Endian;
	import flash.utils.getTimer;
	
	import randm.RMURLLoader;
	import randm.ansi.Ansi;
	import randm.crt.Crt;
	import randm.crt.KeyPressEvent;
	import randm.graph.*;
	import randm.graph.rip.*;

	public class RIP
	{
		static public const KEY_PRESSED: String = "KeyPressed";
		
		/* Private variables */
		static private var FBuffer: String;
		static private var FButtonInverted: Boolean;
		static private var FButtonPressed: int;
		static private var FButtonStyle: TButtonStyle;
		static private var FClipboard: BitmapData;
		static private var FCommand: String;
		static private var FDoTextCommand: Boolean;
		static private var FFont: int;
		static private var FInputBuffer: Array;
		static private var FIconsLoading: int;
		static private var FKeyBuf: Array;
		static private var FLastWasEscape: Boolean;
		static private var FLevel: int;
		static private var FLineStartedWithRIP: Boolean;
		static private var FLineStarting: Boolean;
		static private var FMouseFields: Array;
		static private var FRIPParserState: int;
		static private var FSubLevel: int;
		static private var FTimer: int;
		static private var FWaitingForStrokeFont: Boolean;

		Array.prototype.InitTwoDimensions = function(x: int, y: int): void 
		{
			for (var i: int = 0; i <= x; i++) {
				this[i] = [y + 1];
			}
			for (var inity: int = 0; inity <= y; inity++) {
				for (var initx: int = 0; initx <= x; initx++) {
					this[initx][inity] = 0;
				}
			}
		};

		// Static constructor
		{
			// Init variables
			FBuffer = "";
			FButtonInverted = false;
			FButtonPressed = -1;
			FButtonStyle = new TButtonStyle();
			FClipboard = null;
			FCommand = "";
			FDoTextCommand = false;
			FInputBuffer = [];
			FIconsLoading = 0;
			FKeyBuf = new Array();
			FLastWasEscape = false;
			FLevel = 0;
			FLineStartedWithRIP = false;
			FLineStarting = true;
			FMouseFields = [];
			FRIPParserState = RIPParserState.None;
			FSubLevel = 0;
			FWaitingForStrokeFont = false;

			// Add the enter frame event listener, where the real parsing happens
			Graph.Canvas.addEventListener(Event.ENTER_FRAME, OnEnterFrame);
			Graph.Canvas.addEventListener(MouseEvent.MOUSE_DOWN, OnMouseDown);
		}

		// Define a rectangular text region
		// Status: Not Implemented
		static public function BeginText(x1: int, y1: int, x2: int, y2: int): void
		{
			trace("BeginText() is not handled");
		}
		
		// Define a Mouse Button
		// Status: Partially Implemented
		static public function Button(x1: int, y1: int, x2: int, y2: int, hotkey: int, flags: int, text: String): void
		{
			// Fix bad co-ordinates
			if ((x2 > 0) && (x1 > x2)) {
				var TempX: int = x1;
				x1 = x2;
				x2 = TempX;
			}
			if ((y2 > 0) && (y1 > y2)) {
				var TempY: int = y1;
				y1 = y2;
				y2 = TempY;
			}
			
			var OldColour: int = Graph.GetColour();
			var OldFillSettings: TFillSettings = Graph.GetFillSettings();
			var TempFillSettings: TFillSettings = Graph.GetFillSettings();
			
			// Split the text portion (which is 3 items separated by <>)
			var iconfile: String = "";
			var label: String = "";
			var hostcommand: String = "";
			var textarray: Array = text.split("<>");
			if (textarray.length >= 3) hostcommand = HandleCtrlKeys(textarray[2]);
			if (textarray.length >= 2) label = textarray[1];
			if (textarray.length >= 1) iconfile = textarray[0];
			
			if ((FButtonStyle.flags & 128) == 128) {
				trace("Button() doesn't support the icon type");
				return;
			} else if ((FButtonStyle.flags & 1) == 1) {
				trace("Button() doesn't support the clipboard type");
				return;
			}
			
			// Get width and height of button
			var Size: flash.geom.Rectangle;
			var InvertCoords: flash.geom.Rectangle;
			if ((FButtonStyle.width == 0) || (FButtonStyle.height == 0)) {
				Size = new flash.geom.Rectangle(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
				InvertCoords = new flash.geom.Rectangle(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
			} else {
				Size = new flash.geom.Rectangle(x1, y1, FButtonStyle.width, FButtonStyle.height);
				InvertCoords = new flash.geom.Rectangle(x1, y1, FButtonStyle.width, FButtonStyle.height);
				x2 = Size.right;
				y2 = Size.bottom;
			}
						
			// Draw button face
			TempFillSettings.Style = FillStyle.Solid;
			TempFillSettings.Colour = FButtonStyle.surface;
			Graph.SetFillSettings(TempFillSettings);
			Graph.Bar(x1, y1, x2, y2);
			Graph.SetFillSettings(OldFillSettings);

			// Add bevel, if necessary
			//var BevelSize: int = 0;
			if ((FButtonStyle.flags & 512) == 512) {
				Graph.SetLineStyle(LineStyle.Solid,0,1);//TODO Must restore at end
				Graph.SetFillStyle(FillStyle.Solid,FButtonStyle.bright);//TODO Must restore at end
				Graph.SetColour(FButtonStyle.bright);
				
				var Trapezoid: Vector.<Point> = new Vector.<Point>();
				Trapezoid.push(new Point(x1-FButtonStyle.bevelsize, y1-FButtonStyle.bevelsize));
				Trapezoid.push(new Point(x1-1, y1-1));
				Trapezoid.push(new Point(x2+1, y1-1));
				Trapezoid.push(new Point(x2+FButtonStyle.bevelsize, y1-FButtonStyle.bevelsize));
				Graph.FillPoly(Trapezoid);
				Trapezoid[3] = new Point(x1-FButtonStyle.bevelsize, y2+FButtonStyle.bevelsize);
				Trapezoid[2] = new Point(x1-1, y2+1);
				Graph.FillPoly(Trapezoid);
				Graph.SetFillStyle(FillStyle.Solid,FButtonStyle.dark);
				Graph.SetColour(FButtonStyle.dark);
				Trapezoid[0] = new Point(x2+FButtonStyle.bevelsize, y2+FButtonStyle.bevelsize);
				Trapezoid[1] = new Point(x2+1, y2+1);
				Graph.FillPoly(Trapezoid);
				Trapezoid[3] = new Point(x2+FButtonStyle.bevelsize, y1-FButtonStyle.bevelsize);
				Trapezoid[2] = new Point(x2+1, y1-1);
				Graph.FillPoly(Trapezoid);
				Graph.SetColour(FButtonStyle.cornercolour);
				Graph.Line(x1-FButtonStyle.bevelsize,y1-FButtonStyle.bevelsize,x1-1,y1-1);
				Graph.Line(x1-FButtonStyle.bevelsize,y2+FButtonStyle.bevelsize,x1-1,y2+1);
				Graph.Line(x2+1,y1-1,x2+FButtonStyle.bevelsize,y1-FButtonStyle.bevelsize);
				Graph.Line(x2+1,y2+1,x2+FButtonStyle.bevelsize,y2+FButtonStyle.bevelsize);
				
				
				Size.left -= FButtonStyle.bevelsize;
				Size.top -= FButtonStyle.bevelsize;
				Size.width += FButtonStyle.bevelsize;
				Size.height += FButtonStyle.bevelsize;
				InvertCoords.left -= FButtonStyle.bevelsize;
				InvertCoords.top -= FButtonStyle.bevelsize;
				InvertCoords.width += FButtonStyle.bevelsize;
				InvertCoords.height += FButtonStyle.bevelsize;
			}
			
			// Add chisel, if necessary
			if ((FButtonStyle.flags & 8) == 8) {
				var xchisel: int;
				var ychisel: int;
				
				var Height: int = y2 - y1;
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
			
				Graph.SetColour(FButtonStyle.bright);
				Graph.Rectangle(x1+xchisel+1,y1+ychisel+1,x2-xchisel,y2-ychisel);
				
				Graph.SetColour(FButtonStyle.dark);
				Graph.Rectangle(x1+xchisel,y1+ychisel,x2-(xchisel+1),y2-(ychisel+1));
				Graph.PutPixel(x1+xchisel,y2-ychisel, FButtonStyle.dark);
				Graph.PutPixel(x2-xchisel,y1+ychisel, FButtonStyle.dark);
			}
			Graph.SetColour(OldColour);
			
			// Add recessed, if necessary
			if ((FButtonStyle.flags & 16) == 16) {
				Graph.SetColour(0);
				Graph.Rectangle(x1 - FButtonStyle.bevelsize - 1, y1 - FButtonStyle.bevelsize - 1, x2 + FButtonStyle.bevelsize + 1, y2 + FButtonStyle.bevelsize + 1);
				
				Graph.SetColour(FButtonStyle.dark);
				Graph.Line(x1 - FButtonStyle.bevelsize - 2, y1 - FButtonStyle.bevelsize - 2, x2 + FButtonStyle.bevelsize + 2, y1 - FButtonStyle.bevelsize - 2);
				Graph.Line(x1 - FButtonStyle.bevelsize - 2, y1 - FButtonStyle.bevelsize - 2, x1 - FButtonStyle.bevelsize - 2, y2 + FButtonStyle.bevelsize + 2);
				
				Graph.SetColour(FButtonStyle.bright);
				Graph.Line(x2 + FButtonStyle.bevelsize + 2, y1 - FButtonStyle.bevelsize - 2, x2 + FButtonStyle.bevelsize + 2, y2 + FButtonStyle.bevelsize + 2);
				Graph.Line(x1 - FButtonStyle.bevelsize - 2, y2 + FButtonStyle.bevelsize + 2, x2 + FButtonStyle.bevelsize + 2, y2 + FButtonStyle.bevelsize + 2);
				
				Graph.SetColour(OldColour);

				Size.left -= 2;
				Size.top -= 2;
				Size.width += 2;
				Size.height += 2;
			}
			
			// Add sunken, if necessary
			if ((FButtonStyle.flags & 32768) == 32768) {
				Graph.SetColour(FButtonStyle.dark);
				Graph.Line(x1, y1, x2, y1);
				Graph.Line(x1, y1, x1, y2);
				
				Graph.SetColour(FButtonStyle.bright);
				Graph.Line(x1, y2, x2, y2);
				Graph.Line(x2, y1, x2, y2);
				
				Graph.SetColour(OldColour);
			}
			
			// Draw label
			if (label != "") {
				var labelx: int;
				var labely: int;
				switch (FButtonStyle.orientation) {
					case 0: // above
						labelx = Size.left + int(Size.width / 2) - int(Graph.TextWidth(label) / 2);
						labely = Size.top - Graph.TextHeight(label);
						break;
					case 1: // left
						labelx = Size.left - Graph.TextWidth(label);
						labely = Size.top + int(Size.height / 2) - int(Graph.TextHeight(label) / 2);
						break;
					case 2: // middle
						labelx = Size.left + int(Size.width / 2) - int(Graph.TextWidth(label) / 2);
						labely = Size.top + int(Size.height / 2) - int(Graph.TextHeight(label) / 2);
						break;
					case 3: // right
						labelx = Size.right;
						labely = Size.top + int(Size.height / 2) - int(Graph.TextHeight(label) / 2);
						break;
					case 4: // below
						labelx = Size.left + int(Size.width / 2) - int(Graph.TextWidth(label) / 2);
						labely = Size.bottom;
						break;
				}
				if ((FButtonStyle.flags & 32) == 32) {
					Graph.SetColour(FButtonStyle.dback);
					Graph.OutTextXY(labelx + 1, labely + 1, label);
				}
				Graph.SetColour(FButtonStyle.dfore);
				Graph.OutTextXY(labelx, labely, label);
				Graph.SetColour(OldColour);
			}
			
			// Store mouse button, if necessary
			if ((FButtonStyle.flags & 1024) == 1024) {
				FMouseFields.push(new TMouseButton(InvertCoords, hostcommand, FButtonStyle.flags, String.fromCharCode(hotkey)));
			}			
		}
	
		// Copy screen region up/down
		// Status: Not Implemented
		static public function CopyRegion(x1: int, y1: int, x2: int, y2: int, desty: int): void
		{
			trace("CopyRegion() is not handled");
		}
		
		// Define a text variable
		// Status: Not Implemented
		static public function Define(flags: int, text: String): void
		{
			trace("Define() is not handled");
		}
		
		// End a rectangular text region
		// Status: Not Implemented
		static public function EndText(): void
		{
			trace("EndText() is not handled");
		}
		
		// Enter block transfer mode with host
		// Status: Not Implemented
		static public function EnterBlockMode(mode: int, protocol: int, filetype: int, filename: String): void
		{
			trace("EnterBlockMode() is not handled");
		}

		// Query existing information on a particular file
		// Status: Not Implemented
		static public function FileQuery(mode: int, filename: String): void
		{
			trace("FileQuery() is not handled");
		}
		
		// TODO Also make this handle the @@ text variables (and rename function)
		static private function HandleCtrlKeys(AHostCommand: String): String
		{
			var Result: String = AHostCommand;
			for (var i: int = 1; i <= 26; i++) {
				// For example, replaces ^a or ^A with ASCII 1, ^z or ^Z with ASCII 26
				Result = Result.replace("^" + String.fromCharCode(64 + i), String.fromCharCode(i));
				Result = Result.replace("^" + String.fromCharCode(96 + i), String.fromCharCode(i));
			} 
			Result = Result.replace("^@", String.fromCharCode(0));
			Result = Result.replace("^[", String.fromCharCode(27));
			return Result;
		}
		
		static private function HandleMouseButton(AButton: TMouseButton): void
		{
			// Check if we should reset the window
			if (AButton.DoResetScreen()) {
				ResetWindows();
			}
			
			// Check for a host command
			if (AButton.HostCommand != "") {
				if ((AButton.HostCommand.length > 2) && (AButton.HostCommand.substr(0, 2) == "((") && (AButton.HostCommand.substr(AButton.HostCommand.length - 2, 2) == "))")) {
					PopUp.show(AButton.HostCommand, OnPopUpClick); 
				} else {
					for (var i: int = 0; i < AButton.HostCommand.length; i++) {
						FKeyBuf.push(new KeyPressEvent(KEY_PRESSED, new KeyboardEvent(KeyboardEvent.KEY_DOWN), AButton.HostCommand.charAt(i)));
					}
				}
			}
		}
		
		static public function get IconPath(): String
		{
			return FIconPath;
		}
		
		static public function set IconPath(AIconPath: String): void
		{
			FIconPath = AIconPath;
			if (FIconPath.length == 0) FIconPath = "/";
			if (FIconPath.substr(FIconPath.length - 1, 1) != "/") FIconPath += "/";
		}
		
		static private var FIconPath: String;

		static private function IsCommandCharacter(Ch: String, Level: int): Boolean
		{
			var CommandChars: String = "";
			switch (Level) {
				case 0:
					CommandChars = "@#*=>AaBCcEeFgHIiLlmOoPpQRSsTVvWwXYZ";
					break;
				case 1:
					CommandChars = "BCDEFGIKMPRTtUW" + "\x1B";
					break;
				case 9:
					CommandChars = "\x1B";
					break;
			}
			return (CommandChars.indexOf(Ch) != -1);
		}
		
		static public function KeyPressed(): Boolean
		{
			while (Crt.KeyPressed()) {
				var KPE: KeyPressEvent = Crt.ReadKey();
				var Handled: Boolean = false;

				for (var i: int = 0; i < FMouseFields.length; i++) {
					var MB: TMouseButton = FMouseFields[i];
					if ((MB.HotKey != "") && (MB.HotKey.toUpperCase() == KPE.keyString.toUpperCase())) {
						HandleMouseButton(MB);
						Handled = true;
						break;
					}
				}
				
				if (!Handled) FKeyBuf.push(KPE);	
			}
			return (FKeyBuf.length > 0);
		}

		// Destroys all previously defined hot mouse regions
		// Status: Fully Implemented 
		static public function KillMouseFields(): void
		{
			FMouseFields = [];			
		}
		
		// Loads and displays a disk-based icon to screen
		// Status: Partially Implemented
		static private function LoadIcon(x: int, y: int, mode: int, clipboard: int, filename: String): void
		{
			return; // TODO No icons to load for this test
			if (mode != 0) {
				trace("LoadIcon() only supports COPY mode");
				mode = 0;
			}
			
			// Ensure the filename ends with .ICN
			filename = filename.toUpperCase();
			if (filename.indexOf(".") == -1) filename += ".ICN";
			
			// Load from remote server since it's not in the cache
			var Icon: RMURLLoader = new RMURLLoader();
			Icon.addEventListener(Event.COMPLETE, OnIconLoadComplete);
			Icon.addEventListener(IOErrorEvent.IO_ERROR, OnIconLoadIOError);
			Icon.dataFormat = URLLoaderDataFormat.BINARY;
			Icon.parameters["x"] = x;
			Icon.parameters["y"] = y;
			Icon.parameters["mode"] = mode;
			Icon.parameters["clipboard"] = clipboard;
			Icon.parameters["filename"] = filename;
			
			try {
				FIconsLoading++;
				Icon.load(new URLRequest(FIconPath + filename));
			} catch (e: Error) {
				// Ignore, not much we can do here
				FIconsLoading--;
			}
		}
		
		static private function OnIconLoadComplete(e: Event): void
		{
			try {
				var loader: RMURLLoader = RMURLLoader(e.target);
				
				var left: int = loader.parameters["x"];
				var top: int = loader.parameters["y"];
				
				// Get the byte array
				var BA: ByteArray = loader.data;
				BA.endian = Endian.LITTLE_ENDIAN;
	
				// Store the image in a sharedobject for later use
				var SO: SharedObject
				try {
					SO = SharedObject.getLocal(loader.parameters["filename"], "fTelnet");
					var SOBA: ByteArray = new ByteArray();
					SOBA.writeBytes(BA);
					SO.data["bytes"] = SOBA;
					SO.flush();
					SO.close();
				} catch (e: Error) {
					// Ignore
				}				
	
				// Get the image width and height
				BA.position = 0;
				var width: int = BA.readUnsignedShort();
				var height: int = BA.readUnsignedShort();
	
				// Get the raw bytes
				var InV: Vector.<uint> = new Vector.<uint>();
				while (BA.bytesAvailable > 0) {
					InV.push(BA.readUnsignedByte());
				}
				
				// Get the output vector
				var BD: BitmapData = new BitmapData(width, height);
				var OutV: Vector.<uint> = BD.getVector(new Rectangle(0, 0, width, height));
				var Offset: int = 0;
				
				var Colour: int;
				var bytes_per_plane: int = int((width - 1) / 8) + 1;
				var plane_offset0: int = (bytes_per_plane * 0);
				var plane_offset1: int = (bytes_per_plane * 1);
				var plane_offset2: int = (bytes_per_plane * 2);
				var plane_offset3: int = (bytes_per_plane * 3);
				var row_offset: int;
				var byte_offset: int;
				var right_shift: int;
				for (var y: int = 0; y < height; ++y) {
					row_offset = ((bytes_per_plane * 4) * y); // 4 = number of planes
						
					for (var x: int = 0; x < width; ++x) {
						byte_offset = int(x / 8);
						right_shift = 7 - (x & 7);
							
						// here we roll in each bit from each plane, culminating
						// in a 4-bit number that represents our color number in
						// the 16-color palette
						Colour = (InV[row_offset + plane_offset0 + byte_offset] >> right_shift) & 0x01; 
						Colour <<= 1;
						Colour |= (InV[row_offset + plane_offset1 + byte_offset] >> right_shift) & 0x01;
						Colour <<= 1;
						Colour |= (InV[row_offset + plane_offset2 + byte_offset] >> right_shift) & 0x01;
						Colour <<= 1;
						Colour |= (InV[row_offset + plane_offset3 + byte_offset] >> right_shift) & 0x01;
						OutV[Offset++] = Graph.CURRENT_PALETTE[Colour];
					}
				}
				BD.setVector(new Rectangle(0, 0, width, height), OutV);
				Graph.PutImage(left, top, BD, WriteMode.Copy);
				
				if (loader.parameters["clipboard"] == 1) {
					FClipboard = BD;
				}
			} catch (e: Error) {
				trace("Error loading icon: " + e);
			}
			
			FIconsLoading--;
		}
		
		static private function OnIconLoadIOError(ioe: IOErrorEvent): void
		{
			trace("Error loading icon: " + ioe);
			FIconsLoading--;
		}
		
		static public function Parse(AData: String): void
		{
			var ADatalength: int = AData.length;
			for (var i: int = 0; i < ADatalength; i++) {
				FInputBuffer.push(AData.charCodeAt(i));				
			}
		}
		
		static public function OnEnterFrame(e: Event): void // TODO public
		{
			while (FInputBuffer.length > 0) {
				// Don't process anything if we're waiting on an icon to load from the HTTP server
				// Need to do this in case we load an icon in clipboard mode, since the call to 
				// PutImage() will not work right since we don't have the data in the clipboard yet
				if (FIconsLoading > 0) return;
				
				// Don't process anything if we're waiting for the stroke font to load from the HTTP server
				// Need to do this in case we want to write in stroke font mode, since the fonts are loaded remotely
				if (FWaitingForStrokeFont) {
					if (StrokeFont.Loaded) {
						FWaitingForStrokeFont = false;
					} else {
						return;
					}
				}
				
				var Code: int = FInputBuffer.shift();
				var Ch: String = String.fromCharCode(Code);

				switch (FRIPParserState) {
					case RIPParserState.None:
						if ((Ch == '!') && (FLineStarting)) {
							FBuffer = "";
							FDoTextCommand = false;
							FLineStartedWithRIP = true;
							FLineStarting = false;
							FRIPParserState = RIPParserState.GotExclamation;
						} else if ((Ch == '|') && (FLineStartedWithRIP)) {
							FBuffer = "";
							FDoTextCommand = false;
							FRIPParserState = RIPParserState.GotPipe;
						} else {
							FLineStarting = (Code == 10);
							if (FLineStarting) FLineStartedWithRIP = false;
							Ansi.Write(Ch);
						}
						break;
					case RIPParserState.GotExclamation:
						if (Ch == '|') {
							FRIPParserState = RIPParserState.GotPipe;
						} else {
							Ansi.Write('!' + Ch);
							FRIPParserState = RIPParserState.None;
						}
						break;
					case RIPParserState.GotPipe:
						FBuffer = "";
						FDoTextCommand = false;

						if ((Ch >= '0') && (Ch <= '9')) {
							FLevel = parseInt(Ch, 10);
							FRIPParserState = RIPParserState.GotLevel;
						} else if (IsCommandCharacter(Ch, 0)) {
							FCommand = Ch;
							FLevel = 0;
							FSubLevel = 0;
							FRIPParserState = RIPParserState.GotCommand;
						} else {
							Ansi.Write("|" + Ch);
							FRIPParserState = RIPParserState.None;
						}
						break;
					case RIPParserState.GotLevel:
						if ((Ch >= '0') && (Ch <= '9')) {
							FSubLevel = parseInt(Ch, 10);
							FRIPParserState = RIPParserState.GotSubLevel;
						} else if (IsCommandCharacter(Ch, FLevel)) {
							FCommand = Ch;
							FSubLevel = 0;
							FRIPParserState = RIPParserState.GotCommand;
						} else {
							Ansi.Write("|" + FLevel.toString() + Ch);
							FRIPParserState = RIPParserState.None;
						}
						break;
					case RIPParserState.GotSubLevel:
						// TODO Could be up to 8 sublevels altogether, so gotta handle that here
						if (IsCommandCharacter(Ch, FLevel)) {
							FCommand = Ch;
							FRIPParserState = RIPParserState.GotCommand;
						} else {
							Ansi.Write("|" + FLevel.toString() + FSubLevel.toString() + Ch);
							FRIPParserState = RIPParserState.None;
						}
						break;
					case RIPParserState.GotCommand:
						if (Ch == "\\") {
							if (FLastWasEscape) {
								FLastWasEscape = false;
								FBuffer += "\\";
							} else {
								FLastWasEscape = true;
							}
						} else if (Ch == "!") {
							if (FLastWasEscape) {
								FLastWasEscape = false;
								FBuffer += "!";
							} else {
								// TODO This shouldn't happen, so what do we do if it does?
							}
						} else if (Ch == "|") {
							if (FLastWasEscape) {
								FLastWasEscape = false;
								FBuffer += "|";
							} else {
								// New command starting
								FRIPParserState = RIPParserState.GotPipe;
								FDoTextCommand = true;
							}
						} else if (Code == 10) {
							if (FLastWasEscape) {
								// Line wrap, ignore
							} else {
								// End of line, allow a text command to execute
								FDoTextCommand = true;
								FLineStarting = true;
								FLineStartedWithRIP = false;
							}
						} else if (Code == 13) {
							// Always ignore CR
						} else {
							FBuffer += Ch;
							FLastWasEscape = false;
						}
						break;
				}
				
				// Some commands have 0 parameters, so we need to handle them in the same loop that we moved to GotCommand
				if ((FRIPParserState == RIPParserState.GotCommand) || (FDoTextCommand)) {
					var Points: int;
					
					switch (FLevel) {
						case 0:
							switch (FCommand) {
								case '@': // text_xy
									if (FDoTextCommand) {
										FDoTextCommand = false;
										RIP_TEXT_XY();
										if (FRIPParserState == RIPParserState.GotCommand) FRIPParserState = RIPParserState.None;
									}
									break;
								case '#': // no more
									RIP_NO_MORE();
									FRIPParserState = RIPParserState.None;
									break;
								case '*': // reset windows
									RIP_RESET_WINDOWS();
									FRIPParserState = RIPParserState.None;
									break;
								case '=': // line style
									if (FBuffer.length == 8) {
										RIP_LINE_STYLE();
										FRIPParserState = RIPParserState.None;	
									}
									break;
								case '>': // erase eol
									RIP_ERASE_EOL();
									FRIPParserState = RIPParserState.None;
									break;
								case 'A': // arc
									if (FBuffer.length == 10) {
										RIP_ARC();
										FRIPParserState = RIPParserState.None;	
									}
									break;
								case 'a': // one palette
									if (FBuffer.length == 4) {
										RIP_ONE_PALETTE();
										FRIPParserState = RIPParserState.None;
									}
									break;
								case 'B': // bar
									if (FBuffer.length == 8) {
										RIP_BAR();
										FRIPParserState = RIPParserState.None;
									}
									break;
								case 'C': // circle
									if (FBuffer.length == 6) {
										RIP_CIRCLE();
										FRIPParserState = RIPParserState.None;
									}
									break;
								case 'c': // colour
									if (FBuffer.length == 2) {
										RIP_COLOUR();
										FRIPParserState = RIPParserState.None;
									}
									break;
								case 'E': // erase view
									RIP_ERASE_VIEW();
									FRIPParserState = RIPParserState.None;
									break;
								case 'e': // erase window
									RIP_ERASE_WINDOW();
									FRIPParserState = RIPParserState.None;
									break;
								case 'F': // fill
									if (FBuffer.length == 6) {
										RIP_FILL();
										FRIPParserState = RIPParserState.None;
									}
									break;
								case 'g': // gotoxy
									if (FBuffer.length == 4) {
										RIP_GOTOXY();
										FRIPParserState = RIPParserState.None;
									}
									break;
								case 'H': // home
									RIP_HOME();
									FRIPParserState = RIPParserState.None;
									break;
								case 'I': // pie slice
									if (FBuffer.length == 10) {
										RIP_PIE_SLICE();
										FRIPParserState = RIPParserState.None;
									}
									break;
								case 'i': // oval pie slice
									if (FBuffer.length == 12) {
										RIP_OVAL_PIE_SLICE();
										FRIPParserState = RIPParserState.None;
									}
									break;
								case 'L': // line
									if (FBuffer.length == 8) {
										RIP_LINE();
										FRIPParserState = RIPParserState.None;
									}
									break;
								case 'l': // polyline
									if (FBuffer.length >= 2) {
										Points = parseInt(FBuffer.substr(0, 2), 36);
										if (FBuffer.length == (2 + (4 * Points))) {
											RIP_POLYLINE();
											FRIPParserState = RIPParserState.None;
										}
									}
									break;
								case 'm': // move
									if (FBuffer.length == 4) {
										RIP_MOVE();
										FRIPParserState = RIPParserState.None;
									}
									break;
								case 'O': // oval
									if (FBuffer.length == 12) {
										RIP_OVAL();
										FRIPParserState = RIPParserState.None;
									}
									break;
								case 'o': // filled oval
									if (FBuffer.length == 8) {
										RIP_FILLED_OVAL();
										FRIPParserState = RIPParserState.None;
									}
									break;
								case 'P': // polygon
									if (FBuffer.length >= 2) {
										Points = parseInt(FBuffer.substr(0, 2), 36);
										if (FBuffer.length == (2 + (4 * Points))) {
											RIP_POLYGON();
											FRIPParserState = RIPParserState.None;
										}
									}
									break;
								case 'p': // filled polygon
									if (FBuffer.length >= 2) {
										Points = parseInt(FBuffer.substr(0, 2), 36);
										if (FBuffer.length == (2 + (4 * Points))) {
											RIP_FILLED_POLYGON();
											FRIPParserState = RIPParserState.None;
										}
									}
									break;
								case 'Q': // set palette
									if (FBuffer.length == 32) {
										RIP_SET_PALETTE();										
										FRIPParserState = RIPParserState.None;
									}
									break;
								case 'R': // rectangle
									if (FBuffer.length == 8) {
										RIP_RECTANGLE();
										FRIPParserState = RIPParserState.None;
									}
									break;
								case 'S': // fill style
									if (FBuffer.length == 4) {
										RIP_FILL_STYLE();
										FRIPParserState = RIPParserState.None;
									}
									break;
								case 's': // fill pattern
									if (FBuffer.length == 18) {
										RIP_FILL_PATTERN();
										FRIPParserState = RIPParserState.None;
									}
									break;
								case 'T': // text
									if (FDoTextCommand) {
										FDoTextCommand = false;
										RIP_TEXT();
										if (FRIPParserState == RIPParserState.GotCommand) FRIPParserState = RIPParserState.None;
									}
									break;
								case 'V': // oval arc
									if (FBuffer.length == 12) {
										RIP_OVAL_ARC();
										FRIPParserState = RIPParserState.None;
									}
									break;
								case 'v': // view port
									if (FBuffer.length == 8) {
										RIP_VIEWPORT();
										FRIPParserState = RIPParserState.None;
									}
									break;
								case 'W': // write mode
									if (FBuffer.length == 2) {
										RIP_WRITE_MODE();
										FRIPParserState = RIPParserState.None;
									}
									break;
								case 'w': // text window
									if (FBuffer.length == 10) {
										RIP_TEXT_WINDOW();
										FRIPParserState = RIPParserState.None;										
									}
									break;
								case 'X': // pixel
									if (FBuffer.length == 4) {
										RIP_PIXEL();
										FRIPParserState = RIPParserState.None;
									}
									break;
								case 'Y': // font style
									if (FBuffer.length == 8) {
										// Peek to see what font is being requested
										var font: int = parseInt(FBuffer.substr(0, 2), 36);
										if (font > 0) {
											// Stroke font, ensure it has loaded
											if (StrokeFont.Loaded) { 
												RIP_FONT_STYLE();
												FRIPParserState = RIPParserState.None;
											} else {
												FWaitingForStrokeFont = true;
											}
										} else {
											RIP_FONT_STYLE();
											FRIPParserState = RIPParserState.None;
										}
									}
									break;
								case 'Z': // bezier
									if (FBuffer.length == 18) {
										RIP_BEZIER();
										FRIPParserState = RIPParserState.None;
									}
									break;
							}
							break;
						case 1:
							switch (FCommand) {
								case '\x1B': // query
									if (FDoTextCommand) {
										FDoTextCommand = false;
										RIP_QUERY();
										if (FRIPParserState == RIPParserState.GotCommand) FRIPParserState = RIPParserState.None;
									}
									break;
								case 'B': // button style
									if (FBuffer.length == 36) {
										RIP_BUTTON_STYLE();
										FRIPParserState = RIPParserState.None;
									}
									break;
								case 'C': // get image
									if (FBuffer.length == 9) {
										RIP_GET_IMAGE();
										FRIPParserState = RIPParserState.None;
									}
									break;
								case 'D': // define
									if (FDoTextCommand) {
										FDoTextCommand = false;
										RIP_DEFINE();
										if (FRIPParserState == RIPParserState.GotCommand) FRIPParserState = RIPParserState.None;
									}
									break;
								case 'E': // end text
									RIP_END_TEXT();
									FRIPParserState = RIPParserState.None;
									break;
								case 'F': // file query
									if (FDoTextCommand) {
										FDoTextCommand = false;
										RIP_FILE_QUERY();
										if (FRIPParserState == RIPParserState.GotCommand) FRIPParserState = RIPParserState.None;
									}
									break;
								case 'G': // copy region
									if (FBuffer.length == 12) {
										RIP_COPY_REGION();
										FRIPParserState = RIPParserState.None;
									}
									break;
								case 'I': // load icon
									if (FDoTextCommand) {
										FDoTextCommand = false;
										RIP_LOAD_ICON();
										if (FRIPParserState == RIPParserState.GotCommand) FRIPParserState = RIPParserState.None;
									}
									break;
								case 'K': // kill mouse fields
									RIP_KILL_MOUSE_FIELDS();
									FRIPParserState = RIPParserState.None;
									break;
								case 'M': // mouse
									if (FDoTextCommand) {
										FDoTextCommand = false;
										RIP_MOUSE();
										if (FRIPParserState == RIPParserState.GotCommand) FRIPParserState = RIPParserState.None;
									}
									break;
								case 'P': // put image
									if (FBuffer.length == 7) {
										RIP_PUT_IMAGE();
										FRIPParserState = RIPParserState.None;
									}
									break;
								case 'R': // read scene
									if (FDoTextCommand) {
										FDoTextCommand = false;
										RIP_READ_SCENE();
										if (FRIPParserState == RIPParserState.GotCommand) FRIPParserState = RIPParserState.None;
									}
									break;
								case 'T': // begin text
									if (FBuffer.length == 10) {
										RIP_BEGIN_TEXT();
										FRIPParserState = RIPParserState.None;
									}
									break;
								case 't': // region text
									if (FDoTextCommand) {
										FDoTextCommand = false;
										RIP_REGION_TEXT();
										if (FRIPParserState == RIPParserState.GotCommand) FRIPParserState = RIPParserState.None;
									}
									break;
								case 'U': // button
									if (FDoTextCommand) {
										FDoTextCommand = false;
										RIP_BUTTON();
										if (FRIPParserState == RIPParserState.GotCommand) FRIPParserState = RIPParserState.None;
									}
									break;
								case 'W': // write icon
									if (FDoTextCommand) {
										FDoTextCommand = false;
										RIP_WRITE_ICON();
										if (FRIPParserState == RIPParserState.GotCommand) FRIPParserState = RIPParserState.None;
									}
									break;
							}
							break;
						case 9:
							if (FCommand == '\x1B') {
								if (FDoTextCommand) {
									FDoTextCommand = false;
									RIP_ENTER_BLOCK_MODE();
									if (FRIPParserState == RIPParserState.GotCommand) FRIPParserState = RIPParserState.None;
								}
							}
							break;
					}
					
				}
			}
		}

		static private function OnMouseDown(me: MouseEvent): void
		{
			for (var i: int = FMouseFields.length - 1; i >= 0; i--) {
				var MB: TMouseButton = FMouseFields[i];
				
				// Hit test for this button
				if (me.localX < MB.Coords.left) continue;
				if (me.localX > MB.Coords.right) continue;
				if (me.localY < MB.Coords.top) continue;
				if (me.localY > MB.Coords.bottom) continue;
				
				// We're in the region, add events
				Graph.Canvas.removeEventListener(MouseEvent.MOUSE_DOWN, OnMouseDown);
				Graph.Canvas.addEventListener(MouseEvent.MOUSE_MOVE, OnMouseMove);
				Graph.Canvas.addEventListener(MouseEvent.MOUSE_UP, OnMouseUp);
				
				// Invert button
				if (MB.IsInvertable()) {
					Graph.Invert(MB.Coords.left, MB.Coords.top, MB.Coords.right, MB.Coords.bottom);
				}
				FButtonInverted = true;
				FButtonPressed = i;
				break;
			}
		}
		
		static private function OnMouseMove(me: MouseEvent): void
		{
			var MB: TMouseButton = FMouseFields[FButtonPressed];
			
			// Hit test for this button
			var Over: Boolean = true;
			if (me.localX < MB.Coords.left) Over = false;
			if (me.localX > MB.Coords.right) Over = false;
			if (me.localY < MB.Coords.top) Over = false;
			if (me.localY > MB.Coords.bottom) Over = false;
			
			// Check if we need to change the inversion
			if ((MB.IsInvertable()) && (Over != FButtonInverted)) {
				Graph.Invert(MB.Coords.left, MB.Coords.top, MB.Coords.right, MB.Coords.bottom);
				FButtonInverted = Over;
			}
		}
		
		static private function OnMouseUp(me: MouseEvent): void
		{
			Graph.Canvas.removeEventListener(MouseEvent.MOUSE_UP, OnMouseUp);
			Graph.Canvas.removeEventListener(MouseEvent.MOUSE_MOVE, OnMouseMove);
			Graph.Canvas.addEventListener(MouseEvent.MOUSE_DOWN, OnMouseDown);

			var MB: TMouseButton = FMouseFields[FButtonPressed];
			
			// Hit test for this button
			var Over: Boolean = true;
			if (me.localX < MB.Coords.left) Over = false;
			if (me.localX > MB.Coords.right) Over = false;
			if (me.localY < MB.Coords.top) Over = false;
			if (me.localY > MB.Coords.bottom) Over = false;
			
			if (Over) {
				if (MB.IsInvertable() && FButtonInverted) {
					Graph.Invert(MB.Coords.left, MB.Coords.top, MB.Coords.right, MB.Coords.bottom);
				}
				FButtonInverted = false;
				FButtonPressed = -1;
				
				HandleMouseButton(MB);				
			}
		}
		
		static private function OnPopUpClick(AResponse: String): void 
		{
			for (var i: int = 0; i < AResponse.length; i++) {
				FKeyBuf.push(new KeyPressEvent(KEY_PRESSED, new KeyboardEvent(KeyboardEvent.KEY_DOWN), AResponse.charAt(i)));
			}
		}
		
		// Draw a Poly-Line (multi-faceted line)
		// Status: Fully Implemented, since Line() handles the logic
		static public function PolyLine(points: Array): void
		{
			// Display each line
			var pointslength: int = points.length;
			for (var i: int = 1; i < pointslength; i++) {
				Graph.Line(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
			}
		}
		
		// Query the contents of a text variable
		// Status: Partially Implemented
		// Notes: lots to do here!
		static public function Query(mode: int, text: String): void
		{
			if (mode != 0) {
				trace("Query() only supports immediate execution");
				mode = 0;
			}

			if (text == "$ETW$") {
				Graph.ClearTextWindow();
			} else if (text == "$SBAROFF$") {
				// We don't have a status-bar anyway, so nothing to do here
			} else {
				trace("Query(" + text + ") is not handled");
			}
		}
		
		static public function ReadKey(): KeyPressEvent
		{
			if (FKeyBuf.length == 0) return null;
			
			return FKeyBuf.shift();
		}
		
		// Playback local .RIP file
		// Status: Not Implemented
		static public function ReadScene(filename: String): void
		{
			trace("ReadScene() is not handled");
		}
		
		// Display a line of text in rectangular text region
		// Status: Not Implemented
		static public function RegionText(justify: int, text: String): void
		{
			trace("RegionText() is not handled");
		}

		// Clear Graphics/Text Windows & reset to full screen
		// Status: Fully Implemented, since the logic is all handled elsewhere
		static public function ResetWindows(): void
		{
			KillMouseFields();

			Graph.SetTextWindow(0, 0, 79, 42, 1, 0);
			Crt.ClrScr(); // No need to call ClearTextWindow() since GraphDefaults() will clear the whole screen

			Graph.GraphDefaults();
			
			FClipboard = null;
		}
		
		static private function RIP_ARC(): void
		{
			var xcenter: int = parseInt(FBuffer.substr(0, 2), 36);
			var ycenter: int = parseInt(FBuffer.substr(2, 2), 36);
			var startangle: int = parseInt(FBuffer.substr(4, 2), 36);
			var endangle: int = parseInt(FBuffer.substr(6, 2), 36);
			var radius: int = parseInt(FBuffer.substr(8, 2), 36);
			
			//BENCHMARK FTimer = getTimer();
			Graph.Arc(xcenter, ycenter, startangle, endangle, radius);
			//BENCHMARK trace((getTimer() - FTimer) + " Arc(" + xcenter + ", " + ycenter + ", " +  startangle + ", " +  endangle + ", " +  radius + ");");
		}
		
		static private function RIP_BAR(): void
		{
			var x1: int = parseInt(FBuffer.substr(0, 2), 36);
			var y1: int = parseInt(FBuffer.substr(2, 2), 36);
			var x2: int = parseInt(FBuffer.substr(4, 2), 36);
			var y2: int = parseInt(FBuffer.substr(6, 2), 36);

			//BENCHMARK FTimer = getTimer();
			Graph.Bar(x1, y1, x2, y2);
			//BENCHMARK trace((getTimer() - FTimer) + " Bar(" + x1 + ", " + y1 + ", " + x2 + ", " + y2 + ");");
		}
		
		static private function RIP_BEGIN_TEXT(): void
		{
			var x1: int = parseInt(FBuffer.substr(0, 2), 36);
			var y1: int = parseInt(FBuffer.substr(2, 2), 36);
			var x2: int = parseInt(FBuffer.substr(4, 2), 36);
			var y2: int = parseInt(FBuffer.substr(6, 2), 36);
			var reserved: int = parseInt(FBuffer.substr(8, 2), 36);
			
			//BENCHMARK FTimer = getTimer();
			BeginText(x1, y1, x2, y2);
			//BENCHMARK trace((getTimer() - FTimer) + " BeginText(" + x1 + ", " + y1 + ", " + x2 + ", " + y2 + ");");
		}
		
		static private function RIP_BEZIER(): void
		{
			var x1: int = parseInt(FBuffer.substr(0, 2), 36);
			var y1: int = parseInt(FBuffer.substr(2, 2), 36);
			var x2: int = parseInt(FBuffer.substr(4, 2), 36);
			var y2: int = parseInt(FBuffer.substr(6, 2), 36);
			var x3: int = parseInt(FBuffer.substr(8, 2), 36);
			var y3: int = parseInt(FBuffer.substr(10, 2), 36);
			var x4: int = parseInt(FBuffer.substr(12, 2), 36);
			var y4: int = parseInt(FBuffer.substr(14, 2), 36);
			var count: int = parseInt(FBuffer.substr(16, 2), 36);
			
			//BENCHMARK FTimer = getTimer();
			Graph.Bezier(x1, y1, x2, y2, x3, y3, x4, y4, count);
			//BENCHMARK trace((getTimer() - FTimer) + " Bezier(" + x1 + ", " + y1 + ", " +  x2 + ", " +  y2 + ", " +  x3 + ", " +  y3 + ", " +  x4 + ", " +  y4 + ", " + count + ");");
		}
		
		static private function RIP_BUTTON(): void
		{
			var x1: int = parseInt(FBuffer.substr(0, 2), 36);
			var y1: int = parseInt(FBuffer.substr(2, 2), 36);
			var x2: int = parseInt(FBuffer.substr(4, 2), 36);
			var y2: int = parseInt(FBuffer.substr(6, 2), 36);
			var hotkey: int = parseInt(FBuffer.substr(8, 2), 36);
			var flags: int = parseInt(FBuffer.substr(10, 1), 36);
			var reserved: int = parseInt(FBuffer.substr(11, 1), 36);
			var text: String = FBuffer.substr(12, FBuffer.length - 12);
			
			//BENCHMARK FTimer = getTimer();
			Button(x1, y1, x2, y2, hotkey, flags, text);
			//BENCHMARK trace((getTimer() - FTimer) + " Button(" + x1 + ", " + y1 + ", " + x2 + ", " + y2 + ", " + hotkey + ", " + flags + ", " + text + ");");
		}
		
		static private function RIP_BUTTON_STYLE(): void
		{
			var width: int = parseInt(FBuffer.substr(0, 2), 36);
			var height: int = parseInt(FBuffer.substr(2, 2), 36);
			var orientation: int = parseInt(FBuffer.substr(4, 2), 36);
			var flags: int = parseInt(FBuffer.substr(6, 4), 36);
			var bevelsize: int = parseInt(FBuffer.substr(10, 2), 36);
			var dfore: int = parseInt(FBuffer.substr(12, 2), 36);
			var dback: int = parseInt(FBuffer.substr(14, 2), 36);
			var bright: int = parseInt(FBuffer.substr(16, 2), 36);
			var dark: int = parseInt(FBuffer.substr(18, 2), 36);
			var surface: int = parseInt(FBuffer.substr(20, 2), 36);
			var groupid: int = parseInt(FBuffer.substr(22, 2), 36);
			var flags2: int = parseInt(FBuffer.substr(24, 2), 36);
			var underlinecolour: int = parseInt(FBuffer.substr(26, 2), 36);
			var cornercolour: int = parseInt(FBuffer.substr(28, 2), 36);
			var reserved: int = parseInt(FBuffer.substr(30, 6), 36);
			
			//BENCHMARK FTimer = getTimer();
			SetButtonStyle(width, height, orientation, flags, bevelsize, dfore, dback, bright, dark, surface, groupid, flags2, underlinecolour, cornercolour);
			//BENCHMARK trace((getTimer() - FTimer) + " SetButtonStyle(" + width + ", " + height + ", " + orientation + ", " + flags + ", " + bevelsize + ", " + dfore + ", " + dback + ", " + bright + ", " + dark + ", " + surface + ", " + groupid + ", " + flags2 + ", " + underlinecolour + ", " + cornercolour + ");");
		}

		static private function RIP_CIRCLE(): void
		{
			var xcenter: int = parseInt(FBuffer.substr(0, 2), 36);
			var ycenter: int = parseInt(FBuffer.substr(2, 2), 36);
			var radius: int = parseInt(FBuffer.substr(4, 2), 36);
			
			//BENCHMARK FTimer = getTimer();
			Graph.Circle(xcenter, ycenter, radius);
			//BENCHMARK trace((getTimer() - FTimer) + " Circle(" + xcenter + ", " + ycenter + ", " + radius + ");");
		}

		static private function RIP_COLOUR(): void
		{
			var colour: int = parseInt(FBuffer.substr(0, 2), 36);

			//BENCHMARK FTimer = getTimer();
			Graph.SetColour(colour);
			//BENCHMARK trace((getTimer() - FTimer) + " SetColour(" + colour + ");");
		}
		
		static private function RIP_COPY_REGION(): void
		{
			var x1: int = parseInt(FBuffer.substr(0, 2), 36);
			var y1: int = parseInt(FBuffer.substr(2, 2), 36);
			var x2: int = parseInt(FBuffer.substr(4, 2), 36);
			var y2: int = parseInt(FBuffer.substr(6, 2), 36);
			var reserved: int = parseInt(FBuffer.substr(8, 2), 36);
			var desty: int = parseInt(FBuffer.substr(10, 2), 36);
			
			//BENCHMARK FTimer = getTimer();
			CopyRegion(x1, y1, x2, y2, desty);
			//BENCHMARK trace((getTimer() - FTimer) + " CopyRegion(" + x1 + ", " + y1 + ", " + x2 + ", " + y2 + ", " + desty + ");");
		}
		
		// Define a text variable
		// Status: Not Implemented
		static private function RIP_DEFINE(): void
		{
			var flags: int = parseInt(FBuffer.substr(0, 3), 36);
			var reserved: int = parseInt(FBuffer.substr(3, 2), 36);
			var text: String = FBuffer.substr(5, FBuffer.length - 5);

			//BENCHMARK FTimer = getTimer();
			Define(flags, text);
			//BENCHMARK trace((getTimer() - FTimer) + " Define(" + flags + ", " + text + ");");
		}
		
		static private function RIP_END_TEXT(): void
		{
			//BENCHMARK FTimer = getTimer();
			EndText();
			//BENCHMARK trace((getTimer() - FTimer) + " EndText();");
		}
		
		// Enter block transfer mode with host
		// Status: Not Implemented
		static private function RIP_ENTER_BLOCK_MODE(): void
		{
			var mode: int = parseInt(FBuffer.substr(0, 1), 36);
			var protocol: int = parseInt(FBuffer.substr(1, 1), 36);
			var filetype: int = parseInt(FBuffer.substr(2, 2), 36);
			var reserved: int = parseInt(FBuffer.substr(4, 4), 36);
			var filename: String = FBuffer.substr(8, FBuffer.length - 8);

			//BENCHMARK FTimer = getTimer();
			EnterBlockMode(mode, protocol, filetype, filename);
			//BENCHMARK trace((getTimer() - FTimer) + " EnterBlockMode(" + mode + ", " + protocol + ", " + filetype + ", " + filename + ");");
		}
		
		static private function RIP_ERASE_EOL(): void
		{
			//BENCHMARK FTimer = getTimer();
			Graph.EraseEOL();
			//BENCHMARK trace((getTimer() - FTimer) + " EraseEOL();");
		}

		static private function RIP_ERASE_VIEW(): void
		{
			//BENCHMARK FTimer = getTimer();
			Graph.ClearViewPort();
			//BENCHMARK trace((getTimer() - FTimer) + " EraseView();");
		}
		
		static private function RIP_ERASE_WINDOW(): void
		{
			//BENCHMARK FTimer = getTimer();
			Graph.ClearTextWindow();
			//BENCHMARK trace((getTimer() - FTimer) + " EraseWindow();");
		}
		
		// Query existing information on a particular file
		// Status: Not Implemented
		static private function RIP_FILE_QUERY(): void
		{
			var mode: int = parseInt(FBuffer.substr(0, 2), 36);
			var reserved: int = parseInt(FBuffer.substr(2, 4), 36);
			var filename: String = FBuffer.substr(6, FBuffer.length - 6);
			
			//BENCHMARK FTimer = getTimer();
			FileQuery(mode, filename);
			//BENCHMARK trace((getTimer() - FTimer) + " FileQuery(" + mode + ", " + filename + ");");
		}
		
		static private function RIP_FILL(): void
		{
			var x: int = parseInt(FBuffer.substr(0, 2), 36);
			var y: int = parseInt(FBuffer.substr(2, 2), 36);
			var border: int = parseInt(FBuffer.substr(4, 2), 36);

			//BENCHMARK FTimer = getTimer();
			Graph.FloodFill(x, y, border);
			//BENCHMARK trace((getTimer() - FTimer) + " Fill(" + x + ", " + y + ", " + border + ");");
		}
		
		static private function RIP_FILL_PATTERN(): void
		{
			var c1: int = parseInt(FBuffer.substr(0, 2), 36);
			var c2: int = parseInt(FBuffer.substr(2, 2), 36);
			var c3: int = parseInt(FBuffer.substr(4, 2), 36);
			var c4: int = parseInt(FBuffer.substr(6, 2), 36);
			var c5: int = parseInt(FBuffer.substr(8, 2), 36);
			var c6: int = parseInt(FBuffer.substr(10, 2), 36);
			var c7: int = parseInt(FBuffer.substr(12, 2), 36);
			var c8: int = parseInt(FBuffer.substr(14, 2), 36);
			var colour: int = parseInt(FBuffer.substr(16, 2), 36);

			//BENCHMARK FTimer = getTimer();
			Graph.SetFillStyle(FillStyle.User, colour);
			Graph.SetFillPattern(Vector.<int>([c1, c2, c3, c4, c5, c6, c7, c8]), colour);
			//BENCHMARK trace((getTimer() - FTimer) + " SetFillPattern(" + c1 + ", " + c2 + ", " + c3 + ", " + c4 + ", " + c5 + ", " + c6 + ", " + c7 + ", " + c8 + ", " + colour + ");");
		}
		
		static private function RIP_FILL_STYLE(): void
		{
			var pattern: int = parseInt(FBuffer.substr(0, 2), 36);
			var colour: int = parseInt(FBuffer.substr(2, 2), 36);

			//BENCHMARK FTimer = getTimer();
			Graph.SetFillStyle(pattern, colour);
			//BENCHMARK trace((getTimer() - FTimer) + " SetFillStyle(" + pattern + ", " + colour + ");");
		}

		static private function RIP_FILLED_OVAL(): void
		{
			var xcenter: int = parseInt(FBuffer.substr(0, 2), 36);
			var ycenter: int = parseInt(FBuffer.substr(2, 2), 36);
			var xradius: int = parseInt(FBuffer.substr(4, 2), 36);
			var yradius: int = parseInt(FBuffer.substr(6, 2), 36);
			
			//BENCHMARK FTimer = getTimer();
			Graph.FillEllipse(xcenter, ycenter, xradius, yradius);
			//BENCHMARK trace((getTimer() - FTimer) + " Graph.FillEllipse(" + xcenter + ", " + ycenter + ", " + xradius + ", " + yradius + ");");
		}
		
		static private function RIP_FILLED_POLYGON(): void
		{
			//BENCHMARK FTimer = getTimer();
			var count: int = parseInt(FBuffer.substr(0, 2), 36);
			var points: Vector.<Point> = new Vector.<Point>(count);
			
			if (count >= 2) {
				for (var i: int = 0; i < count; i++) {
					points[i] = new Point(parseInt(FBuffer.substr(2 + (i * 4), 2), 36), parseInt(FBuffer.substr(4 + (i * 4), 2), 36));
				}
				points.push(new Point(points[0].x, points[0].y));
				
				Graph.FillPoly(points);
				//BENCHMARK trace((getTimer() - FTimer) + " FillPoly(" + points.toString() + ");");
			} else {
				trace("RIP_FILLED_POLYGON with " + count + " points is not allowed");
			}
		}
		
		static private function RIP_FONT_STYLE(): void
		{
			var font: int = parseInt(FBuffer.substr(0, 2), 36);
			var direction: int = parseInt(FBuffer.substr(2, 2), 36);
			var size: int = parseInt(FBuffer.substr(4, 2), 36);
			var reserved: int = parseInt(FBuffer.substr(6, 2), 36);
			
			//BENCHMARK FTimer = getTimer();
			Graph.SetTextStyle(font, direction, size);
			//BENCHMARK trace((getTimer() - FTimer) + " SetFontStyle(" + font + ", " + direction + ", " + size + ");");
		}

		static private function RIP_GET_IMAGE(): void
		{
			var x1: int = parseInt(FBuffer.substr(0, 2), 36);
			var y1: int = parseInt(FBuffer.substr(2, 2), 36);
			var x2: int = parseInt(FBuffer.substr(4, 2), 36);
			var y2: int = parseInt(FBuffer.substr(6, 2), 36);
			var reserved: int = parseInt(FBuffer.substr(7, 1), 36);

			if ((x1 > x2) || (y1 > y2)) {
				trace("TODO Invalid coordinates: " + x1 + "," + y1 + " to " + x2 + "," + y2);
				return;
			}
			
			//BENCHMARK FTimer = getTimer();
			FClipboard = Graph.GetImage(x1, y1, x2, y2);
			//BENCHMARK trace((getTimer() - FTimer) + " GetImage(" + x1 + ", " + y1 + ", " + x2 + ", " + y2 + ");");
		}
		
		static private function RIP_GOTOXY(): void
		{
			var x: int = parseInt(FBuffer.substr(0, 2), 36);
			var y: int = parseInt(FBuffer.substr(2, 2), 36);

			//BENCHMARK FTimer = getTimer();
			Crt.GotoXY(x, y);
			//BENCHMARK trace((getTimer() - FTimer) + " Crt.GotoXY(" + x + ", " + y + ");");
		}
		
		static private function RIP_HOME(): void
		{
			//BENCHMARK FTimer = getTimer();
			Crt.GotoXY(1, 1);
			//BENCHMARK trace((getTimer() - FTimer) + " Crt.GotoXY(1, 1);");
		}
		
		static private function RIP_KILL_MOUSE_FIELDS(): void
		{
			//BENCHMARK FTimer = getTimer();
			KillMouseFields();
			//BENCHMARK trace((getTimer() - FTimer) + " KillMouseFields();");
		}
		
		static private function RIP_LINE(): void
		{
			var x1: int = parseInt(FBuffer.substr(0, 2), 36);
			var y1: int = parseInt(FBuffer.substr(2, 2), 36);
			var x2: int = parseInt(FBuffer.substr(4, 2), 36);
			var y2: int = parseInt(FBuffer.substr(6, 2), 36);
			
			//BENCHMARK FTimer = getTimer();
			Graph.Line(x1, y1, x2, y2);
			//BENCHMARK trace((getTimer() - FTimer) + " Line(" + x1 + ", " + y1 + ", " + x2 + ", " + y2 + ");");
		}

		static private function RIP_LINE_STYLE(): void
		{
			var style: int = parseInt(FBuffer.substr(0, 2), 36);
			var userpattern: int = parseInt(FBuffer.substr(2, 4), 36);
			var thickness: int = parseInt(FBuffer.substr(6, 2), 36);
			
			//BENCHMARK FTimer = getTimer();
			Graph.SetLineStyle(style, userpattern, thickness);
			//BENCHMARK trace((getTimer() - FTimer) + " SetLineStyle(" + style + ", " + userpattern + ", " + thickness + ");");
		}

		static private function RIP_LOAD_ICON(): void
		{
			var x: int = parseInt(FBuffer.substr(0, 2), 36);
			var y: int = parseInt(FBuffer.substr(2, 2), 36);
			var mode: int = parseInt(FBuffer.substr(4, 2), 36);
			var clipboard: int = parseInt(FBuffer.substr(6, 1), 36);
			var reserved: int = parseInt(FBuffer.substr(7, 2), 36);
			var filename: String = FBuffer.substr(9, FBuffer.length - 9);

			//BENCHMARK FTimer = getTimer();
			LoadIcon(x, y, mode, clipboard, filename);
			//BENCHMARK trace((getTimer() - FTimer) + " LoadIcon(" + x + ", " + y + ", " + mode + ", " + clipboard + ", " + filename + ");");
		}
		
		// Defines a rectangular hot mouse region
		// Status: Not Implemented
		static private function RIP_MOUSE(): void
		{
			var num: int = parseInt(FBuffer.substr(0, 2), 36);
			var x1: int = parseInt(FBuffer.substr(2, 2), 36);
			var y1: int = parseInt(FBuffer.substr(4, 2), 36);
			var x2: int = parseInt(FBuffer.substr(6, 2), 36);
			var y2: int = parseInt(FBuffer.substr(8, 2), 36);
			var invert: int = parseInt(FBuffer.substr(10, 1), 36);
			var clear: int = parseInt(FBuffer.substr(11, 1), 36);
			var reserved: int = parseInt(FBuffer.substr(12, 5), 36);
			var hostcommand: String = FBuffer.substr(17, FBuffer.length - 17);

			//BENCHMARK FTimer = getTimer();
			// TODO Move this into a function
			var flags: int = 0;
			if (invert == 1) flags |= 2;
			if (clear == 1) flags |= 4;
			FMouseFields.push(new TMouseButton(new Rectangle(x1, y1, x2 - x1 + 1, y2 - y1 + 1), hostcommand, flags, ""));
			//BENCHMARK trace((getTimer() - FTimer) + " FMouseFields.push(new TMouseButton(new Rectangle(" + x1 + ", " + y1 + ", " + (x2 - x1 + 1) + ", " + (y2 - y1 + 1) + "), " + hostcommand + ", " + flags + ", " + "''));");
		}
		
		static private function RIP_MOVE(): void
		{
			var x: int = parseInt(FBuffer.substr(0, 2), 36);
			var y: int = parseInt(FBuffer.substr(2, 2), 36);
			
			//BENCHMARK FTimer = getTimer();
			Graph.MoveTo(x, y);
			//BENCHMARK trace((getTimer() - FTimer) + " Graph.MoveTo(" + x + ", " + y + ");");
		}
		
		static private function RIP_NO_MORE(): void
		{
			// Nothing to do here
		}
		
		static private function RIP_ONE_PALETTE(): void
		{
			var colour: int = parseInt(FBuffer.substr(0, 2), 36);
			var value: int = parseInt(FBuffer.substr(2, 2), 36);

			//BENCHMARK FTimer = getTimer();
			Graph.SetPalette(colour, value);
			//BENCHMARK trace((getTimer() - FTimer) + " OnePalette(" + colour + ", " + value + ");");
		}
		
		static private function RIP_OVAL(): void
		{
			var xcenter: int = parseInt(FBuffer.substr(0, 2), 36);
			var ycenter: int = parseInt(FBuffer.substr(2, 2), 36);
			var startangle: int = parseInt(FBuffer.substr(4, 2), 36);
			var endangle: int = parseInt(FBuffer.substr(6, 2), 36);
			var xradius: int = parseInt(FBuffer.substr(8, 2), 36);
			var yradius: int = parseInt(FBuffer.substr(10, 2), 36);
			
			//BENCHMARK FTimer = getTimer();
			Graph.Ellipse(xcenter, ycenter, startangle, endangle, xradius, yradius);
			//BENCHMARK trace((getTimer() - FTimer) + " Oval(" + xcenter + ", " + ycenter + ", " +  startangle + ", " +  endangle + ", " +  xradius + ", " +  yradius + ");");
		}

		static private function RIP_OVAL_ARC(): void
		{
			var xcenter: int = parseInt(FBuffer.substr(0, 2), 36);
			var ycenter: int = parseInt(FBuffer.substr(2, 2), 36);
			var startangle: int = parseInt(FBuffer.substr(4, 2), 36);
			var endangle: int = parseInt(FBuffer.substr(6, 2), 36);
			var xradius: int = parseInt(FBuffer.substr(8, 2), 36);
			var yradius: int = parseInt(FBuffer.substr(10, 2), 36);
			
			//BENCHMARK FTimer = getTimer();
			Graph.Ellipse(xcenter, ycenter, startangle, endangle, xradius, yradius);
			//BENCHMARK trace((getTimer() - FTimer) + " OvalArc(" + xcenter + ", " + ycenter + ", " +  startangle + ", " +  endangle + ", " +  xradius + ", " +  yradius + ");");
		}

		static private function RIP_OVAL_PIE_SLICE(): void
		{
			var xcenter: int = parseInt(FBuffer.substr(0, 2), 36);
			var ycenter: int = parseInt(FBuffer.substr(2, 2), 36);
			var startangle: int = parseInt(FBuffer.substr(4, 2), 36);
			var endangle: int = parseInt(FBuffer.substr(6, 2), 36);
			var xradius: int = parseInt(FBuffer.substr(8, 2), 36);
			var yradius: int = parseInt(FBuffer.substr(10, 2), 36);
			
			//BENCHMARK FTimer = getTimer();
			Graph.Sector(xcenter, ycenter, startangle, endangle, xradius, yradius);
			//BENCHMARK trace((getTimer() - FTimer) + " Graph.Sector(" + xcenter + ", " + ycenter + ", " +  startangle + ", " +  endangle + ", " +  xradius + ", " +  yradius + ");");
		}
		
		static private function RIP_PIE_SLICE(): void
		{
			var xcenter: int = parseInt(FBuffer.substr(0, 2), 36);
			var ycenter: int = parseInt(FBuffer.substr(2, 2), 36);
			var startangle: int = parseInt(FBuffer.substr(4, 2), 36);
			var endangle: int = parseInt(FBuffer.substr(6, 2), 36);
			var radius: int = parseInt(FBuffer.substr(8, 2), 36);
			
			//BENCHMARK FTimer = getTimer();
			Graph.PieSlice(xcenter, ycenter, startangle, endangle, radius);
			//BENCHMARK trace((getTimer() - FTimer) + " Graph.PieSlice(" + xcenter + ", " + ycenter + ", " +  startangle + ", " +  endangle + ", " +  radius + ");");
		}
		
		static private function RIP_PIXEL(): void
		{
			var x: int = parseInt(FBuffer.substr(0, 2), 36);
			var y: int = parseInt(FBuffer.substr(2, 2), 36);
			
			//BENCHMARK FTimer = getTimer();
			Graph.PutPixel(x, y, Graph.GetColour());
			//BENCHMARK trace((getTimer() - FTimer) + " Pixel(" + x + ", " + y + ");");
		}
		
		static private function RIP_POLYGON(): void
		{
			//BENCHMARK FTimer = getTimer();
			var count: int = parseInt(FBuffer.substr(0, 2), 36);
			var points: Vector.<Point> = new Vector.<Point>(count);

			for (var i: int = 0; i < count; i++) {
				points[i] = new Point(parseInt(FBuffer.substr(2 + (i * 4), 2), 36), parseInt(FBuffer.substr(4 + (i * 4), 2), 36));
			}
			points.push(new Point(points[0].x, points[0].y));

			Graph.DrawPoly(points);
			//BENCHMARK trace((getTimer() - FTimer) + " DrawPoly(" + points.toString() + ");");
		}

		static private function RIP_POLYLINE(): void
		{
			//BENCHMARK FTimer = getTimer();
			var count: int = parseInt(FBuffer.substr(0, 2), 36);
			var points: Vector.<Point> = new Vector.<Point>(count);

			for (var i: int = 0; i < count; i++) {
				points[i] = new Point(parseInt(FBuffer.substr(2 + (i * 4), 2), 36), parseInt(FBuffer.substr(4 + (i * 4), 2), 36));
			}
			
			Graph.DrawPoly(points);
			//BENCHMARK trace((getTimer() - FTimer) + " DrawPoly(" + points.toString() + ");");
		}

		static private function RIP_PUT_IMAGE(): void
		{
			var x: int = parseInt(FBuffer.substr(0, 2), 36);
			var y: int = parseInt(FBuffer.substr(2, 2), 36);
			var mode: int = parseInt(FBuffer.substr(4, 2), 36);
			var reserved: int = parseInt(FBuffer.substr(6, 1), 36);

			//BENCHMARK FTimer = getTimer();
			Graph.PutImage(x, y, FClipboard, mode);
			//BENCHMARK trace((getTimer() - FTimer) + " PutImage(" + x + ", " + y + ", " + mode + ");");
		}
		
		static private function RIP_QUERY(): void
		{
			var mode: int = parseInt(FBuffer.substr(0, 1), 36);
			var reserved: int = parseInt(FBuffer.substr(1, 3), 36);
			var text: String = FBuffer.substr(4, FBuffer.length - 4);

			//BENCHMARK FTimer = getTimer();
			Query(mode, text);
			//BENCHMARK trace((getTimer() - FTimer) + " Query(" + mode + ", " + text + ");");
		}
		
		// Playback local .RIP file
		// Status: Not Implemented
		static private function RIP_READ_SCENE(): void
		{
			var reserved: int = parseInt(FBuffer.substr(0, 8), 36);
			var filename: String = FBuffer.substr(8, FBuffer.length - 8);
			
			//BENCHMARK FTimer = getTimer();
			ReadScene(filename);
			//BENCHMARK trace((getTimer() - FTimer) + " ReadScene(" + filename + ");");
		}
		
		static private function RIP_RECTANGLE(): void
		{
			var x1: int = parseInt(FBuffer.substr(0, 2), 36);
			var y1: int = parseInt(FBuffer.substr(2, 2), 36);
			var x2: int = parseInt(FBuffer.substr(4, 2), 36);
			var y2: int = parseInt(FBuffer.substr(6, 2), 36);

			//BENCHMARK FTimer = getTimer();
			Graph.Rectangle(x1, y1, x2, y2);
			//BENCHMARK trace((getTimer() - FTimer) + " Rectangle(" + x1 + ", " + y1 + ", " + x2 + ", " + y2 + ");");
		}

		// Display a line of text in rectangular text region
		// Status: Not Implemented
		static private function RIP_REGION_TEXT(): void
		{
			var justify: int = parseInt(FBuffer.substr(0, 1), 36);
			var text: String = FBuffer.substr(1, FBuffer.length - 1);
			
			//BENCHMARK FTimer = getTimer();
			RegionText(justify, text);
			//BENCHMARK trace((getTimer() - FTimer) + " RegionText(" + justify + ", " + text + ");");
		}
		
		static private function RIP_RESET_WINDOWS(): void
		{
			//BENCHMARK FTimer = getTimer();
			ResetWindows();
			//BENCHMARK trace((getTimer() - FTimer) + " ResetWindows();");
		}

		static private function RIP_SET_PALETTE(): void
		{
			var c1: int = parseInt(FBuffer.substr(0, 2), 36);
			var c2: int = parseInt(FBuffer.substr(2, 2), 36);
			var c3: int = parseInt(FBuffer.substr(4, 2), 36);
			var c4: int = parseInt(FBuffer.substr(6, 2), 36);
			var c5: int = parseInt(FBuffer.substr(8, 2), 36);
			var c6: int = parseInt(FBuffer.substr(10, 2), 36);
			var c7: int = parseInt(FBuffer.substr(12, 2), 36);
			var c8: int = parseInt(FBuffer.substr(14, 2), 36);
			var c9: int = parseInt(FBuffer.substr(16, 2), 36);
			var c10: int = parseInt(FBuffer.substr(18, 2), 36);
			var c11: int = parseInt(FBuffer.substr(20, 2), 36);
			var c12: int = parseInt(FBuffer.substr(22, 2), 36);
			var c13: int = parseInt(FBuffer.substr(24, 2), 36);
			var c14: int = parseInt(FBuffer.substr(26, 2), 36);
			var c15: int = parseInt(FBuffer.substr(28, 2), 36);
			var c16: int = parseInt(FBuffer.substr(30, 2), 36);

			//BENCHMARK FTimer = getTimer();
			Graph.SetAllPalette(Vector.<int>([c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14, c15, c16]));
			//BENCHMARK trace((getTimer() - FTimer) + " SetPalette(" + c1 + ", " + c2 + ", " + c3 + ", " + c4 + ", " + c5 + ", " + c6 + ", " + c7 + ", " + c8 + ", " + c9 + ", " + c10 + ", " + c11 + ", " + c12 + ", " + c13 + ", " + c14 + ", " + c15 + ", " + c16 + ");");
		}

		static private function RIP_TEXT(): void
		{
			var text: String = FBuffer;
			
			//BENCHMARK FTimer = getTimer();
			Graph.SetTextJustify(TextJustification.Left, TextJustification.Top);
			Graph.OutText(text);
			//BENCHMARK trace((getTimer() - FTimer) + " OutText(" + text + ");");
		}

		static private function RIP_TEXT_WINDOW(): void
		{
			var x1: int = parseInt(FBuffer.substr(0, 2), 36);
			var y1: int = parseInt(FBuffer.substr(2, 2), 36);
			var x2: int = parseInt(FBuffer.substr(4, 2), 36);
			var y2: int = parseInt(FBuffer.substr(6, 2), 36);
			var wrap: int = parseInt(FBuffer.substr(8, 1), 36);
			var size: int = parseInt(FBuffer.substr(9, 1), 36);
			
			//BENCHMARK FTimer = getTimer();
			Graph.SetTextWindow(x1, y1, x2, y2, wrap, size);
			//BENCHMARK trace((getTimer() - FTimer) + " SetTextWindow(" + x1 + ", " + y1 + ", " + x2 + ", " + y2 + ", " + wrap + ", " + size + ");");
		}
		
		static private function RIP_TEXT_XY(): void
		{
			var x: int = parseInt(FBuffer.substr(0, 2), 36);
			var y: int = parseInt(FBuffer.substr(2, 2), 36);
			var text: String = FBuffer.substr(4, FBuffer.length - 4);

			//BENCHMARK FTimer = getTimer();
			Graph.SetTextJustify(TextJustification.Left, TextJustification.Top);
			Graph.OutTextXY(x, y, text);
			//BENCHMARK trace((getTimer() - FTimer) + " TextXY(" + x + ", " + y + ", " + text + ");");
		}
		
		static private function RIP_VIEWPORT(): void
		{
			var x1: int = parseInt(FBuffer.substr(0, 2), 36);
			var y1: int = parseInt(FBuffer.substr(2, 2), 36);
			var x2: int = parseInt(FBuffer.substr(4, 2), 36);
			var y2: int = parseInt(FBuffer.substr(6, 2), 36);

			//BENCHMARK FTimer = getTimer();
			Graph.SetViewPort(x1, y1, x2, y2, true);
			//BENCHMARK trace((getTimer() - FTimer) + " SetViewPort(" + x1 + ", " + y1 + ", " + x2 + ", " + y2 + ");");
		}
		
		// Write contents of the clipboard (icon) to disk
		// Status: Not Implemented
		static private function RIP_WRITE_ICON(): void
		{
			var reserved: int = parseInt(FBuffer.substr(0, 1), 36);
			var filename: String = FBuffer.substr(1, FBuffer.length - 1);
			
			//BENCHMARK FTimer = getTimer();
			WriteIcon(filename);
			//BENCHMARK trace((getTimer() - FTimer) + " WriteIcon(" + filename + ");");
		}

		static private function RIP_WRITE_MODE(): void
		{
			var mode: int = parseInt(FBuffer.substr(0, 2), 36);
			
			//BENCHMARK FTimer = getTimer();
			Graph.SetWriteMode(mode);
			//BENCHMARK trace((getTimer() - FTimer) + " SetWriteMode(" + mode + ");");
		}
		
		// Button style definition
		// Status: Partially Implemented
		// Notes: TButtonStyle shouldn't use ints for things that dont make sense, should add additional fields to expand flags
		static public function SetButtonStyle(width: int, height: int, orientation: int, flags: int, bevelsize: int, dfore: int, dback: int, bright: int, dark: int, surface: int, groupid: int, flags2: int, underlinecolour: int, cornercolour: int): void
		{
			FButtonStyle.width = width;
			FButtonStyle.height = height;
			FButtonStyle.orientation = orientation;
			FButtonStyle.flags = flags;
			FButtonStyle.bevelsize = bevelsize;
			FButtonStyle.dfore = dfore;
			FButtonStyle.dback = dback;
			FButtonStyle.bright = bright;
			FButtonStyle.dark = dark;
			FButtonStyle.surface = surface;
			FButtonStyle.groupid = groupid;
			FButtonStyle.flags2 = flags2;
			FButtonStyle.underlinecolour = underlinecolour;
			FButtonStyle.cornercolour = cornercolour;
		}
		
		// Write contents of the clipboard (icon) to disk
		// Status: Not Implemented
		static public function WriteIcon(filename: String): void
		{
			trace("WriteIcon() is not handled");
		}
	}
}