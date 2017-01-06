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
class fTelnetClient {
    // Events
    public ondata: IMessageEvent = new TypedEvent();

    // Private variables
    private _Ansi: Ansi;
    private _ClientContainer: HTMLDivElement;
    private _ConnectButton: HTMLAnchorElement;
    private _Connection: WebSocketConnection;
    private _Crt: Crt;
    private _DataTimer: number;
    private _FocusWarningBar: HTMLDivElement;
    private _fTelnetContainer: HTMLElement;
    private _HasFocus: boolean = true;
    private _InitMessageBar: HTMLDivElement;
    private _LastTimer: number = 0;
    private _MenuButton: HTMLAnchorElement;
    private _MenuButtons: HTMLDivElement;
    private _RIP: RIP;
    private _ScrollbackBar: HTMLDivElement;
    private _StatusBar: HTMLDivElement;
    private _StatusBarLabel: HTMLSpanElement;
    private _Timer: number;
    private _UploadInput: HTMLInputElement;
    private _UseModernScrollback: boolean = false;
    private _VirtualKeyboard: VirtualKeyboard;
    private _YModemReceive: YModemReceive;
    private _YModemSend: YModemSend;

    // Settings the user can configure (Defaults are in fTelnetOptions class)
    private _Options: fTelnetOptions;

