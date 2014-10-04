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
var TCrtLabel = function (AParent, ALeft, ATop, AWidth, AText, ATextAlign, AForeColour, ABackColour) {

    var that = this;
    var FText = "";
    var FTextAlign;

    this.PaintCrtLabel = function (AForce) {
        // Draw the message
        switch (FTextAlign) {
            case ContentAlignment.Center:
                if (FText.length >= that.Width) {
                    // Text is greater than available space so chop it off with PadRight()
                    Crt.FastWrite(FText.substring(0, that.Width), that.ScreenLeft, that.ScreenTop, new TCharInfo(" ", that.ForeColour + (that.BackColour << 4)));
                } else {
                    // Text needs to be centered
                    var i = 0;
                    var LeftSpaces = "";
                    for (i = 0; i < Math.floor((that.Width - FText.length) / 2) ; i++) {
                        LeftSpaces += " ";
                    }
                    var RightSpaces = "";
                    for (i = 0; i < that.Width - FText.length - LeftSpaces.length; i++) {
                        RightSpaces += " ";
                    }
                    Crt.FastWrite(LeftSpaces + FText + RightSpaces, that.ScreenLeft, that.ScreenTop, new TCharInfo(" ", that.ForeColour + (that.BackColour << 4)));
                }
                break;
            case ContentAlignment.Left:
                Crt.FastWrite(StringUtils.PadRight(FText, ' ', that.Width), that.ScreenLeft, that.ScreenTop, new TCharInfo(" ", that.ForeColour + (that.BackColour << 4)));
                break;
            case ContentAlignment.Right:
                Crt.FastWrite(StringUtils.PadLeft(FText, ' ', that.Width), that.ScreenLeft, that.ScreenTop, new TCharInfo(" ", that.ForeColour + (that.BackColour << 4)));
                break;
        }
    };

    this.__defineGetter__("Text", function () {
        return FText;
    });

    this.__defineSetter__("Text", function (AText) {
        FText = AText;
        that.Paint(true);
    });

    this.__defineGetter__("TextAlign", function () {
        return FTextAlign;
    });

    this.__defineSetter__("TextAlign", function (ATextAlign) {
        if (ATextAlign !== FTextAlign) {
            FTextAlign = ATextAlign;
            that.Paint(true);
        }
    });

    // Constructor
    TCrtControl.call(this, AParent, ALeft, ATop, AWidth, 1);

    FText = AText;
    FTextAlign = ATextAlign;
    that.ForeColour = AForeColour;
    that.BackColour = ABackColour;

    that.Paint(true);
};

TCrtLabel.prototype = new TCrtControlSurrogate();
TCrtLabel.prototype.constructor = TCrtLabel;

TCrtLabel.prototype.Paint = function (AForce) {
    this.PaintCrtLabel();
};