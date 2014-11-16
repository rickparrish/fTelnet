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
    private static _Connection: WebSocketConnection;
    private static _LastTimer: number;
    private static _Parent: HTMLElement;
    private static _SaveFilesButton: SaveFilesButton;
    private static _Timer: number;
    private static _YModemReceive: YModemReceive;
    private static _YModemSend: YModemSend;

    // Settings to be loaded from HTML
    private static _BitsPerSecond: number = 115200;
    private static _Blink: boolean = true;
    private static _CodePage: string = '437';
    private static _ConnectionType: string = 'telnet';
    private static _Enter: string = '\r';
    private static _FontHeight: number = 16;
    private static _FontWidth: number = 9;
    private static _Hostname: string = 'bbs.ftelnet.ca';
    private static _Port: number = 1123;
    private static _ProxyHostname: string = '';
    private static _ProxyPort: number = 1123;
    private static _ProxyPortSecure: number = 11235;
    private static _ScreenColumns: number = 80;
    private static _ScreenRows: number = 25;
    private static _ServerName: string = 'fTelnet / GameSrv Support Server';
    private static _SplashScreen: string = 'G1swbRtbMkobWzA7MEgbWzE7NDQ7MzRt2sTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTEG1swOzQ0OzMwbb8bWzBtDQobWzE7NDQ7MzRtsyAgG1szN21XZWxjb21lISAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAbWzA7NDQ7MzBtsxtbMG0NChtbMTs0NDszNG3AG1swOzQ0OzMwbcTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTE2RtbMG0NCg0KG1sxbSAbWzBtIBtbMTs0NDszNG3axMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMQbWzA7NDQ7MzBtvxtbMG0NCiAgG1sxOzQ0OzM0bbMbWzA7MzRt29vb2xtbMzBt29vb29vb29vb29vb29vb29vb29vb2xtbMzRt29vb29vbG1s0NDszMG2zG1swbQ0KICAbWzE7NDQ7MzRtsxtbMDszNG3b29vbG1sxOzMwbdvb29vb29vb29vb29vb29vb29vb29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29vb2xtbMG3b29vb29vb29vb29sbWzFt29vb2xtbMzBt29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29vb2xtbMG3b29vb29vb29vbG1sxbdvb29sbWzBt29sbWzE7MzBt29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29vb2xtbMG3b29vb29vb2xtbMW3b29vbG1swbdvbG1sxbdvbG1szMG3b2xtbMDszMG3b2xtbMzRt29vb2xtbNDQ7MzBtsxtbMG0NCiAgG1sxOzQ0OzM0bbMbWzA7MzRt29vb2xtbMTszMG3b29vbG1swbdvb29vb2xtbMW3b29vbG1swbdvbG1sxbdvb29sbWzMwbdvbG1swOzMwbdvbG1szNG3b29vbG1s0NDszMG2zG1swbQ0KICAbWzE7NDQ7MzRtsxtbMDszNG3b29vbG1sxOzMwbdvb29sbWzBt29vb2xtbMW3b29vbG1swbdvbG1sxbdvb29vb2xtbMzBt29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzQwOzM3bQ0KICAbWzE7NDQ7MzRtsxtbMDszNG3b29vbG1sxOzMwbdvbG1swOzMwbdvbG1sxbdvb29vb29vb29vb29vb29vb2xtbMDszMG3b2xtbMzRt29vb2xtbNDQ7MzBtsxtbNDA7MzdtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29sbWzBt29vb29vb29vb29vb29vb29vb29sbWzMwbdvbG1szNG3b29vbG1s0NDszMG2zG1s0MDszN20NCiAgG1sxOzQ0OzM0bbMbWzA7MzBt29vb29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szNG3b2xtbNDQ7MzBtsxtbNDA7MzdtDQogIBtbMTs0NDszNG2zG1s0MDszMG3b2xtbMG3b29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szMG3b2xtbNDRtsxtbNDA7MzdtIBtbMzRtIBtbMTs0NzszN23axMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMQbWzMwbb8bWzBtDQogIBtbMTs0NDszNG2zG1swOzMwbdvbG1sxbdvb29vb29vb29vb29vb29sbWzA7MzBt29vb29vb29vb2xtbMW3b2xtbMDszMG3b2xtbNDRtsxtbNDA7MzdtIBtbMzRtIBtbMTs0NzszN22zICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAbWzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1s0MDszMG3b2xtbMG3b29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szMG3b2xtbNDRtsxtbMG0gG1szNG0gG1sxOzQ3OzM3bbMgICAbWzM0bUh0bWxUZXJtIC0tIFRlbG5ldCBmb3IgdGhlIFdlYiAgICAgG1szMG2zG1swbQ0KG1sxbSAbWzBtIBtbMTs0NDszNG2zG1swOzMwbdvbG1sxbdvb29vb29vb29vb29vb29vb29vb29vb2xtbMDszMG3b29vb29sbWzQ0bbMbWzBtIBtbMzRtIBtbMTs0NzszN22zICAgICAbWzA7NDc7MzRtV2ViIGJhc2VkIEJCUyB0ZXJtaW5hbCBjbGllbnQgICAgG1sxOzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvbG1szMG3b29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szNG3b2xtbNDQ7MzBtsxtbMG0gG1szNG0gG1sxOzQ3OzM3bbMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIBtbMzBtsxtbMG0NCiAgG1sxOzQ0OzM0bcAbWzA7NDQ7MzBtxMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTZG1swbSAbWzM0bSAbWzE7NDc7MzdtwBtbMzBtxMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTZG1swbQ0KDQobWzExQxtbMTszMm1Db3B5cmlnaHQgKEMpIDIwMDAtMjAxNCBSJk0gU29mdHdhcmUuICBBbGwgUmlnaHRzIFJlc2VydmVkDQobWzA7MzRtxMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExA==';
    private static _StatusBar: boolean = true;

    public static Init(parentId: string): boolean {
        this._Connection = null;
        this._LastTimer = 0;
        // this._Parent;
        // this._SaveFilesButton
        // this._Timer
        // this._YModemReceive
        // this._YModemSend

        // Ensure we have our parent
        if (document.getElementById(parentId) === null) {
            alert('fTelnet Error: Element with id="' + parentId + '" was not found');
            return false;
        }
        this._Parent = document.getElementById(parentId);

        // IE less than 9.0 will throw script errors and not even load
        if (navigator.appName === 'Microsoft Internet Explorer') {
            var Version: number = -1;
            var RE: RegExp = new RegExp('MSIE ([0-9]{1,}[\\.0-9]{0,})');
            if (RE.exec(navigator.userAgent) !== null) { Version = parseFloat(RegExp.$1); }
            if (Version < 9.0) {
                alert('fTelnet Error: Internet Explorer >= 10 is required.  Better still would be to use Firefox or Chrome instead of Internet Explorer.');
                return false;
            }
        }

        // Seup the crt window
        if (Crt.Init(this._Parent)) {
            Crt.Blink = this._Blink;
            Crt.SetFont(this._CodePage, this._FontWidth, this._FontHeight);
            Crt.SetScreenSize(this._ScreenColumns, this._ScreenRows);
            if (this._StatusBar) {
                Crt.Window(1, 1, this._ScreenColumns, this._ScreenRows - 1);
                this.UpdateStatusBar(' Not connected');
            }
            Crt.Canvas.addEventListener(Crt.SCREEN_SIZE_CHANGED, (): void => { this.OnCrtScreenSizeChanged(); }, false);

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

            // Create the Save Files button
            this._SaveFilesButton = new SaveFilesButton(this._Parent);

            // Create the ansi cursor position handler
            Ansi.onesc5n = (): void => { this.OnAnsiESC5n(); };
            Ansi.onesc6n = (): void => { this.OnAnsiESC6n(); };
            Ansi.onesc255n = (): void => { this.OnAnsiESC255n(); };
            Ansi.onescQ = (e: ESCQEvent): void => { this.OnAnsiESCQ(e); };

            Ansi.Write(atob(this._SplashScreen));
        } else {
            console.log('fTelnet Error: Unable to init Crt');
            return false;
        }

        // Create our main timer
        this._Timer = setInterval((): void => { this.OnTimer(); }, 50);

        return true;
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

        this._Connection.onclose = (): void => { this.OnConnectionClose(); };
        this._Connection.onconnect = (): void => { this.OnConnectionConnect(); };
        this._Connection.onioerror = (): void => { this.OnConnectionIOError(); };
        this._Connection.onsecurityerror = (): void => { this.OnConnectionSecurityError(); };

        // Reset display
        Crt.NormVideo();
        Crt.ClrScr();

        // Make connection
        if (this._ProxyHostname === '') {
            this.UpdateStatusBar(' Connecting to ' + this._Hostname + ':' + this._Port);
            this._Connection.connect(this._Hostname, this._Port);
        } else {
            this.UpdateStatusBar(' Connecting to ' + this._Hostname + ':' + this._Port + ' via proxy');
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

        this._Connection.onclose = function (): void {  }; // Do nothing
        this._Connection.onconnect = function (): void {  }; // Do nothing
        this._Connection.onioerror = function (): void {  }; // Do nothing
        this._Connection.onsecurityerror = function (): void {  }; // Do nothing
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
        this._YModemReceive.ontransfercomplete = (): void => { this.OnDownloadComplete(); };

        // Download the file
        this._YModemReceive.Download();
    }

    public static get Enter(): string {
        return this._Enter;
    }

    public static set Enter(value: string) {
        this._Enter = value;
    }

    public static get FontHeight(): number {
        return this._FontHeight;
    }

    public static set FontHeight(value: number) {
        this._FontHeight = value;
    }

    public static get FontWidth(): number {
        return this._FontWidth;
    }

    public static set FontWidth(value: number) {
        this._FontWidth = value;
    }

    public static get Hostname(): string {
        return this._Hostname;
    }

    public static set Hostname(value: string) {
        this._Hostname = value;
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

    private static OnAnsiESCQ(e: ESCQEvent): void {
        Crt.SetFont(e.CodePage, e.Width, e.Height);
    }

    private static OnConnectionClose(): void {
        // Remove save button (if visible)
        // this._SaveFilesButton.Image.removeEventListener('click', this.OnSaveFilesButtonClick, false);
        this._SaveFilesButton.Hide();

        this.UpdateStatusBar(' Disconnected from ' + this._Hostname + ':' + this._Port);
    }

    private static OnConnectionConnect(): void {
        Crt.ClrScr();

        if (this._ProxyHostname === '') {
            this.UpdateStatusBar(' Connected to ' + this._Hostname + ':' + this._Port);
        } else {
            this.UpdateStatusBar(' Connected to ' + this._Hostname + ':' + this._Port + ' via proxy');
        }
    }

    private static OnConnectionIOError(): void {
        console.log('fTelnet.OnConnectionIOError');
    }

    private static OnConnectionSecurityError(): void {
        if (this._ProxyHostname === '') {
            this.UpdateStatusBar(' Unable to connect to ' + this._Hostname + ':' + this._Port);
        } else {
            this.UpdateStatusBar(' Unable to connect to ' + this._Hostname + ':' + this._Port + ' via proxy');
        }
    }

    private static OnCrtScreenSizeChanged(): void {
        // TODO Redraw status bar
    }

    private static OnDownloadComplete(): void {
        // Restart listeners for keyboard and connection data
        this._Timer = setInterval((): void => { this.OnTimer(); }, 50);

        // Display the save button (if files were completed)
        if (this._YModemReceive.FileCount > 0) { this.ShowSaveFilesButton(); }
    }

    private static OnSaveFilesButtonClick(): void {
        if (this._YModemReceive === null) { return; }
        if (this._YModemReceive.FileCount === 0) { return; }

        var i: number;
        var j: number;
        var ByteString: string;
        var buffer: ArrayBuffer;
        var dataView: DataView;
        var myBlob: Blob;

        if (this._YModemReceive.FileCount === 1) {
            // If we have just one file, save it
            ByteString = this._YModemReceive.FileAt(0).data.toString();

            buffer = new ArrayBuffer(ByteString.length);
            dataView = new DataView(buffer);
            for (i = 0; i < ByteString.length; i++) {
                dataView.setUint8(i, ByteString.charCodeAt(i));
            }

            myBlob = new Blob([buffer], { type: 'application/octet-binary' });
            saveAs(myBlob, this._YModemReceive.FileAt(0).name);
        } else if (this._YModemReceive.FileCount > 1) {
            // More than one requires bundling in a TAR archive
            var TAR: ByteArray = new ByteArray();
            for (i = 0; i < this._YModemReceive.FileCount; i++) {
                // Create header
                var Header: ByteArray = new ByteArray();
                // File Name 100 bytes
                var FileName: string = this._YModemReceive.FileAt(i).name;
                for (j = 0; j < 100; j++) {
                    if (j < FileName.length) {
                        Header.writeByte(FileName.charCodeAt(j));
                    } else {
                        Header.writeByte(0);
                    }
                }
                // File Mode 8 bytes
                for (j = 0; j < 8; j++) { Header.writeByte(0); }
                // Owner's UserID 8 bytes
                for (j = 0; j < 8; j++) { Header.writeByte(0); }
                // Owner's GroupID 8 bytes
                for (j = 0; j < 8; j++) { Header.writeByte(0); }
                // File size in bytes with leading 0s 11 bytes plus 1 null
                var FileSize: string = this._YModemReceive.FileAt(i).data.length.toString(8);
                for (j = 0; j < 11 - FileSize.length; j++) { Header.writeByte('0'.charCodeAt(0)); }
                for (j = 0; j < FileSize.length; j++) { Header.writeByte(FileSize.charCodeAt(j)); }
                Header.writeByte(0);
                // Last modification time in numeric Unix time format 11 bytes plus 1 null 
                // (ASCII representation of the octal number of seconds since January 1, 1970, 00:00 UTC)
                for (j = 0; j < 11; j++) { Header.writeByte(0); }
                Header.writeByte(0);
                // Checksum for header block 8 bytes (spaces initially)
                for (j = 0; j < 8; j++) { Header.writeByte(32); }
                // Link indicator 1 byte
                Header.writeByte('0'.charCodeAt(0));
                // Name of linked file 100 bytes
                for (j = 0; j < 100; j++) { Header.writeByte(0); }
                // Reset of 512 byte header
                for (j = 0; j < 255; j++) { Header.writeByte(0); }

                // Calculate checksum (sum of unsigned bytes)
                Header.position = 0;
                var CheckSum: number = 0;
                for (j = 0; j < 512; j++) {
                    CheckSum += Header.readUnsignedByte();
                }

                // Write header up to checksum
                TAR.writeBytes(Header, 0, 148);

                // Write checksum (zero prefixed 6 digit octal number followed by NULL SPACE)
                var CheckSumStr: string = CheckSum.toString(8);
                for (j = 0; j < 6 - CheckSumStr.length; j++) { TAR.writeByte('0'.charCodeAt(0)); }
                for (j = 0; j < CheckSumStr.length; j++) { TAR.writeByte(CheckSumStr.charCodeAt(j)); }
                TAR.writeByte(0);
                TAR.writeByte(32);

                // Write header after hash
                TAR.writeBytes(Header, 156, 356);

                // Add file data
                TAR.writeBytes(this._YModemReceive.FileAt(i).data);

                // Add the padding if the file isn't a multiple of 512 bytes
                if (this._YModemReceive.FileAt(i).data.length % 512 !== 0) {
                    for (j = 0; j < 512 - (this._YModemReceive.FileAt(i).data.length % 512); j++) {
                        TAR.writeByte(0);
                    }
                }
            }

            // Add 2 zero filled blocks for end of archive
            for (i = 0; i < 1024; i++) {
                TAR.writeByte(0);
            }

            // Save the tar
            ByteString = TAR.toString();

            buffer = new ArrayBuffer(ByteString.length);
            dataView = new DataView(buffer);
            for (i = 0; i < ByteString.length; i++) {
                dataView.setUint8(i, ByteString.charCodeAt(i));
            }

            myBlob = new Blob([buffer], { type: 'application/octet-binary' });
            saveAs(myBlob, 'fTelnet-BatchDownload.tar');
        }

        // Remove button
        // this._SaveFilesButton.Image.removeEventListener('click', this.OnSaveFilesButtonClick, false);
        this._SaveFilesButton.Hide();

        // Reset display
        Crt.Canvas.style.opacity = '1';
    }

    private static OnTimer(): void {
        if ((this._Connection !== null) && (this._Connection.connected)) {
            // Determine how long it took between frames
            var MSecElapsed: number = new Date().getTime() - this._LastTimer;
            if (MSecElapsed < 1) { MSecElapsed = 1; }

            // Determine how many bytes we need to read to achieve the requested BitsPerSecond rate
            var BytesToRead: number = Math.floor(this._BitsPerSecond / 8 / (1000 / MSecElapsed));
            if (BytesToRead < 1) { BytesToRead = 1; }

            // Read the number of bytes we want
            var Data: string = this._Connection.readString(BytesToRead);
            if (Data.length > 0) {
                // if (DEBUG) console.log('fTelnet.OnTimer Data = ' + Data);
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

    public static get ServerName(): string {
        return this._ServerName;
    }

    public static set ServerName(value: string) {
        this._ServerName = value;
    }

    private static ShowSaveFilesButton(): void {
        Crt.Canvas.style.opacity = '0.4';

        this._SaveFilesButton.Image.addEventListener('click', (): void => { this.OnSaveFilesButtonClick(); }, false);
        this._SaveFilesButton.Show();
    }

    public static get SplashScreen(): string {
        return this._SplashScreen;
    }

    public static set SplashScreen(value: string) {
        this._SplashScreen = value;
    }

    public static get StatusBar(): boolean {
        return this._StatusBar;
    }

    public static set StatusBar(value: boolean) {
        this._StatusBar = value;
    }

    private static UpdateStatusBar(text: string): void {
        if (this._StatusBar) {
            while (text.length < this._ScreenColumns) {
                text += ' ';
            }
            Crt.FastWrite(text, 1, this._ScreenRows, new CharInfo(' ', 31), true);
        }
    }

    public static Upload(files: FileList): void {
        if (this._Connection === null) { return; }
        if (!this._Connection.connected) { return; }

        // Get the YModemSend class ready to go
        this._YModemSend = new YModemSend(this._Connection);

        // Setup the listeners
        clearInterval(this._Timer);
        this._YModemSend.ontransfercomplete = (): void => { this.OnUploadComplete(); };

        // Loop through the FileList and prep them for upload
        for (var i: number = 0; i < files.length; i++) {
            this.UploadFile(files[i], files.length);
        }
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