    constructor(containerId: string, options: fTelnetOptions) {
        // TODOX Canvas test (display error in div if missing support)
        // TODOX WebSocket test (display error in Crt if missing support)
        // TODOX Any other tests?

        if (typeof options === 'undefined') {
            var Message = 'fTelnet Error: The options parameter is required (pass in an fTelnetOptions object)';
            alert(Message);
            throw new Error(Message);
        } else {
            this._Options = options;

            // Handle options that need to do something pre-init
            if ((this._Options.Emulation === 'RIP') && (typeof RIP !== 'undefined')) {
                // RIP needs to force a specific font and screen size
                this._Options.Font = 'RIP_8x8';
                this._Options.ScreenRows = 43;
            } else {
                // Force ansi-bbs if they didn't ask for RIP (or if RIP is not enabled in this build)
                this._Options.Emulation = 'ansi-bbs';
            }
        }

        // Ensure we have our container
        if (typeof containerId === 'string') {
            var Container = document.getElementById(containerId);
            if (Container === null) {
                var Message = 'fTelnet Error: fTelnet constructor was passed an invalid container id';
                alert(Message);
                throw new Error(Message);
            } else {
                this._fTelnetContainer = Container;
            }
        } else {
            var Message = 'fTelnet Error: fTelnet constructor was passed an invalid container id';
            alert(Message);
            throw new Error(Message);
        }

        // Ensure the script tag includes the id we want
        if (document.getElementById('fTelnetScript') === null) {
            var Message = 'fTelnet Error: Script element with id="fTelnetScript" was not found';
            alert(Message);
            throw new Error(Message);
        }

        // Ensure we have tags for the client and keyboard css
        if (document.getElementById('fTelnetCss') === null) {
            var link = document.createElement('link');
            link.id = 'fTelnetCss';
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = StringUtils.GetUrl('ftelnet.css');
            document.getElementsByTagName('head')[0].appendChild(link);
        }
        if (document.getElementById('fTelnetKeyboardCss') === null) {
            var link = document.createElement('link');
            link.id = 'fTelnetKeyboardCss';
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = '';
            document.getElementsByTagName('head')[0].appendChild(link);
        }

        // Add init message
        this._InitMessageBar = document.createElement('div');
        this._InitMessageBar.className = 'fTelnetInitMessage';
        this._InitMessageBar.innerHTML = 'Initializing fTelnet...';
        this._fTelnetContainer.appendChild(this._InitMessageBar);

        // Create the client container (crt/graph)
        this._ClientContainer = document.createElement('div');
        this._ClientContainer.className = 'fTelnetClientContainer';
        this._fTelnetContainer.appendChild(this._ClientContainer);

        // Setup the client container for modern scrollback on desktop devices
        this._UseModernScrollback = (DetectMobileBrowser.SupportsModernScrollback && (this._Options.Emulation !== 'RIP'));
        if (this._UseModernScrollback) {
            this._ClientContainer.style.overflowX = 'hidden';
            this._ClientContainer.style.overflowY = 'scroll';
            this._ClientContainer.style.height = this._Options.ScreenRows * 16 + 'px'; // Default font is 9x16
            this._ClientContainer.style.width = (this._Options.ScreenColumns * 9) + GetScrollbarWidth.Width + 'px'; // Default font is 9x16
            this._ClientContainer.scrollTop = this._ClientContainer.scrollHeight;
        }

        // Seup the crt window
        this._Crt = new Crt(this._ClientContainer, this._UseModernScrollback);
        this._InitMessageBar.style.display = 'none';

        this._Crt.onfontchange.on((): void => { this.OnCrtScreenSizeChanged(); });
        this._Crt.onkeypressed.on((): void => { this.OnCrtKeyPressed(); });
        this._Crt.onscreensizechange.on((): void => { this.OnCrtScreenSizeChanged(); });
        this._Crt.BareLFtoCRLF = this._Options.BareLFtoCRLF;
        this._Crt.LocalEcho = this._Options.LocalEcho;
        this._Crt.SetFont(this._Options.Font);
        this._Crt.SetScreenSize(this._Options.ScreenColumns, this._Options.ScreenRows);

        // Create the ansi cursor position handler
        this._Ansi = new Ansi(this._Crt);
        this._Ansi.onesc5n.on((): void => { this.OnAnsiESC5n(); });
        this._Ansi.onesc6n.on((): void => { this.OnAnsiESC6n(); });
        this._Ansi.onesc255n.on((): void => { this.OnAnsiESC255n(); });
        this._Ansi.onescQ.on((font: string): void => { this.OnAnsiESCQ(font); });
        this._Ansi.onripdetect.on((): void => { this.OnAnsiRIPDetect(); });
        this._Ansi.onripdisable.on((): void => { this.OnAnsiRIPDisable(); });
        this._Ansi.onripenable.on((): void => { this.OnAnsiRIPEnable(); });

        // Setup the RIP/Graph window, if necessary
        if (this._Options.Emulation === 'RIP') {
            this._RIP = new RIP(this._Crt, this._Ansi, this._ClientContainer);
        }

        // Test websocket support
        if (!('WebSocket' in window) || navigator.userAgent.match('AppleWebKit/534.30')) {
            this._Crt.WriteLn();
            this._Crt.WriteLn('Sorry, but your browser doesn\'t support the WebSocket protocol!');
            this._Crt.WriteLn();
            this._Crt.WriteLn('WebSockets are how fTelnet connects to the remote server, so without them that');
            this._Crt.WriteLn('means you won\'t be able to connect anywhere.');
            this._Crt.WriteLn();
            this._Crt.WriteLn('If you can, try upgrading your web browser.  If that\'s not an option (ie you\'re');
            this._Crt.WriteLn('already running the latest version your platform supports, like IE 8 on');
            this._Crt.WriteLn('Windows XP), then try switching to a different web browser.');
            this._Crt.WriteLn();
            this._Crt.WriteLn('Feel free to contact me (http://www.ftelnet.ca/contact/) if you think you\'re');
            this._Crt.WriteLn('seeing this message in error, and I\'ll look into it.  Be sure to let me know');
            this._Crt.WriteLn('what browser you use, as well as which version it is.');
            console.log('fTelnet Error: WebSocket not supported');
            // TODOX return false;
        }

        // Create the focus bar
        this._FocusWarningBar = document.createElement('div');
        this._FocusWarningBar.className = 'fTelnetFocusWarning';
        this._FocusWarningBar.innerHTML = '*** CLICK HERE TO ENABLE KEYBOARD INPUT ***';
        this._FocusWarningBar.style.display = 'none';
        this._fTelnetContainer.appendChild(this._FocusWarningBar);

        // Create the scrollback bar
        this._ScrollbackBar = document.createElement('div');
        this._ScrollbackBar.className = 'fTelnetScrollback';
        if (this._UseModernScrollback) {
            this._ScrollbackBar.innerHTML = 'SCROLLBACK: Scroll back down to the bottom to exit scrollback mode';
        } else {
            var ScrollbackLabel: HTMLSpanElement = document.createElement('span');
            ScrollbackLabel.innerHTML = 'SCROLLBACK:';
            this._ScrollbackBar.appendChild(ScrollbackLabel);

            var ScrollbackLineUp: HTMLAnchorElement = document.createElement('a');
            ScrollbackLineUp.href = '#';
            ScrollbackLineUp.innerHTML = 'Line Up';
            ScrollbackLineUp.addEventListener('click', (e: MouseEvent): boolean => { this._Crt.PushKeyDown(Keyboard.UP, Keyboard.UP, false, false, false); e.preventDefault(); return false; });
            this._ScrollbackBar.appendChild(ScrollbackLineUp);

            var ScrollbackLineDown: HTMLAnchorElement = document.createElement('a');
            ScrollbackLineDown.href = '#';
            ScrollbackLineDown.innerHTML = 'Line Down';
            ScrollbackLineDown.addEventListener('click', (e: MouseEvent): boolean => { this._Crt.PushKeyDown(Keyboard.DOWN, Keyboard.DOWN, false, false, false); e.preventDefault(); return false; });
            this._ScrollbackBar.appendChild(ScrollbackLineDown);

            var ScrollbackPageUp: HTMLAnchorElement = document.createElement('a');
            ScrollbackPageUp.href = '#';
            ScrollbackPageUp.innerHTML = 'Page Up';
            ScrollbackPageUp.addEventListener('click', (e: MouseEvent): boolean => { this._Crt.PushKeyDown(Keyboard.PAGE_UP, Keyboard.PAGE_UP, false, false, false); e.preventDefault(); return false; });
            this._ScrollbackBar.appendChild(ScrollbackPageUp);

            var ScrollbackPageDown: HTMLAnchorElement = document.createElement('a');
            ScrollbackPageDown.href = '#';
            ScrollbackPageDown.innerHTML = 'Page Down';
            ScrollbackPageDown.addEventListener('click', (e: MouseEvent): boolean => { this._Crt.PushKeyDown(Keyboard.PAGE_DOWN, Keyboard.PAGE_DOWN, false, false, false); e.preventDefault(); return false; });
            this._ScrollbackBar.appendChild(ScrollbackPageDown);

            var ScrollbackExit: HTMLAnchorElement = document.createElement('a');
            ScrollbackExit.href = '#';
            ScrollbackExit.innerHTML = 'Exit';
            ScrollbackExit.addEventListener('click', (e: MouseEvent): boolean => { this.ExitScrollback(); e.preventDefault(); return false; });
            this._ScrollbackBar.appendChild(ScrollbackExit);
        }
        this._ScrollbackBar.style.display = 'none';
        this._fTelnetContainer.appendChild(this._ScrollbackBar);
        // TODO Also have a span to hold the current line number

        // Create the status bar
        this._StatusBar = document.createElement('div');
        this._StatusBar.className = 'fTelnetStatusBar';
        this._fTelnetContainer.appendChild(this._StatusBar);

        // Create the statusbar menu button
        this._MenuButton = document.createElement('a');
        this._MenuButton.className = 'fTelnetMenuButton';
        this._MenuButton.href = '#';
        this._MenuButton.innerHTML = 'Menu';
        this._MenuButton.addEventListener('click', (e: Event): boolean => { this.OnMenuButtonClick(); e.preventDefault(); return false; }, false);
        this._StatusBar.appendChild(this._MenuButton);

        // Create the statusbar connect button
        this._ConnectButton = document.createElement('a');
        this._ConnectButton.className = 'fTelnetConnectButton';
        this._ConnectButton.href = '#';
        this._ConnectButton.innerHTML = 'Connect';
        this._ConnectButton.addEventListener('click', (e: Event): boolean => { this.Connect(); e.preventDefault(); return false; }, false);
        this._StatusBar.appendChild(this._ConnectButton);

        // Create the statusbar label
        this._StatusBarLabel = document.createElement('span');
        this._StatusBarLabel.className = 'fTelnetStatusBarLabel';
        this._StatusBarLabel.innerHTML = 'Not connected';
        this._StatusBar.appendChild(this._StatusBarLabel);

        // Create the menu buttons
        this._MenuButtons = document.createElement('div');
        this._MenuButtons.className = 'fTelnetMenuButtons';
        var MenuButtonsTable: HTMLTableElement = document.createElement('table');

        var MenuButtonsRow1: HTMLTableRowElement = document.createElement('tr');
        var MenuButtonsRow1Cell1: HTMLTableCellElement = document.createElement('td');
        var MenuButtonsConnect: HTMLAnchorElement = document.createElement('a');
        MenuButtonsConnect.href = '#';
        MenuButtonsConnect.innerHTML = 'Connect';
        MenuButtonsConnect.addEventListener('click', (me: MouseEvent): boolean => { this.Connect(); me.preventDefault(); return false; });
        MenuButtonsRow1Cell1.appendChild(MenuButtonsConnect);
        MenuButtonsRow1.appendChild(MenuButtonsRow1Cell1);
        var MenuButtonsRow1Cell2: HTMLTableCellElement = document.createElement('td');
        var MenuButtonsDisconnect: HTMLAnchorElement = document.createElement('a');
        MenuButtonsDisconnect.href = '#';
        MenuButtonsDisconnect.innerHTML = 'Disconnect';
        MenuButtonsDisconnect.addEventListener('click', (me: MouseEvent): boolean => { this.Disconnect(true); me.preventDefault(); return false; });
        MenuButtonsRow1Cell2.appendChild(MenuButtonsDisconnect);
        MenuButtonsRow1.appendChild(MenuButtonsRow1Cell2);
        MenuButtonsTable.appendChild(MenuButtonsRow1);

        if (!DetectMobileBrowser.IsMobile) {
            var MenuButtonsRow2: HTMLTableRowElement = document.createElement('tr');
            var MenuButtonsRow2Cell1: HTMLTableCellElement = document.createElement('td');
            var MenuButtonsCopy: HTMLAnchorElement = document.createElement('a');
            MenuButtonsCopy.href = '#';
            MenuButtonsCopy.innerHTML = 'Copy';
            MenuButtonsCopy.addEventListener('click', (me: MouseEvent): boolean => { this.ClipboardCopy(); me.preventDefault(); return false; });
            MenuButtonsRow2Cell1.appendChild(MenuButtonsCopy);
            MenuButtonsRow2.appendChild(MenuButtonsRow2Cell1);
            var MenuButtonsRow2Cell2: HTMLTableCellElement = document.createElement('td');
            var MenuButtonsPaste: HTMLAnchorElement = document.createElement('a');
            MenuButtonsPaste.href = '#';
            MenuButtonsPaste.innerHTML = 'Paste';
            MenuButtonsPaste.addEventListener('click', (me: MouseEvent): boolean => { this.ClipboardPaste(); me.preventDefault(); return false; });
            MenuButtonsRow2Cell2.appendChild(MenuButtonsPaste);
            MenuButtonsRow2.appendChild(MenuButtonsRow2Cell2);
            MenuButtonsTable.appendChild(MenuButtonsRow2);
        }

        if ((typeof YModemReceive !== 'undefined') && (typeof YModemSend !== 'undefined')) {
            var MenuButtonsRow3: HTMLTableRowElement = document.createElement('tr');
            var MenuButtonsRow3Cell1: HTMLTableCellElement = document.createElement('td');
            var MenuButtonsUpload: HTMLAnchorElement = document.createElement('a');
            MenuButtonsUpload.href = '#';
            MenuButtonsUpload.innerHTML = 'Upload';
            MenuButtonsUpload.addEventListener('click', (me: MouseEvent): boolean => { this.Upload(); me.preventDefault(); return false; });
            MenuButtonsRow3Cell1.appendChild(MenuButtonsUpload);
            MenuButtonsRow3.appendChild(MenuButtonsRow3Cell1);
            var MenuButtonsRow3Cell2: HTMLTableCellElement = document.createElement('td');
            var MenuButtonsDownload: HTMLAnchorElement = document.createElement('a');
            MenuButtonsDownload.href = '#';
            MenuButtonsDownload.innerHTML = 'Download';
            MenuButtonsDownload.addEventListener('click', (me: MouseEvent): boolean => { this.Download(); me.preventDefault(); return false; });
            MenuButtonsRow3Cell2.appendChild(MenuButtonsDownload);
            MenuButtonsRow3.appendChild(MenuButtonsRow3Cell2);
            MenuButtonsTable.appendChild(MenuButtonsRow3);
        }

        var MenuButtonsRow4: HTMLTableRowElement = document.createElement('tr');
        var MenuButtonsRow4Cell1: HTMLTableCellElement = document.createElement('td');
        var MenuButtonsKeyboard: HTMLAnchorElement = document.createElement('a');
        MenuButtonsKeyboard.href = '#';
        MenuButtonsKeyboard.innerHTML = 'Keyboard';
        MenuButtonsKeyboard.addEventListener('click', (me: MouseEvent): boolean => { this.VirtualKeyboardVisible = !this.VirtualKeyboardVisible; me.preventDefault(); return false; });
        MenuButtonsRow4Cell1.appendChild(MenuButtonsKeyboard);
        MenuButtonsRow4.appendChild(MenuButtonsRow4Cell1);
        var MenuButtonsRow4Cell2: HTMLTableCellElement = document.createElement('td');
        var MenuButtonsFullScreen: HTMLAnchorElement = document.createElement('a');
        MenuButtonsFullScreen.href = '#';
        MenuButtonsFullScreen.innerHTML = 'Full&nbsp;Screen';
        MenuButtonsFullScreen.addEventListener('click', (me: MouseEvent): boolean => { this.FullScreenToggle(); me.preventDefault(); return false; });
        MenuButtonsRow4Cell2.appendChild(MenuButtonsFullScreen);
        MenuButtonsRow4.appendChild(MenuButtonsRow4Cell2);
        MenuButtonsTable.appendChild(MenuButtonsRow4);

        if (!this._UseModernScrollback) {
            var MenuButtonsRow5: HTMLTableRowElement = document.createElement('tr');
            var MenuButtonsRow5Cell1: HTMLTableCellElement = document.createElement('td');
            MenuButtonsRow5Cell1.colSpan = 2;
            var MenuButtonsScrollback: HTMLAnchorElement = document.createElement('a');
            MenuButtonsScrollback.href = '#';
            MenuButtonsScrollback.innerHTML = 'View Scrollback Buffer';
            MenuButtonsScrollback.addEventListener('click', (me: MouseEvent): boolean => { this.EnterScrollback(); me.preventDefault(); return false; });
            MenuButtonsRow5Cell1.appendChild(MenuButtonsScrollback);
            MenuButtonsRow5.appendChild(MenuButtonsRow5Cell1);
            MenuButtonsTable.appendChild(MenuButtonsRow5);
        }

        this._MenuButtons.appendChild(MenuButtonsTable);
        this._MenuButtons.style.display = 'none';
        this._MenuButtons.style.zIndex = '150';  // TODO Maybe a constant from another file to help keep zindexes correct for different elements?
        this._fTelnetContainer.appendChild(this._MenuButtons);

        // Create the virtual keyboard
        this._VirtualKeyboard = new VirtualKeyboard(this._Crt, this._fTelnetContainer);
        this._VirtualKeyboard.Visible = this._Options.VirtualKeyboardVisible;

        // Size the scrollback and button divs
        this.OnCrtScreenSizeChanged();

        if (this._Options.Emulation === 'RIP') {
            if (this._Options.SplashScreen === '') {
                // TODOX Need the base64 encoded RIP screen
                this._RIP.Parse(atob('G1swbRtbMkobWzA7MEgbWzE7NDQ7MzRt2sTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTEG1swOzQ0OzMwbb8bWzBtDQobWzE7NDQ7MzRtsyAgG1szN21XZWxjb21lISAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAbWzA7NDQ7MzBtsxtbMG0NChtbMTs0NDszNG3AG1swOzQ0OzMwbcTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTE2RtbMG0NCg0KG1sxbSAbWzBtIBtbMTs0NDszNG3axMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMQbWzA7NDQ7MzBtvxtbMG0NCiAgG1sxOzQ0OzM0bbMbWzA7MzRt29vb2xtbMzBt29vb29vb29vb29vb29vb29vb29vb2xtbMzRt29vb29vbG1s0NDszMG2zG1swbQ0KICAbWzE7NDQ7MzRtsxtbMDszNG3b29vbG1sxOzMwbdvb29vb29vb29vb29vb29vb29vb29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29vb2xtbMG3b29vb29vb29vb29sbWzFt29vb2xtbMzBt29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29vb2xtbMG3b29vb29vb29vbG1sxbdvb29sbWzBt29sbWzE7MzBt29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29vb2xtbMG3b29vb29vb2xtbMW3b29vbG1swbdvbG1sxbdvbG1szMG3b2xtbMDszMG3b2xtbMzRt29vb2xtbNDQ7MzBtsxtbMG0NCiAgG1sxOzQ0OzM0bbMbWzA7MzRt29vb2xtbMTszMG3b29vbG1swbdvb29vb2xtbMW3b29vbG1swbdvbG1sxbdvb29sbWzMwbdvbG1swOzMwbdvbG1szNG3b29vbG1s0NDszMG2zG1swbQ0KICAbWzE7NDQ7MzRtsxtbMDszNG3b29vbG1sxOzMwbdvb29sbWzBt29vb2xtbMW3b29vbG1swbdvbG1sxbdvb29vb2xtbMzBt29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzQwOzM3bQ0KICAbWzE7NDQ7MzRtsxtbMDszNG3b29vbG1sxOzMwbdvbG1swOzMwbdvbG1sxbdvb29vb29vb29vb29vb29vb2xtbMDszMG3b2xtbMzRt29vb2xtbNDQ7MzBtsxtbNDA7MzdtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29sbWzBt29vb29vb29vb29vb29vb29vb29sbWzMwbdvbG1szNG3b29vbG1s0NDszMG2zG1s0MDszN20NCiAgG1sxOzQ0OzM0bbMbWzA7MzBt29vb29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szNG3b2xtbNDQ7MzBtsxtbNDA7MzdtDQogIBtbMTs0NDszNG2zG1s0MDszMG3b2xtbMG3b29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szMG3b2xtbNDRtsxtbNDA7MzdtIBtbMzRtIBtbMTs0NzszN23axMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMQbWzMwbb8bWzBtDQogIBtbMTs0NDszNG2zG1swOzMwbdvbG1sxbdvb29vb29vb29vb29vb29sbWzA7MzBt29vb29vb29vb2xtbMW3b2xtbMDszMG3b2xtbNDRtsxtbNDA7MzdtIBtbMzRtIBtbMTs0NzszN22zICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAbWzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1s0MDszMG3b2xtbMG3b29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szMG3b2xtbNDRtsxtbMG0gG1szNG0gG1sxOzQ3OzM3bbMgICAbWzM0bWZUZWxuZXQgLS0gVGVsbmV0IGZvciB0aGUgV2ViICAgICAgG1szMG2zG1swbQ0KG1sxbSAbWzBtIBtbMTs0NDszNG2zG1swOzMwbdvbG1sxbdvb29vb29vb29vb29vb29vb29vb29vb2xtbMDszMG3b29vb29sbWzQ0bbMbWzBtIBtbMzRtIBtbMTs0NzszN22zICAgICAbWzA7NDc7MzRtV2ViIGJhc2VkIEJCUyB0ZXJtaW5hbCBjbGllbnQgICAgG1sxOzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvbG1szMG3b29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szNG3b2xtbNDQ7MzBtsxtbMG0gG1szNG0gG1sxOzQ3OzM3bbMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIBtbMzBtsxtbMG0NCiAgG1sxOzQ0OzM0bcAbWzA7NDQ7MzBtxMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTZG1swbSAbWzM0bSAbWzE7NDc7MzdtwBtbMzBtxMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTZG1swbQ0KDQobWzExQxtbMTszMm1Db3B5cmlnaHQgKEMpIDIwMDkt'));
                this._RIP.Parse(new Date().getFullYear().toString());
                this._RIP.Parse(atob('IFImTSBTb2Z0d2FyZS4gIEFsbCBSaWdodHMgUmVzZXJ2ZWQNChtbMDszNG3ExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTE'));
            } else {
                this._RIP.Parse(atob(this._Options.SplashScreen));
            }
        } else {
            if (this._Options.SplashScreen === '') {
                this._Ansi.Write(atob('G1swbRtbMkobWzA7MEgbWzE7NDQ7MzRt2sTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTEG1swOzQ0OzMwbb8bWzBtDQobWzE7NDQ7MzRtsyAgG1szN21XZWxjb21lISAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAbWzA7NDQ7MzBtsxtbMG0NChtbMTs0NDszNG3AG1swOzQ0OzMwbcTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTE2RtbMG0NCg0KG1sxbSAbWzBtIBtbMTs0NDszNG3axMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMQbWzA7NDQ7MzBtvxtbMG0NCiAgG1sxOzQ0OzM0bbMbWzA7MzRt29vb2xtbMzBt29vb29vb29vb29vb29vb29vb29vb2xtbMzRt29vb29vbG1s0NDszMG2zG1swbQ0KICAbWzE7NDQ7MzRtsxtbMDszNG3b29vbG1sxOzMwbdvb29vb29vb29vb29vb29vb29vb29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29vb2xtbMG3b29vb29vb29vb29sbWzFt29vb2xtbMzBt29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29vb2xtbMG3b29vb29vb29vbG1sxbdvb29sbWzBt29sbWzE7MzBt29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29vb2xtbMG3b29vb29vb2xtbMW3b29vbG1swbdvbG1sxbdvbG1szMG3b2xtbMDszMG3b2xtbMzRt29vb2xtbNDQ7MzBtsxtbMG0NCiAgG1sxOzQ0OzM0bbMbWzA7MzRt29vb2xtbMTszMG3b29vbG1swbdvb29vb2xtbMW3b29vbG1swbdvbG1sxbdvb29sbWzMwbdvbG1swOzMwbdvbG1szNG3b29vbG1s0NDszMG2zG1swbQ0KICAbWzE7NDQ7MzRtsxtbMDszNG3b29vbG1sxOzMwbdvb29sbWzBt29vb2xtbMW3b29vbG1swbdvbG1sxbdvb29vb2xtbMzBt29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzQwOzM3bQ0KICAbWzE7NDQ7MzRtsxtbMDszNG3b29vbG1sxOzMwbdvbG1swOzMwbdvbG1sxbdvb29vb29vb29vb29vb29vb2xtbMDszMG3b2xtbMzRt29vb2xtbNDQ7MzBtsxtbNDA7MzdtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29sbWzBt29vb29vb29vb29vb29vb29vb29sbWzMwbdvbG1szNG3b29vbG1s0NDszMG2zG1s0MDszN20NCiAgG1sxOzQ0OzM0bbMbWzA7MzBt29vb29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szNG3b2xtbNDQ7MzBtsxtbNDA7MzdtDQogIBtbMTs0NDszNG2zG1s0MDszMG3b2xtbMG3b29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szMG3b2xtbNDRtsxtbNDA7MzdtIBtbMzRtIBtbMTs0NzszN23axMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMQbWzMwbb8bWzBtDQogIBtbMTs0NDszNG2zG1swOzMwbdvbG1sxbdvb29vb29vb29vb29vb29sbWzA7MzBt29vb29vb29vb2xtbMW3b2xtbMDszMG3b2xtbNDRtsxtbNDA7MzdtIBtbMzRtIBtbMTs0NzszN22zICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAbWzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1s0MDszMG3b2xtbMG3b29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szMG3b2xtbNDRtsxtbMG0gG1szNG0gG1sxOzQ3OzM3bbMgICAbWzM0bWZUZWxuZXQgLS0gVGVsbmV0IGZvciB0aGUgV2ViICAgICAgG1szMG2zG1swbQ0KG1sxbSAbWzBtIBtbMTs0NDszNG2zG1swOzMwbdvbG1sxbdvb29vb29vb29vb29vb29vb29vb29vb2xtbMDszMG3b29vb29sbWzQ0bbMbWzBtIBtbMzRtIBtbMTs0NzszN22zICAgICAbWzA7NDc7MzRtV2ViIGJhc2VkIEJCUyB0ZXJtaW5hbCBjbGllbnQgICAgG1sxOzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvbG1szMG3b29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szNG3b2xtbNDQ7MzBtsxtbMG0gG1szNG0gG1sxOzQ3OzM3bbMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIBtbMzBtsxtbMG0NCiAgG1sxOzQ0OzM0bcAbWzA7NDQ7MzBtxMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTZG1swbSAbWzM0bSAbWzE7NDc7MzdtwBtbMzBtxMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTZG1swbQ0KDQobWzExQxtbMTszMm1Db3B5cmlnaHQgKEMpIDIwMDkt'));
                this._Ansi.Write(new Date().getFullYear().toString());
                this._Ansi.Write(atob('IFImTSBTb2Z0d2FyZS4gIEFsbCBSaWdodHMgUmVzZXJ2ZWQNChtbMDszNG3ExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTE'));
            } else {
                this._Ansi.Write(atob(this._Options.SplashScreen));
            }
        }

        // TODOX This used to be run when Crt.Init() failed.  Maybe have a fTelnet.Supported getter that handles all the validation of features
        // } else {
        //     this._InitMessageBar.innerHTML = 'fTelnet Error: Unable to init Crt class';
        //     if (typeof this._ScrollbackBar !== 'undefined') { this._ScrollbackBar.style.display = 'none'; }
        //     this._FocusWarningBar.style.display = 'none';
        //     // TODOX return false;
        // }

        // Create our main timer
        this._Timer = setInterval((): void => { this.OnTimer(); }, 250);

        // Add our upload control
        this._UploadInput = <HTMLInputElement>document.createElement('input');
        this._UploadInput.type = 'file';
        this._UploadInput.className = 'fTelnetUpload';
        this._UploadInput.onchange = (): void => { this.OnUploadFileSelected(); };
        this._UploadInput.style.display = 'none';
        this._fTelnetContainer.appendChild(this._UploadInput);

        // TODOX return true;
    }

