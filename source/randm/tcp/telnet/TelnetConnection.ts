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
/// <reference path="../WebSocketConnection.ts" />
class TelnetConnection extends WebSocketConnection {
    // Private variables
    private _Crt: Crt;
    private _NegotiatedOptions: number[];
    private _NegotiationState: TelnetNegotiationState;
    private _TerminalTypeIndex: number;
    private _TerminalTypes: string[];

    constructor(crt: Crt) {
        super();

        this._Crt = crt;
        this._NegotiatedOptions = [];
        for (var i: number = 0; i < 256; i++) {
            this._NegotiatedOptions[i] = 0;
        }
        this._NegotiationState = TelnetNegotiationState.Data;
        this._TerminalTypeIndex = 0;
        this._TerminalTypes = ['ansi-bbs', 'ansi', 'cp437', 'cp437']; // cp437 twice as a cheat since you're supposed to repeat the last item before going to the first item
    }

    public flush(): void {
        var ToSendBytes: number[] = [];

        this._OutputBuffer.position = 0;
        while (this._OutputBuffer.bytesAvailable > 0) {
            var B: number = this._OutputBuffer.readUnsignedByte();
            ToSendBytes.push(B);

            if (B === TelnetCommand.IAC) {
                ToSendBytes.push(TelnetCommand.IAC);
            }
        }

        this.Send(ToSendBytes);
        this._OutputBuffer.clear();
    }

    private HandleAreYouThere(): void {
        var ToSendBytes: number[] = [];
        ToSendBytes.push('.'.charCodeAt(0));
        this.Send(ToSendBytes);
    }

    private HandleEcho(command: number): void {
        switch (command) {
            case TelnetCommand.Do:
                this.SendWill(TelnetOption.Echo);
                this._LocalEcho = true;
                this.onlocalecho.trigger(this._LocalEcho);
                break;
            case TelnetCommand.Dont:
                this.SendWont(TelnetOption.Echo);
                this._LocalEcho = false;
                this.onlocalecho.trigger(this._LocalEcho);
                break;
            case TelnetCommand.Will:
                this.SendDo(TelnetOption.Echo);
                this._LocalEcho = false;
                this.onlocalecho.trigger(this._LocalEcho);
                break;
            case TelnetCommand.Wont:
                this.SendDont(TelnetOption.Echo);
                this._LocalEcho = true;
                this.onlocalecho.trigger(this._LocalEcho);
                break;
        }
    }

    private HandleSendLocation(): void {
        var xhr: XMLHttpRequest = new XMLHttpRequest();
        xhr.open('get', 'http://myip.randm.ca', true);
        xhr.onload = (): void => {
            var status: number = xhr.status;
            if (status === 200) {
                this.SendWill(TelnetOption.SendLocation);
                this.SendSubnegotiate(TelnetOption.SendLocation);

                var ToSendString: string = xhr.responseText;
                var ToSendBytes: number[] = [];
                for (var i: number = 0; i < ToSendString.length; i++) {
                    var CharCode: number = ToSendString.charCodeAt(i);
                    ToSendBytes.push(CharCode);
                    if (CharCode === TelnetCommand.IAC) {
                        // Double up so it's not treated as an IAC
                        ToSendBytes.push(TelnetCommand.IAC);
                    }
                }
                this.Send(ToSendBytes);

                this.SendSubnegotiateEnd();
            } else {
                // TODOX alert('failed to get remote ip');
            }
        };
        xhr.onerror = (): void => {
            // TODOX alert('failed to get remote ip');
        };
        xhr.send();
    }

    private HandleTerminalType(): void {
        this.SendWill(TelnetOption.TerminalType);
        this.SendSubnegotiate(TelnetOption.TerminalType);

        var TerminalType: string = this._TerminalTypes[this._TerminalTypeIndex];
        var ToSendBytes: number[] = [];
        ToSendBytes.push(0); // IS

        for (var i: number = 0; i < TerminalType.length; i++) {
            ToSendBytes.push(TerminalType.charCodeAt(i));
        }
        this.Send(ToSendBytes);

        this.SendSubnegotiateEnd();

        // Move to next terminal type, in case we're asked for an alternate
        if (this._TerminalTypeIndex < (this._TerminalTypes.length - 1)) {
            this._TerminalTypeIndex += 1;
        } else {
            this._TerminalTypeIndex = 0;
        }
    }

