package randm.graph
{
	public class TViewPortSettings
	{
		public var x1: int;
		public var y1: int;
		public var x2: int;
		public var y2: int;
		public var Clip: Boolean;
		
		// Useful variables
		public var FromBottom: int;
		public var FromLeft: int;
		public var FromRight: int;
		public var FromTop: int;
		public var FullScreen: Boolean;
		
		public function TViewPortSettings()
		{
			x1 = 0;
			y1 = 0;
			x2 = 639;
			y2 = 349;
			Clip = true;
			
			FromBottom = 0;
			FromLeft = 0;
			FromRight = 0;
			FromTop = 0;
			FullScreen = true;
		}
	}
}