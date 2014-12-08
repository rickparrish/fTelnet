// doors menu club on card
// user setup position of characters on buttons
// flisthdr size of "Area" text
// listmsgs size of text
// news size of text
// pageuser size of text
// search2 and searches fill on magnifying glass
// uaccount clock
// userlist keyboard
// welcome size of text


package randm.graph
{
	import flash.display.Bitmap;
	import flash.display.BitmapData;
	import flash.display.PixelSnapping;
	import flash.display.Sprite;
	import flash.events.Event;
	import flash.geom.Point;
	import flash.geom.Rectangle;
	
	import randm.crt.Crt;
	import randm.graph.rip.DirtyType;
	import randm.graph.rip.RIP;

	public class Graph
	{
		static private const ASPECT_RATIO: Number = 0.775; // 7750 over 10000
		static public const PIXELS_X: int = 640;
		static public const PIXELS_Y: int = 350;
		static public const PIXELS: int = PIXELS_X * PIXELS_Y;

		// The full EGA palette
		static private const EGA_PALETTE: Vector.<uint> = Vector.<uint>([
			0xFF000000, 0xFF0000AA, 0xFF00AA00, 0xFF00AAAA, 0xFFAA0000, 0xFFAA00AA, 0xFFAAAA00, 0xFFAAAAAA, 
			0xFF000055, 0xFF0000FF, 0xFF00AA55, 0xFF00AAFF, 0xFFAA0055, 0xFFAA00FF, 0xFFAAAA55, 0xFFAAAAFF,
			0xFF005500, 0xFF0055AA, 0xFF00FF00, 0xFF00FFAA, 0xFFAA5500, 0xFFAA55AA, 0xFFAAFF00, 0xFFAAFFAA,
			0xFF005555, 0xFF0055FF, 0xFF55FF00, 0xFF00FFFF, 0xFFAA5555, 0xFFAA55FF, 0xFFAAFF55, 0xFFAAFFFF,
			0xFF550000, 0xFF5500AA, 0xFF55AA00, 0xFF55AAAA, 0xFFFF0000, 0xFFFF00AA, 0xFFFFAA00, 0xFFFFAAAA,
			0xFF550055, 0xFF5500FF, 0xFF55AA55, 0xFF55AAFF, 0xFFFF0055, 0xFFFF00FF, 0xFFFFAA55, 0xFFFFAAFF,
			0xFF555500, 0xFF5555AA, 0xFF55FF00, 0xFF55FFAA, 0xFFFF5500, 0xFFFF55AA, 0xFFFFFF00, 0xFFFFFFAA,
			0xFF555555, 0xFF5555FF, 0xFF55FF55, 0xFF55FFFF, 0xFFFF5555, 0xFFFF55FF, 0xFFFFFF55, 0xFFFFFFFF]);

		// The current palette, which can only contain 16 elements from the full EGA palette at one time
		static public const CURRENT_PALETTE: Vector.<uint> = Vector.<uint>([
			EGA_PALETTE[00], EGA_PALETTE[01], EGA_PALETTE[02], EGA_PALETTE[03], EGA_PALETTE[04], EGA_PALETTE[05], EGA_PALETTE[20], EGA_PALETTE[07],  
			EGA_PALETTE[56], EGA_PALETTE[57], EGA_PALETTE[58], EGA_PALETTE[59], EGA_PALETTE[60], EGA_PALETTE[61], EGA_PALETTE[62], EGA_PALETTE[63]]);  
		
		static private var FFillSettings: TFillSettings;
		static private var FLineSettings: TLineSettings;
		static private var FTextSettings: TTextSettings;
		static private var FViewPortSettings: TViewPortSettings;

		static private var FBitmap: Bitmap;
		static private var FCanvas: Sprite;

		static private var FBackColour: int;
		static private var FColour: int;
		static private var FCursorPosition: Point;
		static private var FDirty: int;
		static private var FFillEllipse: Boolean;
		static private var FFillPoly: Boolean;
		static private var FFillPolyMap: *;
		static private var FPixels: Vector.<uint>;
		static private var FTextWindow: flash.geom.Rectangle;
		static private var FWriteMode: int;
		
		static public var PutPixel: Function = PutPixelDefault;

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
			FCanvas = new Sprite();
			FCanvas.focusRect = false;

			// Create the bitmap
			FBitmap = new Bitmap(new BitmapData(PIXELS_X, PIXELS_Y, false, 0), PixelSnapping.NEVER, false);
			FCanvas.addChild(FBitmap);
			FCanvas.width = FBitmap.width;
			FCanvas.height = FBitmap.height;
			
			// Add the Crt window in the hidden state
			FCanvas.addChild(Crt.Canvas);
			
			// Init the other important variables
			FFillSettings = new TFillSettings();
			FLineSettings = new TLineSettings();
			FTextSettings = new TTextSettings();
			FViewPortSettings = new TViewPortSettings();
			
			// And more variables
			FBackColour = 0;
			FColour = 0;
			FCursorPosition = new Point(0, 0);
			FDirty = DirtyType.Clear;
			FFillEllipse = false;
			FFillPolyMap = [];
			FPixels = FBitmap.bitmapData.getVector(new flash.geom.Rectangle(0, 0, PIXELS_X, PIXELS_Y));
			FTextWindow = new flash.geom.Rectangle(0, 0, Crt.ScreenCols, Crt.ScreenRows);
			FWriteMode = WriteMode.Normal;
			
			// Add the exit frame listener that will repaint when necessary
			FCanvas.addEventListener(Event.EXIT_FRAME, OnExitFrame);
			
			// Set defaults
			GraphDefaults();
		}
		
		// Draws a circular arc.
		// The arc goes from StAngle (start angle) to EndAngle, with radius Radius,
		// using (x,y) as the center point.
		static public function Arc(AX: int, AY: int, AStartAngle: int, AEndAngle: int, ARadius: int): void
		{
			Ellipse(AX, AY, AStartAngle, AEndAngle, ARadius, int(ARadius * ASPECT_RATIO));
		}
		
		// Draws a bar using the current fill style and fill color.
		// Bar draws a filled-in rectangle (used in bar charts, for example). Uses the
		// pattern and color defined by SetFillStyle or SetFillPattern. To draw an
		// outlined bar, call Bar3D with a depth of zero.
		static public function Bar(AX1: int, AY1: int, AX2: int, AY2: int): void
		{
			var x: int;
			var y: int;
			
			// Adjust for modified viewport, if necessary
			if ((FViewPortSettings.Clip) && (!FViewPortSettings.FullScreen)) {
				// Convert to global coordinates
				AX1 += FViewPortSettings.x1;
				AY1 += FViewPortSettings.y1;
				AX2 += FViewPortSettings.x1;
				AY2 += FViewPortSettings.y1;
				
				// Ensure that x1 and y1 are in the visible viewport
				if ((AX1 > FViewPortSettings.x2) || (AY1 > FViewPortSettings.y2)) return;
			}

			// Make sure x2 and y2 don't exceed the visible viewport
			AX2 = Math.min(AX2, FViewPortSettings.x2);
			AY2 = Math.min(AY2, FViewPortSettings.y2);

			// Indicate that we need to repaint
			FDirty = DirtyType.Pixel;
			
			var Offset: int = AX1 + (AY1 * PIXELS_X);
			var RowSkip: int = ((PIXELS_X - 1) - AX2) + (AX1)

			// OPTIMIZATION: In certain circumstances we can ignore the pattern lookup
			if ((FFillSettings.Colour == FBackColour) || (FFillSettings.Style == FillStyle.Empty) || (FFillSettings.Style == FillStyle.Solid)) {
				// No pattern lookup needed because either:
				//  - The fill colour is the same as the background colour
				//  - The fill style is to use the background colour
				//  - The fill style is solid (always use fill colour)
				
				// Check which colour to use
				var Colour: uint = (FFillSettings.Style == FillStyle.Solid) ? FFillSettings.Colour : FBackColour;
				Colour = CURRENT_PALETTE[Colour];

				// Fill all the pixels with the specified colour
				for (y = AY1; y <= AY2; y++) {
					for (x = AX1; x <= AX2; x++) {
						FPixels[Offset++] = Colour; // OPTIMIZATION: AVOID FUNCTION CALL RawPutPixel(Offset++, Colour); // Incrememnt offset in pixel lookup
					} 
					Offset += RowSkip;
				}
			} else {
				// Need to do a pattern lookup since the condition for a patternless fill wasn't met
				for (y = AY1; y <= AY2; y++) {
					for (x = AX1; x <= AX2; x++) {
						FPixels[Offset] = CURRENT_PALETTE[FFillSettings.Colour & FFillSettings.Pattern[Offset++]]; // OPTIMIZATION: AVOID FUNCTION CALL RawPutPixel(Offset, CURRENT_PALETTE[FFillSettings.Colour & FFillSettings.Pattern[Offset++]]); // Incrememnt offset in pattern lookup
					} 
					Offset += RowSkip;
				}
			}
		}
		
		// Draw a bezier curve (NB: cubic, not quadratic)
		// Adapted from http://www.paultondeur.com/2008/03/09/drawing-a-cubic-bezier-curve-using-actionscript-3/
		static public function Bezier(x1: int, y1: int, x2: int, y2: int, x3: int, y3: int, x4: int, y4: int, count: int): void
		{
			var lastx: int = x1;
			var lasty: int = y1;
			var nextx: int;
			var nexty: int;
			
			var ucubed: Number;
			var usquared: Number;
			for (var u: Number = 0; u <= 1; u += 1/count) {
				usquared = u * u;
				ucubed = usquared * u;

				nextx = ucubed * (x4 + 3 * (x2 - x3) - x1) + 3 * usquared * (x1 - 2 * x2 + x3) + 3 * u * (x2 - x1) + x1;
				nexty = ucubed * (y4 + 3 * (y2 - y3) - y1) + 3 * usquared * (y1 - 2 * y2 + y3) + 3 * u * (y2 - y1) + y1;
				Graph.Line(lastx, lasty, nextx, nexty);
				
				lastx = nextx;
				lasty = nexty;
			}
			
			// Let the curve end on the second anchorPoint
			Graph.Line(lastx, lasty, x4, y4);
		}
		
		static public function get bitmapData(): BitmapData
		{
			return FBitmap.bitmapData;
		}
		
		static public function get Canvas(): Sprite
		{
			return FCanvas;
		}

		// Clears the text window with the current background colour and homes the cursor
		static public function ClearTextWindow(): void
		{
			var x1: int = Crt.Canvas.x;
			var x2: int = Crt.Canvas.x + Crt.Canvas.width - 1;
			var y1: int = Crt.Canvas.y;
			var y2: int = Crt.Canvas.y + Crt.Canvas.height - 1;

			var Colour: int = CURRENT_PALETTE[FBackColour];
			var Offset: int = x1 + (y1 * PIXELS_X);
			var RowSkip: int = ((PIXELS_X - 1) - x2) + (x1);
			
			// Indicate that we need to repaint
			FDirty = DirtyType.Pixel;

			// Reset the pixels behind the text window
			for (var y: int = y1; y <= y2; y++) {
				for (var x: int = x1; x <= x2; x++) {
					FPixels[Offset++] = Colour; // OPTIMIZATION: AVOID FUNCTION CALL RawPutPixel(Offset++, Colour);
				} 
				Offset += RowSkip;
			}
			
			// Clear the Crt screen
			Crt.ClrScr();
		}

		// Clears the current view port (graphics mode only).
		// ClearViewPort sets the fill color to the background color and
		// moves the current pointer to (0, 0).
		static public function ClearViewPort(): void
		{
			// Home the cursor
			MoveTo(0, 0);

			// Save our old fill style and override it
			var OldFillStyle: int = FFillSettings.Style;
			FFillSettings.Style = FillStyle.Empty;
			
			// Draw a bar, which will automatically be clipped to the viewport if necessary
			Bar(0, 0, (PIXELS_X - 1), (PIXELS_Y - 1));
			
			// Restore the old fill style
			FFillSettings.Style = OldFillStyle;
			
			// Indicate that we need to repaint
			if ((FViewPortSettings.Clip) && (!FViewPortSettings.FullScreen)) {
				// Only partial screen cleared
				FDirty = DirtyType.Pixel;
			} else {
				// Full scren was cleared
				FDirty = DirtyType.Clear;	
			}
		}
			
		// Draws a circle (in the current color set by SetColor), using (X,Y) as the
		// center point.
		// Draws a circle in the current color set by SetColor. Each graphics driver
		// contains an aspect ratio used by Circle, Arc, and PieSlice.
		static public function Circle(AX: int, AY: int, ARadius: int): void
		{
			Ellipse(AX, AY, 0, 360, ARadius, int(ARadius * ASPECT_RATIO));
		}
		
		// Draws the outline of a polygon using the current line style and color.
		// NumPoints specifies the number of coordinates in PolyPoints. A coordinate
		// consists of two words, an X and a Y value.
		static public function DrawPoly(APoints: Vector.<Point>): void
		{
			var APointslength: int = APoints.length;
			for (var i: int = 1; i < APointslength; i++) {
				Line(APoints[i - 1].x, APoints[i - 1].y, APoints[i].x, APoints[i].y);
			}
		}
		
		// Draws an elliptical arc.
		// Draws the arc from StAngle (start angle) to EndAngle, with radii XRadius and
		// YRadius, sing (X,Y) as the center point.
		static public function Ellipse(AX: int, AY: int, AStartAngle: int, AEndAngle: int, AXRadius: int, AYRadius: int): void
		{
			// Abort if start angle and end angle match (if a person wants a full circle, they should use 0-360)
			if (AStartAngle == AEndAngle) return;
			
			const ConvFac: Number = Math.PI / 180.0;
			var	j: Number;
			var Delta: Number;
			var DeltaEnd: Number;
			var NumOfPixels: int;
			var TempTerm: Number;
			var xtemp: int;
			var ytemp: int;
			var xp: int;
			var yp: int;
			var xm: int;
			var ym: int;
			var xnext: int;
			var ynext: int;
			var BackupColor: int;
			var TmpAngle: int;
			var OldLineWidth: int;
			
			// check if valid angles
			AStartAngle = AStartAngle % 361;
			AEndAngle = AEndAngle % 361;
			
			// if impossible angles then run as two separate calls
			if (AEndAngle < AStartAngle) {
				Ellipse(AX, AY, AStartAngle, 360, AXRadius, AYRadius);
				Ellipse(AX, AY, 0, AEndAngle, AXRadius, AYRadius);
				return;
			}
			
			if (FLineSettings.Thickness == LineThickness.Thick) {
				// first draw the two outer ellipses using normwidth and no filling (JM)
				OldLineWidth = FLineSettings.Thickness;
				FLineSettings.Thickness = LineThickness.Normal;
				
				Ellipse(AX, AY, AStartAngle, AEndAngle, AXRadius + 1, AYRadius + 1);
				Ellipse(AX, AY, AStartAngle, AEndAngle, AXRadius, AYRadius);
				
				// restore line thickness
				FLineSettings.Thickness = OldLineWidth;

				if ((AXRadius > 0) && (AYRadius > 0)) {
					// draw the smallest ellipse last, since that one will use the 
					// original pl, so it could possibly draw patternlines (JM)    
					AXRadius--;
					AYRadius--;
				} else {
					return;
				}
			}
			
			if (AXRadius == 0) AXRadius++;
			if (AYRadius == 0) AYRadius++;
			
			// check for an ellipse with negligable x and y radius
			if ((AXRadius <= 1) && (AYRadius <= 1))
			{
				PutPixel(AX, AY, FColour);
				return;
			}
			
			// approximate the number of pixels required by using the circumference 
			// equation of an ellipse.                                              
			// Changed this formula a it (trial and error), but the net result is that 
			// less pixels have to be calculated now                                   
			NumOfPixels = Math.round(Math.sqrt(3) * Math.sqrt(Math.pow(AXRadius, 2) + Math.pow(AYRadius, 2)));
			
			// Calculate the angle precision required 
			Delta = 90.0 / NumOfPixels;
			
			// Always just go over the first 90 degrees. Could be optimized a   
			// bit if StAngle and EndAngle lie in the same quadrant, left as an 
			// exercise for the reader :) (JM)                                  
			j = 0;
			
			// calculate stop position, go 1 further than 90 because otherwise 
			// 1 pixel is sometimes not drawn (JM)                             
			DeltaEnd = 91;
			
			// Calculate points 
			xnext = AXRadius;
			ynext = 0;
			
			do {
				xtemp = xnext;
				ytemp = ynext;
				
				// this is used by both sin and cos
				TempTerm = (j + Delta) * ConvFac;
				
				// Calculate points 
				xnext = Math.round(AXRadius * Math.cos(TempTerm));
				ynext = Math.round(AYRadius * Math.sin(TempTerm + Math.PI));
				
				xp = AX + xtemp;
				xm = AX - xtemp;
				yp = AY + ytemp;
				ym = AY - ytemp;
				
				if ((j >= AStartAngle) && (j <= AEndAngle))
				{
					PutPixel(xp, yp, FColour);
				}
				if (((180 - j) >= AStartAngle) && ((180 - j) <= AEndAngle))
				{
					PutPixel(xm, yp, FColour);
				}
				if (((j + 180) >= AStartAngle) && ((j + 180) <= AEndAngle))
				{
					PutPixel(xm, ym, FColour);
				}
				if (((360 - j) >= AStartAngle) && ((360 - j) <= AEndAngle))
				{
					PutPixel(xp, ym, FColour);
				}

				// Now draw the vertical lines using Bar() so we get the right fill
				if (FFillEllipse) {
					Bar(Math.max(0, xm + 1), Math.max(0, yp + 1), Math.min(PIXELS_X - 1, xm + 1), Math.min(PIXELS_Y - 1, ym - 1));
					Bar(Math.max(0, xp - 1), Math.max(0, yp + 1), Math.min(PIXELS_X - 1, xp - 1), Math.min(PIXELS_Y - 1, ym - 1));
				}

				j = j + Delta;
			} while (j <= DeltaEnd);
		}
		
		// Clears the text line with the current background colour
		static public function EraseEOL(): void
		{
			//TODO Not tested yet
			var x1: int = Crt.Canvas.x + ((Crt.WhereX() - 1) * Crt.Font.Width);
			var x2: int = Crt.Canvas.x + Crt.Canvas.width - 1;
			var y1: int = Crt.Canvas.y + ((Crt.WhereY() - 1) * Crt.Font.Height);
			var y2: int = y1 + Crt.Font.Height;
			
			var Colour: int = CURRENT_PALETTE[FBackColour];
			var Offset: int = x1 + (y1 * PIXELS_X);
			var RowSkip: int = ((PIXELS_X - 1) - x2) + (x1);
			
			// Indicate that we need to repaint
			FDirty = DirtyType.Pixel;
			
			// Reset the pixels behind the text window
			for (var y: int = y1; y <= y2; y++) {
				for (var x: int = x1; x <= x2; x++) {
					FPixels[Offset++] = Colour; // OPTIMIZATION: AVOID FUNCTION CALL RawPutPixel(Offset++, Colour);
				} 
				Offset += RowSkip;
			}
			
			// Clear the Crt line
			Crt.ClrEol();
		}
		
		// Draws a filled ellipse
		// (X,Y) is the center point; XRadius and YRadius are the horizontal and
		// vertical axes.
		static public function FillEllipse(AX: int, AY: int, AXRadius: int, AYRadius: int): void
		{
			FFillEllipse = true;
			Ellipse(AX, AY, 0, 360, AXRadius, AYRadius);
			FFillEllipse = false;
		}
		
		// Fills a polygon, using the scan converter
		// PolyPoints is an untyped parameter that contains the coordinates of each
		// intersection in the polygon. NumPoints specifies the number of coordinates
		// in PolyPoints. A coordinate consists of two words, an X and a Y value.
		// FillPoly calculates all the horizontal intersections, and then fills the
		// polygon using the current fill style and color defined by SetFillStyle or
		// SetFillPattern. The outline of the polygon is drawn in the current line
		// style and color as set by SetLineStyle.
		static public function FillPoly(APoints: Vector.<Point>): void
		{
			// Reset the pixel map (which records which pixels were set since the last time the map was reset)
			FFillPolyMap.InitTwoDimensions(PIXELS_X, PIXELS_Y);
			
			// Draw the polygon (override PutPixel() to the version that records pixel locations first)
			PutPixel = PutPixelPoly;
			DrawPoly(APoints);
			PutPixel = PutPixelDefault;
			
			// Get the bounding rect of the polygon (so we only use PointInPoly() on pixels we need to)
			var Bounds: flash.geom.Rectangle = new flash.geom.Rectangle();
			Bounds.left = APoints[0].x;
			Bounds.top = APoints[0].y;
			Bounds.right = APoints[0].x;
			Bounds.bottom = APoints[0].y;
				
			var APointslength: int = APoints.length;
			for (var i: int = 1; i < APointslength; i++) {
				if (APoints[i].x < Bounds.left) Bounds.left = APoints[i].x;
				if (APoints[i].y < Bounds.top) Bounds.top = APoints[i].y;
				if (APoints[i].x > Bounds.right) Bounds.right = APoints[i].x;
				if (APoints[i].y > Bounds.bottom) Bounds.bottom = APoints[i].y;
			}
			
			// Sanity checking for bounds
			Bounds.left = Math.max(Bounds.left, 0);
			Bounds.top = Math.max(Bounds.top, 0);
			Bounds.right = Math.min(Bounds.right, 639);
			Bounds.bottom = Math.min(Bounds.bottom, 349);
			
			// Fill the pixels that need filling
			// NOTE: The simplest way to do this is just call PointInPoly() for every pixel in the bounding
			//       rectangle, but that's slow, so instead we only call it after crossing an edge.
			//       This modified version is more code, but takes about 17% of the time (so if the old
			//       PointInPoly() only method took 1 second, this modified from would take 170ms)
			for (var y: int = Bounds.top; y <= Bounds.bottom; y++) {
				var InPoly: Boolean = false;
				var LastWasEdge: Boolean = false;
				var LeftPoint: int = -1;
				var RightPoint: int = -1;
			
				for (var x: int = Bounds.left; x <= Bounds.right; x++) {
					// Check if the current pixel is an edge
					if (FFillPolyMap[x][y] == 1) {
						// Yep, check if the previous pixel was an edge
						if (LastWasEdge) {
							// Yep, ignore since it just means we hit two edge pixels in a row (could happen with horizontal lines for example, or thick lines)
						} else {
							// Nope, so check if we've transitioned from in the polygon to out of the polygon
							if (LeftPoint != -1) {
								// Yep, so do the fill
								Bar(LeftPoint, y, RightPoint, y);
								LeftPoint = -1;
								RightPoint = -1;
							} 
						}
						
						LastWasEdge = true;
					} else {
						// Nope, check if the previous pixel was an edge
						if (LastWasEdge) {
							// Yep, check to see if we're now inside or outside the polygon
							InPoly = PointInPoly(x, y, APoints);
						}
						
						// Check if we're inside the polygon
						if (InPoly) {
							// Yep, check if we have a left point yet
							if (LeftPoint == -1) {
								// Nope, so record the current pixel as the left and right point
								LeftPoint = x;
								RightPoint = x;
							} else {
								// Yep, so update the right point
								RightPoint = x;
							}
						}
						
						LastWasEdge = false;
					}
				}
			}
		}
		
		// Fills a bounded region with the current fill pattern and color.
		// Fills an enclosed area on bitmap devices. (X, Y) is a seed within the
		// enclosed area to be filled. The current fill pattern, as set by SetFillStyle
		// or SetFillPattern, is used to flood the area bounded by Border color. If the
		// seed point is within an enclosed area, then the inside will be filled. If
		// the seed is outside the enclosed area, then the exterior will be filled.
		static public function FloodFill(AX: int, AY: int, ABorder: int): void
		{
			// Adjust for modified viewport, if necessary
			if ((FViewPortSettings.Clip) && (!FViewPortSettings.FullScreen)) {
				// Convert to global coordinates
				AX += FViewPortSettings.x1;
				AY += FViewPortSettings.y1;
				
				// Ensure that x and y are in the visible viewport
				if ((AX < FViewPortSettings.x1) || (AX > FViewPortSettings.x2) || (AY < FViewPortSettings.y1) || (AY > FViewPortSettings.y2)) return; 
			}
			
			// Check if target point is already border colour point is in viewport
			if (FPixels[AX + (AY * PIXELS_X)] == CURRENT_PALETTE[ABorder]) return;
			
			var VisitedPoints: Vector.<int> = new Vector.<int>(PIXELS, true);
			var ProcessPoints: Vector.<int> = new Vector.<int>();
			
			ProcessPoints.push(AX + (AY * PIXELS_X));
			
			var ThisPoint: int;
			var NorthPoint: int;
			var SouthPoint: int;
			var EastPoint: int;
			var WestPoint: int;
			var LeftEdge: int;
			var RightEdge: int;
			var LeftStop: int;
			var RightStop: int;
			var WantTop: Boolean;
			var WantBottom: Boolean;
			var DidTop: Boolean;
			var DidBottom: Boolean;
			var DoNorth: Boolean;
			var DoSouth: Boolean;
			while (ProcessPoints.length > 0) {
				ThisPoint = ProcessPoints.pop();

				LeftEdge = int(ThisPoint / PIXELS_X) * PIXELS_X;
				if (FViewPortSettings.Clip && !FViewPortSettings.FullScreen) LeftEdge += FViewPortSettings.FromLeft;
				LeftStop = ThisPoint;
				while ((LeftStop >= LeftEdge) && (FPixels[LeftStop] != CURRENT_PALETTE[ABorder])) LeftStop -= 1;
				LeftStop += 1;

				RightEdge = (int(ThisPoint / PIXELS_X) * PIXELS_X) + PIXELS_X - 1;
				if (FViewPortSettings.Clip && !FViewPortSettings.FullScreen) RightEdge -= FViewPortSettings.FromRight;
				RightStop = ThisPoint;
				while ((RightStop <= RightEdge) && (FPixels[RightStop] != CURRENT_PALETTE[ABorder])) RightStop += 1;
				RightStop -= 1;

				DidTop = false;
				DidBottom = false;
				DoNorth = ThisPoint >= PIXELS_X;
				if (FViewPortSettings.Clip && !FViewPortSettings.FullScreen) DoNorth = (ThisPoint >= (FViewPortSettings.FromTop + 1) * PIXELS_X);
				DoSouth = ThisPoint <= ((PIXELS - 1) - PIXELS_X);
				if (FViewPortSettings.Clip && !FViewPortSettings.FullScreen) DoSouth = (ThisPoint <= ((PIXELS - 1) - ((FViewPortSettings.FromBottom + 1) * PIXELS_X))); 
				for (var i: int = LeftStop; i <= RightStop; i++) {
					FPixels[i] = CURRENT_PALETTE[FFillSettings.Colour & FFillSettings.Pattern[i]]; // OPTIMIZATION: AVOID FUNCTION CALL RawPutPixel RawPutPixel(i, CURRENT_PALETTE[FFillSettings.Colour & FFillSettings.Pattern[i]]);
					VisitedPoints[i] = 1;
					
					// Check above
					if (DoNorth) {
						NorthPoint = i - PIXELS_X;
						WantTop = ((VisitedPoints[NorthPoint] == 0) && (FPixels[NorthPoint] != CURRENT_PALETTE[ABorder]));
						if (WantTop && !DidTop) {
							ProcessPoints.push(NorthPoint);
							DidTop = true;
						} else if (!WantTop && DidTop) {
							DidTop = false;
						}
					}
					
					// Check below
					if (DoSouth) {
						SouthPoint = i + PIXELS_X;
						WantBottom = ((VisitedPoints[SouthPoint] == 0) && (FPixels[SouthPoint] != CURRENT_PALETTE[ABorder]));
						if (WantBottom && !DidBottom) {
							ProcessPoints.push(SouthPoint);
							DidBottom = true;
						} else if (!WantBottom && DidBottom) {
							DidBottom = false;
						}
					}
				}
			}
			
			// Indicate that we need to repaint
			FDirty = DirtyType.Pixel;
		}
		
		// Returns the current drawing color.
		// Drawing colors range from 0 to 15, depending on the current graphics driver
		// and current graphics mode.
		static public function GetColour(): int
		{
			return FColour;
		}
		
		// Gets the current fill pattern and color, as set by SetFillStyle or
		// SetFillPattern.
		// The Pattern field reports the current fill pattern selected. The colors
		// field reports the current fill color selected. Both the fill pattern and
		// color can be changed by calling the SetFillStyle or SetFillPattern
		// procedure.
		// 	If Pattern is equal to UserFill, use GetFillPattern to get the user-defined
		// fill pattern that is selected.
		static public function GetFillSettings(): TFillSettings
		{
			return FFillSettings;
		}

		// Saves a bit image of the specified region into a buffer.
		// X1, Y1, X2, and Y2 define a rectangular region on the screen. BitMap is an
		// untyped parameter that must be greater than or equal to 6 plus the amount of
		// area defined by the region. The first two words of BitMap store the width
		// and height of the region. The third word is reserved.
		// The remaining part of BitMap is used to save the bit image itself. Use the
		// ImageSize function to determine the size requirements of BitMap.
		static public function GetImage(x1: int, y1: int, x2: int, y2: int): BitmapData
		{
			// TODO Validate coordinates are top left and bottom right?
			
			// Need to ensure FPixels is written to FBitmap before we copy the region
			if (FDirty != DirtyType.None) {
				FDirty = DirtyType.None;
				FBitmap.bitmapData.setVector(new flash.geom.Rectangle(0, 0, PIXELS_X, PIXELS_Y), FPixels);
			}
			
			var Result: BitmapData = new BitmapData(x2 - x1 + 1, y2 - y1 + 1);
			Result.copyPixels(FBitmap.bitmapData, new flash.geom.Rectangle(x1, y1, Result.width, Result.height), new Point(0, 0));
			return Result;
		}

		// Homes the current pointer (CP) and resets the graphics system to specified
		// default values.
		// Homes the current pointer (CP) and resets the graphics system to the default
		// values for
		//   viewport
		//   palette
		//   draw and background colors
		//   line style and line pattern
		//   fill style, fill color, and fill pattern
		//   active font, text style, text justification, and user Char size
		static public function GraphDefaults(): void
		{
			SetLineStyle(LineStyle.Solid, 0xFFFF, LineThickness.Normal);
			SetFillStyle(FillStyle.Solid, 15);

			SetColour(15);
			SetBkColour(0);
			
			// Update the palette, but tell it not to update the screen since it'll be cleared below anyway
			SetAllPalette(Vector.<int>([0, 1, 2, 3, 4, 5, 20, 7, 56, 57, 58, 59, 60, 61, 62, 63]), false);
			SetViewPort(0, 0, (PIXELS_X - 1), (PIXELS_Y - 1), true);
			ClearViewPort();
			
			MoveTo(0, 0);
			SetWriteMode(WriteMode.Copy);
			SetTextStyle(0, TextOrientation.Horizontal, 1);
			SetTextJustify(TextJustification.Left, TextJustification.Top);
		}
		
		// Invert the pixels in the given region
		static public function Invert(AX1: int, AY1: int, AX2: int, AY2: int): void
		{
			// Adjust for modified viewport, if necessary
			if ((FViewPortSettings.Clip) && (!FViewPortSettings.FullScreen)) {
				// Convert to global coordinates
				AX1 += FViewPortSettings.x1
				AY1 += FViewPortSettings.y1;
				AX2 += FViewPortSettings.x1;
				AY2 += FViewPortSettings.y1;
				
				// Ensure that x1 and y1 are in the visible viewport
				if ((AX1 > FViewPortSettings.x2) || (AY1 > FViewPortSettings.y2)) return;
				
				// Make sure x2 and y2 don't exceed the visible viewport
				AX2 = Math.min(AX2, FViewPortSettings.x2);
				AY2 = Math.min(AY2, FViewPortSettings.y2);
			}
			
			// Indicate that we need to repaint
			FDirty = DirtyType.Pixel;
			
			var Offset: int = AX1 + (AY1 * PIXELS_X);
			var RowSkip: int = ((PIXELS_X - 1) - AX2) + (AX1)
			
			for (var y: int = AY1; y <= AY2; y++) {
				for (var x: int = AX1; x <= AX2; x++) {
					FPixels[Offset] = FPixels[Offset++] ^ 0x00FFFFFF; // OPTIMIZATION: AVOID FUNCTION CALL RawPutPixel RawPutPixel(Offset, FPixels[Offset++] ^ 0x00FFFFFF);
				} 
				Offset += RowSkip;
			}
		}
		
		static private function HLine(x: int, x2: int, y: int): void
		{
			var xtmp: int;
			/*{ must we swap the values? }*/
			if (x >= x2)
			{
				xtmp = x2;
				x2 = x;
				x = xtmp;
			}
			// TODO Optimization
			/*{ First convert to global coordinates }*/
			/*x   = x + FViewPortSettings.x1;
			x2  = x2 + FViewPortSettings.x1;
			y   = y + FViewPortSettings.y1;
			if (FViewPortSettings.Clip && !FViewPortSettings.FullScreen)
			{
				if (LineClipped(x,y,x2,y,FViewPortSettings.x1,FViewPortSettings.y1,FViewPortSettings.x2, FViewPortSettings.y2)) return;
			}
			for (x = x; x <= x2; x++)
			{
				FPixels[x + (y * PIXELS_X)] = CURRENT_PALETTE[FColour];
			}*/
			for (x = x; x <= x2; x++)
			{
				PutPixel(x, y, FColour);
			}
		}
			
			
		static private function VLine(x: int, y: int, y2: int): void
		{
			var ytmp: int;
			/*{ must we swap the values? }*/
			if (y >= y2)
			{
				ytmp = y2;
				y2 = y;
				y = ytmp;
			}
			// TODO Optimization
			/*{ First convert to global coordinates }*/
			/*x   = x + FViewPortSettings.x1;
			y2  = y2 + FViewPortSettings.y1;
			y   = y + FViewPortSettings.y1;
			if (FViewPortSettings.Clip && !FViewPortSettings.FullScreen)
			{
				if (LineClipped(x,y,x,y2,FViewPortSettings.x1,FViewPortSettings.y1,FViewPortSettings.x2, FViewPortSettings.y2)) return;
			}
			for (y = y; y <= y2; y++) 
			{
				FPixels[x + (y * PIXELS_X)] = CURRENT_PALETTE[FColour];
			}*/
			for (y = y; y <= y2; y++) 
			{
				PutPixel(x, y, FColour);
			}
		}
				
		// Draws a line from the point (x1, y1) to (x2, y2).
		// Draws a line in the style and thickness defined by SetLineStyle and uses the
		// color set by SetColor. Use SetWriteMode to determine whether the line is
		// copied or XOR'd to the screen.
		static public function Line(x1: int, y1: int, x2: int, y2: int): void
		{
			var x: int;
			var y: int;
			var deltax: int;
			var deltay: int;
			var d: int;
			var dinc1: int;
			var dinc2: int;
			var xinc1: int;
			var xinc2: int;
			var yinc1: int;
			var yinc2: int;
			var i: int;
			var flag: Boolean;
			var numpixels: int;
			var pixelcount: int;
			var swtmp: int;
			var tmpnumpixels: int;

			/*{******************************************}
			{  SOLID LINES                             }
			{******************************************}*/
			if (FLineSettings.Style == LineStyle.Solid)
			{
				/*{ we separate normal and thick width for speed }
				{ and because it would not be 100% compatible  }
				{ with the TP graph unit otherwise             }*/
				if (y1 == y2)
				{
					/*{******************************************}
					{  SOLID LINES HORIZONTAL                  }
					{******************************************}*/
					if (FLineSettings.Thickness == LineThickness.Normal)
					{
						HLine(x1,x2,y2)
					}else{
						/*{ thick width }*/
						HLine(x1,x2,y2-1);
						HLine(x1,x2,y2);
						HLine(x2,x2,y2+1);
					}
				}else if (x1 == x2)
				{
					/*{******************************************}
					{  SOLID LINES VERTICAL                    }
					{******************************************}*/
					if (FLineSettings.Thickness == LineThickness.Normal)
					{
						VLine(x1,y1,y2)
					} else {
						/*{ thick width }*/
						VLine(x1-1,y1,y2);
						VLine(x1,y1,y2);
						VLine(x1+1,y1,y2);
					}
				} else {
					// TODO Optimization
					/*{ Convert to global coordinates. }*/
					/*x1 = x1 + FViewPortSettings.x1;
					x2 = x2 + FViewPortSettings.x1;
					y1 = y1 + FViewPortSettings.y1;
					y2 = y2 + FViewPortSettings.y1;
					/*{ if fully clipped then exit... }*/
					/*if (FViewPortSettings.Clip && !FViewPortSettings.FullScreen) {
						if (LineClipped(x1,y1,x2,y2,FViewPortSettings.x1, FViewPortSettings.y1, FViewPortSettings.x2, FViewPortSettings.y2)) return;
					}*/
				
					/*{******************************************}
					{  SLOPED SOLID LINES                      }
					{******************************************}*/
					/*{ Calculate deltax and deltay for initialisation }*/
					deltax = Math.abs(x2 - x1);
					deltay = Math.abs(y2 - y1);
				
					/*{ Initialize all vars based on which is the independent variable }*/
					if (deltax >= deltay) 
					{
						flag = false;
						/*{ x is independent variable }*/
						numpixels = deltax + 1;
						d = (2 * deltay) - deltax;
						dinc1 = deltay << 1;
						dinc2 = (deltay - deltax) << 1;
						xinc1 = 1;
						xinc2 = 1;
						yinc1 = 0;
						yinc2 = 1;
					} else {
						flag = true;
						/*{ y is independent variable }*/
						numpixels = deltay + 1;
						d = (2 * deltax) - deltay;
						dinc1 = deltax << 1;
						dinc2 = (deltax - deltay) << 1;
						xinc1 = 0;
						xinc2 = 1;
						yinc1 = 1;
						yinc2 = 1;
					}
				
					/*{ Make sure x and y move in the right directions }*/
					if (x1 > x2)
					{
						xinc1 = - xinc1;
						xinc2 = - xinc2;
					}
					if (y1 > y2)
					{
						yinc1 = - yinc1;
						yinc2 = - yinc2;
					}
				
					/*{ Start drawing at <x1, y1> }*/
					x = x1;
					y = y1;
				
					if (FLineSettings.Thickness == LineThickness.Normal)
					{
						/*{ Draw the pixels }*/
						for (i = 1; i <= numpixels; i++) 
						{
							PutPixel(x, y, FColour);//DirectPutPixel(x, y);
							if (d < 0)
							{
								d = d + dinc1;
								x = x + xinc1;
								y = y + yinc1;
							} else {
								d = d + dinc2;
								x = x + xinc2;
								y = y + yinc2;
							}
						}
					} else {
						/*{ Thick width lines }
						{ Draw the pixels }*/
						for (i = 1; i <= numpixels; i++)
						{
							/*{ all depending on the slope, we can determine         }
							{ in what direction the extra width pixels will be put }*/
							if (flag)
							{
								PutPixel(x-1, y, FColour);//DirectPutPixelClip(x-1,y);
								PutPixel(x, y, FColour);//DirectPutPixelClip(x,y);
								PutPixel(x+1, y, FColour);//DirectPutPixelClip(x+1,y);
							} else {
								PutPixel(x, y-1, FColour);//DirectPutPixelClip(x, y-1);
								PutPixel(x, y, FColour);//DirectPutPixelClip(x, y);
								PutPixel(x, y+1, FColour);//DirectPutPixelClip(x, y+1);
							}
							
							if (d < 0)
							{
								d = d + dinc1;
								x = x + xinc1;
								y = y + yinc1;
							} else {
								d = d + dinc2;
								x = x + xinc2;
								y = y + yinc2;
							}
						}
					}
				}
			} else {
				/*{******************************************}
				{  begin patterned lines                   }
				{******************************************}*/
				// TODO Optimization
				/*{ Convert to global coordinates. }*/
				/*x1 = x1 + FViewPortSettings.x1;
				x2 = x2 + FViewPortSettings.x1;
				y1 = y1 + FViewPortSettings.y1;
				y2 = y2 + FViewPortSettings.y1;*/
				/*{ if fully clipped then exit... }*/
				/*if (FViewPortSettings.Clip && !FViewPortSettings.FullScreen)
				{
					if (LineClipped(x1,y1,x2,y2,FViewPortSettings.x1, FViewPortSettings.y1, FViewPortSettings.x2, FViewPortSettings.y2)) return;
				}*/
					
				pixelcount=0;
				if (y1 == y2)
				{
					/*{ Check if we must swap }*/
					if (x1 >= x2)
					{
						swtmp = x1;
						x1 = x2;
						x2 = swtmp;
					}
					if (FLineSettings.Thickness == LineThickness.Normal)
					{
						for (pixelcount=x1; pixelcount <= x2; pixelcount++) {
							/*{ optimization: PixelCount mod 16 }*/
							if ((FLineSettings.Pattern & (1 << (pixelcount & 15))) != 0)
							{
								PutPixel(pixelcount, y2, FColour);//DirectPutPixel(PixelCount,y2);
							}
						}
					} else {
						for (i=-1; i <= 1; i++) {
							for (pixelcount=x1; pixelcount <= x2; pixelcount++)
							{
								/*{ Optimization from Thomas - mod 16 = and 15 }
								{this optimization has been performed by the compiler
									for while as well (JM)}*/
								if ((FLineSettings.Pattern & (1 << (pixelcount & 15))) != 0)
								{
									// TODO Need to clip
									PutPixel(pixelcount, y2+i, FColour);//DirectPutPixelClip(PixelCount,y2+i);
								}
							}
						}
					}
				} else if (x1 == x2) {
					/*{ Check if we must swap }*/
					if (y1 >= y2) {
						swtmp = y1;
						y1 = y2;
						y2 = swtmp;
					}
					if (FLineSettings.Thickness == LineThickness.Normal)
					{
						for (pixelcount=y1; pixelcount <= y2; pixelcount++) {
							/*{ compare if we should plot a pixel here , compare }
							{ with predefined line patterns...                 }*/
							if ((FLineSettings.Pattern & (1 << (pixelcount & 15))) != 0)
							{
								PutPixel(x1, pixelcount, FColour);//DirectPutPixel(x1,PixelCount);
							}
						}
					} else {
						for (i=-1; i <= 1; i++) {
							for (pixelcount=y1; pixelcount <= y2; pixelcount++)
							{
								/*{ compare if we should plot a pixel here , compare }
								{ with predefined line patterns...                 }*/
								if ((FLineSettings.Pattern & (1 << (pixelcount & 15))) != 0)
								{
									// TODO Need to clip	
									PutPixel(x1+i, pixelcount, FColour);//DirectPutPixelClip(x1+i,PixelCount);
								}
							}
						}
					}
				} else {
					/*{ Calculate deltax and deltay for initialisation }*/
					deltax = Math.abs(x2 - x1);
					deltay = Math.abs(y2 - y1);
											
					/*{ Initialize all vars based on which is the independent variable }*/
					if (deltax >= deltay)
					{
						flag = false;
						/*{ x is independent variable }*/
						numpixels = deltax + 1;
						d = (2 * deltay) - deltax;
						dinc1 = deltay << 1;
						dinc2 = (deltay - deltax) << 1;
						xinc1 = 1;
						xinc2 = 1;
						yinc1 = 0;
						yinc2 = 1;
					} else {
						flag = true;
						/*{ y is independent variable }*/
						numpixels = deltay + 1;
						d = (2 * deltax) - deltay;
						dinc1 = deltax << 1;
						dinc2 = (deltax - deltay) << 1;
						xinc1 = 0;
						xinc2 = 1;
						yinc1 = 1;
						yinc2 = 1;
					}
					
					/*{ Make sure x and y move in the right directions }*/
					if (x1 > x2)
					{
						xinc1 = - xinc1;
						xinc2 = - xinc2;
					}
					if (y1 > y2)
					{
						yinc1 = - yinc1;
						yinc2 = - yinc2;
					}
											
					/*{ Start drawing at <x1, y1> }*/
					x = x1;
					y = y1;
											
					if (FLineSettings.Thickness == LineThickness.Thick) {
						tmpnumpixels = numpixels-1;
						/*{ Draw the pixels }*/
						for (i = 0; i <= tmpnumpixels; i++) {
							/*{ all depending on the slope, we can determine         }
							{ in what direction the extra width pixels will be put }*/
							if (flag)
							{
								/*{ compare if we should plot a pixel here , compare }
								{ with predefined line patterns...                 }*/
								if ((FLineSettings.Pattern & (1 << (i & 15))) != 0)
								{
									PutPixel(x-1, y, FColour);//DirectPutPixelClip(x-1,y);
									PutPixel(x, y, FColour);//DirectPutPixelClip(x,y);
									PutPixel(x+1, y, FColour);//DirectPutPixelClip(x+1,y);
								}
							} else {
								/*{ compare if we should plot a pixel here , compare }
								{ with predefined line patterns...                 }*/
								if ((FLineSettings.Pattern & (1 << (i & 15))) != 0)
								{
									PutPixel(x, y-1, FColour);//DirectPutPixelClip(x,y-1);
									PutPixel(x, y, FColour);//DirectPutPixelClip(x,y);
									PutPixel(x, y+1, FColour);//DirectPutPixelClip(x,y+1);
								}
							}

							if (d < 0)
							{
								d = d + dinc1;
								x = x + xinc1;
								y = y + yinc1;
							} else {
								d = d + dinc2;
								x = x + xinc2;
								y = y + yinc2;
							}
						}
					} else {
						/*{ instead of putting in loop , substract by one now }*/
						tmpnumpixels = numpixels-1;
						/*{ NormWidth }*/
						for (i = 0; i <= tmpnumpixels; i++) {
							if ((FLineSettings.Pattern & (1 << (i & 15))) != 0)
							{
								PutPixel(x,y, FColour);//DirectPutPixel(x,y);
							}
							if (d < 0)
							{
								d = d + dinc1;
								x = x + xinc1;
								y = y + yinc1;
							} else {
								d = d + dinc2;
								x = x + xinc2;
								y = y + yinc2;
							}
						}
					}
				}
				/*{******************************************}
				{  end patterned lines                     }
				{******************************************}*/
			}
		}
		
		static public function yLine(x0: int, y0: int, x1: int, y1: int): void
		{
			if (FWriteMode == WriteMode.XOR) {
				trace("Line() doesn't support XOR write mode");
			}
			
			var x: int;
			var y: int;
			var Start: int;
			var End: int;
			var dx: int;
			var dy: int;
			var x0minus: int;
			var x0plus: int;
			var y0minus: int;
			var y0plus: int;
			var m: Number;
			var b: Number;
			
			if (FLineSettings.Style == LineStyle.Solid) {
				// Calculate dx (and check if vertical)
				dx = x1 - x0;
				if (dx == 0) {
					Start = Math.min(y0, y1);
					End = Math.max(y0, y1);
					if (FLineSettings.Thickness == LineThickness.Normal) {
						for (y = Start; y <= End; y++) {
							PutPixel(x0, y, FColour);
						}
					} else {
						x0minus = x0 - 1;
						x0plus = x0 + 1;
						
						for (y = Start; y <= End; y++) {
							PutPixel(x0minus, y, FColour);
							PutPixel(x0, y, FColour);
							PutPixel(x0plus, y, FColour);
						}
					}
					return;
				}
				
				// Calculate dy (and check if horizontal)
				dy = y1 - y0;
				if (dy == 0) {
					Start = Math.min(x0, x1);
					End = Math.max(x0, x1);
					if (FLineSettings.Thickness == LineThickness.Normal) {
						for (x = Start; x <= End; x++) {
							PutPixel(x, y0, FColour);
						}
					} else {
						y0minus = y0 - 1;
						y0plus = y0 + 1;
						
						for (x = Start; x <= End; x++) {
							PutPixel(x, y0minus, FColour);
							PutPixel(x, y0, FColour);
							PutPixel(x, y0plus, FColour);
						}
					}
					return;
				}
				
				// Calculate m and b
				m = dy / dx;
				b = y0 - (m * x0);
				
				// Solve for y using y=mx+b
				Start = Math.min(x0, x1);
				End = Math.max(x0, x1);
				if (FLineSettings.Thickness == LineThickness.Normal) {
					for (x = Start; x <= End; x++) {
						y = Math.round((m * x) + b);
						PutPixel(x, y, FColour);
					}
				} else {
					if (dx >= dy) {
						for (x = Start; x <= End; x++) {
							y = Math.round((m * x) + b);
							PutPixel(x, y - 1, FColour);
							PutPixel(x, y, FColour);
							PutPixel(x, y + 1, FColour);
						}
					} else {
						for (x = Start; x <= End; x++) {
							y = Math.round((m * x) + b);
							PutPixel(x - 1, y, FColour);
							PutPixel(x, y, FColour);
							PutPixel(x + 1, y, FColour);
						}
					}
				}
				
				// Solve for x using x=(y-b)/m
				Start = Math.min(y0, y1);
				End = Math.max(y0, y1);
				if (FLineSettings.Thickness == LineThickness.Normal) {
					for (y = Start; y <= End; y++) {
						x = Math.round((y - b) / m);
						PutPixel(x, y, FColour);
					}
				} else {
					if (dx >= dy) {
						for (y = Start; y <= End; y++) {
							x = Math.round((y - b) / m);
							PutPixel(x, y - 1, FColour);
							PutPixel(x, y, FColour);
							PutPixel(x, y + 1, FColour);
						}
					} else {
						for (y = Start; y <= End; y++) {
							x = Math.round((y - b) / m);
							PutPixel(x - 1, y, FColour);
							PutPixel(x, y, FColour);
							PutPixel(x + 1, y, FColour);
						}
					}
				}
			} else {
				var i: int = 0;

				// Calculate dx (and check if vertical)
				dx = x1 - x0;
				if (dx == 0) {
					Start = Math.min(y0, y1);
					End = Math.max(y0, y1);
					if (FLineSettings.Thickness == LineThickness.Normal) {
						for (y = Start; y <= End; y++) {
							if ((FLineSettings.Pattern & (1 << (i++ & 15))) != 0) PutPixel(x0, y, FColour);
						}
					} else {
						x0minus = x0 - 1;
						x0plus = x0 + 1;
						
						for (y = Start; y <= End; y++) {
							if ((FLineSettings.Pattern & (1 << (i++ & 15))) != 0) {
								PutPixel(x0minus, y, FColour);
								PutPixel(x0, y, FColour);
								PutPixel(x0plus, y, FColour);
							}
						}
					}
					return;
				}
				
				// Calculate dy (and check if horizontal)
				dy = y1 - y0;
				if (dy == 0) {
					Start = Math.min(x0, x1);
					End = Math.max(x0, x1);
					if (FLineSettings.Thickness == LineThickness.Normal) {
						for (x = Start; x <= End; x++) {
							if ((FLineSettings.Pattern & (1 << (i++ & 15))) != 0) PutPixel(x, y0, FColour);
						}
					} else {
						y0minus = y0 - 1;
						y0plus = y0 + 1;
						
						for (x = Start; x <= End; x++) {
							if ((FLineSettings.Pattern & (1 << (i++ & 15))) != 0) {
								PutPixel(x, y0minus, FColour);
								PutPixel(x, y0, FColour);
								PutPixel(x, y0plus, FColour);
							}
						}
					}
					return;
				}
				
				// Calculate m and b
				m = dy / dx;
				b = y0 - (m * x0);
				
				// Solve for y using y=mx+b
				Start = Math.min(x0, x1);
				End = Math.max(x0, x1);
				if (FLineSettings.Thickness == LineThickness.Normal) {
					for (x = Start; x <= End; x++) {
						if ((FLineSettings.Pattern & (1 << (i++ & 15))) != 0) {
							y = Math.round((m * x) + b);
							PutPixel(x, y, FColour);
						}
					}
				} else {
					if (dx >= dy) {
						for (x = Start; x <= End; x++) {
							if ((FLineSettings.Pattern & (1 << (i++ & 15))) != 0) {
								y = Math.round((m * x) + b);
								PutPixel(x, y - 1, FColour);
								PutPixel(x, y, FColour);
								PutPixel(x, y + 1, FColour);
							}
						}
					} else {
						for (x = Start; x <= End; x++) {
							if ((FLineSettings.Pattern & (1 << (i++ & 15))) != 0) {
								y = Math.round((m * x) + b);
								PutPixel(x - 1, y, FColour);
								PutPixel(x, y, FColour);
								PutPixel(x + 1, y, FColour);
							}
						}
					}
				}
				
				// Solve for x using x=(y-b)/m
				Start = Math.min(y0, y1);
				End = Math.max(y0, y1);
				if (FLineSettings.Thickness == LineThickness.Normal) {
					for (y = Start; y <= End; y++) {
						if ((FLineSettings.Pattern & (1 << (i++ & 15))) != 0) {
							x = Math.round((y - b) / m);
							PutPixel(x, y, FColour);
						}
					}
				} else {
					if (dx >= dy) {
						for (y = Start; y <= End; y++) {
							if ((FLineSettings.Pattern & (1 << (i++ & 15))) != 0) {
								x = Math.round((y - b) / m);
								PutPixel(x, y - 1, FColour);
								PutPixel(x, y, FColour);
								PutPixel(x, y + 1, FColour);
							}
						}
					} else {
						for (y = Start; y <= End; y++) {
							if ((FLineSettings.Pattern & (1 << (i++ & 15))) != 0) {
								x = Math.round((y - b) / m);
								PutPixel(x - 1, y, FColour);
								PutPixel(x, y, FColour);
								PutPixel(x + 1, y, FColour);
							}
						}
					}
				}
			}
		}
		
		static public function xLine(AX1: int, AY1: int, AX2: int, AY2: int): void
		{
			if (FLineSettings.Style != LineStyle.Solid) {
				trace("Line() only supports solid line types");
				FLineSettings.Style = LineStyle.Solid;
				FLineSettings.Pattern = 0xFFFF;
			}
			if (FWriteMode == WriteMode.XOR) {
				trace("Line() doesn't support XOR write mode");
			}
			
			var i: int;
			var x: int;
			var y: int;
			
			if (FLineSettings.Style == LineStyle.Solid) {
				// Solid lines
				if (AX1 == AX2) {
					// Vertical solid
					var YStart: int = Math.min(AY1, AY2);
					var YEnd: int = Math.max(AY1, AY2);

					if (FLineSettings.Thickness == LineThickness.Normal) {
						// Vertical solid normal
						for (y = YStart; y <= YEnd; y++) {
							// TODO clip ahead of time so we can set colour via FPixels[] directly?
							PutPixel(AX1, y, FColour);
						}
					} else {
						// Vertical solid thick
						for (y = YStart; y <= YEnd; y++) {
							// TODO clip ahead of time so we can set colour via FPixels[] directly?
							PutPixel(AX1 - 1, y, FColour);
							PutPixel(AX1, y, FColour);
							PutPixel(AX1 + 1, y, FColour);
						}
					}
				} else if (AY1 == AY2) {
					// Horizontal solid
					var XStart: int = Math.min(AX1, AX2);
					var XEnd: int = Math.max(AX1, AX2);
					
					if (FLineSettings.Thickness == LineThickness.Normal) {
						// Horizontal solid normal
						for (x = XStart; x <= XEnd; x++) {
							// TODO clip ahead of time so we can set colour via FPixels[] directly?
							PutPixel(x, AY1, FColour);
						}
					} else {
						// Horizontal solid thick
						for (x = XStart; x <= XEnd; x++) {
							// TODO clip ahead of time so we can set colour via FPixels[] directly?
							PutPixel(x, AY1 - 1, FColour);
							PutPixel(x, AY1, FColour);
							PutPixel(x, AY1 + 1, FColour);
						}
					}
				} else {
					// Sloped solid
					
					// Calculate deltax and deltay for initialisation
					var deltax: int = Math.abs(AX2 - AX1);
					var deltay: int = Math.abs(AY2 - AY1);
					
					// Initialize all vars based on which is the independent variable
					var yslopesmore: Boolean;
					var numpixels: int;
					var d: int;
					var dinc1: int;
					var dinc2: int;
					var xinc1: int;
					var xinc2: int;
					var yinc1: int;
					var yinc2: int;;
					if (deltax >= deltay) {					
						// x is independent variable
						yslopesmore = false;
						numpixels = deltax + 1;
						d = (2 * deltay) - deltax;
						dinc1 = deltay << 1;
						dinc2 = (deltay - deltax) << 1;
						xinc1 = 1;
						xinc2 = 1;
						yinc1 = 0;
						yinc2 = 1;
					} else {
						// y is independent variable
						yslopesmore = true;
						numpixels = deltay + 1;
						d = (2 * deltax) - deltay;
						dinc1 = deltax << 1;
						dinc2 = (deltax - deltay) << 1;
						xinc1 = 0;
						xinc2 = 1;
						yinc1 = 1;
						yinc2 = 1;
					}
					
					// Make sure x and y move in the right directions
					if (AX1 > AX2) {
						xinc1 *= -1;
						xinc2 *= -1;
					}
					if (AY1 > AY2) {
						yinc1 *= -1;
						yinc2 *= -1;
					}
					
					// Start drawing at <x1, y1>
					x = AX1;
					y = AY1;
					
					if (FLineSettings.Thickness == LineThickness.Normal) {
						// Sloped solid normal
						for (i = 1; i <= numpixels; i++) {
							// TODO clip ahead of time so we can set colour via FPixels[] directly?
							PutPixel(x, y, FColour);
							
							if (d <= 0) { // TODO Used to be < 0, testing wtih <= 0
								d = d + dinc1;
								x = x + xinc1;
								y = y + yinc1;
							} else {
								d = d + dinc2;
								x = x + xinc2;
								y = y + yinc2;
							}
						}
					} else {
						// Solid sloped thick
						for (i = 1; i <= numpixels; i++) {
							// TODO clip ahead of time so we can set colour via FPixels[] directly?
							// all depending on the slope, we can determine in what direction the extra width pixels will be put
							if (yslopesmore) {
								PutPixel(x-1,y, FColour);
								PutPixel(x,y, FColour);
								PutPixel(x+1,y, FColour);
							} else {
								PutPixel(x, y-1, FColour);
								PutPixel(x, y, FColour);
								PutPixel(x, y+1, FColour);
							}
							
							if (d <= 0) { // TODO Testing
								d = d + dinc1;
								x = x + xinc1;
								y = y + yinc1;
							} else {
								d = d + dinc2;
								x = x + xinc2;
								y = y + yinc2;
							}
						}
					}
				}
			} else {
				// TODO Pattern lines
			}
		}
		
		// Moves the current pointer (CP) to (X,Y)
		// The CP is similar to a text mode cursor except that the CP is not visible
		// The following routines move the CP:
		// ClearDevice
		// ClearViewPort
		// GraphDefaults
		// InitGraph
		// LineRel
		// LineTo
		// MoveRel
		// MoveTo
		// OutText
		// SetGraphMode
		// SetViewPort
		// If a viewport is active, the CP will be viewport-relative (the X and Y
		// values will be added to the viewport's X1 and Y1 values). The CP is never
		// clipped at the current viewport's boundaries.
		static public function MoveTo(AX: int, AY: int): void
		{
			FCursorPosition.x = AX;
			FCursorPosition.y = AY;
		}
		
		static private function OnExitFrame(e: Event): void
		{
			if (FDirty != DirtyType.None) {
				FDirty = DirtyType.None;
				FBitmap.bitmapData.setVector(new flash.geom.Rectangle(0, 0, PIXELS_X, PIXELS_Y), FPixels);
			}
		}
		
		// Sends a string to the output device at the current pointer.
		// Displays TextString at the CP using the current justification settings.
		// TextString is truncated at the viewport border if it is too long.
		//	- If one of the stroked fonts is active, TextString is truncated at the
		//    screen boundary if it is too long.
		//	- If the default (bit-mapped) font is active and the string is too long to
		//    fit on the screen, no text is displayed.
		// OutText uses the font set by SetTextStyle. To maintain code compatibility
		// when using several fonts, use the TextWidth and TextHeight calls to
		// determine the dimensions of the string.
		// OutText uses the output options set by SetTextJustify (justify, center,
		// rotate 90 degrees, and so on).
		static public function OutText(AText: String): void
		{
			OutTextXY(FCursorPosition.x, FCursorPosition.y, AText);
			if ((FTextSettings.Direction == TextOrientation.Horizontal) && (FTextSettings.HorizontalAlign == TextJustification.Left)) {
				FCursorPosition.x += TextWidth(AText);
				if (FCursorPosition.x > 639) FCursorPosition.x = 639;
			}
		}
		
		// Sends a string to the output device.
		// Displays TextString at (X, Y). TextString is truncated at the viewport
		// border if it is too long. If one of the stroked fonts is active, TextString
		// is truncated at the screen boundary if it is too long. If the default
		// (bit-mapped) font is active and the string is too long to fit on the screen,
		// no text is displayed.
		// Use OutText to output text at the current pointer; use OutTextXY to output
		// text elsewhere on the screen.
		// OutTextXY uses the font set by SetTextStyle. To maintain code compatibility
		// when using several fonts, use the TextWidth and TextHeight calls to
		// determine the dimensions of the string.
		// OutTextXY uses the output options set by SetTextJustify (justify, center,
		// rotate 90 degrees, and so on).
		static public function OutTextXY(AX: int, AY: int, AText: String): void
		{
			var ATextlength: int = AText.length;

			// Store values for putting back later
			var OldLinePattern: int = FLineSettings.Pattern;
			var OldLineStyle: int = FLineSettings.Style;
			var OldLineThickness: int = FLineSettings.Thickness;
			
			// Set values for text output
			FLineSettings.Pattern = 0xFFFF;
			FLineSettings.Style = LineStyle.Solid;
			FLineSettings.Thickness = LineThickness.Normal;
			
			var i: int;
			if (FTextSettings.Font == 0) {
				// Bitmap font				
				for (i = 0; i < ATextlength; i++) {
					var Code: int = AText.charCodeAt(i);
					
					if (FTextSettings.Direction == TextOrientation.Vertical) {
						// Vertical
						if (FTextSettings.Size == 1) {
							// TODO Vertical Normal Size
						} else {
							// TODO Vertical Scaled Size
						}
						
						// Move over the width of the character
						AY -= 8 * FTextSettings.Size;
					} else {
						// Horizontal
						if (FTextSettings.Size == 1) {
							// Horizontal Normal Size
							for (var y: int = 0; y < 8; y++) {
								for (var x: int = 0; x < 8; x++) {
									if (BitmapFont.Pixels[Code][y][x] != 0) {
										// TODO clip ahead of time so we can set colour via FPixels[] directly?
										PutPixel(AX + x, AY + y, FColour);
									}
								}
							}
						} else {
							// Horizontal Scaled Size
							var yy: int = 0;
							var cnt3: int = 0;
							
							while (yy <= 7) {
								for (var cnt4: int = 0; cnt4 < FTextSettings.Size; cnt4++) {
									var xx: int = 0;
									var cnt2: int = 0;
									while (xx <= 7) {
										for (var cnt1: int = 0; cnt1 < FTextSettings.Size; cnt1++) {
											if (BitmapFont.Pixels[Code][yy][xx] != 0) {
												// TODO clip ahead of time so we can set colour via FPixels[] directly?
												PutPixel(AX + cnt1 + cnt2, AY + cnt3 + cnt4, FColour);
											}
										}
										xx++;
										cnt2 += FTextSettings.Size;
									}
								}
								yy++;
								cnt3 += FTextSettings.Size;
							}
						}
						
						// Move over the width of the character
						AX += 8 * FTextSettings.Size;
					}
				}
			} else { 
				// Stroke font
				for (i = 0; i < ATextlength; i++) {
					var LastPoint: Point = new Point(AX, AY);
					var NextPoint: Point = new Point(AX, AY);
					
					var Strokes: Array = StrokeFont.Strokes[FTextSettings.Font - 1][AText.charCodeAt(i)];
					var Strokeslength: int = Strokes.length;
					for (var j: int = 1; j < Strokeslength; j++) {
						if (FTextSettings.Direction == TextOrientation.Vertical) {
							NextPoint.x = AX + int(Strokes[j][2] * FTextSettings.StrokeScaleY); // TODO Is this right to flip Y and X?
							NextPoint.y = AY - int(Strokes[j][1] * FTextSettings.StrokeScaleX); // TODO Is this right to flip Y and X?
						} else {
							NextPoint.x = AX + int(Strokes[j][1] * FTextSettings.StrokeScaleX);
							NextPoint.y = AY + int(Strokes[j][2] * FTextSettings.StrokeScaleY);
						}
						
						if (Strokes[j][0] == StrokeFont.DRAW) {
							Line(LastPoint.x, LastPoint.y, NextPoint.x, NextPoint.y);	
						}
						
						LastPoint.x = NextPoint.x;
						LastPoint.y = NextPoint.y;
					}
					
					// Move over the width of the character
					if (FTextSettings.Direction == TextOrientation.Vertical) {
						AY -= int(Strokes[0] * FTextSettings.StrokeScaleX); // TODO Is it right to use X here and not Y?
					} else {
						AX += int(Strokes[0] * FTextSettings.StrokeScaleX);
					}
				}
			}
			
			// Reset original values
			FLineSettings.Pattern = OldLinePattern;
			FLineSettings.Style = OldLineStyle;
			FLineSettings.Thickness = OldLineThickness;
		}

		// Draws and fills a pie slice
		// (X,Y) is the center point. The pie slice starts at StAngle, ends at
		// EndAngle.
		static public function PieSlice(AX: int, AY: int, AStartAngle: int, AEndAngle: int, ARadius: int): void
		{
			Sector(AX, AY, AStartAngle, AEndAngle, ARadius, int(ARadius * ASPECT_RATIO));
		}
		
		// Check if the given point is inside the given polygon
		// Adapted from http://www.alienryderflex.com/polygon/
		static public function xPointInPoly(AX: int, AY: int, APoints: Vector.<Point>): Boolean
		{
			var i: int;
			var j: int = APoints.length - 1;
			var oddNodes: Boolean = false;
			
			var APointslength: int = APoints.length;
			for (i = 0; i < APointslength; i++) {
				if ((APoints[i].y < AY && APoints[j].y >= AY || APoints[j].y < AY && APoints[i].y >= AY) && (APoints[i].x <= AX || APoints[j].x <= AX)) {
					if (APoints[i].x + (AY - APoints[i].y) / (APoints[j].y - APoints[i].y) * (APoints[j].x - APoints[i].x) < AX) {
						oddNodes = !oddNodes; 
					}
				}
				j = i; 
			}
			
			return oddNodes; 
		}
		
		// Check if the given point is inside the given polygon
		// Adapted from http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
		static public function PointInPoly(AX: int, AY: int, APoints: Vector.<Point>): Boolean
		{
			var i: int = 0;
			var j: int = 0;
			var c: Boolean = false;

			var APointslength: int = APoints.length;
			for (i = 0, j = APointslength-1; i < APointslength; j = i++) {
				if ( ((APoints[i].y>AY) != (APoints[j].y>AY)) && (AX < (APoints[j].x-APoints[i].x) * (AY-APoints[i].y) / (APoints[j].y-APoints[i].y) + APoints[i].x) )
					c = !c;
			}
			return c;
		}

		// Puts a bit image onto the screen.
		// (X, Y) is the upper left corner of a rectangular region on the screen.
		// BitMap is an untyped parameter that contains the height and width of the
		// region, and the bit image that will be put onto the screen. BitBlt specifies
		// which binary operator will be used to put the bit image onto the screen.
		// Each constant corresponds to a binary operation. For example:
		// PutImage(X, Y, BitMap, NormalPut) puts the image stored in BitMap at (X, Y)
		// using the assembly language MOV instruction for each byte in the image.
		// PutImage(X, Y, BitMap, XORPut) puts the image stored in BitMap at (X, Y)
		// using the assembly language XOR instruction for each byte in the image. This
		// is an often-used animation technique for "dragging" an image around the
		// screen.
		// PutImage(X, Y, BitMap, NotPut) inverts the bits in BitMap and then puts the
		// image stored in BitMap at (X, Y) using the assembly language MOV for each
		// byte in the image. Thus, the image appears in inverse video of the original
		// BitMap.
		static public function PutImage(AX: int, AY: int, ABitMap: BitmapData, ABitBlt: int): void
		{
			// Check for out out bound coordinates
			if ((AX < 0) || (AY < 0) || (AX >= PIXELS_X) || (AY >= PIXELS_Y)) return;

			if (ABitBlt != WriteMode.Copy) {
				trace("PutImage() only supports COPY mode");
				ABitBlt = WriteMode.Copy;
			}			
			
			if (ABitMap != null) {
				var AX1: int = AX;
				var AY1: int = AY;
				var AX2: int = AX1 + ABitMap.width - 1;
				var AY2: int = AY1 + ABitMap.height - 1;
				
				// Ensure valid right and bottom
				if (AX2 >= PIXELS_X) AX2 = (PIXELS_X - 1);
				if (AY2 >= PIXELS_Y) AY2 = (PIXELS_Y - 1);
				
				// Indicate that we need to repaint
				FDirty = DirtyType.Pixel;
				
				var V: Vector.<uint> = ABitMap.getVector(new flash.geom.Rectangle(0, 0, ABitMap.width, ABitMap.height));
				
				var InOffset: int = 0;
				var OutOffset: int = AX1 + (AY1 * PIXELS_X);
				var RowSkip: int = ((PIXELS_X - 1) - AX2) + (AX1);
				for (var y: int = AY1; y <= AY2; y++) {
					for (var x: int = AX1; x <= AX2; x++) {
						FPixels[OutOffset++] = V[InOffset++]; // OPTIMIZATION: AVOID FUNCTION CALL RawPutPixel RawPutPixel(OutOffset++, V[InOffset++]);
					}
					OutOffset += RowSkip;
				}
			}
		}
		
		// Plots a pixel at X,Y
		// Plots a point in the color defined by Pixel at (X, Y).
		static public function PutPixelDefault(AX: int, AY: int, APaletteIndex: int): void
		{
			// Check for out out bound coordinates
			if ((AX < 0) || (AY < 0) || (AX >= PIXELS_X) || (AY >= PIXELS_Y)) return;
			
			if ((FViewPortSettings.Clip) && (!FViewPortSettings.FullScreen)) {
				// Convert to global coordinates
				AX += FViewPortSettings.x1;
				AY += FViewPortSettings.y1;
				
				// Ensure x and y are in the visible viewport
				if (AX > FViewPortSettings.x2) return;
				if (AY > FViewPortSettings.y2) return;
			}
			
			// Draw pixel
			var Pos: int = AX + (AY * PIXELS_X);
			if ((Pos >= 0) && (Pos < PIXELS)) {
				// Indicate that we need to repaint
				FDirty = DirtyType.Pixel;
				FPixels[Pos] = CURRENT_PALETTE[APaletteIndex];
			}
		}

		// Plots a pixel at X,Y
		// Plots a point in the color defined by Pixel at (X, Y).
		static public function PutPixelPoly(AX: int, AY: int, APaletteIndex: int): void
		{
			// Check for out out bound coordinates (PutPixelDefault does this, but it's also important for the FFillPolyMap line below)
			if ((AX < 0) || (AY < 0) || (AX >= PIXELS_X) || (AY >= PIXELS_Y)) return;

			// Use the default function to draw the pixel
			PutPixelDefault(AX, AY, APaletteIndex);

			// Record the (non-viewport-modified) pixel location if we're filling a polygon
			FFillPolyMap[AX][AY] = 1;
		}
		
		// Directly puts the specified colour into the pixel vector
		// Does not adjust for viewport, or test if point is valid, so calling function should do this
		// NB: Takes an actual colour, not a palette index, as a parameter
		// OPTIMIZATION: AVOID FUNCTION CALL static public function RawPutPixel(APos: int, AColour: uint): void
		//{
		//	FPixels[APos] = AColour;
		//}

		// Draws a rectangle, using the current line style and color.
		// (X1, Y1) define the upper left corner of the rectangle, and (X2, Y2) define
		// the lower right corner (0 <= X1 < X2 <= GetMaxX, and 0 <= Y1 < Y2 <=
		// GetMaxY).
		// Draws the rectangle in the current line style and color, as set by
		// SetLineStyle and SetColor. Use SetWriteMode to determine whether the
		// rectangle is copied or XOR'd to the screen.
		static public function Rectangle(x1: int, y1: int, x2: int, y2: int): void
		{
			Line(x1, y1, x2, y1);
			Line(x2, y1, x2, y2);
			Line(x2, y2, x1, y2);
			Line(x1, y2, x1, y1);
		}

		// Draws and fills an elliptical sector.
		// Using (X, Y) as the center point, XRadius and YRadius specify the horizontal
		// and vertical radii, respectively; Sector draws from StAngle to EndAngle,
		// outlined in the current color and filled with the pattern and color defined
		// by SetFillStyle or SetFillPattern.
		// A start angle of 0 and an end angle of 360 will draw and fill a complete
		// ellipse. The angles for Arc, Ellipse, FillEllipse, PieSlice, and Sector are
		// counter-clock-wise with 0 degrees at 3 o'clock, 90 degrees at 12 o'clock,
		// and so on.
		static public function Sector(AX: int, AY: int, AStartAngle: int, AEndAngle: int, AXRadius: int, AYRadius: int): void
		{
			Ellipse(AX, AY, AStartAngle, AEndAngle, AXRadius, AYRadius);
			// TODO Looks like we need the GetArcCoords() after all!
			// TODO Line(ArcCall.XStart, ArcCall.YStart, x,y);
			// TODO Line(x,y,ArcCall.Xend,ArcCall.YEnd);
		}
		
		// Changes all palette colors as specified.
		static public function SetAllPalette(APalette: Vector.<int>, AUpdateScreen: Boolean = true): void
		{
			// OPTIMIZATION: If the last operation was to clear the viewport, and the viewport is the full screen, then
			//               FDirty will be DirtyType.Clear.  In this case, we know the screen contains only pixels
			//               coloured in the background colour, so we only need to update the screen pixels for the
			//               background palette entry, and not the subsequent 15 palette entries
			if (FDirty == DirtyType.Clear) {
				SetPalette(FBackColour, APalette[FBackColour], true);
				AUpdateScreen = false;				
			}

			var APalettelength: int = APalette.length;
			for (var i: int = 0; i < APalettelength; i++) {
				SetPalette(i, APalette[i], AUpdateScreen);
			}
		}
		
		// Sets the current background color, using the palette.
		// SetBkColor(5) makes the fifth color in the palette the current background color.
		// Background colors can range from 0 to 15, depending on the current graphics
		// driver and current graphics mode.
		// GetMaxColor returns the highest valid color for the current driver and mode.
		static public function SetBkColour(AColour: int): void
		{
			FBackColour = AColour;
		}
		
		// Sets the current drawing color, using the palette.
		// SetColor(5) makes the fifth color in the palette the current drawing color.
		// Drawing colors can range from 0 to 15, depending on the current graphics
		// driver and current graphics mode.
		// GetMaxColor returns the highest valid color for the current driver and mode.
		static public function SetColour(AColour: int): void
		{
			if ((AColour < 0) || (AColour > 15)) {
				trace("Not a valid colour: " + AColour);
				return;
			}
			FColour = AColour;
		}

		// Selects a user-defined fill pattern.
		static public function SetFillPattern(APattern: Vector.<int>, AColour: int): void
		{
			const ANDArray: Vector.<int> = Vector.<int>([128, 64, 32, 16, 8, 4, 2, 1]);
			
			// Fill pattern vector's first 8 lines
			var Offset: int = 0;
			for (var y: int = 0; y < 8; y++) {
				for (var x: int = 0; x < PIXELS_X; x++) {
					FFillSettings.Pattern[Offset++] = ((APattern[y] & ANDArray[x & 7]) == 0) ? 0 : 15; // OPTIMIZATION: AND 7 is the same as MOD 8, but faster!
				}
			}
			
			// Fill the rest of the pattern vector with the repeating pattern
			Offset = 0;
			for (var i: int = 640 * 8; i < PIXELS; i++) {
				FFillSettings.Pattern[i] = FFillSettings.Pattern[Offset++];
			}

			if ((AColour < 0) || (AColour > 15)) {
				trace("Invalid fill colour: " + AColour);
			} else {
				FFillSettings.Colour = AColour;
			}
			FFillSettings.Style = FillStyle.User;
		}
		
		static public function SetFillSettings(AFillSettings: TFillSettings): void
		{
			FFillSettings = AFillSettings;	
		}
		
		// Sets the fill pattern and color.
		// Sets the pattern and color for all filling done by FillPoly, Bar, Bar3D, and
		// PieSlice. A variety of fill patterns are available. The default pattern is
		// solid, and the default color is the maximum color in the palette. If invalid
		// input is passed to SetFillStyle, GraphResult returns a value of grError, and
		// the current fill settings will be unchanged. If Pattern equals UserFill, the
		// user-defined pattern (set by a call to SetFillPattern) becomes the active
		// pattern.
		static public function SetFillStyle(AStyle: int, AColour: int): void
		{
			// TODO Should only need to set the pattern if the style is changing, but there was a bug in that somewhere so we're doing it this way for now
			switch (AStyle) {
				// TODO Test each of the fill patterns to ensure they match
				case 0:	 SetFillPattern(Vector.<int>([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]), AColour); break;
				case 1:	 SetFillPattern(Vector.<int>([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]), AColour); break;
				case 2:	 SetFillPattern(Vector.<int>([0xff, 0xff, 0x00, 0x00, 0xff, 0xff, 0x00, 0x00]), AColour); break;
				case 3:	 SetFillPattern(Vector.<int>([0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80]), AColour); break;
				case 4:	 SetFillPattern(Vector.<int>([0x07, 0x0e, 0x1c, 0x38, 0x70, 0xe0, 0xc1, 0x83]), AColour); break;
				case 5:	 SetFillPattern(Vector.<int>([0x07, 0x83, 0xc1, 0xe0, 0x70, 0x38, 0x1c, 0x0e]), AColour); break;
				case 6:	 SetFillPattern(Vector.<int>([0x5a, 0x2d, 0x96, 0x4b, 0xa5, 0xd2, 0x69, 0xb4]), AColour); break;
				case 7:	 SetFillPattern(Vector.<int>([0xff, 0x88, 0x88, 0x88, 0xff, 0x88, 0x88, 0x88]), AColour); break;
				case 8:	 SetFillPattern(Vector.<int>([0x18, 0x24, 0x42, 0x81, 0x81, 0x42, 0x24, 0x18]), AColour); break;
				case 9:	 SetFillPattern(Vector.<int>([0xcc, 0x33, 0xcc, 0x33, 0xcc, 0x33, 0xcc, 0x33]), AColour); break;
				case 10: SetFillPattern(Vector.<int>([0x80, 0x00, 0x08, 0x00, 0x80, 0x00, 0x08, 0x00]), AColour); break;
				case 11: SetFillPattern(Vector.<int>([0x88, 0x00, 0x22, 0x00, 0x88, 0x00, 0x22, 0x00]), AColour); break;
			}
			if ((AColour < 0) || (AColour > 15)) {
				trace("Invalid fill colour: " + AColour);
			} else {
				FFillSettings.Colour = AColour;
			}
			FFillSettings.Style = AStyle;
		}

		// Sets the current line width and style.
		// Affects all lines drawn by Line, LineTo, Rectangle, DrawPoly, Arc, and so
		// on.
		// Lines can be drawn solid, dotted, centerline, or dashed. If invalid input is
		// passed to SetLineStyle, GraphResult returns a value of grError, and the
		// current line settings will be unchanged. See Line style constants for a list
		// of constants used to determine line styles.
		// LineStyle is a value from SolidLn to UserBitLn(0..4), Pattern is ignored
		// unless LineStyle equals UserBitLn, and Thickness is NormWidth or ThickWidth.
		// When LineStyle equals UserBitLn, the line is output using the 16-bit pattern
		// defined by the Pattern parameter. For example, if Pattern = $AAAA, then the
		// 16-bit pattern looks like this:
		static public function SetLineStyle(AStyle: int, APattern: int, AThickness: int): void
		{
			FLineSettings.Style = AStyle;
			switch (AStyle) {
				case 0: FLineSettings.Pattern = 0xFFFF; break;
				case 1: FLineSettings.Pattern = 0x3333; break;
				case 2: FLineSettings.Pattern = 0x1E3F; break;
				case 3: FLineSettings.Pattern = 0x1F1F; break;
				case 4: FLineSettings.Pattern = APattern; break;
			}
			FLineSettings.Thickness = AThickness;
		}
		
		// Changes one palette color as specified by ColorNum and Color.
		// Changes the ColorNum entry in the palette to Color. SetPalette(0, LightCyan)
		// makes the first color in the palette light cyan. ColorNum can range from 0
		// to 15, depending on the current graphics driver and current graphics mode.
		// If invalid input is passed to SetPalette, GraphResult returns a value of
		// grError, and the palette remains unchanged.
		// Changes made to the palette are seen immediately onscreen. In the example
		// here, several lines are drawn onscreen, then the palette is changed
		// randomly. Each time a palette color is changed, all onscreen occurrences of
		// that color will be changed to the new color value. See Color constants for a
		// list of defined color constants.
		static public function SetPalette(ACurrentPaletteIndex: int, AEGAPaletteIndex: int, AUpdateScreen: Boolean = true): void
		{
			if (CURRENT_PALETTE[ACurrentPaletteIndex] != EGA_PALETTE[AEGAPaletteIndex]) {
				// Indicate that we need to repaint
				FDirty = DirtyType.Pixel;
				
				// Update the screen if requested
				if (AUpdateScreen) {
					var OldColour: int = CURRENT_PALETTE[ACurrentPaletteIndex];
					var NewColour: int = EGA_PALETTE[AEGAPaletteIndex];

					var FPixelslength: int = FPixels.length
					for (var i: int = 0; i < FPixelslength; i++) {
						if (FPixels[i] == OldColour) {
							FPixels[i] = NewColour; // OPTIMIZATION: AVOID FUNCTION CALL RawPutPixel RawPutPixel(i, NewColour); 
						}
					}
				}
				
				CURRENT_PALETTE[ACurrentPaletteIndex] = EGA_PALETTE[AEGAPaletteIndex];
			}
		}
		
		// Sets text justification values used by OutText and OutTextXY.
		// Text output after a SetTextJustify will be justified around the current
		// pointer in the manner specified. Given the following,
		// SetTextJustify(CenterText, CenterText);
		// OutTextXY(100, 100, 'ABC');
		// the point (100, 100) will appear in the middle of the letter B. The default
		// justification settings can be restored by SetTextJustify(LeftText, TopText).
		// If invalid input is passed to SetTextJustify, GraphResult returns a value of
		// grError, and the current text justification settings will be unchanged.
		static public function SetTextJustify(AHorizontal: int, AVertical: int): void
		{
			FTextSettings.HorizontalAlign = AHorizontal;
			FTextSettings.VerticalAlign = AVertical;
		}
		
		// Sets style for text output in graphics mode.
		// Sets the current text font, style, and character magnification factor
		static public function SetTextStyle(AFont: int, ADirection: int, ASize: int): void
		{
			FTextSettings.Font = AFont;
			FTextSettings.Direction = ADirection;
			FTextSettings.Size = ASize;
			FTextSettings.SetStrokeScale();
		}

		// Sets the current output viewport or window for crt output
		static public function SetTextWindow(AX1: int, AY1: int, AX2: int, AY2: int, AWrap: int, ASize: int): void
		{
			if ((AX1 == 0) && (AY1 == 0) && (AX2 == 0) && (AY2 == 0)) {
				// Disable crt window
				Crt.Canvas.alpha = 0;
			} else if ((AX2 == 0) || (AY2 == 0)) {
				// Sanity check, do nothing if either of those values are 0
				Crt.Canvas.alpha = 0;
			} else if ((AX1 > AX2) || (AY1 > AY2)) {
				// More sanity checking, do nothing in this case
			} else {
				if ((AX1 == FTextWindow.left) && (AY1 == FTextWindow.top) && (AX2 == FTextWindow.right) && (AY2 == FTextWindow.bottom) && (ASize == FTextSettings.Size)) {
					// Provided same settings, so only update the wrap
					Crt.AutoWrap = (AWrap != 0);
				} else {
					// Provided some new settings, so update everything
					Crt.AutoWrap = (AWrap != 0)
					Crt.SetScreenSize(AX2 - AX1 + 1, AY2 - AY1 + 1);
					switch (ASize) {
						case 0: 
							Crt.Canvas.x = AX1 * 8;
							Crt.Canvas.y = AY1 * 8;
							Crt.SetFont("RIP", 8, 8); 
							break;
						case 1: 
							Crt.Canvas.x = AX1 * 7;
							Crt.Canvas.y = AY1 * 8;
							Crt.SetFont("RIP", 7, 8); 
							break;
						case 2: 
							Crt.Canvas.x = AX1 * 8;
							Crt.Canvas.y = AY1 * 14;
							Crt.SetFont("RIP", 8, 14); 
							break;
						case 3: 
							Crt.Canvas.x = AX1 * 7;
							Crt.Canvas.y = AY1 * 14;
							Crt.SetFont("RIP", 7, 14); 
							break;
						case 4: 
							Crt.Canvas.x = AX1 * 16;
							Crt.Canvas.y = AY1 * 14;
							Crt.SetFont("RIP", 16, 14); 
							break;
					}
					Crt.TextAttr = 15;
					Crt.ClrScr();
					Crt.Canvas.alpha = 1;
				}
			}
		}
		
		// Sets the current output viewport or window for graphics output
		// (X1, Y1) define the upper left corner of the viewport, and (X2, Y2) define
		// the lower right corner (0 <= X1 < X2 and 0 <= Y1 < Y2). The upper left
		// corner of a viewport is (0, 0).
		// The Boolean parameter Clip determines whether drawings are clipped at the
		// current viewport boundaries. SetViewPort(0, 0, GetMaxX, GetMaxY, True)
		// always sets the viewport to the entire graphics screen. If invalid input is
		// passed to SetViewPort, GraphResult returns grError, and the current view
		// settings will be unchanged.
		// All graphics commands (for example, GetX, OutText, Rectangle, MoveTo, and so
		// on) are viewport-relative. In the following example, the coordinates of the
		// dot in the middle are relative to the boundaries of the viewport.
		// If the Boolean parameter Clip is set to True when a call to SetViewPort is
		// made, all drawings will be clipped to the current viewport. Note that the
		// current pointer is never clipped. The following will not draw the complete
		// line requested because the line will be clipped to the current viewport:
		static public function SetViewPort(AX1: int, AY1: int, AX2: int, AY2: int, AClip: Boolean): void
		{
			if ((AX1 < 0) || (AX1 > AX2)) return;
			if ((AY1 < 0) || (AY1 > AY2)) return;
			if (AX2 > (PIXELS_X - 1)) return;
			if (AY2 > (PIXELS_Y - 1)) return;
			
			FViewPortSettings.x1 = AX1;
			FViewPortSettings.y1 = AY1;
			FViewPortSettings.x2 = AX2;
			FViewPortSettings.y2 = AY2;
			FViewPortSettings.Clip = AClip;
			
			FViewPortSettings.FromBottom = (PIXELS_Y - 1) - AY2;  
			FViewPortSettings.FromLeft = AX1;
			FViewPortSettings.FromRight = (PIXELS_X - 1) - AX2;
			FViewPortSettings.FromTop = AY1;
			FViewPortSettings.FullScreen = ((AX1 == 0) && (AY1 == 0) && (AX2 == (PIXELS_X - 1)) && (AY2 == (PIXELS_Y - 1)));
		}
		
		// Sets the writing mode for line drawing.
		// Each binary operation constant corresponds to a binary operation between
		// each byte in the line and the corresponding bytes on the screen. CopyPut
		// uses the assembly language MOV instruction, overwriting with the line
		// whatever is on the screen. XORPut uses the XOR command to combine the line
		// with the screen. Two successive XOR commands will erase the line and restore
		// the screen to its original appearance.
		// SetWriteMode affects calls to the following routines only: DrawPoly, Line,
		// LineRel, LineTo, and Rectangle.
		static public function SetWriteMode(AMode: int): void
		{
			if (AMode != WriteMode.Normal) {
				trace("SetWriteMode() only supports normal write mode");
				AMode = WriteMode.Normal;
			}
			FWriteMode = AMode;

			//TODO FPC Says this is how it works:
			//Case writemode of
			//xorput, andput: CurrentWriteMode := XorPut;
			//notput, orput, copyput: CurrentWriteMode := CopyPut;
			//End;
			
		}
		
		// Returns the height of a string, in pixels.
		// Takes the current font size and multiplication factor, and determines the
		// height of TextString in pixels. This is useful for adjusting the spacing
		// between lines, computing viewport heights, sizing a title to make it fit on
		// a graph or in a box, and more.
		// For example, with the 8x8 bit-mapped font and a multiplication factor of 1
		// (set by SetTextStyle), the string Turbo is 8 pixels high.
		// It is important to use TextHeight to compute the height of strings, instead
		// of doing the computation manually. In that way, no source code modifications
		// have to be made when different fonts are selected.
		static public function TextHeight(AText: String): int
		{
			if (FTextSettings.Font == 0) {
				return FTextSettings.Size * 8;
			} else {
				return StrokeFont.Heights[FTextSettings.Font - 1] * FTextSettings.StrokeScaleY;
			}
		}
		
		static public function TextWidth(AText: String): int
		{
			var ATextlength: int = AText.length;

			if (FTextSettings.Font == 0) {
				return ATextlength * (FTextSettings.Size * 8);
			} else {
				var Result: int = 0;
				for (var i: int = 0; i < ATextlength; i++) {
					var Strokes: Array = StrokeFont.Strokes[FTextSettings.Font - 1][AText.charCodeAt(i)];
					Result += int(Strokes[0] * FTextSettings.StrokeScaleX);
				}			
				return Result;
			}
		}
		
		// TODO DEBUG
		/*static public function dump(outfile: File): void
		{
			RIP.OnEnterFrame(null);
			var outstreamfinal:FileStream = new FileStream();
			outstreamfinal.open(outfile, FileMode.WRITE);
			for (var k: int = 0; k < FPixels.length; k++) {
				outstreamfinal.writeUnsignedInt(FPixels[k]);
			}
			outstreamfinal.close();
		}*/
	}
}