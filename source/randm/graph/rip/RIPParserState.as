package randm.graph.rip
{
	/// <summary>
	/// The possible states the RIP parser may find itself in
	/// </summary>
	internal class RIPParserState
	{
		/// <summary>
		/// The default data state
		/// </summary>
		public static const None: int = 0;
		
		/// <summary>
		/// The last received character was an !
		/// </summary>
		public static const GotExclamation: int = 1;
		
		/// <summary>
		/// The last received character was a |
		/// </summary>
		public static const GotPipe: int = 2;
		
		/// <summary>
		/// The last received character was a numeric level
		/// </summary>
		public static const GotLevel: int = 3;

		/// <summary>
		/// The last received character was a numeric level
		/// </summary>
		public static const GotSubLevel: int = 4;

		/// <summary>
		/// The last received character was a command
		/// </summary>
		public static const GotCommand: int = 5;
	}
}