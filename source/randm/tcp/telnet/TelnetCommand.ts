/*
  fTelnet: An HTML5 WebSocket client
  Copyright (C) 2009-2013  Rick Parrish, R&M Software

  This file is part of fTelnet.

  fTelnet is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  any later version.

  fTelnet is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY, without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with fTelnet.  If not, see <http://www.gnu.org/licenses/>.
*/
enum TelnetCommand {
    /// <summary>
    /// SE: End of subnegotiation parameters.
    /// </summary>
    EndSubnegotiation = 240,

    /// <summary>
    /// NOP: No operation.
    /// </summary>
    NoOperation = 241,

    /// <summary>
    /// Data Mark: The data stream portion of a Synch. This should always be accompanied by a TCP Urgent notification.
    /// </summary>
    DataMark = 242,

    /// <summary>
    /// Break: NVT character BRK.
    /// </summary>
    Break = 243,

    /// <summary>
    /// Interrupt Process: The function IP.
    /// </summary>
    InterruptProcess = 244,

    /// <summary>
    /// Abort output: The function AO.
    /// </summary>
    AbortOutput = 245,

    /// <summary>
    /// Are You There: The function AYT.
    /// </summary>
    AreYouThere = 246,

    /// <summary>
    /// Erase character: The function EC.
    /// </summary>
    EraseCharacter = 247,

    /// <summary>
    /// Erase Line: The function EL.
    /// </summary>
    EraseLine = 248,

    /// <summary>
    /// Go ahead: The GA signal
    /// </summary>
    GoAhead = 249,

    /// <summary>
    /// SB: Indicates that what follows is subnegotiation of the indicated option.
    /// </summary>
    Subnegotiation = 250,

    /// <summary>
    /// WILL: Indicates the desire to begin performing, or confirmation that you are now performing, the indicated option.
    /// </summary>
    Will = 251,

    /// <summary>
    /// WON'T: Indicates the refusal to perform, or continue performing, the indicated option.
    /// </summary>
    Wont = 252,

    /// <summary>
    /// DO: Indicates the request that the other party perform, or confirmation that you are expecting the other party 
    /// to perform, the indicated option.
    /// </summary>
    Do = 253,

    /// <summary>
    /// DON'T: Indicates the demand that the other party stop performing, or confirmation that you are no longer expecting 
    /// the other party to perform, the indicated option.
    /// </summary>
    Dont = 254,

    /// <summary>
    /// IAC: Data Byte 255
    /// </summary>
    IAC = 255
}
