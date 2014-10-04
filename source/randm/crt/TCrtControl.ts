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
var TCrtControl = function (AParent, ALeft, ATop, AWidth, AHeight) {
    var that = this;
    var FBackColour = Crt.BLACK;
    var FBackground = null;
    var FControls = [];
    var FForeColour = Crt.LIGHTGRAY;
    var FHeight;
    var FLeft;
    var FParent = null;
    var FTop;
    var FWidth;

    // Private methods
    var RestoreBackground = function () { }; // Do nothing
    var SaveBackground = function () { }; // Do nothing

    this.AddControl = function (AChild) {
        FControls.push(AChild);
    };

    this.__defineGetter__("BackColour", function () {
        return FBackColour;
    });

    this.__defineSetter__("BackColour", function (ABackColour) {
        if (ABackColour !== FBackColour) {
            FBackColour = ABackColour;
            that.Paint(true);
        }
    });

    this.__defineGetter__("ForeColour", function () {
        return FForeColour;
    });

    this.__defineSetter__("ForeColour", function (AForeColour) {
        if (AForeColour !== FForeColour) {
            FForeColour = AForeColour;
            that.Paint(true);
        }
    });

    this.__defineGetter__("Height", function () {
        return FHeight;
    });

    this.__defineSetter__("Height", function (AHeight) {
        if (AHeight !== FHeight) {
            RestoreBackground();
            FHeight = AHeight;
            SaveBackground();
            that.Paint(true);
        }
    });

    this.Hide = function () {
        RestoreBackground();
    };

    this.__defineGetter__("Left", function () {
        return FLeft;
    });

    this.__defineSetter__("Left", function (ALeft) {
        var i;

        if (ALeft !== FLeft) {
            RestoreBackground();
            FLeft = ALeft;
            SaveBackground();
            that.Paint(true);

            for (i = 0; i < FControls.length; i++) {
                FControls[i].Paint(true);
            }
        }
    });

    this.__defineGetter__("Parent", function () {
        return FParent;
    });

    this.__defineSetter__("Parent", function (AParent) {
        RestoreBackground();
        FParent = AParent;
        SaveBackground();
        that.Paint(true);
    });

    RestoreBackground = function () {
        var Left = FLeft;
        var Top = FTop;
        var P = FParent;
        while (P) {
            Left += P.Left;
            Top += P.Top;
            P = P.FParent;
        }
        Crt.RestoreScreen(FBackground, Left, Top, Left + FWidth - 1, Top + FHeight - 1);
    };

    SaveBackground = function () {
        var Left = FLeft;
        var Top = FTop;
        var P = FParent;
        while (P) {
            Left += P.Left;
            Top += P.Top;
            P = P.FParent;
        }
        FBackground = Crt.SaveScreen(Left, Top, Left + FWidth - 1, Top + FHeight - 1);
    };

    this.__defineGetter__("ScreenLeft", function () {
        return FLeft + ((FParent === null) ? 0 : FParent.Left);
    });

    this.__defineGetter__("ScreenTop", function () {
        return FTop + ((FParent === null) ? 0 : FParent.Top);
    });

    this.Show = function () {
        that.Paint(true);

        var i;
        for (i = 0; i < FControls.length; i++) {
            FControls[i].Paint(true);
        }
    };

    this.__defineGetter__("Top", function () {
        return FTop;
    });

    this.__defineSetter__("Top", function (ATop) {
        if (ATop !== FTop) {
            RestoreBackground();
            FTop = ATop;
            SaveBackground();
            that.Paint(true);

            var i;
            for (i = 0; i < FControls.length; i++) {
                FControls[i].Paint(true);
            }
        }
    });

    this.__defineGetter__("Width", function () {
        return FWidth;
    });

    this.__defineSetter__("Width", function (AWidth) {
        if (AWidth !== FWidth) {
            RestoreBackground();
            FWidth = AWidth;
            SaveBackground();
            that.Paint(true);
        }
    });

    // Constructor
    FParent = AParent;
    FLeft = ALeft;
    FTop = ATop;
    FWidth = AWidth;
    FHeight = AHeight;

    SaveBackground();

    if (FParent !== null) {
        AParent.AddControl(this);
    }
};

var TCrtControlSurrogate = function () { };
TCrtControlSurrogate.prototype = TCrtControl.prototype;

TCrtControl.prototype.Paint = function (AForce) {
    // Override in extended class
};
