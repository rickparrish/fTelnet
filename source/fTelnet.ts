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

// This class is only here for compatibility purposes -- the "real" code is fTelnetClient.ts
class fTelnet {
    // Settings to be loaded from HTML
    private static _BareLFtoCRLF: boolean;
    private static _BitsPerSecond: number;
    private static _Blink: boolean;
    private static _ConnectionType: string;
    private static _Emulation: string;
    private static _Enter: string;
    private static _Font: string;
    private static _ForceWss: boolean;
    private static _Hostname: string;
    private static _LocalEcho: boolean;
    private static _Port: number;
    private static _ProxyHostname: string;
    private static _ProxyPort: number;
    private static _ProxyPortSecure: number;
    private static _RLoginClientUsername: string;
    private static _RLoginServerUsername: string;
    private static _RLoginTerminalType: string;
    private static _ScreenColumns: number;
    private static _ScreenRows: number;
    private static _SplashScreen: string;
    private static _StatusBarVisible: boolean;
    private static _VirtualKeyboardVisible: boolean;

    private static _Client: fTelnetClient;

    // TODOX This should be a constructor, and accept an fTelnetOptions parameter
    public static Init(): boolean {
        try {
            this._Client = new fTelnetClient('fTelnetContainer');

            if (typeof this._BareLFtoCRLF !== 'undefined') { this._Client.BareLFtoCRLF = this._BareLFtoCRLF; }
            if (typeof this._BitsPerSecond !== 'undefined') { this._Client.BitsPerSecond = this._BitsPerSecond; }
            if (typeof this._Blink !== 'undefined') { this._Client.Blink = this._Blink; }
            if (typeof this._ConnectionType !== 'undefined') { this._Client.ConnectionType = this._ConnectionType; }
            if (typeof this._Emulation !== 'undefined') { this._Client.Emulation = this._Emulation; }
            if (typeof this._Enter !== 'undefined') { this._Client.Enter = this._Enter; }
            if (typeof this._Font !== 'undefined') { this._Client.Font = this._Font; }
            if (typeof this._ForceWss !== 'undefined') { this._Client.ForceWss = this._ForceWss; }
            if (typeof this._Hostname !== 'undefined') { this._Client.Hostname = this._Hostname; }
            if (typeof this._LocalEcho !== 'undefined') { this._Client.LocalEcho = this._LocalEcho; }
            if (typeof this._Port !== 'undefined') { this._Client.Port = this._Port; }
            if (typeof this._ProxyHostname !== 'undefined') { this._Client.ProxyHostname = this._ProxyHostname; }
            if (typeof this._ProxyPort !== 'undefined') { this._Client.ProxyPort = this._ProxyPort; }
            if (typeof this._ProxyPortSecure !== 'undefined') { this._Client.ProxyPortSecure = this._ProxyPortSecure; }
            if (typeof this._RLoginClientUsername !== 'undefined') { this._Client.RLoginClientUsername = this._RLoginClientUsername; }
            if (typeof this._RLoginServerUsername !== 'undefined') { this._Client.RLoginServerUsername = this._RLoginServerUsername; }
            if (typeof this._RLoginTerminalType !== 'undefined') { this._Client.RLoginTerminalType = this._RLoginTerminalType; }
            if (typeof this._ScreenColumns !== 'undefined') { this._Client.ScreenColumns = this._ScreenColumns; }
            if (typeof this._ScreenRows !== 'undefined') { this._Client.ScreenRows = this._ScreenRows; }
            if (typeof this._SplashScreen !== 'undefined') { this._Client.SplashScreen = this._SplashScreen; }
            if (typeof this._StatusBarVisible !== 'undefined') { this._Client.StatusBarVisible = this._StatusBarVisible; }
            if (typeof this._VirtualKeyboardVisible !== 'undefined') { this._Client.VirtualKeyboardVisible = this._VirtualKeyboardVisible; }

            return true;
        } catch (e) {
            return false;
        }
    }

    public static get BareLFtoCRLF(): boolean {
        if (typeof this._Client === 'undefined') {
            return this._BareLFtoCRLF;
        } else {
            return this._Client.BareLFtoCRLF;
        }
    }

