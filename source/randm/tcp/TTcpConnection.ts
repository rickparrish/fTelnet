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

var WebSocketProtocol = ('https:' === document.location.protocol ? 'wss' : 'ws');
var WebSocketSupportsTypedArrays = (('Uint8Array' in window) && ('set' in Uint8Array.prototype));
var WebSocketSupportsBinaryType = (WebSocketSupportsTypedArrays && ('binaryType' in WebSocket.prototype || !!(new WebSocket(WebSocketProtocol + '://.').binaryType)));

var TTcpConnection = function () {
    // Public events
    this.onclose = function () { }; // Do nothing
    this.onconnect = function () { }; // Do nothing
    this.onioerror = function (ioee) { }; // Do nothing
    this.onsecurityerror = function () { }; // Do nothing

    // Private variables
    var that = this;
    var FWasConnected = false;

    // Protected variables
    this.FInputBuffer = null;
    this.FOutputBuffer = null;
    this.FProtocol = 'plain';
    this.FWebSocket = null;

    // Private methods
    var OnSocketClose = function () { }; // Do nothing
    var OnSocketError = function (e) { }; // Do nothing
    var OnSocketOpen = function () { }; // Do nothing
    var OnSocketMessage = function (e) { }; // Do nothing

    this.__defineGetter__("bytesAvailable", function () {
        return that.FInputBuffer.bytesAvailable;
    });

    this.close = function () {
        if (that.FWebSocket) {
            that.FWebSocket.close();
        }
    };

    this.connect = function (AHostname, APort, AProxyHostname, AProxyPort, AProxyPortSecure) {
        if (AProxyHostname === undefined) { AProxyHostname = ""; }
        if (AProxyPort === undefined) { AProxyPort = 1123; }
        if (AProxyPortSecure === undefined) { AProxyPortSecure = 11235; }

        FWasConnected = false;

        var Protocols;
        if (window.WebSocket && (WebSocket.CLOSED === 2 || WebSocket.prototype.CLOSED === 2)) { // From: http://stackoverflow.com/a/17850524/342378
            // This is likely a hixie client, which doesn't support negotiation fo multiple protocols, so we only ask for plain
            Protocols = ['plain'];
        } else {
            if (WebSocketSupportsBinaryType && WebSocketSupportsTypedArrays) {
                Protocols = ['binary', 'base64', 'plain'];
            } else {
                Protocols = ['base64', 'plain'];
            }
        }

        if (AProxyHostname === '') {
            that.FWebSocket = new WebSocket(WebSocketProtocol + '://' + AHostname + ':' + APort, Protocols);
        } else {
            that.FWebSocket = new WebSocket(WebSocketProtocol + '://' + AProxyHostname + ':' + (WebSocketProtocol === 'wss' ? AProxyPortSecure : AProxyPort) + '/' + AHostname + '/' + APort, Protocols);
        }

        // Enable binary mode, if supported
        if (Protocols.indexOf('binary') >= 0) {
            that.FWebSocket.binaryType = 'arraybuffer';
        }

        // Set event handlers
        that.FWebSocket.onclose = OnSocketClose;
        that.FWebSocket.onerror = OnSocketError;
        that.FWebSocket.onmessage = OnSocketMessage;
        that.FWebSocket.onopen = OnSocketOpen;
    };

    this.__defineGetter__("connected", function () {
        if (that.FWebSocket) {
            return (that.FWebSocket.readyState === that.FWebSocket.OPEN);
        }

        return false;
    });

    this.flushTcpConnection = function () {
        var ToSendBytes = [];

        that.FOutputBuffer.position = 0;
        while (that.FOutputBuffer.bytesAvailable > 0) {
            var B = that.FOutputBuffer.readUnsignedByte();
            ToSendBytes.push(B);
        }

        that.Send(ToSendBytes);
        that.FOutputBuffer.clear();
    };

    this.NegotiateInboundTcpConnection = function (AData) {
        // No negotiation for raw tcp connection
        while (AData.bytesAvailable) {
            var B = AData.readUnsignedByte();
            that.FInputBuffer.writeByte(B);
        }
    };

    OnSocketClose = function () {
        if (FWasConnected) {
            that.onclose();
        } else {
            that.onsecurityerror();
        }
        FWasConnected = false;
    };

    OnSocketError = function (e) {
        that.onioerror(e);
    };

    OnSocketOpen = function () {
        if (that.FWebSocket.protocol) {
            that.FProtocol = that.FWebSocket.protocol;
        } else {
            that.FProtocol = 'plain';
        }

        FWasConnected = true;
        that.onconnect();
    };

    OnSocketMessage = function (e) {
        // Free up some memory if we're at the end of the buffer
        if (that.FInputBuffer.bytesAvailable === 0) { that.FInputBuffer.clear(); }

        // Save the old position and set the new position to the end of the buffer
        var OldPosition = that.FInputBuffer.position;
        that.FInputBuffer.position = that.FInputBuffer.length;

        var Data = new ByteArray();

        // Write the incoming message to the input buffer
        var i;
        if (that.FProtocol === 'binary') {
            var u8 = new Uint8Array(e.data);
            for (i = 0; i < u8.length; i++) {
                Data.writeByte(u8[i]);
            }
        } else if (that.FProtocol === 'base64') {
            var decoded = Base64.decode(e.data, 0);
            for (i = 0; i < decoded.length; i++) {
                Data.writeByte(decoded[i]);
            }
        } else {
            Data.writeString(e.data);
        }
        Data.position = 0;

        that.NegotiateInbound(Data);

        // Restore the old buffer position
        that.FInputBuffer.position = OldPosition;
    };

    // Remap all the read* functions to operate on our input buffer instead
    this.readBoolean = function () {
        return that.FInputBuffer.readBoolean();
    };

    this.readByte = function () {
        return that.FInputBuffer.readByte();
    };

    this.readBytes = function (ABytes, AOffset, ALength) {
        return that.FInputBuffer.readBytes(ABytes, AOffset, ALength);
    };

    this.readDouble = function () {
        return that.FInputBuffer.readDouble();
    };

    this.readFloat = function () {
        return that.FInputBuffer.readFloat();
    };

    this.readInt = function () {
        return that.FInputBuffer.readInt();
    };

    this.readMultiByte = function (ALength, ACharSet) {
        return that.FInputBuffer.readMultiByte(ALength, ACharSet);
    };

    this.readObject = function () {
        return that.FInputBuffer.readObject();
    };

    this.readShort = function () {
        return that.FInputBuffer.readShort();
    };

    this.readString = function (ALength) {
        return that.FInputBuffer.readString();
    };

    this.readUnsignedByte = function () {
        return that.FInputBuffer.readUnsignedByte();
    };

    this.readUnsignedInt = function () {
        return that.FInputBuffer.readUnsignedInt();
    };

    this.readUnsignedShort = function () {
        return that.FInputBuffer.readUnsignedShort();
    };

    this.readUTF = function () {
        return that.FInputBuffer.readUTF();
    };

    this.readUTFBytes = function (ALength) {
        return that.FInputBuffer.readUTFBytes(ALength);
    };

    this.Send = function (data) {
        if (that.FProtocol === 'binary') {
            that.FWebSocket.send(new Uint8Array(data).buffer);
        } else if (that.FProtocol === 'base64') {
            that.FWebSocket.send(Base64.encode(data));
        } else {
            var ToSendString = '';

            var i;
            for (i = 0; i < data.length; i++) {
                ToSendString += String.fromCharCode(data[i]);
            }

            that.FWebSocket.send(ToSendString);
        }
    };

    // Remap all the write* functions to operate on our output buffer instead
    this.writeBoolean = function (AValue) {
        that.FOutputBuffer.writeBoolean(AValue);
    };

    this.writeByte = function (AValue) {
        that.FOutputBuffer.writeByte(AValue);
    };

    this.writeBytes = function (ABytes, AOffset, ALength) {
        that.FOutputBuffer.writeBytes(ABytes, AOffset, ALength);
    };

    this.writeDouble = function (AValue) {
        that.FOutputBuffer.writeDouble(AValue);
    };

    this.writeFloat = function (AValue) {
        that.FOutputBuffer.writeFloat(AValue);
    };

    this.writeInt = function (AValue) {
        that.FOutputBuffer.writeInt(AValue);
    };

    this.writeMultiByte = function (AValue, ACharSet) {
        that.FOutputBuffer.writeMultiByte(AValue, ACharSet);
    };

    this.writeObject = function (AObject) {
        that.FOutputBuffer.writeObject(AObject);
    };

    this.writeShort = function (AValue) {
        that.FOutputBuffer.writeShort(AValue);
    };

    this.writeString = function (AText) {
        that.FOutputBuffer.writeString(AText);
        that.flush();
    };

    this.writeUnsignedInt = function (AValue) {
        that.FOutputBuffer.writeUnsignedInt(AValue);
    };

    this.writeUTF = function (AValue) {
        that.FOutputBuffer.writeUTF(AValue);
    };

    this.writeUTFBytes = function (AValue) {
        that.FOutputBuffer.writeUTFBytes(AValue);
    };

    // Constructor
    that.FInputBuffer = new ByteArray();
    that.FOutputBuffer = new ByteArray();
};

var TTcpConnectionSurrogate = function () { };
TTcpConnectionSurrogate.prototype = TTcpConnection.prototype;

TTcpConnection.prototype.flush = function () {
    this.flushTcpConnection();
};

TTcpConnection.prototype.NegotiateInbound = function (AData) {
    this.NegotiateInboundTcpConnection(AData);
};