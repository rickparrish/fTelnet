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
class fTelnet {
    // Private variables
    private static _ButtonBar: HTMLDivElement = null;
    private static _Connection: WebSocketConnection = null;
    private static _FocusWarningBar: HTMLDivElement = null;
    private static _HasFocus: boolean = true;
    private static _InitMessageBar: HTMLDivElement = null;
    private static _LastTimer: number = 0;
    private static _Parent: HTMLElement = null;
    private static _ScrollbackBar: HTMLDivElement = null;
    private static _StatusBar: HTMLDivElement = null;
    private static _StyleBlock: HTMLStyleElement = null;
    private static _Timer: number = null;
    private static _YModemReceive: YModemReceive = null;
    private static _YModemSend: YModemSend = null;

    // Settings to be loaded from HTML
    private static _BareLFtoCRLF: boolean = false;
    private static _BitsPerSecond: number = 57600;
    private static _Blink: boolean = true;
    private static _CodePage: string = '437';
    private static _ConnectionType: string = 'telnet';
    private static _Enter: string = '\r';
    private static _Hostname: string = 'bbs.ftelnet.ca';
    private static _LocalEcho: boolean = false;
    private static _Port: number = 1123;
    private static _ProxyHostname: string = '';
    private static _ProxyPort: number = 1123;
    private static _ProxyPortSecure: number = 11235;
    private static _ScreenColumns: number = 80;
    private static _ScreenRows: number = 25;
    private static _SplashScreen: string = 'G1swbRtbMkobWzA7MEgbWzE7NDQ7MzRt2sTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTEG1swOzQ0OzMwbb8bWzBtDQobWzE7NDQ7MzRtsyAgG1szN21XZWxjb21lISAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAbWzA7NDQ7MzBtsxtbMG0NChtbMTs0NDszNG3AG1swOzQ0OzMwbcTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTE2RtbMG0NCg0KG1sxbSAbWzBtIBtbMTs0NDszNG3axMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMQbWzA7NDQ7MzBtvxtbMG0NCiAgG1sxOzQ0OzM0bbMbWzA7MzRt29vb2xtbMzBt29vb29vb29vb29vb29vb29vb29vb2xtbMzRt29vb29vbG1s0NDszMG2zG1swbQ0KICAbWzE7NDQ7MzRtsxtbMDszNG3b29vbG1sxOzMwbdvb29vb29vb29vb29vb29vb29vb29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29vb2xtbMG3b29vb29vb29vb29sbWzFt29vb2xtbMzBt29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29vb2xtbMG3b29vb29vb29vbG1sxbdvb29sbWzBt29sbWzE7MzBt29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29vb2xtbMG3b29vb29vb2xtbMW3b29vbG1swbdvbG1sxbdvbG1szMG3b2xtbMDszMG3b2xtbMzRt29vb2xtbNDQ7MzBtsxtbMG0NCiAgG1sxOzQ0OzM0bbMbWzA7MzRt29vb2xtbMTszMG3b29vbG1swbdvb29vb2xtbMW3b29vbG1swbdvbG1sxbdvb29sbWzMwbdvbG1swOzMwbdvbG1szNG3b29vbG1s0NDszMG2zG1swbQ0KICAbWzE7NDQ7MzRtsxtbMDszNG3b29vbG1sxOzMwbdvb29sbWzBt29vb2xtbMW3b29vbG1swbdvbG1sxbdvb29vb2xtbMzBt29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzQwOzM3bQ0KICAbWzE7NDQ7MzRtsxtbMDszNG3b29vbG1sxOzMwbdvbG1swOzMwbdvbG1sxbdvb29vb29vb29vb29vb29vb2xtbMDszMG3b2xtbMzRt29vb2xtbNDQ7MzBtsxtbNDA7MzdtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29sbWzBt29vb29vb29vb29vb29vb29vb29sbWzMwbdvbG1szNG3b29vbG1s0NDszMG2zG1s0MDszN20NCiAgG1sxOzQ0OzM0bbMbWzA7MzBt29vb29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szNG3b2xtbNDQ7MzBtsxtbNDA7MzdtDQogIBtbMTs0NDszNG2zG1s0MDszMG3b2xtbMG3b29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szMG3b2xtbNDRtsxtbNDA7MzdtIBtbMzRtIBtbMTs0NzszN23axMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMQbWzMwbb8bWzBtDQogIBtbMTs0NDszNG2zG1swOzMwbdvbG1sxbdvb29vb29vb29vb29vb29sbWzA7MzBt29vb29vb29vb2xtbMW3b2xtbMDszMG3b2xtbNDRtsxtbNDA7MzdtIBtbMzRtIBtbMTs0NzszN22zICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAbWzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1s0MDszMG3b2xtbMG3b29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szMG3b2xtbNDRtsxtbMG0gG1szNG0gG1sxOzQ3OzM3bbMgICAbWzM0bUh0bWxUZXJtIC0tIFRlbG5ldCBmb3IgdGhlIFdlYiAgICAgG1szMG2zG1swbQ0KG1sxbSAbWzBtIBtbMTs0NDszNG2zG1swOzMwbdvbG1sxbdvb29vb29vb29vb29vb29vb29vb29vb2xtbMDszMG3b29vb29sbWzQ0bbMbWzBtIBtbMzRtIBtbMTs0NzszN22zICAgICAbWzA7NDc7MzRtV2ViIGJhc2VkIEJCUyB0ZXJtaW5hbCBjbGllbnQgICAgG1sxOzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvbG1szMG3b29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szNG3b2xtbNDQ7MzBtsxtbMG0gG1szNG0gG1sxOzQ3OzM3bbMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIBtbMzBtsxtbMG0NCiAgG1sxOzQ0OzM0bcAbWzA7NDQ7MzBtxMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTZG1swbSAbWzM0bSAbWzE7NDc7MzdtwBtbMzBtxMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTZG1swbQ0KDQobWzExQxtbMTszMm1Db3B5cmlnaHQgKEMpIDIwMDAtMjAxNCBSJk0gU29mdHdhcmUuICBBbGwgUmlnaHRzIFJlc2VydmVkDQobWzA7MzRtxMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExA==';

