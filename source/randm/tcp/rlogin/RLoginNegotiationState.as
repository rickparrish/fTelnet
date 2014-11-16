package randm.tcp.rlogin
{
	public class RLoginNegotiationState
	{
		/// <summary>
		/// The default data state
		/// </summary>
		public static var Data: int = 0;
		
		/// <summary>
		/// The last received character was a first cookie
		/// </summary>
		public static var Cookie1: int = 1;
		
		/// <summary>
		/// The last received character was a second cookie
		/// </summary>
		public static var Cookie2: int = 2;
		
		/// <summary>
		/// The last received character was a first s
		/// </summary>
		public static var S1: int = 3;
		
		/// <summary>
		/// The last received character was a second s
		/// </summary>
		public static var SS: int = 4;
	}
}