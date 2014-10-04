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
var ContentAlignment = 0;
var TContentAlignment = function () {
    this.BottomLeft = 0;
    this.BottomCenter = 1;
    this.BottomRight = 2;
    this.MiddleLeft = 3;
    this.MiddleCenter = 4;
    this.MiddleRight = 5;
    this.TopLeft = 6;
    this.TopCenter = 7;
    this.TopRight = 8;
    this.Left = 9;
    this.Center = 10;
    this.Right = 11;
};
ContentAlignment = new TContentAlignment();