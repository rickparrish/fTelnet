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
var CrtFonts = [];

CrtFonts['437x9x16'] = PNGAsset + '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';
CrtFonts.ASCIIx9x16 = PNGAsset + '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';

var TFont = function () {
    // Public event
    this.onchange = function () { }; // Do nothing

    // Public variables
    this.ANSI_COLOURS = [
		"#000000", "#0000A8", "#00A800", "#00A8A8", "#A80000", "#A800A8", "#A85400", "#A8A8A8",
		"#545454", "#5454FC", "#54FC54", "#54FCFC", "#FC5454", "#FC54FC", "#FCFC54", "#FCFCFC"];

    // From http://www.c64-wiki.com/index.php/Color
    //this.PETSCII_COLOURS = [
    //    "#000000", "#ffffff", "#880000", "#aaffee", "#cc44cc", "#00cc55", "#0000aa", "#eeee77",
    //    "#dd8855", "#664400", "#ff7777", "#333333", "#777777", "#aaff66", "#0088ff", "#bbbbbb"];

    // From http://www.pepto.de/projects/colorvic/
    //this.PETSCII_COLOURS = [
    //    "#000000", "#ffffff", "#68372B", "#70A4B2", "#6F3D86", "#588D43", "#352879", "#B8C76F",
    //    "#6F4F25", "#433900", "#9A6759", "#444444", "#6C6C6C", "#9AD284", "#6C5EB5", "#959595"];

    // From http://en.wikipedia.org/wiki/File:C64_ntsc_cxa2025.bmp.png
    //this.PETSCII_COLOURS = [
    //    "#000000", "#ffffff", "#FA3200", "#1DE0FF", "#A84BCC", "#68BB50", "#004AD0", "#FFEB45",
    //    "#FF5B00", "#C23D00", "#FF7142", "#FF7142", "#8A9578", "#B3FF97", "#4788FF", "#C3B8D7"];

    // From CGterm
    this.PETSCII_COLOURS = [
        "#000000", "#FDFEFC", "#BE1A24", "#30E6C6", "#B41AE2", "#1FD21E", "#211BAE", "#DFF60A",
        "#B84104", "#6A3304", "#FE4A57", "#424540", "#70746F", "#59FE59", "#5F53FE", "#A4A7A2"];

    // Private variables
    var that = this;
    var FCanvas = 0;
    var FCharMap = [];
    var FCodePage = 0;
    var FContext = 0;
    var FLoading = 0;
    var FLower = 0;
    var FNewCodePage = 0;
    var FNewSize = 0;
    var FSize = 0;
    var FUpper = 0;

    // Private methods
    var OnLoadLower = function () { }; // Do nothing
    var OnLoadUpper = function () { }; // Do nothing

    this.__defineGetter__("CodePage", function () {
        return FCodePage;
    });

    this.GetChar = function (ACharCode, ACharInfo) {
        if (FLoading > 0) { return 0; }

        // Validate values
        if ((ACharCode < 0) || (ACharCode > 255) || (ACharInfo.Attr < 0) || (ACharInfo.Attr > 255)) { return 0; }

        var FCharMapKey = ACharCode + "-" + ACharInfo.Attr + "-" + ACharInfo.Reverse;

        // Check if we have used this character before
        if (!FCharMap[FCharMapKey]) {
            // Nope, so get character (in black and white)
            FCharMap[FCharMapKey] = FContext.getImageData(ACharCode * FSize.x, 0, FSize.x, FSize.y);

            // Now colour the character
            var Back;
            var Fore;
            if (FCodePage.indexOf("PETSCII") === 0) {
                Back = that.PETSCII_COLOURS[(ACharInfo.Attr & 0xF0) >> 4];
                Fore = that.PETSCII_COLOURS[(ACharInfo.Attr & 0x0F)];
            } else {
                Back = that.ANSI_COLOURS[(ACharInfo.Attr & 0xF0) >> 4];
                Fore = that.ANSI_COLOURS[(ACharInfo.Attr & 0x0F)];
            }

            // Reverse if necessary
            if (ACharInfo.Reverse) {
                var Temp = Fore;
                Fore = Back;
                Back = Temp;
            }

            // Get the individual RGB colours
            var BackR = parseInt(Back[1].toString() + Back[2].toString(), 16);
            var BackG = parseInt(Back[3].toString() + Back[4].toString(), 16);
            var BackB = parseInt(Back[5].toString() + Back[6].toString(), 16);
            var ForeR = parseInt(Fore[1].toString() + Fore[2].toString(), 16);
            var ForeG = parseInt(Fore[3].toString() + Fore[4].toString(), 16);
            var ForeB = parseInt(Fore[5].toString() + Fore[6].toString(), 16);

            // Colour the pixels 1 at a time
            var R = 0;
            var G = 0;
            var B = 0;
            var i;
            for (i = 0; i < FCharMap[FCharMapKey].data.length; i += 4) {
                // Determine if it's back or fore colour to use for this pixel
                if (FCharMap[FCharMapKey].data[i] > 127) {
                    R = ForeR;
                    G = ForeG;
                    B = ForeB;
                } else {
                    R = BackR;
                    G = BackG;
                    B = BackB;
                }

                FCharMap[FCharMapKey].data[i] = R;
                FCharMap[FCharMapKey].data[i + 1] = G;
                FCharMap[FCharMapKey].data[i + 2] = B;
                FCharMap[FCharMapKey].data[i + 3] = 255;
            }
        }

        // Return the character if we have it
        return FCharMap[FCharMapKey];
    };

    this.__defineGetter__("Height", function () {
        return FSize.y;
    });

    this.Load = function (ACodePage, AWidth, AHeight) {
        // Ensure the requested font exists
        if (CrtFonts[ACodePage + "x" + AWidth + "x" + AHeight] !== undefined) {
            that.ANSI_COLOURS[7] = "#A8A8A8";
            that.ANSI_COLOURS[0] = "#000000";

            FLoading += 1;
            FNewCodePage = ACodePage;
            FNewSize = new Point(AWidth, AHeight);

            // Check for PC or other font
            if (isNaN(parseInt(ACodePage, 10))) {
                // non-number means not a PC codepage

                // Override colour for ATASCII clients
                if (ACodePage.indexOf("ATASCII") === 0) {
                    that.ANSI_COLOURS[7] = "#63B6E7";
                    that.ANSI_COLOURS[0] = "#005184";
                }

                FLower = new Image();
                FLower.onload = OnLoadUpper;
                FLower.src = CrtFonts[FNewCodePage + "x" + FNewSize.x + "x" + FNewSize.y];
                FUpper = 0;
            } else {
                // Load the lower font
                FLower = new Image();
                FLower.onload = OnLoadLower;
                FLower.src = CrtFonts["ASCIIx" + AWidth + "x" + AHeight];
            }
        } else {
            trace("HtmlTerm Error: Font CP=" + ACodePage + ", Width=" + AWidth + ", Height=" + AHeight + " does not exist");
        }
    };

    OnLoadLower = function () {
        // Load the upper font
        FUpper = new Image();
        FUpper.onload = OnLoadUpper;
        FUpper.src = CrtFonts[FNewCodePage + "x" + FNewSize.x + "x" + FNewSize.y];
    };

    OnLoadUpper = function () {
        FCodePage = FNewCodePage;
        FSize = FNewSize;

        // Reset Canvas
        if (FUpper) {
            FCanvas.width = FLower.width * 2; // *2 for lower and upper ascii
        } else {
            FCanvas.width = FLower.width;
        }
        FCanvas.height = FLower.height;
        FContext.drawImage(FLower, 0, 0);
        if (FUpper) { FContext.drawImage(FUpper, FLower.width, 0); }

        // Reset CharMap
        FCharMap = [];

        // Raise change event
        FLoading -= 1;
        that.onchange();
    };

    this.__defineGetter__("Size", function () {
        return FSize;
    });

    this.__defineGetter__("Width", function () {
        return FSize.x;
    });

    // Constructor
    FCodePage = 437;
    FSize = new Point(9, 16);

    FCanvas = document.createElement("canvas");
    if (FCanvas.getContext) {
        FContext = FCanvas.getContext("2d");
        this.Load(FCodePage, FSize.x, FSize.y);
    }
};