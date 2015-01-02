/*
  fTelnet: An HTML5 WebSocket client
  Copyright (C) 2009-2013  Rick Parrish, R&M Software

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
/// <reference path="../../3rdparty/TypedEvent.ts" />

if ('WebSocket' in window) {
    // Do nothing, we have native websocket support
} else if ('MozWebSocket' in window) {
    // For Firefox 6.0
    window['WebSocket'] = window['MozWebSocket'];
} else {
    // For IE9 and Android < 4.4
    var ScriptUrl: string = (<HTMLScriptElement>document.getElementById('fTelnetScript')).src;
    var ScriptRoot: string = ScriptUrl.replace('/ftelnet.min.js', '');
    ScriptRoot = ScriptRoot.replace('/ftelnet.debug.js', '');

    // From: https://github.com/gimite/web-socket-js
    var WEB_SOCKET_SWF_LOCATION = ScriptRoot + "/WebSocketMain.swf";
    document.write('<script src="' + ScriptRoot + '/swfobject.js")"><\/script>');
    document.write('<script src="' + ScriptRoot + '/web_socket.js")"><\/script>');
}

var WebSocketProtocol: string = ('https:' === document.location.protocol ? 'wss' : 'ws');
var WebSocketSupportsTypedArrays: boolean = (('Uint8Array' in window) && ('set' in Uint8Array.prototype));
var WebSocketSupportsBinaryType: boolean = (WebSocketSupportsTypedArrays && ('binaryType' in WebSocket.prototype || !!(new WebSocket(WebSocketProtocol + '://.').binaryType)));

class WebSocketConnection {
    // Events
    public onclose: IEvent = new TypedEvent();
    public onconnect: IEvent = new TypedEvent();
    public ondata: IEvent = new TypedEvent();
    public onlocalecho: IBooleanEvent = new TypedEvent();
    public onioerror: IEvent = new TypedEvent();
    public onsecurityerror: IEvent = new TypedEvent();

    // Private variables
    private _WasConnected: boolean = false;

    // TODO Protected variables
    public _InputBuffer: ByteArray = null;
    public _LocalEcho: boolean;
    public _OutputBuffer: ByteArray = null;
    public _Protocol: string = 'plain';
    public _WebSocket: WebSocket = null;

    constructor() {
        this._InputBuffer = new ByteArray();
        this._LocalEcho = false;
        this._OutputBuffer = new ByteArray();
    }

    public get bytesAvailable(): number {
        return this._InputBuffer.bytesAvailable;
    }

    public close(): void {
        if (this._WebSocket) {
            this._WebSocket.close();
        }
    }

    public connect(hostname: string, port: number, proxyHostname?: string, proxyPort?: number, proxyPortSecure?: number): void {
        if (typeof proxyHostname === 'undefined') { proxyHostname = ''; }
        if (typeof proxyPort === 'undefined') { proxyPort = 1123; }
        if (typeof proxyPortSecure === 'undefined') { proxyPortSecure = 11235; }

        this._WasConnected = false;

        var Protocols: string[];
        if (('WebSocket' in window) && (WebSocket.CLOSED === 2 || WebSocket.prototype.CLOSED === 2)) { // From: http://stackoverflow.com/a/17850524/342378
            // This is likely a hixie client, which doesn't support negotiation fo multiple protocols, so we only ask for plain
            Protocols = ['plain'];
        } else {
            if (WebSocketSupportsBinaryType && WebSocketSupportsTypedArrays) {
                Protocols = ['binary', 'base64', 'plain'];
            } else {
                Protocols = ['base64', 'plain'];
            }
        }

        if (proxyHostname === '') {
            this._WebSocket = new WebSocket(WebSocketProtocol + '://' + hostname + ':' + port, Protocols);
        } else {
            this._WebSocket = new WebSocket(WebSocketProtocol + '://' + proxyHostname + ':' + (WebSocketProtocol === 'wss' ? proxyPortSecure : proxyPort) + '/' + hostname + '/' + port, Protocols);
        }

        // Enable binary mode, if supported
        if (Protocols.indexOf('binary') >= 0) {
            this._WebSocket.binaryType = 'arraybuffer';
        }

        // Set event handlers
        this._WebSocket.onclose = (): void => { this.OnSocketClose(); };
        this._WebSocket.onerror = (e: ErrorEvent): void => { this.OnSocketError(e); };
        this._WebSocket.onmessage = (e: any): void => { this.OnSocketMessage(e); };
        this._WebSocket.onopen = (): void => { this.OnSocketOpen(); };
    }

    public get connected(): boolean {
        if (this._WebSocket) {
            return (this._WebSocket.readyState === this._WebSocket.OPEN) || (this._WebSocket.readyState === WebSocket.OPEN);
        }

        return false;
    }

    public flush(): void {
        var ToSendBytes: number[] = [];

        this._OutputBuffer.position = 0;
        while (this._OutputBuffer.bytesAvailable > 0) {
            var B: number = this._OutputBuffer.readUnsignedByte();
            ToSendBytes.push(B);
        }

        this.Send(ToSendBytes);
        this._OutputBuffer.clear();
    }

    public set LocalEcho(value: boolean) {
        this._LocalEcho = value;
    }

    public NegotiateInbound(data: ByteArray): void {
        // No negotiation for raw tcp connection
        while (data.bytesAvailable) {
            var B: number = data.readUnsignedByte();
            this._InputBuffer.writeByte(B);
        }
    }

    private OnSocketClose(): void {
        if (this._WasConnected) {
            this.onclose.trigger();
        } else {
            this.onsecurityerror.trigger();
        }
        this._WasConnected = false;
    }

    private OnSocketError(e: ErrorEvent): void {
        this.onioerror.trigger(e);
    }

    public OnSocketOpen(): void {
        if (this._WebSocket.protocol) {
            this._Protocol = this._WebSocket.protocol;
        } else {
            this._Protocol = 'plain';
        }

        this._WasConnected = true;
        this.onconnect.trigger();
    }

    private OnSocketMessage(e: any): void {
        // Free up some memory if we're at the end of the buffer
        if (this._InputBuffer.bytesAvailable === 0) { this._InputBuffer.clear(); }

        // Save the old position and set the new position to the end of the buffer
        var OldPosition: number = this._InputBuffer.position;
        this._InputBuffer.position = this._InputBuffer.length;

        var Data: ByteArray = new ByteArray();

        // Write the incoming message to the input buffer
        var i: number;
        if (this._Protocol === 'binary') {
            var u8: Uint8Array = new Uint8Array(e.data);
            for (i = 0; i < u8.length; i++) {
                Data.writeByte(u8[i]);
            }
        } else if (this._Protocol === 'base64') {
            // TODO Ensure atob still works with websockify
            Data.writeString(atob(e.data));
        } else {
            Data.writeString(e.data);
        }
        Data.position = 0;

        this.NegotiateInbound(Data);

        // Restore the old buffer position
        this._InputBuffer.position = OldPosition;

        // Raise ondata event
        this.ondata.trigger();
    }

    // Remap all the read* functions to operate on our input buffer instead
    public readBytes(bytes: ByteArray, offset: number, length: number): void {
        return this._InputBuffer.readBytes(bytes, offset, length);
    }

    public readString(length?: number): string {
        return this._InputBuffer.readString(length);
    }

    public readUnsignedByte(): number {
        return this._InputBuffer.readUnsignedByte();
    }

    public readUnsignedShort(): number {
        return this._InputBuffer.readUnsignedShort();
    }

    public Send(data: number[]): void {
        var i: number = 0;
        var ToSendString: string = '';

        if (this._Protocol === 'binary') {
            this._WebSocket.send(new Uint8Array(data).buffer);
        } else if (this._Protocol === 'base64') {
            // TODO Ensure btoa still works with websockify
            for (i = 0; i < data.length; i++) {
                ToSendString += String.fromCharCode(data[i]);
            }
            this._WebSocket.send(btoa(ToSendString));
        } else {
            for (i = 0; i < data.length; i++) {
                ToSendString += String.fromCharCode(data[i]);
            }
            this._WebSocket.send(ToSendString);
        }
    }

    // Remap all the write* functions to operate on our output buffer instead
    public writeByte(value: number): void {
        this._OutputBuffer.writeByte(value);
    }

    public writeBytes(bytes: ByteArray, offset?: number, length?: number): void {
        this._OutputBuffer.writeBytes(bytes, offset, length);
    }

    public writeShort(value: number): void {
        this._OutputBuffer.writeShort(value);
    }

    public writeString(text: string): void {
        this._OutputBuffer.writeString(text);
        this.flush();
    }
}