    public static Init(parentId: string): boolean {
        // Ensure we have our parent
        if (document.getElementById(parentId) === null) {
            alert('fTelnet Error: Element with id="' + parentId + '" was not found');
            return false;
        }
        this._Parent = document.getElementById(parentId);

        // Add init message
        this._InitMessageBar = document.createElement('div');
        this._InitMessageBar.id = 'fTelnetInitMessage';
        this._InitMessageBar.innerHTML = 'Initializing fTelnet...';
        this._Parent.appendChild(this._InitMessageBar);

        // IE less than 9.0 will throw script errors and not even load
        if (navigator.appName === 'Microsoft Internet Explorer') {
            var Version: number = -1;
            var RE: RegExp = new RegExp('MSIE ([0-9]{1,}[\\.0-9]{0,})');
            if (RE.exec(navigator.userAgent) !== null) { Version = parseFloat(RegExp.$1); }
            if (Version < 9.0) {
                this._InitMessageBar.innerHTML = 'fTelnet Error: Internet Explorer < 9 is not supported.<br /><br />Please upgrade to IE 9 or newer, or better still would be to use Firefox or Chrome instead of IE.';
                return false;
            }
        }

        // Create the focus bar (needs to be before crt so it appears above the client area)
        this._FocusWarningBar = document.createElement('div');
        this._FocusWarningBar.id = 'fTelnetFocusWarning';
        this._FocusWarningBar.innerHTML = '*** CLICK HERE TO GIVE fTelnet FOCUS ***';
        this._FocusWarningBar.style.display = 'none';
        this._Parent.appendChild(this._FocusWarningBar);

        // Seup the crt window
        if (Crt.Init(this._Parent)) {
            this._InitMessageBar.style.display = 'none';

            Crt.onfontchange.add((): void => { this.OnCrtScreenSizeChanged(); });
            Crt.onscreensizechange.add((): void => { this.OnCrtScreenSizeChanged(); });
            Crt.BareLFtoCRLF = this._BareLFtoCRLF;
            Crt.Blink = this._Blink;
            Crt.LocalEcho = this._LocalEcho;
            Crt.SetFont(this._CodePage);
            Crt.SetScreenSize(this._ScreenColumns, this._ScreenRows);

            // Test websocket support
            if (!('WebSocket' in window)) {
                Crt.WriteLn();
                Crt.WriteLn('Sorry, but your browser doesn\'t support the WebSocket protocol!');
                Crt.WriteLn();
                Crt.WriteLn('WebSockets are how fTelnet connects to the remote server, so without them that');
                Crt.WriteLn('means you won\'t be able to connect anywhere.');
                Crt.WriteLn();
                Crt.WriteLn('If you can, try upgrading your web browser.  If that\'s not an option (ie you\'re');
                Crt.WriteLn('already running the latest version your platform supports, like IE 8 on');
                Crt.WriteLn('Windows XP), then try switching to a different web browser.');
                Crt.WriteLn();
                Crt.WriteLn('Feel free to contact me (http://www.ftelnet.ca/contact/) if you think you\'re');
                Crt.WriteLn('seeing this message in error, and I\'ll look into it.  Be sure to let me know');
                Crt.WriteLn('what browser you use, as well as which version it is.');
                console.log('fTelnet Error: WebSocket not supported');
                return false;
            }

            // Create the ansi cursor position handler
            Ansi.onesc5n.add((): void => { this.OnAnsiESC5n(); });
            Ansi.onesc6n.add((): void => { this.OnAnsiESC6n(); });
            Ansi.onesc255n.add((): void => { this.OnAnsiESC255n(); });
            Ansi.onescQ.add((codePage: string): void => { this.OnAnsiESCQ(codePage); });

            // Create the style element
            this._StyleBlock = document.createElement('style');
            this._StyleBlock.type = 'text/css';
            this._StyleBlock.innerHTML = '#fTelnetFocusWarning { background-color: red; color: white; font: 16px "Courier New", Courier, monospace; margin: auto; padding: 5px 0; }' +
                '#fTelnetScrollback { background-color: red; color: white; font: 16px "Courier New", Courier, monospace; margin: auto; padding: 5px 0; } #fTelnetScrollback a { color: white; text-decoration: none; }' +
                '#fTelnetButtons { background-color: green; color: white; font: 16px "Courier New", Courier, monospace; margin: auto; padding: 5px 0; } #fTelnetButtons a { color: white; text-decoration: none; }' +
                '#fTelnetStatusBar { background-color: blue; color: white; font: 16px "Courier New", Courier, monospace; margin: auto; padding: 5px 0; }';
            this._Parent.appendChild(this._StyleBlock);

            // Create the scrollback bar
            this._ScrollbackBar = document.createElement('div');
            this._ScrollbackBar.id = 'fTelnetScrollback';
            this._ScrollbackBar.innerHTML = '<a href="#" onclick="fTelnet.ExitScrollback();">Exit</a> | ' +
                '<a href="#" onclick="Crt.PushKeyDown(Keyboard.PAGE_UP, Keyboard.PAGE_UP, false, false, false);">Page Up</a> | ' +
                '<a href="#" onclick="Crt.PushKeyDown(Keyboard.PAGE_DOWN, Keyboard.PAGE_DOWN, false, false, false);">Page Down</a> | ' +
                '<a href="#" onclick="Crt.PushKeyDown(Keyboard.UP, Keyboard.UP, false, false, false);">Line Up</a> | ' +
                '<a href="#" onclick="Crt.PushKeyDown(Keyboard.DOWN, Keyboard.DOWN, false, false, false);">Line Down</a>';
            this._ScrollbackBar.style.display = 'none';
            this._Parent.appendChild(this._ScrollbackBar);
            // TODO Also have a span to hold the current line number

            // Create the button bar
            this._ButtonBar = document.createElement('div');
            this._ButtonBar.id = 'fTelnetButtons';
            this._ButtonBar.innerHTML = '<a href="#" onclick="fTelnet.Connect();">Connect</a> | ' +
                '<a href="#" onclick="fTelnet.Disconnect();">Disconnect</a> | ' +
                '<a href="#" onclick="fTelnet.Download();">Download</a> | ' +
                '<a href="#" onclick="fTelnet.Upload();">Upload</a> | ' +
                '<a href="#" onclick="fTelnet.EnterScrollback();">Scrollback</a>';
            this._Parent.appendChild(this._ButtonBar);

            // Create the status bar
            this._StatusBar = document.createElement('div');
            this._StatusBar.id = 'fTelnetStatusBar';
            this._StatusBar.innerHTML = 'Not connected';
            this._Parent.appendChild(this._StatusBar);

            // Size the scrollback and button divs
            this.OnCrtScreenSizeChanged();

            Ansi.Write(atob(this._SplashScreen));
        } else {
            this._InitMessageBar.innerHTML = 'fTelnet Error: Unable to init Crt class';
            return false;
        }

        // Create our main timer
        this._Timer = setInterval((): void => { this.OnTimer(); }, 50);

        // Add our upload control
        var fTelnetUpload: HTMLInputElement = <HTMLInputElement>document.createElement('input');
        fTelnetUpload.type = 'file';
        fTelnetUpload.id = 'fTelnetUpload';
        fTelnetUpload.onchange = (): void => { this.OnUploadFileSelected(); };
        fTelnetUpload.style.display = 'none';
        this._Parent.appendChild(fTelnetUpload);

        return true;
    }

