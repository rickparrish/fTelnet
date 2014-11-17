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
        this._Connection = null;
        this._LastTimer = 0;

        // this._Parent;
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
            var Version = -1;
            var RE = new RegExp('MSIE ([0-9]{1,}[\\.0-9]{0,})');
            if (RE.exec(navigator.userAgent) !== null) {
                Version = parseFloat(RegExp.$1);
            }
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
            Crt.Canvas.addEventListener(Crt.SCREEN_SIZE_CHANGED, function () {
                _this.OnCrtScreenSizeChanged();
            }, false);

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
            Ansi.onesc5n = function () {
                _this.OnAnsiESC5n();
            };
            Ansi.onesc6n = function () {
                _this.OnAnsiESC6n();
            };
            Ansi.onesc255n = function () {
                _this.OnAnsiESC255n();
            };
            Ansi.onescQ = function (e) {
                _this.OnAnsiESCQ(e);
            };

            Ansi.Write(atob(this._SplashScreen));
        } else {
            console.log('fTelnet Error: Unable to init Crt');
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

        this._Connection.onclose = function () {
            _this.OnConnectionClose();
        };
        this._Connection.onconnect = function () {
            _this.OnConnectionConnect();
        };
        this._Connection.onioerror = function () {
            _this.OnConnectionIOError();
        };
        this._Connection.onsecurityerror = function () {
            _this.OnConnectionSecurityError();
        };

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

        this._Connection.onclose = function () {
        }; // Do nothing
        this._Connection.onconnect = function () {
        }; // Do nothing
        this._Connection.onioerror = function () {
        }; // Do nothing
        this._Connection.onsecurityerror = function () {
        }; // Do nothing
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
        this._YModemReceive.ontransfercomplete = function () {
            _this.OnDownloadComplete();
        };

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


    fTelnet.OnAnsiESC5n = function () {
        this._Connection.writeString('\x1B[0n');
    };

    fTelnet.OnAnsiESC6n = function () {
        this._Connection.writeString(Ansi.CursorPosition());
    };

    fTelnet.OnAnsiESC255n = function () {
        this._Connection.writeString(Ansi.CursorPosition(Crt.WindCols, Crt.WindRows));
    };

    fTelnet.OnAnsiESCQ = function (e) {
        Crt.SetFont(e.CodePage, e.Width, e.Height);
    };

    fTelnet.OnConnectionClose = function () {
        this.UpdateStatusBar(' Disconnected from ' + this._Hostname + ':' + this._Port);
    };

    fTelnet.OnConnectionConnect = function () {
        Crt.ClrScr();

        if (this._ProxyHostname === '') {
            this.UpdateStatusBar(' Connected to ' + this._Hostname + ':' + this._Port);
        } else {
            this.UpdateStatusBar(' Connected to ' + this._Hostname + ':' + this._Port + ' via proxy');
        }
    };

    fTelnet.OnConnectionIOError = function () {
        console.log('fTelnet.OnConnectionIOError');
    };

    fTelnet.OnConnectionSecurityError = function () {
        if (this._ProxyHostname === '') {
            this.UpdateStatusBar(' Unable to connect to ' + this._Hostname + ':' + this._Port);
        } else {
            this.UpdateStatusBar(' Unable to connect to ' + this._Hostname + ':' + this._Port + ' via proxy');
        }
    };

    fTelnet.OnCrtScreenSizeChanged = function () {
        // TODO Redraw status bar
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
                // if (DEBUG) console.log('fTelnet.OnTimer Data = ' + Data);
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
        this._YModemSend.ontransfercomplete = function () {
            _this.OnUploadComplete();
        };

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


    Object.defineProperty(fTelnet, "ServerName", {
        get: function () {
            return this._ServerName;
        },
        set: function (value) {
            this._ServerName = value;
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


    Object.defineProperty(fTelnet, "StatusBar", {
        get: function () {
            return this._StatusBar;
        },
        set: function (value) {
            this._StatusBar = value;
        },
        enumerable: true,
        configurable: true
    });


    fTelnet.UpdateStatusBar = function (text) {
        if (this._StatusBar) {
            while (text.length < this._ScreenColumns) {
                text += ' ';
            }
            Crt.FastWrite(text, 1, this._ScreenRows, new CharInfo(' ', 31), true);
        }
    };

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
    fTelnet._BitsPerSecond = 115200;
    fTelnet._Blink = true;
    fTelnet._CodePage = '437';
    fTelnet._ConnectionType = 'telnet';
    fTelnet._Enter = '\r';
    fTelnet._FontHeight = 16;
    fTelnet._FontWidth = 9;
    fTelnet._Hostname = 'bbs.ftelnet.ca';
    fTelnet._Port = 1123;
    fTelnet._ProxyHostname = '';
    fTelnet._ProxyPort = 1123;
    fTelnet._ProxyPortSecure = 11235;
    fTelnet._ScreenColumns = 80;
    fTelnet._ScreenRows = 25;
    fTelnet._ServerName = 'fTelnet / GameSrv Support Server';
    fTelnet._SplashScreen = 'G1swbRtbMkobWzA7MEgbWzE7NDQ7MzRt2sTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTEG1swOzQ0OzMwbb8bWzBtDQobWzE7NDQ7MzRtsyAgG1szN21XZWxjb21lISAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAbWzA7NDQ7MzBtsxtbMG0NChtbMTs0NDszNG3AG1swOzQ0OzMwbcTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTE2RtbMG0NCg0KG1sxbSAbWzBtIBtbMTs0NDszNG3axMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMQbWzA7NDQ7MzBtvxtbMG0NCiAgG1sxOzQ0OzM0bbMbWzA7MzRt29vb2xtbMzBt29vb29vb29vb29vb29vb29vb29vb2xtbMzRt29vb29vbG1s0NDszMG2zG1swbQ0KICAbWzE7NDQ7MzRtsxtbMDszNG3b29vbG1sxOzMwbdvb29vb29vb29vb29vb29vb29vb29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29vb2xtbMG3b29vb29vb29vb29sbWzFt29vb2xtbMzBt29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29vb2xtbMG3b29vb29vb29vbG1sxbdvb29sbWzBt29sbWzE7MzBt29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29vb2xtbMG3b29vb29vb2xtbMW3b29vbG1swbdvbG1sxbdvbG1szMG3b2xtbMDszMG3b2xtbMzRt29vb2xtbNDQ7MzBtsxtbMG0NCiAgG1sxOzQ0OzM0bbMbWzA7MzRt29vb2xtbMTszMG3b29vbG1swbdvb29vb2xtbMW3b29vbG1swbdvbG1sxbdvb29sbWzMwbdvbG1swOzMwbdvbG1szNG3b29vbG1s0NDszMG2zG1swbQ0KICAbWzE7NDQ7MzRtsxtbMDszNG3b29vbG1sxOzMwbdvb29sbWzBt29vb2xtbMW3b29vbG1swbdvbG1sxbdvb29vb2xtbMzBt29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzQwOzM3bQ0KICAbWzE7NDQ7MzRtsxtbMDszNG3b29vbG1sxOzMwbdvbG1swOzMwbdvbG1sxbdvb29vb29vb29vb29vb29vb2xtbMDszMG3b2xtbMzRt29vb2xtbNDQ7MzBtsxtbNDA7MzdtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29sbWzBt29vb29vb29vb29vb29vb29vb29sbWzMwbdvbG1szNG3b29vbG1s0NDszMG2zG1s0MDszN20NCiAgG1sxOzQ0OzM0bbMbWzA7MzBt29vb29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szNG3b2xtbNDQ7MzBtsxtbNDA7MzdtDQogIBtbMTs0NDszNG2zG1s0MDszMG3b2xtbMG3b29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szMG3b2xtbNDRtsxtbNDA7MzdtIBtbMzRtIBtbMTs0NzszN23axMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMQbWzMwbb8bWzBtDQogIBtbMTs0NDszNG2zG1swOzMwbdvbG1sxbdvb29vb29vb29vb29vb29sbWzA7MzBt29vb29vb29vb2xtbMW3b2xtbMDszMG3b2xtbNDRtsxtbNDA7MzdtIBtbMzRtIBtbMTs0NzszN22zICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAbWzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1s0MDszMG3b2xtbMG3b29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szMG3b2xtbNDRtsxtbMG0gG1szNG0gG1sxOzQ3OzM3bbMgICAbWzM0bUh0bWxUZXJtIC0tIFRlbG5ldCBmb3IgdGhlIFdlYiAgICAgG1szMG2zG1swbQ0KG1sxbSAbWzBtIBtbMTs0NDszNG2zG1swOzMwbdvbG1sxbdvb29vb29vb29vb29vb29vb29vb29vb2xtbMDszMG3b29vb29sbWzQ0bbMbWzBtIBtbMzRtIBtbMTs0NzszN22zICAgICAbWzA7NDc7MzRtV2ViIGJhc2VkIEJCUyB0ZXJtaW5hbCBjbGllbnQgICAgG1sxOzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvbG1szMG3b29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szNG3b2xtbNDQ7MzBtsxtbMG0gG1szNG0gG1sxOzQ3OzM3bbMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIBtbMzBtsxtbMG0NCiAgG1sxOzQ0OzM0bcAbWzA7NDQ7MzBtxMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTZG1swbSAbWzM0bSAbWzE7NDc7MzdtwBtbMzBtxMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTZG1swbQ0KDQobWzExQxtbMTszMm1Db3B5cmlnaHQgKEMpIDIwMDAtMjAxNCBSJk0gU29mdHdhcmUuICBBbGwgUmlnaHRzIFJlc2VydmVkDQobWzA7MzRtxMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExA==';
    fTelnet._StatusBar = true;
    return fTelnet;
})();
/// <reference path='source/fTelnet.ts' />
// TODO List:
// Events on various objects
// If an invalid font is specified, the default 437x9x16 should be used
// Incorporate Blob.js and FileSaver.js (and any other 3rd party .js) into ftelnet.js
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
                        this.onripdetect();
                        break;
                    case 1:
                        this.onripdisable();
                        break;
                    case 2:
                        this.onripenable();
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
                    console.log('Unhandled ESC sequence: Font Selection (set font ' + x + ' to ' + y + ')');
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
                        this.onesc5n();
                        break;
                    case 6:
                        this.onesc6n();
                        break;
                    case 255:
                        this.onesc255n();
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
                this.onescQ(new ESCQEvent(x.toString(10), y, z));
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
    Ansi.onesc5n = function () {
    };
    Ansi.onesc6n = function () {
    };
    Ansi.onesc255n = function () {
    };
    Ansi.onescQ = function (e) {
    };
    Ansi.onripdetect = function () {
    };
    Ansi.onripdisable = function () {
    };
    Ansi.onripenable = function () {
    };

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
var ESCQEvent = (function () {
    function ESCQEvent(codePage, width, height) {
        this.CodePage = codePage;
        this.Width = width;
        this.Height = height;
    }
    return ESCQEvent;
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
        // Init variables
        this._Atari = false;
        this._ATASCIIEscaped = false;
        this._Blink = true;
        this._BlinkHidden = false;

        // this._Buffer
        this._C64 = false;

        // this._Canvas
        // this._CanvasContext
        this._CharInfo = new CharInfo(' ', Crt.LIGHTGRAY);

        // this._Cursor
        this._FlushBeforeWritePETSCII = [0x05, 0x07, 0x08, 0x09, 0x0A, 0x0D, 0x0E, 0x11, 0x12, 0x13, 0x14, 0x1c, 0x1d, 0x1e, 0x1f, 0x81, 0x8d, 0x8e, 0x90, 0x91, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0x9b, 0x9c, 0x9d, 0x9e, 0x9f];
        this._Font = new CrtFont();
        this._Font.onchange = function () {
            _this.OnFontChanged();
        };
        this._InScrollBack = false;
        this._KeyBuf = [];
        this._LastChar = 0;
        this._LocalEcho = false;
        this._ScreenSize = new Point(80, 25);

        // this._ScrollBack
        this._ScrollBackPosition = -1;
        this._ScrollBackSize = 1000;

        // this._ScrollBackTemp
        // this._WindMin
        // this._WindMax
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

        // Replace the contents of the parent with the canvas
        parent.innerHTML = '';
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
        this._Cursor.onhide = function () {
            _this.OnBlinkHide();
        };
        this._Cursor.onshow = function () {
            _this.OnBlinkShow();
        };

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

            // Display footer showing we're in scrollback mode
            this.ScrollUpCustom(1, 1, this._ScreenSize.x, this._ScreenSize.y, 1, new CharInfo(' ', 31, false, false, false), false);
            this.FastWrite('SCROLLBACK (' + (this._ScrollBackPosition - (this._ScreenSize.y - 1) + 1) + '/' + (this._ScrollBackTemp.length - (this._ScreenSize.y - 1) + 1) + '): Use Up/Down or PgUp/PgDn to navigate and Esc when done', 1, this._ScreenSize.y, new CharInfo(' ', 31, false, false, false), false);
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
                    this.ScrollUpCustom(1, 1, this._ScreenSize.x, this._ScreenSize.y - 1, 1, new CharInfo(' ', 7, false, false, false), false);
                    this.FastWrite('SCROLLBACK (' + (this._ScrollBackPosition - (this._ScreenSize.y - 1) + 1) + '/' + (this._ScrollBackTemp.length - (this._ScreenSize.y - 1) + 1) + '): Use Up/Down or PgUp/PgDn to navigate and Esc when done ', 1, this._ScreenSize.y, new CharInfo(' ', 31), false);

                    YDest = this._ScreenSize.y - 1;
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
                for (i = 0; i < (this._ScreenSize.y - 1); i++) {
                    // TODO Not working
                    // TODO OnKeyDown(new KeyboardEvent('keydown', true, false, 0, Keyboard.DOWN));
                }
            } else if (ke.keyCode === 33 /* PAGE_UP */) {
                for (i = 0; i < (this._ScreenSize.y - 1); i++) {
                    // TODO Not working
                    // TODO OnKeyDown(new KeyboardEvent('keydown', true, false, 0, Keyboard.UP));
                }
            } else if (ke.keyCode === 38 /* UP */) {
                if (this._ScrollBackPosition > (this._ScreenSize.y - 1)) {
                    this._ScrollBackPosition -= 1;
                    this.ScrollDownCustom(1, 1, this._ScreenSize.x, this._ScreenSize.y - 1, 1, new CharInfo(' ', 7, false, false), false);
                    this.FastWrite('SCROLLBACK (' + (this._ScrollBackPosition - (this._ScreenSize.y - 1) + 1) + '/' + (this._ScrollBackTemp.length - (this._ScreenSize.y - 1) + 1) + '): Use Up/Down or PgUp/PgDn to navigate and Esc when done ', 1, this._ScreenSize.y, new CharInfo(' ', 31), false);

                    YDest = 1;
                    YSource = this._ScrollBackPosition - (this._ScreenSize.y - 1);
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
        // TODO Will the browser allow me to create a fake keyboard event?
        var KE = new KeyboardEvent();
        KE.altKey = alt;
        KE.charCode = pushedCharCode;
        KE.ctrlKey = ctrl;
        KE.keyCode = pushedKeyCode;
        KE.shiftKey = shift;

        // TODO Necessary? KE.preventDefault = function (): void { };
        this.OnKeyDown(KE);
        // this.OnKeyDown({
        //     altKey: alt,
        //     charCode: pushedCharCode,
        //     ctrlKey: ctrl,
        //     keyCode: pushedKeyCode,
        //     shiftKey: shift,
        //     preventDefault: function (): void { /* do nothing */ }
        // });
    };

    Crt.PushKeyPress = function (pushedCharCode, pushedKeyCode, ctrl, alt, shift) {
        // TODO Will the browser allow me to create a fake keyboard event?
        var KE = new KeyboardEvent();
        KE.altKey = alt;
        KE.charCode = pushedCharCode;
        KE.ctrlKey = ctrl;
        KE.keyCode = pushedKeyCode;
        KE.shiftKey = shift;

        // TODO Necessary? KE.preventDefault = function (): void { };
        this.OnKeyPress(KE);
        // this.OnKeyPress({
        //     altKey: alt,
        //     charCode: pushedCharCode,
        //     ctrlKey: ctrl,
        //     keyCode: pushedKeyCode,
        //     shiftKey: shift,
        //     preventDefault: function (): void { /* do nothing */ }
        // });
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
                console.log('Restoring: ' + buffer[Y][X].Ch + ' to ' + left + ':' + top);
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
        this._Font.Load(codePage, width, height);
    };

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
        // TODO Is the commented or uncommented code correct?
        // this._Canvas.dispatchEvent(this.SCREEN_SIZE_CHANGED);
        var evObj = document.createEvent('Events');
        evObj.initEvent(this.SCREEN_SIZE_CHANGED, true, false);
        this._Canvas.dispatchEvent(evObj);
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
                X += Buf.length;
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
    Crt.SCREEN_SIZE_CHANGED = 'SCREEN_SIZE_CHANGED';

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
        // Public events
        this.onhide = function () {
        };
        this.onshow = function () {
        };
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
                this.onhide();
                break;
            case 0 /* Show */:
                this.onshow();
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
var CrtFonts = [];

CrtFonts['437x9x16'] = 'data:image/png;base64,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';
CrtFonts['ASCIIx9x16'] = 'data:image/png;base64,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';

var CrtFont = (function () {
    function CrtFont() {
        // Public event
        this.onchange = function () {
        };
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
        if (typeof CrtFonts[codePage + 'x' + width + 'x' + height] !== 'undefined') {
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
                this._Lower.src = CrtFonts[this._NewCodePage + 'x' + this._NewSize.x + 'x' + this._NewSize.y];
                this._Upper = null;
            } else {
                // Load the lower font
                this._Lower = new Image();
                this._Lower.onload = function () {
                    _this.OnLoadLower();
                };
                this._Lower.src = CrtFonts['ASCIIx' + width + 'x' + height];
            }
        } else {
            console.log('fTelnet Error: Font CP=' + codePage + ', Width=' + width + ', Height=' + height + ' does not exist');
        }
    };

    CrtFont.prototype.OnLoadLower = function () {
        var _this = this;
        // Load the upper font
        this._Upper = new Image();
        this._Upper.onload = function () {
            _this.OnLoadUpper();
        };
        this._Upper.src = CrtFonts[this._NewCodePage + 'x' + this._NewSize.x + 'x' + this._NewSize.y];
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
        this.onchange();
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
// TODO
//CrtFonts['437x10x19'] = 'data:image/png;base64,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';
//CrtFonts['437x12x23'] = 'data:image/png;base64,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';
//CrtFonts['437x8x12'] = 'data:image/png;base64,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';
//CrtFonts['437x8x13'] = 'data:image/png;base64,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';
//CrtFonts['437x8x14'] = 'data:image/png;base64,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';
//CrtFonts['437x8x8'] = 'data:image/png;base64,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';
//CrtFonts['437x7x12'] = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA4AAAAAMCAIAAAC8zEQ+AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTFH80I3AAAIX0lEQVR4Xu2TWXbjSAwE+/6XnoEqU9kgFhJU2RpNu+NDLxFYSMv2L/DPE9ZP44OAMViP15ENlKKUJZg0WN95kIwCQGmwvrluhBJgzGDdwKEnQaI0VCooGygFbVo3WC9kFG5JEQxmDNanpwx4DxtXZw2ql6TKoTRYL6iO0ijlkHKxk6Ufol1/JEsLyP4T+CyGMl+7Rbk+v3lrfXIQlJOb6yXDB8EEX8qSd052ZnKzZP6gObduXj7IBjLsHWFvQXWEvQYOVXDCzbB+QlvBiSe0/zV8mwXVFZfDGDBY3+RycX/ghMd7L1hvg1Ph4HrCA9Z30bJCJ41QGjIKnQTBKHtZsvbiTWUFEYxKhU6CYFQqAEmUYI0cTAnGAJXbVegkCEalgghGpcItKbzRgEKXfVgdIu/5coky+FIK75UVRDZDysVSGp1/DZ3yN4MMjwslGMry4JxyfX7z1vrkICgnN9dLhg+CCb6UJe+c7MzkZsn8QXNu3bx8kA1k2DvC3oLqCHsNHEqoq1BKhEA5+SXgGqBykvWCKo2xGOO3kIE3PtzlfDF3S8N0Sh5blx5S4TWwbigjrOZv1LqNNhXezH/13Bco3/Pll8fi44f/pB8f72Ow7uHcwhtk4aWyD6tD5D8HvBLwxocvQaf8zVKW2ABmEID3yCGIcgbZfwKfxVDma7co1+c3b61PDoJycnO9ZPggmOBLWfLOyc5MbpbMHzTn1s3LB9lAhr0j7C2ojrDXwKGEugqvyS8nXFap0EkjlEDGt9Yg8QZZSCooe+CNUIJSGtmr9D7MgMfmcQYge+mDyOYEP6kc1h/nxgcj5bKkAkBpsF5Q/Q8l6+OYQbt3E5xLtWAAjMF6QXUlVSp8t/SU0oAHwaAEVE9or4ZZL6jSrg/KAMbwpXIOnQTZzMFiWO9kZxQ6mVHLzwQZ1kMJhrI8OKdcn9+8tT45CMrJzfWS4YNggi9lyTsnOzO5WTJ/0JxbNy8fZAMZ9o6wt6A6wl6Dn0HIBiFkIakAQgkghYwPQKUCcg7ICp00UBqsnRGSvuulR1LhnG4s+2yMbIxOeo8MaUgiKwCUgOoUP6YcpC8FPKAqKSckFTopvlAqK+xLMDEgeJUKlzKjVvgUYQbhw6WAEbRPgvRl5wO5FYxKhRek4X0OnTRCacCIEwmoksxB2VCpIGQUkEMwyi6y/wQ+izAgqJ7AZO9Ze4TKSWRIEORjyBEkMiQI8jH0BOaScnJzvaR7kJDRp5AEkiUnLaD1y0lxOblO/r6pMoNWCbp5Zu0RqkZm0NXMGo+gZfhcgvkAe0fYW1AdYa9BAz4oAxgjlEBSQQSjUuFEyhiSOSOIsnsuvckl8BmYkfShAwMeNp546bNnLjvC8OMxC9YLqgXVIhvgpXKQgmpBtaAqKSckFZQFpMF6QbUnfRaQ4q4EEwOCV6lwLgEMoHrOe2OskQcqFT5cek6kR9J31+z1BapFMCoVXpCe7GEM1smweJJNwA+U2YcyGyoVhIxCRt4PBBl2w6SgcniJGQM5SAApsgHBoyyHz6UFD6TwBgOAysHGTbj8FetMT2DW1AMvA6Wcs7keeLxrgr0j7B0pW5CGzyLLtVTgW5gMsLegcrDRw7kj7C2ojrDXoAGEtfHAS4SQhaQCCKUho9BJEIwvlXO4K73xpRFaCB5JBWUPvBFKkX02RjZGkGvvgDzCJdgCVItsQCkn4CCgKtGEwqX0SCp8ofRsSpBb2YDgUYpLiSxg0AJBPoYWKhU+UxoogTfIgdDyZeeBjIIIRqXCjjTgh2hFARmho5zMEsGXykBGoZT49EHklgVk/wl8FmFAUD2BCT5ICwLGYH1nvZQAsoQTCypHKeds3uzWhYw+xer/RjK3Ovzk2n59vWSdjLB3RC19XrL2CFUlEVSCIC1k0OrwA5i/C5ePsNc/XV2FS+mRVAhZSCp0EgTjS+UcXpAeL5V98EgqnFOOldLIvhtj6lmXHiBDnqDhEzRwOdmxHkKoSjShcCmRFZAVvlsiKwwl8C2QDQhepcKl9MCEVidRKnyTNFAarG+uA5mya8B7JDWAYHgPZBREMCoVXpM+IwjfFV76gIzQkQfW9kHCAG+QhSQC8L5DXT8WZLgQSjCUJwe7Yc98vZT7bB4s1+c3h+swk7Obk5vrt8i7b7vZPSibDj9p+QW4fIS909fQgMa8QQhZSCrsS1CaHJAVgCRKY/XbSR+MNUKoKqmscJfzxdAtJzvpPTKkAbkPTn3hwZb12g9YL6gWVC9NGlQvSdYLqm1pZGNAGqwX3vhwLgWkodIHleAx5wxKQHVHGlSNNDpjsF5QHSWQxIAHHgTjy84LSEB1JVkvqBbe+HCS52DLYL0MU0MeWAcesHZIdgND/B0EI0sLyP4T+CyGMl8zSmnsrJdyn82D5fr85nAdZnJ2c3Jz/RZ59203uwdl0+EnLb8Al4+wN34NwJ0F1VOyeCKpoCwgDdaNUQChBFnCGKzdjAJAabBumMwATSooezoJj9DhB8rhTs6Hd+ge9PW86TF3+MBX+sNYf10f9CV/2vv8EPSd+y8/yPB7CSUYypOD3bBnvl7KfTYPluvzm8N1mMnZzcnN9Vvk3bfd7B6UTYeftPwCXD7C3vg1wAsrr3HrQRgGVN/Ad9/34FniRBpl9vIP5wN/1B/07b8d+27/fr0/Df3G868+tywg+0/gsxjKfM0opbGzXsp9Ng+W6/Obw3WYydnNyc31W+Tdt93sHpRNh5+0/AJcPsLe+DXezCe/26cRvqgf9NV94I/6ga/0l7/8kegfzf/HBRn+GUMJhvLkYDfsma+Xcp/Ng+X6/OZwHWZydnNyc/0WefdtN7sHZdPhJy2/AJePsDd+jb98LD/ul/jr178HIIlVZ29UfQAAAABJRU5ErkJggg==';
//CrtFonts['437x6x8'] = 'data:image/png;base64,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';
//CrtFonts.ASCIIx10x19 = 'data:image/png;base64,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';
//CrtFonts.ASCIIx12x23 = 'data:image/png;base64,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';
//CrtFonts.ASCIIx8x12 = 'data:image/png;base64,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';
//CrtFonts.ASCIIx8x13 = 'data:image/png;base64,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';
//CrtFonts.ASCIIx8x14 = 'data:image/png;base64,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';
//CrtFonts.ASCIIx8x8 = 'data:image/png;base64,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';
//CrtFonts.ASCIIx7x12 = 'data:image/png;base64,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';
//CrtFonts.ASCIIx6x8 = 'data:image/png;base64,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';
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
// TODO
//CrtFonts.BStrictx8x8 = 'data:image/png;base64,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';
//CrtFonts.BStructx8x8 = 'data:image/png;base64,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';
//CrtFonts.MicroKnightx8x8 = 'data:image/png;base64,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';
//CrtFonts.MoSoulx8x8 = 'data:image/png;base64,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';
//CrtFonts.PotNoodlex8x11 = 'data:image/png;base64,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';
//CrtFonts.Topazx8x11 = 'data:image/png;base64,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';
//CrtFonts.TopazPlusx8x11 = 'data:image/png;base64,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';
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
CrtFonts['ATASCII-Arabic-HalfWidthx8x16'] = 'data:image/png;base64,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';
CrtFonts['ATASCII-Arabicx16x16'] = 'data:image/png;base64,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';
CrtFonts['ATASCII-Graphics-HalfWidthx8x16'] = 'data:image/png;base64,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';
CrtFonts['ATASCII-Graphicsx16x16'] = 'data:image/png;base64,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';
CrtFonts['ATASCII-International-HalfWidthx8x16'] = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAACAAAAAAQCAMAAAC1QG/+AAAABGdBTUEAALGPC/xhBQAAAwBQTFRFAAAA////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZ3bsYwAAAQB0Uk5T////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AFP3ByUAAAAJcEhZcwAADsIAAA7CARUoSoAAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjbQg61aAAAMC0lEQVR4Xu1ci3IbOQxL//+j7+IVQQAktfY00+ZRdSaxVyuJFB8gqPbu7e3t7dev91/x+/pcAzlyPbw/tXn5Yn3xP7HPY1HZLx6xOt5zf8jBvFk/zG/a1uWTcs/HqLepuwzxfPmXmqEKfzvl/7glf6ZF9vH7FuEbWb8m4vf1uQbwcX3XpMIzX8Q3+4h9VnbbfvHIbTKnJgzY6QdMatoqVE2KvTZGvU3dZYjXtvgys1Thb6f8H7fiz7TIPn4f9f1KtMev/1jopdweAgDzdR50CMAfr8h/WcAhAIcA9CpzCMAfr7xfRMA/TwBao72p/8NVgdRHdBzS8fcrAblYqPPq+t7B5EXAprlxIOeTn+9qTOLyoV1ZXOTef9i85E1FuzJBLwVzpKZPSll2E2IX3LSw7Vri8jm6pPqcNzTjXYwM0hza1cXJs1fLNkqbMm0Tq11E325D7H7RTr/xKd0ltjX529iQ/TintKtwdjSxD1Xu3DLRgTLGndJqThQttm3273Cb3yMoNUnoH8uHSzv24tfT5gIAM32+ztbMmUvq8g1+1860Zx/ny7pNbXYg51PRFw3QFTv6x/VKIZmboUEaaM7Jm86rmSSbiUgCzYWAqDRAPsfNR33O+5y94dXNnvsiP46b70Mcbo3yk5fEGu0UUWMhzproqpgpt8vY1uRPcVH34xzVmE7G6CMA75iHR5GbLNYlGmt0Mo8ciT5+YTRpdHcC9wHzhnaRUz1uAAwQbv4GADN9vt7AK1Dv6xB8S8laOCvYb/TjJinIgZJPRd9DAIgtlt3EBLkc1ty0YnEIAMyIAPSIy6dDABI3C9Gwv2PYgvxMUFitEwsPAdhUttkwXieFmEV9E6KxCp2SXAxUxD8EoJFbowvPC/cz/vbqDpWIKug7AaB3rWZj0k1nWRHQaz723eyvsFno3mv71P1TjpNb6h9BLP2ft4JGTGBnpUfYID/Blkc2nis7FYqRa5/kz5FTwqdNXk3BHWmqhIm0jQab1vLmoUFx6ukQQPdXNhZnKOsu5h0/O7j3cQ2wSgyxeSeMSkmVZNKCk9/1/PAr5oWs5nfxVXNyJaDUMx2d27J7C6wGOFvx6zYDW3cbuJ/V/0O8CutzaGkxvUOeXYPSCsy8gQLVWMB2+9TxYjN5TKNeGogQl0dO8f4t4QnHu8bWBmU/znC2/LRzuybk+WNb2sPliR5pyCmL1o4oQ/ysBaCuZUfeMi317LtqVPO8sXdZdxk1fqZs7mN6jvGs4RR9FybND9dK/ZcQb7eOOT8DKCxaczKSaR/+vj91TEeHfeSZ0OVYk1WiZPpw/upnxIPmA+z6vu37DcCmQMskYtlUy3ZviUO36wmiAYxVxm6fOp7nIKY5kMOmFHAIgIRl5kZLtVLItSxrWHvJu5D2im2WkoDfTTj3FD8EQMF8sE8Y+RCAwA4pfIcAOBE4BKAQNaNRjJ9/jwAESCsX1c4mYX0ouErCF5s1njMCvbHkm/l1P+Wa1jlbkSGbksIjmnV2LHTA9E8bFGIBvbK01boXzCkJVAioz1h/YXhKTlrJUylpZfMBU5PABfhpydXdhFfRNEtKsGX4bqmjk2YWSUgp+offfTTyTbqTidN3QiJ2qvGEf1DQGJ9RFAlg2MMZ6eBAOT/aA4uH7NsiniIRYOOYC8bJBn8s2Hs7PCFAdn7J2dEeCA/y/etblky1vEQCr+k12SUmtdCuYUSL05IcL/vs5qPRHmnhIAeytZMtZ5Vex9EBuan6N33rBQCfUUqYNO/fNDtcD51+2ShBCzlCr2hhWtMihvO4GVz5omBcVjTI9SsCyDfkDvu6PQg1QIzJvlyD+YZ8aZf77Oe5iT0tntadTI3LegOS589cZUxn9DMCYEZZJlWKDqj2ghfFZhSIZZex57yYxu/i8rGVnl/yiI6S8/FcjI/3b9d/BVBUkn+oVYGwJW8NCjPLIQByxWBpIJX5EIA5JYjWJBIldQ4BEGZ2CEAYI8mYZpzXS1bqLIpZ8joaknUHngqJlUopDnisOATgEAAlctEcfEECkCwhOcSmg/PUyCQqHda+U7rnPq3TEnI39xTBPy0rVQb4KUmi70P+ah0jPJX0Kk7Kfs4XegNpjAgd4fhJMp8nLXpcM6JpbESN5FfhbJJEBX3/LKyBYt0/lRziOT5tHbUgF63z47qhyFv02HpH8UE9p/eYQeaFUOXVhd1hUJMUlqbSrqrG+F08bfIhz8IuE7z5cdJX+D/YOtq9TtLB4nlXw/rjhIn2Y75kcbIkZubqGvYLrnnmkqiiHSN1f+XEvbMSbiNtiO6VlX5V6CFDtARNsZ+ql07QzoEaH5OjtpM5cBPm/rCfUg19vcgCCQoxag3n65Y1XKU+anJKv1sxcJ1n9pHaocqo60Tv0pgvjR7z47qjyIP7GMHBsMwuMzppkaCDUqL5Qaxsjs91zQ5+fmSx2x167c7vcfzaDQBKmhOI6iOgRI2D3TPzBfZ53z/+DYDxktpYMXU8/STnBIAJIzV8dmEWcJPOIvwQOCcYIqAFqPfCEvdD8z6xvhYCKT4G4TyuL8Qkql0NkxLsC+vOIQCHABgEHwLAgtgLtxQKvRM/BKCVei+EoAZeyg8B+McJQOd+LNwKRJ1/3BOA13j/nhQ4DcCTz993Rngjnyjbei0/l2byhfdDgI2N/EubkAAjwpPRB5G0xvWtjbReZiZS2MB4sxAxSlgzhfVNPESuNZtPYv0eilV/sVNfd9kz+hohnWEPzE9KNe0bzdK1yfqphBHHK9vwaqB4nVImH+uYWWBDWCUmLUEequI6x+VcvFXaF6p3d34JTFvPuMiAR7ylIDnHcCXJE2gnUqNinSE4t3y5p/nVwvtn7O/lqlluq3/qRz2jNUIhXAG0+ZNBBAzs54+VnlupT5OfgqQTlZal2pPyNihnEaOeqBbDTUKClR1ZkCFQqfnkmnLnBz2R2Kmvu9hGv3GIMMJ8iBpvAJArD2XXj0dKLiYdqoFaXE7tJx/rmBGqxNoaqWk/k/tQFdc5LicCSPZzqub6JVYwMDFhbZRSASq5PgXJOf4bLn9YcCBjuiRah4iYkS+vp3g1dzWLwl9Ka51Sl+fAJ3rGhgKwpRTIY/oAIDgVB/VBGL8VJGqemHIIQIHtCKPLPxcsh6nuCuAhABHnDPdV4DMtDwFogH2Z5BAArYAomCSFhwCQVHTC6RWW70mRvhkBsE5iAbPxvV5AF85IJwbg4Xi2nMJuWEn363frTF5o1IFP+LQssF77Gs9K7PU/645xO5w/sXVhiHOFEDfzCd9X93OCBeJVgD0XuN3lWGlPJrExM1OX2milKDy3+BePCO3U2wq5662pkevCdFGotF5l5Ze5qaDKpznIFpwoaGAorFWnKbWLOG3dIscR70roFB74vhDZNEvRV8eF8EBLaLc0ED2EeJt8SQsf7x4Pq0iQRGwt+koWEYdKXappsSxUVBuhO7jtWOp67FP3E7kJzpriso7gzQlGBJ78nwBRHHUf8IZ0BapmwTQtrEIzykVDQCcFYVu3uyedYaa6ZcJiP6+WplqmzO+RzRFrgmkwvxZGdn+KCsQoZgHCbMFz9V+aUt6lQcK+Kh8niDnDDYAGBi1Bc0pmYZMUIJg4xZfos5YIyomAabzpm/b1SIE9iLGR/FIsoEZDbcmnGr/Q9zElrPL44L8BABFY71WNjVHCaDBxJr8mBYArjePBlbhWC39dZwVJkK7uKy6JNLOkEuC7VgbuCvxyhGEduYedlgVlqQa97xjyRjmkIWu9J63YCRUHQcpPbJ/g4PIa8EcIQUfxay3kZm9ij6a6xEukgQRE2ErjKA6ZKUMCSfPPBdXl0xxLSPNT5neHLXcaA5XJFn7Q5Nd4HiyY8ilOYIF+fHp+sZmG9doBAbLeQA2zl6SFj7c4iNCL0oHD59kOAVBwz4IDVFzAQdQWrJJBe+/jhwBogT8E4LMJwFSzdMyK3bPJP+e9FbuPHOuz7PdZcj9iq2+0NnlG1VmIwCvHUTd9xGV7sbe7zjVLR63YPZ/+U2awg/rgiT7Lfp8l94Pm+i7L2TQUjZO9v3YSddNHXLYXe7vr+v8A3P75CCo92/sLvz8E4As75wuodgjAawD3XWcdAvBdPfd39P4pBOB/ROlP8RUQAnwAAAAASUVORK5CYII=';
CrtFonts['ATASCII-Internationalx16x16'] = 'data:image/png;base64,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';
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
CrtFonts['PETSCII-Lowerx16x16'] = 'data:image/png;base64,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';
CrtFonts['PETSCII-Upperx16x16'] = 'data:image/png;base64,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';
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
// TODO
//CrtFonts['737x12x23'] = 'data:image/png;base64,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';
//CrtFonts['737x9x16'] = 'data:image/png;base64,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';
//CrtFonts['775x9x16'] = 'data:image/png;base64,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';
//CrtFonts['850x10x19'] = 'data:image/png;base64,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';
//CrtFonts['850x12x23'] = 'data:image/png;base64,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';
//CrtFonts['850x8x13'] = 'data:image/png;base64,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';
//CrtFonts['850x9x16'] = 'data:image/png;base64,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';
//CrtFonts['852x10x19'] = 'data:image/png;base64,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';
//CrtFonts['852x12x23'] = 'data:image/png;base64,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';
//CrtFonts['852x9x16'] = 'data:image/png;base64,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';
//CrtFonts['855x9x16'] = 'data:image/png;base64,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';
//CrtFonts['857x9x16'] = 'data:image/png;base64,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';
//CrtFonts['860x9x16'] = 'data:image/png;base64,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';
//CrtFonts['861x9x16'] = 'data:image/png;base64,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';
//CrtFonts['862x10x19'] = 'data:image/png;base64,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';
//CrtFonts['863x9x16'] = 'data:image/png;base64,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';
//CrtFonts['865x10x19'] = 'data:image/png;base64,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';
//CrtFonts['865x12x23'] = 'data:image/png;base64,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';
//CrtFonts['865x8x13'] = 'data:image/png;base64,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';
//CrtFonts['865x9x16'] = 'data:image/png;base64,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';
//CrtFonts['866x9x16'] = 'data:image/png;base64,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';
//CrtFonts['869x9x16'] = 'data:image/png;base64,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';
//CrtFonts.ASCIIx10x19 = 'data:image/png;base64,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';
//CrtFonts.ASCIIx12x23 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABgAAAAAXCAMAAAD6M3RAAAAAAXNSR0IArs4c6QAAAwBQTFRFAAAA////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZ3bsYwAAAAFiS0dEAIgFHUgAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAHdElNRQfaCBcNNxuQdUuFAAAHI0lEQVR42u2diZbbIAxFpf//6W6TBNB7QsLYcVJx2pwZ17Exy7towRU5uWhTIserVKlSpcqXlALAKY1abVClSpUCQAGgSpUqVbbK9fiz6PPDEyMgTCsA6I6NZ+jigz1q1z9WjECTZzxH2//+pNM2l+7B8CnDRTdXldzYbee+L8YLKRiHmf6KjnN0TQVT4fEb+epPT9l/adqj/bIZ6e2pXV3UjARTCTaeyXHt64yv39acf443QCNsvbfcLyqbF1BMcvc6f0mqZ2l3shWdmqkZKdpejAniIQB0U6afBEzY2D2x8D3H9u+/YHIGRf/tALCN+ToTK/1J1Qfy0WGBiJcMiscx5YpU2kaygwhdcxzk5HOQ4+iZhN3gu/F2CNSqOd7+PQgAEdy1zjzaZubSKYsIMP/NO+dD7Pf54i9AIQYAq9VstX7MAjCjD+BAp4zr1qARAMwWE7NnzHcSdX4NVe5GaIPHZhmGZvolAMAKoFjhcMdMRuo6AKZIZ9d8Dg3YrOqINZuBcQDYp2vtA80JPRkWYubWbgAIHwBsORoyc1c6uABg2r8x2dYBwMSRuXOiANApAP48wczsA2Z7HgDY/L8UAH+fVIUA4OGUIwDgmr9t+EEF0AgAYPuzNfsKAIJCQ0STHhE5EwBsddX4bu4EAPx4HgAauL4PAJHLfScAWvlnfaHtn3/nXAiAH3V3APAQP3MhKKHa8AIDgPfFHQDAYhidj0uJJyY9urPPhVw9/gLQqt1BAKStHFS3hGvlVACgBvyZf486QNfN2QBoJyB/6MCCIzJA2bQj8RjBYZeHKDyrC5XLBi7Mw2j/7CTWMh5v+ovGZuhQIgBGfWTUM+4Cou7lkAXABBFq2ij0Js6no7obANhlfFtZ40UidYMAEB5TDKlLjgtddykL2qg4fjQAwQnUfU/7OthiAGDSGQGAPwFi8us1xRDSXAVAt1JZBgDsiNbd1w7cLABcTZ4BAHpSyZUWl9PwGxhF/LipTefs8J09xHwelr1B0Nr7+vGSVQDQHrgSAB0iEZEG4W+EeHRGUa+/9LXqbRUZ7zoBQLc4iGbaOABQ3725BwCmndnyKWffHoltqAKRcgGpPJMEGkVo9RdJHB5XA+pzwvhXYKYN5wZbqRh4TwAgAQAE62nTlci6yBEXapPg1uSak7eYfRccj0NQAEgIALh9Rm9BBgChJdgMALErq0dg9b23WQCQWUvcRL1Etmk+OhybB117n47O0zrJancPAFz1GrxqVvQ9pfcBwBaMWQsgUH9Hb0MA4C4XksUErgMGa9477KxZn+N7twWArrlgAYztpsI9MhHpPAaAkNX1iQAgmcw3AID1WHtjJTQf0gBgQh8IFA8A6JbyvcdsnsIyXELsQkeSADjiAgoBoI9gbAMAG/Q6yX/cZgHglM3JmMwAAIpUqKoxPAz2JsjlPx4DSKWBOg0YiVUQ6fQd9jEAqGOfzN0+qXHlu1yEWZBbACDnAUCIEegAoB8RAXfrLgCoqrbOFuv2iVkAYj08DgBiOYz6yot5fSZjAGCtfKILyIFEJiXOtK0d0ANuz44BRADA0i6xX2YbAExUCmoWAcDWIHBuHwDMAroBANgwcdb5qwDwPf5+8x91AZ1pAbChfBAAPN3ziAXwUNnXut76/SMxACiRvQvoCYAg2caUbEVr+DwADmwEm02MTQDgFgAe80ELIOM6cfzsvn8hOkYXAHAkC2hMTnk/ALjr4BIADBI2pOrOutdL/v8MAJwZA4gAgLU/dwE5lv12F1AoLVK9NH0QBH5BweaSz4LAYtKKUNCDq+kmAEyVFG9OzJeGniMAlHlWcgBYCwFPfffvAEDSupKpgC5uBPOfKyDZKwDQVQB0ExF6wr4bAPgZrwNAfysYp6TZuOcDILYzNrAT2Oi2uhaAQYG2sVUVbycw3AfQtTTfDZBKdeV+zC4InJVWAoBxkje7J2YBW1nJyvMc6GCKhl4FkUjxnO40ClOO7Y+ZAyCRcCmuWEREinw3DACNv47CfQ0GvgmHh+8i3AEAN0XyOADi11kMApN9MMjVgzO7dqWBznQPuSwim7/WN4KxGIDdJ2xoxbNZlW0hMEsd2QmAbWvrYKBMu4zEWRBgPwDEbtgBAVUbqbHPgj1kbLOPW+VELNzEHcUku0VfBje2CUnZBPdVGCOJvgwOjQ0F0VIzqciL8DgAbFfjHeA4uiqhse1vpBo2eTkbwWg7ACXE5ziQ9jajuf1iG3G0ClH7C4+5Wn2cvn1j6T3MPDNnx05g/kZJYJ9khlNu7GHg8UToN5XVTVvBb9bbpj+5VO/FG2KXd/baDpjd4PR3TQT2bmcBcL+58Ka3gd5gjpeCFAG+vx10V1PdDwA364X6D2FqilepcuHc14C6O3tAbw6Az5r9BYAqVaq8Q3UC5+y5lX9gu5h+Be0LAFWqVKnyn5p7BYAqVapUeW/5BbeGFv8hu4nLAAAAAElFTkSuQmCC';
//CrtFonts.ASCIIx8x12 = 'data:image/png;base64,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';
//CrtFonts.ASCIIx8x13 = 'data:image/png;base64,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';
//CrtFonts.ASCIIx7x12 = 'data:image/png;base64,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';
//CrtFonts.ASCIIx6x8 = 'data:image/png;base64,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';
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
        // Public events
        this.onclose = function () {
        };
        this.onconnect = function () {
        };
        this.onioerror = function () {
        };
        this.onsecurityerror = function () {
        };
        // Private variables
        this._WasConnected = false;
        // TODO Protected variables
        this._InputBuffer = null;
        this._OutputBuffer = null;
        this._Protocol = 'plain';
        this._WebSocket = null;
        this._InputBuffer = new ByteArray();
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
                return (this._WebSocket.readyState === this._WebSocket.OPEN);
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

    WebSocketConnection.prototype.NegotiateInbound = function (data) {
        while (data.bytesAvailable) {
            var B = data.readUnsignedByte();
            this._InputBuffer.writeByte(B);
        }
    };

    WebSocketConnection.prototype.OnSocketClose = function () {
        if (this._WasConnected) {
            this.onclose();
        } else {
            this.onsecurityerror();
        }
        this._WasConnected = false;
    };

    WebSocketConnection.prototype.OnSocketError = function (e) {
        this.onioerror(e);
    };

    WebSocketConnection.prototype.OnSocketOpen = function () {
        if (this._WebSocket.protocol) {
            this._Protocol = this._WebSocket.protocol;
        } else {
            this._Protocol = 'plain';
        }

        this._WasConnected = true;
        this.onconnect();
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
            var decoded = Base64.decode(e.data, 0);
            for (i = 0; i < decoded.length; i++) {
                Data.writeByte(decoded[i]);
            }
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
        if (this._Protocol === 'binary') {
            this._WebSocket.send(new Uint8Array(data).buffer);
        } else if (this._Protocol === 'base64') {
            this._WebSocket.send(Base64.encode(data));
        } else {
            var ToSendString = '';

            for (var i = 0; i < data.length; i++) {
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

        this._LocalEcho = false;
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
                this._LocalEcho = true;
                this.SendWill(1 /* Echo */);

                break;
            case 254 /* Dont */:
                this._LocalEcho = false;
                this.SendWont(1 /* Echo */);

                break;
            case 251 /* Will */:
                this._LocalEcho = false;
                this.SendDo(1 /* Echo */);

                break;
            case 252 /* Wont */:
                this._LocalEcho = true;
                this.SendDont(1 /* Echo */);

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
        // Public events
        this.ontransfercomplete = function () {
        };
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

        this.ontransfercomplete();
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
        // Public events
        this.ontransfercomplete = function () {
        };
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

        this.ontransfercomplete();
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
/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// From: http://hg.mozilla.org/mozilla-central/raw-file/ec10630b1a54/js/src/devtools/jint/sunspider/string-base64.js
/*jslint white: false, bitwise: false, plusplus: false */
/*global console */
var Base64 = {
    /* Convert data (an array of integers) to a Base64 string. */
    toBase64Table: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split(''),
    base64Pad: '=',
    encode: function (data) {
        'use strict';
        var result = '';
        var toBase64Table = Base64.toBase64Table;
        var base64Pad = Base64.base64Pad;
        var length = data.length;
        var i;

        for (i = 0; i < (length - 2); i += 3) {
            result += toBase64Table[data[i] >> 2];
            result += toBase64Table[((data[i] & 0x03) << 4) + (data[i + 1] >> 4)];
            result += toBase64Table[((data[i + 1] & 0x0f) << 2) + (data[i + 2] >> 6)];
            result += toBase64Table[data[i + 2] & 0x3f];
        }

        /* END LOOP */
        // Convert the remaining 1 or 2 bytes, pad out to 4 characters.
        if (length % 3) {
            i = length - (length % 3);
            result += toBase64Table[data[i] >> 2];
            if ((length % 3) === 2) {
                result += toBase64Table[((data[i] & 0x03) << 4) + (data[i + 1] >> 4)];
                result += toBase64Table[(data[i + 1] & 0x0f) << 2];
                result += base64Pad;
            } else {
                result += toBase64Table[(data[i] & 0x03) << 4];
                result += base64Pad + base64Pad;
            }
        }

        return result;
    },
    /* Convert Base64 data to a string */
    toBinaryTable: [
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
        52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, 0, -1, -1,
        -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
        15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
        -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
        41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1
    ],
    decode: function (data, offset) {
        'use strict';
        offset = typeof (offset) !== 'undefined' ? offset : 0;
        var toBinaryTable = Base64.toBinaryTable;
        var base64Pad = Base64.base64Pad;
        var result, result_length, idx, i, c, padding;
        var leftbits = 0;
        var leftdata = 0;
        var data_length = data.indexOf('=') - offset;

        if (data_length < 0) {
            data_length = data.length - offset;
        }

        /* Every four characters is 3 resulting numbers */
        result_length = (data_length >> 2) * 3 + Math.floor((data_length % 4) / 1.5);
        result = new Array(result_length);

        for (idx = 0, i = offset; i < data.length; i++) {
            c = toBinaryTable[data.charCodeAt(i) & 0x7f];
            padding = (data.charAt(i) === base64Pad);

            // Skip illegal characters and whitespace
            if (c === -1) {
                console.error('Illegal character code ' + data.charCodeAt(i) + ' at position ' + i);
            } else {
                // Collect data into leftdata, update bitcount
                leftdata = (leftdata << 6) | c;
                leftbits += 6;

                // If we have 8 or more bits, append 8 bits to the result
                if (leftbits >= 8) {
                    leftbits -= 8;

                    // Append if not padding.
                    if (!padding) {
                        result[idx++] = (leftdata >> leftbits) & 0xff;
                    }
                    leftdata &= (1 << leftbits) - 1;
                }
            }
        }

        /* END LOOP */
        // If there are any bits left, the base64 string was corrupted
        if (leftbits) {
            throw {
                name: 'Base64-Error',
                message: 'Corrupted base64 string'
            };
        }

        return result;
    }
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
var YModemSendState;
(function (YModemSendState) {
    YModemSendState[YModemSendState["WaitingForHeaderRequest"] = 0] = "WaitingForHeaderRequest";
    YModemSendState[YModemSendState["WaitingForHeaderAck"] = 1] = "WaitingForHeaderAck";
    YModemSendState[YModemSendState["WaitingForFileRequest"] = 2] = "WaitingForFileRequest";
    YModemSendState[YModemSendState["SendingData"] = 3] = "SendingData";
    YModemSendState[YModemSendState["WaitingForFileAck"] = 4] = "WaitingForFileAck";
})(YModemSendState || (YModemSendState = {}));
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
//# sourceMappingURL=ftelnet.js.map