    private HandleTerminalLocationNumber(): void {
        var xhr: XMLHttpRequest = new XMLHttpRequest();
        xhr.open('get', 'http://myip.randm.ca', true);
        xhr.onload = (): void => {
            var status: number = xhr.status;
            if (status === 200) {
                this.SendWill(TelnetOption.TerminalLocationNumber);
                this.SendSubnegotiate(TelnetOption.TerminalLocationNumber);

                var InternetHostNumber: number = StringUtils.IPtoInteger(xhr.responseText);
                var TerminalNumber: number = 0xFFFFFFFF; // Indicates "unknown" terminal number

                var SixtyFourBits: number[] = [];
                SixtyFourBits.push(0); // Format 0 to indicate we'll send two 32bit numbers
                SixtyFourBits.push((InternetHostNumber & 0xFF000000) >> 24);
                SixtyFourBits.push((InternetHostNumber & 0x00FF0000) >> 16);
                SixtyFourBits.push((InternetHostNumber & 0x0000FF00) >> 8);
                SixtyFourBits.push((InternetHostNumber & 0x000000FF) >> 0);
                SixtyFourBits.push((TerminalNumber & 0xFF000000) >> 24);
                SixtyFourBits.push((TerminalNumber & 0x00FF0000) >> 16);
                SixtyFourBits.push((TerminalNumber & 0x0000FF00) >> 8);
                SixtyFourBits.push((TerminalNumber & 0x000000FF) >> 0);

                var ToSendBytes: number[] = [];
                for (var i: number = 0; i < SixtyFourBits.length; i++) {
                    ToSendBytes.push(SixtyFourBits[i]);
                    if (SixtyFourBits[i] === TelnetCommand.IAC) {
                        // Double up so it's not treated as an IAC
                        ToSendBytes.push(TelnetCommand.IAC);
                    }
                }
                this.Send(ToSendBytes);

                this.SendSubnegotiateEnd();
            } else {
                // TODOX alert('failed to get remote ip');
            }
        };
        xhr.onerror = (): void => {
            // TODOX alert('failed to get remote ip');
        };
        xhr.send();
    }

    private HandleWindowSize(): void {
        this.SendWill(TelnetOption.WindowSize);
        this.SendSubnegotiate(TelnetOption.WindowSize);

        var Size: number[] = [];
        Size[0] = (this._Crt.WindCols >> 8) & 0xff;
        Size[1] = this._Crt.WindCols & 0xff;
        Size[2] = (this._Crt.WindRows >> 8) & 0xff;
        Size[3] = this._Crt.WindRows & 0xff;

        var ToSendBytes: number[] = [];
        for (var i: number = 0; i < Size.length; i++) {
            ToSendBytes.push(Size[i]);
            if (Size[i] === TelnetCommand.IAC) {
                // Double up so it's not treated as an IAC
                ToSendBytes.push(TelnetCommand.IAC);
            }
        }
        this.Send(ToSendBytes);

        this.SendSubnegotiateEnd();
    }

    public set LocalEcho(value: boolean) {
        this._LocalEcho = value;

        if (this.connected) {
            if (this._LocalEcho) {
                this.SendWill(TelnetOption.Echo);
            } else {
                this.SendWont(TelnetOption.Echo);
            }
        }
    }