    public static get BareLFtoCRLF(): boolean {
        return this._BareLFtoCRLF;
    }

    public static set BareLFtoCRLF(value: boolean) {
        this._BareLFtoCRLF = value;
        Crt.BareLFtoCRLF = value;
    }

    public static get BitsPerSecond(): number {
        return this._BitsPerSecond;
    }

    public static set BitsPerSecond(value: number) {
        this._BitsPerSecond = value;
    }

    public static get Blink(): boolean {
        return this._Blink;
    }

    public static set Blink(value: boolean) {
        this._Blink = value;
    }

    public static get CodePage(): string {
        return this._CodePage;
    }

    public static set CodePage(value: string) {
        this._CodePage = value;
    }

    public static get ConnectionType(): string {
        return this._ConnectionType;
    }

    public static set ConnectionType(value: string) {
        this._ConnectionType = value;
    }

    public static Connect(): void {
        if ((this._Connection !== null) && (this._Connection.connected)) { return; }

        // Create new connection
        switch (this._ConnectionType) {
            // TODO case 'rlogin': this._Connection = new TRLoginConnection(); break;
            // TODO case 'tcp': this._Connection = new TTcpConnection(); break;
            default: this._Connection = new TelnetConnection(); break;
        }

        this._Connection.LocalEcho = this._LocalEcho;
        this._Connection.onclose.add((): void => { this.OnConnectionClose(); });
        this._Connection.onconnect.add((): void => { this.OnConnectionConnect(); });
        this._Connection.onlocalecho.add((value: boolean): void => { this.OnConnectionLocalEcho(value); });
        this._Connection.onioerror.add((): void => { this.OnConnectionIOError(); });
        this._Connection.onsecurityerror.add((): void => { this.OnConnectionSecurityError(); });

        // Reset display
        Crt.NormVideo();
        Crt.ClrScr();

        // Make connection
        if (this._ProxyHostname === '') {
            this._StatusBar.innerHTML = 'Connecting to ' + this._Hostname + ':' + this._Port;
            this._Connection.connect(this._Hostname, this._Port);
        } else {
            this._StatusBar.innerHTML = 'Connecting to ' + this._Hostname + ':' + this._Port + ' via proxy';
            this._Connection.connect(this._Hostname, this._Port, this._ProxyHostname, this._ProxyPort, this._ProxyPortSecure);
        }
    }

