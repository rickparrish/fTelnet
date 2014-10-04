package randm.tcp.rlogin
{
	public class RLoginNegotiationState
	{
		/// <summary>
		/// The default data state
		/// </summary>
		static public var Data: int = 0;
		
		/// <summary>
		/// The last received character was a first cookie
		/// </summary>
		static public var Cookie1: int = 1;
		
		/// <summary>
		/// The last received character was a second cookie
		/// </summary>
		static public var Cookie2: int = 2;
		
		/// <summary>
		/// The last received character was a first s
		/// </summary>
		static public var S1: int = 3;
		
		/// <summary>
		/// The last received character was a second s
		/// </summary>
		static public var SS: int = 4;
	}
}