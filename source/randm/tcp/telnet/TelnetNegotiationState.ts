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
var TelnetNegotiationState = 0;
var TTelnetNegotiationState = function () {
    /// <summary>
    /// The default data state
    /// </summary>
    this.Data = 0;
		
    /// <summary>
    /// The last received character was an IAC
    /// </summary>
    this.IAC = 1;
		
    /// <summary>
    /// The last received character was a DO command
    /// </summary>
    this.Do = 2;
		
    /// <summary>
    /// The last received character was a DONT command
    /// </summary>
    this.Dont = 3;
		
    /// <summary>
    /// The last received character was a WILL command
    /// </summary>
    this.Will = 4;
		
    /// <summary>
    /// The last received character was a WONT command
    /// </summary>
    this.Wont = 5;
};
TelnetNegotiationState = new TTelnetNegotiationState();