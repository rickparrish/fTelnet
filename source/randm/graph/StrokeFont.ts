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
class StrokeFont {
    public static MOVE: number = 0;
    public static DRAW: number = 1;
    public static Heights: number[] = [31, 9, 32, 32, 37, 35, 31, 35, 55, 60];
    public static Strokes: any[] = [];
    public static Loaded: Boolean = false;

    //TODO private static _StrokeLoader: URLLoader;

    private static InitStrokesArray(): void {
        // This initializes the strokes array so that all 256 chars in all 10 fonts are blank
        // This is so if we fail loading the strokes array from the HTTP server, the client won't crash (but it means stroke font text won't display)
        for (var Stroke: number = 0; Stroke < 10; Stroke++) {
            var Chars: any[] = [];
            for (var Char: number = 0; Char < 256; Char++) {
                Chars.push([[0], [0, 0, 0]]);
            }
            this.Strokes.push(Chars);
        }
    }

    //TODO
    //private static OnStrokeLoaderComplete(e: Event): void {
    //    var File: ZipFile = new ZipFile(e.target.data);
    //    var BA: ByteArray = File.getInput(File.entries[0]);
    //    Strokes = com.adobe.serialization.json.JSON.decode(BA.readMultiByte(BA.length, "ascii"));
    //    Loaded = true;
    //}

    //private static OnStrokeLoaderIOError(ioe: IOErrorEvent): void {
    //    trace("Error loading StrokeFont.zip: " + ioe);
    //    Loaded = true;
    //}

    //	// Static constructor
    //	{
    //// Initialize to empty strokes array
    //InitStrokesArray();

    //// Load the Stokes.json
    //FStrokeLoader = new URLLoader();
    //FStrokeLoader.addEventListener(Event.COMPLETE, OnStrokeLoaderComplete);
    //FStrokeLoader.addEventListener(IOErrorEvent.IO_ERROR, OnStrokeLoaderIOError);
    //FStrokeLoader.dataFormat = URLLoaderDataFormat.BINARY;
    //try {
    //    FStrokeLoader.load(new URLRequest("http://www.ftelnet.ca/ftelnet-resources/fonts/StrokeFont.zip"));
    //} catch (e: Error) {
    //    // Probably try to load via file://
    //    OnStrokeLoaderIOError(new IOErrorEvent("LoadError"));
    //}
    //	}
}
