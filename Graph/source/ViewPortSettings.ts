/*
  fTelnet: An HTML5 WebSocket client
  Copyright (C) Rick Parrish, R&M Software

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
class ViewPortSettings {
    public x1: number = 0;
    public y1: number = 0;
    public x2: number = 639;
    public y2: number = 349;
    public Clip: boolean = true;

    // Useful variables (TODO make getter/setters to update these?)
    public FromBottom: number = 0;
    public FromLeft: number = 0;
    public FromRight: number = 0;
    public FromTop: number = 0;
    public FullScreen: boolean = true;
}