    public ClipboardCopy(): void {
        // Hide the menu buttons (in case we clicked the Connect menu button)
        if (typeof this._MenuButtons !== 'undefined') { this._MenuButtons.style.display = 'none'; }

        alert('Click and drag your mouse over the text you want to copy');
    }

    public ClipboardPaste(): void {
        // Hide the menu buttons (in case we clicked the Connect menu button)
        if (typeof this._MenuButtons !== 'undefined') { this._MenuButtons.style.display = 'none'; }

        if (typeof this._Connection === 'undefined') { return; }
        if (!this._Connection.connected) { return; }

        var Text = Clipboard.GetData();
        for (var i = 0; i < Text.length; i++) {
            var B: number = Text.charCodeAt(i);
            if ((B === 13) || (B === 32)) {
                // Handle CR and space differently
                this._Crt.PushKeyDown(0, B, false, false, false);
            } else if ((B >= 33) && (B <= 126)) {
                // Handle normal key
                this._Crt.PushKeyPress(B, 0, false, false, false);
            }
        }
    }

    public Connect(): void {
        // Hide the menu buttons (in case we clicked the Connect menu button)
        if (typeof this._MenuButtons !== 'undefined') { this._MenuButtons.style.display = 'none'; }

        if ((typeof this._Connection !== 'undefined') && (this._Connection.connected)) { return; }

        // Create new connection
        switch (this._Options.ConnectionType) {
            case 'rlogin':
                this._Connection = new RLoginConnection();
                break;
            case 'tcp':
                this._Connection = new WebSocketConnection();
                break;
            default:
                this._Connection = new TelnetConnection(this._Crt);
                this._Connection.LocalEcho = this._Options.LocalEcho;
                this._Connection.onlocalecho.on((value: boolean): void => { this.OnConnectionLocalEcho(value); });
                break;
        }

        this._Connection.onclose.on((): void => { this.OnConnectionClose(); });
        this._Connection.onconnect.on((): void => { this.OnConnectionConnect(); });
        this._Connection.ondata.on((): void => { this.OnConnectionData(); });
        this._Connection.onioerror.on((): void => { this.OnConnectionIOError(); });
        this._Connection.onsecurityerror.on((): void => { this.OnConnectionSecurityError(); });

        // Reset display
        if (this._Options.Emulation === 'RIP') {
            this._RIP.ResetWindows();
        } else {
            this._Crt.NormVideo();
            this._Crt.ClrScr();
        }

        // Make connection
        if (this._Options.ProxyHostname === '') {
            this._ConnectButton.style.display = 'none';
            this._StatusBarLabel.innerHTML = 'Connecting to ' + this._Options.Hostname + ':' + this._Options.Port;
            this._StatusBar.style.backgroundColor = 'blue';
            this._ClientContainer.style.opacity = '1.0';
            this._Connection.connect(this._Options.Hostname, this._Options.Port, this._Options.WebSocketUrlPath, this._Options.ForceWss);
        } else {
            this._ConnectButton.style.display = 'none';
            this._StatusBarLabel.innerHTML = 'Connecting to ' + this._Options.Hostname + ':' + this._Options.Port + ' via ' + this._Options.ProxyHostname;
            this._StatusBar.style.backgroundColor = 'blue';
            this._ClientContainer.style.opacity = '1.0';
            this._Connection.connect(this._Options.Hostname, this._Options.Port, '', this._Options.ForceWss, this._Options.ProxyHostname, this._Options.ProxyPort, this._Options.ProxyPortSecure);
        }
    }

