package randm.graph
{
	// Use these constants as fill patterns for GetFillSettings and SetFillStyle.
	public class FillStyle
	{
		static public const Empty          : int = 0;  // Uses background color
		static public const Solid          : int = 1;  // Uses draw color
		static public const Line           : int = 2;  // --- fill
		static public const LightSlash     : int = 3;  // /// fill
		static public const Slash          : int = 4;  // /// thick fill
		static public const BackSlash      : int = 5;  // \thick fill
		static public const LightBackSlash : int = 6;  // \fill
		static public const Hatch          : int = 7;  // Light hatch fill
		static public const CrossHatch     : int = 8;  // Heavy cross hatch
		static public const Interleave     : int = 9;  // Interleaving line
		static public const WideDot        : int = 10; // Widely spaced dot
		static public const CloseDot       : int = 11; // Closely spaced dot
		static public const User           : int = 12; // User-defined fill	
	}
}