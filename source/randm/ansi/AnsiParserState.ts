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
var AnsiParserState = 0;
/// <summary>
/// The possible states the ANSI parser may find itself in
/// </summary>
var TAnsiParserState = function () {
	/// <summary>
	/// The default data state
	/// </summary>
	this.None = 0;
		
	/// <summary>
	/// The last received character was an ESC
	/// </summary>
	this.Escape = 1;
		
	/// <summary>
	/// The last received character was a [
	/// </summary>
	this.Bracket = 2;

    /// <summary>
    /// The last received character was a parameter byte (0 to ?)
    /// </summary>
	this.ParameterByte = 3;

    /// <summary>
    /// The last received character was a intermediate byte (space to /)
    /// </summary>
	this.IntermediateByte = 4;
};
AnsiParserState = new TAnsiParserState();
