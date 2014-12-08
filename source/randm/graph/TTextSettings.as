package randm.graph
{
	import flash.geom.Point;

	public class TTextSettings
	{
		public var Direction: int;
		public var Font: int;
		public var HorizontalAlign: int;
		public var Size: int;
		public var StrokeScaleX: Number;
		public var StrokeScaleY: Number;
		public var VerticalAlign: int;

		static private const STROKE_SCALES: Array = [
			[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],
			[[0,0],[13,18],[14,20],[16,23],[22,31],[29,41],[36,51],[44,62],[55,77],[66,93],[88,124]], // TriplexFont
			[[0,0],[3,5],[4,6],[4,6],[6,9],[8,12],[10,15],[12,18],[15,22],[18,27],[24,36]], // SmallFont
			[[0,0],[11,19],[12,21],[14,24],[19,32],[25,42],[31,53],[38,64],[47,80],[57,96],[76,128]], // SansSerifFont
			[[0,0],[13,19],[14,21],[16,24],[22,32],[29,42],[36,53],[44,64],[55,80],[66,96],[88,128]], // GothicFont
			
			// These may not be 100% correct
			[[0,0],[11,19],[12,21],[14,24],[19,32],[25,42],[31,53],[38,64],[47,80],[57,96],[76,128]], // ScriptFont
			[[0,0],[11,19],[12,21],[14,24],[19,32],[25,42],[31,53],[38,64],[47,80],[57,96],[76,128]], // SimplexFont
			[[0,0],[13,18],[14,20],[16,23],[22,31],[29,41],[36,51],[44,62],[55,77],[66,93],[88,124]], // TriplexScriptFont
			[[0,0],[11,19],[12,21],[14,24],[19,32],[25,42],[31,53],[38,64],[47,80],[57,96],[76,128]], // ComplexFont
			[[0,0],[11,19],[12,21],[14,24],[19,32],[25,42],[31,53],[38,64],[47,80],[57,96],[76,128]], // EuropeanFont
			[[0,0],[11,19],[12,21],[14,24],[19,32],[25,42],[31,53],[38,64],[47,80],[57,96],[76,128]]]; // BoldFont

		public function TTextSettings()
		{
			Direction = TextOrientation.Horizontal;
			Font = 0;
			HorizontalAlign = TextJustification.Left;
			Size = 1;
			VerticalAlign = TextJustification.Top;
			
			SetStrokeScale();
		}
		
		public function SetStrokeScale(): void
		{
			StrokeScaleX = STROKE_SCALES[Font][Size][0] / STROKE_SCALES[Font][4][0]; 
			StrokeScaleY = STROKE_SCALES[Font][Size][1] / STROKE_SCALES[Font][4][1]; 
		}
	}
}