    public static get Connected(): boolean {
        if (this._Connection === null) { return false; }
        return this._Connection.connected;
    }

    public static Disconnect(): void {
        if (this._Connection === null) { return; }
        if (!this._Connection.connected) { return; }

        this._Connection.onclose.remove();
        this._Connection.onconnect.remove();
        this._Connection.onioerror.remove();
        this._Connection.onlocalecho.remove();
        this._Connection.onsecurityerror.remove();
        this._Connection.close();
        this._Connection = null;

        this.OnConnectionClose();
    }

    public static Download(): void {
        if (this._Connection === null) { return; }
        if (!this._Connection.connected) { return; }

        // Transfer the file
        this._YModemReceive = new YModemReceive(this._Connection);

        // Setup listeners for during transfer
        clearInterval(this._Timer);
        this._YModemReceive.ontransfercomplete.add((): void => { this.OnDownloadComplete(); });

        // Download the file
        this._YModemReceive.Download();
    }

    public static get Enter(): string {
        return this._Enter;
    }

    public static set Enter(value: string) {
        this._Enter = value;
    }

    public static EnterScrollback(): void {
        if (this._ScrollbackBar.style.display = 'none') {
            Crt.EnterScrollBack();
            this._ScrollbackBar.style.display = 'block';
        }
    }