    public get Connected(): boolean {
        if (typeof this._Connection === 'undefined') { return false; }
        return this._Connection.connected;
    }

    public Disconnect(prompt: boolean): boolean {
        // Hide the menu buttons (in case we clicked the Connect menu button)
        if (typeof this._MenuButtons !== 'undefined') { this._MenuButtons.style.display = 'none'; }

        if (typeof this._Connection === 'undefined') { return true; }
        if (!this._Connection.connected) { return true; }

        if (!prompt || confirm('Are you sure you want to disconnect?')) {
            this._Connection.onclose.off();
            this._Connection.onconnect.off();
            this._Connection.ondata.off();
            this._Connection.onioerror.off();
            this._Connection.onlocalecho.off();
            this._Connection.onsecurityerror.off();
            this._Connection.close();
            delete this._Connection;

            this.OnConnectionClose();
            return true;
        }

        return false;
    }

    public Download(): void {
        // Hide the menu buttons (in case we clicked the Connect menu button)
        if (typeof this._MenuButtons !== 'undefined') { this._MenuButtons.style.display = 'none'; }

        if (typeof this._Connection === 'undefined') { return; }
        if (!this._Connection.connected) { return; }

        // Transfer the file
        this._YModemReceive = new YModemReceive(this._Crt, this._Connection);

        // Setup listeners for during transfer
        if (typeof this._Timer !== 'undefined') {
            clearInterval(this._Timer);
            delete this._Timer;
        }
        this._YModemReceive.ontransfercomplete.on((): void => { this.OnDownloadComplete(); });

        // Download the file
        this._YModemReceive.Download();
    }

