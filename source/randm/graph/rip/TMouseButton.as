package randm.graph.rip
{
	import flash.geom.Rectangle;

	public class TMouseButton
	{
		private var FCoords: Rectangle;
		private var FFlags: int;
		private var FHostCommand: String;
		private var FHotKey: String;
		
		public function TMouseButton(ACoords: Rectangle, AHostCommand: String, AFlags: int, AHotKey: String)
		{
			FCoords = ACoords;
			FHostCommand = AHostCommand;
			FFlags = AFlags;
			FHotKey = AHotKey;
		}
		
		public function get Coords(): Rectangle
		{
			return FCoords;
		}
		
		public function DoResetScreen(): Boolean
		{
			return ((FFlags & 4) == 4);	
		}
		
		public function get HotKey(): String
		{
			return FHotKey;			
		}
		
		public function IsInvertable(): Boolean
		{
			return ((FFlags & 2) == 2); 			
		}
		
		public function get HostCommand(): String
		{
			return FHostCommand;
		}
	}
}