    public static ExitScrollback(): void {
        if (this._ScrollbackBar.style.display = 'block') {
            Crt.PushKeyDown(Keyboard.ESCAPE, Keyboard.ESCAPE, false, false, false);
            this._ScrollbackBar.style.display = 'none';
        }
    }

    public static get Hostname(): string {
        return this._Hostname;
    }

    public static set Hostname(value: string) {
        this._Hostname = value;
    }

    public static get LocalEcho(): boolean {
        return this._LocalEcho;
    }

    public static set LocalEcho(value: boolean) {
        this._LocalEcho = value;

        Crt.LocalEcho = value;
        if ((this._Connection !== null) && (this._Connection.connected)) {
            this._Connection.LocalEcho = value;
        }
    }

    private static OnAnsiESC5n(): void {
        this._Connection.writeString('\x1B[0n');
    }

    private static OnAnsiESC6n(): void {
        this._Connection.writeString(Ansi.CursorPosition());
    }

    private static OnAnsiESC255n(): void {
        this._Connection.writeString(Ansi.CursorPosition(Crt.WindCols, Crt.WindRows));
    }

    private static OnAnsiESCQ(codePage: string): void {
        Crt.SetFont(codePage);
    }

    private static OnConnectionClose(): void {
        this._StatusBar.innerHTML = 'Disconnected from ' + this._Hostname + ':' + this._Port;
    }

    private static OnConnectionConnect(): void {
        Crt.ClrScr();

        if (this._ProxyHostname === '') {
            this._StatusBar.innerHTML = 'Connected to ' + this._Hostname + ':' + this._Port;
        } else {
            this._StatusBar.innerHTML = 'Connected to ' + this._Hostname + ':' + this._Port + ' via proxy';
        }
    }

    private static OnConnectionLocalEcho(value: boolean): void {
        this._LocalEcho = value;
        Crt.LocalEcho = value;
    }

    private static OnConnectionIOError(): void {
        console.log('fTelnet.OnConnectionIOError');
    }

    private static OnConnectionSecurityError(): void {
        if (this._ProxyHostname === '') {
            this._StatusBar.innerHTML = 'Unable to connect to ' + this._Hostname + ':' + this._Port;
        } else {
            this._StatusBar.innerHTML = 'Unable to connect to ' + this._Hostname + ':' + this._Port + ' via proxy';
        }
    }

    private static OnCrtScreenSizeChanged(): void {
        var NewWidth: string = Crt.ScreenCols * Crt.Font.Width + 'px';
        if (this._FocusWarningBar != null) { this._FocusWarningBar.style.width = NewWidth; }
        if (this._ButtonBar != null) { this._ButtonBar.style.width = NewWidth; }
        if (this._ScrollbackBar != null) { this._ScrollbackBar.style.width = NewWidth; }
        if (this._StatusBar != null) { this._StatusBar.style.width = NewWidth; }
    }

    private static OnDownloadComplete(): void {
        // Restart listeners for keyboard and connection data
        this._Timer = setInterval((): void => { this.OnTimer(); }, 50);
    }

