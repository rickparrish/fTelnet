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
var fTelnet = (function () {
    function fTelnet() {
    }
    fTelnet.Init = function (parentId) {
        var _this = this;
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
            var Version = -1;
            var RE = new RegExp('MSIE ([0-9]{1,}[\\.0-9]{0,})');
            if (RE.exec(navigator.userAgent) !== null) {
                Version = parseFloat(RegExp.$1);
            }
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

            Crt.onfontchange.add(function () {
                _this.OnCrtScreenSizeChanged();
            });
            Crt.onscreensizechange.add(function () {
                _this.OnCrtScreenSizeChanged();
            });
            Crt.BareLFtoCRLF = this._BareLFtoCRLF;
            Crt.Blink = this._Blink;
            Crt.LocalEcho = this._LocalEcho;
            Crt.SetFont(this._CodePage, this._FontWidth, this._FontHeight);
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
            Ansi.onesc5n.add(function () {
                _this.OnAnsiESC5n();
            });
            Ansi.onesc6n.add(function () {
                _this.OnAnsiESC6n();
            });
            Ansi.onesc255n.add(function () {
                _this.OnAnsiESC255n();
            });
            Ansi.onescQ.add(function (codePage, width, height) {
                _this.OnAnsiESCQ(codePage, width, height);
            });

            // Create the style element
            this._StyleBlock = document.createElement('style');
            this._StyleBlock.type = "text/css";
            this._StyleBlock.innerHTML = '#fTelnetFocusWarning { background-color: red; color: white; font: 16px "Courier New", Courier, monospace; margin: auto; padding: 5px 0; }' + '#fTelnetScrollback { background-color: red; color: white; font: 16px "Courier New", Courier, monospace; margin: auto; padding: 5px 0; } #fTelnetScrollback a { color: white; text-decoration: none; }' + '#fTelnetButtons { background-color: green; color: white; font: 16px "Courier New", Courier, monospace; margin: auto; padding: 5px 0; } #fTelnetButtons a { color: white; text-decoration: none; }' + '#fTelnetStatusBar { background-color: blue; color: white; font: 16px "Courier New", Courier, monospace; margin: auto; padding: 5px 0; }';
            this._Parent.appendChild(this._StyleBlock);

            // Create the scrollback bar
            this._ScrollbackBar = document.createElement('div');
            this._ScrollbackBar.id = 'fTelnetScrollback';
            this._ScrollbackBar.innerHTML = '<a href="#" onclick="fTelnet.ExitScrollback();">Exit</a> | ' + '<a href="#" onclick="Crt.PushKeyDown(Keyboard.PAGE_UP, Keyboard.PAGE_UP, false, false, false);">Page Up</a> | ' + '<a href="#" onclick="Crt.PushKeyDown(Keyboard.PAGE_DOWN, Keyboard.PAGE_DOWN, false, false, false);">Page Down</a> | ' + '<a href="#" onclick="Crt.PushKeyDown(Keyboard.UP, Keyboard.UP, false, false, false);">Line Up</a> | ' + '<a href="#" onclick="Crt.PushKeyDown(Keyboard.DOWN, Keyboard.DOWN, false, false, false);">Line Down</a>';
            this._ScrollbackBar.style.display = 'none';
            this._Parent.appendChild(this._ScrollbackBar);

            // TODO Also have a span to hold the current line number
            // Create the button bar
            this._ButtonBar = document.createElement('div');
            this._ButtonBar.id = 'fTelnetButtons';
            this._ButtonBar.innerHTML = '<a href="#" onclick="fTelnet.Connect();">Connect</a> | ' + '<a href="#" onclick="fTelnet.Disconnect();">Disconnect</a> | ' + '<a href="#" onclick="fTelnet.Download();">Download</a> | ' + '<a href="#" onclick="fTelnet.Upload();">Upload</a> | ' + '<a href="#" onclick="fTelnet.EnterScrollback();">Scrollback</a>';
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
        this._Timer = setInterval(function () {
            _this.OnTimer();
        }, 50);

        // Add our upload control
        var fTelnetUpload = document.createElement('input');
        fTelnetUpload.type = 'file';
        fTelnetUpload.id = 'fTelnetUpload';
        fTelnetUpload.onchange = function () {
            _this.OnUploadFileSelected();
        };
        fTelnetUpload.style.display = 'none';
        this._Parent.appendChild(fTelnetUpload);

        return true;
    };

    Object.defineProperty(fTelnet, "BareLFtoCRLF", {
        get: function () {
            return this._BareLFtoCRLF;
        },
        set: function (value) {
            this._BareLFtoCRLF = value;
            Crt.BareLFtoCRLF = value;
        },
        enumerable: true,
        configurable: true
    });


    Object.defineProperty(fTelnet, "BitsPerSecond", {
        get: function () {
            return this._BitsPerSecond;
        },
        set: function (value) {
            this._BitsPerSecond = value;
        },
        enumerable: true,
        configurable: true
    });


    Object.defineProperty(fTelnet, "Blink", {
        get: function () {
            return this._Blink;
        },
        set: function (value) {
            this._Blink = value;
        },
        enumerable: true,
        configurable: true
    });


    Object.defineProperty(fTelnet, "CodePage", {
        get: function () {
            return this._CodePage;
        },
        set: function (value) {
            this._CodePage = value;
        },
        enumerable: true,
        configurable: true
    });


    Object.defineProperty(fTelnet, "ConnectionType", {
        get: function () {
            return this._ConnectionType;
        },
        set: function (value) {
            this._ConnectionType = value;
        },
        enumerable: true,
        configurable: true
    });


    fTelnet.Connect = function () {
        var _this = this;
        if ((this._Connection !== null) && (this._Connection.connected)) {
            return;
        }

        switch (this._ConnectionType) {
            default:
                this._Connection = new TelnetConnection();
                break;
        }

        this._Connection.LocalEcho = this._LocalEcho;
        this._Connection.onclose.add(function () {
            _this.OnConnectionClose();
        });
        this._Connection.onconnect.add(function () {
            _this.OnConnectionConnect();
        });
        this._Connection.onlocalecho.add(function (value) {
            _this.OnConnectionLocalEcho(value);
        });
        this._Connection.onioerror.add(function () {
            _this.OnConnectionIOError();
        });
        this._Connection.onsecurityerror.add(function () {
            _this.OnConnectionSecurityError();
        });

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
    };

    Object.defineProperty(fTelnet, "Connected", {
        get: function () {
            if (this._Connection === null) {
                return false;
            }
            return this._Connection.connected;
        },
        enumerable: true,
        configurable: true
    });

    fTelnet.Disconnect = function () {
        if (this._Connection === null) {
            return;
        }
        if (!this._Connection.connected) {
            return;
        }

        this._Connection.onclose.remove();
        this._Connection.onconnect.remove();
        this._Connection.onioerror.remove();
        this._Connection.onlocalecho.remove();
        this._Connection.onsecurityerror.remove();
        this._Connection.close();
        this._Connection = null;

        this.OnConnectionClose();
    };

    fTelnet.Download = function () {
        var _this = this;
        if (this._Connection === null) {
            return;
        }
        if (!this._Connection.connected) {
            return;
        }

        // Transfer the file
        this._YModemReceive = new YModemReceive(this._Connection);

        // Setup listeners for during transfer
        clearInterval(this._Timer);
        this._YModemReceive.ontransfercomplete.add(function () {
            _this.OnDownloadComplete();
        });

        // Download the file
        this._YModemReceive.Download();
    };

    Object.defineProperty(fTelnet, "Enter", {
        get: function () {
            return this._Enter;
        },
        set: function (value) {
            this._Enter = value;
        },
        enumerable: true,
        configurable: true
    });


    fTelnet.EnterScrollback = function () {
        if (this._ScrollbackBar.style.display = 'none') {
            Crt.EnterScrollBack();
            this._ScrollbackBar.style.display = 'block';
        }
    };

    fTelnet.ExitScrollback = function () {
        if (this._ScrollbackBar.style.display = 'block') {
            Crt.PushKeyDown(27 /* ESCAPE */, 27 /* ESCAPE */, false, false, false);
            this._ScrollbackBar.style.display = 'none';
        }
    };

    Object.defineProperty(fTelnet, "FontHeight", {
        get: function () {
            return this._FontHeight;
        },
        set: function (value) {
            this._FontHeight = value;
        },
        enumerable: true,
        configurable: true
    });


    Object.defineProperty(fTelnet, "FontWidth", {
        get: function () {
            return this._FontWidth;
        },
        set: function (value) {
            this._FontWidth = value;
        },
        enumerable: true,
        configurable: true
    });


    Object.defineProperty(fTelnet, "Hostname", {
        get: function () {
            return this._Hostname;
        },
        set: function (value) {
            this._Hostname = value;
        },
        enumerable: true,
        configurable: true
    });


    Object.defineProperty(fTelnet, "LocalEcho", {
        get: function () {
            return this._LocalEcho;
        },
        set: function (value) {
            this._LocalEcho = value;

            Crt.LocalEcho = value;
            if ((this._Connection !== null) && (this._Connection.connected)) {
                this._Connection.LocalEcho = value;
            }
        },
        enumerable: true,
        configurable: true
    });


    fTelnet.OnAnsiESC5n = function () {
        this._Connection.writeString('\x1B[0n');
    };

    fTelnet.OnAnsiESC6n = function () {
        this._Connection.writeString(Ansi.CursorPosition());
    };

    fTelnet.OnAnsiESC255n = function () {
        this._Connection.writeString(Ansi.CursorPosition(Crt.WindCols, Crt.WindRows));
    };

    fTelnet.OnAnsiESCQ = function (codePage, width, height) {
        Crt.SetFont(codePage, width, height);
    };

    fTelnet.OnConnectionClose = function () {
        this._StatusBar.innerHTML = 'Disconnected from ' + this._Hostname + ':' + this._Port;
    };

    fTelnet.OnConnectionConnect = function () {
        Crt.ClrScr();

        if (this._ProxyHostname === '') {
            this._StatusBar.innerHTML = 'Connected to ' + this._Hostname + ':' + this._Port;
        } else {
            this._StatusBar.innerHTML = 'Connected to ' + this._Hostname + ':' + this._Port + ' via proxy';
        }
    };

    fTelnet.OnConnectionLocalEcho = function (value) {
        this._LocalEcho = value;
        Crt.LocalEcho = value;
    };

    fTelnet.OnConnectionIOError = function () {
        console.log('fTelnet.OnConnectionIOError');
    };

    fTelnet.OnConnectionSecurityError = function () {
        if (this._ProxyHostname === '') {
            this._StatusBar.innerHTML = 'Unable to connect to ' + this._Hostname + ':' + this._Port;
        } else {
            this._StatusBar.innerHTML = 'Unable to connect to ' + this._Hostname + ':' + this._Port + ' via proxy';
        }
    };

    fTelnet.OnCrtScreenSizeChanged = function () {
        var NewWidth = Crt.ScreenCols * Crt.Font.Width + 'px';
        if (this._FocusWarningBar != null) {
            this._FocusWarningBar.style.width = NewWidth;
        }
        if (this._ButtonBar != null) {
            this._ButtonBar.style.width = NewWidth;
        }
        if (this._ScrollbackBar != null) {
            this._ScrollbackBar.style.width = NewWidth;
        }
        if (this._StatusBar != null) {
            this._StatusBar.style.width = NewWidth;
        }
    };

    fTelnet.OnDownloadComplete = function () {
        var _this = this;
        // Restart listeners for keyboard and connection data
        this._Timer = setInterval(function () {
            _this.OnTimer();
        }, 50);
    };

    fTelnet.OnTimer = function () {
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
            var MSecElapsed = new Date().getTime() - this._LastTimer;
            if (MSecElapsed < 1) {
                MSecElapsed = 1;
            }

            // Determine how many bytes we need to read to achieve the requested BitsPerSecond rate
            var BytesToRead = Math.floor(this._BitsPerSecond / 8 / (1000 / MSecElapsed));
            if (BytesToRead < 1) {
                BytesToRead = 1;
            }

            // Read the number of bytes we want
            var Data = this._Connection.readString(BytesToRead);
            if (Data.length > 0) {
                Ansi.Write(Data);
            }

            while (Crt.KeyPressed()) {
                var KPE = Crt.ReadKey();

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
    };

    fTelnet.OnUploadComplete = function () {
        var _this = this;
        // Restart listeners for keyboard and connection data
        this._Timer = setInterval(function () {
            _this.OnTimer();
        }, 50);
    };

    fTelnet.OnUploadFileSelected = function () {
        var _this = this;
        if (this._Connection === null) {
            return;
        }
        if (!this._Connection.connected) {
            return;
        }

        var fTelentUpload = document.getElementById('fTelnetUpload');

        // Get the YModemSend class ready to go
        this._YModemSend = new YModemSend(this._Connection);

        // Setup the listeners
        clearInterval(this._Timer);
        this._YModemSend.ontransfercomplete.add(function () {
            _this.OnUploadComplete();
        });

        for (var i = 0; i < fTelentUpload.files.length; i++) {
            this.UploadFile(fTelentUpload.files[i], fTelentUpload.files.length);
        }
    };

    Object.defineProperty(fTelnet, "Port", {
        get: function () {
            return this._Port;
        },
        set: function (value) {
            this._Port = value;
        },
        enumerable: true,
        configurable: true
    });


    Object.defineProperty(fTelnet, "ProxyHostname", {
        get: function () {
            return this._ProxyHostname;
        },
        set: function (value) {
            this._ProxyHostname = value;
        },
        enumerable: true,
        configurable: true
    });


    Object.defineProperty(fTelnet, "ProxyPort", {
        get: function () {
            return this._ProxyPort;
        },
        set: function (value) {
            this._ProxyPort = value;
        },
        enumerable: true,
        configurable: true
    });


    Object.defineProperty(fTelnet, "ProxyPortSecure", {
        get: function () {
            return this._ProxyPortSecure;
        },
        set: function (value) {
            this._ProxyPortSecure = value;
        },
        enumerable: true,
        configurable: true
    });


    Object.defineProperty(fTelnet, "ScreenColumns", {
        get: function () {
            return this._ScreenColumns;
        },
        set: function (value) {
            this._ScreenColumns = value;
        },
        enumerable: true,
        configurable: true
    });


    Object.defineProperty(fTelnet, "ScreenRows", {
        get: function () {
            return this._ScreenRows;
        },
        set: function (value) {
            this._ScreenRows = value;
        },
        enumerable: true,
        configurable: true
    });


    Object.defineProperty(fTelnet, "SplashScreen", {
        get: function () {
            return this._SplashScreen;
        },
        set: function (value) {
            this._SplashScreen = value;
        },
        enumerable: true,
        configurable: true
    });


    fTelnet.Upload = function () {
        document.getElementById('fTelnetUpload').click();
    };

    fTelnet.UploadFile = function (file, fileCount) {
        var _this = this;
        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = function () {
            var FR = new FileRecord(file.name, file.size);
            var Buffer = reader.result;
            var Bytes = new Uint8Array(Buffer);
            for (var i = 0; i < Bytes.length; i++) {
                FR.data.writeByte(Bytes[i]);
            }
            FR.data.position = 0;
            _this._YModemSend.Upload(FR, fileCount);
        };

        // Read in the image file as a data URL.
        reader.readAsArrayBuffer(file);
    };
    fTelnet._ButtonBar = null;
    fTelnet._Connection = null;
    fTelnet._FocusWarningBar = null;
    fTelnet._HasFocus = true;
    fTelnet._InitMessageBar = null;
    fTelnet._LastTimer = 0;
    fTelnet._Parent = null;
    fTelnet._ScrollbackBar = null;
    fTelnet._StatusBar = null;
    fTelnet._StyleBlock = null;
    fTelnet._Timer = null;
    fTelnet._YModemReceive = null;
    fTelnet._YModemSend = null;

    fTelnet._BareLFtoCRLF = false;
    fTelnet._BitsPerSecond = 57600;
    fTelnet._Blink = true;
    fTelnet._CodePage = '437';
    fTelnet._ConnectionType = 'telnet';
    fTelnet._Enter = '\r';
    fTelnet._FontHeight = 16;
    fTelnet._FontWidth = 9;
    fTelnet._Hostname = 'bbs.ftelnet.ca';
    fTelnet._LocalEcho = false;
    fTelnet._Port = 1123;
    fTelnet._ProxyHostname = '';
    fTelnet._ProxyPort = 1123;
    fTelnet._ProxyPortSecure = 11235;
    fTelnet._ScreenColumns = 80;
    fTelnet._ScreenRows = 25;
    fTelnet._SplashScreen = 'G1swbRtbMkobWzA7MEgbWzE7NDQ7MzRt2sTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTEG1swOzQ0OzMwbb8bWzBtDQobWzE7NDQ7MzRtsyAgG1szN21XZWxjb21lISAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAbWzA7NDQ7MzBtsxtbMG0NChtbMTs0NDszNG3AG1swOzQ0OzMwbcTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTE2RtbMG0NCg0KG1sxbSAbWzBtIBtbMTs0NDszNG3axMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMQbWzA7NDQ7MzBtvxtbMG0NCiAgG1sxOzQ0OzM0bbMbWzA7MzRt29vb2xtbMzBt29vb29vb29vb29vb29vb29vb29vb2xtbMzRt29vb29vbG1s0NDszMG2zG1swbQ0KICAbWzE7NDQ7MzRtsxtbMDszNG3b29vbG1sxOzMwbdvb29vb29vb29vb29vb29vb29vb29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29vb2xtbMG3b29vb29vb29vb29sbWzFt29vb2xtbMzBt29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29vb2xtbMG3b29vb29vb29vbG1sxbdvb29sbWzBt29sbWzE7MzBt29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29vb2xtbMG3b29vb29vb2xtbMW3b29vbG1swbdvbG1sxbdvbG1szMG3b2xtbMDszMG3b2xtbMzRt29vb2xtbNDQ7MzBtsxtbMG0NCiAgG1sxOzQ0OzM0bbMbWzA7MzRt29vb2xtbMTszMG3b29vbG1swbdvb29vb2xtbMW3b29vbG1swbdvbG1sxbdvb29sbWzMwbdvbG1swOzMwbdvbG1szNG3b29vbG1s0NDszMG2zG1swbQ0KICAbWzE7NDQ7MzRtsxtbMDszNG3b29vbG1sxOzMwbdvb29sbWzBt29vb2xtbMW3b29vbG1swbdvbG1sxbdvb29vb2xtbMzBt29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzQwOzM3bQ0KICAbWzE7NDQ7MzRtsxtbMDszNG3b29vbG1sxOzMwbdvbG1swOzMwbdvbG1sxbdvb29vb29vb29vb29vb29vb2xtbMDszMG3b2xtbMzRt29vb2xtbNDQ7MzBtsxtbNDA7MzdtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29sbWzBt29vb29vb29vb29vb29vb29vb29sbWzMwbdvbG1szNG3b29vbG1s0NDszMG2zG1s0MDszN20NCiAgG1sxOzQ0OzM0bbMbWzA7MzBt29vb29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szNG3b2xtbNDQ7MzBtsxtbNDA7MzdtDQogIBtbMTs0NDszNG2zG1s0MDszMG3b2xtbMG3b29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szMG3b2xtbNDRtsxtbNDA7MzdtIBtbMzRtIBtbMTs0NzszN23axMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMQbWzMwbb8bWzBtDQogIBtbMTs0NDszNG2zG1swOzMwbdvbG1sxbdvb29vb29vb29vb29vb29sbWzA7MzBt29vb29vb29vb2xtbMW3b2xtbMDszMG3b2xtbNDRtsxtbNDA7MzdtIBtbMzRtIBtbMTs0NzszN22zICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAbWzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1s0MDszMG3b2xtbMG3b29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szMG3b2xtbNDRtsxtbMG0gG1szNG0gG1sxOzQ3OzM3bbMgICAbWzM0bUh0bWxUZXJtIC0tIFRlbG5ldCBmb3IgdGhlIFdlYiAgICAgG1szMG2zG1swbQ0KG1sxbSAbWzBtIBtbMTs0NDszNG2zG1swOzMwbdvbG1sxbdvb29vb29vb29vb29vb29vb29vb29vb2xtbMDszMG3b29vb29sbWzQ0bbMbWzBtIBtbMzRtIBtbMTs0NzszN22zICAgICAbWzA7NDc7MzRtV2ViIGJhc2VkIEJCUyB0ZXJtaW5hbCBjbGllbnQgICAgG1sxOzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvbG1szMG3b29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szNG3b2xtbNDQ7MzBtsxtbMG0gG1szNG0gG1sxOzQ3OzM3bbMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIBtbMzBtsxtbMG0NCiAgG1sxOzQ0OzM0bcAbWzA7NDQ7MzBtxMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTZG1swbSAbWzM0bSAbWzE7NDc7MzdtwBtbMzBtxMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTZG1swbQ0KDQobWzExQxtbMTszMm1Db3B5cmlnaHQgKEMpIDIwMDAtMjAxNCBSJk0gU29mdHdhcmUuICBBbGwgUmlnaHRzIFJlc2VydmVkDQobWzA7MzRtxMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExA==';
    return fTelnet;
})();
/// <reference path='source/fTelnet.ts' />
// TODO List:
// If an invalid font is specified, the default 437x9x16 should be used
// Incorporate Blob.js and FileSaver.js (and any other 3rd party .js) into ftelnet.js
// Add virtual keyboard and button bar button to toggle
// Add button to toggle full screen
// Handle auto-sizing
// SyncTerm font-switching support
// From: Unknown, forgot to save the url!
// Base64 utility methods
// Needed for: IE9-
(function () {
    if ('atob' in window && 'btoa' in window) {
        return;
    }

    var B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    function atob(input) {
        input = String(input);
        var position = 0, output = [], buffer = 0, bits = 0, n;
        input = input.replace(/\s/g, '');
        if ((input.length % 4) === 0) {
            input = input.replace(/=+$/, '');
        }
        if ((input.length % 4) === 1) {
            throw Error('InvalidCharacterError');
        }
        if (/[^+/0-9A-Za-z]/.test(input)) {
            throw Error('InvalidCharacterError');
        }
        while (position < input.length) {
            n = B64_ALPHABET.indexOf(input.charAt(position));
            buffer = (buffer << 6) | n;
            bits += 6;
            if (bits === 24) {
                output.push(String.fromCharCode((buffer >> 16) & 0xFF));
                output.push(String.fromCharCode((buffer >> 8) & 0xFF));
                output.push(String.fromCharCode(buffer & 0xFF));
                bits = 0;
                buffer = 0;
            }
            position += 1;
        }
        if (bits === 12) {
            buffer = buffer >> 4;
            output.push(String.fromCharCode(buffer & 0xFF));
        } else if (bits === 18) {
            buffer = buffer >> 2;
            output.push(String.fromCharCode((buffer >> 8) & 0xFF));
            output.push(String.fromCharCode(buffer & 0xFF));
        }
        return output.join('');
    }
    ;
    function btoa(input) {
        input = String(input);
        var position = 0, out = [], o1, o2, o3, e1, e2, e3, e4;
        if (/[^\x00-\xFF]/.test(input)) {
            throw Error('InvalidCharacterError');
        }
        while (position < input.length) {
            o1 = input.charCodeAt(position++);
            o2 = input.charCodeAt(position++);
            o3 = input.charCodeAt(position++);

            // 111111 112222 222233 333333
            e1 = o1 >> 2;
            e2 = ((o1 & 0x3) << 4) | (o2 >> 4);
            e3 = ((o2 & 0xf) << 2) | (o3 >> 6);
            e4 = o3 & 0x3f;
            if (position === input.length + 2) {
                e3 = 64;
                e4 = 64;
            } else if (position === input.length + 1) {
                e4 = 64;
            }
            out.push(B64_ALPHABET.charAt(e1), B64_ALPHABET.charAt(e2), B64_ALPHABET.charAt(e3), B64_ALPHABET.charAt(e4));
        }
        return out.join('');
    }
    ;
    window.atob = atob;
    window.btoa = btoa;
}());
// From: http://javascript.info/tutorial/coordinates
var Offset;
(function (Offset) {
    'use strict';
    function getOffsetSum(elem) {
        var top = 0, left = 0;

        while (elem) {
            top = top + elem.offsetTop;
            left = left + elem.offsetLeft;
            elem = elem.offsetParent;
        }

        return { y: top, x: left };
    }

    function getOffsetRect(elem) {
        var box = elem.getBoundingClientRect();

        var body = document.body;
        var docElem = document.documentElement;

        var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
        var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;

        var clientTop = docElem.clientTop || body.clientTop || 0;
        var clientLeft = docElem.clientLeft || body.clientLeft || 0;

        var top = box.top + scrollTop - clientTop;
        var left = box.left + scrollLeft - clientLeft;

        return { y: Math.round(top), x: Math.round(left) };
    }

    function getOffset(elem) {
        if (elem.getBoundingClientRect) {
            return getOffsetRect(elem);
        } else {
            return getOffsetSum(elem);
        }
    }
    Offset.getOffset = getOffset;
})(Offset || (Offset = {}));
// From: https://typescript.codeplex.com/discussions/402228

var TypedEvent = (function () {
    function TypedEvent() {
        // Private member vars
        this._listeners = [];
    }
    TypedEvent.prototype.add = function (listener) {
        /// <summary>Registers a new listener for the event.</summary>
        /// <param name="listener">The callback function to register.</param>
        this._listeners.push(listener);
    };
    TypedEvent.prototype.remove = function (listener) {
        /// <summary>Unregisters a listener from the event.</summary>
        /// <param name="listener">The callback function that was registered. If missing then all listeners will be removed.</param>
        if (typeof listener === 'function') {
            for (var i = 0, l = this._listeners.length; i < l; l++) {
                if (this._listeners[i] === listener) {
                    this._listeners.splice(i, 1);
                    break;
                }
            }
        } else {
            this._listeners = [];
        }
    };

    TypedEvent.prototype.trigger = function () {
        var a = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            a[_i] = arguments[_i + 0];
        }
        /// <summary>Invokes all of the listeners for this event.</summary>
        /// <param name="args">Optional set of arguments to pass to listners.</param>
        var context = {};
        var listeners = this._listeners.slice(0);
        for (var i = 0, l = listeners.length; i < l; i++) {
            listeners[i].apply(context, a || []);
        }
    };
    return TypedEvent;
})();

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
var ByteArray = (function () {
    function ByteArray() {
        // Private variables
        this._Bytes = [];
        this._Length = 0;
        this._Position = 0;
    }
    Object.defineProperty(ByteArray.prototype, "bytesAvailable", {
        get: function () {
            return this._Length - this._Position;
        },
        enumerable: true,
        configurable: true
    });

    ByteArray.prototype.clear = function () {
        this._Bytes = [];
        this._Length = 0;
        this._Position = 0;
    };

    Object.defineProperty(ByteArray.prototype, "length", {
        get: function () {
            return this._Length;
        },
        set: function (value) {
            if (value <= 0) {
                this.clear();
            } else {
                if (value < this._Length) {
                    this._Bytes.splice(value, this._Length - value);
                } else if (value > this._Length) {
                    for (var i = this._Length + 1; i <= value; i++) {
                        this._Bytes.push(0);
                    }
                }

                this._Length = value;
            }
        },
        enumerable: true,
        configurable: true
    });


    Object.defineProperty(ByteArray.prototype, "position", {
        get: function () {
            return this._Position;
        },
        set: function (value) {
            if (value <= 0) {
                value = 0;
            } else if (value >= this._Length) {
                value = this._Length;
            }

            this._Position = value;
        },
        enumerable: true,
        configurable: true
    });


    ByteArray.prototype.readBytes = function (bytes, offset, length) {
        if (typeof offset === 'undefined') {
            offset = 0;
        }
        if (typeof length === 'undefined') {
            length = 0;
        }

        if (this._Position + length > this._Length) {
            throw 'There is not sufficient data available to read.';
        }

        var BytesPosition = bytes.position;
        bytes.position = offset;

        for (var i = 0; i < length; i++) {
            bytes.writeByte(this._Bytes[this._Position++] & 0xFF);
        }

        bytes.position = BytesPosition;
    };

    ByteArray.prototype.readString = function (length) {
        if (typeof length === 'undefined') {
            length = this._Length;
        }

        var Result = '';
        while ((length-- > 0) && (this._Position < this._Length)) {
            Result += String.fromCharCode(this._Bytes[this._Position++]);
        }

        // Reset if we've read all the data there is to read
        if (this.bytesAvailable === 0) {
            this.clear();
        }

        return Result;
    };

    ByteArray.prototype.readUnsignedByte = function () {
        if (this._Position >= this._Length) {
            throw 'There is not sufficient data available to read.';
        }

        return (this._Bytes[this._Position++] & 0xFF);
    };

    ByteArray.prototype.readUnsignedShort = function () {
        if (this._Position >= (this._Length - 1)) {
            throw 'There is not sufficient data available to read.';
        }

        return ((this._Bytes[this._Position++] & 0xFF) << 8) + (this._Bytes[this._Position++] & 0xFF);
    };

    ByteArray.prototype.toString = function () {
        var Result = '';
        for (var i = 0; i < this._Length; i++) {
            Result += String.fromCharCode(this._Bytes[i]);
        }

        return Result;
    };

    ByteArray.prototype.writeByte = function (value) {
        this._Bytes[this._Position++] = (value & 0xFF);
        if (this._Position > this._Length) {
            this._Length++;
        }
    };

    ByteArray.prototype.writeBytes = function (bytes, offset, length) {
        if (!offset) {
            offset = 0;
        }
        if (!length) {
            length = 0;
        }

        if (offset < 0) {
            offset = 0;
        }
        if (length < 0) {
            return;
        } else if (length === 0) {
            length = bytes.length;
        }

        if (offset >= bytes.length) {
            offset = 0;
        }
        if (length > bytes.length) {
            length = bytes.length;
        }
        if (offset + length > bytes.length) {
            length = bytes.length - offset;
        }

        var BytesPosition = bytes.position;
        bytes.position = offset;

        for (var i = 0; i < length; i++) {
            this.writeByte(bytes.readUnsignedByte());
        }

        bytes.position = BytesPosition;
    };

    ByteArray.prototype.writeShort = function (value) {
        this.writeByte((value & 0xFF00) >> 8);
        this.writeByte(value & 0x00FF);
    };

    ByteArray.prototype.writeString = function (text) {
        var Textlength = text.length;
        for (var i = 0; i < Textlength; i++) {
            this.writeByte(text.charCodeAt(i));
        }
    };
    return ByteArray;
})();
/*
fTelnet: An HTML5 WebSocket client
Copyright (C) 2009-2013  Rick Parrish, R&M Software
This file is part of fTelnet.
fTelnet is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or any later version.
fTelnet is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY, without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.
You should have received a copy of the GNU Affero General Public License
along with fTelnet.  If not, see <http://www.gnu.org/licenses/>.
*/
var Keyboard;
(function (Keyboard) {
    Keyboard[Keyboard["ALTERNATE"] = 18] = "ALTERNATE";
    Keyboard[Keyboard["APPMENU"] = 1001] = "APPMENU";
    Keyboard[Keyboard["BACKSPACE"] = 8] = "BACKSPACE";
    Keyboard[Keyboard["BREAK"] = 1000] = "BREAK";
    Keyboard[Keyboard["CAPS_LOCK"] = 20] = "CAPS_LOCK";
    Keyboard[Keyboard["CONTROL"] = 17] = "CONTROL";
    Keyboard[Keyboard["DELETE"] = 46] = "DELETE";
    Keyboard[Keyboard["DOWN"] = 40] = "DOWN";
    Keyboard[Keyboard["END"] = 35] = "END";
    Keyboard[Keyboard["ESCAPE"] = 27] = "ESCAPE";
    Keyboard[Keyboard["ENTER"] = 13] = "ENTER";
    Keyboard[Keyboard["F1"] = 112] = "F1";
    Keyboard[Keyboard["F2"] = 113] = "F2";
    Keyboard[Keyboard["F3"] = 114] = "F3";
    Keyboard[Keyboard["F4"] = 115] = "F4";
    Keyboard[Keyboard["F5"] = 116] = "F5";
    Keyboard[Keyboard["F6"] = 117] = "F6";
    Keyboard[Keyboard["F7"] = 118] = "F7";
    Keyboard[Keyboard["F8"] = 119] = "F8";
    Keyboard[Keyboard["F9"] = 120] = "F9";
    Keyboard[Keyboard["F10"] = 121] = "F10";
    Keyboard[Keyboard["F11"] = 122] = "F11";
    Keyboard[Keyboard["F12"] = 123] = "F12";
    Keyboard[Keyboard["HOME"] = 36] = "HOME";
    Keyboard[Keyboard["INSERT"] = 45] = "INSERT";
    Keyboard[Keyboard["LEFT"] = 37] = "LEFT";
    Keyboard[Keyboard["NUM_LOCK"] = 1002] = "NUM_LOCK";
    Keyboard[Keyboard["PAGE_DOWN"] = 34] = "PAGE_DOWN";
    Keyboard[Keyboard["PAGE_UP"] = 33] = "PAGE_UP";
    Keyboard[Keyboard["RIGHT"] = 39] = "RIGHT";
    Keyboard[Keyboard["SHIFT"] = 16] = "SHIFT";
    Keyboard[Keyboard["SPACE"] = 32] = "SPACE";
    Keyboard[Keyboard["TAB"] = 9] = "TAB";
    Keyboard[Keyboard["WINDOWS"] = 1003] = "WINDOWS";
    Keyboard[Keyboard["UP"] = 38] = "UP";
})(Keyboard || (Keyboard = {}));
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
var Point = (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    return Point;
})();
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
var Ansi = (function () {
    function Ansi() {
    }
    // Source for most commands:
    // http://cvs.synchro.net/cgi-bin/viewcvs.cgi/*checkout*/src/conio/cterm.txt?content-type=text%2Fplain&revision=HEAD
    // Commands not found in above document noted with NOT IN CTERM.TXT
    Ansi.AnsiCommand = function (finalByte) {
        var Colour = 0;
        var x = 0;
        var y = 0;
        var z = 0;

        switch (finalByte) {
            case '!':
                if (this._AnsiParams.length < 1) {
                    this._AnsiParams.push('0');
                }
                switch (parseInt(this._AnsiParams.shift(), 10)) {
                    case 0:
                        this.onripdetect.trigger();
                        break;
                    case 1:
                        this.onripdisable.trigger();
                        break;
                    case 2:
                        this.onripenable.trigger();
                        break;
                    default:
                        console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                        break;
                }
                break;
            case '@':
                if (this._AnsiParams.length < 1) {
                    this._AnsiParams.push('1');
                }
                x = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                Crt.InsChar(x);
                break;
            case '{':
                console.log('Unhandled ESC sequence: Indicates that a font block is following');
                break;
            case 'A':
                if (this._AnsiParams.length < 1) {
                    this._AnsiParams.push('1');
                }
                y = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                y = Math.max(1, Crt.WhereY() - y);
                Crt.GotoXY(Crt.WhereX(), y);
                break;
            case 'B':
                if (this._AnsiParams.length < 1) {
                    this._AnsiParams.push('1');
                }
                y = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                y = Math.min(Crt.WindRows, Crt.WhereY() + y);
                Crt.GotoXY(Crt.WhereX(), y);
                break;
            case 'C':
                if (this._AnsiParams.length < 1) {
                    this._AnsiParams.push('1');
                }
                x = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                x = Math.min(Crt.WindCols, Crt.WhereX() + x);
                Crt.GotoXY(x, Crt.WhereY());
                break;
            case 'c':
                if (this._AnsiParams.length < 1) {
                    this._AnsiParams.push('0');
                }
                console.log('Unhandled ESC sequence: Device Attributes');
                break;
            case 'D':
                if (this._AnsiIntermediates.length === 0) {
                    /* CSI [ p1 ] D
                    Cursor Left
                    Defaults: p1 = 1
                    Moves the cursor position left p1 columns from the current position.
                    Attempting to move past the screen boundaries stops the cursor
                    at the screen boundary.
                    SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf */
                    if (this._AnsiParams.length < 1) {
                        this._AnsiParams.push('1');
                    }
                    x = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                    x = Math.max(1, Crt.WhereX() - x);
                    Crt.GotoXY(x, Crt.WhereY());
                } else if (this._AnsiIntermediates.indexOf(' ') !== -1) {
                    while (this._AnsiParams.length < 2) {
                        this._AnsiParams.push('0');
                    }
                    x = parseInt(this._AnsiParams.shift(), 10);
                    y = parseInt(this._AnsiParams.shift(), 10);
                    if ((x === 0) && (y >= 0) && (y <= 40)) {
                        // TODO Should pick based on available screen space, not on biggest to smallest
                        Crt.SetFont('SyncTerm-' + y.toString(10), 8, 16) || Crt.SetFont('SyncTerm-' + y.toString(10), 8, 14) || Crt.SetFont('SyncTerm-' + y.toString(10), 8, 8);
                    } else {
                        console.log('Unhandled ESC sequence: Secondary Font Selection (set font ' + x + ' to ' + y + ')');
                    }
                    break;
                }
                break;
            case 'E':
                if (this._AnsiParams.length < 1) {
                    this._AnsiParams.push('1');
                }
                y = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                y = Math.min(Crt.WindRows, Crt.WhereY() + y);
                Crt.GotoXY(1, y);
                break;
            case 'F':
                if (this._AnsiParams.length < 1) {
                    this._AnsiParams.push('1');
                }
                y = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                y = Math.max(1, Crt.WhereY() - y);
                Crt.GotoXY(1, y);
                break;
            case 'G':
                if (this._AnsiParams.length < 1) {
                    this._AnsiParams.push('1');
                }
                x = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                if ((x >= 1) && (x <= Crt.WindCols)) {
                    Crt.GotoXY(x, Crt.WhereY());
                }
                break;
            case 'H':
            case 'f':
                while (this._AnsiParams.length < 2) {
                    this._AnsiParams.push('1');
                }
                y = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                x = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                Crt.GotoXY(x, y);
                break;
            case 'h':
                if (this._AnsiParams.length < 1) {
                    this._AnsiParams.push('0');
                }
                switch (this._AnsiParams[0]) {
                    case '=255':
                        console.log('Unhandled ESC sequence: Enable DoorWay Mode');
                        break;
                    case '?6':
                        console.log('Unhandled ESC sequence: Enable origin mode');
                        break;
                    case '?7':
                        console.log('Unhandled ESC sequence: Enable auto wrap');
                        break;
                    case '?25':
                        Crt.ShowCursor();
                        break;
                    case '?31':
                        console.log('Unhandled ESC sequence: Enable alt character set');
                        break;
                    case '?32':
                        console.log('Unhandled ESC sequence: Bright Intensity Enable');
                        break;
                    case '?33':
                        console.log('Unhandled ESC sequence: Blink to Bright Intensity Background');
                        break;
                    default:
                        console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                        break;
                }
                break;
            case 'J':
                if (this._AnsiParams.length < 1) {
                    this._AnsiParams.push('0');
                }
                switch (parseInt(this._AnsiParams.shift(), 10)) {
                    case 0:
                        Crt.ClrEos();
                        break;
                    case 1:
                        Crt.ClrBos();
                        break;
                    case 2:
                        Crt.ClrScr();
                        break;
                }
                break;
            case 'K':
                if (this._AnsiParams.length < 1) {
                    this._AnsiParams.push('0');
                }
                switch (parseInt(this._AnsiParams.shift(), 10)) {
                    case 0:
                        Crt.ClrEol();
                        break;
                    case 1:
                        Crt.ClrBol();
                        break;
                    case 2:
                        Crt.ClrLine();
                        break;
                }
                break;
            case 'L':
                if (this._AnsiParams.length < 1) {
                    this._AnsiParams.push('1');
                }
                y = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                Crt.InsLine(y);
                break;
            case 'l':
                if (this._AnsiParams.length < 1) {
                    this._AnsiParams.push('0');
                }
                switch (this._AnsiParams[0]) {
                    case '=255':
                        console.log('Unhandled ESC sequence: Disable DoorWay Mode');
                        break;
                    case '?6':
                        console.log('Unhandled ESC sequence: Disable origin mode');
                        break;
                    case '?7':
                        console.log('Unhandled ESC sequence: Disable auto wrap');
                        break;
                    case '?25':
                        Crt.HideCursor();
                        break;
                    case '?31':
                        console.log('Unhandled ESC sequence: Disable alt character set');
                        break;
                    case '?32':
                        console.log('Unhandled ESC sequence: Bright Intensity Disable');
                        break;
                    case '?33':
                        console.log('Unhandled ESC sequence: Blink Normal');
                        break;
                    default:
                        console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                        break;
                }
                break;
            case 'M':
                if (this._AnsiParams[0][0] === '=') {
                    /* CSI = [p1] M
                    NON-STANDARD EXTENSION.
                    Defaults:  p1 = 0
                    Sets the current state of ANSI music parsing.
                    0 - Only CSI | will introduce an ANSI music string.
                    1 - Both CSI | and CSI N will introduce an ANSI music string.
                    2 - CSI |, CSI N, and CSI M will all intriduce and ANSI music string.
                    In this mode, Delete Line will not be available.
                    
                    SOURCE: CTerm only. */
                    if (this._AnsiParams.length < 1) {
                        this._AnsiParams.push('0');
                    }
                    x = parseInt(this._AnsiParams.shift(), 10);
                    switch (x) {
                        case 0:
                            console.log('Unhandled ESC sequence: Only CSI | will introduce an ANSI music string.');
                            break;
                        case 1:
                            console.log('Unhandled ESC sequence: Both CSI | and CSI N will introduce an ANSI music string.');
                            break;
                        case 2:
                            console.log('Unhandled ESC sequence: CSI |, CSI N, and CSI M will all intriduce and ANSI music string.');
                            break;
                        default:
                            console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                            break;
                    }
                } else {
                    /* CSI [ p1 ] M
                    Delete Line(s) / 'ANSI' Music
                    Defaults: p1 = 1
                    Deletes the current line and the p1 - 1 lines after it scrolling the
                    first non-deleted line up to the current line and filling the newly
                    empty lines at the end of the screen with the current attribute.
                    If 'ANSI' Music is fully enabled (CSI = 2 M), performs 'ANSI' music
                    instead.
                    See 'ANSI' MUSIC section for more details.
                    
                    SOURCE: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-048.pdf
                    SOURCE: BANSI.TXT */
                    if (this._AnsiParams.length < 1) {
                        this._AnsiParams.push('1');
                    }
                    y = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                    Crt.DelLine(y);
                }
                break;
            case 'm':
                if (this._AnsiParams.length < 1) {
                    this._AnsiParams.push('0');
                }
                while (this._AnsiParams.length > 0) {
                    x = parseInt(this._AnsiParams.shift(), 10);
                    switch (x) {
                        case 0:
                            Crt.NormVideo();
                            break;
                        case 1:
                            Crt.HighVideo();
                            break;
                        case 2:
                            Crt.LowVideo();
                            break;
                        case 3:
                            break;
                        case 4:
                            break;
                        case 5:
                            Crt.SetBlink(true);
                            Crt.SetBlinkRate(500);
                            break;
                        case 6:
                            Crt.SetBlink(true);
                            Crt.SetBlinkRate(250);
                            break;
                        case 7:
                            Crt.ReverseVideo();
                            break;
                        case 8:
                            this._AnsiAttr = Crt.TextAttr;
                            Crt.Conceal();
                            break;
                        case 21:
                            break;
                        case 22:
                            Crt.LowVideo();
                            break;
                        case 24:
                            break;
                        case 25:
                            Crt.SetBlink(false);
                            break;
                        case 27:
                            // NOTE: This should be a separate attribute than 7 but this implementation makes them equal
                            Crt.ReverseVideo();
                            break;
                        case 28:
                            Crt.TextAttr = this._AnsiAttr;
                            break;
                        case 30:
                        case 31:
                        case 32:
                        case 33:
                        case 34:
                        case 35:
                        case 36:
                        case 37:
                            Colour = this.ANSI_COLORS[x - 30];
                            if (Crt.TextAttr % 16 > 7) {
                                Colour += 8;
                            }
                            Crt.TextColor(Colour);
                            break;
                        case 39:
                            Colour = this.ANSI_COLORS[37 - 30];
                            if (Crt.TextAttr % 16 > 7) {
                                Colour += 8;
                            }
                            Crt.TextColor(Colour);
                            break;
                        case 40:
                        case 41:
                        case 42:
                        case 43:
                        case 44:
                        case 45:
                        case 46:
                        case 47:
                            Colour = this.ANSI_COLORS[x - 40];
                            Crt.TextBackground(Colour);
                            break;
                        case 49:
                            Colour = this.ANSI_COLORS[40 - 40];
                            Crt.TextBackground(Colour);
                            break;
                    }
                }
                break;
            case 'N':
                console.log('Unhandled ESC sequence: ANSI Music');
                break;
            case 'n':
                if (this._AnsiParams.length < 1) {
                    this._AnsiParams.push('0');
                }
                x = parseInt(this._AnsiParams.shift(), 10);
                switch (x) {
                    case 5:
                        this.onesc5n.trigger();
                        break;
                    case 6:
                        this.onesc6n.trigger();
                        break;
                    case 255:
                        this.onesc255n.trigger();
                        break;
                    default:
                        console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                        break;
                }
                break;
            case 'P':
                if (this._AnsiParams.length < 1) {
                    this._AnsiParams.push('1');
                }
                x = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                Crt.DelChar(x);
                break;
            case 'Q':
                while (this._AnsiParams.length < 3) {
                    this._AnsiParams.push('0');
                }
                x = parseInt(this._AnsiParams.shift(), 10);
                y = parseInt(this._AnsiParams.shift(), 10);
                z = parseInt(this._AnsiParams.shift(), 10);
                this.onescQ.trigger(x.toString(10), y, z);
                break;
            case 'r':
                if (this._AnsiIntermediates.length === 0) {
                    console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                } else if (this._AnsiIntermediates[0].indexOf('*') !== -1) {
                    /* CSI [ p1 [ ; p2 ] ] * r
                    NON-STANDARD EXTENSION.
                    Set the output emulation speed.
                    If p1 or p2 are omitted, causes output speed emulation to stop
                    p1 may be empty.
                    Sequence is ignored if p1 is not empty, 0, or 1.
                    The value of p2 sets the output speed emulation as follows:
                    Value		Speed
                    -----		-----
                    empty, 0	Unlimited
                    1		300
                    2		600
                    3		1200
                    4		2400
                    5		4800
                    6		9600
                    7		19200
                    8		38400
                    9		57600
                    10		76800
                    11		115200
                    SOURCE: VT4xx Specification from http://www.vt100.net/ */
                    console.log('Unhandled ESC sequence: Set the output emulation speed.');
                } else if (this._AnsiIntermediates[0].indexOf(']') !== -1) {
                    /* CSI [ p1 [ ; p2 ] ] r
                    NON-STANDARD EXTENSION.
                    Set Top and Bottom Margins
                    Defaults: p1 = 1
                    p2 = last line on screen
                    Selects top and bottom margins, defining the scrolling region. P1 is
                    the line number of the first line in the scrolling region. P2 is the line
                    number of the bottom line. */
                    console.log('Unhandled ESC sequence: Set Top and Bottom Margins');
                } else {
                    console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                }
                break;
            case 'S':
                if (this._AnsiParams.length < 1) {
                    this._AnsiParams.push('1');
                }
                y = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                Crt.ScrollUpScreen(y);
                break;
            case 's':
                if (this._AnsiIntermediates.length === 0) {
                    /* CSI s
                    NON-STANDARD EXTENSION
                    Save Current Position
                    Saves the current cursor position for later restoring with CSI u
                    although this is non-standard, it's so widely used in the BBS world
                    that any terminal program MUST implement it.
                    SOURCE: ANSI.SYS */
                    this._AnsiXY = new Point(Crt.WhereX(), Crt.WhereY());
                } else {
                    /* CSI ? [ p1 [ pX ... ] ] s
                    NON-STANDARD EXTENSION
                    Save Mode Setting
                    Saves the current mode states as specified by CSI l and CSI h.  If
                    p1 is omitted, saves all such states.  If pX is included, saves only
                    the specified states (arguments to CSI l/h).
                    SOURCE: SyncTERM only */
                    console.log('Unhandled ESC sequence: Save Mode Setting');
                }
                break;
            case 'T':
                if (this._AnsiParams.length < 1) {
                    this._AnsiParams.push('1');
                }
                y = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                Crt.ScrollDownWindow(y);
                break;
            case 'U':
                console.log('Unhandled ESC sequence: Clear screen with default attribute');
                break;
            case 'u':
                if (this._AnsiIntermediates.length === 0) {
                    /* CSI u
                    NON-STANDARD EXTENSION
                    Restore Cursor Position
                    Move the cursor to the last position saved by CSI s.  If no position has
                    been saved, the cursor is not moved.
                    SOURCE: ANSI.SYS */
                    Crt.GotoXY(this._AnsiXY.x, this._AnsiXY.y);
                } else {
                    /* CSI ? [ p1 [ pX ... ] ]  u
                    NON-STANDARD EXTENSION
                    Restore Mode Setting
                    Saves the current mode states as specified by CSI l and CSI h.  If
                    p1 is omitted, saves all such states.  If pX is included, restores
                    all the specified states (arguments to CSI l/h)
                    SOURCE: SyncTERM only */
                    console.log('Unhandled ESC sequence: Restore Mode Setting');
                }
                break;
            case 'X':
                if (this._AnsiParams.length < 1) {
                    this._AnsiParams.push('1');
                }
                x = Math.max(1, parseInt(this._AnsiParams.shift(), 10));
                Crt.DelChar(x);
                break;
            case 'Z':
                console.log('Unhandled ESC sequnce: Cursor Backward Tabulation');
                break;
            default:
                console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                break;
        }
    };

    Ansi.ClrBol = function () {
        return '\x1B[1K';
    };

    Ansi.ClrBos = function () {
        return '\x1B[1J';
    };

    Ansi.ClrEol = function () {
        return '\x1B[K';
    };

    Ansi.ClrEos = function () {
        return '\x1B[J';
    };

    Ansi.ClrLine = function () {
        return '\x1B[2K';
    };

    Ansi.ClrScr = function () {
        return '\x1B[2J';
    };

    Ansi.CursorDown = function (count) {
        if (count === 1) {
            return '\x1B[B';
        } else {
            return '\x1B[' + count.toString() + 'B';
        }
    };

    Ansi.CursorLeft = function (count) {
        if (count === 1) {
            return '\x1B[D';
        } else {
            return '\x1B[' + count.toString() + 'D';
        }
    };

    Ansi.CursorPosition = function (x, y) {
        if (typeof x === 'undefined') {
            x = Crt.WhereXA();
        }
        if (typeof y === 'undefined') {
            y = Crt.WhereYA();
        }

        return '\x1B[' + y + ';' + x + 'R';
    };

    Ansi.CursorRestore = function () {
        return '\x1B[u';
    };

    Ansi.CursorRight = function (count) {
        if (count === 1) {
            return '\x1B[C';
        } else {
            return '\x1B[' + count.toString() + 'C';
        }
    };

    Ansi.CursorSave = function () {
        return '\x1B[s';
    };

    Ansi.CursorUp = function (count) {
        if (count === 1) {
            return '\x1B[A';
        } else {
            return '\x1B[' + count.toString() + 'A';
        }
    };

    Ansi.GotoX = function (x) {
        if (x === 1) {
            return this.CursorLeft(255);
        } else {
            return this.CursorLeft(255) + this.CursorRight(x - 1);
        }
    };

    Ansi.GotoXY = function (x, y) {
        return '\x1B[' + y.toString() + ';' + x.toString() + 'H';
    };

    Ansi.GotoY = function (y) {
        if (y === 1) {
            return this.CursorUp(255);
        } else {
            return this.CursorUp(255) + this.CursorDown(y - 1);
        }
    };

    Ansi.TextAttr = function (attr) {
        return this.TextColor(attr % 16) + this.TextBackground(Math.floor(attr / 16));
    };

    Ansi.TextBackground = function (colour) {
        while (colour >= 8) {
            colour -= 8;
        }
        return '\x1B[' + (40 + this.ANSI_COLORS[colour]).toString() + 'm';
    };

    Ansi.TextColor = function (colour) {
        switch (colour % 16) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
                return '\x1B[0;' + (30 + this.ANSI_COLORS[colour % 16]).toString() + 'm' + this.TextBackground(Crt.TextAttr / 16);
            case 8:
            case 9:
            case 10:
            case 11:
            case 12:
            case 13:
            case 14:
            case 15:
                return '\x1B[1;' + (30 + this.ANSI_COLORS[(colour % 16) - 8]).toString() + 'm';
        }

        return '';
    };

    Ansi.Write = function (text) {
        // Check for Atari/C64 mode, which doesn't use ANSI
        if (Crt.Atari || Crt.C64) {
            Crt.Write(text);
        } else {
            var Buffer = '';

            for (var i = 0; i < text.length; i++) {
                if (text.charAt(i) === '\x1B') {
                    this._AnsiParserState = 1 /* Escape */;
                } else if (this._AnsiParserState === 1 /* Escape */) {
                    if (text.charAt(i) === '[') {
                        this._AnsiParserState = 2 /* Bracket */;
                        this._AnsiBuffer = '';

                        while (this._AnsiParams.length > 0) {
                            this._AnsiParams.pop();
                        }
                        while (this._AnsiIntermediates.length > 0) {
                            this._AnsiIntermediates.pop();
                        }
                    } else {
                        Buffer += text.charAt(i);
                        this._AnsiParserState = 0 /* None */;
                    }
                } else if (this._AnsiParserState === 2 /* Bracket */) {
                    if ((text.charAt(i) >= '0') && (text.charAt(i) <= '?')) {
                        // It's a parameter byte
                        this._AnsiBuffer += text.charAt(i);
                        this._AnsiParserState = 3 /* ParameterByte */;
                    } else if ((text.charAt(i) >= ' ') && (text.charAt(i) <= '/')) {
                        // It's an intermediate byte
                        this._AnsiBuffer += text.charAt(i);
                        this._AnsiParserState = 4 /* IntermediateByte */;
                    } else if ((text.charAt(i) >= '@') && (text.charAt(i) <= '~')) {
                        // Final byte, output whatever we have buffered
                        Crt.Write(Buffer);
                        Buffer = '';

                        // Handle the command
                        this.AnsiCommand(text.charAt(i));

                        // Reset the parser state
                        this._AnsiParserState = 0 /* None */;
                    } else {
                        // Invalid sequence
                        Buffer += text.charAt(i);
                        this._AnsiParserState = 0 /* None */;
                    }
                } else if (this._AnsiParserState === 3 /* ParameterByte */) {
                    if ((text.charAt(i)) === ';') {
                        // Start of new parameter
                        this._AnsiParams.push((this._AnsiBuffer === '') ? '0' : this._AnsiBuffer);
                        this._AnsiBuffer = '';
                    } else if ((text.charAt(i) >= '0') && (text.charAt(i) <= '?')) {
                        // Additional parameter byte
                        this._AnsiBuffer += text.charAt(i);
                    } else if ((text.charAt(i) >= ' ') && (text.charAt(i) <= '/')) {
                        // Intermediate byte, push buffer to new parameter
                        this._AnsiParams.push((this._AnsiBuffer === '') ? '0' : this._AnsiBuffer);
                        this._AnsiBuffer = '';

                        this._AnsiIntermediates.push(text.charAt(i));
                        this._AnsiParserState = 4 /* IntermediateByte */;
                    } else if ((text.charAt(i) >= '@') && (text.charAt(i) <= '~')) {
                        // Final byte, push buffer to new parameter
                        this._AnsiParams.push((this._AnsiBuffer === '') ? '0' : this._AnsiBuffer);
                        this._AnsiBuffer = '';

                        // Output whatever we have buffered
                        Crt.Write(Buffer);
                        Buffer = '';

                        // Handle the command
                        this.AnsiCommand(text.charAt(i));

                        // Reset the parser state
                        this._AnsiParserState = 0 /* None */;
                    } else {
                        // Invalid command
                        Buffer += text.charAt(i);
                        this._AnsiParserState = 0 /* None */;
                    }
                } else if (this._AnsiParserState === 4 /* IntermediateByte */) {
                    if ((text.charAt(i) >= '0') && (text.charAt(i) <= '?')) {
                        // Parameter byte, which is illegal at this point
                        Buffer += text.charAt(i);
                        this._AnsiParserState = 0 /* None */;
                    } else if ((text.charAt(i) >= ' ') && (text.charAt(i) <= '/')) {
                        // Additional intermediate byte
                        this._AnsiIntermediates.push(text.charAt(i));
                    } else if ((text.charAt(i) >= '@') && (text.charAt(i) <= '~')) {
                        // Final byte byte, output whatever we have buffered
                        Crt.Write(Buffer);
                        Buffer = '';

                        // Handle the command
                        this.AnsiCommand(text.charAt(i));

                        // Reset the parser state
                        this._AnsiParserState = 0 /* None */;
                    } else {
                        // Invalid command
                        Buffer += text.charAt(i);
                        this._AnsiParserState = 0 /* None */;
                    }
                } else {
                    Buffer += text.charAt(i);
                }
            }

            Crt.Write(Buffer);
        }
    };

    Ansi.WriteLn = function (text) {
        this.Write(text + '\r\n');
    };
    Ansi.onesc5n = new TypedEvent();
    Ansi.onesc6n = new TypedEvent();
    Ansi.onesc255n = new TypedEvent();
    Ansi.onescQ = new TypedEvent();
    Ansi.onripdetect = new TypedEvent();
    Ansi.onripdisable = new TypedEvent();
    Ansi.onripenable = new TypedEvent();

    Ansi.ANSI_COLORS = [0, 4, 2, 6, 1, 5, 3, 7];

    Ansi._AnsiAttr = 7;
    Ansi._AnsiBuffer = '';
    Ansi._AnsiIntermediates = [];
    Ansi._AnsiParams = [];
    Ansi._AnsiParserState = 0 /* None */;
    Ansi._AnsiXY = new Point(1, 1);
    return Ansi;
})();
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
/// <summary>
/// The possible states the ANSI parser may find itself in
/// </summary>
var AnsiParserState;
(function (AnsiParserState) {
    /// <summary>
    /// The default data state
    /// </summary>
    AnsiParserState[AnsiParserState["None"] = 0] = "None";

    /// <summary>
    /// The last received character was an ESC
    /// </summary>
    AnsiParserState[AnsiParserState["Escape"] = 1] = "Escape";

    /// <summary>
    /// The last received character was a [
    /// </summary>
    AnsiParserState[AnsiParserState["Bracket"] = 2] = "Bracket";

    /// <summary>
    /// The last received character was a parameter byte (0 to ?)
    /// </summary>
    AnsiParserState[AnsiParserState["ParameterByte"] = 3] = "ParameterByte";

    /// <summary>
    /// The last received character was a intermediate byte (space to /)
    /// </summary>
    AnsiParserState[AnsiParserState["IntermediateByte"] = 4] = "IntermediateByte";
})(AnsiParserState || (AnsiParserState = {}));
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
var CharInfo = (function () {
    function CharInfo(ch, attr, blink, underline, reverse) {
        if (typeof blink === 'undefined') {
            blink = false;
        }
        if (typeof underline === 'undefined') {
            underline = false;
        }
        if (typeof reverse === 'undefined') {
            reverse = false;
        }

        this.Ch = ch;
        this.Attr = attr;
        this.Blink = blink;
        this.Underline = underline;
        this.Reverse = reverse;
    }
    return CharInfo;
})();
/*
fTelnet: An HTML5 WebSocket client
Copyright (C) 2009-2013  Rick Parrish, R&M Software
This file is part of fTelnet.
fTelnet is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or any later version.
fTelnet is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY, without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.
You should have received a copy of the GNU Affero General Public License
along with fTelnet.  If not, see <http://www.gnu.org/licenses/>.
*/
var BorderStyle;
(function (BorderStyle) {
    /// <summary>
    /// Single lines all around
    /// </summary>
    BorderStyle[BorderStyle["Single"] = 0] = "Single";

    /// <summary>
    /// Double lines all around
    /// </summary>
    BorderStyle[BorderStyle["Double"] = 1] = "Double";

    /// <summary>
    /// Single lines horizontally, double lines vertically
    /// </summary>
    /// <see>DoubleV</see>
    BorderStyle[BorderStyle["SingleH"] = 2] = "SingleH";

    /// <summary>
    /// Single lines vertically, double lines horizontally
    /// </summary>
    /// <see>DoubleH</see>
    BorderStyle[BorderStyle["SingleV"] = 3] = "SingleV";

    /// <summary>
    /// Double lines horizontally, single lines vertically
    /// </summary>
    /// <see>SingleV</see>
    BorderStyle[BorderStyle["DoubleH"] = 4] = "DoubleH";

    /// <summary>
    /// Double lines vertically, single lines horizontally
    /// </summary>
    /// <see>SingleH</see>
    BorderStyle[BorderStyle["DoubleV"] = 5] = "DoubleV";
})(BorderStyle || (BorderStyle = {}));
/*
fTelnet: An HTML5 WebSocket client
Copyright (C) 2009-2013  Rick Parrish, R&M Software
This file is part of fTelnet.
fTelnet is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or any later version.
fTelnet is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY, without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.
You should have received a copy of the GNU Affero General Public License
along with fTelnet.  If not, see <http://www.gnu.org/licenses/>.
*/
var ContentAlignment;
(function (ContentAlignment) {
    ContentAlignment[ContentAlignment["BottomLeft"] = 0] = "BottomLeft";
    ContentAlignment[ContentAlignment["BottomCenter"] = 1] = "BottomCenter";
    ContentAlignment[ContentAlignment["BottomRight"] = 2] = "BottomRight";
    ContentAlignment[ContentAlignment["MiddleLeft"] = 3] = "MiddleLeft";
    ContentAlignment[ContentAlignment["MiddleCenter"] = 4] = "MiddleCenter";
    ContentAlignment[ContentAlignment["MiddleRight"] = 5] = "MiddleRight";
    ContentAlignment[ContentAlignment["TopLeft"] = 6] = "TopLeft";
    ContentAlignment[ContentAlignment["TopCenter"] = 7] = "TopCenter";
    ContentAlignment[ContentAlignment["TopRight"] = 8] = "TopRight";
    ContentAlignment[ContentAlignment["Left"] = 9] = "Left";
    ContentAlignment[ContentAlignment["Center"] = 10] = "Center";
    ContentAlignment[ContentAlignment["Right"] = 11] = "Right";
})(ContentAlignment || (ContentAlignment = {}));
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
var CrtControl = (function () {
    function CrtControl(parent, left, top, width, height) {
        this._BackColour = Crt.BLACK;
        this._Background = null;
        this._Controls = [];
        this._ForeColour = Crt.LIGHTGRAY;
        this._Parent = null;
        this._Parent = parent;
        this._Left = left;
        this._Top = top;
        this._Width = width;
        this._Height = height;

        this.SaveBackground();

        if (this._Parent !== null) {
            parent.AddControl(this);
        }
    }
    CrtControl.prototype.AddControl = function (child) {
        this._Controls.push(child);
    };

    Object.defineProperty(CrtControl.prototype, "BackColour", {
        get: function () {
            return this._BackColour;
        },
        set: function (value) {
            if (value !== this._BackColour) {
                this._BackColour = value;
                this.Paint(true);
            }
        },
        enumerable: true,
        configurable: true
    });


    Object.defineProperty(CrtControl.prototype, "ForeColour", {
        get: function () {
            return this._ForeColour;
        },
        set: function (value) {
            if (value !== this._ForeColour) {
                this._ForeColour = value;
                this.Paint(true);
            }
        },
        enumerable: true,
        configurable: true
    });


    Object.defineProperty(CrtControl.prototype, "Height", {
        get: function () {
            return this._Height;
        },
        set: function (value) {
            if (value !== this._Height) {
                this.RestoreBackground();
                this._Height = value;
                this.SaveBackground();
                this.Paint(true);
            }
        },
        enumerable: true,
        configurable: true
    });


    CrtControl.prototype.Hide = function () {
        this.RestoreBackground();
    };

    Object.defineProperty(CrtControl.prototype, "Left", {
        get: function () {
            return this._Left;
        },
        set: function (value) {
            if (value !== this._Left) {
                this.RestoreBackground();
                this._Left = value;
                this.SaveBackground();
                this.Paint(true);

                for (var i = 0; i < this._Controls.length; i++) {
                    this._Controls[i].Paint(true);
                }
            }
        },
        enumerable: true,
        configurable: true
    });


    CrtControl.prototype.Paint = function (force) {
        // Override in base class
    };

    Object.defineProperty(CrtControl.prototype, "Parent", {
        get: function () {
            return this._Parent;
        },
        set: function (value) {
            this.RestoreBackground();
            this._Parent = value;
            this.SaveBackground();
            this.Paint(true);
        },
        enumerable: true,
        configurable: true
    });


    CrtControl.prototype.RestoreBackground = function () {
        var Left = this._Left;
        var Top = this._Top;
        var P = this._Parent;
        while (P) {
            Left += P.Left;
            Top += P.Top;
            P = P.Parent;
        }
        Crt.RestoreScreen(this._Background, Left, Top, Left + this._Width - 1, Top + this._Height - 1);
    };

    CrtControl.prototype.SaveBackground = function () {
        var Left = this._Left;
        var Top = this._Top;
        var P = this._Parent;
        while (P) {
            Left += P.Left;
            Top += P.Top;
            P = P.Parent;
        }
        this._Background = Crt.SaveScreen(Left, Top, Left + this._Width - 1, Top + this._Height - 1);
    };

    Object.defineProperty(CrtControl.prototype, "ScreenLeft", {
        get: function () {
            return this._Left + ((this._Parent === null) ? 0 : this._Parent.Left);
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(CrtControl.prototype, "ScreenTop", {
        get: function () {
            return this._Top + ((this._Parent === null) ? 0 : this._Parent.Top);
        },
        enumerable: true,
        configurable: true
    });

    CrtControl.prototype.Show = function () {
        this.Paint(true);

        for (var i = 0; i < this._Controls.length; i++) {
            this._Controls[i].Paint(true);
        }
    };

    Object.defineProperty(CrtControl.prototype, "Top", {
        get: function () {
            return this._Top;
        },
        set: function (value) {
            if (value !== this._Top) {
                this.RestoreBackground();
                this._Top = value;
                this.SaveBackground();
                this.Paint(true);

                for (var i = 0; i < this._Controls.length; i++) {
                    this._Controls[i].Paint(true);
                }
            }
        },
        enumerable: true,
        configurable: true
    });


    Object.defineProperty(CrtControl.prototype, "Width", {
        get: function () {
            return this._Width;
        },
        set: function (value) {
            if (value !== this._Width) {
                this.RestoreBackground();
                this._Width = value;
                this.SaveBackground();
                this.Paint(true);
            }
        },
        enumerable: true,
        configurable: true
    });

    return CrtControl;
})();
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
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
var CrtLabel = (function (_super) {
    __extends(CrtLabel, _super);
    function CrtLabel(parent, left, top, width, text, textAlign, foreColour, backColour) {
        _super.call(this, parent, left, top, width, 1);

        this._Text = text;
        this._TextAlign = textAlign;

        // Do these second because they force a paint and will cause an exception if they happen before the text is assigned
        this.ForeColour = foreColour;
        this.BackColour = backColour;

        this.Paint(true);
    }
    CrtLabel.prototype.Paint = function (force) {
        switch (this._TextAlign) {
            case 10 /* Center */:
                if (this._Text.length >= this.Width) {
                    // Text is greater than available space so chop it off with PadRight()
                    Crt.FastWrite(this._Text.substring(0, this.Width), this.ScreenLeft, this.ScreenTop, new CharInfo(' ', this.ForeColour + (this.BackColour << 4)));
                } else {
                    // Text needs to be centered
                    var i = 0;
                    var LeftSpaces = '';
                    for (i = 0; i < Math.floor((this.Width - this._Text.length) / 2); i++) {
                        LeftSpaces += ' ';
                    }
                    var RightSpaces = '';
                    for (i = 0; i < this.Width - this._Text.length - LeftSpaces.length; i++) {
                        RightSpaces += ' ';
                    }
                    Crt.FastWrite(LeftSpaces + this._Text + RightSpaces, this.ScreenLeft, this.ScreenTop, new CharInfo(' ', this.ForeColour + (this.BackColour << 4)));
                }
                break;
            case 9 /* Left */:
                Crt.FastWrite(StringUtils.PadRight(this._Text, ' ', this.Width), this.ScreenLeft, this.ScreenTop, new CharInfo(' ', this.ForeColour + (this.BackColour << 4)));
                break;
            case 11 /* Right */:
                Crt.FastWrite(StringUtils.PadLeft(this._Text, ' ', this.Width), this.ScreenLeft, this.ScreenTop, new CharInfo(' ', this.ForeColour + (this.BackColour << 4)));
                break;
        }
    };

    Object.defineProperty(CrtLabel.prototype, "Text", {
        get: function () {
            return this._Text;
        },
        set: function (value) {
            this._Text = value;
            this.Paint(true);
        },
        enumerable: true,
        configurable: true
    });


    Object.defineProperty(CrtLabel.prototype, "TextAlign", {
        get: function () {
            return this._TextAlign;
        },
        set: function (value) {
            if (value !== this._TextAlign) {
                this._TextAlign = value;
                this.Paint(true);
            }
        },
        enumerable: true,
        configurable: true
    });

    return CrtLabel;
})(CrtControl);
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
var CrtPanel = (function (_super) {
    __extends(CrtPanel, _super);
    function CrtPanel(parent, left, top, width, height, border, foreColour, backColour, text, textAlign) {
        _super.call(this, parent, left, top, width, height);

        this._Border = border;
        this._Text = text;
        this._TextAlign = textAlign;

        // Do these second because they force a paint and will cause an exception if they happen before the text is assigned
        this.ForeColour = foreColour;
        this.BackColour = backColour;

        this.Paint(true);
    }
    Object.defineProperty(CrtPanel.prototype, "Border", {
        get: function () {
            return this._Border;
        },
        set: function (value) {
            if (value !== this._Border) {
                this._Border = value;
                this.Paint(true);
            }
        },
        enumerable: true,
        configurable: true
    });


    CrtPanel.prototype.Paint = function (force) {
        // Characters for the box
        var TopLeft;
        var TopRight;
        var BottomLeft;
        var BottomRight;
        var TopBottom;
        var LeftRight;

        switch (this._Border) {
            case 0 /* Single */:
                TopLeft = String.fromCharCode(218);
                TopRight = String.fromCharCode(191);
                BottomLeft = String.fromCharCode(192);
                BottomRight = String.fromCharCode(217);
                TopBottom = String.fromCharCode(196);
                LeftRight = String.fromCharCode(179);
                break;
            case 1 /* Double */:
                TopLeft = String.fromCharCode(201);
                TopRight = String.fromCharCode(187);
                BottomLeft = String.fromCharCode(200);
                BottomRight = String.fromCharCode(188);
                TopBottom = String.fromCharCode(205);
                LeftRight = String.fromCharCode(186);
                break;
            case 4 /* DoubleH */:
            case 3 /* SingleV */:
                TopLeft = String.fromCharCode(213);
                TopRight = String.fromCharCode(184);
                BottomLeft = String.fromCharCode(212);
                BottomRight = String.fromCharCode(190);
                TopBottom = String.fromCharCode(205);
                LeftRight = String.fromCharCode(179);
                break;
            case 5 /* DoubleV */:
            case 2 /* SingleH */:
                TopLeft = String.fromCharCode(214);
                TopRight = String.fromCharCode(183);
                BottomLeft = String.fromCharCode(211);
                BottomRight = String.fromCharCode(189);
                TopBottom = String.fromCharCode(196);
                LeftRight = String.fromCharCode(186);
                break;
        }

        // Draw top row
        Crt.FastWrite(TopLeft + StringUtils.NewString(TopBottom, this.Width - 2) + TopRight, this.ScreenLeft, this.ScreenTop, new CharInfo(' ', this.ForeColour + (this.BackColour << 4)));

        for (var Line = this.ScreenTop + 1; Line < this.ScreenTop + this.Height - 1; Line++) {
            Crt.FastWrite(LeftRight + StringUtils.NewString(' ', this.Width - 2) + LeftRight, this.ScreenLeft, Line, new CharInfo(' ', this.ForeColour + (this.BackColour << 4)));
        }

        // Draw bottom row
        Crt.FastWrite(BottomLeft + StringUtils.NewString(TopBottom, this.Width - 2) + BottomRight, this.ScreenLeft, this.ScreenTop + this.Height - 1, new CharInfo(' ', this.ForeColour + (this.BackColour << 4)));

        // Draw window title
        if (StringUtils.Trim(this._Text).length > 0) {
            var TitleX = 0;
            var TitleY = 0;
            var WindowTitle = ' ' + StringUtils.Trim(this._Text) + ' ';

            switch (this._TextAlign) {
                case 0 /* BottomLeft */:
                case 3 /* MiddleLeft */:
                case 6 /* TopLeft */:
                    TitleX = this.ScreenLeft + 2;
                    break;
                case 1 /* BottomCenter */:
                case 4 /* MiddleCenter */:
                case 7 /* TopCenter */:
                    TitleX = this.ScreenLeft + Math.round((this.Width - WindowTitle.length) / 2);
                    break;
                case 2 /* BottomRight */:
                case 5 /* MiddleRight */:
                case 8 /* TopRight */:
                    TitleX = this.ScreenLeft + this.Width - WindowTitle.length - 2;
                    break;
            }

            switch (this._TextAlign) {
                case 1 /* BottomCenter */:
                case 0 /* BottomLeft */:
                case 2 /* BottomRight */:
                    TitleY = this.ScreenTop + this.Height - 1;
                    break;
                case 4 /* MiddleCenter */:
                case 3 /* MiddleLeft */:
                case 5 /* MiddleRight */:
                case 7 /* TopCenter */:
                case 6 /* TopLeft */:
                case 8 /* TopRight */:
                    TitleY = this.ScreenTop;
                    break;
            }

            // Draw title
            Crt.FastWrite(WindowTitle, TitleX, TitleY, new CharInfo(' ', this.ForeColour + (this.BackColour << 4)));
        }
    };

    Object.defineProperty(CrtPanel.prototype, "Text", {
        get: function () {
            return this._Text;
        },
        set: function (value) {
            this._Text = value;
            this.Paint(true);
        },
        enumerable: true,
        configurable: true
    });


    Object.defineProperty(CrtPanel.prototype, "TextAlign", {
        get: function () {
            return this._TextAlign;
        },
        set: function (value) {
            if (value !== this._TextAlign) {
                this._TextAlign = value;
                this.Paint(true);
            }
        },
        enumerable: true,
        configurable: true
    });

    return CrtPanel;
})(CrtControl);
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
var CrtProgressBar = (function (_super) {
    __extends(CrtProgressBar, _super);
    function CrtProgressBar(parent, left, top, width, style) {
        _super.call(this, parent, left, top, width, 1);
        this._LastBarWidth = 9999;
        this._LastMarqueeUpdate = 0;
        this._LastPercentText = '';

        this._Style = style;

        this.BackColour = Crt.BLUE;
        this._BarForeColour = Crt.YELLOW; // TODO This causes blinking orange background behind percent text since Crt unit

        // doesn't support high backgrounds unless you disable blink (so this note is to
        // remind me to allow high backgrounds AND blink, like fTelnet)
        this._BlankForeColour = Crt.LIGHTGRAY;
        this._LastMarqueeUpdate = new Date().getTime();
        this._MarqueeAnimationSpeed = 25;
        this._Maximum = 100;
        this._PercentPrecision = 2;
        this._PercentVisible = true;
        this._Value = 0;

        this.Paint(true);
    }
    Object.defineProperty(CrtProgressBar.prototype, "BarForeColour", {
        get: function () {
            return this._BarForeColour;
        },
        set: function (value) {
            if (value !== this._BarForeColour) {
                this._BarForeColour = value;
                this.Paint(true);
            }
        },
        enumerable: true,
        configurable: true
    });


    Object.defineProperty(CrtProgressBar.prototype, "BlankForeColour", {
        get: function () {
            return this._BlankForeColour;
        },
        set: function (value) {
            if (value !== this._BlankForeColour) {
                this._BlankForeColour = value;
                this.Paint(true);
            }
        },
        enumerable: true,
        configurable: true
    });


    Object.defineProperty(CrtProgressBar.prototype, "MarqueeAnimationSpeed", {
        get: function () {
            return this._MarqueeAnimationSpeed;
        },
        set: function (value) {
            this._MarqueeAnimationSpeed = value;
        },
        enumerable: true,
        configurable: true
    });


    Object.defineProperty(CrtProgressBar.prototype, "Maximum", {
        get: function () {
            return this._Maximum;
        },
        set: function (value) {
            if (value !== this._Maximum) {
                this._Maximum = value;
                if (this._Value > this._Maximum) {
                    this._Value = this._Maximum;
                }
                this.Paint(true);
            }
        },
        enumerable: true,
        configurable: true
    });


    /// <summary>
    /// Re-Draw the bar and percent text.
    /// </summary>
    /// <param name='AForce'>When true, the bar and percent will always be Paintn.
    ///   When false, the bar and percent will only be Paintn as necessary, which reduces the number of unnecessary
    ///   Paints(especially when a large maximum is used)</param>
    CrtProgressBar.prototype.Paint = function (force) {
        if (this._Style === 0 /* Marquee */) {
            if (force) {
                // Erase the old bar
                Crt.FastWrite(StringUtils.NewString(String.fromCharCode(176), this.Width), this.ScreenLeft, this.ScreenTop, new CharInfo(' ', this._BlankForeColour + (this.BackColour << 4)));
            }

            // Draw the new bar
            if (this._Value > 0) {
                if (this._Value > this.Width) {
                    Crt.FastWrite(String.fromCharCode(176), this.ScreenLeft + this.Width - (15 - Math.floor(this._Value - this.Width)), this.ScreenTop, new CharInfo(' ', this._BlankForeColour + (this.BackColour << 4)));
                } else if (this._Value >= 15) {
                    Crt.FastWrite(StringUtils.NewString(String.fromCharCode(219), Math.min(this._Value, 15)), this.ScreenLeft + this._Value - 15, this.ScreenTop, new CharInfo(' ', this._BarForeColour + (this.BackColour << 4)));
                    Crt.FastWrite(String.fromCharCode(176), this.ScreenLeft + this._Value - 15, this.ScreenTop, new CharInfo(' ', this._BlankForeColour + (this.BackColour << 4)));
                } else {
                    Crt.FastWrite(StringUtils.NewString(String.fromCharCode(219), Math.min(this._Value, 15)), this.ScreenLeft, this.ScreenTop, new CharInfo(' ', this._BarForeColour + (this.BackColour << 4)));
                }
            }
        } else {
            // Check if we're forcing an update (probably due to a change in Left, Top, Width, etc)
            if (force) {
                // Yep, so reset the 'Last' variables
                this._LastBarWidth = 9999;
                this._LastPercentText = '';
            }

            var PaintPercentText = false;
            var Percent = this._Value / this._Maximum;
            var NewBarWidth = Math.floor(Percent * this.Width);
            if (NewBarWidth !== this._LastBarWidth) {
                // Check if the bar shrank (if so, we need to delete the old bar)
                if (NewBarWidth < this._LastBarWidth) {
                    // Erase the old bar
                    Crt.FastWrite(StringUtils.NewString(String.fromCharCode(176), this.Width), this.ScreenLeft, this.ScreenTop, new CharInfo(' ', this._BlankForeColour + (this.BackColour << 4)));
                }

                // Draw the new bar
                Crt.FastWrite(StringUtils.NewString(String.fromCharCode(this._Style), NewBarWidth), this.ScreenLeft, this.ScreenTop, new CharInfo(' ', this._BarForeColour + (this.BackColour << 4)));

                this._LastBarWidth = NewBarWidth;
                PaintPercentText = true;
            }

            // Draw the percentage
            if (this._PercentVisible) {
                var NewPercentText = StringUtils.FormatPercent(Percent, this._PercentPrecision);
                if ((NewPercentText !== this._LastPercentText) || (PaintPercentText)) {
                    this._LastPercentText = NewPercentText;

                    var ProgressStart = Math.round((this.Width - NewPercentText.length) / 2);
                    if (ProgressStart >= NewBarWidth) {
                        // Bar hasn't reached the percent text, so draw in the bar's empty color
                        Crt.FastWrite(NewPercentText, this.ScreenLeft + ProgressStart, this.ScreenTop, new CharInfo(' ', this._BlankForeColour + (this.BackColour << 4)));
                    } else if (ProgressStart + NewPercentText.length <= NewBarWidth) {
                        // Bar has passed the percent text, so draw in the bar's foreground colour
                        // (or still use background for Blocks)
                        Crt.FastWrite(NewPercentText, this.ScreenLeft + ProgressStart, this.ScreenTop, new CharInfo(' ', this.BackColour + (this._BarForeColour << 4)));
                    } else {
                        for (var i = 0; i < NewPercentText.length; i++) {
                            var LetterPosition = ProgressStart + i;
                            var FG = (LetterPosition >= NewBarWidth) ? this._BlankForeColour : this.BackColour;
                            var BG = (LetterPosition >= NewBarWidth) ? this.BackColour : this._BarForeColour;
                            Crt.FastWrite(NewPercentText.charAt(i), this.ScreenLeft + LetterPosition, this.ScreenTop, new CharInfo(' ', FG + (BG << 4)));
                        }
                    }
                }
            }
        }
    };

    Object.defineProperty(CrtProgressBar.prototype, "PercentPrecision", {
        get: function () {
            return this._PercentPrecision;
        },
        set: function (value) {
            if (value !== this._PercentPrecision) {
                this._PercentPrecision = value;
                this.Paint(true);
            }
        },
        enumerable: true,
        configurable: true
    });


    Object.defineProperty(CrtProgressBar.prototype, "PercentVisible", {
        get: function () {
            return this._PercentVisible;
        },
        set: function (value) {
            if (value !== this._PercentVisible) {
                this._PercentVisible = value;
                this.Paint(true);
            }
        },
        enumerable: true,
        configurable: true
    });


    CrtProgressBar.prototype.Step = function () {
        this.StepBy(1);
    };

    CrtProgressBar.prototype.StepBy = function (count) {
        this.Value += count;
    };

    Object.defineProperty(CrtProgressBar.prototype, "Style", {
        get: function () {
            return this._Style;
        },
        set: function (style) {
            if (style !== this._Style) {
                this._Style = style;
                this.Paint(true);
            }
        },
        enumerable: true,
        configurable: true
    });


    Object.defineProperty(CrtProgressBar.prototype, "Value", {
        get: function () {
            return this._Value;
        },
        set: function (value) {
            if (value !== this._Value) {
                if (this._Style === 0 /* Marquee */) {
                    if ((new Date()).getTime() - this._LastMarqueeUpdate >= this._MarqueeAnimationSpeed) {
                        // Keep value between 0 and Maximum + 15
                        if (value < 0) {
                            value = 0;
                        }
                        if (value >= this.Width + 15) {
                            value = 0;
                        }
                        this._Value = value;
                        this.Paint(false);
                        this._LastMarqueeUpdate = (new Date()).getTime();
                    }
                } else {
                    // Keep value between 0 and Maximum
                    this._Value = Math.max(0, Math.min(value, this._Maximum));
                    this.Paint(false);
                }
            }
        },
        enumerable: true,
        configurable: true
    });

    return CrtProgressBar;
})(CrtControl);
/*
fTelnet: An HTML5 WebSocket client
Copyright (C) 2009-2013  Rick Parrish, R&M Software
This file is part of fTelnet.
fTelnet is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or any later version.
fTelnet is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY, without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.
You should have received a copy of the GNU Affero General Public License
along with fTelnet.  If not, see <http://www.gnu.org/licenses/>.
*/
var ProgressBarStyle;
(function (ProgressBarStyle) {
    ProgressBarStyle[ProgressBarStyle["Blocks"] = 254] = "Blocks";
    ProgressBarStyle[ProgressBarStyle["Continuous"] = 219] = "Continuous";
    ProgressBarStyle[ProgressBarStyle["Marquee"] = 0] = "Marquee";
})(ProgressBarStyle || (ProgressBarStyle = {}));
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
/// <reference path='CharInfo.ts' />
var Crt = (function () {
    function Crt() {
    }
    Crt.Init = function (parent) {
        var _this = this;
        this._Font = new CrtFont();
        this._Font.onchange.add(function () {
            _this.OnFontChanged();
        });

        // Create the canvas
        this._Canvas = document.createElement('canvas');
        this._Canvas.id = 'fTelnetCanvas';
        this._Canvas.innerHTML = 'Your browser does not support the HTML5 Canvas element!<br>The latest version of every major web browser supports this element, so please consider upgrading now:<ul><li><a href="http://www.mozilla.com/firefox/">Mozilla Firefox</a></li><li><a href="http://www.google.com/chrome">Google Chrome</a></li><li><a href="http://www.apple.com/safari/">Apple Safari</a></li><li><a href="http://www.opera.com/">Opera</a></li><li><a href="http://windows.microsoft.com/en-US/internet-explorer/products/ie/home">MS Internet Explorer</a></li></ul>';
        this._Canvas.width = this._Font.Width * this._ScreenSize.x;
        this._Canvas.height = this._Font.Height * this._ScreenSize.y;

        // Check for Canvas support
        if (!this._Canvas.getContext) {
            console.log('fTelnet Error: Canvas not supported');
            return false;
        }

        // Add crt to parent
        parent.appendChild(this._Canvas);

        // Register keydown and keypress handlers
        window.addEventListener('keydown', function (ke) {
            _this.OnKeyDown(ke);
        }, false); // For special keys
        window.addEventListener('keypress', function (ke) {
            _this.OnKeyPress(ke);
        }, false); // For regular keys

        // Reset the screen buffer
        this.InitBuffers(true);

        // Create the cursor
        this._Cursor = new Cursor(parent, CrtFont.ANSI_COLOURS[this.LIGHTGRAY], this._Font.Size);
        this._Cursor.onhide.add(function () {
            _this.OnBlinkHide();
        });
        this._Cursor.onshow.add(function () {
            _this.OnBlinkShow();
        });

        // Update the WindMin/WindMax records
        this._WindMin = 0;
        this._WindMax = (this._ScreenSize.x - 1) | ((this._ScreenSize.y - 1) << 8);

        // Create the context
        this._CanvasContext = this._Canvas.getContext('2d');
        this._CanvasContext.font = '12pt monospace';
        this._CanvasContext.textBaseline = 'top';
        this.ClrScr();

        return true;
    };

    Object.defineProperty(Crt, "Atari", {
        get: function () {
            return this._Atari;
        },
        set: function (value) {
            this._Atari = value;
        },
        enumerable: true,
        configurable: true
    });


    Crt.Beep = function () {
        /*TODO
        var Duration = 44100 * 0.3; // 0.3 = 300ms
        var Frequency = 440; // 440hz
        
        */
    };

    Object.defineProperty(Crt, "Blink", {
        get: function () {
            return this._Blink;
        },
        set: function (value) {
            this._Blink = value;
        },
        enumerable: true,
        configurable: true
    });


    Object.defineProperty(Crt, "BareLFtoCRLF", {
        get: function () {
            return this._BareLFtoCRLF;
        },
        set: function (value) {
            this._BareLFtoCRLF = value;
        },
        enumerable: true,
        configurable: true
    });


    Object.defineProperty(Crt, "C64", {
        get: function () {
            return this._C64;
        },
        set: function (value) {
            this._C64 = value;
        },
        enumerable: true,
        configurable: true
    });


    Object.defineProperty(Crt, "Canvas", {
        get: function () {
            return this._Canvas;
        },
        enumerable: true,
        configurable: true
    });

    Crt.ClrBol = function () {
        /// <summary>
        /// Clears all characters from the cursor position to the start of the line
        /// without moving the cursor.
        /// </summary>
        /// <remarks>
        /// All character positions are set to blanks with the currently defined text
        /// attributes. Thus, if TextBackground is not black, the current cursor
        /// position to the left edge becomes the background color.
        ///
        /// ClrBol is window-relative.
        /// </remarks>
        this.FastWrite(StringUtils.NewString(' ', this.WhereX()), this.WindMinX + 1, this.WhereYA(), this._CharInfo);
    };

    Crt.ClrBos = function () {
        /// <summary>
        /// Clears the active window from the cursor's current line to the start of the window
        /// </summary>
        /// <remarks>
        /// Sets all character positions from the cursor's current line to the start of the window
        /// to blanks with the currently defined text attributes. Thus, if TextBackground is not
        /// black, the entire screen becomes the background color. This also applies to characters
        /// cleared by ClrEol, InsLine, and DelLine, and to empty lines created by scrolling.
        ///
        /// ClrBos is window-relative.
        /// </remarks>
        // Clear rows before current row
        this.ScrollUpWindow(this.WhereY() - 1);
        this.ScrollDownWindow(this.WhereY() - 1);

        // Clear start of current row
        this.ClrBol();
    };

    Crt.ClrEol = function () {
        /// <summary>
        /// Clears all characters from the cursor position to the end of the line
        /// without moving the cursor.
        /// </summary>
        /// <remarks>
        /// All character positions are set to blanks with the currently defined text
        /// attributes. Thus, if TextBackground is not black, the current cursor
        /// position to the right edge becomes the background color.
        ///
        /// ClrEol is window-relative.
        /// </remarks>
        this.FastWrite(StringUtils.NewString(' ', (this.WindMaxX + 1) - this.WhereX() + 1), this.WhereXA(), this.WhereYA(), this._CharInfo);
    };

    Crt.ClrEos = function () {
        /// <summary>
        /// Clears the active window from the cursor's current line to the end of the window
        /// </summary>
        /// <remarks>
        /// Sets all character positions from the cursor's current line to the end of the window
        /// to blanks with the currently defined text attributes. Thus, if TextBackground is not
        /// black, the entire screen becomes the background color. This also applies to characters
        /// cleared by ClrEol, InsLine, and DelLine, and to empty lines created by scrolling.
        ///
        /// ClrEos is window-relative.
        /// </remarks>
        // Clear rows after current row
        this.ScrollDownWindow(this.WindRows - this.WhereY());
        this.ScrollUpWindow(this.WindRows - this.WhereY());

        // Clear rest of current row
        this.ClrEol();
    };

    Crt.ClrLine = function () {
        /// <summary>
        /// Clears all characters from the cursor position's current line
        /// without moving the cursor.
        /// </summary>
        /// <remarks>
        /// All character positions are set to blanks with the currently defined text
        /// attributes. Thus, if TextBackground is not black, the current cursor
        /// position's line becomes the background color.
        ///
        /// ClrLine is window-relative.
        /// </remarks>
        this.FastWrite(StringUtils.NewString(' ', this.WindCols), this.WindMinX + 1, this.WhereYA(), this._CharInfo);
    };

    Crt.ClrScr = function () {
        /// <summary>
        /// Clears the active windows and returns the cursor to the upper-left corner.
        /// </summary>
        /// <remarks>
        /// Sets all character positions to blanks with the currently defined text
        /// attributes. Thus, if TextBackground is not black, the entire screen becomes
        /// the background color. This also applies to characters cleared by ClrEol,
        /// InsLine, and DelLine, and to empty lines created by scrolling.
        ///
        /// ClrScr is window-relative.
        /// </remarks>
        this.ScrollUpWindow(this.WindRows);
        this.GotoXY(1, 1);
    };

    Crt.Conceal = function () {
        // Set the foreground to the background
        this.TextColor((this.TextAttr & 0xF0) >> 4);
    };

    Object.defineProperty(Crt, "Cursor", {
        get: function () {
            return this._Cursor;
        },
        enumerable: true,
        configurable: true
    });

    Crt.DelChar = function (count) {
        if (typeof count === 'undefined') {
            count = 1;
        }

        var i;
        for (i = this.WhereXA(); i <= this.WindMinX + this.WindCols - count; i++) {
            this.FastWrite(this._Buffer[this.WhereYA()][i + count].Ch, i, this.WhereYA(), this._Buffer[this.WhereYA()][i + count]);
        }
        for (i = this.WindMinX + this.WindCols + 1 - count; i <= this.WindMinX + this.WindCols; i++) {
            this.FastWrite(' ', i, this.WhereYA(), this._CharInfo);
        }
    };

    Crt.DelLine = function (count) {
        /// <summary>
        /// Deletes the line containing the cursor.
        /// </summary>
        /// <remarks>
        /// The line containing the cursor is deleted, and all lines below are moved one
        /// line up (using the BIOS scroll routine). A new line is added at the bottom.
        ///
        /// All character positions are set to blanks with the currently defined text
        /// attributes. Thus, if TextBackground is not black, the new line becomes the
        /// background color.
        /// </remarks>
        if (typeof count === 'undefined') {
            count = 1;
        }
        this.ScrollUpCustom(this.WindMinX + 1, this.WhereYA(), this.WindMaxX + 1, this.WindMaxY + 1, count, this._CharInfo);
    };

    Crt.EnterScrollBack = function () {
        if (!this._InScrollBack) {
            this._InScrollBack = true;

            var NewRow;
            var X;
            var Y;

            // Make copy of current scrollback buffer in temp scrollback buffer
            this._ScrollBackTemp = [];
            for (Y = 0; Y < this._ScrollBack.length; Y++) {
                NewRow = [];
                for (X = 0; X < this._ScrollBack[Y].length; X++) {
                    NewRow.push(new CharInfo(this._ScrollBack[Y][X].Ch, this._ScrollBack[Y][X].Attr, this._ScrollBack[Y][X].Blink, this._ScrollBack[Y][X].Underline, this._ScrollBack[Y][X].Reverse));
                }
                this._ScrollBackTemp.push(NewRow);
            }

            for (Y = 1; Y <= this._ScreenSize.y; Y++) {
                NewRow = [];
                for (X = 1; X <= this._ScreenSize.x; X++) {
                    NewRow.push(new CharInfo(this._Buffer[Y][X].Ch, this._Buffer[Y][X].Attr, this._Buffer[Y][X].Blink, this._Buffer[Y][X].Underline, this._Buffer[Y][X].Reverse));
                }
                this._ScrollBackTemp.push(NewRow);
            }

            // Set our position in the scrollback
            this._ScrollBackPosition = this._ScrollBackTemp.length;
        }
    };

    Crt.FastWrite = function (text, x, y, charInfo, updateBuffer) {
        /// <summary>
        /// Writes a string of text at the desired X/Y coordinate with the given text attribute.
        ///
        /// FastWrite is not window-relative, and it does not wrap text that goes beyond the right edge of the screen.
        /// </summary>
        /// <param name='AText' type='String'>The text to write</param>
        /// <param name='AX' type='Number' integer='true'>The 1-based column to start the text</param>
        /// <param name='AY' type='Number' integer='true'>The 1-based row to start the text</param>
        /// <param name='ACharInfo' type='CharInfo'>The text attribute to colour the text</param>
        /// <param name='AUpdateBuffer' type='Boolean' optional='true'>Whether to update the internal buffer or not
        ///   (default is true)< / param>
        if (typeof updateBuffer === 'undefined') {
            updateBuffer = true;
        }

        if ((x <= this._ScreenSize.x) && (y <= this._ScreenSize.y)) {
            for (var i = 0; i < text.length; i++) {
                var Char = this._Font.GetChar(text.charCodeAt(i), charInfo);
                if (Char) {
                    if ((!this._InScrollBack) || (this._InScrollBack && !updateBuffer)) {
                        this._CanvasContext.putImageData(Char, (x - 1 + i) * this._Font.Width, (y - 1) * this._Font.Height);
                    }
                }

                if (updateBuffer) {
                    this._Buffer[y][x + i].Ch = text.charAt(i);
                    this._Buffer[y][x + i].Attr = charInfo.Attr;
                    this._Buffer[y][x + i].Blink = charInfo.Blink;
                    this._Buffer[y][x + i].Underline = charInfo.Underline;
                    this._Buffer[y][x + i].Reverse = charInfo.Reverse;
                }

                if (x + i >= this._ScreenSize.x) {
                    break;
                }
            }
        }
    };

    Crt.FillScreen = function (ch) {
        var Line = StringUtils.NewString(ch.charAt(0), this.ScreenCols);

        for (var Y = 1; Y <= this.ScreenRows; Y++) {
            this.FastWrite(Line, 1, Y, this._CharInfo);
        }
    };

    Object.defineProperty(Crt, "Font", {
        get: function () {
            return this._Font;
        },
        enumerable: true,
        configurable: true
    });

    Crt.GeCharInfo = function () {
        return this._CharInfo;
    };

    Crt.GotoXY = function (x, y) {
        /// <summary>
        /// Moves the cursor to the given coordinates within the virtual screen.
        /// </summary>
        /// <remarks>
        /// The upper-left corner of the virtual screen corresponds to (1, 1).
        ///
        /// GotoXY is window-relative.
        /// </remarks>
        /// <param name='AX'>The 1-based column to move to</param>
        /// <param name='AY'>The 1-based row to move to</param>
        if ((x >= 1) && (y >= 1) && ((x - 1 + this.WindMinX) <= this.WindMaxX) && ((y - 1 + this.WindMinY) <= this.WindMaxY)) {
            this._Cursor.Position = new Point(x, y);
        }
    };

    Crt.HideCursor = function () {
        this._Cursor.Visible = false;
    };

    Crt.HighVideo = function () {
        /// <summary>
        /// Selects high-intensity characters.
        /// </summary>
        /// <remarks>
        /// There is a Byte variable in Crt TextAttr that is used to hold the current
        /// video attribute. HighVideo sets the high intensity bit of TextAttr's
        /// fore-ground color, thus mapping colors 0-7 onto colors 8-15.
        /// </remarks>
        this.TextAttr |= 0x08;
    };

    // TODO Have to do this here because the static constructor doesn't seem to like the X and Y variables
    Crt.InitBuffers = function (initScrollBack) {
        this._Buffer = [];
        for (var Y = 1; Y <= this._ScreenSize.y; Y++) {
            this._Buffer[Y] = [];
            for (var X = 1; X <= this._ScreenSize.x; X++) {
                this._Buffer[Y][X] = new CharInfo(' ', this.LIGHTGRAY, false, false, false);
            }
        }

        if (initScrollBack) {
            this._ScrollBack = [];
        }
    };

    Crt.InsChar = function (count) {
        if (typeof count === 'undefined') {
            count = 1;
        }

        var i;
        for (i = this.WindMinX + this.WindCols; i >= this.WhereXA() + count; i--) {
            this.FastWrite(this._Buffer[this.WhereYA()][i - count].Ch, i, this.WhereYA(), this._Buffer[this.WhereYA()][i - count]);
        }
        for (i = this.WhereXA(); i < this.WhereXA() + count; i++) {
            this.FastWrite(' ', i, this.WhereYA(), this._CharInfo);
        }
    };

    Crt.InsLine = function (count) {
        /// <summary>
        /// Inserts an empty line at the cursor position.
        /// </summary>
        /// <remarks>
        /// All lines below the inserted line are moved down one line, and the bottom
        /// line scrolls off the screen (using the BIOS scroll routine).
        ///
        /// All character positions are set to blanks with the currently defined text
        /// attributes. Thus, if TextBackground is not black, the new line becomes the
        /// background color.
        ///
        /// InsLine is window-relative.
        /// </remarks>
        if (typeof count === 'undefined') {
            count = 1;
        }
        this.ScrollDownCustom(this.WindMinX + 1, this.WhereYA(), this.WindMaxX + 1, this.WindMaxY + 1, count, this._CharInfo);
    };

    Crt.KeyPressed = function () {
        return (this._KeyBuf.length > 0);
    };

    Object.defineProperty(Crt, "LocalEcho", {
        set: function (value) {
            this._LocalEcho = value;
        },
        enumerable: true,
        configurable: true
    });

    Crt.LowVideo = function () {
        /// <summary>
        /// Selects low intensity characters.
        /// </summary>
        /// <remarks>
        /// There is a Byte variable in Crt--TextAttr--that holds the current video
        /// attribute. LowVideo clears the high-intensity bit of TextAttr's foreground
        /// color, thus mapping colors 8 to 15 onto colors 0 to 7.
        /// </remarks>
        this.TextAttr &= 0xF7;
    };

    Crt.NormVideo = function () {
        /// <summary>
        /// Selects the original text attribute read from the cursor location at startup.
        /// </summary>
        /// <remarks>
        /// There is a Byte variable in Crt--TextAttr--that holds the current video
        /// attribute. NormVideo restores TextAttr to the value it had when the program
        /// was started.
        /// </remarks>
        if (this._C64) {
            this._CharInfo.Attr = this.PETSCII_WHITE;
        } else {
            this._CharInfo.Attr = this.LIGHTGRAY;
        }
        this._CharInfo.Blink = false;
        this._CharInfo.Underline = false;
        this._CharInfo.Reverse = false;
    };

    Crt.OnBlinkHide = function () {
        // Only hide the text if blink is enabled
        if (this._Blink) {
            this._BlinkHidden = true;

            for (var Y = 1; Y <= this._ScreenSize.y; Y++) {
                for (var X = 1; X <= this._ScreenSize.x; X++) {
                    if (this._Buffer[Y][X].Blink) {
                        if (this._Buffer[Y][X].Ch !== ' ') {
                            this.FastWrite(' ', X, Y, this._Buffer[Y][X], false);
                        }
                    }
                }
            }
        }
    };

    Crt.OnBlinkShow = function () {
        // Show the text if blink is enabled, or we need a reset (which happens when blink is diabled while in the hidden state)
        if (this._Blink || this._BlinkHidden) {
            this._BlinkHidden = false;

            for (var Y = 1; Y <= this._ScreenSize.y; Y++) {
                for (var X = 1; X <= this._ScreenSize.x; X++) {
                    if (this._Buffer[Y][X].Blink) {
                        if (this._Buffer[Y][X].Ch !== ' ') {
                            this.FastWrite(this._Buffer[Y][X].Ch, X, Y, this._Buffer[Y][X], false);
                        }
                    }
                }
            }
        }

        // Reposition the cursor
        this._Cursor.WindowOffset = Offset.getOffset(this._Canvas);
    };

    Crt.OnFontChanged = function () {
        // Resize the cursor
        this._Cursor.Size = this._Font.Size;

        // Update the canvas
        this._Canvas.height = this._Font.Height * this._ScreenSize.y;
        this._Canvas.width = this._Font.Width * this._ScreenSize.x;

        // Restore the screen contents
        if (this._Buffer !== null) {
            for (var Y = 1; Y <= this._ScreenSize.y; Y++) {
                for (var X = 1; X <= this._ScreenSize.x; X++) {
                    this.FastWrite(this._Buffer[Y][X].Ch, X, Y, this._Buffer[Y][X], false);
                }
            }
        }

        this.onfontchange.trigger();
    };

    Crt.OnKeyDown = function (ke) {
        // Skip out if we've focused an input element
        if ((ke.target instanceof HTMLInputElement) || (ke.target instanceof HTMLTextAreaElement)) {
            return;
        }

        if (this._InScrollBack) {
            var i;
            var X;
            var XEnd;
            var Y;
            var YDest;
            var YSource;

            if (ke.keyCode === 40 /* DOWN */) {
                if (this._ScrollBackPosition < this._ScrollBackTemp.length) {
                    this._ScrollBackPosition += 1;
                    this.ScrollUpCustom(1, 1, this._ScreenSize.x, this._ScreenSize.y, 1, new CharInfo(' ', 7, false, false, false), false);

                    YDest = this._ScreenSize.y;
                    YSource = this._ScrollBackPosition - 1;
                    XEnd = Math.min(this._ScreenSize.x, this._ScrollBackTemp[YSource].length);
                    for (X = 0; X < XEnd; X++) {
                        this.FastWrite(this._ScrollBackTemp[YSource][X].Ch, X + 1, YDest, this._ScrollBackTemp[YSource][X], false);
                    }
                }
            } else if (ke.keyCode === 27 /* ESCAPE */) {
                // Restore the screen contents
                if (this._Buffer !== null) {
                    for (Y = 1; Y <= this._ScreenSize.y; Y++) {
                        for (X = 1; X <= this._ScreenSize.x; X++) {
                            this.FastWrite(this._Buffer[Y][X].Ch, X, Y, this._Buffer[Y][X], false);
                        }
                    }
                }

                this._InScrollBack = false;
            } else if (ke.keyCode === 34 /* PAGE_DOWN */) {
                for (i = 0; i < this._ScreenSize.y; i++) {
                    this.PushKeyDown(40 /* DOWN */, 40 /* DOWN */, false, false, false);
                }
            } else if (ke.keyCode === 33 /* PAGE_UP */) {
                for (i = 0; i < this._ScreenSize.y; i++) {
                    this.PushKeyDown(38 /* UP */, 38 /* UP */, false, false, false);
                }
            } else if (ke.keyCode === 38 /* UP */) {
                if (this._ScrollBackPosition > this._ScreenSize.y) {
                    this._ScrollBackPosition -= 1;
                    this.ScrollDownCustom(1, 1, this._ScreenSize.x, this._ScreenSize.y, 1, new CharInfo(' ', 7, false, false), false);

                    YDest = 1;
                    YSource = this._ScrollBackPosition - this._ScreenSize.y;
                    XEnd = Math.min(this._ScreenSize.x, this._ScrollBackTemp[YSource].length);
                    for (X = 0; X < XEnd; X++) {
                        this.FastWrite(this._ScrollBackTemp[YSource][X].Ch, X + 1, YDest, this._ScrollBackTemp[YSource][X], false);
                    }
                }
            }

            ke.preventDefault();

            return;
        }

        var keyString = '';

        if (this._Atari) {
            if (ke.ctrlKey) {
                if ((ke.keyCode >= 65) && (ke.keyCode <= 90)) {
                    switch (ke.keyCode) {
                        case 72:
                            keyString = String.fromCharCode(126);
                            break;
                        case 74:
                            keyString = String.fromCharCode(13);
                            break;
                        case 77:
                            keyString = String.fromCharCode(155);
                            break;
                        default:
                            keyString = String.fromCharCode(ke.keyCode - 64);
                            break;
                    }
                } else if ((ke.keyCode >= 97) && (ke.keyCode <= 122)) {
                    switch (ke.keyCode) {
                        case 104:
                            keyString = String.fromCharCode(126);
                            break;
                        case 106:
                            keyString = String.fromCharCode(13);
                            break;
                        case 109:
                            keyString = String.fromCharCode(155);
                            break;
                        default:
                            keyString = String.fromCharCode(ke.keyCode - 96);
                            break;
                    }
                }
            } else {
                switch (ke.keyCode) {
                    case 8 /* BACKSPACE */:
                        keyString = '\x7E';
                        break;
                    case 46 /* DELETE */:
                        keyString = '\x7E';
                        break;
                    case 40 /* DOWN */:
                        keyString = '\x1D';
                        break;
                    case 13 /* ENTER */:
                        keyString = '\x9B';
                        break;
                    case 37 /* LEFT */:
                        keyString = '\x1E';
                        break;
                    case 39 /* RIGHT */:
                        keyString = '\x1F';
                        break;
                    case 32 /* SPACE */:
                        keyString = ' ';
                        break;
                    case 9 /* TAB */:
                        keyString = '\x7F';
                        break;
                    case 38 /* UP */:
                        keyString = '\x1C';
                        break;
                }
            }
        } else if (this._C64) {
            switch (ke.keyCode) {
                case 8 /* BACKSPACE */:
                    keyString = '\x14';
                    break;
                case 46 /* DELETE */:
                    keyString = '\x14';
                    break;
                case 40 /* DOWN */:
                    keyString = '\x11';
                    break;
                case 13 /* ENTER */:
                    keyString = '\r';
                    break;
                case 112 /* F1 */:
                    keyString = '\x85';
                    break;
                case 113 /* F2 */:
                    keyString = '\x89';
                    break;
                case 114 /* F3 */:
                    keyString = '\x86';
                    break;
                case 115 /* F4 */:
                    keyString = '\x8A';
                    break;
                case 116 /* F5 */:
                    keyString = '\x87';
                    break;
                case 117 /* F6 */:
                    keyString = '\x8B';
                    break;
                case 118 /* F7 */:
                    keyString = '\x88';
                    break;
                case 119 /* F8 */:
                    keyString = '\x8C';
                    break;
                case 36 /* HOME */:
                    keyString = '\x13';
                    break;
                case 45 /* INSERT */:
                    keyString = '\x94';
                    break;
                case 37 /* LEFT */:
                    keyString = '\x9D';
                    break;
                case 39 /* RIGHT */:
                    keyString = '\x1D';
                    break;
                case 32 /* SPACE */:
                    keyString = ' ';
                    break;
                case 38 /* UP */:
                    keyString = '\x91';
                    break;
            }
        } else {
            if (ke.ctrlKey) {
                // Handle control + letter keys
                if ((ke.keyCode >= 65) && (ke.keyCode <= 90)) {
                    keyString = String.fromCharCode(ke.keyCode - 64);
                } else if ((ke.keyCode >= 97) && (ke.keyCode <= 122)) {
                    keyString = String.fromCharCode(ke.keyCode - 96);
                }
            } else {
                switch (ke.keyCode) {
                    case 8 /* BACKSPACE */:
                        keyString = '\b';
                        break;
                    case 46 /* DELETE */:
                        keyString = '\x7F';
                        break;
                    case 40 /* DOWN */:
                        keyString = '\x1B[B';
                        break;
                    case 35 /* END */:
                        keyString = '\x1B[K';
                        break;
                    case 13 /* ENTER */:
                        keyString = '\r\n';
                        break;
                    case 27 /* ESCAPE */:
                        keyString = '\x1B';
                        break;
                    case 112 /* F1 */:
                        keyString = '\x1BOP';
                        break;
                    case 113 /* F2 */:
                        keyString = '\x1BOQ';
                        break;
                    case 114 /* F3 */:
                        keyString = '\x1BOR';
                        break;
                    case 115 /* F4 */:
                        keyString = '\x1BOS';
                        break;
                    case 116 /* F5 */:
                        keyString = '\x1BOt';
                        break;
                    case 117 /* F6 */:
                        keyString = '\x1B[17~';
                        break;
                    case 118 /* F7 */:
                        keyString = '\x1B[18~';
                        break;
                    case 119 /* F8 */:
                        keyString = '\x1B[19~';
                        break;
                    case 120 /* F9 */:
                        keyString = '\x1B[20~';
                        break;
                    case 121 /* F10 */:
                        keyString = '\x1B[21~';
                        break;
                    case 122 /* F11 */:
                        keyString = '\x1B[23~';
                        break;
                    case 123 /* F12 */:
                        keyString = '\x1B[24~';
                        break;
                    case 36 /* HOME */:
                        keyString = '\x1B[H';
                        break;
                    case 45 /* INSERT */:
                        keyString = '\x1B@';
                        break;
                    case 37 /* LEFT */:
                        keyString = '\x1B[D';
                        break;
                    case 34 /* PAGE_DOWN */:
                        keyString = '\x1B[U';
                        break;
                    case 33 /* PAGE_UP */:
                        keyString = '\x1B[V';
                        break;
                    case 39 /* RIGHT */:
                        keyString = '\x1B[C';
                        break;
                    case 32 /* SPACE */:
                        keyString = ' ';
                        break;
                    case 9 /* TAB */:
                        keyString = '\t';
                        break;
                    case 38 /* UP */:
                        keyString = '\x1B[A';
                        break;
                }
            }
        }

        this._KeyBuf.push(new KeyPressEvent(ke, keyString));

        if ((keyString) || (ke.ctrlKey)) {
            ke.preventDefault();
        }
    };

    Crt.OnKeyPress = function (ke) {
        // Skip out if we've focused an input element
        if ((ke.target instanceof HTMLInputElement) || (ke.target instanceof HTMLTextAreaElement)) {
            return;
        }

        if (this._InScrollBack) {
            return;
        }

        var keyString = '';

        if (ke.ctrlKey) {
            return;
        }

        // Opera doesn't give us the charCode, so try which in that case
        var which = (ke.charCode !== null) ? ke.charCode : ke.which;
        if (this._Atari) {
            if ((which >= 33) && (which <= 122)) {
                keyString = String.fromCharCode(which);
            }
        } else if (this._C64) {
            if ((which >= 33) && (which <= 64)) {
                keyString = String.fromCharCode(which);
            } else if ((which >= 65) && (which <= 90)) {
                keyString = String.fromCharCode(which).toLowerCase();
            } else if ((which >= 91) && (which <= 95)) {
                keyString = String.fromCharCode(which);
            } else if ((which >= 97) && (which <= 122)) {
                keyString = String.fromCharCode(which).toUpperCase();
            }
        } else {
            if ((which >= 33) && (which <= 126)) {
                keyString = String.fromCharCode(which);
            }
        }

        this._KeyBuf.push(new KeyPressEvent(ke, keyString));

        if (keyString) {
            ke.preventDefault();
        }
    };

    Crt.PushKeyDown = function (pushedCharCode, pushedKeyCode, ctrl, alt, shift) {
        this.OnKeyDown({
            altKey: alt,
            charCode: pushedCharCode,
            ctrlKey: ctrl,
            keyCode: pushedKeyCode,
            shiftKey: shift,
            preventDefault: function () {
            }
        });
    };

    Crt.PushKeyPress = function (pushedCharCode, pushedKeyCode, ctrl, alt, shift) {
        this.OnKeyPress({
            altKey: alt,
            charCode: pushedCharCode,
            ctrlKey: ctrl,
            keyCode: pushedKeyCode,
            shiftKey: shift,
            preventDefault: function () {
            }
        });
    };

    Crt.ReadKey = function () {
        if (this._KeyBuf.length === 0) {
            return null;
        }

        var KPE = this._KeyBuf.shift();
        if (this._LocalEcho) {
            this.Write(KPE.keyString);
        }
        return KPE;
    };

    Crt.ReDraw = function () {
        for (var Y = 1; Y <= this._ScreenSize.y; Y++) {
            for (var X = 1; X <= this._ScreenSize.x; X++) {
                this.FastWrite(this._Buffer[Y][X].Ch, X, Y, this._Buffer[Y][X], false);
            }
        }
    };

    Crt.RestoreScreen = function (buffer, left, top, right, bottom) {
        var Height = bottom - top + 1;
        var Width = right - left + 1;

        for (var Y = 0; Y < Height; Y++) {
            for (var X = 0; X < Width; X++) {
                this.FastWrite(buffer[Y][X].Ch, X + left, Y + top, buffer[Y][X]);
            }
        }
    };

    Crt.ReverseVideo = function () {
        /// <summary>
        /// Reverses the foreground and background text attributes
        /// </summary>
        this.TextAttr = ((this.TextAttr & 0xF0) >> 4) | ((this.TextAttr & 0x0F) << 4);
    };

    Crt.SaveScreen = function (left, top, right, bottom) {
        var Height = bottom - top + 1;
        var Width = right - left + 1;
        var Result = [];

        for (var Y = 0; Y < Height; Y++) {
            Result[Y] = [];
            for (var X = 0; X < Width; X++) {
                Result[Y][X] = new CharInfo(this._Buffer[Y + top][X + left].Ch, this._Buffer[Y + top][X + left].Attr, this._Buffer[Y + top][X + left].Blink, this._Buffer[Y + top][X + left].Underline, this._Buffer[Y + top][X + left].Reverse);
            }
        }

        return Result;
    };

    Object.defineProperty(Crt, "ScreenCols", {
        get: function () {
            return this._ScreenSize.x;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Crt, "ScreenRows", {
        get: function () {
            return this._ScreenSize.y;
        },
        enumerable: true,
        configurable: true
    });

    Crt.ScrollDownCustom = function (left, top, right, bottom, count, charInfo, updateBuffer) {
        /// <summary>
        /// Scrolls the given window down the given number of lines (leaving blank lines at the top),
        /// filling the void with the given character with the given text attribute
        /// </summary>
        /// <param name='AX1'>The 1-based left column of the window</param>
        /// <param name='AY1'>The 1-based top row of the window</param>
        /// <param name='AX2'>The 1-based right column of the window</param>
        /// <param name='AY2'>The 1-based bottom row of the window</param>
        /// <param name='ALines'>The number of lines to scroll</param>
        /// <param name='ACh'>The character to fill the void with</param>
        /// <param name='ACharInfo'>The text attribute to fill the void with</param>
        // Handle optional parameters
        if (typeof updateBuffer === 'undefined') {
            updateBuffer = true;
        }

        // Validate the ALines parameter
        var MaxLines = bottom - top + 1;
        if (count > MaxLines) {
            count = MaxLines;
        }

        // Scroll -- TODO Hasn't been tested yet
        var Left = (left - 1) * this._Font.Width;
        var Top = (top - 1) * this._Font.Height;
        var Width = (right - left + 1) * this._Font.Width;
        var Height = ((bottom - top + 1 - count) * this._Font.Height);
        if (Height > 0) {
            var Buf = this._CanvasContext.getImageData(Left, Top, Width, Height);
            Left = (left - 1) * this._Font.Width;
            Top = (top - 1 + count) * this._Font.Height;
            this._CanvasContext.putImageData(Buf, Left, Top);
        }

        // Blank -- TODO Hasn't been tested yet
        this._CanvasContext.fillStyle = CrtFont.ANSI_COLOURS[(charInfo.Attr & 0xF0) >> 4];
        Left = (left - 1) * this._Font.Width;
        Top = (top - 1) * this._Font.Height;
        Width = (right - left + 1) * this._Font.Width;
        Height = (count * this._Font.Height);
        this._CanvasContext.fillRect(Left, Top, Width, Height);

        if (updateBuffer) {
            // Now to adjust the buffer
            var X = 0;
            var Y = 0;

            for (Y = bottom; Y > count; Y--) {
                for (X = left; X <= right; X++) {
                    this._Buffer[Y][X].Ch = this._Buffer[Y - count][X].Ch;
                    this._Buffer[Y][X].Attr = this._Buffer[Y - count][X].Attr;
                    this._Buffer[Y][X].Blink = this._Buffer[Y - count][X].Blink;
                    this._Buffer[Y][X].Underline = this._Buffer[Y - count][X].Underline;
                    this._Buffer[Y][X].Reverse = this._Buffer[Y - count][X].Reverse;
                }
            }

            for (Y = top; Y <= count; Y++) {
                for (X = left; X <= right; X++) {
                    this._Buffer[Y][X].Ch = charInfo.Ch;
                    this._Buffer[Y][X].Attr = charInfo.Attr;
                    this._Buffer[Y][X].Blink = charInfo.Blink;
                    this._Buffer[Y][X].Underline = charInfo.Underline;
                    this._Buffer[Y][X].Reverse = charInfo.Reverse;
                }
            }
        }
    };

    Crt.ScrollDownScreen = function (count) {
        /// <summary>
        /// Scrolls the screen down the given number of lines (leaving blanks at the top)
        /// </summary>
        /// <param name='ALines'>The number of lines to scroll</param>
        this.ScrollDownCustom(1, 1, this._ScreenSize.x, this._ScreenSize.y, count, this._CharInfo);
    };

    Crt.ScrollDownWindow = function (count) {
        /// <summary>
        /// Scrolls the current window down the given number of lines (leaving blanks at the top)
        /// </summary>
        /// <param name='ALines'>The number of lines to scroll</param>
        this.ScrollDownCustom(this.WindMinX + 1, this.WindMinY + 1, this.WindMaxX + 1, this.WindMaxY + 1, count, this._CharInfo);
    };

    Crt.ScrollUpCustom = function (left, top, right, bottom, count, charInfo, updateBuffer) {
        /// <summary>
        /// Scrolls the given window up the given number of lines (leaving blank lines at the bottom),
        /// filling the void with the given character with the given text attribute
        /// </summary>
        /// <param name='AX1'>The 1-based left column of the window</param>
        /// <param name='AY1'>The 1-based top row of the window</param>
        /// <param name='AX2'>The 1-based right column of the window</param>
        /// <param name='AY2'>The 1-based bottom row of the window</param>
        /// <param name='ALines'>The number of lines to scroll</param>
        /// <param name='ACh'>The character to fill the void with</param>
        /// <param name='ACharInfo'>The text attribute to fill the void with</param>
        // Handle optional parameters
        if (typeof updateBuffer === 'undefined') {
            updateBuffer = true;
        }

        // Validate the ALines parameter
        var MaxLines = bottom - top + 1;
        if (count > MaxLines) {
            count = MaxLines;
        }

        if ((!this._InScrollBack) || (this._InScrollBack && !updateBuffer)) {
            // Scroll
            var Left = (left - 1) * this._Font.Width;
            var Top = (top - 1 + count) * this._Font.Height;
            var Width = (right - left + 1) * this._Font.Width;
            var Height = ((bottom - top + 1 - count) * this._Font.Height);
            if (Height > 0) {
                var Buf = this._CanvasContext.getImageData(Left, Top, Width, Height);
                Left = (left - 1) * this._Font.Width;
                Top = (top - 1) * this._Font.Height;
                this._CanvasContext.putImageData(Buf, Left, Top);
            }

            // Blank
            this._CanvasContext.fillStyle = CrtFont.ANSI_COLOURS[(charInfo.Attr & 0xF0) >> 4];
            Left = (left - 1) * this._Font.Width;
            Top = (bottom - count) * this._Font.Height;
            Width = (right - left + 1) * this._Font.Width;
            Height = (count * this._Font.Height);
            this._CanvasContext.fillRect(Left, Top, Width, Height);
        }

        if (updateBuffer) {
            // Now to adjust the buffer
            var NewRow;
            var X;
            var Y;

            for (Y = 0; Y < count; Y++) {
                NewRow = [];
                for (X = left; X <= right; X++) {
                    NewRow.push(new CharInfo(this._Buffer[Y + top][X].Ch, this._Buffer[Y + top][X].Attr, this._Buffer[Y + top][X].Blink, this._Buffer[Y + top][X].Underline, this._Buffer[Y + top][X].Reverse));
                }
                this._ScrollBack.push(NewRow);
            }

            // Trim the scrollback to 1000 lines, if necessary
            var ScrollBackLength = this._ScrollBack.length;
            while (ScrollBackLength > (this._ScrollBackSize - 2)) {
                this._ScrollBack.shift();
                ScrollBackLength -= 1;
            }

            for (Y = top; Y <= (bottom - count); Y++) {
                for (X = left; X <= right; X++) {
                    this._Buffer[Y][X].Ch = this._Buffer[Y + count][X].Ch;
                    this._Buffer[Y][X].Attr = this._Buffer[Y + count][X].Attr;
                    this._Buffer[Y][X].Blink = this._Buffer[Y + count][X].Blink;
                    this._Buffer[Y][X].Underline = this._Buffer[Y + count][X].Underline;
                    this._Buffer[Y][X].Reverse = this._Buffer[Y + count][X].Reverse;
                }
            }

            for (Y = bottom; Y > (bottom - count); Y--) {
                for (X = left; X <= right; X++) {
                    this._Buffer[Y][X].Ch = charInfo.Ch;
                    this._Buffer[Y][X].Attr = charInfo.Attr;
                    this._Buffer[Y][X].Blink = charInfo.Blink;
                    this._Buffer[Y][X].Underline = charInfo.Underline;
                    this._Buffer[Y][X].Reverse = charInfo.Reverse;
                }
            }
        }
    };

    Crt.ScrollUpScreen = function (count) {
        /// <summary>
        /// Scrolls the screen up the given number of lines (leaving blanks at the bottom)
        /// </summary>
        /// <param name='ALines'>The number of lines to scroll</param>
        this.ScrollUpCustom(1, 1, this._ScreenSize.x, this._ScreenSize.y, count, this._CharInfo);
    };

    Crt.ScrollUpWindow = function (count) {
        /// <summary>
        /// Scrolls the current window up the given number of lines (leaving blanks at the bottom)
        /// </summary>
        /// <param name='ALines'>The number of lines to scroll</param>
        this.ScrollUpCustom(this.WindMinX + 1, this.WindMinY + 1, this.WindMaxX + 1, this.WindMaxY + 1, count, this._CharInfo);
    };

    Crt.SetBlink = function (value) {
        this._CharInfo.Blink = value;
    };

    Crt.SetBlinkRate = function (milliSeconds) {
        this._Cursor.BlinkRate = milliSeconds;
    };

    Crt.SetCharInfo = function (charInfo) {
        this._CharInfo = new CharInfo(charInfo.Ch, charInfo.Attr, charInfo.Blink, charInfo.Underline, charInfo.Reverse);
    };

    Crt.SetFont = function (codePage, width, height) {
        /// <summary>
        /// Try to set the console font size to characters with the given X and Y size
        /// </summary>
        /// <param name='AX'>The horizontal size</param>
        /// <param name='AY'>The vertical size</param>
        /// <returns>True if the size was found and set, False if the size was not available</returns>
        // Request the new font
        return this._Font.Load(codePage, width, height);
    };

    // TODO Doesn't seem to be working
    Crt.SetScreenSize = function (columns, rows) {
        // Check if we're in scrollback
        if (this._InScrollBack) {
            return;
        }

        // Check if the requested size is already in use
        if ((columns === this._ScreenSize.x) && (rows === this._ScreenSize.y)) {
            return;
        }

        var X = 0;
        var Y = 0;

        // Save the old details
        var OldBuffer;
        if (this._Buffer !== null) {
            OldBuffer = [];
            for (Y = 1; Y <= this._ScreenSize.y; Y++) {
                OldBuffer[Y] = [];
                for (X = 1; X <= this._ScreenSize.x; X++) {
                    OldBuffer[Y][X] = new CharInfo(this._Buffer[Y][X].Ch, this._Buffer[Y][X].Attr, this._Buffer[Y][X].Blink, this._Buffer[Y][X].Underline, this._Buffer[Y][X].Reverse);
                }
            }
        }
        var OldScreenSize = new Point(this._ScreenSize.x, this._ScreenSize.y);

        // Set the new console screen size
        this._ScreenSize.x = columns;
        this._ScreenSize.y = rows;

        // Update the WindMin/WindMax records
        this._WindMin = 0;
        this._WindMax = (this._ScreenSize.x - 1) | ((this._ScreenSize.y - 1) << 8);

        // Reset the screen buffer
        this.InitBuffers(false);

        // Restore the screen contents
        // TODO If new screen is smaller than old screen, restore bottom portion not top portion
        if (OldBuffer !== null) {
            for (Y = 1; Y <= Math.min(this._ScreenSize.y, OldScreenSize.y); Y++) {
                for (X = 1; X <= Math.min(this._ScreenSize.x, OldScreenSize.x); X++) {
                    this.FastWrite(OldBuffer[Y][X].Ch, X, Y, OldBuffer[Y][X]);
                }
            }
        }

        // Let the program know about the update
        this.onscreensizechange.trigger();
    };

    Crt.ShowCursor = function () {
        this._Cursor.Visible = true;
    };

    Object.defineProperty(Crt, "TextAttr", {
        get: function () {
            /// <summary>
            /// Stores currently selected text attributes
            /// </summary>
            /// <remarks>
            /// The text attributes are normally set through calls to TextColor and
            /// TextBackground.
            ///
            /// However, you can also set them by directly storing a value in TextAttr.
            /// </remarks>
            return this._CharInfo.Attr;
        },
        set: function (value) {
            this._CharInfo.Attr = value;
        },
        enumerable: true,
        configurable: true
    });


    Crt.TextBackground = function (colour) {
        /// <summary>
        /// Selects the background color.
        /// </summary>
        /// <remarks>
        /// Color is an integer expression in the range 0..7, corresponding to one of
        /// the first eight text color constants. There is a byte variable in
        /// Crt--TextAttr--that is used to hold the current video attribute.
        /// TextBackground sets bits 4-6 of TextAttr to Color.
        ///
        /// The background of all characters subsequently written will be in the
        /// specified color.
        /// </remarks>
        /// <param name='AColor'>The colour to set the background to</param>
        this.TextAttr = (this.TextAttr & 0x0F) | ((colour & 0x0F) << 4);
    };

    Crt.TextColor = function (colour) {
        /// <summary>
        /// Selects the foreground character color.
        /// </summary>
        /// <remarks>
        /// Color is an integer expression in the range 0..15, corresponding to one of
        /// the text color constants defined in Crt.
        ///
        /// There is a byte-type variable Crt--TextAttr--that is used to hold the
        /// current video attribute. TextColor sets bits 0-3 to Color. If Color is
        /// greater than 15, the blink bit (bit 7) is also set; otherwise, it is
        /// cleared.
        ///
        /// You can make characters blink by adding 128 to the color value. The Blink
        /// constant is defined for that purpose; in fact, for compatibility with Turbo
        /// Pascal 3.0, any Color value above 15 causes the characters to blink. The
        /// foreground of all characters subsequently written will be in the specified
        /// color.
        /// </remarks>
        /// <param name='AColor'>The colour to set the foreground to</param>
        this.TextAttr = (this.TextAttr & 0xF0) | (colour & 0x0F);
    };

    Crt.WhereX = function () {
        /// <summary>
        /// Returns the CP's X coordinate of the current cursor location.
        /// </summary>
        /// <remarks>
        /// WhereX is window-specific.
        /// </remarks>
        /// <returns>The 1-based column of the window the cursor is currently in</returns>
        return this._Cursor.Position.x;
    };

    Crt.WhereXA = function () {
        /// <summary>
        /// Returns the CP's X coordinate of the current cursor location.
        /// </summary>
        /// <remarks>
        /// WhereXA is not window-specific.
        /// </remarks>
        /// <returns>The 1-based column of the screen the cursor is currently in</returns>
        return this.WhereX() + this.WindMinX;
    };

    /// <summary>
    /// Returns the CP's Y coordinate of the current cursor location.
    /// </summary>
    /// <remarks>
    /// WhereY is window-specific.
    /// </remarks>
    /// <returns>The 1-based row of the window the cursor is currently in</returns>
    Crt.WhereY = function () {
        return this._Cursor.Position.y;
    };

    Crt.WhereYA = function () {
        /// <summary>
        /// Returns the CP's Y coordinate of the current cursor location.
        /// </summary>
        /// <remarks>
        /// WhereYA is now window-specific.
        /// </remarks>
        /// <returns>The 1-based row of the screen the cursor is currently in</returns>
        return this.WhereY() + this.WindMinY;
    };

    Object.defineProperty(Crt, "WindCols", {
        get: function () {
            /// <summary>
            /// The number of columns found in the currently defined window
            /// </summary>
            return this.WindMaxX - this.WindMinX + 1;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Crt, "WindMax", {
        get: function () {
            /// <summary>
            /// The 0-based lower right coordinate of the current window
            /// </summary>
            return this._WindMax;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Crt, "WindMaxX", {
        get: function () {
            /// <summary>
            /// The 0-based left column of the current window
            /// </summary>
            return (this.WindMax & 0x00FF);
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Crt, "WindMaxY", {
        get: function () {
            /// <summary>
            /// The 0-based right column of the current window
            /// </summary>
            return ((this.WindMax & 0xFF00) >> 8);
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Crt, "WindMin", {
        get: function () {
            /// <summary>
            /// The 0-based upper left coordinate of the current window
            /// </summary>
            return this._WindMin;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Crt, "WindMinX", {
        get: function () {
            /// <summary>
            /// The 0-based top row of the current window
            /// </summary>
            return (this.WindMin & 0x00FF);
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Crt, "WindMinY", {
        get: function () {
            /// <summary>
            /// The 0-based bottom row of the current window
            /// </summary>
            return ((this.WindMin & 0xFF00) >> 8);
        },
        enumerable: true,
        configurable: true
    });

    Crt.Window = function (left, top, right, bottom) {
        /// <summary>
        /// Defines a text window on the screen.
        /// </summary>
        /// <remarks>
        /// X1 and Y1 are the coordinates of the upper left corner of the window, and X2
        /// and Y2 are the coordinates of the lower right corner. The upper left corner
        /// of the screen corresponds to (1, 1). The minimum size of a text window is
        /// one column by one line. If the coordinates are invalid in any way, the call
        /// to Window is ignored.
        ///
        /// The default window is (1, 1, 80, 25) in 25-line mode, and (1, 1, 80, 43) in
        /// 43-line mode, corresponding to the entire screen.
        ///
        /// All screen coordinates (except the window coordinates themselves) are
        /// relative to the current window. For instance, GotoXY(1, 1) will always
        /// position the cursor in the upper left corner of the current window.
        ///
        /// Many Crt procedures and functions are window-relative, including ClrEol,
        /// ClrScr, DelLine, GotoXY, InsLine, WhereX, WhereY, Read, Readln, Write,
        /// Writeln.
        ///
        /// WindMin and WindMax store the current window definition. A call to the
        /// Window procedure always moves the cursor to (1, 1).
        /// </remarks>
        /// <param name='AX1'>The 1-based left column of the window</param>
        /// <param name='AY1'>The 1-based top row of the window</param>
        /// <param name='AX2'>The 1-based right column of the window</param>
        /// <param name='AY2'>The 1-based bottom row of the window</param>
        if ((left >= 1) && (top >= 1) && (left <= right) && (top <= bottom)) {
            if ((right <= this._ScreenSize.x) && (bottom <= this._ScreenSize.y)) {
                this._WindMin = (left - 1) + ((top - 1) << 8);
                this._WindMax = (right - 1) + ((bottom - 1) << 8);
                this._Cursor.WindowOffset = new Point(left - 1, top - 1);
                this.GotoXY(1, 1);
            }
        }
    };

    Object.defineProperty(Crt, "WindRows", {
        get: function () {
            /// <summary>
            /// The number of rows found in the currently defined window
            /// </summary>
            return this.WindMaxY - this.WindMinY + 1;
        },
        enumerable: true,
        configurable: true
    });

    Crt.Write = function (text) {
        /// <summary>
        /// Writes a given line of text to the screen.
        /// </summary>
        /// <remarks>
        /// Text is wrapped if it exceeds the right edge of the window
        /// </remarks>
        /// <param name='AText'>The text to print to the screen</param>
        if (this._Atari) {
            this.WriteATASCII(text);
        } else if (this._C64) {
            this.WritePETSCII(text);
        } else {
            this.WriteASCII(text);
        }
    };

    Crt.WriteASCII = function (text) {
        if (typeof text === 'undefined') {
            text = '';
        }

        var X = this.WhereX();
        var Y = this.WhereY();
        var Buf = '';

        for (var i = 0; i < text.length; i++) {
            var DoGoto = false;

            if (text.charCodeAt(i) === 0x00) {
                // NULL, ignore
                i += 0; // Make JSLint happy (doesn't like empty block)
            } else if (text.charCodeAt(i) === 0x07) {
                this.Beep();
            } else if (text.charCodeAt(i) === 0x08) {
                // Backspace, need to flush buffer before moving cursor
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                if (X > 1) {
                    X -= 1;
                }
                DoGoto = true;

                Buf = '';
            } else if (text.charCodeAt(i) === 0x09) {
                // Tab, need to flush buffer before moving cursor
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                Buf = '';

                // Figure out where the next tabstop is
                if (X === this.WindCols) {
                    // Cursor is in last position, tab goes to the first position of the next line
                    X = 1;
                    Y += 1;
                } else {
                    // Cursor goes to the next multiple of 8
                    X += 8 - (X % 8);

                    // Make sure we didn't tab beyond the width of the window (can happen if width of window is not
                    // divisible by 8)
                    X = Math.min(X, this.WindCols);
                }
                DoGoto = true;
            } else if (text.charCodeAt(i) === 0x0A) {
                // Line feed, need to flush buffer before moving cursor
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                if (this._BareLFtoCRLF && (this._LastChar !== 0x0D)) {
                    // Bare LF, so pretend we also got a CR
                    X = 1;
                } else {
                    X += Buf.length;
                }
                Y += 1;
                DoGoto = true;

                Buf = '';
            } else if (text.charCodeAt(i) === 0x0C) {
                // Clear the screen
                this.ClrScr();

                // Reset the variables
                X = 1;
                Y = 1;
                Buf = '';
            } else if (text.charCodeAt(i) === 0x0D) {
                // Carriage return, need to flush buffer before moving cursor
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X = 1;
                DoGoto = true;

                Buf = '';
            } else if (text.charCodeAt(i) !== 0) {
                // Append character to buffer
                Buf += String.fromCharCode(text.charCodeAt(i) & 0xFF);

                // Check if we've passed the right edge of the window
                if ((X + Buf.length) > this.WindCols) {
                    // We have, need to flush buffer before moving cursor
                    this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                    Buf = '';

                    X = 1;
                    Y += 1;
                    DoGoto = true;
                }
            }

            // Store the last character (we use this for BareLFtoCRLF)
            this._LastChar = text.charCodeAt(i);

            // Check if we've passed the bottom edge of the window
            if (Y > this.WindRows) {
                // We have, need to scroll the window one line
                Y = this.WindRows;
                this.ScrollUpWindow(1);
                DoGoto = true;
            }

            if (DoGoto) {
                this.GotoXY(X, Y);
            }
        }

        // Flush remaining text in buffer if we have any
        if (Buf.length > 0) {
            this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
            X += Buf.length;
            this.GotoXY(X, Y);
        }
    };

    Crt.WriteATASCII = function (text) {
        if (typeof text === 'undefined') {
            text = '';
        }

        var X = this.WhereX();
        var Y = this.WhereY();
        var Buf = '';

        for (var i = 0; i < text.length; i++) {
            var DoGoto = false;

            if (text.charCodeAt(i) === 0x00) {
                // NULL, ignore
                i += 0; // Make JSLint happy (doesn't like empty block)
            }
            if ((text.charCodeAt(i) === 0x1B) && (!this._ATASCIIEscaped)) {
                // Escape
                this._ATASCIIEscaped = true;
            } else if ((text.charCodeAt(i) === 0x1C) && (!this._ATASCIIEscaped)) {
                // Cursor up, need to flush buffer before moving cursor
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                Y = (Y > 1) ? Y - 1 : this.WindRows;
                DoGoto = true;

                Buf = '';
            } else if ((text.charCodeAt(i) === 0x1D) && (!this._ATASCIIEscaped)) {
                // Cursor down, need to flush buffer before moving cursor
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                Y = (Y < this.WindRows) ? Y + 1 : 1;
                DoGoto = true;

                Buf = '';
            } else if ((text.charCodeAt(i) === 0x1E) && (!this._ATASCIIEscaped)) {
                // Cursor left, need to flush buffer before moving cursor
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                X = (X > 1) ? X - 1 : this.WindCols;
                DoGoto = true;

                Buf = '';
            } else if ((text.charCodeAt(i) === 0x1F) && (!this._ATASCIIEscaped)) {
                // Cursor right, need to flush buffer before moving cursor
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                X = (X < this.WindCols) ? X + 1 : 1;
                DoGoto = true;

                Buf = '';
            } else if ((text.charCodeAt(i) === 0x7D) && (!this._ATASCIIEscaped)) {
                // Clear the screen
                this.ClrScr();

                // Reset the variables
                X = 1;
                Y = 1;
                Buf = '';
            } else if ((text.charCodeAt(i) === 0x7E) && (!this._ATASCIIEscaped)) {
                // Backspace, need to flush buffer before moving cursor
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                Buf = '';
                DoGoto = true;

                if (X > 1) {
                    X -= 1;
                    this.FastWrite(' ', X, this.WhereYA(), this._CharInfo);
                }
            } else if ((text.charCodeAt(i) === 0x7F) && (!this._ATASCIIEscaped)) {
                // Tab, need to flush buffer before moving cursor
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                Buf = '';

                // Figure out where the next tabstop is
                if (X === this.WindCols) {
                    // Cursor is in last position, tab goes to the first position of the next line
                    X = 1;
                    Y += 1;
                } else {
                    // Cursor goes to the next multiple of 8
                    X += 8 - (X % 8);
                }
                DoGoto = true;
            } else if ((text.charCodeAt(i) === 0x9B) && (!this._ATASCIIEscaped)) {
                // Line feed, need to flush buffer before moving cursor
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X = 1;
                Y += 1;
                DoGoto = true;

                Buf = '';
            } else if ((text.charCodeAt(i) === 0x9C) && (!this._ATASCIIEscaped)) {
                // Delete line, need to flush buffer before doing so
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X = 1;
                Buf = '';

                this.GotoXY(X, Y);
                this.DelLine();
            } else if ((text.charCodeAt(i) === 0x9D) && (!this._ATASCIIEscaped)) {
                // Insert line, need to flush buffer before doing so
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X = 1;
                Buf = '';

                this.GotoXY(X, Y);
                this.InsLine();
            } else if ((text.charCodeAt(i) === 0xFD) && (!this._ATASCIIEscaped)) {
                this.Beep();
            } else if ((text.charCodeAt(i) === 0xFE) && (!this._ATASCIIEscaped)) {
                // Delete character, need to flush buffer before doing so
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                Buf = '';

                this.GotoXY(X, Y);
                this.DelChar();
            } else if ((text.charCodeAt(i) === 0xFF) && (!this._ATASCIIEscaped)) {
                // Insert character, need to flush buffer before doing so
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                Buf = '';

                this.GotoXY(X, Y);
                this.InsChar();
            } else {
                // Append character to buffer (but handle lantronix filter)
                if ((text.charCodeAt(i) === 0x00) && (this._LastChar === 0x0D)) {
                    // LANtronix always sends 0 after 13, so we'll ignore it
                    Buf += ''; // Make JSLint happy
                } else {
                    // Add key to buffer
                    Buf += String.fromCharCode(text.charCodeAt(i) & 0xFF);
                }
                this._ATASCIIEscaped = false;
                this._LastChar = text.charCodeAt(i);

                // Check if we've passed the right edge of the window
                if ((X + Buf.length) > this.WindCols) {
                    // We have, need to flush buffer before moving cursor
                    this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                    Buf = '';

                    X = 1;
                    Y += 1;
                    DoGoto = true;
                }
            }

            // Check if we've passed the bottom edge of the window
            if (Y > this.WindRows) {
                // We have, need to scroll the window one line
                Y = this.WindRows;
                this.ScrollUpWindow(1);
                DoGoto = true;
            }

            if (DoGoto) {
                this.GotoXY(X, Y);
            }
        }

        // Flush remaining text in buffer if we have any
        if (Buf.length > 0) {
            this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
            X += Buf.length;
            this.GotoXY(X, Y);
        }
    };

    Crt.WritePETSCII = function (text) {
        if (typeof text === 'undefined') {
            text = '';
        }

        var X = this.WhereX();
        var Y = this.WhereY();
        var Buf = '';

        for (var i = 0; i < text.length; i++) {
            var DoGoto = false;

            // Check if this is a control code (so we need to flush buffered text first)
            if ((Buf !== '') && (this._FlushBeforeWritePETSCII.indexOf(text.charCodeAt(i)) !== -1)) {
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                DoGoto = true;
                Buf = '';
            }

            if (text.charCodeAt(i) === 0x00) {
                // NULL, ignore
                i += 0; // Make JSLint happy (doesn't like empty block)
            } else if (text.charCodeAt(i) === 0x05) {
                // Changes the text color to white.
                this.TextColor(this.PETSCII_WHITE);
            } else if (text.charCodeAt(i) === 0x07) {
                // Beep (extra, not documented)
                this.Beep();
            } else if (text.charCodeAt(i) === 0x08) {
                // TODO Disables changing the character set using the SHIFT + Commodore key combination.
                console.log('PETSCII 0x08');
            } else if (text.charCodeAt(i) === 0x09) {
                // TODO Enables changing the character set using the SHIFT + Commodore key combination.
                console.log('PETSCII 0x09');
            } else if (text.charCodeAt(i) === 0x0A) {
                // Ignore, 0x0D will handle linefeeding
                i += 0; // Make JSLint happy (doesn't like empty block)
            } else if ((text.charCodeAt(i) === 0x0D) || (text.charCodeAt(i) === 0x8D)) {
                // Carriage return; next character will go in the first column of the following text line.
                // As opposed to traditional ASCII-based system, no LINE FEED character needs to be sent in conjunction
                // with this Carriage return character in the PETSCII system.
                X = 1;
                Y += 1;
                this._CharInfo.Reverse = false;
                DoGoto = true;
            } else if (text.charCodeAt(i) === 0x0E) {
                // Select the lowercase/uppercase character set.
                this.SetFont('PETSCII-Lower', 16, 16);
            } else if (text.charCodeAt(i) === 0x11) {
                // Cursor down: Next character will be printed in subsequent column one text line further down the screen.
                Y += 1;
                DoGoto = true;
            } else if (text.charCodeAt(i) === 0x12) {
                // Reverse on: Selects reverse video text.
                this._CharInfo.Reverse = true;
            } else if (text.charCodeAt(i) === 0x13) {
                // Home: Next character will be printed in the upper left-hand corner of the screen.
                X = 1;
                Y = 1;
                DoGoto = true;
            } else if (text.charCodeAt(i) === 0x14) {
                // Delete, or 'backspace'; erases the previous character and moves the cursor one character position to the left.
                if ((X > 1) || (Y > 1)) {
                    if (X === 1) {
                        X = this.WindCols;
                        Y -= 1;
                    } else {
                        X -= 1;
                    }

                    this.GotoXY(X, Y);
                    this.DelChar(1);
                }
            } else if (text.charCodeAt(i) === 0x1C) {
                // Changes the text color to red.
                this.TextColor(this.PETSCII_RED);
            } else if (text.charCodeAt(i) === 0x1D) {
                // Advances the cursor one character position without printing anything.
                if (X === this.WindCols) {
                    X = 1;
                    Y += 1;
                } else {
                    X += 1;
                }
                DoGoto = true;
            } else if (text.charCodeAt(i) === 0x1E) {
                // Changes the text color to green.
                this.TextColor(this.PETSCII_GREEN);
            } else if (text.charCodeAt(i) === 0x1F) {
                // Changes the text color to blue.
                this.TextColor(this.PETSCII_BLUE);
            } else if (text.charCodeAt(i) === 0x81) {
                // Changes the text color to orange.
                this.TextColor(this.PETSCII_ORANGE);
            } else if (text.charCodeAt(i) === 0x8E) {
                // Select the uppercase/semigraphics character set.
                this.SetFont('PETSCII-Upper', 16, 16);
            } else if (text.charCodeAt(i) === 0x90) {
                // Changes the text color to black.
                this.TextColor(this.PETSCII_BLACK);
            } else if (text.charCodeAt(i) === 0x91) {
                // Cursor up: Next character will be printed in subsequent column one text line further up the screen.
                if (Y > 1) {
                    Y -= 1;
                    DoGoto = true;
                }
            } else if (text.charCodeAt(i) === 0x92) {
                // Reverse off: De-selects reverse video text.
                this._CharInfo.Reverse = false;
            } else if (text.charCodeAt(i) === 0x93) {
                // Clears screen of any text, and causes the next character to be printed at the upper left-hand corner of
                // the text screen.
                this.ClrScr();
                X = 1;
                Y = 1;
            } else if (text.charCodeAt(i) === 0x94) {
                // Insert: Makes room for extra characters at the current cursor position, by 'pushing' existing characters
                // at that position further to the right.
                this.GotoXY(X, Y);
                this.InsChar(1);
            } else if (text.charCodeAt(i) === 0x95) {
                // Changes the text color to brown.
                this.TextColor(this.PETSCII_BROWN);
            } else if (text.charCodeAt(i) === 0x96) {
                // Changes the text color to light red.
                this.TextColor(this.PETSCII_LIGHTRED);
            } else if (text.charCodeAt(i) === 0x97) {
                // Changes the text color to dark gray.
                this.TextColor(this.PETSCII_DARKGRAY);
            } else if (text.charCodeAt(i) === 0x98) {
                // Changes the text color to gray.
                this.TextColor(this.PETSCII_GRAY);
            } else if (text.charCodeAt(i) === 0x99) {
                // Changes the text color to light green.
                this.TextColor(this.PETSCII_LIGHTGREEN);
            } else if (text.charCodeAt(i) === 0x9A) {
                // Changes the text color to light blue.
                this.TextColor(this.PETSCII_LIGHTBLUE);
            } else if (text.charCodeAt(i) === 0x9B) {
                // Changes the text color to light gray.
                this.TextColor(this.PETSCII_LIGHTGRAY);
            } else if (text.charCodeAt(i) === 0x9C) {
                // Changes the text color to purple.
                this.TextColor(this.PETSCII_PURPLE);
            } else if (text.charCodeAt(i) === 0x9D) {
                // Moves the cursor one character position backwards, without printing or deleting anything.
                if ((X > 1) || (Y > 1)) {
                    if (X === 1) {
                        X = this.WindCols;
                        Y -= 1;
                    } else {
                        X -= 1;
                    }
                    DoGoto = true;
                }
            } else if (text.charCodeAt(i) === 0x9E) {
                // Changes the text color to yellow.
                this.TextColor(this.PETSCII_YELLOW);
            } else if (text.charCodeAt(i) === 0x9F) {
                // Changes the text color to cyan.
                this.TextColor(this.PETSCII_CYAN);
            } else if (text.charCodeAt(i) !== 0) {
                // Append character to buffer
                Buf += String.fromCharCode(text.charCodeAt(i) & 0xFF);

                // Check if we've passed the right edge of the window
                if ((X + Buf.length) > this.WindCols) {
                    // We have, need to flush buffer before moving cursor
                    this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                    Buf = '';

                    X = 1;
                    Y += 1;
                    DoGoto = true;
                }
            }

            // Check if we've passed the bottom edge of the window
            if (Y > this.WindRows) {
                // We have, need to scroll the window one line
                Y = this.WindRows;
                this.ScrollUpWindow(1);
                DoGoto = true;
            }

            if (DoGoto) {
                this.GotoXY(X, Y);
            }
        }

        // Flush remaining text in buffer if we have any
        if (Buf.length > 0) {
            this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
            X += Buf.length;
            this.GotoXY(X, Y);
        }
    };

    Crt.WriteLn = function (text) {
        /// <summary>
        /// Writes a given line of text to the screen, followed by a carriage return and line feed.
        /// </summary>
        /// <remarks>
        /// Text is wrapped if it exceeds the right edge of the window
        /// </remarks>
        /// <param name='AText'>The text to print to the screen</param>
        if (typeof text === 'undefined') {
            text = '';
        }
        this.Write(text + '\r\n');
    };
    Crt.onfontchange = new TypedEvent();
    Crt.onscreensizechange = new TypedEvent();

    Crt.BLACK = 0;
    Crt.BLUE = 1;
    Crt.GREEN = 2;
    Crt.CYAN = 3;
    Crt.RED = 4;
    Crt.MAGENTA = 5;
    Crt.BROWN = 6;
    Crt.LIGHTGRAY = 7;
    Crt.DARKGRAY = 8;
    Crt.LIGHTBLUE = 9;
    Crt.LIGHTGREEN = 10;
    Crt.LIGHTCYAN = 11;
    Crt.LIGHTRED = 12;
    Crt.LIGHTMAGENTA = 13;
    Crt.YELLOW = 14;
    Crt.WHITE = 15;
    Crt.BLINK = 128;

    Crt.PETSCII_BLACK = 0;
    Crt.PETSCII_WHITE = 1;
    Crt.PETSCII_RED = 2;
    Crt.PETSCII_CYAN = 3;
    Crt.PETSCII_PURPLE = 4;
    Crt.PETSCII_GREEN = 5;
    Crt.PETSCII_BLUE = 6;
    Crt.PETSCII_YELLOW = 7;
    Crt.PETSCII_ORANGE = 8;
    Crt.PETSCII_BROWN = 9;
    Crt.PETSCII_LIGHTRED = 10;
    Crt.PETSCII_DARKGRAY = 11;
    Crt.PETSCII_GRAY = 12;
    Crt.PETSCII_LIGHTGREEN = 13;
    Crt.PETSCII_LIGHTBLUE = 14;
    Crt.PETSCII_LIGHTGRAY = 15;

    Crt._Atari = false;
    Crt._ATASCIIEscaped = false;
    Crt._BareLFtoCRLF = false;
    Crt._Blink = true;
    Crt._BlinkHidden = false;
    Crt._Buffer = null;
    Crt._C64 = false;
    Crt._Canvas = null;
    Crt._CanvasContext = null;
    Crt._CharInfo = new CharInfo(' ', Crt.LIGHTGRAY);
    Crt._Cursor = null;
    Crt._FlushBeforeWritePETSCII = [0x05, 0x07, 0x08, 0x09, 0x0A, 0x0D, 0x0E, 0x11, 0x12, 0x13, 0x14, 0x1c, 0x1d, 0x1e, 0x1f, 0x81, 0x8d, 0x8e, 0x90, 0x91, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0x9b, 0x9c, 0x9d, 0x9e, 0x9f];
    Crt._Font = null;
    Crt._InScrollBack = false;
    Crt._KeyBuf = [];
    Crt._LastChar = 0x00;
    Crt._LocalEcho = false;
    Crt._ScreenSize = new Point(80, 25);
    Crt._ScrollBack = null;
    Crt._ScrollBackPosition = -1;
    Crt._ScrollBackSize = 1000;
    Crt._ScrollBackTemp = null;
    Crt._WindMin = 0;
    Crt._WindMax = (80 - 1) | ((25 - 1) << 8);
    return Crt;
})();
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
var BlinkState;
(function (BlinkState) {
    BlinkState[BlinkState["Show"] = 0] = "Show";
    BlinkState[BlinkState["Hide"] = 1] = "Hide";
})(BlinkState || (BlinkState = {}));
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
var Cursor = (function () {
    function Cursor(parent, colour, size) {
        var _this = this;
        // Events
        this.onhide = new TypedEvent();
        this.onshow = new TypedEvent();
        this._BlinkRate = 500;
        this._BlinkState = 1 /* Hide */;

        // this._Canvas
        this._Colour = '#' + colour.toString(16);

        // this._Context
        this._Position = new Point(1, 1);
        this._Size = size;

        // this._Timer
        this._Visible = true;
        this._WindowOffset = new Point(0, 0);
        this._WindowOffsetAdjusted = new Point(0, 0);

        this._Canvas = document.createElement('canvas');
        if (this._Canvas.getContext) {
            this._Canvas.style.position = 'absolute';
            this._Context = this._Canvas.getContext('2d');
            parent.appendChild(this._Canvas);

            // Draw the initial position
            this.Update();
            this.Draw();

            // Start the I/O timer
            this._Timer = setInterval(function () {
                _this.OnTimer();
            }, this._BlinkRate);
        }
    }
    Object.defineProperty(Cursor.prototype, "BlinkRate", {
        set: function (value) {
            var _this = this;
            this._BlinkRate = value;
            clearInterval(this._Timer);
            this._Timer = setInterval(function () {
                _this.OnTimer();
            }, this._BlinkRate);
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Cursor.prototype, "Colour", {
        set: function (value) {
            this._Colour = value;
            this.Draw();
        },
        enumerable: true,
        configurable: true
    });

    Cursor.prototype.Draw = function () {
        if (this._Context) {
            this._Canvas.width = this._Size.x;
            this._Canvas.height = this._Size.y;

            this._Context.fillStyle = this._Colour;
            this._Context.fillRect(0, this._Size.y - (this._Size.y * 0.20), this._Size.x, this._Size.y * 0.20);
        }
    };

    Cursor.prototype.OnTimer = function () {
        // Flip the blink state
        this._BlinkState = (this._BlinkState === 1 /* Hide */) ? 0 /* Show */ : 1 /* Hide */;

        // Update the opacity
        if (this._Visible) {
            // Set the opacity to the desired state
            this._Canvas.style.opacity = (this._BlinkState === 1 /* Hide */) ? '0' : '1';
        } else {
            // Set the opacity to off
            this._Canvas.style.opacity = '0';
        }

        switch (this._BlinkState) {
            case 1 /* Hide */:
                this.onhide.trigger();
                break;
            case 0 /* Show */:
                this.onshow.trigger();
                break;
        }
    };

    Object.defineProperty(Cursor.prototype, "Position", {
        get: function () {
            return this._Position;
        },
        set: function (value) {
            this._Position = value;
            this.Update();
        },
        enumerable: true,
        configurable: true
    });


    Object.defineProperty(Cursor.prototype, "Size", {
        set: function (value) {
            this._Size = value;
            this.Draw();
            this.Update();
        },
        enumerable: true,
        configurable: true
    });

    Cursor.prototype.Update = function () {
        if (this._Canvas && this._Visible) {
            this._Canvas.style.left = (this._Position.x - 1) * this._Size.x + this._WindowOffsetAdjusted.x + 'px';
            this._Canvas.style.top = (this._Position.y - 1) * this._Size.y + this._WindowOffsetAdjusted.y + 'px';
        }
    };

    Object.defineProperty(Cursor.prototype, "Visible", {
        set: function (value) {
            this._Visible = value;
            if (this._Visible) {
                this.Update();
            }
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Cursor.prototype, "WindowOffset", {
        set: function (value) {
            // Store new window offset
            if ((value.x !== this._WindowOffset.x) || (value.y !== this._WindowOffset.y)) {
                this._WindowOffset = value;

                // Reset button position
                this._Canvas.style.left = '0px';
                this._Canvas.style.top = '0px';
                var CursorPosition = Offset.getOffset(this._Canvas);

                this._WindowOffsetAdjusted.x = value.x - CursorPosition.x;
                this._WindowOffsetAdjusted.y = value.y - CursorPosition.y;

                this.Update();
            }
        },
        enumerable: true,
        configurable: true
    });
    return Cursor;
})();
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
var CrtFont = (function () {
    function CrtFont() {
        // Events
        this.onchange = new TypedEvent();
        // this._Canvas
        // this._CanvasContext
        this._CharMap = [];
        this._CodePage = '437';
        this._Loading = 0;

        // this._Lower
        this._NewCodePage = '437';
        this._NewSize = new Point(9, 16);
        this._Size = new Point(9, 16);

        // this._Upper
        this._Canvas = document.createElement('canvas');
        if (this._Canvas.getContext) {
            this._CanvasContext = this._Canvas.getContext('2d');
            this.Load(this._CodePage, this._Size.x, this._Size.y);
        }
    }
    Object.defineProperty(CrtFont.prototype, "CodePage", {
        get: function () {
            return this._CodePage;
        },
        enumerable: true,
        configurable: true
    });

    CrtFont.prototype.GetChar = function (charCode, charInfo) {
        if (this._Loading > 0) {
            return null;
        }

        // Validate values
        if ((charCode < 0) || (charCode > 255) || (charInfo.Attr < 0) || (charInfo.Attr > 255)) {
            return null;
        }

        var CharMapKey = charCode + '-' + charInfo.Attr + '-' + charInfo.Reverse;

        // Check if we have used this character before
        if (!this._CharMap[CharMapKey]) {
            // Nope, so get character (in black and white)
            this._CharMap[CharMapKey] = this._CanvasContext.getImageData(charCode * this._Size.x, 0, this._Size.x, this._Size.y);

            // Now colour the character
            var Back;
            var Fore;
            if (this._CodePage.indexOf('PETSCII') === 0) {
                Back = CrtFont.PETSCII_COLOURS[(charInfo.Attr & 0xF0) >> 4];
                Fore = CrtFont.PETSCII_COLOURS[(charInfo.Attr & 0x0F)];
            } else {
                Back = CrtFont.ANSI_COLOURS[(charInfo.Attr & 0xF0) >> 4];
                Fore = CrtFont.ANSI_COLOURS[(charInfo.Attr & 0x0F)];
            }

            // Reverse if necessary
            if (charInfo.Reverse) {
                var Temp = Fore;
                Fore = Back;
                Back = Temp;
            }

            // Get the individual RGB colours
            var BackR = Back >> 16;
            var BackG = (Back >> 8) & 0xFF;
            var BackB = Back & 0xFF;
            var ForeR = Fore >> 16;
            var ForeG = (Fore >> 8) & 0xFF;
            var ForeB = Fore & 0xFF;

            // Colour the pixels 1 at a time
            var R = 0;
            var G = 0;
            var B = 0;
            for (var i = 0; i < this._CharMap[CharMapKey].data.length; i += 4) {
                // Determine if it's back or fore colour to use for this pixel
                if (this._CharMap[CharMapKey].data[i] & 0x80) {
                    R = ForeR;
                    G = ForeG;
                    B = ForeB;
                } else {
                    R = BackR;
                    G = BackG;
                    B = BackB;
                }

                this._CharMap[CharMapKey].data[i] = R;
                this._CharMap[CharMapKey].data[i + 1] = G;
                this._CharMap[CharMapKey].data[i + 2] = B;
                this._CharMap[CharMapKey].data[i + 3] = 255;
            }
        }

        // Return the character if we have it
        return this._CharMap[CharMapKey];
    };

    Object.defineProperty(CrtFont.prototype, "Height", {
        get: function () {
            return this._Size.y;
        },
        enumerable: true,
        configurable: true
    });

    CrtFont.prototype.Load = function (codePage, width, height) {
        var _this = this;
        // Ensure the requested font exists
        if (typeof CrtFonts.Get(codePage, width, height) === 'undefined') {
            console.log('fTelnet Error: Font CP=' + codePage + ', Width=' + width + ', Height=' + height + ' does not exist');
            return false;
        } else {
            CrtFont.ANSI_COLOURS[7] = 0xA8A8A8;
            CrtFont.ANSI_COLOURS[0] = 0x000000;

            this._Loading += 1;
            this._NewCodePage = codePage;
            this._NewSize = new Point(width, height);

            // Check for PC or other font
            if (isNaN(parseInt(codePage, 10))) {
                // non-number means not a PC codepage
                // Override colour for ATASCII clients
                if (codePage.indexOf('ATASCII') === 0) {
                    CrtFont.ANSI_COLOURS[7] = 0x63B6E7;
                    CrtFont.ANSI_COLOURS[0] = 0x005184;
                }

                this._Lower = new Image();
                this._Lower.onload = function () {
                    _this.OnLoadUpper();
                };
                this._Lower.src = CrtFonts.Get(codePage, width, height);
                this._Upper = null;
            } else {
                // Load the lower font
                this._Lower = new Image();
                this._Lower.onload = function () {
                    _this.OnLoadLower();
                };
                this._Lower.src = CrtFonts.Get('ASCII', width, height);
            }

            return true;
        }
    };

    CrtFont.prototype.OnLoadLower = function () {
        var _this = this;
        // Load the upper font
        this._Upper = new Image();
        this._Upper.onload = function () {
            _this.OnLoadUpper();
        };
        this._Upper.src = CrtFonts.Get(this._NewCodePage, this._NewSize.x, this._NewSize.y);
    };

    CrtFont.prototype.OnLoadUpper = function () {
        this._CodePage = this._NewCodePage;
        this._Size = this._NewSize;

        // Reset Canvas
        if (this._Upper) {
            this._Canvas.width = this._Lower.width * 2; // *2 for lower and upper ascii
        } else {
            this._Canvas.width = this._Lower.width;
        }
        this._Canvas.height = this._Lower.height;
        this._CanvasContext.drawImage(this._Lower, 0, 0);
        if (this._Upper) {
            this._CanvasContext.drawImage(this._Upper, this._Lower.width, 0);
        }

        // Reset CharMap
        this._CharMap = [];

        // Raise change event
        this._Loading -= 1;
        this.onchange.trigger();
    };

    Object.defineProperty(CrtFont.prototype, "Size", {
        get: function () {
            return this._Size;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(CrtFont.prototype, "Width", {
        get: function () {
            return this._Size.x;
        },
        enumerable: true,
        configurable: true
    });
    CrtFont.ANSI_COLOURS = [
        0x000000, 0x0000A8, 0x00A800, 0x00A8A8, 0xA80000, 0xA800A8, 0xA85400, 0xA8A8A8,
        0x545454, 0x5454FC, 0x54FC54, 0x54FCFC, 0xFC5454, 0xFC54FC, 0xFCFC54, 0xFCFCFC];

    CrtFont.PETSCII_COLOURS = [
        0x000000, 0xFDFEFC, 0xBE1A24, 0x30E6C6, 0xB41AE2, 0x1FD21E, 0x211BAE, 0xDFF60A,
        0xB84104, 0x6A3304, 0xFE4A57, 0x424540, 0x70746F, 0x59FE59, 0x5F53FE, 0xA4A7A2];
    return CrtFont;
})();
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
var CrtFonts = (function () {
    function CrtFonts() {
    }
    CrtFonts.Add = function (codePage, width, height, data) {
        this._Fonts[codePage + 'x' + width + 'x' + height] = 'data:image/png;base64,' + data;
    };

    CrtFonts.Get = function (codePage, width, height) {
        return this._Fonts[codePage + 'x' + width + 'x' + height];
    };
    CrtFonts._Fonts = [];
    return CrtFonts;
})();

CrtFonts.Add('437', 10, 19, 'iVBORw0KGgoAAAANSUhEUgAABQAAAAATAQMAAAD1UDImAAAABlBMVEUAAAD///+l2Z/dAAAEOklEQVRIx62Wz2sbRxTH33bCrgPrrCkERqyw01x66WE2ATWhiZa25176F4wQrC9L7UMgOoRoXZm1AmoVcggbfPCx0JMgUHrrCMHmstAedShFpZBeBJEuRqGLt29mLVmya2osD2hWszPM++z3/ZgBWKI1f/zhETOJ1gHQux2wdSHAJAAMCAjfBpyQHbNxrW+qjgDJoAz17Pxdyf9Y1Wltbgn16PykwedHt29+9fvVAupgGtJ6UQ4eGLJ3AfgaTgzgGmgBrOggEv14cSDkk22okRYwCqvdwURa+vZWsKyCFu7gBjkBNktATapHVxs4KuFvo7QqpysBiHsgjdwAEFAk2qBmgjZBI5rgYMWUOdFmUMStOfsMwGmhJW23QpZVkPYm4EgC09gRT9DaKMGNAyY3gKp0XkmT0zzqBv5dLRiATTlPSlqDyTgQtcpOgzPp4pRTT5QoSsu/odVxS37v7kdkWQVpj4I0BabZ4wII0UIcCD4HqEKNn41BVg90gZ+jM6hSr/BSArJ8sugpBaF5G5ZXEBnkLuvUYwJdpQC5UIAlBahCjdPeaFK2GoPUtXqj0QMLk8T57q0A1xJaCxUsvGBmLFjZIuPWH+szQALP1pZR8H7U045My2P6XepTDraHgASdjkvEsKgATW0gAWMq3zlhJfIomtNpwuySSHHotKSCz58aoWCE6IVW1c4Btd8eEe1VtIyCW4UGJDqNnWEl8il7fAyoFOz+LGsNBWtnHjCYAhbCO+TTcXgCyIjRSXPAwl/9ifTL2jVCWJIr6CJHWu6+Tv/Rfz0BTH37TfZLZmeyc0fgo3/Az3pTQA9dLAFZrXIwpLXm/uafITrtOAbBCKT/cwXfTKR3x0H94O8JAhrvwzIpdRcAdcZcBUgHeeDcWiE695SCKbFepyZ0OyZxxZcjK8tSN8tGYovKEFJRlgkrraPS2TusKVmWHcET8GgVEhMBt6WLk+a+UlBlsTEZImC3PwWMNTQcOwHHHZWCR3eswwVAK66xag64+T6V+fLJdSPk3kxBXyo4xNqmkknkCm7EWfZOKQjuuAOoQcfPBPTmACkCcpkkSbONSeISrIOooCZdPAOMzgCGzNbnAF8oBY8BMem30Vlff2g0WDKLQd/EGPRVVZ8CCh90AXkgqjILah0sADIJaNIqT5oNXWYxniQy3lTFqOWAlSguKMDwJAad/Z/mAF867XgesNIC9sVNY+dVNMviSwBuSUAnkoBYB5PHsg5iDALMA6qjzqqODh+2q31VZrCLC2H9+7cqLvuH6l29oRc6D9u90aECdE1gux/vBc/WllHw/kEPYre91+eusbddA6s7RgWNcWpObwL38scHs2vBeTcLVaMHp+4xiyfJJQCP7elnTJr26fvDhQAXm7b++cJJcqWAN06Np3/YfwE+vdh98DKAK4vmzwJdQVtKwfPaVQIupeAFAf8F7yJ+ibbdB10AAAAASUVORK5CYII=');
CrtFonts.Add('437', 12, 23, 'iVBORw0KGgoAAAANSUhEUgAABgAAAAAXAQMAAAD3IxYxAAAABlBMVEUAAAD///+l2Z/dAAAEnUlEQVRYw8WXv2/jNhTHH8OA7kDHdxtdF0n6a7uBOQP9gQRWp/sL+gcwCOAswTVAgXZpKwoudEVRIGv+gE6d/CfQEOAsN3TUkCL6AzJoKjQkUR9J2Wc5vssF0fUEmrYpinwfft97pAAaun77/a8fjxUD1db4L8W6rVMGgC3gCqsafam6MfC1gk4JHUPL8q551Fvak7F7Anzy+bf//P2/AgxI9vpekzFf/M+4Mu9HgU79L9UWYMP97lNpvwKNc3wDRGPrOoDAmuh1yIS9advXaQW1pd0QICnOR9Itmtvp19i2alQBmgcGArdeWzrvRoX3CPxIEMzYyXpOgL5XA5eW29um58i4rc0Gmo70xrZvEA20UEbJqfgJvmLWFLNLj0ksHADfNqZJBZiQBqQDYORUJgCk6ERjsIsr3WiwY5+VfXCd1DMhyHhHK7S+xzijogeqB1loYHMyRrt7YPZjdCGlmBjCEQfDiX6Ow8Zi5l2mSQUQwC62G5tydWBtFFSgp3A7yAIA0a+N6p1ojGvwxWIMTAoHoOYtQaWA+FhDwwo4T7YugAD72E9JnM66uvEAzoVknz5yAEwEozxAz6NFMCqCKNskmUqEpFdD17IfC6tA8sQDBCRD079jfP8VQJMK7E2FbF1x+i8uc3fEFbo4KRDAhh/RHmCjAsg3PYAygmhB0MqpdRXshD8kDIfMtswAPpNUIgDReFfsvJgDyE/RqaaqKQUOYympYIzvaC4TBFBAjxyAIiM7GiPnTh7rZUsAsAjwdBlgW5BsAeCPCqAlvwfTHcmmFDhgCgEoAoxSmVwpJR/PALwCrHXsBrwLYIAAcR0AzM9RUQHELwdJzr0PgumT00qBToaW3XTS9klxrdObBYBWnrbz8ros26WrTzDlp608xLrMFwFkBaCPrQIH+e7oKIh5EBXzGADADL4AECbO+2MIz65CBxCiAvQmrAP8gulIq6ACOIIq1CzAEF56BW5AXZ/gTKKNK3JSrHWyVlmWeYgVgwvuEp/fIsscCzaqTnkBvlvpAcTMhZQFGIrnyZELYuWzUDA5XwbA4qz0WcopcHYlmVpWgOYIsF8B7IVnhcQo14ZHWV2B1CmQliiFWzA2U6CTX5TlhVcAlxy1QgWwP8KwjgPI4YBxBOAOAIMYNx8PYJOp3wdWuNBtAAxiBKgHMbrQgZkDfGSfpbhTp+0oq8dA6tw9nR9d2CwGwBUfBlBFi6pCpQ4gHACm0W4sdqMqC9md2I7jrtbdAD/UAZ7UFeAVQPRnN8rqWagBAOkAmAN47PYBTKZ+qAqAjGfntmcCDaqsXEyjyflwugAwKYQxywAJAvz6YZTV94EHARzGDmDqAMhp1+73SriNDAOVvdp48xlAchmMLgcJFr+RFVtRgXbjUeLQtQxsB/R1FRqjEjWYYOOlB8BBgX7wVC+dhR4EsGdDiwdJMTB4fMy/TnJ7FootwGwofx1X3/7GfGtYeblDh3uS3DpV00dfGmhQAWBvsobRW0cfCvcBWDHknlo+C71LgBUr+BZva+H93siaAVhpzYr3xI3m34kfBrD2plkYvLOrMQXgPQE0psA9Af4DUyGAAMVxXtUAAAAASUVORK5CYII=');
CrtFonts.Add('437', 6, 8, 'iVBORw0KGgoAAAANSUhEUgAAAwAAAAAIAQMAAAB09Ao9AAAABlBMVEUAAAD///+l2Z/dAAACPUlEQVQoU42SwWsTQRTGv02mpCxBZtdFKgSMyRY34CGCwgYC3W12aPZSs7GhIIoV+wfoyQQsphoqlrLGUIog6CF48OS/ENvVXGKlpeDNBlPxqqS1F8s6mxKv9TEMb3gz881vvodMfFPbqOpNkT5yo+HN1OMXqUT17JnQ2O0lrblCQQ0Dpes1yiAwOCZfE5hKYQSFEVKAQvkwJsKLPiLVMqC3ouBBQjCQBpwqYPF1yOWTBhEjQRUtor4JMscoAnKe1995pz+gz7JbV48Fdm4e+beO/Gs/ldhd5c9AQPBe851Sso7cSjkXHTXFPCKaAZhJV+8913s1mKcWvkfTXsNW3Tgjek5GeFvydwqTxbclixNQRqQhgQn+RAQEhoKBwBVVjO8vZ9S8tiejW1cMJQ+iPanCVE1CC0yx6ORLY3bbVrlAvfLbJVbjnlq8hOmL1lNO0P+U7bPL/c/Zc37b//Vl4eEhJ/D93dj9Q/+9zwVsT5TUVbZnlWYbnIBOtdLrJNWugl14lu1vVX7UqOVUDuRjgTjzslbDbnZMODPfigMPFIkp/HchBASCEdgAxodChQl/sWWr4nm1lkm4pRmZe0ANES2FG4PMPD84bRJCp3ZNJtvjaxnVHd+vWdaaPcdvCMW6gQcnCvAvyreJlGhovUa5C8nkmwcCtMkJPL23NDbvPDjopNeX6Qa5Ya1m74h28quOCDEw8OAEAcETy4ToHzuBOZFXlPcPRoOWSQfToLeGMYdhbRj/QyAgKP4LOkz+AqopxIg65R12AAAAAElFTkSuQmCC');
CrtFonts.Add('437', 7, 12, 'iVBORw0KGgoAAAANSUhEUgAAA4AAAAAMAQMAAAAJYEEqAAAABlBMVEUAAAD///+l2Z/dAAADEUlEQVQ4y5WTwWvTUBjAv6S1LSNrsxIwJXUro4x5GRnMEEYp3RwbgrD+B6bWdR4idIJSsWyZZdvBuhb0MKhgRVAvSksPnsTOyIqydR6bTdhKoV6mtB7UYml9STe3qWD9DnmPF973e7/vfQ/4wsxangBekf3LjMkOtbW8mReV1NnoB7OdD5bGl+00YLgBwHnu6TzeAeBN4gt6IB0g4XqqH5K41GHqB2wEgCIdxkq3rgkzFWMWUGC7kLUDSCQOwAOcMKM1sSAHZCsa/AGZoVishAYCAcfXt2hWWF24reNo0BkQEOv1tgtUXnxFQFewBLDJAWTZ10CKANcjKlA9CQFa6E2ACdosiJWJLVqbWjiV5enci7dvqGQCaCetpG9NrHCzrODrNQyLLIwtolWhUJSX1OIVc0azPVzzyUsMJyoZg/G+G1V0OrqNDLHRRYZr33BIifiN24xTSec+FThg2VXcMCCGYCxqQUAlJaxGECIl6xhOOHMzsJFQgZaIjSYGM4H8NsfWKsU+jlHvsLsDqu+f5BdcLaDx3sDcqy/NH83TdWyklKUaLaBYjfjuJAYCtczUsx0O6rZ5HPR8SBiLacBqKRdjw7WKCgxdK+0DDZbtFRcCbm7aBanLGuAYZBjDh8MkmfQ80Id6mt+bzTcnHR5ADQENXa2KW75hu3Mq8DIy7EwQASUz9byASooMe+IQEjyAgKISQQjUHpKs63ELL/0tYLqss9EiAm5kQZSszscMF9cMKWQ4KblMAB7V0H2heRUZYvUkVnpHNWCi2dBJas4WcPqzWlLBh8MwsPg+8K6KuPQ2rpU0rQF5JXXeomjA9R23KJG+cude6w4p0vvQA9AC6inwYqMSulhHEtR/LeCQJkE4C48uTsTULh1Ed4haz6M2IR8qopKqTfMxl+DCV27IS5ZuOrg7KdtoV6hYXs8CL5HBvoN32A4QqpHp3KkoPZPOEsDN1qUu3KBHLO1tklrvm+BYsEe+v6J9Qy0zDa6DB1erWg/TtFD647kF+EvE2zcEDXjkrMTvMjT8O/7D8I+th9OfphZpYEBEfu4AAAAASUVORK5CYII=');
CrtFonts.Add('437', 8, 12, 'iVBORw0KGgoAAAANSUhEUgAABAAAAAAMAQMAAADGXl2oAAAABlBMVEUAAAD///+l2Z/dAAAC0ElEQVQ4jZWUv2obQRDGBxKU5rBTDthwTR5gwYG4EAmENH4A9wsx6+biGAzHQoTUGRdJ4wfIA7gNuF6IESkGl+FARqXcJarMFctdvlmdlT+2IRrtze3trm5/O9/MEVFmKGwTHD215DPSrgkkQn2Zr2UwKmlpz3bfMbMjcg6NidHg9El/aYb1Ymppvt7SfcZ/9L2wF1uQum0jwvQSXW/xIuPkZAO7cXnlvSF6/Rbu9GyyGoCPTcQ+0Q/6RGhk9R/ae1J5PIpgV1PovSiYxAAFQ8Z5MVZO2MCudJZoPIPb2T1fDUCkuMA+RsaWetZHvG+NzRHWPS4yYEiKw3YXD+MjVYuuiFeA1B+LLpNCJThbUQIA7BGVXsamHAQhw3aDzSQBMACCeFjtb+2iqeBFnAiUmA/1oZ4NVYLKmy053YUEtaN65pqZqzuA3O2Prtv99rp1Lbk8J9d2AGUVCjt0VyJjP5kCICoAXbpNAJgEIJpn2E5wMpGw0WhfAUKMJ5xhTG6gXIzmhXFu5+yca5413HO9XsN13rZovG8t1iBCLbUj5tE1YUYBphIK882xxLFMvkdRCZgj9Tf5TTFIAHEAw2YxAdSjaglgzWceKMC0aULIDt572eqqwCUAPX+KAbtbAER/oQhx287XoQAiIACQQiY3KoHF/+kIC/dSKmKB7hdgmIgxVEsAsfEjiwJcAjRkXycASFVQOwcJZg3VHUDuRoi/SkCtozx3UOI3wB4APAAONAe0Ciszwe15B7CwBYDIRQfQRxIG86lKAGOsC9nxFw8JFlWAbNNT0jICmoHqiNOl6ZkApnUoLgBgAEDBStRQVwZHos0E4EtfwjxkGA6HIvHnFHlXlhlKvzHHh+XQlwqAks1eIQm7KvhvgDIEF/2Hteh/4BX9RQQOk1ZZAjBd/d3zsfp3LH8El6pgBYBFYtgHP4Q0/+t2Z/yOaRWsBJAsPAjwC0jk8DBLAYTiAAAAAElFTkSuQmCC');
CrtFonts.Add('437', 8, 13, 'iVBORw0KGgoAAAANSUhEUgAABAAAAAANAQMAAAANAo4NAAAABlBMVEUAAAD///+l2Z/dAAAC0ElEQVQ4jZ2Uv07cQBDGR1F0aU5AORJI1+QBViJaXCAuRQoegAewksiVg5CQTltYTocokoYHyAPwANRbbTWijE45dCVlctXhYmXnm70DAQGJy3i9Hv/b/e18M0tEfUN5RhuU00Yurk/qbuQUAu3KbK0PoxHd2f65ZWZLZC0aE6Oh0zs90hvWk6mj2XpHTxnf8x2xI1NSRoYyQ8K0BxcekSnkdBOz8ejKOTz4+And24MvqwG4SBGDRVftEqFRrn+o92ac4VaCkcAZlYHLkg0mcupyUQWTyykb2BWJYO7ra3Rn55PVAETI62ok5NTLXcR4a2yOC6LXZQkMeRAbB9rxwg3BKcDCF/2sLFWCg4v/ARg5rHRUeSHD+SabSQJgAPhQ3VqWZeJ8O4YbQhGC5G5WV1kVmutaJYAO2/L2fDUJRuLbvC6uRIKbTAEQFYAuiy0AmAQQejBcAgYW8ZttUAOAj/GUewySOZSL0VhTFGcHkKCx1MxtO7fNEmBgd4Y33U5309mO7GBAtlsCTMe+NFKwxCCTn1FUAuZIu1v8oawSQFvDlgBRmq/jO4Dc/OBaAaZt633/8NDJ9v75BTc8b7lne72Wm0HXofGOQYg0czvqhszDG9I3s3Uo4MtcAaSUyVwlyDEPHePTzykVJejcwbdtqxGIfnwHIHn8xkEBLgHq+5NfAEhV0FiLCMxbahBtThEYYvkaAeosDQYWgeAFQPClB4ADwKHmgFbh2ExwefcAALaQYAmwhyT05vs4AQR85/snZw4SLKoAYkP2VNGcckATQDvidGp2JIDpEsAAgHwuEQYALIm2EoCrK5VAkzABxD9TuHXdqyrTmpOjmqtaARx2rCGScFkFLwYYRV9EV69F9xtD7C4icJRqq58AzL970+1b8+jR4BW6ZRW8GCBtAthln9sIaba4PJ5MV/ykpSpYBeC9/uWfB1jVtApWAnjC7gP8BbI6z69GG9QwAAAAAElFTkSuQmCC');
CrtFonts.Add('437', 8, 14, 'iVBORw0KGgoAAAANSUhEUgAABAAAAAAOAQMAAACLlvyjAAAABlBMVEUAAAD///+l2Z/dAAACxElEQVQ4y62Vv2rcQBDGBwKqhO10Aza5V9hK3mI5p8grpN8ibLUEV8oVi8o8Rh4gTyFMWFIsrgV3cekqBEPgrMKs8o10PttwYJ/JSJob/bnVb7+ZWRE9Nc20w+qH8O3HX8xcEVUVdibGDidnso13WA6mgW4Oh13D0dOXlEdkNcER2+gVSagsxcia+gMuMdTKaDzYtnAfvn/5LwAY8LA7R2wS66Q8wTmjorY011EtVASAd+lYsVI1eQFrW36NAhkbUaP1O3pzgkiVB3jAY+a+w6nD28FAcM7xEa54Hzlx1GQ+ucQQw67iCACk1ygQsWHSMkShQsa/j3FzBMCgdDGJYjYloHNKU+ijs6afsnU9lxTgTtXtrUCI2ZKrjeA3NhKXCgC1FgAboGsKC5gLIWitvXd1QpgSUmBv+AcvdEirNYQj6jpMY1Sgr6hfV3ld9RuAWXV6djucDrdDNVA1m1E1bADq2HrVuJWLsWyWAGgKK1Ulxed/jgCxhFnJOTPeWmWEE4BtUlNyTC43QeWsFHfVvQJcVEXxSAGlRkiqptlvFVjdtZ47xy7H+XIJOaAAcyOFWPoeABcpY8bB5ZxHgNCkewBn+YqDAFwR2bawzkwK9P06Q4F1zn0/GwbZT88wfVEAdjabnQ2D3Lk5pE4UEIDo3fKvpEAMjc38myhIEbYJZlrUOHPOttsCGCgg5ZjcJUqpLVaXZlsDSDbSPjYUjwpIAYgjHg/RZgtgu8AGAI3UALqAO5YU+BHApCgA5X0K3AagQS9c8wYgjgBfv5ltF7wYQFIQO6Qd5YX1JUpLAmBT+AAo61DDCqTBGJRq/nyJEBd04DuOXJtQC4A8On9YB14MULetz+eWG/3HUHsSaWgaPh9762T0xZM2fLQ+Tj/d4/WroP0VIFk+J7d7JQ602xbTz/mjS/OC9leA3j/3KdjT9lbgmW/RPzaTwZB+T6wEAAAAAElFTkSuQmCC');
CrtFonts.Add('437', 8, 8, 'iVBORw0KGgoAAAANSUhEUgAABAAAAAAIAQMAAABdzx++AAAABlBMVEUAAAD///+l2Z/dAAACP0lEQVQ4T5WTsYocRxBAHxg2Gu7SglsY0BcUCHonGG6/QvmAzTjpYFFwrmDoS/0JCgTO/RUNgsFBIacLdzIbORJmwWZ3gmbbwZ3lC6VKiqqkXj2qMNbJD0ryg08H1zW3BgazS+fHq3UHlL5XmGfg1ZtPIhIgBEIQRBBEQiAQCBIgCAQRKsfrCnABStetWfWGDnIlSgfXZoA7H0D5AMyoQnQ/+ME7JPr+BtbrhTgC7vLaf/71p28DsMtlZLzTGJVm8KKqN6JvIzSxATLWm9nUm+26nVHuHQAmTz/YXmwHeBwV9nvG8dWbTyJLYDmFyykszwBt2GzPdVPPNVRC2xLqM8Cdz1HT+GjzLCllp8hwI7yP0MSuB3dfNU2TR3cVdRuai5m5++z5WP5JjZovn2/7oZTbv8Vf/2dAVmG1emFAFRQIT9sHngEelxzFR/HLPD08FC+qKlLohCYOPZiX22macipFRd3t3p9i9jyoy6TuXiDn5vsf5cnAspwuyymcLpdlaWtta2032009b+q51lq3bbs916Wt9XjNb56j+ig+R394yI4OIsJbRD7HqQfxPLr7NOSsoqUMz/PL5OnP8oe4uvtjSp6bj7/3X24gSAgBEBBBJBAIgQASQEIQpNbjNY9LjqNPYjF6SoMXQPb6HojQQ5Nsm1Ja9WbWm3u5/2hmKTWdSVHfJ7PkDgbvfum/fMFXA9zlHC82iHZ/GUPvlFJkrwA9AAb/Fy9iAYGr3YtW+53AtxogA2TKUwJAdgCsAf4FOkVY1a4AFY4AAAAASUVORK5CYII=');
CrtFonts.Add('437', 9, 16, 'iVBORw0KGgoAAAANSUhEUgAABIAAAAAQAQMAAABUT5ZJAAAABlBMVEUAAAD///+l2Z/dAAADvUlEQVRIx62VQWvjRhTHn3ZAoiDFeyoyDqulxx7KCIN3yxor/RC9yxjUPbg0vQRD03iMQOlBwVeHhc1XUAksgR52XIFDwcWXHmS6UBlD9xJKwl5cVhv1jSQnTrtht2bfwZJmxm9++r//GwH8O7Z1eHd88uVnocR4BFDRGGkGNugqEABut2uAIzZEtAYgDxlAG6eMc4VZ6W3Z+M1HcgdTxXAXdJAI0SMKcAcktsWhZbJshS4TAiRYdFQAVRYjP3z6k/tBgeoAUpw91EFWQOoF8BAwZY9tbQOUTnFRbItp6c9KvElVWVac2WCMQJsb4v9rKlS3WElsi2gKh07BE2NCB7fyZmLOcVTN5zyGdktWR3hz/xI38e1mQKFhuqRWoTVbV1WNS4MxrldHNl9bIcdkqnhP3TJ8AHsXkVQUowByq3QB8PNN9aRg23lUze9HLQT6uEJp9iSbmUKax2EarKmQQyGreL0ZjLBEfIwOIFJQlMylAog7Rklxh/Fit2EopBfqka0dl/bDuTlAD/VdUqW0s2mUD05pIjxUUtgwiNZTaMehRkimgzOnGYRAvu15XZXImCd3h0vtDMjs4YjpCz0kFpb9x9rzaOxUzQGODE6Hc5qoqnnofRWgvtbRiGyFdjtTaB+BFt9pR5PmcbwE2ms/OHqTvuqmf6S1LpeHiwTaqV8AvWhTreeZhydhMxh6zrTngSX5AuivHIjnQP39cHbBCqC//Y51rF8BEQhjuiuAnIsk0SmMZb6qkE40xm8oRPHYIOKNc4X4ikKRkwENaNgNJgfPpm88yBWSTrCjJNdkGZB1KNRhl10rUyh53K6uACmv79JxBoTth3b6/YDz3ENY12mCCj2dvHw1OzfSdJ6myd431pP0MlMI4+XFIsFLouAPa0DUopqLXqRO83Dw67OpKBl6iIWJOE7KbvVcmNqh5QyI25RkJbNXgUIIHxZA6G2bwm+/fBFfd1lbrwiXIyrKkSsEFZBD9BDuoaGDxBqQjSsgTwDVl0BZl6GKomQf4eqFaHszU8i/AnK+vi5Zv//gNb0GaolKi9Ni2WX/D+gFAvkOAukINGqhj8DCjFjzE0yh5UD1R8bGaevHKOsydzgv+5dWdYKuis72GgYpxWE52LlnbIwEUEPYY7i2Qjt7VJ3MZ2c0tT6fMCn+3uuC0R96eZcpOZBcHEBv+YLJhTvj1UGFc76uQpC3NyuOvOXVy79lhBWfjjy2/wukwq2xnkJwP9t4+WpLIJfdALw9OrdPranQW+PdIO8Rayr0HkD/AHX/ZNrTZfl/AAAAAElFTkSuQmCC');
CrtFonts.Add('737', 12, 23, 'iVBORw0KGgoAAAANSUhEUgAABgAAAAAXAQMAAAD3IxYxAAAABlBMVEUAAAD///+l2Z/dAAAEfElEQVRYw82Wv2sjRxTH33rNiJCR5XKMgw8C6cdRdY3H6a/MH/AWwxK4wLnLdVpnYZ0EB6d04CB9Kv0BKUYRSIS4SKnigje9i6mOLdbevJlZSSvHXGxYJR5Go91lfrzPfN97MwAtlW+++/mrY2SA3YTeZtR2kxkDoC/gKqs/+lp3Y+BbhF4FPR1W1ftXiTLRlsF3y8effP7nH/8pwEGQP9A28xQUOG88b7m2H0r7t9kplD4cTEscF6rDNxnHaalOy0FaVhPBmDj77AJCA0EBnRIctKIfPa9LARkCWYaulV9/eDt8aX76nf+Y0LtQzCqw6wTo22mJJuRS53LCccJ5yLeYfaAqx/xyItREXI450LCQ+grY2LY60tpBsjYF7CQxaGqjBE8/yIZf6OFLPtS0vOQOYN+OlX3QdvQuAQRDyTyA2O18dKzBAQD1jmNxOWFzAAluvDNer00BzUHHQUJtlOjvv008QI7AAVcA/Cbup1yGQoIHkPunv7z2AKNkBcD2xgYANozH9cXAxW81ANLixLZ0IdkPt93iY07bT+7lABAn1196AG17x0eSAA4mgjZDJfpVJgQTzzKBWlKcqPSdOi2itAQWt6WAHF+rrBBBojIR0eZGiaTFjixAGCQeYKsGMHsLgE9BOgCNkxdxDYAkSBzlBBBlNA/iKKGQEEzuWwDEsWVGraMsPszithTAWOC4JACkXcuYjH6wANEFIgYpkEkseOu0sSnIAxQEcABIiYiHNOzF0ciQZSqRPMhj1A4A7UaEIKaFYBhZAF0DgAWg2pYCFiA4awAYlWuJhgCsAkHOOsduwiWAV0DPFeCRA5AU8hRMqAeZUyA1ZIIgBTraAoySOwC1Ar2cLLvtzbrnxU0yu20AdMysa6qbqupWrj0nd591zIDayrwHwClA5kcFc/Httt+wBcDAx4Ad4GOAvMK5EIU8AUQ5ZwRAc1EO9gCJBRhDE6A/j4FbwJtzWkl0ExGcFxu9vFNVlRlQw+DKL8+dCZWhSh+xV12B71ZZAEobagkQq7+SGgCRO5PU6O0KQB3EIfgs1ACwuGos6XCIMm6N9gBM/xNgjzUVmDkFZhVJ4RIUmyvQM1dVdeUVoC0nrUgB6k8wrOcADMQrCsR1ECNSTArnFHCvC0nmAcQSwGViOol5cLEKYGNgP10B4CtZaObcfbbIsGweA+CqDwOoowXrUPk3gB13EluTfH7t3A/AlwAh3AUIPYCk592gjgHKrR6gkYXWA3BSOPebAwTD+SHkAeZXCX+PcAC8CdBnFLi5+HV7x8XDFhgPALp2obYUeEUAo7OdkwsH8I52a6GASgu+vAGYOcC0kJ1ycZmz1tNlLuOvw3IvyHtM7IVvDqbFXmgosYqR/RKdXm/SvSrlg7QAfazCsh+WbSnwnA6yk7MeGJUaFb6RR7fyyDzT5rmzXC2v0MfwiMJ86pA1v1VReOuUM4KOubYUcIU/xrhHAcxfIawBvJUE0JYC6ykeYCEfvQSmCXDYsgKtl437RcXG89NW4AHlaSvwgPJ/KfA3INu97+ccF7cAAAAASUVORK5CYII=');
CrtFonts.Add('737', 9, 16, 'iVBORw0KGgoAAAANSUhEUgAABIAAAAAQAQMAAABUT5ZJAAAABlBMVEUAAAD///+l2Z/dAAADmElEQVRIx8WVv4sjZRjHn3GWd+5gsnNyIO+YW2eLw8JqQiBuETeCFha29m8YmWuyeLjNwi7JuwZmEV4Nh03uDox/wBUXLLRzhoFZhDEpbE4snCVgmisStslB3PF5Z5IzCnJcIvgUyZsfvO8nn+f7vAFYq15967v3FO4/ASgWuFp/zIDqoAL4rFEBfIfBE7sCQAIO0MCPrInGa+nKBjeubb2iAH8Xl8Sx14NYrfc/2gk3AtpdEC1f7wEovweJRG3WPjPGl3RWPdyi8Z3pdD5vWSKMbHYE+2BwLYETAANASzY3dGtbI3U/ueve2rLi+sUkruJeaoiGGgjUzlTtlekZccumoOXtncHHN03hMksEXrkRgwM6AIMIwOTyuI0NoRXAPu3CtW09ZiGNXdCV0/YSiDHculGmBe92BlS0hkxFIPs1cT5yDjwEIniGBFK4XP6HGSrqH0qgUCeqIoH2MqBgBhCVKY24g0CVUm+YSCBK9B+/Gh14x44dakH7bkQPFTFwgulVtdazvvx0ZD7KDJ0h0Oy40BvWv02WQM3G270/0stW+ltaafkkmM2hkYoFkPtOr3jKg+lgXC59oedAKkEg9hQkUP2eBNqn9JyHz+a0Wnrw02hkihOdaJ/fCw+8gWN2dEfpXtGKIqJ6Gw27JY+4/f6j54aoWuD+3wzZFPL25ob8FUPhnZIIuOxUvd8xkpAehTVFKKeJ8n0G5EwR6EoaOm2joWqpG0tDDDVel0Bx0zAFUboRrRoiclQJZBPiPr7IDBln4S9zNPT1cHx5MbHSdJSm8+YntYfpVWYIazydzfFpruED34fQtfUF0A+ZITszxGWndLLDQVm2TFWzlnVjmSFGiaqNLp55sUPMMy8DMkXkZkA0B1oaatBiwfPx52EMSG4IikBCzBCeUcAEye8AsRZAbyyB+mIBhBlCi09xfAorQG/elKFeAtkyaIzFsbM0VEGgKAMy/jL08kC/Pjd00Bcy1HY2Zdhz2bJVoHzsEUiOPWMI5Nnsg9gx7wsXgV7Hj8+9DEjxvNUMvRxQ6mKGvvkZ92n1hRx7+7bMDvezwdMWQM2qNcwvRgTCi1FMWobWjuzp4Lh5o6OFQfdEPzQ7IxXvsZNqqa2GIzpbzxBOme779clRtVzqyYvxaFyzOmGQX7kqhxcVw/sQGJVLPTuTgYVrDrvrGZLlb/KPxQz4JxDkQOsZ2hxIivQXQEqyAvQ/Gfr3Wt/Qi+pP2Q9VUkU7Gg8AAAAASUVORK5CYII=');
CrtFonts.Add('775', 9, 16, 'iVBORw0KGgoAAAANSUhEUgAABIAAAAAQAQMAAABUT5ZJAAAABlBMVEUAAAD///+l2Z/dAAAEx0lEQVRIx5WVwWsbRxSH33bKbg+ryMGX2SrxBnrraZcFx6VCanDJrUdDcxt5YeODDoZCEESQUVXkyxbRmxIHG9x/QMaQ9ribDWsKSpOjcmklAsmlhzWGVgVX6pvRriTHJqVzEXrzdt43v/fePNDh3ApgO7NYM2O9DOS829VPf1pXuNIBWshxwpQuUF34BDBaBWGBfn/urYOZaLw8oWA2OOmmVpLAZYtOYw2o/Kc0aZ+mOwxcmxN+Q36MTqwvEHVV/P9y43qkcEhSIBjMgCAD2r4IhN8TUNF3Hhxyj4EMANZwSwsHwuip+V7Q6FprpTJoeCAelG/7lQEDIZUaodPSigoKD7tWvQTXrmg8U4grZyCAKugzBYoMPwMSaERpMiWpZkBQBNAYav9mu6iBlogkFFTtT/yp4g644sZFGTcYsI/B4Oj0xY0xFBDXYiNasrl6GwHXdN0MG01mfXsL9Nuf3EgVagRJbywVCpMLQK/O4BoCNQLxeQpU90z6HG/IPIsSIA5FuFX9qyOQQIQETAiUybcigD60BtseOKjM1RNfpExVtxUfr7gUiKp6dAf02GWpQs1K55kngSJ6Eci/mLLYsx8HKsowBVruiC31+WEwTRmwcATw1DPzWvNwMLpWMnabvNLtb95z8jsxMfy6a7fb6hEdxbqptN+iwgcbkGtFwauuVKjlfPRy835u/wWLFlJ2c/+fyemDye+0VjLzzeZruzNeANo7ju2HP1cdSnLRel8AXf/+iDFZp1D5AYECz27wmNk+dc0rIccTtwrlTs8jEMSu/TBWDw/9WLebeoxfHdwRZdHo9qVCLQeSLZLjAQv5HMiiIPvE0l27E7Ycu9ObAVXt/Z6HhtoqJaobYXjsX+3JtJ+1nehEApXbO3HlhK89KOhYKIZfKzi0553CNnPt3VjtDv2xbrcUjsIebJgtohFWFQrld07hZe1+bu/FIBgm5mTyejKZGH55dzJGhX5jdVbeD5vE7tC6hju8BKjQ7hSoKIDWa4DiqcoTe5R2ryKBLMNHLXiNGb7SJH+fbZUFkEPpmmvvSSBUyCfY5dajDfDVu8pcoWCrkGsFEFh4SXWqELaEGmGXBT1mUaUR2R0LVHMKhJJLoKoEImsiZXp4xGSdpUBPM6CvBVBr2fA3qwLIPvFR88exZsuUdW5jONFlu/7rpXkNPducAtELQK++k0Ac88YWgDoSyFulTdVdlu+RER7K7sqAPM9+KICwhgSQY/ieAHKtirB2fr3riKIWh1gg3qGlX3600i5rCasEii4B8ntZDcUXgRwDgRwJtHyry0TXZ0DFz80rx+6wPyqWPtsjx6eGP77ptHfCl2xUxzZpRwPFj1dM88Vb+Y7hW/5Xkr5DLevkbCyAlGGSAoXJKAM6uye6LBr2/xhnQOIdOo6GSe/NN+Wd1t1TKopaG2JRL8yZbEyk8+G8BdcHCzZLNiebzbIALdOUQQoUYOWnNYRzQcf3XUyTDCiVQbQkOgdpjIAMlO47PKrcUhr8fPDLliYTPn2pOR4pFeIZEPb/DMiSc1LhlwAhj8JZGiO4JAqRxnx+blEG8L41VSjBwSMVSmYKJXOgFciLY5J3gdCtVlzJk+A/YvyvlU57XBIIZkAwB1rMwCLQ+9e/Xg4/krLlUcYAAAAASUVORK5CYII=');
CrtFonts.Add('850', 10, 19, 'iVBORw0KGgoAAAANSUhEUgAABQAAAAATAQMAAAD1UDImAAAABlBMVEUAAAD///+l2Z/dAAAFB0lEQVRIx72Wz2scZRjHn8kbZiNMuosk+E5nya5V0IOHdxNYhdqMLR56qBCCf8AsA9tLKT30sGBpJk2YpLC0PckGRQuCgqeIIB5EJyxsPOzBYyQiI4V4KTihEDa4ZHye983OzCbpj6D4QCb7zjvv+3ye7/s8zwzAcWsweJrlnOxo9euvbgoDIHBA31gHi+4ZuFgA7WCBtq4uaB5wAFzMgMUA2lKsgxyTaR5uoHnwgqbzrp6OeJ1nJ8eD7Ojc5Ae/CUNbDMXzALUAKBAxowChHcuhCphpoVpBD96R/4r4J4o5+mljIAXQIYRRimJMh6BhKFLwFE4JyjjSPIGsWtij2TtlL1GQMZyQgCwL+DgDWFqq+Xpuw2scKghuzPOLIZcBR6gHbkDLAEYuLeTxXhV/3qiOk5OaB8E7GMQ6nMGYoIjhUCA9dKKh8vkOh4rnQBEdO+I8dypNBNSWayxRkPS2FaDOB4Dsm+9TwJJBkRqoli0B5YXjvfMgD1onPhYRILy/XcTnXJyNdHnsTmvDuzajeSFY3HG6VW1JiAWPBY3a4pIj6IhHHIypylFa5zp3d5uAw+VXWTYHxXs+AVI0h4B6mDliYVzdP1hosahvKED2JLZ5O+pfJ7UcXjd9gztSQW15+wwoQGEwSBM1m4ONiqcHXfwl8ME61x3+SAg1WayjgoUyrJ5LcxA1b1yRgGadp0csEsCuMFzeqbQwkENAzMFaq2P6wB0W3CJAjoAS5fI2ZR4dsdBlLTgYSW82vxT27Xw7it7NY5GI8Z0A7HygNUnBvuB/hGI2z3abv08R4CsEyOBuQSmYWxLdeQX4mkiOOGwkgA1uuAhnB8cAbV6veHUCRFQqFxi5vD2OqS+LpGpQujm8w3FZUPFrrTrHHXTTn7aqQR+HlSYqaN67bTqBYDjRdC0CnHio/XKTaWstpaCBnuYUIG44UFB0UwWNKbf88zQfVnDNN8llJZKArkxTBtqDj4xA1Wa/iHWUAfRSwFn29q6fAH4sELCvAM1HWz0+8RAKo1i7XaUg7T/348a3/b9NrLIBYMW3NuOfYiuOf+hOGW7Ym7W9ASAMFCQfLQWYo4LAlCxYetrKBgrS6e56C5//2cMdcvsH06y6kQU8WwuFLQE5ruB4xOUxpjt1qWCfYwXMexvrBjOhHeXjuG/H8ZNdn1MKURftzhiJgjbEcRxgILj9EKAsCLy8brGVHq0KEsDN/SblsOfgjkpBkd/LAH4pzrpCuArw6n5fTJbhrZdyvlNXCpZ2TP8KKvg4NlWrCKiKKwelThz/RQo2ZmQOSkASL24PAd5KAG2Wi960sKkPAbY62jFASx8CxM40AMRUvjHxRTT/MpWGykHa/yLm4DUwy0EK6AOe1TWZg88EjJxUQbQ5C8LAyBwx5YIEzBRJ5ZPvMoCd2qdDgLUHZXFpMre41kpzkBo1ArrRSYAwY7TRQdM5EdDLAGIOfojtmHpcYnbejfYu3He3ZJvBC+buwr2dHg239uS9GBvO+oX77WhPAmL/EctvrHh3C6mCIAHzQaIg+zUDOFVawUa9QtsrQBaBXZLeNreDSPqVRQK56DMLKRsZwJHks+CkLwdG3xo0FQ7fXx16k1B7J0Cm3qfB4as/ARwyqWDiT08dKVs+9uJ4LiBA4ehtbepi+iY5PWDwdEBt9KivQT6COAnwNjzLjioIpwEcG3I/cKTBf2lHFTwV4P9h/0rBF7R/AM3kgm3vZlBkAAAAAElFTkSuQmCC');
CrtFonts.Add('850', 12, 23, 'iVBORw0KGgoAAAANSUhEUgAABgAAAAAXAQMAAAD3IxYxAAAABlBMVEUAAAD///+l2Z/dAAAFN0lEQVRYw8WXz2vjRhTHn3bCeA9je4+z9W6SthR62IPsQFNosHzaU2iz0D9gTMG9hDZQaPewW8moKKUY9rp/QA+lJ/8JEwR2Dwn06EPL6g/IQdCLDk7UNyMpHnmVjUMMOyiyMpof7/O+8+aNANZUfv3tz5+OBAWxYXkAs7oHdW9GAbAG8gt0ZX6Vi4Bmqn6z+zpKdNsOH33y9b9/I4BsgKwGsGZLABsAXDWQVwC8mVJVL7FxBqbdIYpJqDGh3LSuN1KcjM22QJnAWYDdrIDltdR8VQDkaAmgQRmOyKxopwBgzRRrGrpxZqV2h8znqOVGNfDPkjvEVv84Hs7RA8trFC5B6A2ItLGqfoPk3bc8fAkEbKLduUViNd49ui1MBbJy8xLaOo5b+NZKuLIjB6DNlBOst7NRnmt30CsR6iPXT/C3RRgQSbJKdC1TC0a2NJl2AHL30NimVPUN7E8SbGaHyQv4HA1C0b8gR1bANQDbltKIgd4GYlcBPPZ6JoBNONTmQJSjnBxAqjtVbnqsDc04mPKyttUanQWqfdtnhTg48FPOrXHbE2h9izJKOEK3dAxsnoyFxGfZD3AJMUEfDeCQgWSW9x2OFvBidUlDgagBkeNVAOxCVAZgbsjcCTgkZgWA00ydgDt+sksZ1DwbB58wrpA0AOFngfptqxUoieVl8V9R2sOxK+GzUgxwQfcGV80pc3IF+IeeGQPjljXu9SqDeGwCcMLsEOwJKI8UABgDYsLRaBwfF6ujAbQm2tnW6wygpcNjhzzQABSJY3SDQxJEd4YRRrcIuR3OB7qmH3ClQJgI+gQBHCtC07+nrL8AMBQgvO3zL6sAHMIXAAFjCIDxRKsBnIC1fWgHCqCfSa1iYHzmF0FM4k28MgD0ruVxS7fGNYNT4oMNgwHN+yuAyZ6tASwP3/L28RWA/TFOPBG5ArrLsyoAHH8B4HOqALbtZlwJgFfbj8oAAmr22TA2t8clAHgnwBNODw2AUQ5Qs38A+dC3cwV0l4MbAYYxqY06JOpUKGAXAHYO4Ns5AIiXPl8VoIMAgQlwyOn+y2GSAwSn3TBm2RrE5Wi9NhU4+GpWf5VceLPLJYA4vUjTeppe/Mcdwrpku1sCgGqAoU5YFu5LAqUzU1oO4IZ69QfgTueuBnAnOPqlWwLY/5me9j3h5ACHoJNGBjCA00yBy9ocBzno4XLn1qvkXjOqpWkau3hzjucMinRIeN9nHQKdZqQA8mZQXkIFgI4xvZP+hdI58i0AvLSVyhahb2I671BRVmCf0xEC9HOAPXea2BjlnmTDaEmBZ0qBWerBpd61MhFwkGb8Jk3fZAoggBHEKoWlsXrIrH8bQG0DanfmRXp4NwDGAAKUYuAUAb6RVwCPVF+CmXpWH0ZLMaB3oVmxcBcAmODyHOevAhBl22gBoLbRusfoygA/lgFGvGYqwHKA4e8Ph9HSLtS7EWAYrwAAtgmAMWD9oQF4+dz2FNccL6w0dqHwn8HEAJiO+JQtA4QI8MsHOshMBbTWNyqAqQZnYasCYBj4n2ICQR3KAOG54593Q7yyRJZsDRPshpn4W13TVQ3UA8a6CEX3BJ/PMwA8CAK53/GMs1CWO6ECoDsxAALm1GK1Z+BomEMLAHxwjpNsuu7Ue17k1txW8qKuzkhxCcBZfFvY1x2V1aGD6MuSy+/Ig11ZeRpdBsjqi3Pe8jAZgHnmt83Z80b3K4wjsBoALX9OLGbeE+ZZ6E4AcEcAcR2Ae4svsrUBiBVnb6z5m/jOAPfg/ZS1KfC+ytoUuGX5H1gAUHiilPs6AAAAAElFTkSuQmCC');
CrtFonts.Add('850', 8, 13, 'iVBORw0KGgoAAAANSUhEUgAABAAAAAANAQMAAAANAo4NAAAABlBMVEUAAAD///+l2Z/dAAADLklEQVQ4y6WUvYrkRhDHiw0mEsc6MQVjuMD3AAUHOgXNrtloH2AfoLGhAyOfJ1oaLHSOnB5sduEFF3ge4OAyRR2YZsNl8CwXTuxoboJG8r9a0u56bbDN/SV1l76qf6oPEVEhZCs6JkvHNvqC1Dy2FAIZoicFRJd0p/N1yVzJisqSSorETLpd6pluREIrqgTXBqLVAM+r/H6FucouLD2UJ/YkNe6JvhaZTmDCgtyClgxd3novhr79DlefXfzAbD1nAJkBLm9nAON9ZGMxAIB5sL7CXaxjK/5qXPqLVyekH8eVAsUgMXBFdeC6ZvFCXk12TTiyjWOBbilGOaPdDgBX6y3WhIO/ANxOy5fO1kqOIwPgiES6vuTYGMHw9RZf4hxVdQ2M+CgeiTajGcLCXhse7RjpA9Xq+/ziPSvVmQL4uxTIBGDEpZSs9z4D+KGJTUMNiQnIaSQF+HIrGYCLAgBdaGZVVRV9129ghuBCaOw1t03VhMOu9fKOkIfn8dkaKYD/NwoQ/QTQ+DkC3nVdl0CYAWQIEY6CMyUAXET+E9VbQ4wgIbkZICwgTAEXYuyWfVAB4DrdMC84hLhH5XxIUopzVxdbfSy+3Zf9vksTwCK+OP00vBg+ubgHgJ0ACACb7K2cAChJ4p9cwtLMhWSAvoUmgBQPrzYzwI29MdwqwMe+734tXr708fn5+j0fFGBRAlsOT4cBexsRVUSXXHQHCAB6h4U0AncAPhdCuXRUaJXUVmsg6Nqh6/teI5C6zQOAneOgANcAfVdsfwdA7gKk+c2+3PcxMeUYhHSKz8duopsiQDwCjN6M1oDLvUXfL41oOZmqeQAAjSmYAE5C2HU72mSAgOfOil+uPFKwHlOAIixR2zNA1ALQGog1PLm/AYioTwVI6bdlIeMfQZvRt42mQIswA6QfP8Js2wXGvqFVy02rAN5QcYoizF0AAKMAMgO0MwAqFeHBz8BnAE9NUtet9xgXYwReL8PcdSbnjXLXPhKS1GF7qKdHGHIX6FkGoAlAz0eAewFAp+7+51eMN47Qlvf6Y5zkMQDq5Wf6B+UumAHoPwB8c0ehPj9f2gX/C+Bf9CfHROIdSC8brwAAAABJRU5ErkJggg==');
CrtFonts.Add('850', 9, 16, 'iVBORw0KGgoAAAANSUhEUgAABIAAAAAQAQMAAABUT5ZJAAAABlBMVEUAAAD///+l2Z/dAAAEXElEQVRIx62Vz2vbZhjHH1Xl1UWKRw9DXkNkdgxlSAjSQY2d/BG7v8Gg9ZCCdxmGGOc1hmQHh1ztrSzs0LtCLoMd9noChYFHLjuoDIaMYacObHJxwY32vK8k20lb2o6+YPTqfa3n/Tzf58cLcHvUTXj3+PyrLwKFxdt1uG8wleKKqYMKwOHFFsiVCNdwiUHdxqc1ARgl63BXA9XHnXWcQPwW4+odNBXDJ2CCoqpmZAPcAYVtc6g5DABfTaKqaGjW0PEQIr75bvOXjtJmsXkbSPl5BWjD5Bx4w0uBnMSGNYURwWHjRGHCNtIquFlGDnUgtspANFDaPnwpHGozdBoKF2g6FseAMo5h3dYJ0bxRb6hbsL6GMmQK4X5LAql6BjSIYAFUqYjvJ/JMBOJKIo7VhFmxqKTOwj3tCmPi4Q6piXfP040u5zHs1Yge4qR0jV536a5vQ8VhwVYdtqip6wZXekMoMT2kPFOIse1SWwIFOVBQLy2AqFs9vRwXZ/NWCjRNmp5VOA5iJaY1pxeQ4kwA3H1yhmieCwWg9gzgt5vxU/y698hN52HNOTn89JueLd+Igwo9YMYhh+e+VKjN43r/JhCHeg40tN1iN6zhKWYKtJuEntPjxAbeRKCQmEBRvHt/+Bipsoufc4pAHKm1ziCeNSuWprYDM6LGeeEoGDs9zKF+SPyJ3Vi3iscX9ryhb7KCxgZ+JBXq7PrRMwFUG/XykMVRDtQwXVMnWnwL6CJ0ejOvJshMGU3j+MyX2aEC5RLIaTNOHXTGwSgExe5j49do6LnoAwJdhj6d67rTP/waq0PfPA3V7YDuSYUOUYKf9o3TS8+e5Ao53Yenr5Krg+Tvob7/mUE6NxTaQ5U98UOgocyYKqjauZkCkV2WAp0cBaMpy4BedhvVczMH+h4VonZTAHnT+dx8wIaE5wpJINVg3EPtM4WmXdsUzgIMm+5GQTviORCkCi2BdmOpENk5TxtNIQgmEqjaF+qw64OqVGj+eM9dAgUiZEMJhOVnb7K/jjlPc6hwdPVy/mzf+PHyH/XVxEqScZIkzrz6Q3ItFQrdXKGmliQzTkVSrgCJ4jjQQR+cnc9RLNlORFJ7dlECoSuqDBldAXoaaE4vA8KP6Cb78/edOKsyoRAm9SHmKRUWRZU5XbgPJBA5FIocUgUQEOsG0KyZAwFY/R1MajurqZkoe0cq1F0AeU+WIXsaPrRhCVQrMaUzirM+JIDaAkgdz18HQoWEp+YbgDhdAGEOjXybmkug8iNr7aJ2Fskq6wzGxe511b3ErIpetCpW4WQcK/63G9ZaKIAqFqbHYFWhlgDCes2ABs8XQNCsYB8aTbEPpUATaLYsrN/Rv/EELR+N5NVhMcwhGi2BSDZ9ww1GxCq5dedonK92akiBIAMSTudAq5YEED7T5s/SRZptbmM3ry//W87v1NeB9LdfrmmnXgDBewCJZyntN+ng8KGj8a7b/oOBbkjN4COO/6nQe4z/AG78UNn9D7o/AAAAAElFTkSuQmCC');
CrtFonts.Add('852', 10, 19, 'iVBORw0KGgoAAAANSUhEUgAABQAAAAATAQMAAAD1UDImAAAABlBMVEUAAAD///+l2Z/dAAAFNUlEQVRIx72Wz2vcRhTH32RAm4Ns5VKYZRcL+hdIWTA+2NZf0P9hhGBzWagDPewhZMcJKC2I7HVDITkWejIEcirJiAXZh/0DfOhBxuBeCt1c3A0Vq7430q7WcaA1lA7saFYazfvM9/0YAWw0LvCnYG+bqxxg67nco7vnu5tTZHXtUPf9zz9959lc6XOw0hPo3MN7NgfwgFsCp7CTqjOv7Voa3+XASwB2WVoAGpfHp2gNMmAKPm+dW3csD3+WkMKi6S2GK4q+OOpuTGG6um5T9/VX3/zq2RbLj24B8vkNQJbGXdyIVwPyXmkDy2mzOQgLWIIP6GUJ5yGRokld2YAAQD7Aq4R9+nufnmwgm36HRkx5wqZ/I1xBQKMgcA8CAwgNoBFgBdhyjTxMDStA9+KyFM5zr16ejONQeSA0HAUOAuw2GAiMUrfwP1qaZ133In8yes1xsztcF7aTtZf3kWuAhqW3A63FuY/WPLdRkANbhjEBurlaA6ZJA8jt04tlSyBGxwB2JHZCs9i2pvPBSMg0RhUR0LQuzouE1rPRFu1LTlI16G0dK3BEv53sisjL/AT0MEwgjQXee0fC7aEjtOyBJY5oHUmUtYItpbMKUMg1IMsXDaCT4KJcRPNi2wByq1MGYvoxFjwWe/4kPI5tEa4AybMIyCb+i1pdbC3zwCLP9dvP0G16hoqmMcWgJxzureUWYMZSrRW001zLysWyiUGvcfGM22iQd+UqBgkwnGTtDMikP5EMlQhVnX/EYvLSiABSTOeLQ/Ru0XUyUexD1lYECAECqoAAn26zvDh0+MckHCt/+dDRbCkd/cODSkHU/MyrAE8XTRY3Cg5dAnR3EDC4AXj1bSeDwp/0P6ISj/I66LaUpiRhif9jmhNgJmwusna8j+6MbRa31UMELNDFWocTUrCLWnJutZNQ6TA5FJIlUoSvJpWCuIfFjgFksdcA2o2CvZ1InPVcBAyfrwFfxe1rP4lY7E+iV3Fkp6s6Y2uTHwj4MtwAZMo2gMihDsm7BDiUxsX7qOUKUIuHGO1Yirg3qxXsizN+mL4t/sI82gQ8LT+UnbL8ZRahgouok98ARAXf+0l4gV5Cyqh1vAK0qvxlSWCzGrAIDKB7hYBW6xMpWAHa+wbQZrgMAY7GqfI8NwdPOpbsGwUL97eFZio9wb3BdO6UZRGU5Z+LQlARoag2gGdRGwFHH6AsyylGHvqm/dpPpDfvGUC+rtT8xUIYwF4NePopiSoFLQS0LRODFaDVqgC5ryKj4GSKxQZfl5Jlsr9WULP36dvfS7sqFZQLONnNyvIPUnBIgDoSCIh5MG0AXyKg6KKLa8BgdRZUgH5iACcZ2wTE7tkKMI2ZiUGs+ivADM0LPtdSRd5sHYOayswABIcNQPLVwMRgDSg/B4z9pC+sBrBuubY3ACkWCJDY+qYTWAclAVJHgB1b0goVIK46kT52mCRrBbMaECd/ARAie+plBhDr1GeAtF4FeFLz4bxZDWiOOieaXx+MsYgGzhQ790o8Gb25pNFldW+4jUFXHIyn8+tw/OjTcjTW/tKlMrNSsL2ko24AGI1rQHHdAB68eXGxPJiQjUpBPKkDFws1ZvG8eDw+VUXQUqbMYILgUTek4fXj13S5txJWwD834wfbnOu8OYupNBhAgLWL63Qc1B8LGw0BT9Ute7w6fL/wTWPdBdAiwyY7zVKVgubBnQCn8CVAc5Dkt2zaq4H3bxQ8xm3S91t1IDUKdu8EaGry/Rt3n64/5P7L1igId3Mx/E+tUfBugHfR6m/M2pxI/xJYWgAAAABJRU5ErkJggg==');
CrtFonts.Add('852', 12, 23, 'iVBORw0KGgoAAAANSUhEUgAABgAAAAAXAQMAAAD3IxYxAAAABlBMVEUAAAD///+l2Z/dAAAFxUlEQVRYw8WXMW/bRhTHH3vCycNZWi+QEQcFulMJEHQwTE39BP0Ap6VTgHhrp4iGAKkoDGTNZ+jkj8CAAL0YcEcvQfgBPDDowkGp+n93R/KoykHiBsjZPpMn3t37vf97jyeiftMGHf5iilKFS5U9xzWaiJ/3n5w0F49S7n//489fz4wko6M3RLeHKR2mM4xLXo1/TUZ20P+iPSN6Hl3aNQyNt/g3sj3ZHbG+4H0V3dPcvrstztBlvKIgjcthesTbE0XlUf/JUXMxtv33P/z87i8AZIqqvQBJugvwmOiISum2s6ZPxltJNLA7jtxcqckZAJLo0mSdAeP7yOB7k2VSWj8IOsAGUmHkoP/UoLmQFCgQpdbi29bKFgDXOwBKqgOaqagMFVBseubWV+TstT2TlEna+c7tSxiSBFfBE3Ribwd+MtrMPSPcv2EKHwiKBRm2PrpcZOTd0yng1rQA600IMOgDiHXFK6ekRTxxAOONudlqUXHwIA4RXVEqpIJTDvwuMxI1C+XiyoUfRFFU4kZZo00uR8PNKKr1MD3BOHpRS1Gbm80Bc4CT4wQ+WGSli7fjXg7MBsONySzASg0CgJHUIUC01IvhJlop61ELoK4BwJ6G0VQlabmAc6XCE7pxEz5CN10qRNQiLS3AT1pHl9O01FZTU6iJVIwoSCHmch7k8etrzQAzyKqidMLks9jGm8VoFShHQhnaAzARVQgwzBXsAEAiqoEPoQwAyUonKxhteP2Ct9ZSBwDcTVOOqDibURcBTVpwlkg1XQ0WuY0iYEhyOaBFl0FYAk/GroLMwhy4nCDCfA6oMISm/SSOlirOKVor1SUxA5hCmyvlS2Gh2OUMkIUAk67e4Dmpk2WVcF+PECp5/Ri1tCCsrkSdLBkALrEAiNw6iUo4yeRVtN7EiEgEjI1Lr4DQ02ULoJEkXRnNewocW4Dj9QUAknQH4OLlqsayAHi5UvOVftV6TjRJDAUKmGoBTKYj2FSoIxtCKD8MIGxEcQgRBgHwakjTFcLH8B7Akeopu0cZxFhhvAI85UnsAWITAmRBDizBCYAn09U1AEzWByiu45yXBcCPBQPorkJWvvgAIL/oA0g68QCmB4CQcCE0pomkFkCSPuWU4omPlrFXgKeUxx7AROk9AOfVfH0R5+V89eI/AHDfCwDEVvlYqvky7gCEbgEQHbsAygNkAHjaAkSVBxA0CgAUxawA5JL0LHoTKhC9vj18XX9MM0F9gGr7cbs93G4//q3nVoH56mQfwAkAjiULzgDnZQjg7Zccqx5gkdeJA0BAF1x3FwWdtgCkmxxggMQCYAoqQzzcsGWi/oWunQL/DDfIfmJn6+g8leNyuN1uqwU6THEvJlsbHADNV0cYXNy4x9oQOgJAtOQcYIA00/YF5UIoyTwApjcKSD33CnC4S8RMqAB+Cg+AEJo7BQodU8Yqp/Ce6itAdAMFbrcoALbIOREwZVy9327fBwoAgKsQPpZjC5DZfIPdOZfrEKA9rLmTEn0KgPsgBwKA6aoDQIADAG4GQD8HoABy4BaG6z4Ajhj+lLF8MICSnwcw2AtAgQIGhwoAoGjOdqpQBxDfB4AkfjiAbgH8mxhLz20Z9UnMRvASFsAPAuDRkotmB1DwBniV8uumfQ/YKcYDKM7OexXgSuoBsj0Abn0H0J2cUTb4uB4C5HfJ8u6U+zrhN1d9vN6Yt/XiasO3640bTM7LMVJW1KdvcXuHWXgAeYkX2fGy7t7EMBoTUwuAhA4B8rsOIKXTqwpnodOCjxJ8oATABz5sJuuaq2eusOlZXv8m7NZdFcJelb24O7tK/Wm0/S5An91QTBvL/HE3PI0qsgDNSaWppBQC7DSnQHBKDveiZtl9TdBDAIQviFlrZXMadTY8DMDcByCaAvRpAPMFCmRn/AWBztzNjgJHDwP4sF+BRfMNZrTXlBF9nRYqQA9UwF59R9+mhQr8L4Bv1b6aAl/Y/gVcHVZ+N56OEQAAAABJRU5ErkJggg==');
CrtFonts.Add('852', 9, 16, 'iVBORw0KGgoAAAANSUhEUgAABIAAAAAQAQMAAABUT5ZJAAAABlBMVEUAAAD///+l2Z/dAAAEj0lEQVRIiaWVz4vbRhTHn6IyvozX1xF2o9DeeigjDM1CjbP9I3ofI1D2sAefgmFNd4zLbg8Ke/WSkP0XHHLsZRyBfFGbHDcUisxCTz2o5KIlzqpvRrLWSSAs7Rys8Ujz3me+78cA3AymAFLosI4tgSzmu7jUPFb1a2tuHrbAn69+/DayZLp3AO2mtMUebqZgA0QMvgO9Ahf4VRuaUzHkQMHNAFZFB75A02in0wGq0NeHg1S+7DtgKY4TT1rWlHHOyR2wZSqo752gAXRGbHRWGrAmetsv3/w6tSYy3f0IaJFtA+2wpaXUqASynhccdghoEM5tR1oSOHShGXpI2wMCxpeeNfDUAlAQGknY04uNUjGDq+CCU0IsnF9cg/ZaK4STsQHCXSWQssIaiPbxvaY/0ECNfFWgM7aYGlgCuH2PQwCNxiU6CoBQZcQPAtoMF0oB813neJmno+vRTjN8KNOc973zFe4bCkapLe31MEBLdq2QlD+sYw30MK+B9vIa6G6376rYy9e7Goj84RTjwGWRtciGa5+yiDATlzsaDYIucU4XKgd4uYngXQwZEGeeBJxoIQYh+N4T31rNqgDbFPQJiIA3c6PQRKWJ0kAB24RMpXXIEtptUxVzUeVQ5BRx4D1VYDMIfGAxAonSNeZCr2ssI5AK3FbjeJDlnb53OpVd52fBSeskgoEc+97UtlSWjzquE/rKWe/3wU2+Xs0vjELTwVwJE7JuvsmhebYBGvW6TmgvEWi8BfTst/gS8sC/zxRpZ5tqMWDOcZAaIG8iY98Jd31vtpC+I/c5YYkPQsUI1IjkIKTUOwuF8GYj330Tkq44MAodd9nr3cPm+Svh87rK2P3z98Xbo+LP5ODQeUyWc8HjGujAe4JGJ2HgfzlLfL6pKlYB+fMS6PQk9i05MkDRlRxVQEOlFWpIlAqBTi9Twfd9iCixKoUQKKN2UyqB2m+Acs7KzE+SrnNK42wbKPDOYp+vUHvGkkFaA5mHg2ExQA/OQg3EjhBoMr1RiJUhk//IRCsUoFtxBDG10zKHWidv89fksPns1UouMrcoLouiuJo9eFJcG4UQ6DGNh4JfjxtFkWOLQnVmCMTzAw0ksJKOTMherLlRyAC9DLhTAmFIFlPb5JABosQATc4qoAFKISCh93hVZagQJgL2TqTmuv5QIWeG7ZBEOocQKKQ6qRUQdxuI0WADtEnqEsjXQAHKGOocMkDHbZZgBSIQH4Q6h+zBzApLIL8ZmuoIeNWHECiJNRBps0+BUKE2TTRQ/CEQclZAunliRQMX7Aao9727s/SfZ3mv77amy3dsdH3Uap0ssywf993GJMohf3TX3Un8F+/X11hlUZTWCjnrsQZqvMs3QOzvDRA86vfdZYB9aKyBrlYZjH9yGUJl+V/9XutklQ4Rg5qkNn3994cyLwnrtvy5oQXGzC27b92pWbu87iogPd0AbQ2tkH4ltheF+YuXgpXB8Ga5Vz2H8PmBNxe6ZaWlqlPrA94aSHu/98EJTeb895GmAJ0djaa2FNq9LdCV+sheQ35y3f+PUSsEt1bolpb/BaH8TtnNQ18XAAAAAElFTkSuQmCC');
CrtFonts.Add('855', 9, 16, 'iVBORw0KGgoAAAANSUhEUgAABIAAAAAQAQMAAABUT5ZJAAAABlBMVEUAAAD///+l2Z/dAAAEZElEQVQYGa3Bb2iUdQDA8e/veW7PbXbrrhJ6ZOqusFws6LHRGGTtGQqJ9GJvhL3wxSPaELziXhpM99sSWyBhNWLdizzqTfQihsQQjXzmVCp2cIHDmaKPUHGJ1jMd3W3ePU/P3c1z5x/I6PMhIKRqUaUa1Oh08jCbt62ZEpJAS7NULTGOHkEFGzpplqrFLHdFaHVB+PwLCqDIUpqqUpYand+pkdTJzKQkd/kG/wfVAcXar5YIuxR4XQtL4egb2U+LFnaMLG+wxtaSwiUqWm3NYCODRO2wCx3t/RJUnbOUqV0sEdPURNFtzaBAWdiFbroJ26LAWTrtqK1Ofg6GHbbVPgZ4RUZ29oLCUbX17HemGOU5igdPOlziG2gaiG+YToBrsxuXyNq3JWDwbTSSLpqQmUlJalSLO3yWiENEaADEKGW+Cev5RTakqcqnPbtIoCENbCVQyoIyxuKNRdNhHhZZNMlRlpccYZoqif4EZRZeHnCgo71fgjdGhWdRE6HKT6Cj8CBJwLEJbCYwT8Ak4E26KLvplu/bG9zYQOZxVEkXRToBdSzyIa/KiKNeYa8B0xZ7GVBXyajjXhjPzKQkmtFzqJFAQzJOlTrGEjG6lg0yYgkXjzJRgHeIyi//WjjEHlplWLLITqJSG6cQ34NuK2lQ0C5wJj3cZm29XsADh+0KoSH7sq6DI8XPvrN6lKgqwWJr49Nm3hTn2zra+yWll1xiFq3TYFLl6bo44g66rb6GzorbiFNt/ECZEmf2DE2m7xBoutGzXSafh0jTJgsxqhNQs6CsbkCCzKVT16gK+U3Fk+leAy4BPlxLrr65z0TYUCCgjI9mZlISzyKmj3B1DtNiicHCu6qIDYlnMQh5+CbLadL0XDh2Evw0Xx3fz2KulMaXOeC2BJRrBVAt23FnS5QJ6ZGXBHKcBgWvi95fqeoqAo7Xm+ho75ePI2Ixdy9ro9KcdMO3fMf3N5KLvud77qB/mTJVEkiGnWjBuyLaWKBiZGVetXFgWCdsA0kHWNhngEKgZMbinLOok6XMg3PUnBLMW/gvzGZmUvIm2HEnTW7uGTloXhXhuBCns0xK0Zi9KhaBvylJAgf8OPgOFXEC1+OvmfTiMM+CCRwG8ngWKJRZcT1ynHq5+WMW99AU5k1Y39vR3i9RvthtU+ZTk5unyk9QT9iU2SZ+0u6hRo+AkDbM4adBkZvWPXl71/fnExMXm0LDPXG/b7hHyC0hRTBycd3H3cZnL376NX9+MvXRT2+9PPHmH6c/CEnIzKQkapZ7KYIlYlQaRcA7n6BCkQw9ti5/Ykf8cGwCnvpx19E+iGj5EzvMI4mJlStAywIadcQYNRohhRqjpfkgaFRs3rZmSkgCLc0HbcAATQUbaEGbsphlGa3VLxAwqIhwPzEkUR1QPB7Kpuix3AB3ZGZSkv9KSB6sFAclRB2/j5oJlsv+dsuDJio62vslj24LZX6C+/mDkrJQgXoxag5wvzkqMqtSkkc3QkUjD/cPU32licWL5OoAAAAASUVORK5CYII=');
CrtFonts.Add('857', 9, 16, 'iVBORw0KGgoAAAANSUhEUgAABIAAAAAQAQMAAABUT5ZJAAAABlBMVEUAAAD///+l2Z/dAAAEMElEQVRIx62VwWvjRhSHnyoY9SDbLb3IdTbKuacRhqxhjb2hJbcec9ibvAZ1Dz64FEpKDSuvwb4opL0pTdnQ/gUOgbS9jVagUEibq3NpbQKlhxwUAsWBrNU3I8uWnd1Ct31grHmaefPp9968AVi2pgqvNLmfGrz7wQ8fSh0p1KCQsWUTPZoKMgCDy3UQngH6stxFt0EFPQTwIg2yJI6j4sNrTX4L1w3hHdBAsmVtoAFwD2Na3bBlm29GiAxk5PLZqoj00dY9X+rKSLEEJP2YAipong3mqSWAWC2iUMA4Qz67ICPaLW4FKyCjp1QHWfH4q7JFFNVr99Glqj5DhQByPbXWHvJtgPijEKiqEsWUblxagZUsyhArZNsP11oCiCVA3gBmQKXV5JNjICmCMoBiJjoQCpTvoPyFfw18A3U+tkDN2MCG6CJATHi4NuFfDT6l5Yphk82iBqamqZmAhiHdAHVzjU0VarNh85kA8twpkN9szoAa69WDsyGE2+UY6CpqWXpux+cy1A0XxQMOp358BAJIlhkfv1hK4LBpQTF+5CkjpKjFI8XAlD0CNTBnNVTrD77hQPWRO6uhwRTo3Gms5x2cbFItSVlgGS4jNAZiU/HIL4f4WEIgML0xhkBqpeMNx62Krshtrz94bBVzPf/CcBFod5d8ao+3V/T8zsnR25d0CzJdxs77cQ0V8873X2YOziwaJikbOfcPXkbXT6PfxiVdczbXloFOAvywAIH8LhVA93aOTJFGGWpfCyCjbTPTcHBSR7L9vPPkQdU9tYoCaC8g4chRVWOv+8m15NJHVZyD0EIhASRnbGah9lOFDIdqPDZIDsD7GWLPgACBGgZGRqAGT5kAqmItH9M4BT3/SgBVd3v+6MqePK0KoNvtQlFLgPYDpU9ZiwNZCGRu4dEC32xwhXK965tbVOj52R/STahH0UUUvby6re5HE1Tod6dVXc0pAqilRNEYoblCAqiUAE0wZdKxMebFjT9JANE8VwdVojIC3ThPqnOg54FCteapAPrsC5dtSQ6pjVIKYQ11sSxMDE54URsOFPBo8hqaKwREj8ZYsTxTi0CYMtU7Sg6eAHqxBJR3HjfmQN8GWNRaDFTMu8GGtO+MhqkaesaB5NH4lUBJDd0BmqcMIO8dMjMFZFnGHgea15CVAnJ/RQ4nBjJ+coOK9NXP3w2np4wDtTgQsLsKDTB2csruAAUpoPc2+gsKlR/o2ZP64UCcso53kXcm94u8qgaX5Yqe28XGOP58Vc8GFv1z3MI1nTDpQxwIFoG887RCSR+KgULgfajHOy1g5I4fiqJWRsdxh5zatMukXUtm0vRcGWZ9iN8qMZBYTkQfgkShdAgBNJPBXtyS4dWhzecmu5mvBZpnmF9mihgKhf4dENwBmsbla0J4IwsXb/s3BJKTfwb/n/0Xhf7Z/gZ2tyqS2SBjJwAAAABJRU5ErkJggg==');
CrtFonts.Add('860', 9, 16, 'iVBORw0KGgoAAAANSUhEUgAABIAAAAAQAQMAAABUT5ZJAAAABlBMVEUAAAD///+l2Z/dAAADuUlEQVRIx7WVz4vbRhSAnzow6mFkNze5dqKeexrh4BbW2IWU/Ae9yx1QezCtewkpXdYyAvmixe1tl0BC/wNBoMlxHIGXQkquXgjUxtBc9mCTiwKu1TeSvettScl62znox2g08+l7740AsqZ5ABXQfE8bdxhlqssBvpc/4dkQEuHBzIfDjY+f3NE8OQYoGx5pRQ6YDAiAdNo1wB4HxrwGQIc4bxsfWXPda6bwliYv35L3gOBcH9RMQmPSGeMJe0BK8xvbJ148cUxKCdAJjmXAqHrn8y9uxv8p0Kf46X8M1RJ1l+p6y/sMu5jyoYXwPqgeVISwVBIOnDGqOzDvoKtKQb2/o6F60yuqRQ8qBYKzdHKeCV62cW1fqFi4wIxDKSfQ7lK9jxedVaV5eChjk9cb9iC4W+WJY5rMGNnRmDeA3f1I7mzItT2mvtOslVG0KRN0rvWiDZCjnj3LcwgTpAqEOVo0dmslnIaYYAr7aESr0zAboiMQCGAjZ/ccQiAV8bO6sH0AuxeuGCVatA6Z7wyRULpWUfdjM9m3LcJacSn8UpiDfjwrHSmgIq3eCO9XrNLhSZR0uAAjkPI0ygz1ESj5wXj0ovV4sgE6aH/y6M/0dTf9Pa11JR0mS2in4RronsutmCyOn7rC7vVni14IjFD8MOdMSfFbP2VAds+TohSObts+cxDoa/Gh+dyt5kCUVu2QMfs4+GoOwEXT17xhND43ZBLDk5cMcaxEopTmhuSWoZdtbvSC4RF3u3b/t19OFyE0tRDn0Z5mQGKRATWVjzfeqt5UQG+W97u3LgF9H+4rIHeRJI7QAgKx01aGiv34dImGHr549Xo6t9J0lqbLg2+bD9JVZgjbq0WyxNNSx4PXgLG7ARJlhkAqZMqQihSjNz3QMiCOdkTJk7c5+aehkTL0PAPCmpBCC2lremGobZYxhvh5WB80NwRloDHmEK5hYAapMUCtHEhww6cboCfHKmSYQ2jxDEvcyIGenQPZayDMoaMN0CC4AMI1R0J7EE4n6xzaCShQQHUEOslySFVZIFsqZGsg17WPFVA4qq5zyBWlcyC/4P4N6Mdff55cVNnVgF4iUOgiEJY9kwSG4UrlTpDv1HoOVN+zCifiMVZZ19L7w1kpXAmVVdP5Wb1hkWI8M5N7t6zCSAHtNzD15lv70NWAsMqMwaw35weVvT5uAN9hUluD4RqIeNlp83fi8G6NwPY+dDWgi//mdsM/6PbtevuGyTsC6dKBXQ29BciD67frGCLwPwBdxxD8K9BfMkpVgsdqJv4AAAAASUVORK5CYII=');
CrtFonts.Add('861', 9, 16, 'iVBORw0KGgoAAAANSUhEUgAABIAAAAAQAQMAAABUT5ZJAAAABlBMVEUAAAD///+l2Z/dAAADxklEQVRIx62VwYvbRhTGnyIYX0brFHqQsVP1nNMIg7OwJm5Jjrn2Lkeg5GAah8BiaFhLCOzLFF+93ZD8Cw6BJkcpApuCt7k6EKiMD7lsYE0uLrhW34zs2E5J6DoZsDXSjN789L3vzQBsN1Wv02VXB9t01yOBxfQPN99cfX5DcYMRQF5z1WrPAp2CKibVSoBPLBixEgAJMUANh4zzjFtJ4BMt+IjhEoaK4TLoEmiEl0tiFqMIpLrFuECJqnguEglMyXvzpyvRVwXaB1De+eL7yw7J0NDrwb5DDTJwf6gDZNv0jhKDXhAhJ6ykI5F8k0mgYGeFyhU3G4tFC3sqRqnPZNQYuzUEavWFVI5DNR4EMdQcovlCqgUuwm2VDVnJdMkNmzEmiLx4zAXQre+DnRVyTJdaQuZSnuB/yAGo4vVWQGI2vNyQjp76417dgSKI4EPhoT55EItMAQnCp1zEGlq7ewiBiAhWtk0fwPT4QrihF1gyZa1IOccQjpHN+GE8e3jdoEFU1Ee3D4vZdjRhw75tdjrkwWXWKBg5bkU5oVAO5TztSoXaCDT7RXvyqvosXgEd1a49+Sd530z+SkrNgISzOdQSvgQ6dJgRqdPumWObXnsy9ThQleCHWWcgU/ajBDKFX02Oyz8eTIo5fjdf6Q7togQ67pNnbE6peZwCNSu+4obd4QeFdFVzgy2FRC1Kx6UKBRsKvakxzWuFxy+cptk+/f31lENF4RhHeSGBBqEEqnTa0XjqLpoVjhx/88ZBURdADQQ6QaAGe4hAnRiBLEtpqRAxRyiEMr6eo0KPX719Pz43kmSSJPOje5WTZCEVwvZ2OpvjZZ7BP/c6jBwJ1GWoEEcgkTKhUIjmpnDFhTRlLCfUEVVNkSM3v3svBWL49Ld+BjvDlUKBpXBSHa8Vqul5rRWk9UdShSAPJEIP4RoaOkjMAWKkQDbTfLICen4sUoYewgBn2NFSoJfbQJMcv11bAz3aBupbygkfx0sP7QTUEkBlO08H0kOiylpBVaRsCeQ4uBguLX6/YrXnuCOBJowdlcxHf9r2CgirrA/w7R/jeF1lFwN6g0DcQSAsexqoEPKF9E4gChcyKVD5wNgb2E9HosqMzMDP8cW1IrpKGTVIwch2okhnh98Ze8NqjJWIr/vxxj50MaDDn5nWmXjnrFw4aOMGcB9NbXRCPz2gVHd5YsFqE946T8TWI0YJKL3tgc196GJAaVPc7aU+ul8fpf8BWg3FmwMZqe9uCv0voP3ltb49CxMKDfhk+xKFVPgs0G7tSxSCzwL9C2YdYVbVNg/1AAAAAElFTkSuQmCC');
CrtFonts.Add('862', 10, 19, 'iVBORw0KGgoAAAANSUhEUgAABQAAAAATAQMAAAD1UDImAAAABlBMVEUAAAD///+l2Z/dAAAEBklEQVRIx63WwWsbRxQH4LdM2U1h7DWFwAgZK8mllx5GFERMUy9tz730L1ixsLpsax8CUcFYq8rICqi49BAUUvCx0JMgl946YkG+LG2PPpQiU0gvgkiXotIl2/dmJVnGMYSs12hgNOvZj9+8mRVAjqvz048PJWdGH8Ac9KFoKgWcAUhgoIIi4AA1soj3Blw3DFgKO9BIr5+V5SFZ7mrv3u3P/7hZoAncIuAmdR5Yr7nDvfqVLOl/NUIpYG0wmtGTvrkT5k3QxhkcmsXRT7EV1Ck9sdbCXgU/pcpa+GbAcq8WbuLUrvwIoNzFJxmHVZY3QRHNoEwCbjXVPjBjEuPEoaQJwMOPqBg0XD1hg+Rg3TpPapZ1PtsvDSeTB6XT+9BYABNX+KoiTFDuV8Kbdum7w7ssb4IiEngjAXnkKmDMaGNHuStAXY3VZugKHA2HXzaRb3KvJ7ApzO7+8GI7OSjWpk8IKDPspq8ThM693DUoIjTQLFvClwrsoQa6SgMrGmjScDlUGthsZ0DhCUFNt9r1hcmKXuF7yYdK7ths2v1zawlk8HgjT4Lbvch4xW1fmh+KQLhQ9BHIkIO3qPGmBnJjBDjDAljNgL4GFi6A3x1YbSUZMwtdr5gBjd8fMuNpL0+Cu4UWxKYYlsfVXiDkozlQJzj4mc4aAXYTgVsE9F4D/LobiaEGSmb1kwxY+OtsRuuy8Q5jMs4SdNCR7AyeJ/+Zv10Ak6B4mv6SFlNqnAkEdoRNGi2APi4xAWW9ejIW9c6z2nnbsdW8BsEKaf0pwUoGhEG72gJXA6UGGt82+wugKaWjgWKUFc6dW8x0fZ1gwuznCYdBnzNHfTax0zRx0nSidgWVkK6yVNlJA5NOX+KZkqbpK9gHX3gQcwTu0RLHnWc6Qb2LrdkYgYOzDOhdAEME8gUwNo5BxaxEQHtYl14GrP2b0H754F2r7frLBANKcIxnm95MKkuwNEzTlzpBcKZ9sKNpP0gVRCtAgUCXNkncOcZN4jA8BzFBg5Z4BThaAYo5UHCjC27MBG0SSnAOxHNyDxfri/esloyXNRhwrMFAH5oLoArAVJAVIrB5Q4W4CpQE5MJz407LpF2MbxLaJPrEqGfAajjoz2twBRhJAspfCfikfDxcBVZx4NPbVvNpb7mL3wK4S8Byj4B4DsaP6BzEGgRYBepz8ORviUAaxs5MlF7U5YFtjXijC0Ix+1QkjZZZ6H98HE3+0UCHgzx8/yh8vJEnwe2TCIbO8dGZ61hHe3WwB1NM0JomfPFj4f61b+LsfMdX0Ewtu6PLN3Yuv0neAphtHzCvGHgRrr/2Lujr+AcXwMuXsfXJpTfJjQLX4cauXAneyjhXgTfny5fgdddNAnMl+IbA/wEcFF//KeCCjAAAAABJRU5ErkJggg==');
CrtFonts.Add('863', 9, 16, 'iVBORw0KGgoAAAANSUhEUgAABIAAAAAQAQMAAABUT5ZJAAAABlBMVEUAAAD///+l2Z/dAAADq0lEQVRIx62VQYvbRhSAnzIwvozs9DauN1VuhZ4kUtxAzLrQkn/Q+7gC0YNC3UspNKzHCOSLitqbl0Bz6Q8QFJocpQi8FFrSoxcCtVnYXLZgk4sOrtU3khyvW5ImTgZsaTSjmW++eW8EgIVIeF4EMF6v7g/wp8nZtrGzuXnngwefaDKeArR0SXqRAM6AAMTCbQM+ETA12wA0wZFdbDIWNdnN4QUl3q2SKzTFy1XgODuYGWetK8w24xjalkdkEh1wSgkT2nLtADBaw86ffnYtfatAN3Hp54lae8ehNdbD927ajKUxNAN8iHNqM6FgKXZuc8YoVnhhrY7U+xrqdGVDTXp0UCc4cL/kmeGtizN6tok1B5g+hGSFjyhQAR/H60H3u3B+ZppwaIX+7Rvc5BzHBFioLWO337+6tyHHkkytk7dbuEIeZzieNow2QEK1PSpiiLgbfbO+c6MpqcBOE9saT6gCKpu4csQmvWhvQwikVF90bMsDsIbBmlGiRdWWeSJBwtgxGjRN3ezuoVEjUoumn1s89K+n1vguAjVKIKMpKyDdPxGnUWFohEDZt/r9x72fZxugI/ej+3/nzwb5n3l7ENMkQ/V5UAF97ZhGSpbHDx3bGo7OlsMAGKG4MHGh0sfr/VAAIaiw7wTow9MkaQZffPgun0gEUoYoAq1wMccStAXwQRf7JNH0uSFOdBnvGFI+iRJaGoovGXrimvrQT8amM7BGv/9yugygqwU4jvawALKXBVA3DOz5X3JdTIZA33Te4yeXgcwSSG2a0HyCal1lqDFKT1do6MfHT5/NF0aen+X56ujL7r18XRjC8nSZrfCyquGfPISpswGyWwyB1JYpQ2qnGL2Gay6AzGZ4Lu6gN5MgUDbdMVTF0BYooLa1NeTylu6rYwShaWkIWkBTjCGcQ8eXVB+gRglkm7pHN0APjtWWYQyhxQtgGHoF0CMECpwtEO9jDI0n10ug0P830L3gvF/F0F5AvgLqINBJEUMqy/y4p7asAnIc61gBbWKIc8yy8USUQe3VsRZdBvr+15/+2GbZ6wE9QaDAQSBMexYTSIK1ih2/PKlrJVDnllH/zY7KLPNijCEMpjCcz6cXk0ODNNL5YoZZVo/VedpRoacibz9DmGV6eDZcmEcHt0Z4AHyFQW2ESQVUfcCqM0aNqCgzyP57tPPqK1e8BsLc11BZNLk7uubtPOhvDkT4n0IqsbEC2s/QC4DkS2atZfBK5U0MEXgNoFctb2IIXgr0D4bOQXc9boNNAAAAAElFTkSuQmCC');
CrtFonts.Add('865', 10, 19, 'iVBORw0KGgoAAAANSUhEUgAABQAAAAATAQMAAAD1UDImAAAABlBMVEUAAAD///+l2Z/dAAAEO0lEQVRIx62Wz2vbZhjHH/UtUgZKVQaFV5NJs1522eF1C15LW4tt5132F7zGoFzEkkOhOpRamYPjg1ffhiGF3DbYyVAYu+01BvUi2I4+jOExyC6G2pfgMhHteV/Zjp0stETR4bXeHzzPx9/nh16AHE/zpx+fMJNoXQC91wVHFwJMAsCAgPAdwA05MAfP+qYaCJAUylBLL7ZK3uFVp8HSEerR5U2DL8/u3Prqj6sF1ME0pPeCnDwy5OgC8Ju4MYTroIWwpoOI9dnhUKiX27CJMy1kFNZ7w6n09O1mmFdBCy24YUaAjyUgkOrR9TrOStJtaV1uV0IQ90E6uQEgoEC0YWCCNkUnmuBgRRSK4VZYQNOcPQQottCTtlcheRWk/SlaxkXT2BXP0Ns4RsMhkwagKoNX0uQ27/RC/54WDsGhnMclrc5kHoigslvnTIb4GrciUaIoLf+GVict+X/3PiZ5FaR9CtIVmGafCyBEa+BE8CVAlWr8fA6yWqgL/Ds6gyoC6pweCZZtFjylIDTv4BDnVBAZpM0N6jGBoVKAXCjAkgJUqcZpfzwtW/Vh4lr98fiRhUVS/O5IgGsJrSUVTJgELFtk0vpzYwFIoBnkUfBBp6+dmJbH9HvUpxwcDwEJBh2PiFFBAZraUAJGVK4VG5WOR9GdTmPmlESC02ILFbRfPLc9wQjR7VbVyQC1358QrZNLwW27DrFOo+Ko0vEpezoDVAr2fpG9hoK1uwwYzgHtxl3y2aSxAPye2VvdJAO0/x5MZVxuXieExZmCLnIk5d6r5F/9t1PAxHdep7+mTioHdww+xgf8tD8H9DDEEpAFlcMRDZoHW381MGizHAQjlPHPFHw9ldGdhLXDf6YIaLxtlEmptwz4kceYqwDpMEuczTWi80zBhFivEhN6XZO44suxlaaJm6ZjsU1lCqksS4WV1FDp9A32lDRNT+AZeLQKsYmAOzLEcfNAKaiq2JiOELA3mANGGjqOiiFHi0rBk7vW8RLgDwgYsGoGuPU2kfXy6QdGgwcLBX2p4Ah7myomkSl4O0rTN0pBcCddQA26fiqgvwRIEZDLIombbSwSl2AfRAU1GeIFYOccYIM5+gpgARWcAWLR72Cwvv7QqLPTHPRNzEFfirUAFD7oArJEVG0W1DlYAWQS0KRVHjfruqxi/JLIfFMdI8gAK53IVoCN0xwsHvy8BBgVX64AVlrAvrhl7HZO++AlALclYLEjAbEPxk9lH8QcBFgGVJ86qzo+ftyuDlSbwSGyG7UXRyovB8dqrdaO7O7jdn98rABdE9jeJ/thE/Io+OCwD5Hb3h9w19jfCcDqTVBBY5KY85vA/ezn2uJacMHNQlP1NDxzj1n9klwCcOZPP+fSdM7eH94FiE3l7LK28fnKbeZKAW+cmc9f2P8BPn+/++BlANdW3Z8HuoInl4IXPVcJmEvB9wT8D5z3gXD1lxHRAAAAAElFTkSuQmCC');
CrtFonts.Add('865', 12, 23, 'iVBORw0KGgoAAAANSUhEUgAABgAAAAAXAQMAAAD3IxYxAAAABlBMVEUAAAD///+l2Z/dAAAEsElEQVRYw8WXMW8bNxTHH02D6kBZyUZVgZ226JaBjoG2gQVdp0we+wEoGJAXITVQoF3aigcV16Iw4DUfIFMnfQQaB8iLh443uPB9AA83FTfYvj6SJ/mk2LGNXNIDRZ14FPl+7/8eyQOo6frjz79+2lcMVFPjrwTrpk4YALaAK6xs9KXsxsDXCloFtAwtirvmUfe0J2UPBPj8y+/++fujAvRIenuvowmv/mZcGfziH1+B1uJPqi3AmrvfotJ+bWic41sgGltXAQTWRK9CKuxD275Kyz9vaNtGQVKcjyQbNLPTr7CnqlYFaBYYCIyfMWuHuY8I/EgQzNjJOk6ALa+GNOhYfGw6jozb2qyh6UhvbPsa0UBzVEDG+c/wDbOmmG26TyLhAPhTY+pUgAk0SToARl7LGIDkrXAC1rnSjQab9r9yC1wn9VIIMtnUCq3vMM6o6IDqQDoysH40UQbvTT/CEOKKPRnAkIPhRL/CYSMxiy5TpwIIYJ3txqZc7VobBRWBRueqBQCib83qzXCCPvhqIQeEYt3BvDvjQamA+ExDzQq4SLYhgAB97KckTmdD3XgAF0Jyiz5yAEwE4yzAyKN5MM6DMF0nqYqFpBcD19KPhFUgzhV7hgABSdH07xnvXwMY5KlLge5UyMYFp/+im9tjrjB2SY4ANv2I9gBrJUC27gHQu0QLglZO0dPWCLyRMBgw21ICTLvSARCNT8Xm73MA+QUGVSzqUmAvkpIKxvim5jJGAAV06AAUGdvRGDl18tgoWwKAKsDzZYBngg0rAAclQEP+AKYdZnUpsMsUAlAEGCcyvlBKPp4BeAVYY98NeBdADwGiKsBQsJ1fwrwEiE56ccZ9DILZojMFWiladtVKmof5pU6uKgCNLGlmxWVRNAtXH+KSnzSyEdZFVgWQJYDetwrsZtvjYRDxIMznOQCAK3gFYBS76I9gdHwxcgAjVIBejRYAdn5lJ32tghJgCGWqWYABFV6BK1CXhziTaKJHDvOVVtooiiIbYcXgjMP1dlhkWLBRtYoz8N0KDyBmIaQswEC8iocuiZVfhYKj02UALM5Kv0o5BY4vJFOLCuwIdoAA/RKgOzrOJWa5NjxMFxVInAJJgVI4h7GZAq3srCjOvALoctQKFcD+CMNaDiCDXcYRgDsATGI5LQHsYur3gRtC6G0ATGIEWMiBEwTYNXOAJ/a/FHfqpBmm7bGo5EDiwj2ZH13YLAfAFZ8GUGaLKlNlEUA4AFxG25HYDstVyO7Edhx3Ne4G+HER4EA0qgrwEiB80w5TfpRVVqEaAKQDYA7gsdsHcDH1Q5UAZDI7t70UaNDMysoyGp8OphWA4wNxzJcBYgT47dMwBVqbAnuRA5g6APK6bfd7JdxGhonKrjferPyW8XkwPu/FWPxGlm+EOdqNR4k919KzHewN5rqKVe8I7889AA4K9JPnbiOrS4GuTS0exHnPKDzMvYgzexaKLMBsKH/tz8+Y8wODvO2obA8d1BVilp/RR1+bpdPoewEAe5c1jL519KFwPwB2PfTikF21fBb6kAA3ePAeb2ujh72R1QNwozU3+HCt/nfi9wNYedcsDD7YVZsC8D8B1KbAAwH+A47FfiuByhY+AAAAAElFTkSuQmCC');
CrtFonts.Add('865', 8, 13, 'iVBORw0KGgoAAAANSUhEUgAABAAAAAANAQMAAAANAo4NAAAABlBMVEUAAAD///+l2Z/dAAAC1UlEQVQ4y52VPW7bMBTHH4pCXYwk4wMSwEsOQCAFo8GIO3TIAXIAoi00qUGAAAYHQd0CD+2SA/QAPkBmTpwIj4ZQBx49tp4cDYTUP2m7TdoEjfu3RD198f34PmQi6ghSKe2Roj3ldIeCuafIWurRYqcD0YB+6XQkmVkSSYmNibFhCGfhF+9w2JlaWuy29Jj4nq2JNYmcUhKUCnJMJzBhQVky3Ic3HtxqjQvv3mM4PPu4HYD25DGX10WPsCQiFd4I1qsqxamzwllOKbec5yzgSAeTs8KSKoYsoFtyDr7nc0HZ9Wi6HYBzZOAHXhQlSnvMt8PiMiN6mefAcA9io0FbrUxrEzUeroJlXXgszwF+enbzPwADjZUOCuNIsNpnMY0ADABji43SNHXaNBVMazNrCzVelEVa2HpehhQgD0fZ4Wi7FAycaVSZ3Tpn9XQGAB8AaJwdAEBEAJtAOFhM7JzZb2wQAMZ+MuSErXVLZM57IUWWXZ8hBbWkeimbpazXAF153L9rj9u7VrYku12S7RpgVplcuIydt2468S6kgNlT74Df5kUEaEpoDeBd/anaAEzU5CuXAWDWNMZ0zs+1y05HN1zzsuFEJknDdbdtsfGxQIhC5bbU9pn7dxTuLHaRAZOrAOByN12GFCj4oUs8+iGWorPBtzVN04QIeFPdA5h/ZhsAxgA1nek37XqxC2opEYFlQzWizTECfSw/RIBaSd2uRCB4BWBNbgCgAXAeaiB0YSWmOLx+AACtUrAGOLF2buZfqghg8ZzpXF3rbNMFSDbSHjuaYw2EAggDcdxDdUSA2RpAAICMch4CAJZEBxFAl0VIQSjCCOB/zGCWZYKxKa4uSi7KAKDxxeqLI1p3wbMBBt5kXpc7Xn/HFL1VBC5ib3UigPj727S5a2ID/1b3BYZ1FzwbYDWHevJDSIvVQfwJoOlxxS7YBuBNeMs8DbCtQhdsBfCPv4Kfp87QU8Sh0TwAAAAASUVORK5CYII=');
CrtFonts.Add('865', 9, 16, 'iVBORw0KGgoAAAANSUhEUgAABIAAAAAQAQMAAABUT5ZJAAAABlBMVEUAAAD///+l2Z/dAAADzUlEQVRIx62Vz2vjRhTHnzIgtSDFC73IJFRLjz2UEYZ0S4yV/hE97UXGoO7BpeklGJrGYwRKDwq+2k3Z/AtaAkugh44rcCi4+NKDTBcqk8NeQknIxQVt1DeS7cRtwm5M56AfM6M3H33f980A/Ltt6/D29tEXn4QS4xHAmsZINbBBV4EAcLu+AdhjQ0Q3AOQeA6jjkHGhMCu9LxpffCUrGCqGR6CDRIgeUYAVkNgWh5qJ8d4D0GVCgASThgqgyuKb7z/+yf1fgcoAUpy9lEFWQGoF8AQwZIttbQMUTnFSbIthKV6L16kqy4oz7gwQaH1VfL+kQmWLFcSyiKZwaEx5Ygzo4FLeWIw5jqr5nMdQr8lqHx8eX+Mivl0NKFRMVjOv6Iatq6rGpc4A56t9my+tkGMyVfynbhk+gL2LSCqKMQVyS3QC8MuielKw7WyW8uc+piz8YJPS7E02M4U0j0M0WFIhh0KW8XI16KP4fIAOIFIwTZlLBRB3jILi9uLJbsVQSCvUI1s7LuyHZ2YHPdR2CQI11o3iwSlNhIcKCusFjeUU2nGoEZJR59ypBiGQb1peUyUyxsnd4VI7AzJb2GP6qAeuERb9Z9rP0cApmR3s6Z6GT2miqmbX+zJAfa2jPtkK7VyhfQSafKsdDavH8Qxor/7p0Zv0qpn+mW40udybJFBP/SnQqzrVWp7ZPQmrQc9zRi0PLMkXQH/lQDwHau+H40s2Bfrbb1jH+gzoh5A8jemuAHIuk0SnMJB5LxjMFdKJxviCQhS3DSL+OFeI31IocjKgDg2bwfDg5eiNB7lC0glWlOSaLAOyukIddt20MoWSZ/XSAtAjOsiAsPzQTn8ccJ57CPM6SlCh58PXV+MLI03P0jTZ+9o6TK8zhbC9vpwkeEsUvLAKRDWquehF6lS7nd9ejkTK0EMsTMR2UnRLF8LUDi1mQNymJEuZfQvox5AcPpkCobdtCr//+nkMcw/V9TXhckRFOXKFYA3kED2Ea2joIDEHZGMO5Amg8gwoqzJUUaTsfZw9EWVvZgr5cyDnq5uUtdulQ3oDVBOZxt1iXmUPA3qFQL6DQDoC9WvoI7AwIub8BENoOVB501g9rb2Isipze2dF/9oqDdFV0flexVAL46tisPOhsdoXQBVhj158sw89DGhnj6rDs/E5Ta3PhkyKv/OaYLR7Xl5lSg4kTzegO04wWfTiKvHtToXzWzv1w4AgL2823fJmdy8/ywibHh152/4vkCouK3eePsspBI+zhWe/NgNy2QLg/a1x/9CSCt3Z3g7yDm1Jhd4B6B+GcGghNNoeqAAAAABJRU5ErkJggg==');
CrtFonts.Add('866', 9, 16, 'iVBORw0KGgoAAAANSUhEUgAABIAAAAAQAQMAAABUT5ZJAAAABlBMVEUAAAD///+l2Z/dAAADUUlEQVRIx7WUz2sTQRSA3xKYepiwiiATYrM3D+JhYyAqyAap9OxF0NvWgW3AlQqCFAzpSqBeVr1WlPRfqBT0uktge2maW4ko2hKwFw8pAY2wZn0zG2MaK9RVH+TXZPLmy/fePIBRFOHoceLs6xnF8doA2bSTmlszgVFIAXimXQRcMaGtYz7iOwA2fqV1p5xS9GseGx/EVNYOPeT0789XJheuXp9u/AugYezARTzEk+9zSyXN3+vZ/YBfqn2y8vthaJTaGx8LGXf7tsEWUp2LVXHU/zE0AA1SXooJVYrblYXKZ9wGL9xxA55Z3hIcFi+2m68k0GVmkYK9CcZkWZMbSnnjQFYx7yg1ztoSaFsXS3rGneUnyjTgWdqKgc7caK5zAXSOWSCAzMmyJjekOONAt0DHlRS7K0r2pLfbBwgQiPArZbo1/wPIJKy53hFAlFkKAi2aWNZO54Ys66YoqzT0CIH6D9Krrbn1nR9AVfvC6reotxR9iIpLHvH7IdiROwR6Z2gro2ZoYTMMysZ59eHDRsYVqE+CvAAyNEq43198v5CjzfneEOhlQ/xMrc/7vU8VWs24M1bhJpY1S2RZR4ZYKu14BwzpDOKeiw15Y4Ysfmpl5D4g2CeL3GC+MwR6+lkADQrSUJ9+fpCjmxZ+qphERSAWoqG31lzBrlQwx6yVv4YWc7FFYUh91HgToqF6a6+329WiqBNFYXWh9DwaSEMYe/v9EF/CKXxyDBj7qwgECFTm55ni+F9doER5HBuSQEqZfryXjYFMkwCWjFEJZGLJNjlanN/vLm7fRqC93k9DNsuml0WbYjuS2BBkgTSwhwBoGvtF7AGiTQKp9Q10H5pVXcM8aIjC9DjQSVs2dQw0R2Cjww8A4R5LuSahm9bQUGKg2H2Ame1bps5iIIC0OwYUX3s3BuKE+cuFIZA1ApI9lHElUEJDHJthffhXA5HZ4vkV7CEWYooptyFvWbWUU7/Eg/GZGIxu11DVWlAI6WBptb7Q6Fzaum/gnl58y16IW5bQUMVQAW+ZyKzVWyLzwNDUmr/bpWJCuYE+nAZUh1+DHpwZB/ckMyTGGU4mOjmN5GHjcez4nwIlM4RA7FAgxYW/jGSGugBqzTssX/9vgZIZOkp8BwbbZTw+WKI0AAAAAElFTkSuQmCC');
CrtFonts.Add('869', 9, 16, 'iVBORw0KGgoAAAANSUhEUgAABIAAAAAQAQMAAABUT5ZJAAAABlBMVEUAAAD///+l2Z/dAAAD9UlEQVRIx63VQYvbRhgG4G92XLmH0Tq5jYi7duil9FIpw6ZbCLbb9BR6LfRU1BqUiylb6CGQxSvXqVyKtvRod0PzB3rYPbVHGYFOTnz1QgleBD0WLYFiqGN1ZiSvZXuzzULnIMnyoHnm/aQZgPXGxAF1M3dyq12uv/vbXWSLqxuqjU1+pgQwgAdwG+SdUaY3gVLEnxjDK9ub8ljL3BEPVwA2+FUZrskLqBVLgO1F//Thon386Vv+/wCi8ojHcG1njkgbKgsQRt9NkPV59T0b3uh1H/x+GyPFq5Wlr5UPJ+XZvvE470dpQo7+oRsI0P2zKAX58SQFnUybLEf7yINIgnCE4iaU5PDQTIfV5VHhp8ZqRLsJqGWDRQj1APW6jxoK2VBqdq08sHIItxnsethwPzG9NCHHPP3jTwGyGE1B/Z47B9mUlejTuslrL0E8IQUMWw5P01HLSUIAgwYDEpiZiETCCs9hAerdCggWZUya4jMYCdBAgJKE+sfTv2XJ8Dpo5FG2fXBg6SkI2SgmAiRi0ZfeAJ4i7CSFmpyXzBVjIoQyoHsBxZtDHO6aOi0VB3UBUowD1/ROjmRCndbxdPZQfTJcAr3/5GX8Yj9+biYg46T7rXyH+mcx/UpziMm0nF6pDjthyGtPPmi7b5uiVNeLz768mQVRkQaKoClBEJ19FFS2NEcxuhzEg6mHyJ2SapuY/aORTKiDtV+fY9X26uECNNGpLALodGu7o1rMOApkyUIt1pnqkP4LzS3Wte5TR+fDVLUfgoB9xvsbbmAZC9AU6L44t6dJQmB+cS8A4CCUgIYhQ65HDacw9s2GSKjQaWvus4fqL8Mw1KJSHIdx/LJnVw/jmUhIpyQBTRp7+Tie8cXEZAVHbTPN1TloEPBvskm0n33nIpCbTOu8ZBx0S4Jwf56QAOmGu0jI8TXxlTkeYKqLb0IkZMMN/r7xd8ikpKR2Ama4O6CU4pkx5qCbTgFzkDkHgQC16wK0zUHHyyBlCWQ+amQTSkCmcbh4h5z6ZSCPkpzawnXD3ZMgmZDhqA6jIwnyx3wY4KCWfzEIVkAP3uHdf7SMZdBPma+MpSCFrYP4Z0/EOnSXlyIBUQkiAesK0OOBp48kKPDql4AmYG1VC7YAwV8Am0P/tLtT3Czl3fshmvKFsdURC2OS0ByUP4vWQVNKNqnf+fpkIkH/nEZQYSXsWuyb3UpFO+zYOl/8qoXC95YRiSU/3/bN5YVcuXifoUu/8Npe5njJmqskW8e8ZOdztSVoAkkP+QRFPBWN5f8bfO2uXTyyAq/R8t7qXvZfIDgH3ZlP6U5mmhsru+pVQXDVhAD25qBsxq8DukK7QkJyqlnQ5e1fwNvi8KJZO7gAAAAASUVORK5CYII=');
CrtFonts.Add('Amiga-BStrict', 8, 8, 'iVBORw0KGgoAAAANSUhEUgAACAAAAAAIAQMAAABX1Y15AAAABlBMVEUAAAD///+l2Z/dAAADfklEQVRIx41VwYrkNhCtZMBzMe4c6yDSv2AIDIY26l9p2OBDMIshsNqFirz7H8lH5A8UBpRLM3vrU9jtMDB96xlYyPTBK6VK9jI7gdAukGRVlWzXq1clgHOCbYtQY16m3cW3QIMLFIjSniwNdNKaPAbvvOfdQNaLhNrVCAgOMnZ0mDk3vXIzLgV2rxbnvx/Vi2vUjf0eIvSxVkQK1gBVDZvNXlWFemPUcslrlEFvRHMLa17M5V6PdnYv1ILHQ5fskBSx6CLMAUC/ahDxT+RdRuQ5Eg7VI2aw8df8tG0a3nrvjncpdEyzLzd5DSiAUG0HAO8GhscSBbG6wO/8S/dnBCCWusGueXe1KuAPaFRRVMDq183xcPgBlDLv4UpXvPY8gr0XjT4Ypa4g35vRDuK35jGE96Ix6oKXqGYBAGHz649lmVsBIL/JPXGecwEALfqPfhLMOKZ/ngBoPZ9poMhk04z23ei6mU4gwsmcEWZAaWrU8FtjAD5DzWF2HCtUjXn50ig9SsdYrXkdzKNsje3l8G0wo7lPE/9/UFNYlkcEOwuAtn69hjKvIwTAXZ5lPpMYhcpZ9olz6YUSmG3d7oPwwbFx59usxPyavySV8QwA14jdZx0WcDsDANIIBn7XRwiPnMqqAE4ml8CKSFejV9+xLJRSDzEmRZ0AMAd7mWTZiRPbg7YjIvesYNd5DMjqFiYGlLucEr2JIWQG0McwOH86fQjoT87f+MGfCH0bqKIyz/mEABRSiWz9CAA1vt0xjYQBizkMeKGFAZAYAMoSGG4dFZjV+nM3FoqtiGjJAZ7MCMDIAB3MOkkvfpHt8ctr5YF9AsyQln7ygBj5f3FzlzvfMwA+Sz2gdCmnPONWUu3dDVt8e/SlK7MRAFZuLAOQSn+wLms87bx1AoCeAwB//BLe9SuAx/GPBACwR/PzavI6LpkBKcP2fkx9mtV+sg/CkK8BUI8CgLZhVgngtoe8lI6OjvJA3AlL4gSK+RfPjS04DvAkERI/EVLFhT7UF7X8pzTBIRUNiT1z3BIrbqWBbwE4nW2CGC0DoFPRchOU/gf9AqSW7+/MBOB9IRlmakc6JIpDkFnt7cQA2cWiKKIeuwIkg+oGmC/fAd+Eb98+KcppPJeLp8dvpM+MFx9fmvTcjwTbOfJ1mfbj0kkF8KcWf38xqMnxvzXd/Z9druRF1T38C0gzi6jZq4iaAAAAAElFTkSuQmCC');
CrtFonts.Add('Amiga-BStruct', 8, 8, 'iVBORw0KGgoAAAANSUhEUgAACAAAAAAIAQMAAABX1Y15AAAABlBMVEUAAAD///+l2Z/dAAADcklEQVQYGY3BwYpURxgF4KMDtZBidHkgoq9QOBCG5NLjKhAQss2yYKQC4SKuegb5U1ezyFPEh8gbFAycbC6dXeNiUFcD2YgQkA5cqtK3h0hIIO33YS/2PdHRB8wObsKmUq2aYWbZJttYtxSziiabbLKoWe1KR9Amc9Zl0SlOsskmq25WD/l06bAP293TCyLle2j4vXU4PycWwHmHhw/f+uiPlz1hT31owbOdfxl96AULvNMzWvRc9gSiDwfBs9xOge+XPRDJxtiwF/t+sUwkfyUAZyZXSpFEOkRdOGlUWolO5Z12Ju2E6DvQSVlJAhTXV5pFzRzJy27YA2hhkXiUXnx+dIhvkOB9wDOAadTFEQJ1iTRosRgHMtX+SeD4Chcrhh4hKjBdIsECx/tk2py8YpguQQshtRAb9iJq/PlxCD4TgF95mWzyEslMvcnaShKdStVO1E4IPuFwORbVpMp7iusPmiXNjCTenu0BtnDWMeFlSsDX6EjG9AxgSo++St52xpJSPQE4JdgsraQfJVO3s5CZnQCYhsmsmmElocka9iL67vwEwXcNFVx75+RECYhw7g+pSEmixrLW1liStJZcoL8AVhuppJWoMa5fS9qUJK2l8pSH+OlsD7DZghjxy2JEBZCDR/qCYHf07aNuoZ2xbN0m+f7DlWZca5bkdj4rkgaStUlqUl5LGpQq9iKq63oEnwkgrL1pK1gGmGlvNBXVmCu10c7Gkvpq2YL3ADSLS1FT0krTarSkfm1ZJHF4tgfYwumCCS+RMKOdI90igPTg3p9RO61sNpv7JDfpg2bpSjO7zDtDqbUOJGuT1CSsJQ1KFZ+gt+8FspFgvPJFgxTkSIcYirZKdaJ2plEuqX8nV4LzADSbnCglSWUpl1a2lhNJHJ/tAbYA8ggvhiP8Ld0CkMf04Oi07owqpQwka3qt2cWVtnLUtVcqpTSSbZBUJV5JOsk2YS+i5zjAB4JgMV/NmQUzEls/5MkmiyaaTLKSZZ0dS1a7gw5AnixbNNHUSVacrFsem6we8inKsAfYMkgg41oGMNzCXQCrx9+dauc3q7U2ks1WNoPNXLzMO09sq3nv24nMJjNYzvm+ixt8ujsIwPPn+CgACPi3A3x0A2j4H8SnaPiPCBwDuHl4Y4FrBNAANPyToeAaATQA7TaA97h2YLH8BXMUxRSSeyM2AAAAAElFTkSuQmCC');
CrtFonts.Add('Amiga-MicroKnight', 8, 8, 'iVBORw0KGgoAAAANSUhEUgAACAAAAAAIAQMAAABX1Y15AAAABlBMVEUAAAD///+l2Z/dAAADY0lEQVQYGY3BsaocVRwG8A8C4xaDbBHCB15wCx/gYHEZZLnCRVL5EAPCVgeyLBYHOZwUvoMQ2CZFHiLdX5DP5nCvWFwWDEuqLUMKWaYYRs/MKigEJr8fZtH7ZbslHS4Y1+y2QwgYxSZ0oRuGRulTmRS60IWk0dCgWYIwVGhgrK3BhcOkpts1wwzQNRCDXwMR69hguyUKB7TtW+fodj58HRzpHem7naPbeQRHehocufNrwNF5R/p658idBxzpaR6z6H386UBHTwBVYFXRrMqZJJx8Lsxascr27pQLoySv2hkbcN2Fm+BTB2T+0oXupg9Ro4HkfqsZQPASDbfpusYt/JJ0SsA2Hk6nayxWeY/s82K1wWK1Qd4vVnmPmBerDVZdWKw2e2xSWKwyFqsNnuwXq80eDIvVBivDPH4x/Ba3i7ZuCKDOzfrK9X0dRbrI6qje1PcmVgcbzioiJTWia+mxrHLe5Fa5uTrwXc55I3PSg1dNEm81A8xtFCNeyAOv4aNzrf4knHzhwuTehiIVOoXRw1GjnNeTz3IomuKmCyNkjTphFuEjz8u2HhIieGRb+UqUgBb1+jzIZHY3sHpvD0cVFeUfmuicI7BIMvVBYv2egwqLTn5oRMcaP2sGaJ0ihJc6IL5Cs2wJfU84Xf8QvlrnSW8jFqdzHv111uRNNXlufcFikyfpqFEWZhHDE/cGbd2QgDvTnuanohLgIt1RMplJ1MF0p179U8oPvm4dCUAyWSuxPvBBhVVOPjZyJPGjZoDWqqbwMnngNYCwhR4DIfrrm3M1TLL1BQsdNfrjpCL2SpODjVjoAmdd4CP4J/4AR0+C7YmmIWfmiiQcTFkyk6hskuzhIKp5p9pcTQAatUmsMzUyfanG+9SSxCeaAaqNN4x4gWvgFRAB6DGKw7PvnukiywoWutPoV41q08VBIxa64ElF6hNmET7+HkEHLECLaYh1CAxXXABwG3WxHywpRQ1StJgjYyPVQ1M1AFIfU2wrpW+VpNgni1ep+UbVUNPh02EGGAfVrHAbAdxi0j8GEXF/dx81uY9DkYpecZTiqLY3afI8jtJIcYSYisoqfIxlXWG0xP8sUawxqfCvusJ/DJi0EWgwsgoXESBwhVkOxRprFGtMDHAAHn3+CP9w+CAzXDh8SLT4N1qMFFyETPf9AAAAAElFTkSuQmCC');
CrtFonts.Add('Amiga-MoSoul', 8, 8, 'iVBORw0KGgoAAAANSUhEUgAACAAAAAAIAQMAAABX1Y15AAAABlBMVEUAAAD///+l2Z/dAAADQ0lEQVQYGZXBsWpcRxgF4GMbhmAGOeWBCKWIyhRDBGYJPzdGuPQDuPxJcRLCxZFSKIszjP0EeoK4cOEuL+BuYcNUF7kTChiVqoJRZVyI3czdDQRC4Mbfh0nse2LGmDC6YzPLMVsxw8iy5b1cisl2qtdqeZ6tSHW5XNnCPgXhCNiFMzqxlbCxw6Of7mEKsXu4pMl20cHWxvmc6IA0w4MHC6bIY/HzvRSpFKn5cYo8XuKbFKmwsBR5LAIpUikSfpwijwGkSMQFprHvO/UkRQBBDGFwDxIZ4KpSkruLYfB3V9Igp1SlmDzOQDgCEhxwYithg+SvViYA8b6JrsP9g4BDiDEmPAWOHg61fgFSp9i3RAqk0J+ROrUqch+fLETqFPsAKZDSzSmpU/E2KXEhTCJW/tv3KUUjgPiEtjvkHEwk1wyXyi73J2K48NV7aZBRqmZMKfaIlq2z1GVG8c9suessS7WqkMS1JoBdktHw4qGA17BCup4S6aEePRJty0tjja6sUf9EzfJGtlFshIbYyhh9wDSit4sTpLguWIOFHoagKAGOsHsuudwlhms/v5QGBUrnZEqMFQhyKUmMPVdq3JNUe8Uj7mCpCWA/N0J4aQPWrwCmCH1NpNnB48dfJm386CM2799rNCsa1T5sfOZq2Fi20fpMo0GYRKzC/bdI0QggndDDKojqAK7JyyLXfK7CcOH1THnIgbKV0VOMADq5SpYY5zxX45ak85nY4J4mgF06NBpeQsBrgHkO3QUS9FX3h5eNnOYNG11q1J+osRt1G8+8NGy0hXONBuF/6PMPZyBFgi56iEFUIAMcCynJXWIYvFb5WwXK3omLFCIAyeWpE2PPKuXOQ5Kt+i6RhGkCGBPIgBflAHiFDd0FkAd9e6CtYc8bNv2ZRlUjLrR14SM22uKVGvtgmET0HH5BTADBhbHkmI1mJADOlfdy8U5mtdRqXpRprEve2B0D0GXrLAXFqFhlHjzvGvsayg6PcF0mgCggDYdoDoEC4NldEMCb378zbbyJpbFmXm2EG2u46LuNn20UG5ONkLuGC+JjJOA5/pEw4RawxpYBc4w8YMsA4iMYGsOGAwnA7Z1b+Bvx3xxbxL88R5MW6S+vd85m2YvEuQAAAABJRU5ErkJggg==');
CrtFonts.Add('Amiga-PotNoodle', 8, 11, 'iVBORw0KGgoAAAANSUhEUgAACAAAAAALAQMAAADRQf/XAAAABlBMVEUAAAD///+l2Z/dAAAErklEQVQYGa3BMYgc1xkH8L/2jqctBjGFMV+xmMOoWIQJDweOLZZgrjjcOZUqIR5XfIQwhavlMB+T8RUihYuUwaRyEYQqIUSqFA/7+BfhsTlSDEdYji3CokKIq4SKYS9v5hCYELJOyO+HnSaHyGQvoncHwMFnQIPMIcwx2B8BI7y332QjoIFAsMY9fIS1uLXglsctAV5+vQNKjAEYshvgBplHFpDFcShsQQOCHCRflIqFl3JRAc9//7unBeClXFQGeCkrX4whCy/lYgospJwKpthpclhN75xK4Ylsz2RuurWtGVDAq1ln77ZdzdpxTVpnXd0tmW3rWM8hCCjgEYAg6I3hm2aEBndlvXh1tAOknJMS79sp9mA4lS+vA2pgDRwdfSziuQJ/Y97/EoWf4t1K/HSFo6/+/qdnS7k28dMVWEL8FCIffFCvxE9XwOgPz582z9Fgp8lhVf88eZFKALjlTKkxkhQRyDGprIKS4hjYUqnxMDF74kOhKKyyyswqcUG6zrq6M1uyJbcTma1e3N8BYmoUw1k6BM6Q5FIiXgvC/PL8/B+wQWKX1VlF6+n5eTpPPwTajyCTznqlLTNeEzsJtk8fJvhiJgCKVo6dxvgNKeJviqKlxiqcfE9xKbxpqdT4aWJLFt4XR4BTJnqqOJVWqUnpE1vyiZcCr2QH4CKwEuLbVKF+gVT7L9G8FgStPv98KhykGDLJqg1787+kTI1u8CF7kpmyh2XKGIidBFVX/Qq+2NYAxq1MPvpF131jBAKctFdVVDuNV+Iuw/aKysp8qtpHj8SXBQCnMdFTxVXSKjWF6BNbsvBS4KXsALl4xxmI79Il6mc4lSBIr4FrPXz4sBUOrmLIJHv7lj1pUzbXlRt8GJlJRmXP2pTRiJ0EVS1/gy9mghtIK945R2ENROxJS40awpKySSftkhXV+VRtKZ96KQAsNKaVp8rxqbRKTcF8qtpHnK3lLl7d3wFyEawU4ru3FfACkHfXSBUArR48eOCvBimeZpLpFXvzNmWiXAwsrjLJqOyhTRmV+Am2Dw4TfFEJAN/KiXNPKHRAuHFYUaOGQAp50i4ZWn3i0+wN5cQXBQBqTNFTRStplZqC86lqyeClwIujHTC5OOFWDN/iEHiGQfoEwPzyi+MvTjhIMWSS6ZI9/WPKxHjrIvYko7JXtimjEjsJqu7XCSIEIAcbUTrS04l4FBKpVA2kkEoyLJU+zd5Q6PcLAFSm6BcqqtIqqyrQp1nLx997KfDq6x0wMUUpDmdbAGdADSB9gt7Zb8+Ug8SQSaYcHB2nTAJvXTBmklHZwyZlj+0xdhJU0/QVCg8IJFhdm+vMm4kIRIyddd26Zt2xI21tm87XJSnb2tUA6s7q2ruN6EbajYUimK9Lo9tOZIaX2GVSdihhMGSGwfZnAGqM7o3mHPzVtlmddbQe/lxn87CqB2Z1VmS2sR6szlxw2KkE0AB7ERAgIhth4Av4Eg3GGGPUoGn2GwCj/eYAwGg8wh7eO3D7paJs9hGKz3AAYORwV9b4Kcb4VxEQ3Gpuefxb1xGD0uO9EQYNMnft8N/wQIMfcQj4T+4AN7jVAXP01vdwywDB/87j/6BD9080VhICa+4HhQAAAABJRU5ErkJggg==');
CrtFonts.Add('Amiga-TopazPlus', 8, 11, 'iVBORw0KGgoAAAANSUhEUgAACAAAAAALAQMAAADRQf/XAAAABlBMVEUAAAD///+l2Z/dAAAEh0lEQVQYGY3BMWtk1xkG4Hctc6LioFWh4iURGxXCVYoTBOKCvgxhKxf+ASHVhwRvUhw2kgnKEC4nKxNcGf2CuEzhUqVdTTzmpLnIndgQIxYCqsIy4GXZYhnl3hmywUHL6HmwEpX5oOHGMQYPjGaxbBczIMCt5Rt7PZ+bysbN7JNPmzfNGyua1ul0bk9tE8RzbGAbzxmeN1hax8JDzg67MkB5JzBuSzQVwy3KrXE8jigADb/cmdBj+rg2PzUnlSL1+iRFngjmgQqz1gNPZIAHyiOVTzzwRIDH1IWZsJIpj6aZpAhgTY207UkSEJFUTcrqMcg/qVlZ+rWmdTqtaRIbEI6AfTiDE0vEAsmv9jQoeicg7kt0nXVYwxnEGImXQCPUoyMmfviXmk30XcS0i3we0+45oBR3RVeKu+cSkOKuEneVzlPcPReR+GEXXVjJNPeamaIIIKhRMPcgkQRDNU3kPhGDvN5UVYmaXmn6afKYQTgCEhwQsUQskPys0wrgKJnoOOv21nABMcakl0Sj7qMPKtZ3/ozNxibzXump2uDo7+ubwLRoffMxIGB98zHWdx7jGdY3HwPE+g6w6VjNlP2b36YUjQDeP2UIufUgkek2hmtpIveJGLLXV1VVidKVKaadWBEt276lg9wEsWvtu1/8ezSSalUhiT2tAOYko+HzU63hS1hh43pJUPrVzzKbQc4T77GnGw32v9XgSLZQbNAcbzextQHarqdWWInIFk+R4m3BLWJh3O5CG20EOEK8VjvReHxZGMb+Yl7b2pLSnMaUIoBwqica65Qh84V6p8eUrrI+OuYGOq0A5rEI4QIdbr8EmCL0e4C29/HBP1Je+N3Ee+y9ejUdbP9TPTvKYeEnGjBFFi2Uy64nCSsROfA7pGgEwCdkmAdRAUiIvC6ayL2Kyj6/rl7HkbIXxpQYATySS0liGHOuQUPpqhF72NMKsJxUKFzMBVwA9AhtAYT08z2vg/mbSdtjT9fTwfb36vFIjxb+5OoxRVYt4LrrScJKxDykDimKBJKYQgyiAshbYjLVRO5VlA6vLqvXHCh7IR6mGAFIrpIkhswr9XybsqtGiSS6MlB5J9goGSlcYA/4AmA7xpMtgKW7PPyNzwe1m3iPPV1OB/v/Uo9FS8+89Jgiqxb4qutJwj3k9oMOpEhwR5SiREUyInEylbJcoqSrmj1LFOuUNb0fAajnycQgXkntyDd+LMvZDkliD4OCd7OYRBo+R++vWPjjFgbvffM31YVO3mMvVw2ONKBr6Zm8xxRZtcCbrmetYSUiU6fYOAYIupVij8xoDRngHE/f2Ov5bKRiN/P6dTOz781GrFObWzAAB60d2LjeWLixKvMwa+MBc2V5yBk6rMJYZAw4Q+8MKAB8C4P3Hj6wuvCtzXul9/prG8BGPfN8sPAHWxg/slY2QHvaoxP3UrGQgAn+J+EuAW+t4a0KCAMPWEoAgT3cT0BBr2DBtxDxA8Sd3LG0jrvQiXt5iv96ilXW8NYD4BZLLWAYzH6EpecAgQ73Y/g/xA8k3GnmWEq4y/Hs+D9lVYpE83kLPQAAAABJRU5ErkJggg==');
CrtFonts.Add('Amiga-Topaz', 8, 11, 'iVBORw0KGgoAAAANSUhEUgAACAAAAAALAQMAAADRQf/XAAAABlBMVEUAAAD///+l2Z/dAAAEc0lEQVQYGa3BsWtlWR0H8K87yzHFIaZI8UXDmCJYWRx5EC7k50Om2mL/gMXqRwJfLQ5jskh8yOVIFtlK8he4pYVlyrV6u0+OzSXbhRGXMCCkkuHBDsMU4eq978HqSoY3gp8PNqIy0TAmrBjNYtkrZhhZy3t73femsn23/Ojj5r65t6JFXSx6g+2AeI5t7OE5w/MGa1tY2ebpcVdGKG8Exj2JpmIoKMU4m0UUgIaf7M/pMX1Ym++bk0qRen2WIs8E80CFZeuBZzLAA+WRymceeCbAY+rCUtjIlKfzTFIE8EiNtOdJEhCRVE3KGjDIP6pZWfqpFnWxqGkeGxCOgEM4gxNrxArJP000KnojIB5KdF10CLiAGCPxEmiEenLCxPd+X7OJfoCYDpAvYzq4BJTigehK8eBSAlI8UOKB0mWKB5ciEt/rogsbmXqvmSmKAIIaBXMPEkkwVNNc7nMxyOtdVZWoxY0WHyePGYQjIMEBEWvECsnfddoAnCYTHRfdJOAKYoxJL4lG3fs/qNja/y12Gpv3gzJQtdHJX7Z2gEXR1s4TQMDWzhNs7T/BM2ztPAGIrX1gx7GZKXv385SiEcC75wwhtx4kMpUYbqW53OdiyF5fVVUlSjemmPZjRbRsh5aOchPErrUvf/yP6VSqVYUkJtoAzElGwyfnCvgUVti4XhKUPvhhZjPKee4DDnSn0eEXGp3IVoqNmtO9JrY2QtsN1AobEdl4jhT/WVAQC+NeF9poU8AR4q3auWaz68Iw8xd9bWtLSj2NKUUA4VxPNdM5Q+YLDc5PKd1kvX/KbXTaAMwzEcIVOpRPAaYI/RKgTT48+mvKK7+Y+4CDV68Wo72/aWAnOax8TyOmyKKVct0NJGEjIof0JVI0AuBTMvRBVAASIm+L5nKvorL3t9XrLFL2wpgSI4DHcilJDDP2GjWUbhpxgIk2gOWkQuGqF3AF0CO0CxDSjyZeR/39vB1woNvFaO8rDXiixyu/cQ2YIqtWcNsNJGEjog/qkKJIIIkpxCAqgCzEfKG53KsoHd9cV685UPZCPE4xApBcJUkMmTca+B5lN40SSXRlpPJGsGkyUrjCBPgjwHaGp7sAS3d9/DPvR7Wb+4ADXS9Gh3/XgEVrz7wMmCKrVviqG0jCW8ht7UCKBPdFKUpUJCMS5wspyyVKuqnZs0SxLljTuxGABp5MDOKN1E59+7uynO2YJCYYFbyZxSTS8AkGf8DKr3cxeufPn6mudPIBB7lqdKIRXWvP5AOmyKoV3nUDaw0bEZnhHDEBBN1KscdmtIYEwNni3l73y6mK3fX182ZpX5lNWRfWWzAAR60d2azeWbizKvOwbOMRc2XZ5ik6bMJYZAy4wOACKAB8F6N3vvMtqytfWD8og9ef2wg2HZjno5Vf2crssbWyEdrzAZ34XyRgjn9LeEjA1x7haxUQRh6wlgACE7ydgIJBwYrvIuIbiAe5Y20LD6ET/3eP8J96rLWAYbT8NtaeY9Th7Rj+C/ENCQ9aOtYSHnK6PP0XWVeDMsd0/NcAAAAASUVORK5CYII=');
CrtFonts.Add('ASCII', 10, 19, 'iVBORw0KGgoAAAANSUhEUgAABQAAAAATAQMAAAD1UDImAAAABlBMVEUAAAD///+l2Z/dAAAE4ElEQVQYGc3BX4gc9QHA8e/8cXYDPzPLaWQC17tJnhKQY0iCCEoyipQjglyhj5VMilzyIkYodxd6eL8NQcwhWKhIEGm29KV9aiy2TYuFX5KSSrkcy/nQo4g3J4WcCTkmuvV219n5OTO3mzNNUvBF8vmwRSs35YFj8l0IvncmuQVhoSiNWHGVEF8tzLmKQFgMWFYAXFaB47BJjFhWklqjq6vZIVdRSg9ZlWT2tdFr7dmjb6mTV2a8SS+dc/+RpHNnJ3e+fvTssfYMFQmCClQg4QQY6mkGqvQNsx18E/fyrX3YkpK7g4kaPs/4/OThBuND3GZLFvYPWw2cHn07bGvvvN3Z7b+x+0wDLBxjfvfp2T2H/3hz1j9MK/wzF8CY/8OZ9/bOr1PS/hpdJJBCivFblMURmgzU6HtU/BcwMV6qMoThU2iNSSJqnKrBFw1O72LTxYzC2EnFFjH2RlfLKpaWFCx6WvJQaHyYycbnH5JzsOtsOicpdCHECBlY4/8wPpkwuYMNxgRVQ8fQ4U5Zgq5CIDJJQKkFCMABFA6ZBNEgI5eRE1hICl0KSxIPH7NBl9t6NLg3521MbAm70lM1Cg6cb9ZsM0vAkRy4ClEExmgGenUfk5IGWAEFD/Dw6AsEOnRMStKn4JHKkJwOKdxoRQE1rCZdV8bpsHsp+qriGrHD8JUkfcWdTNJJ78rO14+ePdYGOr84bpLOxbDt79WAypwvlqTfOGXaQEOHFGoSW1LQi016EZCdpyQgeCKoXEzEp9MyxBuNG8KGZbBQjAAJaJ/tkuUL5IL1r1XER3SbcCv80fyj237163fMn2npYP1g7/ylMy/+bv5dcktSP0nJBMMn/KXPeOuhg+eP3IDgulEFGl0KlTMjVJ+tzZJK+NiyPMDZuchoTABE/2T13B52vyppBqt+06vCHugRjnwG1ADJLQjfppTWFf9h01o3INcGHieVFI53KdygGwStTBofmIDOKKyndf/H6xB9pNvkeoq+R3wKxr5MOmeB7rV9rPrQwlAMS/AoNCGAiiQn4zVya/RQ5Na6FIYwJV9QcMlVJKU2ffoEuWAdoiamBJPKnI96OeYCYPwVmDiYpeSykFxn+jOwqxcAvRg6JIA5QSECU3Ja0rc2Gke0O5ItLSBmyw4s6FDYRq7jU1pj4HE2GQpBziSt+7Dx1HJzyJ6L2Q/+pTSDA2ifQiKjmzHQA3xDkes16bO4TQWt1V2q2ZFgssmhS8nEkNDzxsckkEr+V4uB69DzGMKUlEx6qNkVsgTx9aUJrgpz+cm2NmsLeJIFhGo0aP+l2sQClt6UNVqmpCngolqS7JR4FCLoYsoA0M+ZMtIhBUOSMyhkv18EPDL6HIgodekzpEV2fnwHlkfhhEnJrvvQqa/8kJqdPJZQ92HjWJvSaCopHbjKz4+z5Ya4uDJlT7+4zKdvqZAeFqxgL//p+UdOyw8Qf3ufF0BPjbde0lNDG0disOuxpx1yG7/519S/p3966EQolMH+Hnpq+7Q9N/XlxrmVxbHpekxO2+BeTgJRqcdo5aYzYtikFrIrBirtGVGRfIsg5ziA4C4R92VI7kuAHVEKUAxEDIvt9AXCvZyglZsyoCgEwuLePL4Txf0Yb4ITUQpQDCjuopWb8j2xNANtsBSlGSOmb1RyF63clAeOyQPuGzLZzzxlvOdRAAAAAElFTkSuQmCC');
CrtFonts.Add('ASCII', 12, 23, 'iVBORw0KGgoAAAANSUhEUgAABgAAAAAXAQMAAAD3IxYxAAAABlBMVEUAAAD///+l2Z/dAAAFg0lEQVRYw+3XP4sbRxQA8BmPmD2Td1LSmHHOWC5cpBzZ4AhibuUkpT/EyHfYjcFHAkYBxztiQefSpFKRD+EQCClSjFiQm6S/UsaFmwOvkxRTiLu8N7srreTzH5wQYogQYrQ7uzs/zXszT4zVXsc5vd/j19sD5P+Af+4l5vFkgzEjK0CL3WO9cIqPk9SH4ZraBa5j8QhsMye5rQ6qNjNx6vn+vLU/j8NV4eY+tr1k6JNonky8yXLxGAYSTObxzvg+noKZqv5IJZOZ4bPioj28zrLIUoNF7Grt2RvLZpdxFxqNU8nT7+USsH3W3mQOh7wh+fi3EQTbOiC2sMMcMLcAdKwxUxAjpnB8UyC+ZRrbbqYz6KSAn8Y5jo3QQYf3rxXATKxhphHupcO14LDhhGBQe7ZaNg3QqHoB8OxIsrwCSO1uom2PqRYBsGveqgBSzBmfdYbj3Wy8CtA4UDwQjfCpJUDQ88BMHulpQ2eIYQGgdHRurwQwkEuAZqbJaLglgL0Z0JzNSkCLRlkAmggQPTZg3fYwALhv2xXAR3y8+/l4h1u1nBltJgTYHOGhEiBpNBgtCgdaA2gd/TJ4CcACYGsdQD/DawCfDR8h4Lu7K4CPESB7mAeDMwhITwBgbuyKRzt0OzxenDLGGQScrQBA80OpEqKlDjBaHt5eBVyWig/p58DgBJHHwrdTH4vDT1PXEgCRvpP6O+khft6XCvvjPRMXQkiocgZwiG2Lo8+P80va3QN34T7zlAPDvMgBEaKlxT0BoqNdpq8EwFm7BHALHQKoAqDo51P9EnDhUglwWl6/WQCyEnBeaFHNp8R0GuF9AKTqOgwhBZEPWtWdgqoAZh0wHMfO5C/G+Z7GMZ2eXEw4Ab5NVQkY1gB8fJWZcwFQpYfbdYj0/X2fWB2nc4qqyHOrd6YQY2Jks23JEgJYBISDEA/zADgAPsMFDcpbUcj1A0ATQIM8KAA4hwUAeXyIM9xlEkpAnM2TWT77Gp5pStkPerTGIWCzAmAHxh62LU6IQ0BkTTEDdDzyBQADpm/ptzEUPmE4ztxazsDVagaApkVCx6oSgPH2SsDsZcCWBFFEbwl4OkcDAb5qPP9hjMNt9h4UM7BZhRANlI8XgIZzN1xtBrgNc1oAXAEIuehuPZ5XOQBVDoTEkKAdFIDzGG/clou18ATYn1cAtwQIHwAHTQmyBvh974kPM2AI8KPCc3CtUeTApq2FEG55mKkIiI4QkNlaDgQALpqJWwJU5DFzbi2TGMpV6CXAZeb0AiCLGWAVwCwBDBYAKPaBALjxzRMfcoBhCD3/iXAb7gGuQgEAiyTWCwDOwMRm9VUIZ9QZfACvZqBahdzOOkCtATqjg76lFUCcDNBrAOyPIaRqgFPJE1ooz1iGSfzsCmD7tPO4D+BCvgBQSPBxuQTz8ZeTnysAWwDMKiDsA3gxVBsZnbq22Inl9QKwFfnXAtQaYEseYBLrFcCMEjfsxHl+FySfqeFF3IlxH9jEUoKSgWqb2D4sFhzaB7JPHtNeQ0sT3gNnrSgl+KgAYOC5sBM7AhSlhKBT/ZQW0AC4jQ0ENIUmwMRyuwBALYlDo0xi3GdUM/LLZZQAFBj5ciP7Q0nhuuwC1kIYV5tYllWARS1EmLR7z60A2mKeZF5kWL25OM0xK6gWYi6WUBRzA/4nFnNxBMmUirmB8HuZPy98AwHDGRZzfBiKOUEb1jbehzrkIoIYAfg1pUta4hD7G8xY1wUseKJ5uS3LBeBFLoX9MBxthc/EYZmUn1hOF9UovGMZrN/UQRUFVdW7VkaEZ9afayTVC+v/B+Ti7Eo1uv5/QL0jQL1Nhy9eDfhP/qFpHdeeQSPeORmg/i7gX/mnRUPZrr4N6n9sovx9ALzD630E/AUR0BFtxYLnmAAAAABJRU5ErkJggg==');
CrtFonts.Add('ASCII', 6, 8, 'iVBORw0KGgoAAAANSUhEUgAAAwAAAAAIAQMAAAB09Ao9AAAABlBMVEUAAAD///+l2Z/dAAACaUlEQVQYGXXBX2hNcQDA8e/vnGM7W/fe/ZbJxHJlhbS6ZXQf9ufMRhEynhZFeJGHKalNFz+zkHJD9moXiZTsQbwYxy61YuxF5kEd3a0pD85strvt7P7coZUHnw9kFA5BiRt33Oiq4hrPkg6IlWx1V10PSUVevDFZNNYd97CNSHw02T71rslrbijb1TaaPF3WvGVpki/ELCyhHOeqZEGB7Os0RPV2eQsoDK3ukpvVsljxWmGRglRxuYns6wQROpeWpYfCMWxthqvSb8ONHBTcNgeq0jeA6RmnQZEnFK7ityh5BocvG9zsWmso8SnB93a709E9pU1cwmgl96HwaoAAhJ3wpSEwQ6Xfj5ejQYNBN6DBGhbKM1wvk4x7JbGGDnEv0vYz2VLZvG2NYjZscEg1Hdkx2Fg8MXZl0YzjeSM3CvY27Ib9x/yKLNY+4Ru22BnNdIx7rJSvs6ZD5mIcixeq2qwDRq/hB65flS7a2DGkDR6eH6jouw9MS19OGtQq0QMsGjp7YrbA9dzl4sFD/XgTMNToENzV0pLixIaqV6GKCY86+7NLxal+KwDVXzsOlN8mC3iaNwos5j0H66t5XPoYpFufzVTHellnFWYTT8TTVu23kecuOfrIQRMzbc+QV4DFobGxxHBUMC9H3uAgOWcFBCCigmgOAlxg3K7bvvQlEDH02ycf9yi95tSQu95/flkPTnIgqGmpwfmW0q5flwB/4k6vfu9MpJgqtbJmbbWfo7u+hjndM6ffn8S8ELjoTO2U94PKnM3chpHwaP0xDp8h9YU/ghKXvyL8K8oCm/+qZ14EkzxHkicUeb8Ag33qdD38fnoAAAAASUVORK5CYII=');
CrtFonts.Add('ASCII', 7, 12, 'iVBORw0KGgoAAAANSUhEUgAAA4AAAAAMAQMAAAAJYEEqAAAABlBMVEUAAAD///+l2Z/dAAADJElEQVQYGQXBQWiVdQAA8N/3fc/nkrc2Teo1Vq4dwtN61hIPaU8n1KGDdLc+EWLBqkUUM7D9JbAOmRYeKiU/qEOHikUXyXCfDVJq2ppECTE3NH3WkqnL1tP3Xr8fWF7QTJaSkLzNwM7Loa2zBwV2jEWFM6VyDsXHKnMTHXs3bRim2tnd/cDcyf1HuodGHnmufO7wyMtzJ/8+tHPo9LVLHQWVKMiXSys7kwAAF0rtYsMXdlgBc9/d0UuWfG/1WjBKtGVvu3IGKpuns8beU/2DhLauu7dNH9m4q8tR6FocnP4oQ6uaLa4AljGVNYEERFl9ldi9q98PKyFEres9Kzu1Qu9WWAFJrlT5eQxFoQHMncgX9Q9CHZYVIKeNSkO7GgAAgH/b4ujMYGEgO3xquKfa2lPsXLNN4oeDNltmXOvp7NjXNa1KDo+HJC8VEe9/fapABqRAikn4Q214x8Tyu+4vD8+m933cPbLrq4v7Du0cOrfAn6tjY1nbo9Xeb+85e756e3NbVeMm9Bba3kNz+xshSMoosS5NiiazNQPXdhepSIrFTvI4VtJXxW+fp82Az6Y/Kb5QXsxDGm/sWky3dAdtWltCQ1fsrfnaLETHg/FC0IjDesnB2VXVGTQG9tH4q9IR0Mqu79Z/VENS0jOlUbdA9dZtNT/1YO1RIJXFIL8FB3JM6tudmI9d6fv9y8MBxfzN+u09X2T1NTN+Geq5Ohtk8afL8yA6PXUtlEmjHiU09++t1WelEIVME3Hgx/4ob1WR0ghQBc0ekCaIW6t+Pf7q8zNbr1TqT1XeXRq/kZbMG5mxFOalzWdzph7aloQ7iSb+m0dlbnzdO+VJAJoQcQMAqVBDBlrBjbP9H+bojl1eGG0/dHHDgfPV5j8zC7OpOKw3Np4cOxHQHH041FJVKiUvpvVXTKaEJVf17ZgIlzxRiXKXfNBM669hWIasb/utUPOkeJNLpSx55pubS/KX0iIAzWQJAABEQBQAIAcAoAKIQgLwICmkZSCVAKCZLAEAAEACAFEAAKAMiGY7jALdohzSMpBLANBMlgAAAAAAAAAAAAAAAID/AU2TL5/3CeErAAAAAElFTkSuQmCC');
CrtFonts.Add('ASCII', 8, 12, 'iVBORw0KGgoAAAANSUhEUgAABAAAAAAMAQMAAADGXl2oAAAABlBMVEUAAAD///+l2Z/dAAADMElEQVQ4y62UsWrkNxCHf7hwNZgt57DxpfADTCmCcHHkQYRtJo0IJgeLIEL29vcA8QPkDdIaBHuoGlyaIzbLVuvmOLY6lvBH/xS7NrmQhCNkGjGC0XwziA/YxYgR/xSC/xqTr6gtBRNmjBhP/esrXO+xXhUw83N3jYJLobBN8yQlGlxPCSCElGXwm969pePVujU3uCENZs2se3gHwRJHcFgyLdOXnY94+RbAfPzOeY/Rzw/01TnXfa8P5/CeAWDSkTRmfBDejrLXxOyohmYGMMRaUo1nqiak4VOLGtV+NWtmd3JNEYwAQkRgCs8zfbMbjeU3ALPxU/YFY5l9q6+uHpYHRR8EpTALTiYdSXt9/0GElQHs362NfK3NzDkBUzNtGs6aCcXQV02bmpg1s5+lUgMQQAgIwAtAeAG4mwC/PPQ+jn6uNz/q6/OyOWV98GBmClVdRjqJ1S5DIM8AaCFEsdb9j+ZcKMQL06oXF3UL8Llp0ypmLRlLIAApp5zCNCavPGzS4/RjGsxa0yEwwwGzsfenscze3G48nz/1zvqTgpl7r6PLEMTEvyPQWNDB98LONhtKGajYl4XlqjnXQSiF+95yy5didi9JRAgAqZltbMoU+d5M7QcLZi3quwpCBG7nPT+VMntza8znT5tTxqE+byA7CCLJArsNyGcR6mT8yEAoJItBq15c3JlYPGuLFu4ii9l9kiBMALJWG4IpU9oCTEMwu3fKgRkNuHnKjtnP9cZK+r4sDwoOfS9cWPpJdgA6BcPuD4SVBCIyMXZOwKimTUNoJha13bWwUBOzaHImRABMq9Vg+rKBwFuAICxowHx0E2aMZWa8eXqo+14PqXv2ANAnEMSNPYIFcHC1iRmZiYlzDJFqqvEsqImpthZDVhNL0aTJ/hbAzEJWJt0BWLQUo38vLOhAKROUgtHPE1+u+HqP9bD1nQe2APJuCgqAg7vOw5COU5J0CSYEyTb4TV+fWkqr3ppb0yqlJNFS93sewPQxTdOaVsVWpVnKeZ3cVGKj4YiXf7LC1oR1JyeUvzNh+BpBHn+RPevVANu+Qbsb/kvdv6n4f4gEbD24fgZcb48/AAU409W5V7hNAAAAAElFTkSuQmCC');
CrtFonts.Add('ASCII', 8, 13, 'iVBORw0KGgoAAAANSUhEUgAABAAAAAANAQMAAAANAo4NAAAABlBMVEUAAAD///+l2Z/dAAADBUlEQVQ4y72UsWocSRCGfxR01IiNjjIS50QPUNExHI0Ccw8yIJhLJhAXmIErWtrcL6AHuMcQFOzxR425aBCsEIq8mXF0LMfQc8HuWraRMRju/qSppuj+qqr7B/aaMeNrEnyvFtBv5uSMhQhmzOfp5RWuj6S7OofI4VbtesGlyv6kRsxiTdUMiGjNmsm2tRqHSCdtsskmkqXUhNRA4Qj4ES7Bm49YAIBTeXwNYDX/0qSEOc3H3YsL8ZC69QVSEgBYVAxdb7hT3QEd9Q156m0gAYGSPVncSY107qQkSwl6HXsIHAEKl+Afa9ovovcAlvN7SxlzXv3cvbhaPx7nbq3IWURxtqgYujr+eadt7ARA4BBCcg+kiEICSae7U2Px9+9I0g8AHgkcAIBnALAA/ljXOs9p7pa/dS8v8vZcunWCiMTWu8YwnPV/lcu2jUkAREoMvXskRdoc48MTwJ3Xv0myVZJDidpGADZZNs1Tc1xkmmzKkxlJsqooGmA517qZ8+rVzTbJxaZW6X7vICK1+twYFL3JP2jjnFEho0gq0ySWAUeQB07O7darxg8+PnDi1Cg56iCqEUAgyYGUcCfj04h6xhaCHrhdVdvkvHx1W0QuNttzwUl36IA1UPQ/6AP2HVCKhhqoDECbo95XOt3fUuOdj2/pLFHJcVBViQAynVVJCR92AH6p5NhQVBQEbjbWiKRld1vy8Gt+PM44STVLFq1n1gCoY1uwfwMtpQ0xUBlEFKK+GwGpb4qTdDIo+1q01RgBkE7XTzrgp8p+bKh7gNXcLESwyjdFtpu1h9SdxJokAUBdQNFbuYcKIBDvxRlJZRQRKJyHX1DoJH0klU1f1DXsAEjXTAllD8Cf2NQ+tyqKCuS8QM6Y03KQy3dyfSTdCeveB3YA8uY1RAGBXDdSLZqpDZCIVo2TbatnDgMraW40tUVftKajBCBPlk0DJVBIm7LbaV70DPVUHj/xoxkrAL4LDPk5J/zC1Z43uePPooO9BiAAADw87XyROeM/lAHpcwD7fwG+qn8BmyfhtlJmnHAAAAAASUVORK5CYII=');
CrtFonts.Add('ASCII', 8, 14, 'iVBORw0KGgoAAAANSUhEUgAABAAAAAAOAQMAAACLlvyjAAAABlBMVEUAAAD///+l2Z/dAAADLElEQVQ4y72VsWqkNxSFDy5UiWHKQ2xcpdhSZCGIILKwj5FK2OHGhQpXw0DEv3aTKi+wD5DHMPzYcKqfLaexGaaaaUKYanEx6E8x42WXOMEkkNPpSrp894COgINGjPg7Ef9WU4SXHv0CoH6+YyBe3udLxRdc7DqAxIjxNL15x6sj2juBfBqbVipi8PtOR5W1+hZbrYBDrnW6S4+tJaXT9VaKu7qrnSRZS1epgFjhBBErulX85AsAYMLLGYDrsUxTwohxYq/P2btk9xkpEQCmDcmKUMIByClKJ32WRHoEKZoVMxO95T/WxWTaAyj0XgAyPAoyXX6a6eAKyQcAv923mDqM6e4re/PufjXp7D6i68iAV7Ehfd1ub0sO3gjAf5g7l/reSSRBqditnZ3dir7k9lEm0w+Siv0aVh4HgB+RgWcAMAWux1Y3Izf2/hsL5+nxe9p9AUmf+xIrEkqviOATAXBJ70rfewkInfdLWW8XF/0eoMlkmZKiMVx6APN5TTXPSpwYf3+oD7OHuhtMUiOJCFyPrW3GdPf2Zp7C+aY12s8Cydb6ViuIUv0MwY8dGsJHMg27HWsHZDguVXubz/tGP8+LpapqpLSIKYToAfiiou0woytsJhtmCoOpaLjEBAW4uWt106W7tzcDDw4c68mBGkEUx4cnB/KawTWnIAcEeC6b9XZxsRR9yfqgvCie0iIyhxMPoFo/tDwY3ZwLkw12GQZbRJEkBLzf1EhyY++H7vKn+9Wkw3FpHTuG9qpFAO2XMCB4I4FezM47BTmSHfEgu7WzLHEoZ5Ly0kSVVngbJh7AYP3Q58Hoyh4gn+wBwgHgeoxTEmO6G7jdsHfJjmNLTADQpiCKbAAJELwSJS8FedIjsJdZsWziYCaVXE1UrKKC2wNoUK5GZ1yYas36dkitdEYSDei6KfbPcM7VmldHtGPfPssBlKoZfAAIonatntYa6hzBIbNqlx7b9jul+bpJcevXNdVpUWrpKAGY1TqrW79Otk6ymv22nsxY5NqEl39Jwn6/ELrnovhFcTh5tjoABgDI/lDxL47i//IXfGo6BxIAYHt6qDz+E8D/qD8BejK8FOkXILIAAAAASUVORK5CYII=');
CrtFonts.Add('ASCII', 8, 8, 'iVBORw0KGgoAAAANSUhEUgAABAAAAAAIAQMAAABdzx++AAAABlBMVEUAAAD///+l2Z/dAAACj0lEQVQYGYXBsWpcRxQG4B8VTjPYWx7Q4soPcCApbjHI4MdwNUjhRMUUWy0HMrmW+jyA9QB5g5QRXFiY6selMEiIrVaNMVuZLYa5ibVVIJDvA8YxL4YFZsyv4tsPN1cnYh9GiAiONGfFkCThuxeu7ss2NHdAkLxoi633SH+929c6NG/eyFrZffIFFFssMWCrsl3haIFnS9muF8D13IeywBw3P9iPF++3L6PdbxCjiOKNzPCcS81J1RRA4J6MUyIJKJTVzfL5uVGDpa+7bDT+SdZKpiQDFAkBGQlIiiPFMxV9GIA/7nsZBnmym1f29kM8nI127xhHCWmyOMNznzhMSaICkAcNIR+mQKqmJuGRNtnl5UQNOfVv1WhbJWvmx6SSIV48eFrnlZt+OfjD+nMpZK1sKooMXM+99xI3725/M7146l3sV0JEep/mcYQiu6yRZG5o0KbDwHAQL6oTgjyyTOY+NQ2e7h5rYRmUvBtck0gFgrFwz7VK1k4a86Rkzfy4xRIVuN2U0nvcvLtl1Iunw5nYKcdRxpAmmyMUPegDkkQFkL5oCj1QGYDURB+bTXZ5+YnKfF4/1fTgSyV71vMUBECxiS3RVFzvSGN2Je8GqoqiAjdPw3BX5MluKKtf4vbliFMfo0TR/mYWAPlghKrpCjpRyUAmiq4Uiolm+TwZlWa15uSZSv9ataYXAoBGTqmYStZKlpLCT/Sey88qigpcz4t/YI4bjvvd+6uTaKe/jyKCI0XWuoYkQKFX3poH9+QrVUFSZ4ut78/ovuu1Dvvlzr1prd79xAGs//K178POP++80lPYH2StuYa2lC06MI7AMGDG7LKdbgABDpjxHxL+JeH/zTg6ACt8t3+NowOe/Q3btYOp7fbMgwAAAABJRU5ErkJggg==');
CrtFonts.Add('ASCII', 9, 16, 'iVBORw0KGgoAAAANSUhEUgAABIAAAAAQAQMAAABUT5ZJAAAABlBMVEUAAAD///+l2Z/dAAAEP0lEQVRIx8WVwWvjRhTG30QwbmE2bm8SSe3sZa+VMWw3xFjppb3k1D+gjBCoh+5SH0pxwbQSbu0eFHwrCqSHXnp2CJiWHiIhkC/e9XWXlK1MinNZisNCq1DV2zdjO5sEkgbK0rloNDMa/eZ733sDsGgvwAjgmnbt5KtoF4HI5MKk5vx3oDVQb7TOKDp4fC6AwqPwNNM3lyj96LkKusoWa5jmKAlMOFtsWWHFvNOfnGSN6mwgbbxm5Drt52k9NnK7Q7qiplnVyHf+KN9qReZB/xuS1BDoHpAAapAwsqs4i7MvnmFTDm0exIGbTKRCY3PH0znN0wd7DtQrM6C1KRQ0L97/2udniPZqyQ9j4nqxhW9cdFZxTVTyBzFTWExXNM+2NP9hTwJ1Ywb8MTChUQCPgTPikQWQsngSR0bhg95wFI5SqdAP5unfvdpysfWgm0D2BSNLQNZqCPQ6i7996Ac6nX27FFWIE8UKsNii4h8Bi+9q/nsWcb9CoFut3MaOBCItBLJNt7UMpocfSqAAOIp+JdDmwfDoeCPTXxT06I7pevV6gaJCXREy0qKKXmtAAYrjpj8BnWpN8Q2NmAIxAqkIpJBmyrGj+dR693sHgfI099cTAeRJoEpZoTkBAZVCvhklwbP7q4oXtsu19JeNd/Kd2EIVbaMpgN6QQMd/bmT14/Kd91umu/2oUUUP7UsPFYfjXJoKIBYlpQSB8vI87JBRxesfTfSGAQoO6fojq6hSKxw5U6YsU3r4OQIVcxJIxRMqjgBCa8Vx6cT/jJFtt32KKtpv+RFFINsuLxOn9uwewIddVGg9rUe3396KwrlC5gxIKpTew+CzoGvdRSDj1ySXgnrIGAyCsspRJcCgqfzplzOFdqVC9HDda1grxEWgnsoYJYEAqmo+i/XQtxnpkNYTAaSqigCq2BR3Cn+8D7D1Uz8MAq4LoNB1v5MeMvf2skw1yFLu5HY2B4pWzxTSI8y3YTIHUpRU509lyIS7hYeEqbmlOaEAqjCVQiKAbATqTy4C5ZsI1FNtJj0Ui5BFjoP8GLKt/lFzV2QZkO4oq6sFmY0ZxhWKv+39rJ55iEdMh2CmEAW0J4fAmpkagcqzLJsBlXamNsNkqC2AYpBA2+4cCCJq7vQqtvoSKAQi0r6gD8J205d1yOyWsvN1CNNp/xMVxIj4fWCzkh/EAgjtIRKHI5BIe2cggWwB9LHmhy19MkD6GPQ50GAeMi9chCyy+cnUtkvS1NN5YZxV6r7bnuWg9FD2sngiUDRe/x1EYUQg06kYRsc9Gk14o4Jpy4nDG5YsjMGnsVFYHY6xME6q6x3MKT6ICkbfeTPBfTCn2tYoSccFshvFmp82qpW8G3VxTdVw54XxRlfHubuMOJcm6FV3wJUT6tkunJ5bfGnnm16uyo0vr0sryXTR8eXleBGI/cvl+kobqp+f9/KLsfr/CXRd+wcrxu63zvUscQAAAABJRU5ErkJggg==');
CrtFonts.Add('Atari-ArabicHalfWidth', 8, 16, 'iVBORw0KGgoAAAANSUhEUgAACAAAAAAQAQMAAAC4UA2PAAAABlBMVEUAAAD///+l2Z/dAAAFUklEQVRYw+2Xz2vcRhTHp1WRDVV2Qw9l2l3s0IT2KmIwW6rKORUC6R+Q2xjBFOzFMRSaDWzlqAvZFAqOWRs6IDy3/AENBHqKVZUKg4OuLUmJzW776KFkNyrYomqnbyT7EkLyB9RPjPT00I95H94bfUWIRRqEEoNUZhBrvjxQRjrHMU5Jk7zITMLIK40SWz+/eoGBfhsDhDDWxvA0UZkaKVCFqqxQ2W55AKn6xzEBaqheZLmS6pUGKtXPr15QoD/AgFJSDjB8qMgpgDlCalwDmKdmp9nRWdu1ORzkEqVnpwnl3OXztNlCDjpn6izPNLucOpqd7Ti063R83+W+yZnHnS5uPuce5/4M60wTg2uECOBs2yLkfAUFebImW6A+ddSeUhOhAexC3h/2ddbpZA+HegDw9FCBEJHYhWGCHHTOEG8eDHsCYoXs0jiGXtwPgkgEuZChiHu4BUKEQgQHsn+oCqERIoCng0ypxxUU5CmHcgcCiE8BEFKvS6zNZp2QWetty6pPbU3R8/UWrXUceu4NBKBYu0lbTUcDsKYpX265Xe5wSjEBjg5vM8Y4Ndvs+hccjdESgEVTWraOpWvfcHHfmet06rOk7jbr19xrjHZaXKnxmGFtDsdK7Wd/ZNn4aOkIHo8TmPRjePI3AiByMIRkGGsA2SGIzSTqiVgAYAICHTGQUgrIB/L21wJNQgkgAxvK1sl07RcR7vt7/f54X42j4fhOdEdCPxGnAMhWoyHi2LAb8Xsfu2+5rvh06yH9XHj00SWf+r5uAYe2qG0pn+BZk7K1VW6VAGxiWSu8y3iny3xsILbmawAO3rKMvUEbdJ6Yl03T0PaBYUxdaVy5cvWdy2ds8+oN+4ZPux1bLY1G3HGKdOT8+kP0ZxTx75Yuwjc8hAsPAggC3QIxJJBmJFB4NgR5c11kJYBUZdmG6EnR78kAG0jeDDSAGG/ZxN6AEeyq/H6eF9p+Loqje6N79+7+fv9Zmt+9ld4KoNdPTwGQrdnGwzj2mo3Y+8xb8LyNRCYLxoax8IvOH1Mm3LSvEdsqW8B2qb3aRADc1V84Slew5DljK1wDWPZ5l3dNBLDmUJvWqUeMR0ZlHxrGGfNN05zUH01RYzKhE4P6LaqW9kcXHSccjpzw23AnDFdarLVTrBQ77+v8MWUl8vSOSrOyBdII0vUhAhCR/sIBbGDJCyk3hAawGYie6OUI4GYMKYwhVMWForKfiuJZ/lee18YXjqCo1aBWQJDAKQAijdkvfd9rzfqex7LFRRlvq8WeVIsPz1IHF0FCVJdz0mpizaM8amLlt7jlcJNSy7cJ88tFkHOKB2+Fs3YbATjXOWXUoEQZyjD0SqR3/6jasTopQ4qu4AWs2P8qCMJkPwhDaW1vM2eRbHcZ2b74FGJcBJUiPSFUMsSaR3k0xMpPRBaLHCALUiWDchEUAvAQbgg5GCCA+LYACQUoUpCi0Cux3r1OJsfqrAwR2MALTgGMTe175whxmfcuY0f+mKz+i2NvphJCKIU/+Yg0W2XJX5qmVmvVrwCgFKYu10KIoRByuI9CiM3jIuhTj1N/xuxo5WS6J6p4inSPvSpEzWmq6rlmET5RKpLhb1JOBXW1/hqOuYNKCKEU/v5HNUzKkn9wCFmyHlQAUApDJLQQkiiEYhGgEJK7uAgGEAoIDvK+Vk55dKKKj1Tv2KtCkB/CKQDCumSe0HJGrFVznFX8w3H1OJks4SeOXc2auo5FuVmdvsy65dDPN6uA9fx/EvaX7KldBeWMZDKJ43X8w4n0OJmsEidOWs0aojgDkVenL7NeOfTz8yqQPf+fhP31fwfwH8bH+GrTWRmgAAAAAElFTkSuQmCC');
CrtFonts.Add('Atari-Arabic', 16, 16, 'iVBORw0KGgoAAAANSUhEUgAAEAAAAAAQAQMAAACsZSgBAAAABlBMVEUAAAD///+l2Z/dAAAF9ElEQVRo3u2ZwarjSg+EC7QN1KsEZivQqwu0PZBXKchWUP+ik5xkLvfyz3qOgul2u2Paqg+pLQOAgLgB0QCITyMAMb/PohNA9ee0zGgghP/fEsg/mP7vFn2W+Vj/+xPwjKe+HyyRSD1mN2Cb9l7tLdvyp8k2Nd9nW2O763PazJa99P9vY88fTP932zrLfKz//Ql0xoffDzYeDx+zy8YPAH89ADy+2cwnAMxoZHWo+ik1gSVPC1wRHR1AA9GZmdxMZnSIfXB4yhxN5S02VMqM5sFEAEFR0SWquraWm1mLzEwkM6nS49jMzGRmZm1sohoNgJlPCA8AgRQEAJcPnA+eiVCCjq6Nph5esmPmCYBmy9O17HpKLTuk09o3b22tXfbWzIxiRrO1VB0cnjJviXPdWDZntnQwoS2L4lZT7OroUMx0eGbGoxmx+ThiZmY0M9OxMe5y2dbME8IDwHpo2vb9A+eD53g5FrY6tsQfAH4AAGB4fHQOwQAQhiIhCEbNL1T0hTA7GltNRV+A6wHATqRC0ewQ9QJA6OjMvLG5pUwqMzr6CJB5RjJTecJzRiNTiarKlz0wOwBA0XL0W8p59ghyT7earK6GwwDMDcFpbjoRXc3OtG3DSBydl4ZtL8wd0zTc+eXeustQbTm6xK27fTsAAOPhcku1FF8A0LU1M1eVojkjzmxtHQFmzsjMcE54ni3PcNzd87IHZgcAc4vYeks5z54sxel2SV1dxsI2FEtjoBiMt7pUMz8A/AAwv+IWtxlRBIm4iZcL79y4cLkz1/v80j26OJOMvt+uqI2urX2lgCN+E5BdC5xroehEuZCJNwB4ZFNuZimRWV1K1J70kyg/wv7j7pmZeTtJIzpu0UwAeR0kEnz+LgWCqKvidtVVvybmOrgTyF9TQ9TURpeqCTu/9rrXTIqy5L1S97suir0rFJm3S37xstXKHG1drjd3bHV0vFLAEb9kE+iwz7Xl1rjRnvEbADqycWKmOZ7pao47TvoZNx5h/3H3mZm5nqSxtdctje25pcdjPX/3tiz3jXu98cav3LylL7LnKzvlzo6tZpf8A8APAPMrHDfdRTEZipuYzErSyeSEaqyiwQmQvs9T/iMykIkk0gCBtxRAcKOJQugAkHlCdDQQHZ1HZGQmErmZTwDyVgeOLCEPAGUqmoiGo5MAeL99iw+CHBDEHYkbEumA7zdUNOhwRDvA6Fp2tJ1fi73yQlGj5V6p0fRIGI1y2Qm2YOVawiWf8h+R7RmPPLBlv6UAWbElt5cHgJkTorfsra05IntmPJ6YeQIw1z5wTNNzAGiIW/KWsTWyrcv1W3zLUlqWLx5fPR6scbm6tywsdgtrbXWotn4A+AFgDIbrXlubZIdrk8mEmZExFmftjObYztA9EE2dTSAA2KXMTIAdjyB/ikahE/DZmRCViXNVtQSQeAT6swnMPFIrkczNTKTyAQBVlRmdiAajARu0Qby2Q6/e3cb6w75n2dG55w4Ja9GXjo6RatExGo2h2dkElQHMlhLALC/rLfFsAm0baM7M2Kp9BPlTNFqegK+aMcUZn6vskO3xI9CfTeDMkZrj0cTMeDgPAMTuma3xlrVlAxZg+bUdfvUugAMf9j0L2Jo4d/gB4G8HwG812eTlhO5NJOMrkXDXGkDBj1aKfS8EnVLwNXkDQuzvEH8FOhpiF2o/AEggEc3NfBaCEqcQRGXWnkJQgo9NYG10MjO6Nhb5KFElgHy++r1ZAaXPofdZ0Uh0tI23muzofkJ3jEf7azxGdcB2G4+W3HgvBJ1S8G10tZeq7xB/s2vLVLU7PgAYe7ylmHkWgsanECTOdJxC0FiPTWDH1mhmq2PD8yhRje15vvq9WdvNz6H3WVsenxTwA8BfDkCiBPAUbV8uSrCxFFUPL3Of7e+OfZRhP5394epoLgVFZyL/+c3pz+25hhJe6//t65L+6/9x8IE9bto6RduXi8Yqhyj2w8uKZ/u7Yx9l2E9nf7h6SyGaWzOef35z+nN7rqHp1/p/+7rE//r/Hnz8A8BfDsD/AKhB8OIoth9RAAAAAElFTkSuQmCC');
CrtFonts.Add('Atari-GraphicsHalfWidth', 8, 16, 'iVBORw0KGgoAAAANSUhEUgAACAAAAAAQAQMAAAC4UA2PAAAABlBMVEUAAAD///+l2Z/dAAAEo0lEQVRYw+2XQWvbSBiGp3iRcxBRj99BxPsTfAqGHZSe9ncIAnOJSXtqfRCyhQ5uT93gXAYC8zv21IhZMDn5J6yDDnOsgg6xWNPZd0ZJS0vppcf0s0HSNxL2+zDv68+M0YCIDa6fsUXUWOaKGLtm1NCM9SWIxex7FbCU/UwRO3huzd4Yuz/5ZOdNxKwrY+2JNZFZ2r6ksbX9XnVW2Z8pY+8/sicP4NgDGG4H7NoDiL8ASImeHzASIhHHFE/AAZo58TzMec45YyEbc04Zn+V5IvJApKeCZ3jlQpwKkR+9mOFxQArYIUspSCefhfcHyoluPIDdaG9PPID6CwBlzMd7a6Ss5I2p1+AAzdrooi10obW1rd1obUq9LIpKFp1UV1KXeBVSXklZ3H5Y4nFA6uydVaZT68/C+4MpjPkFYO4BHL4asm3UsB4Af7AAp99/AwCbTmOaxNx971BMRBinaSAEOQFCcCGmaZoKCqbpm9cClZIHEIJgzDhPOaglMAv6wJNkyQMgTrNJvPAA7t7v7KiJbA9AP1hAm3//AwCmVrVZ19p971auZVsr1UlpnAAptZQrpZQ03Uq9fSdRyngALQjWVmulQa2CWdAHnqqsHgBps1zXvwDMR4PdbhdPItZ4AG9G1ubs2tpmlOaU584CnCY0DtHG1TmFxLMs5AnRmIXhuchSMctwbzBL57kDwPHIGbxBYzpmeZClCUyUTYIpzcUjoDMuwpyy2dFiux8Oh/W6sZEH8HbLWGFPGIu2qjBF4SygzdpsWrRxdWFao8uy1ZUxG9u2F7JUclni3m6pFoUDoPHIJbxhNubGFl2pKpioXHcrs5CPgC61bAtTLm9/AUg8gEk8inYumBoPwHoATj8kMxGMX7Jx6C0wfk0UTgNBInBhRnQOQSJNz4UDcJaLTGQBBM455BOdMsRjKpxVsN4DSB2gOQkYKJ/ElQewrrfN0AVT5AEwD8Dph2Qru81fdtN6C2zeGdOuOmlk58LMmAsIkkpdSAfgspClLDsIXGjIN+bKIh6VdFbBeg9AOUALI2GgAhZ48gBiGkDGq8OTaO8BHEAVABBr0OYIQcZsJgSbxEg9Rgi7scBGHyPjKMzHLM19CEIgDqfnIp1OAYC/EYjAEMi4B0SJC0k6EyJLUree8ASAzolqs4eM93fXzcADuIcqADA2QlsjBK1lpZR2XSP1rEHYbSQ2+gYZZ9piY1XhQxACcbi6kGq1AgD9ViICWyDTHpCpXEiaSynLSrn1SlcAdIGfwScP4MAD2A7n0SentYmhkvcAjvpBCKPwn3+weOK3/Aue5zzkfMwnRBiFocwNQsi5nIscg1B6jBDM6RQ7/CiYMUtJBrUUCI63Ww/S7DChY2QgugfP7z2A0W7RPHNaoxoqdQ/gth+EMAr//Y+t137Lf9BFoVutN3ptDEZhKHODEHKu0LLAIKRuEIKFucIOv+2WlpmqhFrTSY23W+9UeVeZG2QguhiFnzwA5gFcD/CBHoBTyXoAjyUeT8Zf/5f55vKHlcEM/iQNHjqzfiS2HsDJHp/nATiVtgfwWPLxZPP1f5lvLn9YJczgT1T30Fn2I/GTB/A/Bmz4agwm5QsAAAAASUVORK5CYII=');
CrtFonts.Add('Atari-Graphics', 16, 16, 'iVBORw0KGgoAAAANSUhEUgAAEAAAAAAQAQMAAACsZSgBAAAABlBMVEUAAAD///+l2Z/dAAAFRElEQVRo3u2ZTaojSQyEA7QdiKv4AAJdXaAD+CqC2QpiFsryT7/upjfNLJ4TbDDOrKIyPjKiJACWoKUlADZgQAISJDyGJQA0AEvBMhJvw90SsMafDwcc/9+wBJAGaUI9MSGpKY0UEiBAjzEhSZQ0AU1k6G1UTUhD/fkoqfT/jQlJMcIHgG8OAP0FgBiAQL8AsKL+CIDD0nJZsXR357jTLa2Zi8PKzLZkx6Bj2DFsLiYNEGy2ZTQ7MiaG4x4Dd3c43dnR5zPu7k539xibGyL37gckBzCAwxLuYP5E8JdfljGWll0vAKRJLfEFgBX1RwBKExPLykRVVVtV18SwY3FYmZsTzTQxrZnW7MWEUqvZnEg2M9LS2qrSVFWl6qpm8nysqqq6qipt7K6MvfsBqSSZVJpQlTp+IvjLr4m0iYkPAN8dgNALABNAAIPn+X8BwH63ALblP8BtAZAc3taW+4yP7W53pjva2uGAu7tbXgK4u7Pd3b0dDl8zcW9HRPhjHMwWAPRBsAE228E+qI0ff7F0P/BMNOcdILZlJNM68QKApZSS6Xn+XwA03y2gOfGvdF8AgFJxOLGMP7abVR1V4rBUUlVVTVwCVFU1q6qKpVKtmVSxlJn1GAezBUA8CFJqNkvNg5rV8ZeJqgOPJdveAWpOZHQMPwB8ADCBSqXSmonr9DsKRpgkKQbo3RWYHDGWMTEPC1jxk0Dv7PPfWGJtoKPRbI7tPKDRPu7RDvfI6L0uPNIROqKdq7u7+31Nw5KwpAMx8GgHZ20omgn3tgz5V4DubHd0jGV0pE1ioEYgEMMOXe53FMwcAECaxN0UDUppE2lpDwtY8aMl7uzzn01obYBJsdk2O0+iWFaVLFVlJPe6qoxS4oh2rl5VVbc1jYnWRJeUpkqW2taGkh2q4kSivgJ0a1aJaRPJjLEPAN8dAM4TAKa1CdIjMOkFAOkJwCX/igy4wwnXZsinBRDhlpZob7i7pftmNsuNYr4iw93h8FkLiHT4PRYOj4avgCH2im9p6QQ2ODrcL0vZ9W8A4AIoZOm+9hPDtG57AtAxHAh4BCa8AAA8AbjkX5GlKlWrsBnyaQGtrIkJsaiqmqjazDaxUaxWZFWVSmVrARmluuXCUUnVCphorvgTE9XSBsdS1WUpu/4NAF0AJSaq1n7SOoYfAL47ANaW4HkxAoaC1E8AkCvVAmAJ6LxGsTcEAoAU7e4OMK035gGWG+oI9z3OiY1wlugYAnCcg35D4IHE2+H0lbb9AMCOcN8AiAPZiZDYY55zhUhLv7u7R3Mc13oOm8ODnqXlcEJ9XowkawjgEwDFSrUATEg4r1HNDYGSBCSrqqSO4cY8aWJDXatqj/PWRrgJMa0llc5BvyHwQFIsVddKyzoANDOrNgDqQHYipPaYb7tC5ETdqqqSbaVrfVuzrQ96ExMfAL47AMgnAANECNJcsmoBgSX7DYB5LQRtKfjmvAPWW4LZVTewY2K48a8JNtPSckvBK9lVCNooF8N2j9lCkIMnBMZYOs8BPvBIQLLkRK+0lnB39n5f6+GOaAzHkr4RcOciDYonACZlQoBdskLDlbL5BoC9FoK2FHyvvknDLcHsqrv2cXvjH1u9GxJbCl7JrkLQRrm0ZlXaFoJKfUJg2kT1OcBNlSEBE23JlXZCVdXc72u9qpSUtU10bQTcudsL+ADwzQHAE4AGuA/4BOCSEngF4Etn50tfh79txfAvtXiicXpav+45Rb6WhrcZtABQ6n2+JwCXlNIrAF86O1/6Ov3bVkz/pRZPUqen9eueU8ZrafgDwDcH4D9AxvDintukAQAAAABJRU5ErkJggg==');
CrtFonts.Add('Atari-InternationalHalfWidth', 8, 16, 'iVBORw0KGgoAAAANSUhEUgAACAAAAAAQAQMAAAC4UA2PAAAABlBMVEUAAAD///+l2Z/dAAACg0lEQVRYw+2XTYolOQwG65KBV4VOMUujU4o6SZCrRLOQ83V1DxRDD7PqErxH4h9ZjrQ+K99WbbarIGuziQLY6qpVoFlZWTMuK9gEzc+mAWfuvzRB/rvFb82aeBfv6+2PBxAEV8VpDDaq4zpQUJ2+66P2LClB8M4CAtVUt0FUHvezUlaQ1a5qs9qsLIBVsMnKCrqymrZNtZ0Q3JrVdX4TxlZtw6JZP1iCsJzIUPJLUBq0QXwDeJtw2jzHdwPwhAk6B3taJh2CJiv4CwoCr77lqqggicp6llulia6KkodmEEwAqlmqV4k48LxK7vv2ZQfzAFgV8woKgizJOqjn3THjDzy70l8AEjRJfHwDQL0VZ3M0iXMIzcqa50S1SxGzpA3a9pUCs3k266PvFqbvMliTBtW1KitPqsGqVdf4RZs+frGRvvu1/6xZ5drzAkaKtxBgl+RJw64Erwr6E78H4LWzdJ3Ea+L6BpDqbTN7Hsfj6rW4ns1qm0eopmU2CYqb64bN+pQCm9sgWHUVaqD4iFIQXCdAFbn0BeDafaB3cdKl7+ciDgI3BHnmPyk1838CwAOw72CiCNrRgD8dwIiCjBQ9AH61OAI1mEZEskYEgdV311yfSdTIHMQRtY1HhPYIIsGqdgMyPUcED6SrxH2pctV1AGTd98QyacXrEp7YBkacFLhG8CqVZ36alW7aSc5Y3wDS9LKNc8X1DHsG1xz66Tsu1PBzITSFRZkbopIfR7zIatsc+atNVhLEKYUn5KcQGilrs7SdQkj2EcE2cJ8SRmxYfQdp10QboGbN/zMfpWuZxinx+2BavH8DeIPPBdDvmv/4rvna3+b/sT5F21ffXP25NP4G8DdtwnT8gunMHAAAAABJRU5ErkJggg==');
CrtFonts.Add('Atari-International', 16, 16, 'iVBORw0KGgoAAAANSUhEUgAAEAAAAAAQAQMAAACsZSgBAAAABlBMVEUAAAD///+l2Z/dAAAFQUlEQVRo3u2ZQYokSw5EBdoO2FXqAAa6usAOUFcxmK1As1BkdXU3NJ/fzKpKkEFGZrqHp+zhslBEGAGGI2AEIh0RAZLhcAQJw/D9Ds5GZFfHT0FmxzP2HwYjGH8f2f9m1K03OmPhtRa7htc72N21pMViVzIM435nTHmnuvankKb2GfsPQ7vav4+pfzPq1rs1G98AfHEAsrPp7EtKNoIkL7XZZARJ3ne0cSlnZGdnREdkkySGBLPT6Ce9ERGHjGvCNXANjMPEEQgYzi7D1TU1GLLmlkCQcPl5DUkSJFmT8xbV0R8s3WFuZUEG+k+gkNk12dlTU8LUJWXKK0mX2ilpV5LuOwG+lGunpma3dqckySlZUwPXk97d3UMGnYtOo9PwYYJdr2FMNYyuzk6n1HlLkCWj8bxSkmRJ6px8366tD5bukLeyldb1J1Ckqc6pqW8AvjoAJ0fNI0vgji+ZgnyKgnFl4iRrOPs/EW8HwC6DTmfff/xIt0k0GU4zXjRlZ58AJAmTJM1g8DZn0oyq4kc8mB0A4WxGdjoiG2bAD2rDB4ls8oFnyphfAOrsanT65Oh8ZFnf8SXTSk9RgK9MnGRlTP139/0AiNAKg6lj/CPdkFzSYqB90TQ1dQJIkiFJglar25wlaLtbH/FgdgAsprRTg90pQ2s8qKUeJKakB55sOH8BqKa6XINvAL46AEGyyOCJ29Vo8oSC4XuPJskyGQzCjJrsmpqPEnDiNyK8WxPxfDfZcWXA5TCMuVITEQ5zyDKDrK5n3mA1o/YR7ZmdJPl+AJ4VBSOyg2UG5spQGR2ks2v5O0DvMBlP4anOWUktrU7c6nJJJ5Rh3HuXJDWk1crQdk51dn6UgBO/vIuIzt3nu5zaKwNoLAznlZrdxUIpNbRSVz/zrrq0HY9oz+ySpLcD8KyotTu1amidV4YarpUw1aHfAXozpH0KT9fkNwBfHQAMWaw+zS+xl8qP5M9ZphqyBo9Ru09O5AgyiOBGIOJTCUAUs7PDdJDMJoMvU5adzbtS8NiaKwHVDL7XwcFy8ASsfd2IZmcTEdmYG/8qKTf+JwDiBVBt9q0iuwaddkqtrtP8Enup/Eh+nmXqlDr9GLX75ETelVZexa53P5UAb2tqaiGspClp9TJlU1O6K62OrbwS0KXVWx8caqxOwI7XjejUlLw75bzxr5Jy438CYF8AdUzdKqY6zwN8A/C1AThTxDgr9gLg18g+g8b4YaLgM4EREbvlu31Ep8/mRWSfqUOQt50jzsJlxzmQYDwbvZ8rnNRmEDxpzQcAuOrWcmXlQPoB0MGQTwng+5UtDOM1HgNjEDVXnLLPFGnPir0A+DWmzqAdJmeijDOBu7sRjbt9dA3O5u1OnanzSrede8/CTS06vbvaZ6PHc4WTGlpZJy30AGB031qurBxIPwA6GOYpAXq7suXUvsY7Dae384rT1DcAXx0ADIZTk323eHcX8yTqzu/M8JPCIXM+N4KusfJGvEek0T+2+LeAa2pw9s8IGJ2dfa3gk+zVCDorVwOTNdcIYuAxgTXZxNPCmWB1xG42pnyrzQ6S8B1f44OMcgwm+1rc9WASneF0KjtvkqdVk0+i7vzOYDwpTGnycyPoGivv8tvuwPVji3/f+7s++wevLyF1reCT7NUIOivXaUid1wjS+jGBnVPy08LJVdduxJRPujSmVpJxx9f4lbax6Zy6Fnc/mGzNfgPw1QF4Bf7qkQx/e67z5/kQ/5+op2n1p2dO1Z9bw6/mqP/qkYx+e67z5/m8/5/op2n1p2dOXZ9bw98AfHEA/gcAYfDijjnkLAAAAABJRU5ErkJggg==');
CrtFonts.Add('C64-Lower', 16, 16, 'iVBORw0KGgoAAAANSUhEUgAAEAAAAAAQAQMAAACsZSgBAAAABlBMVEUAAAD///+l2Z/dAAAC50lEQVRo3u2ZW2ocQQxFD+jXoK1kARe0dYEX4K1oAQXKh7rmYRJC0v2XLpgxQ02N1LoHlSTD6WUpSZb68EKUv+16WXp5oVhesby8AFgQPD795fLicdIyyisyViwvycuWJOSSV9TxWpIkl6RYloWlu/v552+gG4oqHKpwS7Dc/oFlsSC6uwED2rLpC/w/Y/+K578BuAGQJF+SRFlaSts4Ls0+S+hYT7fmk2DeFghLJDy/W3kDAPugLA3wkiSVGAuWlEpEhJ5rbE0A0Q7g5+c1AMBTgM/PPwrgrwCc9f+M/RuAG4BrAOgWlJelH3+PTWl5ImQrSlDzMJZOLAppeQkv5GXpS3MMS+lIfyvK13sKdMaOw2CFJCaEllSkiD7OSBI7gF6DqWNZVXUlAO44uP9egEnW6BWAs/6fsX/F898A3ACARr4Eh+qOBbGACllSVhKKKQjXzviI0kJRwtdcI1GeSGUZ/ZIBdwC+JgBOFBUrujtWlJAiI7ViWVKB0FcsKWpA2uctvSy7J4BzHV0LgIRbg3UnWHd390MAABXQnU1z3v8z9m8AbgCuWd3IUcD7FTAFoYOiOUqZ0X6uAMuRXkxzcxRBinwDgB2A6P2LDmUZ3f2WQvVMoXLtX060z8811X1lG9j9LMKqqnBr+vcCRDbQCVzg/xn7lxSBNwA3AEyqkmC3gVN6OJKl0NEDbon3PujjGQBLXwOAylJfkhTlS0wAvHx5+XIcfUwpxG4uX9oolWoGKQOPSsf5iPHn2jbwXYCjDetdfk1MngJ0xyNt0+f9P2P/BuAG4Koi0PKHvGGPgo9BD14z4kRej7EwluPPFIVRI60lkrzmfUahAokoli9Ll0TF8uryYxB0tIsZS8wo1VOK9Ti/jhK1LOWSZaxr28AtgDvufrRhDZbdvxJA3wA45/8Z+xd2ATcA/y0Av17+T7tRAK//INqT4pfv5Ct6/wrtlW1gN3RvAaQ/CcAbAGf9P2P/BuC/B+AnzJXma6clfb0AAAAASUVORK5CYII=');
CrtFonts.Add('C64-Upper', 16, 16, 'iVBORw0KGgoAAAANSUhEUgAAEAAAAAAQAQMAAACsZSgBAAAABlBMVEUAAAD///+l2Z/dAAAC/0lEQVRo3u2ZUYorWQiGP/C1wa3MAn5w6+7gbsUFCM6DVUl6mBloqu7TrQNJGk4SPfrl+GvD5WUpSZb68kKUf9v1svTyQtFe0V5eADQEXl6WUV6R0dFekpe1JOSSV9TxaEmSS1K0F+f3QFq+rEGBpWVR4DMzAC4B5WCJSMvCEqavn3+AGSiqcJjBLeH0av8uGuLwx4GxHOYG/6/Yv2U9ADwASPKWJMrSUnodyaXdp4WO9XZLkrwkSSX2HZaUSkSE3mvfuwAgx74oSwOs1trM9wCeB/aCGAEdXpbI6gxg3AQAfCSgfwbAVf+v2H8AeAC4B4AZQXlZ+vF6bErtiZB1lKA2mZZONIW0VzuSWAQsqUgRc1z7ksQJgJdEOWvHAW9L2KMdASzPIqALPPoMYHS0hLwtHUvcbwXAHYep/07Apvk7AFf9v2IffwB4ALgOAEhelp57hJno43qtkCVlJaFYQdgA2qdSR0cJKTJSHW1JBUK/oqUoKcrrAOCX5WIWRUXHzMRYvsQSVMMMhafVtwDGFhsUM+NYetvvACBxG7CZBJuZmXkl4NR6zOQwXPf/iv07fgAPAH86AIeAkaOA7yVgBaGDYjik3OZ+S4DlIQ3PEqB3CZBr20FFcojAmE3/lgDLNwDrhUMNW132It0AegvGS7JE3jOFZYhbAFjrK8KqBtyG+b8EDDAJ3OD/FfuhB4AHgDvWXtXStjAr88DSkTbJfDRzluc+6OuQeR9toEq1gyBJeKn2k14R+32OvljJ+WqjzgB6bjjoYAM4YyWsYgvMq43yA8Z7AWhwS+aUX59t3fFj8fmoH1f9v2LfHwAeAG4SgZZ/yeeYV74HPXjtiBft2HdHwZbrj6UfIi8yWuwo2FOK3lGwoA+JWZZyyTLaa8qPQdC2Ue9R6musEk2Be82QwrJjh9LktlEuvu4EwB13r48EzPxbAg7FdwBw1f8r9h8AHgB+1/ILuz9B7/P1HwH0/YfKUaSwPNjUFqf3p+4AYOZMQP4QgKv+X7LPA8AfDsDfcEs1guB4phMAAAAASUVORK5CYII=');
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
var KeyPressEvent = (function () {
    function KeyPressEvent(keyEvent, keyString) {
        this.altKey = keyEvent.altKey;
        this.charCode = keyEvent.charCode;
        this.ctrlKey = keyEvent.ctrlKey;
        this.keyCode = keyEvent.keyCode;
        this.keyString = keyString;
        this.shiftKey = keyEvent.shiftKey;
    }
    return KeyPressEvent;
})();
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
var StringUtils = (function () {
    function StringUtils() {
    }
    StringUtils.AddCommas = function (value) {
        var Result = '';

        var Position = 1;
        for (var i = value.toString().length - 1; i >= 0; i--) {
            if ((Position > 3) && (Position % 3 === 1)) {
                Result = ',' + Result;
            }
            Result = value.toString().charAt(i) + Result;
            Position++;
        }

        return Result;
    };

    StringUtils.FormatPercent = function (value, fractionDigits) {
        return (value * 100).toFixed(fractionDigits) + '%';
    };

    StringUtils.NewString = function (ch, length) {
        if (ch.length === 0) {
            return '';
        }

        var Result = '';
        for (var i = 0; i < length; i++) {
            Result += ch.charAt(0);
        }
        return Result;
    };

    StringUtils.PadLeft = function (text, ch, length) {
        if (ch.length === 0) {
            return text;
        }

        while (text.length < length) {
            text = ch.charAt(0) + text;
        }
        return text.substring(0, length);
    };

    StringUtils.PadRight = function (text, ch, length) {
        if (ch.length === 0) {
            return text;
        }

        while (text.length < length) {
            text += ch.charAt(0);
        }
        return text.substring(0, length);
    };

    StringUtils.Trim = function (text) {
        return this.TrimLeft(this.TrimRight(text));
    };

    StringUtils.TrimLeft = function (text) {
        return text.replace(/^\s+/g, '');
    };

    StringUtils.TrimRight = function (text) {
        return text.replace(/\s+$/g, '');
    };
    return StringUtils;
})();
/*
fTelnet: An HTML5 WebSocket client
Copyright (C) 2009-2013  Rick Parrish, R&M Software
This file is part of fTelnet.
fTelnet is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or any later version.
fTelnet is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY, without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.
You should have received a copy of the GNU Affero General Public License
along with fTelnet.  If not, see <http://www.gnu.org/licenses/>.
*/
var TelnetCommand;
(function (TelnetCommand) {
    /// <summary>
    /// SE: End of subnegotiation parameters.
    /// </summary>
    TelnetCommand[TelnetCommand["EndSubnegotiation"] = 240] = "EndSubnegotiation";

    /// <summary>
    /// NOP: No operation.
    /// </summary>
    TelnetCommand[TelnetCommand["NoOperation"] = 241] = "NoOperation";

    /// <summary>
    /// Data Mark: The data stream portion of a Synch. This should always be accompanied by a TCP Urgent notification.
    /// </summary>
    TelnetCommand[TelnetCommand["DataMark"] = 242] = "DataMark";

    /// <summary>
    /// Break: NVT character BRK.
    /// </summary>
    TelnetCommand[TelnetCommand["Break"] = 243] = "Break";

    /// <summary>
    /// Interrupt Process: The function IP.
    /// </summary>
    TelnetCommand[TelnetCommand["InterruptProcess"] = 244] = "InterruptProcess";

    /// <summary>
    /// Abort output: The function AO.
    /// </summary>
    TelnetCommand[TelnetCommand["AbortOutput"] = 245] = "AbortOutput";

    /// <summary>
    /// Are You There: The function AYT.
    /// </summary>
    TelnetCommand[TelnetCommand["AreYouThere"] = 246] = "AreYouThere";

    /// <summary>
    /// Erase character: The function EC.
    /// </summary>
    TelnetCommand[TelnetCommand["EraseCharacter"] = 247] = "EraseCharacter";

    /// <summary>
    /// Erase Line: The function EL.
    /// </summary>
    TelnetCommand[TelnetCommand["EraseLine"] = 248] = "EraseLine";

    /// <summary>
    /// Go ahead: The GA signal
    /// </summary>
    TelnetCommand[TelnetCommand["GoAhead"] = 249] = "GoAhead";

    /// <summary>
    /// SB: Indicates that what follows is subnegotiation of the indicated option.
    /// </summary>
    TelnetCommand[TelnetCommand["Subnegotiation"] = 250] = "Subnegotiation";

    /// <summary>
    /// WILL: Indicates the desire to begin performing, or confirmation that you are now performing, the indicated option.
    /// </summary>
    TelnetCommand[TelnetCommand["Will"] = 251] = "Will";

    /// <summary>
    /// WON'T: Indicates the refusal to perform, or continue performing, the indicated option.
    /// </summary>
    TelnetCommand[TelnetCommand["Wont"] = 252] = "Wont";

    /// <summary>
    /// DO: Indicates the request that the other party perform, or confirmation that you are expecting the other party
    /// to perform, the indicated option.
    /// </summary>
    TelnetCommand[TelnetCommand["Do"] = 253] = "Do";

    /// <summary>
    /// DON'T: Indicates the demand that the other party stop performing, or confirmation that you are no longer expecting
    /// the other party to perform, the indicated option.
    /// </summary>
    TelnetCommand[TelnetCommand["Dont"] = 254] = "Dont";

    /// <summary>
    /// IAC: Data Byte 255
    /// </summary>
    TelnetCommand[TelnetCommand["IAC"] = 255] = "IAC";
})(TelnetCommand || (TelnetCommand = {}));
/*
fTelnet: An HTML5 WebSocket client
Copyright (C) 2009-2013  Rick Parrish, R&M Software
This file is part of fTelnet.
fTelnet is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or any later version.
fTelnet is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY, without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.
You should have received a copy of the GNU Affero General Public License
along with fTelnet.  If not, see <http://www.gnu.org/licenses/>.
*/
var TelnetNegotiationState;
(function (TelnetNegotiationState) {
    /// <summary>
    /// The default data state
    /// </summary>
    TelnetNegotiationState[TelnetNegotiationState["Data"] = 0] = "Data";

    /// <summary>
    /// The last received character was an IAC
    /// </summary>
    TelnetNegotiationState[TelnetNegotiationState["IAC"] = 1] = "IAC";

    /// <summary>
    /// The last received character was a DO command
    /// </summary>
    TelnetNegotiationState[TelnetNegotiationState["Do"] = 2] = "Do";

    /// <summary>
    /// The last received character was a DONT command
    /// </summary>
    TelnetNegotiationState[TelnetNegotiationState["Dont"] = 3] = "Dont";

    /// <summary>
    /// The last received character was a WILL command
    /// </summary>
    TelnetNegotiationState[TelnetNegotiationState["Will"] = 4] = "Will";

    /// <summary>
    /// The last received character was a WONT command
    /// </summary>
    TelnetNegotiationState[TelnetNegotiationState["Wont"] = 5] = "Wont";
})(TelnetNegotiationState || (TelnetNegotiationState = {}));
/*
fTelnet: An HTML5 WebSocket client
Copyright (C) 2009-2013  Rick Parrish, R&M Software
This file is part of fTelnet.
fTelnet is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or any later version.
fTelnet is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY, without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.
You should have received a copy of the GNU Affero General Public License
along with fTelnet.  If not, see <http://www.gnu.org/licenses/>.
*/
var TelnetOption;
(function (TelnetOption) {
    /// <summary>
    /// When enabled, data is transmitted as 8-bit binary data.
    /// </summary>
    /// <remarks>
    /// Defined in RFC 856
    ///
    /// Default is to not transmit in binary.
    /// </remarks>
    TelnetOption[TelnetOption["TransmitBinary"] = 0] = "TransmitBinary";

    /// <summary>
    /// When enabled, the side performing the echoing transmits (echos) data characters it receives back to the sender
    /// of the data characters.
    /// </summary>
    /// <remarks>
    /// Defined in RFC 857
    ///
    /// Default is to not echo over the telnet connection.
    /// </remarks>
    TelnetOption[TelnetOption["Echo"] = 1] = "Echo";

    // TODO
    TelnetOption[TelnetOption["Reconnection"] = 2] = "Reconnection";

    /// <summary>
    /// When enabled, the sender need not transmit GAs.
    /// </summary>
    /// <remarks>
    /// Defined in RFC 858
    ///
    /// Default is to not suppress go aheads.
    /// </remarks>
    TelnetOption[TelnetOption["SuppressGoAhead"] = 3] = "SuppressGoAhead";

    TelnetOption[TelnetOption["ApproxMessageSizeNegotiation"] = 4] = "ApproxMessageSizeNegotiation";
    TelnetOption[TelnetOption["Status"] = 5] = "Status";
    TelnetOption[TelnetOption["TimingMark"] = 6] = "TimingMark";
    TelnetOption[TelnetOption["RemoteControlledTransAndEcho"] = 7] = "RemoteControlledTransAndEcho";
    TelnetOption[TelnetOption["OutputLineWidth"] = 8] = "OutputLineWidth";
    TelnetOption[TelnetOption["OutputPageSize"] = 9] = "OutputPageSize";
    TelnetOption[TelnetOption["OutputCarriageReturnDisposition"] = 10] = "OutputCarriageReturnDisposition";
    TelnetOption[TelnetOption["OutputHorizontalTabStops"] = 11] = "OutputHorizontalTabStops";
    TelnetOption[TelnetOption["OutputHorizontalTabDisposition"] = 12] = "OutputHorizontalTabDisposition";
    TelnetOption[TelnetOption["OutputFormfeedDisposition"] = 13] = "OutputFormfeedDisposition";
    TelnetOption[TelnetOption["OutputVerticalTabstops"] = 14] = "OutputVerticalTabstops";
    TelnetOption[TelnetOption["OutputVerticalTabDisposition"] = 15] = "OutputVerticalTabDisposition";
    TelnetOption[TelnetOption["OutputLinefeedDisposition"] = 16] = "OutputLinefeedDisposition";
    TelnetOption[TelnetOption["ExtendedASCII"] = 17] = "ExtendedASCII";
    TelnetOption[TelnetOption["Logout"] = 18] = "Logout";
    TelnetOption[TelnetOption["ByteMacro"] = 19] = "ByteMacro";
    TelnetOption[TelnetOption["DataEntryTerminal"] = 20] = "DataEntryTerminal";
    TelnetOption[TelnetOption["SUPDUP"] = 21] = "SUPDUP";
    TelnetOption[TelnetOption["SUPDUPOutput"] = 22] = "SUPDUPOutput";
    TelnetOption[TelnetOption["SendLocation"] = 23] = "SendLocation";

    /// <summary>
    /// Allows the TERMINAL-TYPE subnegotiation command to be used if both sides agree
    /// </summary>
    /// <remarks>
    /// Defined in RFC 1091
    ///
    /// Default is to not allow the TERMINAL-TYPE subnegotiation
    /// </remarks>
    TelnetOption[TelnetOption["TerminalType"] = 24] = "TerminalType";

    TelnetOption[TelnetOption["EndOfRecord"] = 25] = "EndOfRecord";
    TelnetOption[TelnetOption["TACACSUserIdentification"] = 26] = "TACACSUserIdentification";
    TelnetOption[TelnetOption["OutputMarking"] = 27] = "OutputMarking";

    /// <summary>
    /// Allows the TTYLOC (Terminal Location Number) subnegotiation command to be used if both sides agree
    /// </summary>
    /// <remarks>
    /// Defined in RFC 946
    ///
    /// Default is to not allow the TTYLOC subnegotiation
    /// </remarks>
    TelnetOption[TelnetOption["TerminalLocationNumber"] = 28] = "TerminalLocationNumber";

    TelnetOption[TelnetOption["Telnet3270Regime"] = 29] = "Telnet3270Regime";
    TelnetOption[TelnetOption["Xdot3PAD"] = 30] = "Xdot3PAD";

    /// <summary>
    /// Allows the NAWS (negotiate about window size) subnegotiation command to be used if both sides agree
    /// </summary>
    /// <remarks>
    /// Defined in RFC 1073
    ///
    /// Default is to not allow the NAWS subnegotiation
    /// </remarks>
    TelnetOption[TelnetOption["WindowSize"] = 31] = "WindowSize";

    TelnetOption[TelnetOption["TerminalSpeed"] = 32] = "TerminalSpeed";
    TelnetOption[TelnetOption["RemoteFlowControl"] = 33] = "RemoteFlowControl";

    /// <summary>
    /// Linemode Telnet is a way of doing terminal character processing on the client side of a Telnet connection.
    /// </summary>
    /// <remarks>
    /// Defined in RFC 1184
    ///
    /// Default is to not allow the LINEMODE subnegotiation
    /// </remarks>
    TelnetOption[TelnetOption["LineMode"] = 34] = "LineMode";

    TelnetOption[TelnetOption["XDisplayLocation"] = 35] = "XDisplayLocation";
    TelnetOption[TelnetOption["EnvironmentOption"] = 36] = "EnvironmentOption";
    TelnetOption[TelnetOption["AuthenticationOption"] = 37] = "AuthenticationOption";
    TelnetOption[TelnetOption["EncryptionOption"] = 38] = "EncryptionOption";
    TelnetOption[TelnetOption["NewEnvironmentOption"] = 39] = "NewEnvironmentOption";
    TelnetOption[TelnetOption["TN3270E"] = 40] = "TN3270E";
    TelnetOption[TelnetOption["XAUTH"] = 41] = "XAUTH";
    TelnetOption[TelnetOption["CHARSET"] = 42] = "CHARSET";
    TelnetOption[TelnetOption["TelnetRemoteSerialPort"] = 43] = "TelnetRemoteSerialPort";
    TelnetOption[TelnetOption["ComPortControlOption"] = 44] = "ComPortControlOption";
    TelnetOption[TelnetOption["TelnetSuppressLocalEcho"] = 45] = "TelnetSuppressLocalEcho";
    TelnetOption[TelnetOption["TelnetStartTLS"] = 46] = "TelnetStartTLS";
    TelnetOption[TelnetOption["KERMIT"] = 47] = "KERMIT";
    TelnetOption[TelnetOption["SENDURL"] = 48] = "SENDURL";
    TelnetOption[TelnetOption["FORWARD_X"] = 49] = "FORWARD_X";
})(TelnetOption || (TelnetOption = {}));
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
var WebSocketProtocol = ('https:' === document.location.protocol ? 'wss' : 'ws');
var WebSocketSupportsTypedArrays = (('Uint8Array' in window) && ('set' in Uint8Array.prototype));
var WebSocketSupportsBinaryType = (WebSocketSupportsTypedArrays && ('binaryType' in WebSocket.prototype || !!(new WebSocket(WebSocketProtocol + '://.').binaryType)));

var WebSocketConnection = (function () {
    function WebSocketConnection() {
        // Events
        this.onclose = new TypedEvent();
        this.onconnect = new TypedEvent();
        this.onlocalecho = new TypedEvent();
        this.onioerror = new TypedEvent();
        this.onsecurityerror = new TypedEvent();
        // Private variables
        this._WasConnected = false;
        // TODO Protected variables
        this._InputBuffer = null;
        this._OutputBuffer = null;
        this._Protocol = 'plain';
        this._WebSocket = null;
        this._InputBuffer = new ByteArray();
        this._LocalEcho = false;
        this._OutputBuffer = new ByteArray();
    }
    Object.defineProperty(WebSocketConnection.prototype, "bytesAvailable", {
        get: function () {
            return this._InputBuffer.bytesAvailable;
        },
        enumerable: true,
        configurable: true
    });

    WebSocketConnection.prototype.close = function () {
        if (this._WebSocket) {
            this._WebSocket.close();
        }
    };

    WebSocketConnection.prototype.connect = function (hostname, port, proxyHostname, proxyPort, proxyPortSecure) {
        var _this = this;
        if (typeof proxyHostname === 'undefined') {
            proxyHostname = '';
        }
        if (typeof proxyPort === 'undefined') {
            proxyPort = 1123;
        }
        if (typeof proxyPortSecure === 'undefined') {
            proxyPortSecure = 11235;
        }

        this._WasConnected = false;

        var Protocols;
        if (('websocket' in Window) && (WebSocket.CLOSED === 2 || WebSocket.prototype.CLOSED === 2)) {
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
        this._WebSocket.onclose = function () {
            _this.OnSocketClose();
        };
        this._WebSocket.onerror = function (e) {
            _this.OnSocketError(e);
        };
        this._WebSocket.onmessage = function (e) {
            _this.OnSocketMessage(e);
        };
        this._WebSocket.onopen = function () {
            _this.OnSocketOpen();
        };
    };

    Object.defineProperty(WebSocketConnection.prototype, "connected", {
        get: function () {
            if (this._WebSocket) {
                return (this._WebSocket.readyState === this._WebSocket.OPEN) || (this._WebSocket.readyState === WebSocket.OPEN);
            }

            return false;
        },
        enumerable: true,
        configurable: true
    });

    WebSocketConnection.prototype.flush = function () {
        var ToSendBytes = [];

        this._OutputBuffer.position = 0;
        while (this._OutputBuffer.bytesAvailable > 0) {
            var B = this._OutputBuffer.readUnsignedByte();
            ToSendBytes.push(B);
        }

        this.Send(ToSendBytes);
        this._OutputBuffer.clear();
    };

    Object.defineProperty(WebSocketConnection.prototype, "LocalEcho", {
        set: function (value) {
            this._LocalEcho = value;
        },
        enumerable: true,
        configurable: true
    });

    WebSocketConnection.prototype.NegotiateInbound = function (data) {
        while (data.bytesAvailable) {
            var B = data.readUnsignedByte();
            this._InputBuffer.writeByte(B);
        }
    };

    WebSocketConnection.prototype.OnSocketClose = function () {
        if (this._WasConnected) {
            this.onclose.trigger();
        } else {
            this.onsecurityerror.trigger();
        }
        this._WasConnected = false;
    };

    WebSocketConnection.prototype.OnSocketError = function (e) {
        this.onioerror.trigger(e);
    };

    WebSocketConnection.prototype.OnSocketOpen = function () {
        if (this._WebSocket.protocol) {
            this._Protocol = this._WebSocket.protocol;
        } else {
            this._Protocol = 'plain';
        }

        this._WasConnected = true;
        this.onconnect.trigger();
    };

    WebSocketConnection.prototype.OnSocketMessage = function (e) {
        // Free up some memory if we're at the end of the buffer
        if (this._InputBuffer.bytesAvailable === 0) {
            this._InputBuffer.clear();
        }

        // Save the old position and set the new position to the end of the buffer
        var OldPosition = this._InputBuffer.position;
        this._InputBuffer.position = this._InputBuffer.length;

        var Data = new ByteArray();

        // Write the incoming message to the input buffer
        var i;
        if (this._Protocol === 'binary') {
            var u8 = new Uint8Array(e.data);
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
    };

    // Remap all the read* functions to operate on our input buffer instead
    WebSocketConnection.prototype.readBytes = function (bytes, offset, length) {
        return this._InputBuffer.readBytes(bytes, offset, length);
    };

    WebSocketConnection.prototype.readString = function (length) {
        return this._InputBuffer.readString(length);
    };

    WebSocketConnection.prototype.readUnsignedByte = function () {
        return this._InputBuffer.readUnsignedByte();
    };

    WebSocketConnection.prototype.readUnsignedShort = function () {
        return this._InputBuffer.readUnsignedShort();
    };

    WebSocketConnection.prototype.Send = function (data) {
        var i = 0;
        var ToSendString = '';

        if (this._Protocol === 'binary') {
            this._WebSocket.send(new Uint8Array(data).buffer);
        } else if (this._Protocol === 'base64') {
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
    };

    // Remap all the write* functions to operate on our output buffer instead
    WebSocketConnection.prototype.writeByte = function (value) {
        this._OutputBuffer.writeByte(value);
    };

    WebSocketConnection.prototype.writeBytes = function (bytes, offset, length) {
        this._OutputBuffer.writeBytes(bytes, offset, length);
    };

    WebSocketConnection.prototype.writeShort = function (value) {
        this._OutputBuffer.writeShort(value);
    };

    WebSocketConnection.prototype.writeString = function (text) {
        this._OutputBuffer.writeString(text);
        this.flush();
    };
    return WebSocketConnection;
})();
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
var TelnetConnection = (function (_super) {
    __extends(TelnetConnection, _super);
    function TelnetConnection() {
        _super.call(this);

        this._NegotiatedOptions = [];
        for (var i = 0; i < 256; i++) {
            this._NegotiatedOptions[i] = 0;
        }
        this._NegotiationState = 0 /* Data */;
        this._TerminalTypeIndex = 0;
        this._TerminalTypes = ['ansi-bbs', 'ansi', 'cp437', 'cp437']; // cp437 twice as a cheat since you're supposed to repeat the last item before going to the first item
    }
    TelnetConnection.prototype.flush = function () {
        var ToSendBytes = [];

        this._OutputBuffer.position = 0;
        while (this._OutputBuffer.bytesAvailable > 0) {
            var B = this._OutputBuffer.readUnsignedByte();
            ToSendBytes.push(B);

            if (B === 255 /* IAC */) {
                ToSendBytes.push(255 /* IAC */);
            }
        }

        this.Send(ToSendBytes);
        this._OutputBuffer.clear();
    };

    TelnetConnection.prototype.HandleAreYouThere = function () {
        var ToSendBytes = [];
        ToSendBytes.push('.'.charCodeAt(0));
        this.Send(ToSendBytes);
    };

    TelnetConnection.prototype.HandleEcho = function (command) {
        switch (command) {
            case 253 /* Do */:
                this.SendWill(1 /* Echo */);
                this._LocalEcho = true;
                this.onlocalecho.trigger(this._LocalEcho);
                break;
            case 254 /* Dont */:
                this.SendWont(1 /* Echo */);
                this._LocalEcho = false;
                this.onlocalecho.trigger(this._LocalEcho);
                break;
            case 251 /* Will */:
                this.SendDo(1 /* Echo */);
                this._LocalEcho = false;
                this.onlocalecho.trigger(this._LocalEcho);
                break;
            case 252 /* Wont */:
                this.SendDont(1 /* Echo */);
                this._LocalEcho = true;
                this.onlocalecho.trigger(this._LocalEcho);
                break;
        }
    };

    TelnetConnection.prototype.HandleTerminalType = function () {
        this.SendWill(24 /* TerminalType */);
        this.SendSubnegotiate(24 /* TerminalType */);

        var TerminalType = this._TerminalTypes[this._TerminalTypeIndex];
        var ToSendBytes = [];
        ToSendBytes.push(0); // IS

        for (var i = 0; i < TerminalType.length; i++) {
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
    };

    TelnetConnection.prototype.HandleTerminalLocationNumber = function () {
        this.SendWill(28 /* TerminalLocationNumber */);
        this.SendSubnegotiate(28 /* TerminalLocationNumber */);

        var InternetHostNumber = 0;
        var TerminalNumber = -1;

        var SixtyFourBits = [];
        SixtyFourBits.push(0); // Format 0
        SixtyFourBits.push((InternetHostNumber & 0xFF000000) >> 24);
        SixtyFourBits.push((InternetHostNumber & 0x00FF0000) >> 16);
        SixtyFourBits.push((InternetHostNumber & 0x0000FF00) >> 8);
        SixtyFourBits.push((InternetHostNumber & 0x000000FF) >> 0);
        SixtyFourBits.push((TerminalNumber & 0xFF000000) >> 24);
        SixtyFourBits.push((TerminalNumber & 0x00FF0000) >> 16);
        SixtyFourBits.push((TerminalNumber & 0x0000FF00) >> 8);
        SixtyFourBits.push((TerminalNumber & 0x000000FF) >> 0);

        var ToSendBytes = [];

        for (var i = 0; i < SixtyFourBits.length; i++) {
            ToSendBytes.push(SixtyFourBits[i]);
            if (SixtyFourBits[i] === 255 /* IAC */) {
                // Double up so it's not treated as an IAC
                ToSendBytes.push(255 /* IAC */);
            }
        }
        this.Send(ToSendBytes);

        this.SendSubnegotiateEnd();
    };

    TelnetConnection.prototype.HandleWindowSize = function () {
        this.SendWill(31 /* WindowSize */);
        this.SendSubnegotiate(31 /* WindowSize */);

        var Size = [];
        Size[0] = (Crt.WindCols >> 8) & 0xff;
        Size[1] = Crt.WindCols & 0xff;
        Size[2] = (Crt.WindRows >> 8) & 0xff;
        Size[3] = Crt.WindRows & 0xff;

        var ToSendBytes = [];
        for (var i = 0; i < Size.length; i++) {
            ToSendBytes.push(Size[i]);
            if (Size[i] === 255 /* IAC */) {
                // Double up so it's not treated as an IAC
                ToSendBytes.push(255 /* IAC */);
            }
        }
        this.Send(ToSendBytes);

        this.SendSubnegotiateEnd();
    };

    Object.defineProperty(TelnetConnection.prototype, "LocalEcho", {
        set: function (value) {
            this._LocalEcho = value;

            if (this.connected) {
                if (this._LocalEcho) {
                    this.SendWill(1 /* Echo */);
                } else {
                    this.SendWont(1 /* Echo */);
                }
            }
        },
        enumerable: true,
        configurable: true
    });

    TelnetConnection.prototype.NegotiateInbound = function (data) {
        while (data.bytesAvailable) {
            var B = data.readUnsignedByte();

            if (this._NegotiationState === 0 /* Data */) {
                if (B === 255 /* IAC */) {
                    this._NegotiationState = 1 /* IAC */;
                } else {
                    this._InputBuffer.writeByte(B);
                }
            } else if (this._NegotiationState === 1 /* IAC */) {
                if (B === 255 /* IAC */) {
                    this._NegotiationState = 0 /* Data */;
                    this._InputBuffer.writeByte(B);
                } else {
                    switch (B) {
                        case 241 /* NoOperation */:
                        case 242 /* DataMark */:
                        case 243 /* Break */:
                        case 244 /* InterruptProcess */:
                        case 245 /* AbortOutput */:
                        case 247 /* EraseCharacter */:
                        case 248 /* EraseLine */:
                        case 249 /* GoAhead */:
                            // We recognize, but ignore these for now
                            this._NegotiationState = 0 /* Data */;
                            break;
                        case 246 /* AreYouThere */:
                            this.HandleAreYouThere();
                            this._NegotiationState = 0 /* Data */;
                            break;
                        case 253 /* Do */:
                            this._NegotiationState = 2 /* Do */;
                            break;
                        case 254 /* Dont */:
                            this._NegotiationState = 3 /* Dont */;
                            break;
                        case 251 /* Will */:
                            this._NegotiationState = 4 /* Will */;
                            break;
                        case 252 /* Wont */:
                            this._NegotiationState = 5 /* Wont */;
                            break;
                        default:
                            this._NegotiationState = 0 /* Data */;
                            break;
                    }
                }
            } else if (this._NegotiationState === 2 /* Do */) {
                switch (B) {
                    case 246 /* AreYouThere */:
                        // TWGS incorrectly sends a DO AYT and expects a response
                        this.SendWill(246 /* AreYouThere */);
                        this._NegotiatedOptions[246 /* AreYouThere */] = 0;
                        break;
                    case 0 /* TransmitBinary */:
                        this.SendWill(B);
                        break;
                    case 1 /* Echo */:
                        this.HandleEcho(253 /* Do */);
                        break;
                    case 3 /* SuppressGoAhead */:
                        this.SendWill(B);
                        break;
                    case 24 /* TerminalType */:
                        this.HandleTerminalType();
                        break;
                    case 28 /* TerminalLocationNumber */:
                        this.HandleTerminalLocationNumber();
                        break;
                    case 31 /* WindowSize */:
                        this.HandleWindowSize();
                        break;
                    case 34 /* LineMode */:
                        this.SendWont(B);
                        break;
                    default:
                        this.SendWont(B);
                        break;
                }
                this._NegotiationState = 0 /* Data */;
            } else if (this._NegotiationState === 3 /* Dont */) {
                switch (B) {
                    case 0 /* TransmitBinary */:
                        this.SendWill(B);
                        break;
                    case 1 /* Echo */:
                        this.HandleEcho(254 /* Dont */);
                        break;
                    case 3 /* SuppressGoAhead */:
                        this.SendWill(B);
                        break;
                    case 28 /* TerminalLocationNumber */:
                        this.SendWont(B);
                        break;
                    case 31 /* WindowSize */:
                        this.SendWont(B);
                        break;
                    case 34 /* LineMode */:
                        this.SendWont(B);
                        break;
                    default:
                        this.SendWont(B);
                        break;
                }
                this._NegotiationState = 0 /* Data */;
            } else if (this._NegotiationState === 4 /* Will */) {
                switch (B) {
                    case 0 /* TransmitBinary */:
                        this.SendDo(B);
                        break;
                    case 1 /* Echo */:
                        this.HandleEcho(251 /* Will */);
                        break;
                    case 3 /* SuppressGoAhead */:
                        this.SendDo(B);
                        break;
                    case 28 /* TerminalLocationNumber */:
                        this.SendDont(B);
                        break;
                    case 31 /* WindowSize */:
                        this.SendDont(B);
                        break;
                    case 34 /* LineMode */:
                        this.SendDont(B);
                        break;
                    default:
                        this.SendDont(B);
                        break;
                }
                this._NegotiationState = 0 /* Data */;
            } else if (this._NegotiationState === 5 /* Wont */) {
                switch (B) {
                    case 0 /* TransmitBinary */:
                        this.SendDo(B);
                        break;
                    case 1 /* Echo */:
                        this.HandleEcho(252 /* Wont */);
                        break;
                    case 3 /* SuppressGoAhead */:
                        this.SendDo(B);
                        break;
                    case 28 /* TerminalLocationNumber */:
                        this.SendDont(B);
                        break;
                    case 31 /* WindowSize */:
                        this.SendDont(B);
                        break;
                    case 34 /* LineMode */:
                        this.SendDont(B);
                        break;
                    default:
                        this.SendDont(B);
                        break;
                }
                this._NegotiationState = 0 /* Data */;
            } else {
                this._NegotiationState = 0 /* Data */;
            }
        }
    };

    // TODO Need NegotiateOutbound
    TelnetConnection.prototype.OnSocketOpen = function () {
        _super.prototype.OnSocketOpen.call(this);

        if (this._LocalEcho) {
            this.SendWill(1 /* Echo */);
        } else {
            this.SendWont(1 /* Echo */);
        }
    };

    TelnetConnection.prototype.SendDo = function (option) {
        if (this._NegotiatedOptions[option] !== 253 /* Do */) {
            // Haven't negotiated this option
            this._NegotiatedOptions[option] = 253 /* Do */;

            var ToSendBytes = [];
            ToSendBytes.push(255 /* IAC */);
            ToSendBytes.push(253 /* Do */);
            ToSendBytes.push(option);
            this.Send(ToSendBytes);
        }
    };

    TelnetConnection.prototype.SendDont = function (option) {
        if (this._NegotiatedOptions[option] !== 254 /* Dont */) {
            // Haven't negotiated this option
            this._NegotiatedOptions[option] = 254 /* Dont */;

            var ToSendBytes = [];
            ToSendBytes.push(255 /* IAC */);
            ToSendBytes.push(254 /* Dont */);
            ToSendBytes.push(option);
            this.Send(ToSendBytes);
        }
    };

    TelnetConnection.prototype.SendSubnegotiate = function (option) {
        var ToSendBytes = [];
        ToSendBytes.push(255 /* IAC */);
        ToSendBytes.push(250 /* Subnegotiation */);
        ToSendBytes.push(option);
        this.Send(ToSendBytes);
    };

    TelnetConnection.prototype.SendSubnegotiateEnd = function () {
        var ToSendBytes = [];
        ToSendBytes.push(255 /* IAC */);
        ToSendBytes.push(240 /* EndSubnegotiation */);
        this.Send(ToSendBytes);
    };

    TelnetConnection.prototype.SendWill = function (option) {
        if (this._NegotiatedOptions[option] !== 251 /* Will */) {
            // Haven't negotiated this option
            this._NegotiatedOptions[option] = 251 /* Will */;

            var ToSendBytes = [];
            ToSendBytes.push(255 /* IAC */);
            ToSendBytes.push(251 /* Will */);
            ToSendBytes.push(option);
            this.Send(ToSendBytes);
        }
    };

    TelnetConnection.prototype.SendWont = function (option) {
        if (this._NegotiatedOptions[option] !== 252 /* Wont */) {
            // Haven't negotiated this option
            this._NegotiatedOptions[option] = 252 /* Wont */;

            var ToSendBytes = [];
            ToSendBytes.push(255 /* IAC */);
            ToSendBytes.push(252 /* Wont */);
            ToSendBytes.push(option);
            this.Send(ToSendBytes);
        }
    };
    return TelnetConnection;
})(WebSocketConnection);
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
var CRC = (function () {
    function CRC() {
    }
    CRC.Calculate16 = function (bytes) {
        var CRC = 0;

        // Save the old byte position
        var OldPosition = bytes.position;
        bytes.position = 0;

        while (bytes.bytesAvailable > 0) {
            CRC = this.UpdateCrc(bytes.readUnsignedByte(), CRC);
        }
        CRC = this.UpdateCrc(0, CRC);
        CRC = this.UpdateCrc(0, CRC);

        // Restore the old byte position
        bytes.position = OldPosition;

        return CRC;
    };

    CRC.UpdateCrc = function (curByte, curCrc) {
        // Pascal code: UpdateCrc := CrcTable[((CurCrc shr 8) and 255)] xor (CurCrc shl 8) xor CurByte;
        return (this.CRC_TABLE[(curCrc >> 8) & 0x00FF] ^ (curCrc << 8) ^ curByte) & 0xFFFF;
    };
    CRC.CRC_TABLE = [
        0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7,
        0x8108, 0x9129, 0xa14a, 0xb16b, 0xc18c, 0xd1ad, 0xe1ce, 0xf1ef,
        0x1231, 0x0210, 0x3273, 0x2252, 0x52b5, 0x4294, 0x72f7, 0x62d6,
        0x9339, 0x8318, 0xb37b, 0xa35a, 0xd3bd, 0xc39c, 0xf3ff, 0xe3de,
        0x2462, 0x3443, 0x0420, 0x1401, 0x64e6, 0x74c7, 0x44a4, 0x5485,
        0xa56a, 0xb54b, 0x8528, 0x9509, 0xe5ee, 0xf5cf, 0xc5ac, 0xd58d,
        0x3653, 0x2672, 0x1611, 0x0630, 0x76d7, 0x66f6, 0x5695, 0x46b4,
        0xb75b, 0xa77a, 0x9719, 0x8738, 0xf7df, 0xe7fe, 0xd79d, 0xc7bc,
        0x48c4, 0x58e5, 0x6886, 0x78a7, 0x0840, 0x1861, 0x2802, 0x3823,
        0xc9cc, 0xd9ed, 0xe98e, 0xf9af, 0x8948, 0x9969, 0xa90a, 0xb92b,
        0x5af5, 0x4ad4, 0x7ab7, 0x6a96, 0x1a71, 0x0a50, 0x3a33, 0x2a12,
        0xdbfd, 0xcbdc, 0xfbbf, 0xeb9e, 0x9b79, 0x8b58, 0xbb3b, 0xab1a,
        0x6ca6, 0x7c87, 0x4ce4, 0x5cc5, 0x2c22, 0x3c03, 0x0c60, 0x1c41,
        0xedae, 0xfd8f, 0xcdec, 0xddcd, 0xad2a, 0xbd0b, 0x8d68, 0x9d49,
        0x7e97, 0x6eb6, 0x5ed5, 0x4ef4, 0x3e13, 0x2e32, 0x1e51, 0x0e70,
        0xff9f, 0xefbe, 0xdfdd, 0xcffc, 0xbf1b, 0xaf3a, 0x9f59, 0x8f78,
        0x9188, 0x81a9, 0xb1ca, 0xa1eb, 0xd10c, 0xc12d, 0xf14e, 0xe16f,
        0x1080, 0x00a1, 0x30c2, 0x20e3, 0x5004, 0x4025, 0x7046, 0x6067,
        0x83b9, 0x9398, 0xa3fb, 0xb3da, 0xc33d, 0xd31c, 0xe37f, 0xf35e,
        0x02b1, 0x1290, 0x22f3, 0x32d2, 0x4235, 0x5214, 0x6277, 0x7256,
        0xb5ea, 0xa5cb, 0x95a8, 0x8589, 0xf56e, 0xe54f, 0xd52c, 0xc50d,
        0x34e2, 0x24c3, 0x14a0, 0x0481, 0x7466, 0x6447, 0x5424, 0x4405,
        0xa7db, 0xb7fa, 0x8799, 0x97b8, 0xe75f, 0xf77e, 0xc71d, 0xd73c,
        0x26d3, 0x36f2, 0x0691, 0x16b0, 0x6657, 0x7676, 0x4615, 0x5634,
        0xd94c, 0xc96d, 0xf90e, 0xe92f, 0x99c8, 0x89e9, 0xb98a, 0xa9ab,
        0x5844, 0x4865, 0x7806, 0x6827, 0x18c0, 0x08e1, 0x3882, 0x28a3,
        0xcb7d, 0xdb5c, 0xeb3f, 0xfb1e, 0x8bf9, 0x9bd8, 0xabbb, 0xbb9a,
        0x4a75, 0x5a54, 0x6a37, 0x7a16, 0x0af1, 0x1ad0, 0x2ab3, 0x3a92,
        0xfd2e, 0xed0f, 0xdd6c, 0xcd4d, 0xbdaa, 0xad8b, 0x9de8, 0x8dc9,
        0x7c26, 0x6c07, 0x5c64, 0x4c45, 0x3ca2, 0x2c83, 0x1ce0, 0x0cc1,
        0xef1f, 0xff3e, 0xcf5d, 0xdf7c, 0xaf9b, 0xbfba, 0x8fd9, 0x9ff8,
        0x6e17, 0x7e36, 0x4e55, 0x5e74, 0x2e93, 0x3eb2, 0x0ed1, 0x1ef0];
    return CRC;
})();
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
var FileRecord = (function () {
    function FileRecord(name, size) {
        this._Data = new ByteArray();
        this._Name = '';
        this._Size = 0;
        this._Name = name;
        this._Size = size;
    }
    Object.defineProperty(FileRecord.prototype, "data", {
        get: function () {
            return this._Data;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(FileRecord.prototype, "name", {
        get: function () {
            return this._Name;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(FileRecord.prototype, "size", {
        get: function () {
            return this._Size;
        },
        enumerable: true,
        configurable: true
    });
    return FileRecord;
})();
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
var YModemReceive = (function () {
    function YModemReceive(connection) {
        // Events
        this.ontransfercomplete = new TypedEvent();
        // Private constants
        this.SOH = 0x01;
        this.STX = 0x02;
        this.EOT = 0x04;
        this.ACK = 0x06;
        // Unused private NAK: number = 0x15;
        this.CAN = 0x18;
        // Unused private SUB: number = 0x1A;
        this.CAPG = 'G'.charCodeAt(0);
        // Private variables
        this._Blink = false;
        this._ExpectingHeader = true;
        this._Files = [];
        this._LastGTime = 0;
        this._NextByte = 0;
        this._ShouldSendG = true;
        this._TotalBytesReceived = 0;
        this._Connection = connection;
    }
    YModemReceive.prototype.Cancel = function (reason) {
        try  {
            this._Connection.writeByte(this.CAN);
            this._Connection.writeByte(this.CAN);
            this._Connection.writeByte(this.CAN);
            this._Connection.writeByte(this.CAN);
            this._Connection.writeByte(this.CAN);
            this._Connection.writeString('\b\b\b\b\b     \b\b\b\b\b'); // will auto-flush
        } catch (ioe1) {
            this.HandleIOError(ioe1);
            return;
        }

        try  {
            this._Connection.readString();
        } catch (ioe2) {
            this.HandleIOError(ioe2);
            return;
        }

        this.CleanUp('Cancelling (' + reason + ')');
    };

    YModemReceive.prototype.CleanUp = function (message) {
        var _this = this;
        // Remove the listeners
        clearInterval(this._Timer);

        // Update status label
        this.lblStatus.Text = 'Status: ' + message;

        // Dispatch the event after 3 seconds
        setTimeout(function () {
            _this.Dispatch();
        }, 3000);
    };

    YModemReceive.prototype.Dispatch = function () {
        // Remove the panel
        this.pnlMain.Hide();
        Crt.Blink = this._Blink;
        Crt.ShowCursor();

        this.ontransfercomplete.trigger();
    };

    YModemReceive.prototype.Download = function () {
        var _this = this;
        // Create our main timer
        this._Timer = setInterval(function () {
            _this.OnTimer();
        }, 50);

        // Create the transfer dialog
        this._Blink = Crt.Blink;
        Crt.Blink = false;
        Crt.HideCursor();
        this.pnlMain = new CrtPanel(null, 10, 5, 60, 14, 0 /* Single */, Crt.WHITE, Crt.BLUE, 'YModem-G Receive Status (Hit CTRL+X to abort)', 6 /* TopLeft */);
        this.lblFileCount = new CrtLabel(this.pnlMain, 2, 2, 56, 'Receiving file 1', 9 /* Left */, Crt.YELLOW, Crt.BLUE);
        this.lblFileName = new CrtLabel(this.pnlMain, 2, 4, 56, 'File Name: ', 9 /* Left */, Crt.YELLOW, Crt.BLUE);
        this.lblFileSize = new CrtLabel(this.pnlMain, 2, 5, 56, 'File Size: ', 9 /* Left */, Crt.YELLOW, Crt.BLUE);
        this.lblFileReceived = new CrtLabel(this.pnlMain, 2, 6, 56, 'File Recv: ', 9 /* Left */, Crt.YELLOW, Crt.BLUE);
        this.pbFileReceived = new CrtProgressBar(this.pnlMain, 2, 7, 56, 219 /* Continuous */);
        this.lblTotalReceived = new CrtLabel(this.pnlMain, 2, 9, 56, 'Total Recv: ', 9 /* Left */, Crt.YELLOW, Crt.BLUE);
        this.lblStatus = new CrtLabel(this.pnlMain, 2, 11, 56, 'Status: Transferring file(s)', 9 /* Left */, Crt.WHITE, Crt.BLUE);
    };

    YModemReceive.prototype.FileAt = function (index) {
        return this._Files[index];
    };

    Object.defineProperty(YModemReceive.prototype, "FileCount", {
        get: function () {
            return this._Files.length;
        },
        enumerable: true,
        configurable: true
    });

    YModemReceive.prototype.HandleIOError = function (ioe) {
        console.log('I/O Error: ' + ioe);

        if (this._Connection.connected) {
            this.CleanUp('Unhandled I/O error');
        } else {
            this.CleanUp('Connection to server lost');
        }
    };

    YModemReceive.prototype.OnTimer = function () {
        while (Crt.KeyPressed()) {
            var KPE = Crt.ReadKey();
            if ((KPE !== null) && (KPE.keyString.length > 0) && (KPE.keyString.charCodeAt(0) === this.CAN)) {
                this.Cancel('User requested abort');
            }
        }

        while (true) {
            // Check if we've read a byte previously
            if (this._NextByte === 0) {
                // Nope, try to read one now
                if (this._Connection.bytesAvailable === 0) {
                    // No data -- check if we should send a G
                    if (this._ShouldSendG && ((new Date()).getTime() - this._LastGTime > 3000)) {
                        try  {
                            this._Connection.writeByte(this.CAPG);
                            this._Connection.flush();
                        } catch (ioe1) {
                            this.HandleIOError(ioe1);
                            return;
                        }

                        // Reset last G time so we don't spam G's
                        this._LastGTime = new Date().getTime();
                    }

                    return;
                } else {
                    try  {
                        this._NextByte = this._Connection.readUnsignedByte();
                    } catch (ioe2) {
                        this.HandleIOError(ioe2);
                        return;
                    }
                }
            }

            switch (this._NextByte) {
                case this.CAN:
                    // Sender requested cancellation
                    this.CleanUp('Sender requested abort');

                    break;
                case this.SOH:
                case this.STX:
                    // File transfer is happening, don't send a G on timeout
                    this._ShouldSendG = false;

                    var BlockSize = (this._NextByte === this.STX) ? 1024 : 128;

                    // Make sure we have enough data to read a full block
                    if (this._Connection.bytesAvailable < (1 + 1 + BlockSize + 1 + 1)) {
                        return;
                    }

                    // Reset NextByte variable so we read in a new byte next loop
                    this._NextByte = 0;

                    // Get block numbers
                    var InBlock = this._Connection.readUnsignedByte();
                    var InBlockInverse = this._Connection.readUnsignedByte();

                    // Validate block numbers
                    if (InBlockInverse !== (255 - InBlock)) {
                        this.Cancel('Bad block #: ' + InBlockInverse.toString() + ' !== 255-' + InBlock.toString());
                        return;
                    }

                    // Read data block
                    var Packet = new ByteArray();
                    this._Connection.readBytes(Packet, 0, BlockSize);

                    // Validate CRC
                    var InCRC = this._Connection.readUnsignedShort();
                    var OurCRC = CRC.Calculate16(Packet);
                    if (InCRC !== OurCRC) {
                        this.Cancel('Bad CRC: ' + InCRC.toString() + ' !== ' + OurCRC.toString());
                        return;
                    }

                    // Reading the header?
                    if (this._ExpectingHeader) {
                        // Make sure it's block 0
                        if (InBlock !== 0) {
                            this.Cancel('Expecting header got block ' + InBlock.toString());
                            return;
                        }

                        // It is, so mark that we don't want it next packet 0
                        this._ExpectingHeader = false;

                        // Get the filename
                        var FileName = '';
                        var B = Packet.readUnsignedByte();
                        while ((B !== 0) && (Packet.bytesAvailable > 0)) {
                            FileName += String.fromCharCode(B);
                            B = Packet.readUnsignedByte();
                        }

                        // Get the file size
                        var Temp = '';
                        var FileSize = 0;
                        B = Packet.readUnsignedByte();
                        while ((B >= 48) && (B <= 57) && (Packet.bytesAvailable > 0)) {
                            Temp += String.fromCharCode(B);
                            B = Packet.readUnsignedByte();
                        }
                        FileSize = parseInt(Temp, 10);

                        // Check for blank filename (means batch is complete)
                        if (FileName.length === 0) {
                            this.CleanUp('File(s) successfully received!');
                            return;
                        }

                        // Check for blank file size (we don't like this case!)
                        if (isNaN(FileSize) || (FileSize === 0)) {
                            this.Cancel('File Size missing from header block');
                            return;
                        }

                        // Header is good, setup a new file record
                        this._File = new FileRecord(FileName, FileSize);
                        this.lblFileCount.Text = 'Receiving file ' + (this._Files.length + 1).toString();
                        this.lblFileName.Text = 'File Name: ' + FileName;
                        this.lblFileSize.Text = 'File Size: ' + StringUtils.AddCommas(FileSize) + ' bytes';
                        this.lblFileReceived.Text = 'File Recv: 0 bytes';
                        this.pbFileReceived.Value = 0;
                        this.pbFileReceived.Maximum = FileSize;

                        try  {
                            this._Connection.writeByte(this.CAPG);
                            this._Connection.flush();
                        } catch (ioe3) {
                            this.HandleIOError(ioe3);
                            return;
                        }
                    } else {
                        // Add bytes to byte array (don't exceed desired file size though)
                        var BytesToWrite = Math.min(BlockSize, this._File.size - this._File.data.length);
                        this._File.data.writeBytes(Packet, 0, BytesToWrite);
                        this._TotalBytesReceived += BytesToWrite;

                        this.lblFileReceived.Text = 'File Recv: ' + StringUtils.AddCommas(this._File.data.length) + ' bytes';
                        this.pbFileReceived.Value = this._File.data.length;
                        this.lblTotalReceived.Text = 'Total Recv: ' + StringUtils.AddCommas(this._TotalBytesReceived) + ' bytes';
                    }

                    break;
                case this.EOT:
                    // File transfer is over, send a G on timeout
                    this._ShouldSendG = true;

                    try  {
                        this._Connection.writeByte(this.ACK);
                        this._Connection.writeByte(this.CAPG);
                        this._Connection.flush();
                    } catch (ioe4) {
                        this.HandleIOError(ioe4);
                        return;
                    }

                    // Reset NextByte variable so we read in a new byte next loop
                    this._NextByte = 0;

                    // Reset variables for next transfer
                    this._ExpectingHeader = true;
                    this._Files.push(this._File);

                    // Save the file
                    this.SaveFile(this._Files.length - 1);

                    break;
                default:
                    // Didn't expect this, so abort
                    this.Cancel('Unexpected byte: ' + this._NextByte.toString());
                    return;
            }
        }
    };

    YModemReceive.prototype.SaveFile = function (index) {
        var ByteString = this._Files[index].data.toString();

        var Buffer = new ArrayBuffer(ByteString.length);
        var View = new DataView(Buffer);
        for (var i = 0; i < ByteString.length; i++) {
            View.setUint8(i, ByteString.charCodeAt(i));
        }

        var FileBlob = new Blob([Buffer], { type: 'application/octet-binary' });
        saveAs(FileBlob, this._Files[index].name);
    };
    return YModemReceive;
})();
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
var YModemSend = (function () {
    function YModemSend(connection) {
        // Events
        this.ontransfercomplete = new TypedEvent();
        // Private constants
        this.SOH = 0x01;
        this.STX = 0x02;
        this.EOT = 0x04;
        this.ACK = 0x06;
        this.NAK = 0x15;
        this.CAN = 0x18;
        this.SUB = 0x1A;
        this.CAPG = 'G'.charCodeAt(0);
        // Private variables
        this._Block = 0;
        this._Blink = false;
        this._EOTCount = 0;
        this._FileBytesSent = 0;
        this._FileCount = 0;
        this._Files = [];
        this._State = 0 /* WaitingForHeaderRequest */;
        this._TotalBytes = 0;
        this._TotalBytesSent = 0;
        this._Connection = connection;
    }
    YModemSend.prototype.Cancel = function (reason) {
        try  {
            this._Connection.writeByte(this.CAN);
            this._Connection.writeByte(this.CAN);
            this._Connection.writeByte(this.CAN);
            this._Connection.writeByte(this.CAN);
            this._Connection.writeByte(this.CAN);
            this._Connection.writeString('\b\b\b\b\b     \b\b\b\b\b'); // will auto-flush
        } catch (ioe1) {
            this.HandleIOError(ioe1);
            return;
        }

        try  {
            this._Connection.readString();
        } catch (ioe2) {
            this.HandleIOError(ioe2);
            return;
        }

        this.CleanUp('Cancelling (' + reason + ')');
    };

    YModemSend.prototype.CleanUp = function (message) {
        var _this = this;
        // Remove the listeners
        clearInterval(this._Timer);

        // Update status label
        this.lblStatus.Text = 'Status: ' + message;

        // Dispatch the event after 3 seconds
        setTimeout(function () {
            _this.Dispatch();
        }, 3000);
    };

    YModemSend.prototype.Dispatch = function () {
        // Remove the panel
        this.pnlMain.Hide();
        Crt.Blink = this._Blink;
        Crt.ShowCursor();

        this.ontransfercomplete.trigger();
    };

    YModemSend.prototype.HandleIOError = function (ioe) {
        console.log('I/O Error: ' + ioe);

        if (this._Connection.connected) {
            this.CleanUp('Unhandled I/O error');
        } else {
            this.CleanUp('Connection to server lost');
        }
    };

    YModemSend.prototype.OnTimer = function () {
        while (Crt.KeyPressed()) {
            var KPE = Crt.ReadKey();
            if ((KPE !== null) && (KPE.keyString.length > 0) && (KPE.keyString.charCodeAt(0) === this.CAN)) {
                this.Cancel('User requested abort');
            }
        }

        // Break if no data is waiting (unless we're in the YModemSendState.SendingData state)
        if ((this._State !== 3 /* SendingData */) && (this._Connection.bytesAvailable === 0)) {
            return;
        }

        // Determine what to do
        var B = 0;
        switch (this._State) {
            case 0 /* WaitingForHeaderRequest */:
                try  {
                    B = this._Connection.readUnsignedByte();
                } catch (ioe1) {
                    this.HandleIOError(ioe1);
                    return;
                }

                // Make sure we got the G and not something else
                if (B !== this.CAPG) {
                    this.Cancel('Expecting G got ' + B.toString() + ' (State=' + this._State + ')');
                    return;
                }

                try  {
                    this._Connection.readString();
                } catch (ioe2) {
                    this.HandleIOError(ioe2);
                    return;
                }

                // Do we still have files in the array?
                if (this._Files.length === 0) {
                    // Nope, let the other end know we're done
                    this.SendEmptyHeaderBlock();
                    this.CleanUp('File(s) successfully sent!');
                    return;
                }

                // Load the next file
                this._File = this._Files.shift();
                this.lblFileCount.Text = 'Sending file ' + (this._FileCount - this._Files.length).toString() + ' of ' + this._FileCount.toString();
                this.lblFileName.Text = 'File Name: ' + this._File.name;
                this.lblFileSize.Text = 'File Size: ' + StringUtils.AddCommas(this._File.size) + ' bytes';
                this.lblFileSent.Text = 'File Sent: 0 bytes';
                this.pbFileSent.Value = 0;
                this.pbFileSent.Maximum = this._File.size;

                // Send the header block
                this.SendHeaderBlock();

                // Reset variables for the new file transfer
                this._Block = 1;
                this._EOTCount = 0;
                this._FileBytesSent = 0;

                // Move to next state
                this._State = 1 /* WaitingForHeaderAck */;
                return;

            case 1 /* WaitingForHeaderAck */:
                try  {
                    B = this._Connection.readUnsignedByte();
                } catch (ioe3) {
                    this.HandleIOError(ioe3);
                    return;
                }

                // Make sure we got the ACK or G and not something else
                if ((B !== this.ACK) && (B !== this.CAPG)) {
                    this.Cancel('Expecting ACK/G got ' + B.toString() + ' (State=' + this._State + ')');
                    return;
                }

                if (B === this.ACK) {
                    // Move to next state
                    this._State = 2 /* WaitingForFileRequest */;
                } else if (B === this.CAPG) {
                    // Async PRO doesn't ACK the header packet, so we can only assume this G is a request for the file to start, not for a re-send of the header
                    // Move to next state
                    this._State = 3 /* SendingData */;
                }
                return;

            case 2 /* WaitingForFileRequest */:
                try  {
                    B = this._Connection.readUnsignedByte();
                } catch (ioe4) {
                    this.HandleIOError(ioe4);
                    return;
                }

                // Make sure we got the G and not something else
                if (B !== this.CAPG) {
                    this.Cancel('Expecting G got ' + B.toString() + ' (State=' + this._State + ')');
                    return;
                }

                // Move to next state
                this._State = 3 /* SendingData */;
                return;

            case 3 /* SendingData */:
                if (this.SendDataBlocks(16)) {
                    // SendDataBlocks returns true when the whole file has been sent
                    this._State = 4 /* WaitingForFileAck */;
                }
                return;

            case 4 /* WaitingForFileAck */:
                try  {
                    B = this._Connection.readUnsignedByte();
                } catch (ioe5) {
                    this.HandleIOError(ioe5);
                    return;
                }

                // Make sure we got the ACK (or NAK) and not something else
                if ((B !== this.ACK) && (B !== this.NAK)) {
                    this.Cancel('Expecting (N)ACK got ' + B.toString() + ' (State=' + this._State + ')');
                    return;
                }

                // Move to next state
                if (B === this.ACK) {
                    // Waiting for them to request the next header
                    this._State = 0 /* WaitingForHeaderRequest */;
                } else if (B === this.NAK) {
                    // Re-send the EOT
                    this.SendEOT();
                }
                return;
        }
    };

    YModemSend.prototype.SendDataBlocks = function (blocks) {
        for (var loop = 0; loop < blocks; loop++) {
            // Determine how many bytes to read (max 1024 per block)
            var BytesToRead = Math.min(1024, this._File.data.bytesAvailable);

            // Check how many bytes are left
            if (BytesToRead === 0) {
                // No more bytes left, send the EOT
                this.SendEOT();
                return true;
            } else {
                // Read the bytes from the file
                var Packet = new ByteArray();
                this._File.data.readBytes(Packet, 0, BytesToRead);

                // Append SUB bytes to pad to 1024, if necessary
                if (Packet.length < 1024) {
                    Packet.position = Packet.length;
                    while (Packet.length < 1024) {
                        Packet.writeByte(this.SUB);
                    }
                    Packet.position = 0;
                }

                try  {
                    this._Connection.writeByte(this.STX);
                    this._Connection.writeByte(this._Block % 256);
                    this._Connection.writeByte(255 - (this._Block % 256));
                    this._Connection.writeBytes(Packet);
                    this._Connection.writeShort(CRC.Calculate16(Packet));
                    this._Connection.flush();
                } catch (ioe) {
                    this.HandleIOError(ioe);
                    return false;
                }

                // Increment counters
                this._Block++;
                this._FileBytesSent += BytesToRead;
                this._TotalBytesSent += BytesToRead;

                // Update labels
                this.lblFileSent.Text = 'File Sent: ' + StringUtils.AddCommas(this._FileBytesSent) + ' bytes';
                this.pbFileSent.StepBy(BytesToRead);
                this.lblTotalSent.Text = 'Total Sent: ' + StringUtils.AddCommas(this._TotalBytesSent) + ' bytes';
                this.pbTotalSent.StepBy(BytesToRead);
            }
        }

        // Didn't finish the file yet
        return false;
    };

    YModemSend.prototype.SendEmptyHeaderBlock = function () {
        var Packet = new ByteArray();

        for (var i = 0; i < 128; i++) {
            Packet.writeByte(0);
        }

        try  {
            this._Connection.writeByte(this.SOH);
            this._Connection.writeByte(0);
            this._Connection.writeByte(255);
            this._Connection.writeBytes(Packet);
            this._Connection.writeShort(CRC.Calculate16(Packet));
            this._Connection.flush();
        } catch (ioe) {
            this.HandleIOError(ioe);
            return;
        }
    };

    YModemSend.prototype.SendEOT = function () {
        try  {
            this._Connection.writeByte(this.EOT);
            this._Connection.flush();
        } catch (ioe) {
            this.HandleIOError(ioe);
            return;
        }
        this._EOTCount++;
    };

    YModemSend.prototype.SendHeaderBlock = function () {
        var i = 0;
        var Packet = new ByteArray();

        for (i = 0; i < this._File.name.length; i++) {
            Packet.writeByte(this._File.name.charCodeAt(i));
        }

        // Add null separator
        Packet.writeByte(0);

        // Add file size to packet (as string)
        var Size = this._File.size.toString();
        for (i = 0; i < Size.length; i++) {
            Packet.writeByte(Size.charCodeAt(i));
        }

        // Pad out the packet as necessary
        if (Packet.length < 128) {
            while (Packet.length < 128) {
                Packet.writeByte(0);
            }
        } else if (Packet.length === 128) {
            // Do nothing, we fit into 128 bytes exactly
            i = 0; // Make JSLint happy
        } else if (Packet.length < 1024) {
            while (Packet.length < 1024) {
                Packet.writeByte(0);
            }
        } else if (Packet.length === 1024) {
            // Do nothing, we fit into 1024 bytes exactly
            i = 0; // Make JSLint happy
        } else {
            // Shitty, we exceeded 1024 bytes!  What to do now?
            this.Cancel('Header packet exceeded 1024 bytes!');
            return;
        }

        try  {
            this._Connection.writeByte(Packet.length === 128 ? this.SOH : this.STX);
            this._Connection.writeByte(0);
            this._Connection.writeByte(255);
            this._Connection.writeBytes(Packet);
            this._Connection.writeShort(CRC.Calculate16(Packet));
            this._Connection.flush();
        } catch (ioe) {
            this.HandleIOError(ioe);
            return;
        }
    };

    YModemSend.prototype.Upload = function (file, fileCount) {
        var _this = this;
        this._FileCount = fileCount;

        // Add the file to the queue
        this._Files.push(file);

        // If the queue has just this one item, start the timers and listeners
        if (this._Files.length === fileCount) {
            // Create our main timer
            this._Timer = setInterval(function () {
                _this.OnTimer();
            }, 50);

            for (var i = 0; i < this._Files.length; i++) {
                this._TotalBytes += this._Files[i].size;
            }

            // Create the transfer dialog
            this._Blink = Crt.Blink;
            Crt.Blink = false;
            Crt.HideCursor();
            this.pnlMain = new CrtPanel(null, 10, 5, 60, 16, 0 /* Single */, Crt.WHITE, Crt.BLUE, 'YModem-G Send Status (Hit CTRL+X to abort)', 6 /* TopLeft */);
            this.lblFileCount = new CrtLabel(this.pnlMain, 2, 2, 56, 'Sending file 1 of ' + this._FileCount.toString(), 9 /* Left */, Crt.YELLOW, Crt.BLUE);
            this.lblFileName = new CrtLabel(this.pnlMain, 2, 4, 56, 'File Name: ' + this._Files[0].name, 9 /* Left */, Crt.YELLOW, Crt.BLUE);
            this.lblFileSize = new CrtLabel(this.pnlMain, 2, 5, 56, 'File Size: ' + StringUtils.AddCommas(this._Files[0].size) + ' bytes', 9 /* Left */, Crt.YELLOW, Crt.BLUE);
            this.lblFileSent = new CrtLabel(this.pnlMain, 2, 6, 56, 'File Sent: 0 bytes', 9 /* Left */, Crt.YELLOW, Crt.BLUE);
            this.pbFileSent = new CrtProgressBar(this.pnlMain, 2, 7, 56, 219 /* Continuous */);
            this.lblTotalSize = new CrtLabel(this.pnlMain, 2, 9, 56, 'Total Size: ' + StringUtils.AddCommas(this._TotalBytes) + ' bytes', 9 /* Left */, Crt.YELLOW, Crt.BLUE);
            this.lblTotalSent = new CrtLabel(this.pnlMain, 2, 10, 56, 'Total Sent: 0 bytes', 9 /* Left */, Crt.YELLOW, Crt.BLUE);
            this.pbTotalSent = new CrtProgressBar(this.pnlMain, 2, 11, 56, 219 /* Continuous */);
            this.pbTotalSent.Maximum = this._TotalBytes;
            this.lblStatus = new CrtLabel(this.pnlMain, 2, 13, 56, 'Status: Transferring file(s)', 9 /* Left */, Crt.WHITE, Crt.BLUE);
        }
    };
    return YModemSend;
})();
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
var YModemSendState;
(function (YModemSendState) {
    YModemSendState[YModemSendState["WaitingForHeaderRequest"] = 0] = "WaitingForHeaderRequest";
    YModemSendState[YModemSendState["WaitingForHeaderAck"] = 1] = "WaitingForHeaderAck";
    YModemSendState[YModemSendState["WaitingForFileRequest"] = 2] = "WaitingForFileRequest";
    YModemSendState[YModemSendState["SendingData"] = 3] = "SendingData";
    YModemSendState[YModemSendState["WaitingForFileAck"] = 4] = "WaitingForFileAck";
})(YModemSendState || (YModemSendState = {}));
//# sourceMappingURL=ftelnet.js.map
