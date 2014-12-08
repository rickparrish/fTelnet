package randm.graph
{
	public class TLineSettings
	{
		public var Style: int;
		public var Pattern: int;
		public var Thickness: int;
		
		public function TLineSettings()
		{
			Style = LineStyle.Solid;
			Pattern = 0xFFFF;
			Thickness = LineThickness.Normal;
		}
	}
}