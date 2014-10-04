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
var StringUtils = 0;
var TStringUtils = function () {
    var that = this;

    this.AddCommas = function (ANum) {
        var Result = "";

        var Position = 1;
        var i;
        for (i = ANum.toString().length - 1; i >= 0; i--) {
            if ((Position > 3) && (Position % 3 === 1)) { Result = "," + Result; }
            Result = ANum.toString().charAt(i) + Result;
            Position++;
        }

        return Result;
    };

    this.FormatPercent = function (ANumber, APrecision) {
        return (ANumber * 100).toFixed(APrecision) + "%";
    };

    this.NewString = function (AChar, ALength) {
        if (AChar.length === 0) { return ""; }

        var Result = "";
        var i;
        for (i = 0; i < ALength; i++) { Result += AChar.charAt(0); }
        return Result;
    };

    this.PadLeft = function (AText, AChar, ALength) {
        if (AChar.length === 0) { return AText; }

        while (AText.length < ALength) { AText = AChar.charAt(0) + AText; }
        return AText.substring(0, ALength);
    };

    this.PadRight = function (AText, AChar, ALength) {
        if (AChar.length === 0) { return AText; }

        while (AText.length < ALength) { AText += AChar.charAt(0); }
        return AText.substring(0, ALength);
    };

    this.Trim = function (AText) {
        return that.TrimLeft(that.TrimRight(AText));
    };

    this.TrimLeft = function (AText) {
        return AText.replace(/^\s+/g, "");
    };

    this.TrimRight = function (AText) {
        return AText.replace(/\s+$/g, "");
    };
};
StringUtils = new TStringUtils();
