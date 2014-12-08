package randm.graph.rip
{
	public class DirtyType
	{
		// Screen is not dirty, so does not need to be redrawn
		static public const None: int = 0;
		
		// Entire screen was just cleared, so it does need to be redrawn
		// However, a call to SetAllPalette() only needs to update the background colour on screen (makes it way faster!)
		static public const Clear: int = 1;
		
		// One or more pixels were changed, so it does need to be redrawn
		static public const Pixel: int = 2;
	}
}