    private static OnTimer(): void {
        if ((this._Connection !== null) && (this._Connection.connected)) {
            // Check for focus change
            if (document.hasFocus() && !this._HasFocus) {
                this._HasFocus = true;
                this._FocusWarningBar.style.display = 'none';
            } else if (!document.hasFocus() && this._HasFocus) {
                this._HasFocus = false;
                this._FocusWarningBar.style.display = 'block';
            }

            // Determine how long it took between frames
            var MSecElapsed: number = new Date().getTime() - this._LastTimer;
            if (MSecElapsed < 1) { MSecElapsed = 1; }

            // Determine how many bytes we need to read to achieve the requested BitsPerSecond rate
            var BytesToRead: number = Math.floor(this._BitsPerSecond / 8 / (1000 / MSecElapsed));
            if (BytesToRead < 1) { BytesToRead = 1; }

            // Read the number of bytes we want
            var Data: string = this._Connection.readString(BytesToRead);
            if (Data.length > 0) {
                Ansi.Write(Data);
            }

            while (Crt.KeyPressed()) {
                var KPE: KeyPressEvent = Crt.ReadKey();

                // Check for upload/download
                if (KPE !== null) {
                    if (KPE.keyString.length > 0) {
                        // Handle translating Enter key
                        if (KPE.keyString === '\r\n') {
                            this._Connection.writeString(this._Enter);
                        } else {
                            this._Connection.writeString(KPE.keyString);
                        }
                    }
                }
            }
        }
        this._LastTimer = new Date().getTime();
    }

    private static OnUploadComplete(): void {
        // Restart listeners for keyboard and connection data
        this._Timer = setInterval((): void => { this.OnTimer(); }, 50);
    }

    public static OnUploadFileSelected(): void {
        if (this._Connection === null) { return; }
        if (!this._Connection.connected) { return; }

        var fTelentUpload: HTMLInputElement = <HTMLInputElement>document.getElementById('fTelnetUpload');

        // Get the YModemSend class ready to go
        this._YModemSend = new YModemSend(this._Connection);

        // Setup the listeners
        clearInterval(this._Timer);
        this._YModemSend.ontransfercomplete.add((): void => { this.OnUploadComplete(); });

        // Loop through the FileList and prep them for upload
        for (var i: number = 0; i < fTelentUpload.files.length; i++) {
            this.UploadFile(fTelentUpload.files[i], fTelentUpload.files.length);
        }
    }

    public static get Port(): number {
        return this._Port;
    }

    public static set Port(value: number) {
        this._Port = value;
    }

    public static get ProxyHostname(): string {
        return this._ProxyHostname;
    }

    public static set ProxyHostname(value: string) {
        this._ProxyHostname = value;
    }

    public static get ProxyPort(): number {
        return this._ProxyPort;
    }

    public static set ProxyPort(value: number) {
        this._ProxyPort = value;
    }

    public static get ProxyPortSecure(): number {
        return this._ProxyPortSecure;
    }

    public static set ProxyPortSecure(value: number) {
        this._ProxyPortSecure = value;
    }

    public static get ScreenColumns(): number {
        return this._ScreenColumns;
    }

    public static set ScreenColumns(value: number) {
        this._ScreenColumns = value;
    }

    public static get ScreenRows(): number {
        return this._ScreenRows;
    }

    public static set ScreenRows(value: number) {
        this._ScreenRows = value;
    }

    public static get SplashScreen(): string {
        return this._SplashScreen;
    }

    public static set SplashScreen(value: string) {
        this._SplashScreen = value;
    }

    public static Upload(): void {
        document.getElementById('fTelnetUpload').click();
    }

    private static UploadFile(file: File, fileCount: number): void {
        var reader: FileReader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (): void => {
            var FR: FileRecord = new FileRecord(file.name, file.size);
            var Buffer: ArrayBuffer = reader.result;
            var Bytes: Uint8Array = new Uint8Array(Buffer);
            for (var i: number = 0; i < Bytes.length; i++) {
                FR.data.writeByte(Bytes[i]);
            }
            FR.data.position = 0;
            this._YModemSend.Upload(FR, fileCount);
        };

        // Read in the image file as a data URL.
        reader.readAsArrayBuffer(file);
    }
}
