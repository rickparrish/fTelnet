/*
  fTelnet: An HTML5 WebSocket client
  Copyright (C) 2009-2013  Rick Parrish, R&M Software

  This file is part of fTelnet.

  fTelnet is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  any later version.

  fTelnet is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with fTelnet.  If not, see <http://www.gnu.org/licenses/>.
*/
/// <summary>
/// The possible states the ANSI parser may find itself in
/// </summary>
enum AnsiParserState {
	/// <summary>
	/// The default data state
	/// </summary>
	None = 0,

	/// <summary>
	/// The last received character was an ESC
	/// </summary>
	Escape = 1,

	/// <summary>
	/// The last received character was a [
	/// </summary>
	Bracket = 2,

    /// <summary>
    /// The last received character was a parameter byte (0 to ?)
    /// </summary>
	ParameterByte = 3,

    /// <summary>
    /// The last received character was a intermediate byte (space to /)
    /// </summary>
	IntermediateByte = 4
}

