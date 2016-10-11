/*
  fTelnet: An HTML5 WebSocket client
  Copyright (C) Rick Parrish, R&M Software

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
enum RLoginNegotiationState {
	/// <summary>
	/// The default data state
	/// </summary>
	Data = 0,

	/// <summary>
	/// The last received character was a first cookie
	/// </summary>
	Cookie1 = 1,

	/// <summary>
	/// The last received character was a second cookie
	/// </summary>
	Cookie2 = 2,

	/// <summary>
	/// The last received character was a first s
	/// </summary>
	S1 = 3,

	/// <summary>
	/// The last received character was a second s
	/// </summary>
	SS = 4
}
