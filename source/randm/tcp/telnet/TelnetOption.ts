/*
  HtmlTerm: An HTML5 WebSocket client
  Copyright (C) 2009-2013  Rick Parrish, R&M Software

  This file is part of HtmlTerm.

  HtmlTerm is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  any later version.

  HtmlTerm is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with HtmlTerm.  If not, see <http://www.gnu.org/licenses/>.
*/
var TelnetOption = 0;
var TTelnetOption = function () {
	/// <summary>
	/// When enabled; data is transmitted as 8-bit binary data.
	/// </summary>
	/// <remarks>
	/// Defined in RFC 856
	/// 
	/// Default is to not transmit in binary.
	/// </remarks>
	this.TransmitBinary = 0;
		
	/// <summary>
	/// When enabled; the side performing the echoing transmits (echos) data characters it receives back to the sender of the data characters.
	/// </summary>
	/// <remarks>
	/// Defined in RFC 857
	/// 
	/// Default is to not echo over the telnet connection.
	/// </remarks>
	this.Echo = 1;
		
	// TODO
	this.Reconnection = 2;
		
	/// <summary>
	/// When enabled; the sender need not transmit GAs.
	/// </summary>
	/// <remarks>
	/// Defined in RFC 858
	/// 
	/// Default is to not suppress go aheads.
	/// </remarks>
	this.SuppressGoAhead = 3;
		
	this.ApproxMessageSizeNegotiation = 4;
	this.Status = 5;
	this.TimingMark = 6;
	this.RemoteControlledTransAndEcho = 7;
	this.OutputLineWidth = 8;
	this.OutputPageSize = 9;
	this.OutputCarriageReturnDisposition = 10;
	this.OutputHorizontalTabStops = 11;
	this.OutputHorizontalTabDisposition = 12;
	this.OutputFormfeedDisposition = 13;
	this.OutputVerticalTabstops = 14;
	this.OutputVerticalTabDisposition = 15;
	this.OutputLinefeedDisposition = 16;
	this.ExtendedASCII = 17;
	this.Logout = 18;
	this.ByteMacro = 19;
	this.DataEntryTerminal = 20;
	this.SUPDUP = 21;
	this.SUPDUPOutput = 22;
	this.SendLocation = 23;

    /// <summary>
    /// Allows the TERMINAL-TYPE subnegotiation command to be used if both sides agree
    /// </summary>
    /// <remarks>
    /// Defined in RFC 1091
    /// 
    /// Default is to not allow the TERMINAL-TYPE subnegotiation
    /// </remarks>
	this.TerminalType = 24;

	this.EndOfRecord = 25;
	this.TACACSUserIdentification = 26;
	this.OutputMarking = 27;

    /// <summary>
    /// Allows the TTYLOC (Terminal Location Number) subnegotiation command to be used if both sides agree
    /// </summary>
    /// <remarks>
    /// Defined in RFC 946
    /// 
    /// Default is to not allow the TTYLOC subnegotiation
    /// </remarks>
	this.TerminalLocationNumber = 28;

	this.Telnet3270Regime = 29;
	this.Xdot3PAD = 30;

	/// <summary>
	/// Allows the NAWS (negotiate about window size) subnegotiation command to be used if both sides agree
	/// </summary>
	/// <remarks>
	/// Defined in RFC 1073
	/// 
	/// Default is to not allow the NAWS subnegotiation
	/// </remarks>
	this.WindowSize = 31;
		
	this.TerminalSpeed = 32;
	this.RemoteFlowControl = 33;

	/// <summary>
	/// Linemode Telnet is a way of doing terminal character processing on the client side of a Telnet connection.
	/// </summary>
	/// <remarks>
	/// Defined in RFC 1184
	/// 
	/// Default is to not allow the LINEMODE subnegotiation
	/// </remarks>
	this.LineMode = 34;
		
	this.XDisplayLocation = 35;
	this.EnvironmentOption = 36;
	this.AuthenticationOption = 37;
	this.EncryptionOption = 38;
	this.NewEnvironmentOption = 39;
	this.TN3270E = 40;
	this.XAUTH = 41;
	this.CHARSET = 42;
	this.TelnetRemoteSerialPort = 43;
	this.ComPortControlOption = 44;
	this.TelnetSuppressLocalEcho = 45;
	this.TelnetStartTLS = 46;
	this.KERMIT = 47;
	this.SENDURL = 48;
	this.FORWARD_X = 49;
};
TelnetOption = new TTelnetOption();