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
var TFileRecord = function (AName, ASize) {
    var FData = new ByteArray();
    var FName = "";
    var FSize = 0;

    this.__defineGetter__("data", function () {
        return FData;
    });

    this.__defineGetter__("name", function () {
        return FName;
    });

    this.__defineGetter__("size", function () {
        return FSize;
    });

    // Constructor
    FName = AName;
    FSize = ASize;
};