/*
  fTelnet: An HTML5 WebSocket client
  Copyright (C) 2009-2013  Rick Parrish, R&M Software

  This file is part of fTelnet.

  fTelnet is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as
  published by the Free Software Foundation, either version 3 of the
  License, or any later version.

  fTelnet is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with fTelnet.  If not, see <http://www.gnu.org/licenses/>.
*/
enum FillStyle {
    Empty           = 0,  // Uses background color
    Solid           = 1,  // Uses draw color
    Line            = 2,  // --- fill
    LightSlash      = 3,  // /// fill
    Slash           = 4,  // /// thick fill
    BackSlash       = 5,  // \thick fill
    LightBackSlash  = 6,  // \fill
    Hatch           = 7,  // Light hatch fill
    CrossHatch      = 8,  // Heavy cross hatch
    Interleave      = 9,  // Interleaving line
    WideDot         = 10, // Widely spaced dot
    CloseDot        = 11, // Closely spaced dot
    User            = 12 // User-defined fill	
}
