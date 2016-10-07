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
/// <reference path='WebSocketConnection.ts' />
class RLoginConnection extends WebSocketConnection {
    private _NegotiationState: RLoginNegotiationState;
    private _SSBytes: number;

    constructor() {
        super();

        this._NegotiationState = RLoginNegotiationState.Data;
        this._SSBytes = 0;
    }

    public NegotiateInbound(data: ByteArray): void {
        // Get any waiting data and handle negotiation
        while (data.bytesAvailable) {
            var B: number = data.readUnsignedByte();

            if (this._NegotiationState === RLoginNegotiationState.Data) {
                if (B === RLoginCommand.Cookie) {
                    this._NegotiationState = RLoginNegotiationState.Cookie1;
                } else {
                    this._InputBuffer.writeByte(B);
                }
            } else if (this._NegotiationState === RLoginNegotiationState.Cookie1) {
                if (B === RLoginCommand.Cookie) {
                    this._NegotiationState = RLoginNegotiationState.Cookie2;
                } else {
                    this._NegotiationState = RLoginNegotiationState.Data;
                }
            } else if (this._NegotiationState === RLoginNegotiationState.Cookie2) {
                if (B === RLoginCommand.S) {
                    this._NegotiationState = RLoginNegotiationState.S1;
                } else {
                    this._NegotiationState = RLoginNegotiationState.Data;
                }
            } else if (this._NegotiationState === RLoginNegotiationState.S1) {
                if (B === RLoginCommand.S) {
                    this._NegotiationState = RLoginNegotiationState.SS;
                } else {
                    this._NegotiationState = RLoginNegotiationState.Data;
                }
            } else if (this._NegotiationState === RLoginNegotiationState.SS) {
                if (++this._SSBytes >= 8) {
                    this._SSBytes = 0;
                    this._NegotiationState = RLoginNegotiationState.Data;
                }
            }
        }
    }
}
