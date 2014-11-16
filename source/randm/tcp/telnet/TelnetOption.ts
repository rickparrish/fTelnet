/*
  fTelnet: An HTML5 WebSocket client
  Copyright (C) 2009-2013  Rick Parrish, R&M Software

  This file is part of fTelnet.

  fTelnet is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as
  published by the Free Software Foundation, either version 3 of the
  License, or any later version.

  fTelnet is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY, without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with fTelnet.  If not, see <http://www.gnu.org/licenses/>.
*/
enum TelnetOption {
	/// <summary>
	/// When enabled, data is transmitted as 8-bit binary data.
	/// </summary>
	/// <remarks>
	/// Defined in RFC 856
	/// 
	/// Default is to not transmit in binary.
	/// </remarks>
	TransmitBinary = 0,

	/// <summary>
    /// When enabled, the side performing the echoing transmits (echos) data characters it receives back to the sender 
    /// of the data characters.
	/// </summary>
	/// <remarks>
	/// Defined in RFC 857
	/// 
	/// Default is to not echo over the telnet connection.
	/// </remarks>
	Echo = 1,

	// TODO
	Reconnection = 2,

	/// <summary>
	/// When enabled, the sender need not transmit GAs.
	/// </summary>
	/// <remarks>
	/// Defined in RFC 858
	/// 
	/// Default is to not suppress go aheads.
	/// </remarks>
	SuppressGoAhead = 3,

	ApproxMessageSizeNegotiation = 4,
	Status = 5,
	TimingMark = 6,
	RemoteControlledTransAndEcho = 7,
	OutputLineWidth = 8,
	OutputPageSize = 9,
	OutputCarriageReturnDisposition = 10,
	OutputHorizontalTabStops = 11,
	OutputHorizontalTabDisposition = 12,
	OutputFormfeedDisposition = 13,
	OutputVerticalTabstops = 14,
	OutputVerticalTabDisposition = 15,
	OutputLinefeedDisposition = 16,
	ExtendedASCII = 17,
	Logout = 18,
	ByteMacro = 19,
	DataEntryTerminal = 20,
	SUPDUP = 21,
	SUPDUPOutput = 22,
	SendLocation = 23,

    /// <summary>
    /// Allows the TERMINAL-TYPE subnegotiation command to be used if both sides agree
    /// </summary>
    /// <remarks>
    /// Defined in RFC 1091
    /// 
    /// Default is to not allow the TERMINAL-TYPE subnegotiation
    /// </remarks>
	TerminalType = 24,

	EndOfRecord = 25,
	TACACSUserIdentification = 26,
	OutputMarking = 27,

    /// <summary>
    /// Allows the TTYLOC (Terminal Location Number) subnegotiation command to be used if both sides agree
    /// </summary>
    /// <remarks>
    /// Defined in RFC 946
    /// 
    /// Default is to not allow the TTYLOC subnegotiation
    /// </remarks>
	TerminalLocationNumber = 28,

	Telnet3270Regime = 29,
	Xdot3PAD = 30,

	/// <summary>
	/// Allows the NAWS (negotiate about window size) subnegotiation command to be used if both sides agree
	/// </summary>
	/// <remarks>
	/// Defined in RFC 1073
	/// 
	/// Default is to not allow the NAWS subnegotiation
	/// </remarks>
	WindowSize = 31,

	TerminalSpeed = 32,
	RemoteFlowControl = 33,

	/// <summary>
	/// Linemode Telnet is a way of doing terminal character processing on the client side of a Telnet connection.
	/// </summary>
	/// <remarks>
	/// Defined in RFC 1184
	/// 
	/// Default is to not allow the LINEMODE subnegotiation
	/// </remarks>
	LineMode = 34,

	XDisplayLocation = 35,
	EnvironmentOption = 36,
	AuthenticationOption = 37,
	EncryptionOption = 38,
	NewEnvironmentOption = 39,
	TN3270E = 40,
	XAUTH = 41,
	CHARSET = 42,
	TelnetRemoteSerialPort = 43,
	ComPortControlOption = 44,
	TelnetSuppressLocalEcho = 45,
	TelnetStartTLS = 46,
	KERMIT = 47,
	SENDURL = 48,
	FORWARD_X = 49
}
