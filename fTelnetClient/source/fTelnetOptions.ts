/*
  fTelnet: An HTML5 WebSocket client
  Copyright (C) Rick Parrish, R&M Software

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
class fTelnetOptions {
    public AllowModernScrollback: boolean = true;
    public BareLFtoCRLF: boolean = false;
    public BitsPerSecond: number = 57600;
    public ConnectionType: string = 'telnet';
    public Emulation: string = 'ansi-bbs';
    public Enter: string = '\r';
    public Font: string = 'CP437';
    public ForceWss: boolean = false;
    public Hostname: string = 'bbs.ftelnet.ca';
    public LocalEcho: boolean = false;
    public NegotiateLocalEcho: boolean = true;
    public Port: number = 1123;
    public ProxyHostname: string = '';
    public ProxyPort: number = 1123;
    public ProxyPortSecure: number = 11235;
    public RLoginClientUsername: string = '';
    public RLoginServerUsername: string = '';
    public RLoginTerminalType: string = '';
    public ScreenColumns: number = 80;
    public ScreenRows: number = 25;
    public SendLocation: boolean = true;
    public SplashScreen: string = '';
    public VirtualKeyboardVibrateDuration: number = 25;
    public VirtualKeyboardVisible: boolean = DetectMobileBrowser.IsMobile;
    public WebSocketUrlPath: string = '';
}
