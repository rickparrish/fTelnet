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
enum TelnetNegotiationState {
    /// <summary>
    /// The default data state
    /// </summary>
    Data = 0,

    /// <summary>
    /// The last received character was an IAC
    /// </summary>
    IAC = 1,

    /// <summary>
    /// The last received character was a DO command
    /// </summary>
    Do = 2,

    /// <summary>
    /// The last received character was a DONT command
    /// </summary>
    Dont = 3,

    /// <summary>
    /// The last received character was a WILL command
    /// </summary>
    Will = 4,

    /// <summary>
    /// The last received character was a WONT command
    /// </summary>
    Wont = 5
}