    public NegotiateInbound(data: ByteArray): void {
        // Get any waiting data and handle negotiation
        while (data.bytesAvailable) {
            var B: number = data.readUnsignedByte();

            if (this._NegotiationState === TelnetNegotiationState.Data) {
                if (B === TelnetCommand.IAC) {
                    this._NegotiationState = TelnetNegotiationState.IAC;
                } else {
                    this._InputBuffer.writeByte(B);
                }
            } else if (this._NegotiationState === TelnetNegotiationState.IAC) {
                if (B === TelnetCommand.IAC) {
                    this._NegotiationState = TelnetNegotiationState.Data;
                    this._InputBuffer.writeByte(B);
                } else {
                    switch (B) {
                        case TelnetCommand.NoOperation:
                        case TelnetCommand.DataMark:
                        case TelnetCommand.Break:
                        case TelnetCommand.InterruptProcess:
                        case TelnetCommand.AbortOutput:
                        case TelnetCommand.EraseCharacter:
                        case TelnetCommand.EraseLine:
                        case TelnetCommand.GoAhead:
                            // We recognize, but ignore these for now
                            this._NegotiationState = TelnetNegotiationState.Data;
                            break;
                        case TelnetCommand.AreYouThere:
                            this.HandleAreYouThere();
                            this._NegotiationState = TelnetNegotiationState.Data;
                            break;
                        case TelnetCommand.Do: this._NegotiationState = TelnetNegotiationState.Do; break;
                        case TelnetCommand.Dont: this._NegotiationState = TelnetNegotiationState.Dont; break;
                        case TelnetCommand.Will: this._NegotiationState = TelnetNegotiationState.Will; break;
                        case TelnetCommand.Wont: this._NegotiationState = TelnetNegotiationState.Wont; break;
                        default: this._NegotiationState = TelnetNegotiationState.Data; break;
                    }
                }
            } else if (this._NegotiationState === TelnetNegotiationState.Do) {
                switch (B) {
                    case TelnetCommand.AreYouThere:
                        // TWGS incorrectly sends a DO AYT and expects a response
                        this.SendWill(TelnetCommand.AreYouThere);
                        this._NegotiatedOptions[TelnetCommand.AreYouThere] = 0;
                        break;
                    case TelnetOption.TransmitBinary: this.SendWill(B); break;
                    case TelnetOption.Echo: this.HandleEcho(TelnetCommand.Do); break;
                    case TelnetOption.SuppressGoAhead: this.SendWill(B); break;
                    case TelnetOption.SendLocation: this.HandleSendLocation(); break;
                    case TelnetOption.TerminalType: this.HandleTerminalType(); break;
                    case TelnetOption.TerminalLocationNumber: this.HandleTerminalLocationNumber(); break;
                    case TelnetOption.WindowSize: this.HandleWindowSize(); break;
                    case TelnetOption.LineMode: this.SendWont(B); break;
                    default: this.SendWont(B); break;
                }
                this._NegotiationState = TelnetNegotiationState.Data;
            } else if (this._NegotiationState === TelnetNegotiationState.Dont) {
                switch (B) {
                    case TelnetOption.TransmitBinary: this.SendWill(B); break;
                    case TelnetOption.Echo: this.HandleEcho(TelnetCommand.Dont); break;
                    case TelnetOption.SuppressGoAhead: this.SendWill(B); break;
                    case TelnetOption.SendLocation: this.SendWont(B); break;
                    case TelnetOption.TerminalLocationNumber: this.SendWont(B); break;
                    case TelnetOption.WindowSize: this.SendWont(B); break;
                    case TelnetOption.LineMode: this.SendWont(B); break;
                    default: this.SendWont(B); break;
                }
                this._NegotiationState = TelnetNegotiationState.Data;
            } else if (this._NegotiationState === TelnetNegotiationState.Will) {
                switch (B) {
                    case TelnetOption.TransmitBinary: this.SendDo(B); break;
                    case TelnetOption.Echo: this.HandleEcho(TelnetCommand.Will); break;
                    case TelnetOption.SuppressGoAhead: this.SendDo(B); break;
                    case TelnetOption.SendLocation: this.SendDont(B); break;
                    case TelnetOption.TerminalLocationNumber: this.SendDont(B); break;
                    case TelnetOption.WindowSize: this.SendDont(B); break;
                    case TelnetOption.LineMode: this.SendDont(B); break;
                    default: this.SendDont(B); break;
                }
                this._NegotiationState = TelnetNegotiationState.Data;
            } else if (this._NegotiationState === TelnetNegotiationState.Wont) {
                switch (B) {
                    case TelnetOption.TransmitBinary: this.SendDo(B); break;
                    case TelnetOption.Echo: this.HandleEcho(TelnetCommand.Wont); break;
                    case TelnetOption.SuppressGoAhead: this.SendDo(B); break;
                    case TelnetOption.SendLocation: this.SendDont(B); break;
                    case TelnetOption.TerminalLocationNumber: this.SendDont(B); break;
                    case TelnetOption.WindowSize: this.SendDont(B); break;
                    case TelnetOption.LineMode: this.SendDont(B); break;
                    default: this.SendDont(B); break;
                }
                this._NegotiationState = TelnetNegotiationState.Data;
            } else {
                this._NegotiationState = TelnetNegotiationState.Data;
            }
        }
    }