    public EnterScrollback(): void {
        // Hide the menu buttons (in case we clicked the Connect menu button)
        if (typeof this._MenuButtons !== 'undefined') { this._MenuButtons.style.display = 'none'; }

        if (typeof this._ScrollbackBar !== 'undefined') {
            if (this._ScrollbackBar.style.display = 'none') {
                this._Crt.EnterScrollback();
                this._ScrollbackBar.style.display = 'block';
            }
        }
    }

    public ExitScrollback(): void {
        if (typeof this._ScrollbackBar !== 'undefined') {
            if (this._ScrollbackBar.style.display = 'block') {
                this._Crt.ExitScrollback();
                this._ScrollbackBar.style.display = 'none';
            }
        }
    }

    public FullScreenToggle(): void {
        // Hide the menu buttons (in case we clicked the Connect menu button)
        if (typeof this._MenuButtons !== 'undefined') { this._MenuButtons.style.display = 'none'; }

        if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
            if (this._fTelnetContainer.requestFullscreen) {
                this._fTelnetContainer.requestFullscreen();
            } else if (this._fTelnetContainer.msRequestFullscreen) {
                this._fTelnetContainer.msRequestFullscreen();
            } else if (this._fTelnetContainer.mozRequestFullScreen) {
                this._fTelnetContainer.mozRequestFullScreen();
            } else if (this._fTelnetContainer.webkitRequestFullscreen) {
                this._fTelnetContainer.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    }

    private OnAnsiESC5n(): void {
        if (typeof this._Connection === 'undefined') { return; }
        if (!this._Connection.connected) { return; }
        this._Connection.writeString('\x1B[0n');
    }

    private OnAnsiESC6n(): void {
        if (typeof this._Connection === 'undefined') { return; }
        if (!this._Connection.connected) { return; }
        this._Connection.writeString(this._Ansi.CursorPosition());
    }

    private OnAnsiESC255n(): void {
        if (typeof this._Connection === 'undefined') { return; }
        if (!this._Connection.connected) { return; }
        this._Connection.writeString(this._Ansi.CursorPosition(this._Crt.WindCols, this._Crt.WindRows));
    }

    private OnAnsiESCQ(font: string): void {
        if (this._Options.Emulation !== 'RIP') {
            this._Crt.SetFont(font);
        }
    }

    private OnAnsiRIPDetect(): void {
        if (this._Options.Emulation === 'RIP') {
            if (typeof this._Connection === 'undefined') { return; }
            if (!this._Connection.connected) { return; }
            this._Connection.writeString('RIPSCRIP015400');
        }
    }

    private OnAnsiRIPDisable(): void {
        // TODO RIP.DisableParsing();
    }

    private OnAnsiRIPEnable(): void {
        // TODO RIP.EnableParsing();
    }

    private OnConnectionClose(): void {
        this._ConnectButton.innerHTML = 'Reconnect';
        this._ConnectButton.style.display = 'inline';

        this._StatusBarLabel.innerHTML = 'Disconnected from ' + this._Options.Hostname + ':' + this._Options.Port;
        this._StatusBar.style.backgroundColor = 'red';
        this._ClientContainer.style.opacity = '0.5';
    }

    private OnConnectionConnect(): void {
        this._Crt.ClrScr();

        if (this._Options.ProxyHostname === '') {
            this._StatusBarLabel.innerHTML = 'Connected to ' + this._Options.Hostname + ':' + this._Options.Port;
            this._StatusBar.style.backgroundColor = 'blue';
            this._ClientContainer.style.opacity = '1.0';
        } else {
            this._StatusBarLabel.innerHTML = 'Connected to ' + this._Options.Hostname + ':' + this._Options.Port + ' via ' + this._Options.ProxyHostname;
            this._StatusBar.style.backgroundColor = 'blue';
            this._ClientContainer.style.opacity = '1.0';
        }

        if (this._Options.ConnectionType === 'rlogin') {
            var TerminalType: string = this._Options.RLoginTerminalType;
            if (TerminalType === '') {
                TerminalType = this._Options.Emulation + '/' + this._Options.BitsPerSecond;
            }

            if (typeof this._Connection === 'undefined') { return; }
            if (!this._Connection.connected) { return; }
            this._Connection.writeString(String.fromCharCode(0) + this._Options.RLoginClientUsername + String.fromCharCode(0) + this._Options.RLoginServerUsername + String.fromCharCode(0) + TerminalType + String.fromCharCode(0));
            this._Connection.flush();
        }

        // TODO If telnet, old fTelnet used to send will sga, wont linemode, and will/wont echo based on localecho
    }

    private OnConnectionData(): void {
        // If the timer is disabled then we're transferring data and don't want to process it here
        if (typeof this._Timer !== 'undefined') {
            if (typeof this._Connection !== 'undefined') {
                // Determine how long it took between frames
                var MSecElapsed: number = new Date().getTime() - this._LastTimer;
                if (MSecElapsed < 1) { MSecElapsed = 1; }

                // Determine how many bytes we need to read to achieve the requested BitsPerSecond rate
                var BytesToRead: number = Math.floor(this._Options.BitsPerSecond / 8 / (1000 / MSecElapsed));
                if (BytesToRead < 1) { BytesToRead = 1; }

                // Read the number of bytes we want
                var Data: string = this._Connection.readString(BytesToRead);
                if (Data.length > 0) {
                    this.ondata.trigger(Data);
                    if (this._Options.Emulation === 'RIP') {
                        this._RIP.Parse(Data);
                    } else {
                        this._Ansi.Write(Data);
                    }
                }

                // If we have data leftover, schedule a new timer
                if (this._Connection.bytesAvailable > 0) {
                    // Restart timer to handle the end of the screen
                    clearTimeout(this._DataTimer);
                    this._DataTimer = setTimeout((): void => { this.OnConnectionData(); }, 50);
                }
            }
        }
        this._LastTimer = new Date().getTime();
    }

    private OnConnectionLocalEcho(value: boolean): void {
        this._Options.LocalEcho = value;
        this._Crt.LocalEcho = value;
    }

    private OnConnectionIOError(): void {
        console.log('fTelnet.OnConnectionIOError');
    }

    private OnConnectionSecurityError(): void {
        this._ConnectButton.innerHTML = 'Retry Connection';
        this._ConnectButton.style.display = 'inline';

        if (this._Options.ProxyHostname === '') {
            this._StatusBarLabel.innerHTML = 'Unable to connect to ' + this._Options.Hostname + ':' + this._Options.Port;
            this._StatusBar.style.backgroundColor = 'red';
            this._ClientContainer.style.opacity = '0.5';
        } else {
            this._StatusBarLabel.innerHTML = 'Unable to connect to ' + this._Options.Hostname + ':' + this._Options.Port + ' via ' + this._Options.ProxyHostname;
            this._StatusBar.style.backgroundColor = 'red';
            this._ClientContainer.style.opacity = '0.5';
        }
    }

    private OnCrtKeyPressed(): void {
        // If the timer is active, then handle the keypress (if it's not active then we're uploading/downloading and don't want to interrupt its handling of keypresses)
        // TODO Maybe we should handle the CTRL-X to abort here instead of in the ymodem classes
        if (typeof this._Timer !== 'undefined') {
            while (this._Crt.KeyPressed()) {
                var KPE: KeyPressEvent | undefined = this._Crt.ReadKey();

                if (typeof KPE !== 'undefined') {
                    if (KPE.keyString.length > 0) {
                        if ((typeof this._Connection !== 'undefined') && (this._Connection.connected)) {
                            // Handle translating Enter key
                            if (KPE.keyString === '\r\n') {
                                this._Connection.writeString(this._Options.Enter);
                            } else {
                                this._Connection.writeString(KPE.keyString);
                            }
                        }
                    }
                }
            }
        }

    }

    private OnCrtScreenSizeChanged(): void {
        var NewWidth: number;
        var NewHeight: number;

        if (this._Options.Emulation === 'RIP') {
            NewWidth = 640;
        } else {
            if (this._UseModernScrollback) {
                // Non-mobile means modern scrollback, which needs both width and height to be set
                NewWidth = this._Crt.ScreenCols * this._Crt.Font.Width + GetScrollbarWidth.Width;
                NewHeight = this._Crt.ScreenRows * this._Crt.Font.Height;

                this._ClientContainer.style.width = NewWidth + 'px';
                this._ClientContainer.style.height = NewHeight + 'px';
                this._ClientContainer.scrollTop = this._ClientContainer.scrollHeight;
            } else {
                NewWidth = this._Crt.ScreenCols * this._Crt.Font.Width;
            }
        }

        // TODO -10 is 5px of left and right padding -- would be good if this wasn't hardcoded since it can be customized in the .css
        if (typeof this._FocusWarningBar !== 'undefined') { this._FocusWarningBar.style.width = NewWidth - 10 + 'px'; }
        if (typeof this._ScrollbackBar !== 'undefined') { this._ScrollbackBar.style.width = NewWidth - 10 + 'px'; }
        if (typeof this._StatusBar !== 'undefined') { this._StatusBar.style.width = NewWidth - 10 + 'px'; }

        // Pick virtual keyboard width
        if ((document.getElementById('fTelnetScript') !== null) && (document.getElementById('fTelnetKeyboardCss') !== null)) {
            var KeyboardSizes: number[] = [960, 800, 720, 640, 560, 480];
            for (var i: number = 0; i < KeyboardSizes.length; i++) {
                if ((NewWidth >= KeyboardSizes[i]) || (i === (KeyboardSizes.length - 1))) {
                    (<HTMLLinkElement>document.getElementById('fTelnetKeyboardCss')).href = StringUtils.GetUrl('keyboard/keyboard-' + KeyboardSizes[i].toString(10) + '.min.css');
                    break;
                }
            }
        }
    }

    private OnDownloadComplete(): void {
        // Restart listeners for keyboard and connection data
        this._Timer = setInterval((): void => { this.OnTimer(); }, 250);
    }

    private OnMenuButtonClick(): void {
        this._MenuButtons.style.display = (this._MenuButtons.style.display === 'none') ? 'block' : 'none';
        this._MenuButtons.style.left = Offset.getOffset(this._MenuButton).x + 'px';
        this._MenuButtons.style.top = Offset.getOffset(this._MenuButton).y - this._MenuButtons.clientHeight + 'px';
    }

    private OnTimer(): void {
        if ((typeof this._Connection !== 'undefined') && (this._Connection.connected)) {
            // Check for focus change
            if (document.hasFocus() && !this._HasFocus) {
                this._HasFocus = true;
                this._FocusWarningBar.style.display = 'none';
            } else if (!document.hasFocus() && this._HasFocus) {
                this._HasFocus = false;
                this._FocusWarningBar.style.display = 'block';
            }
        } else {
            if (this._FocusWarningBar.style.display === 'block') {
                this._FocusWarningBar.style.display = 'none';
            }
        }

        // Check for scrollback
        if (this._UseModernScrollback) {
            var ScrolledUp = (this._ClientContainer.scrollHeight - this._ClientContainer.scrollTop - this._ClientContainer.clientHeight > 1);
            if (ScrolledUp && (this._ScrollbackBar.style.display === 'none')) {
                this._ScrollbackBar.style.display = 'block';
            } else if (!ScrolledUp && (this._ScrollbackBar.style.display === 'block')) {
                this._ScrollbackBar.style.display = 'none';
            }
        }
    }

    private OnUploadComplete(): void {
        // Restart listeners for keyboard and connection data
        this._Timer = setInterval((): void => { this.OnTimer(); }, 250);
    }

    public OnUploadFileSelected(): void {
        if (typeof this._Connection === 'undefined') { return; }
        if (!this._Connection.connected) { return; }

        // Get the YModemSend class ready to go
        this._YModemSend = new YModemSend(this._Crt, this._Connection);

        // Setup the listeners
        if (typeof this._Timer !== 'undefined') {
            clearInterval(this._Timer);
            delete this._Timer;
        }
        this._YModemSend.ontransfercomplete.on((): void => { this.OnUploadComplete(); });

        // Loop through the FileList and prep them for upload
        if (this._UploadInput.files !== null) {
            for (var i: number = 0; i < this._UploadInput.files.length; i++) {
                this.UploadFile(this._UploadInput.files[i], this._UploadInput.files.length);
            }
        }
    }

    public StuffInputBuffer(text: string): void {
        for (var i: number = 0; i < text.length; i++) {
            this._Crt.PushKeyPress(text.charCodeAt(i), 0, false, false, false);
        }
    }

    public Upload(): void {
        // Hide the menu buttons (in case we clicked the Connect menu button)
        if (typeof this._MenuButtons !== 'undefined') { this._MenuButtons.style.display = 'none'; }

        if (typeof this._Connection === 'undefined') { return; }
        if (!this._Connection.connected) { return; }

        this._UploadInput.click();
    }

    private UploadFile(file: File, fileCount: number): void {
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

    // TODOX Ideally this would be in a ToggleVirtualKeyboard
    public get VirtualKeyboardVisible(): boolean {
        return this._Options.VirtualKeyboardVisible;
    }

    public set VirtualKeyboardVisible(value: boolean) {
        // Hide the menu buttons (in case we clicked the Connect menu button)
        if (typeof this._MenuButtons !== 'undefined') { this._MenuButtons.style.display = 'none'; }

        this._Options.VirtualKeyboardVisible = value;
        this._VirtualKeyboard.Visible = value;
    }
}
