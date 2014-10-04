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
var TCursor = function (AParent, AColour, ASize) {
    // Public events
    this.onhide = function () { }; // Do nothing
    this.onshow = function () { }; // Do nothing

    // Private variables
    var that = this;
    var FBlinkRate;
    var FBlinkState;
    var FCanvas = 0;
    var FColour;
    var FContext = 0;
    var FPosition;
    var FSize;
    var FTimer;
    var FVisible;
    var FWindowOffset;
    var FWindowOffsetAdjusted;

    // Private methods
    var Draw = function () { }; // Do nothing
    var OnTimer = function (teEvent) { }; // Do nothing
    var Update = function () { }; // Do nothing

    this.__defineSetter__("BlinkRate", function (AMS) {
        FTimer.delay = AMS;
    });

    this.__defineSetter__("Colour", function (AColour) {
        FColour = AColour;
        Draw();
    });

    Draw = function () {
        if (FContext) {
            FCanvas.width = FSize.x;
            FCanvas.height = FSize.y;

            FContext.fillStyle = FColour;
            FContext.fillRect(0, FSize.y - (FSize.y * 0.20), FSize.x, FSize.y * 0.20);
        }
    };

    OnTimer = function (teEvent) {
        // Flip the blink state
        FBlinkState = (FBlinkState === BlinkState.Hide) ? BlinkState.Show : BlinkState.Hide;

        // Update the opacity
        if (FVisible) {
            // Set the opacity to the desired state
            FCanvas.style.opacity = (FBlinkState === BlinkState.Hide) ? 0 : 1;
        } else {
            // Set the opacity to off
            FCanvas.style.opacity = 0;
        }

        // Let the Crt unit know it can blink text now
        switch (FBlinkState) {
            case BlinkState.Hide: that.onhide(); break;
            case BlinkState.Show: that.onshow(); break;
        }
    };

    this.__defineGetter__("Position", function () {
        return FPosition;
    });

    this.__defineSetter__("Position", function (APosition) {
        FPosition = APosition;
        Update();
    });

    this.__defineSetter__("Size", function (ASize) {
        FSize = ASize;
        Draw();
        Update();
    });

    Update = function () {
        if (FCanvas && FVisible) {
            FCanvas.style.left = (FPosition.x - 1) * FSize.x + FWindowOffsetAdjusted.x + "px";
            FCanvas.style.top = (FPosition.y - 1) * FSize.y + FWindowOffsetAdjusted.y + "px";
        }
    };

    this.__defineSetter__("Visible", function (AVisible) {
        FVisible = AVisible;
        if (FVisible) { Update(); }
    });

    this.__defineSetter__("WindowOffset", function (AWindowOffset) {
        // Store new window offset
        if ((AWindowOffset.x !== FWindowOffset.x) || (AWindowOffset.y !== FWindowOffset.y)) {
            FWindowOffset = AWindowOffset;

            // Reset button position
            FCanvas.style.left = "0px";
            FCanvas.style.top = "0px";
            var CursorPosition = getElementPosition(FCanvas);

            FWindowOffsetAdjusted.x = AWindowOffset.x - CursorPosition.x;
            FWindowOffsetAdjusted.y = AWindowOffset.y - CursorPosition.y;

            Update();
        }
    });

    // Constructor
    FBlinkRate = 500;
    FBlinkState = BlinkState.Hide;
    FColour = AColour;
    FPosition = new Point(1, 1);
    FSize = ASize;
    FVisible = true;
    FWindowOffset = new Point(0, 0);
    FWindowOffsetAdjusted = new Point(0, 0);

    FCanvas = document.createElement('canvas');
    if (FCanvas.getContext) {
        FCanvas.style.position = "absolute";
        FContext = FCanvas.getContext('2d');
        AParent.appendChild(FCanvas);

        // Draw the initial position
        Update();
        Draw();

        // Start the I/O timer
        FTimer = setInterval(OnTimer, FBlinkRate);
    }
};