    // TODO Need NegotiateOutbound

    public OnSocketOpen(): void {
        super.OnSocketOpen();

        if (this._LocalEcho) {
            this.SendWill(TelnetOption.Echo);
        } else {
            this.SendWont(TelnetOption.Echo);
        }

        if (this._Proxied) {
            this.SendWill(TelnetOption.SendLocation);
            this.SendWill(TelnetOption.TerminalLocationNumber);
        }
    }

    private SendDo(option: number): void {
        if (this._NegotiatedOptions[option] !== TelnetCommand.Do) {
            // Haven't negotiated this option
            this._NegotiatedOptions[option] = TelnetCommand.Do;

            var ToSendBytes: number[] = [];
            ToSendBytes.push(TelnetCommand.IAC);
            ToSendBytes.push(TelnetCommand.Do);
            ToSendBytes.push(option);
            this.Send(ToSendBytes);
        }
    }

    private SendDont(option: number): void {
        if (this._NegotiatedOptions[option] !== TelnetCommand.Dont) {
            // Haven't negotiated this option
            this._NegotiatedOptions[option] = TelnetCommand.Dont;

            var ToSendBytes: number[] = [];
            ToSendBytes.push(TelnetCommand.IAC);
            ToSendBytes.push(TelnetCommand.Dont);
            ToSendBytes.push(option);
            this.Send(ToSendBytes);
        }
    }

    private SendSubnegotiate(option: number): void {
        var ToSendBytes: number[] = [];
        ToSendBytes.push(TelnetCommand.IAC);
        ToSendBytes.push(TelnetCommand.Subnegotiation);
        ToSendBytes.push(option);
        this.Send(ToSendBytes);
    }

    private SendSubnegotiateEnd(): void {
        var ToSendBytes: number[] = [];
        ToSendBytes.push(TelnetCommand.IAC);
        ToSendBytes.push(TelnetCommand.EndSubnegotiation);
        this.Send(ToSendBytes);
    }

    private SendWill(option: number): void {
        if (this._NegotiatedOptions[option] !== TelnetCommand.Will) {
            // Haven't negotiated this option
            this._NegotiatedOptions[option] = TelnetCommand.Will;

            var ToSendBytes: number[] = [];
            ToSendBytes.push(TelnetCommand.IAC);
            ToSendBytes.push(TelnetCommand.Will);
            ToSendBytes.push(option);
            this.Send(ToSendBytes);
        }
    }

    private SendWont(option: number): void {
        if (this._NegotiatedOptions[option] !== TelnetCommand.Wont) {
            // Haven't negotiated this option
            this._NegotiatedOptions[option] = TelnetCommand.Wont;

            var ToSendBytes: number[] = [];
            ToSendBytes.push(TelnetCommand.IAC);
            ToSendBytes.push(TelnetCommand.Wont);
            ToSendBytes.push(option);
            this.Send(ToSendBytes);
        }
    }
}
