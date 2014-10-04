package randm.tcp.rlogin
{
	import flash.events.Event;
	import flash.events.ProgressEvent;
	import flash.net.Socket;
	import flash.utils.ByteArray;
	import flash.utils.Endian;
	
	import randm.tcp.TTCPConnection;
	
	public class TRLoginConnection extends TTCPConnection
	{
		private var FNegotiationState: int;
		private var FSSBytes: int;
		
		public function TRLoginConnection(AHost: String = null, APort: int = 0)
		{
			super(AHost, APort)
			
			FNegotiationState = RLoginNegotiationState.Data;
			FSSBytes = 0;
		}
		
		public override function flush(): void
		{
			FOutputBuffer.position = 0;
			while (FOutputBuffer.bytesAvailable > 0)
			{
				// Read 1 byte at a time
				var B: int = FOutputBuffer.readUnsignedByte();
				superWriteByte(B);
			}
			super.flush();
		}
		
		public override function NegotiateInbound(Data: ByteArray): void
		{
			// Get any waiting data and handle negotiation
			while (Data.bytesAvailable)
			{
				var B: uint = Data.readUnsignedByte();
				
				if (FNegotiationState == RLoginNegotiationState.Data)
				{
					if (B == RLoginCommand.Cookie)
					{
						FNegotiationState = RLoginNegotiationState.Cookie1;
					}
					else
					{
						FInputBuffer.writeByte(B);
					}
				}
				else if (FNegotiationState == RLoginNegotiationState.Cookie1)
				{
					if (B == RLoginCommand.Cookie)
					{
						FNegotiationState = RLoginNegotiationState.Cookie2;
					}
					else
					{
						FNegotiationState = RLoginNegotiationState.Data;
					}
				} 
				else if (FNegotiationState == RLoginNegotiationState.Cookie2)
				{
					if (B == RLoginCommand.S)
					{
						FNegotiationState = RLoginNegotiationState.S1;
					}
					else
					{
						FNegotiationState = RLoginNegotiationState.Data;
					}
				}
				else if (FNegotiationState == RLoginNegotiationState.S1)
				{
					if (B == RLoginCommand.S)
					{
						FNegotiationState = RLoginNegotiationState.SS;
					}
					else
					{
						FNegotiationState = RLoginNegotiationState.Data;
					}
				}
				else if (FNegotiationState == RLoginNegotiationState.SS)
				{
					if (++FSSBytes >= 8)
					{
						FSSBytes = 0;
						FNegotiationState = RLoginNegotiationState.Data;
					}
				}				
			}
		}
	}
}