    public static set BareLFtoCRLF(value: boolean) {
        if (typeof this._Client === 'undefined') {
            this._BareLFtoCRLF = value;
        } else {
            this._Client.BareLFtoCRLF = value;
        }
    }

    public static get BitsPerSecond(): number {
        if (typeof this._Client === 'undefined') {
            return this._BitsPerSecond;
        } else {
            return this._Client.BitsPerSecond;
        }
    }

    public static set BitsPerSecond(value: number) {
        if (typeof this._Client === 'undefined') {
            this._BitsPerSecond = value;
        } else {
            this._Client.BitsPerSecond = value;
        }
    }

    public static get Blink(): boolean {
        if (typeof this._Client === 'undefined') {
            return this._Blink;
        } else {
            return this._Client.Blink;
        }
    }

    public static set Blink(value: boolean) {
        this._Blink = value;
    }

    public static Connect(): void {
        if (typeof this._Client !== 'undefined') {
            this._Client.Connect();
        }
    }

    public static get ConnectionType(): string {
        if (typeof this._Client === 'undefined') {
            return this._ConnectionType;
        } else {
            return this._Client.ConnectionType;
        }
    }

    public static set ConnectionType(value: string) {
        if (typeof this._Client === 'undefined') {
            this._ConnectionType = value;
        } else {
            this._Client.ConnectionType = value;
        }
    }

    public static get Emulation(): string {
        if (typeof this._Client === 'undefined') {
            return this._Emulation;
        } else {
            return this._Client.Emulation;
        }
    }

    // TODOX Does this need more to it, like the original setter?
    public static set Emulation(value: string) {
        if (typeof this._Client === 'undefined') {
            this._Emulation = value;
        } else {
            this._Client.Emulation = value;
        }
    }

    public static get Enter(): string {
        if (typeof this._Client === 'undefined') {
            return this._Enter;
        } else {
            return this._Client.Enter;
        }
    }

    public static set Enter(value: string) {
        if (typeof this._Client === 'undefined') {
            this._Enter = value;
        } else {
            this._Client.Enter = value;
        }
    }

    public static get Font(): string {
        if (typeof this._Client === 'undefined') {
            return this._Font;
        } else {
            return this._Client.Font;
        }
    }

    public static set Font(value: string) {
        if (typeof this._Client === 'undefined') {
            this._Font = value;
        } else {
            this._Client.Font = value;
        }
    }

    public static get ForceWss(): boolean {
        if (typeof this._Client === 'undefined') {
            return this._ForceWss;
        } else {
            return this._Client.ForceWss;
        }
    }

    public static set ForceWss(value: boolean) {
        if (typeof this._Client === 'undefined') {
            this._ForceWss = value;
        } else {
            this._Client.ForceWss = value;
        }
    }

    public static get Hostname(): string {
        if (typeof this._Client === 'undefined') {
            return this._Hostname;
        } else {
            return this._Client.Hostname;
        }
    }

    public static set Hostname(value: string) {
        if (typeof this._Client === 'undefined') {
            this._Hostname = value;
        } else {
            this._Client.Hostname = value;
        }
    }

    public static get LocalEcho(): boolean {
        if (typeof this._Client === 'undefined') {
            return this._LocalEcho;
        } else {
            return this._Client.LocalEcho;
        }
    }

    // TODOX Does this need more to it, like the original setter/
    public static set LocalEcho(value: boolean) {
        if (typeof this._Client === 'undefined') {
            this._LocalEcho = value;
        } else {
            this._Client.LocalEcho = value;
        }
    }

    public static get Port(): number {
        if (typeof this._Client === 'undefined') {
            return this._Port;
        } else {
            return this._Client.Port;
        }
    }

    public static set Port(value: number) {
        if (typeof this._Client === 'undefined') {
            this._Port = value;
        } else {
            this._Client.Port = value;
        }
    }

    public static get ProxyHostname(): string {
        if (typeof this._Client === 'undefined') {
            return this._ProxyHostname;
        } else {
            return this._Client.ProxyHostname;
        }
    }

    public static set ProxyHostname(value: string) {
        if (typeof this._Client === 'undefined') {
            this._ProxyHostname = value;
        } else {
            this._Client.ProxyHostname = value;
        }
    }

