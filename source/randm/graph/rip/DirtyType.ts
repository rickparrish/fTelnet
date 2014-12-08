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
enum DirtyType {
    // Screen is not dirty, so does not need to be redrawn
    None = 0,

    // Entire screen was just cleared, so it does need to be redrawn
    // However, a call to SetAllPalette() only needs to update the background colour on screen (makes it way faster!)
    Clear = 1,

    // One or more pixels were changed, so it does need to be redrawn
    Pixel = 2
}
