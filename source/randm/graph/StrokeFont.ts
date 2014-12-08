package randm.graph
{
	import com.adobe.serialization.json.JSON;
	
	import flash.events.Event;
	import flash.events.IOErrorEvent;
	import flash.net.URLLoader;
	import flash.net.URLLoaderDataFormat;
	import flash.net.URLRequest;
	import flash.utils.ByteArray;
	import flash.utils.IDataInput;
	
	import nochump.util.zip.ZipEntry;
	import nochump.util.zip.ZipFile;
	
	public class StrokeFont
	{
		static public const MOVE: int = 0;
		static public const DRAW: int = 1;
		static public const Heights: Array = [31, 9, 32, 32, 37, 35, 31, 35, 55, 60];
		static public var Strokes: Array = [];
		static public var Loaded: Boolean = false;
		
		static private var FStrokeLoader: URLLoader;

		static private function InitStrokesArray(): void
		{
			// This initializes the strokes array so that all 256 chars in all 10 fonts are blank
			// This is so if we fail loading the strokes array from the HTTP server, the client won't crash (but it means stroke font text won't display)
			for (var Stroke: int = 0; Stroke < 10; Stroke++) {
				var Chars: Array = [];
				for (var Char: int = 0; Char < 256; Char++) {
					Chars.push([[0],[0,0,0]]);
				}
				Strokes.push(Chars);
			}
		}

		static private function OnStrokeLoaderComplete(e: Event): void
		{
			var File: ZipFile = new ZipFile(e.target.data);
			var BA: ByteArray = File.getInput(File.entries[0]);
			Strokes = com.adobe.serialization.json.JSON.decode(BA.readMultiByte(BA.length, "ascii"));
			Loaded = true;
		}
		
		static private function OnStrokeLoaderIOError(ioe: IOErrorEvent): void
		{
			trace("Error loading StrokeFont.zip: " + ioe);
			Loaded = true;
		}
		
		// Static constructor
		{
			// Initialize to empty strokes array
			InitStrokesArray();

			// Load the Stokes.json
			FStrokeLoader = new URLLoader();
			FStrokeLoader.addEventListener(Event.COMPLETE, OnStrokeLoaderComplete);
			FStrokeLoader.addEventListener(IOErrorEvent.IO_ERROR, OnStrokeLoaderIOError);
			FStrokeLoader.dataFormat = URLLoaderDataFormat.BINARY;
			try {
				FStrokeLoader.load(new URLRequest("http://www.ftelnet.ca/ftelnet-resources/fonts/StrokeFont.zip"));
			} catch (e: Error) {
				// Probably try to load via file://
				OnStrokeLoaderIOError(new IOErrorEvent("LoadError"));
			}
		}
	}
}