    public static get ProxyPort(): number {
        if (typeof this._Client === 'undefined') {
            return this._ProxyPort;
        } else {
            return this._Client.ProxyPort;
        }
    }

    public static set ProxyPort(value: number) {
        if (typeof this._Client === 'undefined') {
            this._ProxyPort = value;
        } else {
            this._Client.ProxyPort = value;
        }
    }

    public static get ProxyPortSecure(): number {
        if (typeof this._Client === 'undefined') {
            return this._ProxyPortSecure;
        } else {
            return this._Client.ProxyPortSecure;
        }
    }

    public static set ProxyPortSecure(value: number) {
        if (typeof this._Client === 'undefined') {
            this._ProxyPortSecure = value;
        } else {
            this._Client.ProxyPortSecure = value;
        }
    }

    public static get RLoginClientUsername(): string {
        if (typeof this._Client === 'undefined') {
            return this._RLoginClientUsername;
        } else {
            return this._Client.RLoginClientUsername;
        }
    }

    public static set RLoginClientUsername(value: string) {
        if (typeof this._Client === 'undefined') {
            this._RLoginClientUsername = value;
        } else {
            this._Client.RLoginClientUsername = value;
        }
    }

    public static get RLoginServerUsername(): string {
        if (typeof this._Client === 'undefined') {
            return this._RLoginServerUsername;
        } else {
            return this._Client.RLoginServerUsername;
        }
    }

    public static set RLoginServerUsername(value: string) {
        if (typeof this._Client === 'undefined') {
            this._RLoginServerUsername = value;
        } else {
            this._Client.RLoginServerUsername = value;
        }
    }

    public static get RLoginTerminalType(): string {
        if (typeof this._Client === 'undefined') {
            return this._RLoginTerminalType;
        } else {
            return this._Client.RLoginTerminalType;
        }
    }

    public static set RLoginTerminalType(value: string) {
        if (typeof this._Client === 'undefined') {
            this._RLoginTerminalType = value;
        } else {
            this._Client.RLoginTerminalType = value;
        }
    }

    public static get ScreenColumns(): number {
        if (typeof this._Client === 'undefined') {
            return this._ScreenColumns;
        } else {
            return this._Client.ScreenColumns;
        }
    }

    public static set ScreenColumns(value: number) {
        if (typeof this._Client === 'undefined') {
            this._ScreenColumns = value;
        } else {
            this._Client.ScreenColumns = value;
        }
    }

    public static get ScreenRows(): number {
        if (typeof this._Client === 'undefined') {
            return this._ScreenRows;
        } else {
            return this._Client.ScreenRows;
        }
    }

    public static set ScreenRows(value: number) {
        if (typeof this._Client === 'undefined') {
            this._ScreenRows = value;
        } else {
            this._Client.ScreenRows = value;
        }
    }

    public static get SplashScreen(): string {
        if (typeof this._Client === 'undefined') {
            return this._SplashScreen;
        } else {
            return this._Client.SplashScreen;
        }
    }

    public static set SplashScreen(value: string) {
        if (typeof this._Client === 'undefined') {
            this._SplashScreen = value;
        } else {
            this._Client.SplashScreen = value;
        }
    }

    public static get StatusBarVisible(): boolean {
        if (typeof this._Client === 'undefined') {
            return this._StatusBarVisible;
        } else {
            return this._Client.StatusBarVisible;
        }
    }

    // TODOX Does this need more to it like the original setter?
    public static set StatusBarVisible(value: boolean) {
        if (typeof this._Client === 'undefined') {
            this._StatusBarVisible = value;
        } else {
            this._Client.StatusBarVisible = value;
        }
    }

    public static get VirtualKeyboardVisible(): boolean {
        if (typeof this._Client === 'undefined') {
            return this._VirtualKeyboardVisible;
        } else {
            return this._Client.VirtualKeyboardVisible;
        }
    }

    // TODOX Does this need more to it like the original setter?
    public static set VirtualKeyboardVisible(value: boolean) {
        if (typeof this._Client === 'undefined') {
            this._VirtualKeyboardVisible = value;
        } else {
            this._Client.VirtualKeyboardVisible = value;
        }
    }
}
