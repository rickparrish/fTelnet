package randm.graph
{
	public class TFillSettings
	{
		public var Colour: int;
		public var Pattern: Vector.<int>;
		public var Style: int;
		
		public function TFillSettings()
		{
			Colour = 15;
			Pattern = new Vector.<int>(640 * 350, true);
			Style = FillStyle.Solid;
			
			// Set default pattern
			var Offset: int = 0;
			var Patternlength: int = Pattern.length;
			for (var i: int = 0; i < Patternlength; i++) {
				Pattern[Offset++] = 15;
			}
		}
	}
}