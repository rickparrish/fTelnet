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
var ByteArray = function () {
    // Private variables
    var that = this;
    var FBytes = [];
    var FLength = 0;
    var FPosition = 0;

    this.__defineGetter__("bytesAvailable", function () {
        return FLength - FPosition;
    });

    this.clear = function () {
        FBytes = [];
        FLength = 0;
        FPosition = 0;
    };

    this.__defineGetter__("length", function () {
        return FLength;
    });
    this.__defineSetter__("length", function (value) {
        if (value <= 0) {
            that.clear();
            return;
        }

        if (value < FLength) {
            FBytes.splice(value, FLength - value);
        } else if (value > FLength) {
            var i;
            for (i = FLength + 1; i <= value; i++) {
                FBytes.push(0);
            }
        }

        FLength = value;
    });

    this.__defineGetter__("position", function () {
        return FPosition;
    });
    this.__defineSetter__("position", function (value) {
        if (value <= 0) {
            value = 0;
        } else if (value >= FLength) {
            value = FLength;
        }

        FPosition = value;
    });

    this.readBytes = function (ADest, AOffset, ACount) {
        if (FPosition + ACount > FLength) {
            throw "There is not sufficient data available to read.";
        }

        var DestPosition = ADest.position;
        ADest.position = AOffset;

        var i;
        for (i = 0; i < ACount; i++) {
            ADest.writeByte(FBytes[FPosition++] & 0xFF);
        }

        ADest.position = DestPosition;
    };

    this.readString = function () {
        var Result = [];
        var i;
        for (i = FPosition; i < FLength; i++) {
            Result.push(String.fromCharCode(FBytes[i]));
        }
        that.clear();
        return Result.join("");
    };

    this.readUnsignedByte = function () {
        if (FPosition >= FLength) {
            throw "There is not sufficient data available to read.";
        }

        return (FBytes[FPosition++] & 0xFF);
    };

    this.readUnsignedShort = function () {
        if (FPosition >= (FLength - 1)) {
            throw "There is not sufficient data available to read.";
        }

        return ((FBytes[FPosition++] & 0xFF) << 8) + (FBytes[FPosition++] & 0xFF);
    };

    this.toString = function () {
        var Result = [];
        var i;
        for (i = 0; i < FLength; i++) {
            Result.push(String.fromCharCode(FBytes[i]));
        }
        return Result.join("");
    };

    this.writeByte = function (value) {
        FBytes[FPosition++] = (value & 0xFF);
        if (FPosition > FLength) { FLength++; }
    };

    this.writeBytes = function (bytes, offset, length) {
        // Handle optional parameters
        if (typeof offset === "undefined") { offset = 0; }
        if (typeof length === "undefined") { length = 0; }

        if (offset < 0) { offset = 0; }
        if (length < 0) { return; } else if (length === 0) { length = bytes.length; }

        if (offset >= bytes.length) { offset = 0; }
        if (length > bytes.length) { length = bytes.length; }
        if (offset + length > bytes.length) { length = bytes.length - offset; }

        var BytesPosition = bytes.position;
        bytes.position = offset;

        var i;
        for (i = 0; i < length; i++) {
            that.writeByte(bytes.readUnsignedByte());
        }

        bytes.position = BytesPosition;
    };

    this.writeShort = function (value) {
        that.writeByte((value & 0xFF00) >> 8);
        that.writeByte(value & 0x00FF);
    };

    this.writeString = function (AText) {
        var i;
        var ATextlength = AText.length;
        for (i = 0; i < ATextlength; i++) {
            that.writeByte(AText.charCodeAt(i));
        }
    };
};
