class VirtualKeyboard {
    // Private variables
    private static _AltPressed: boolean = false;
    private static _CapsLockEnabled: boolean = false;
    private static _CtrlPressed: boolean = false;
    private static _Div: HTMLDivElement = null;
    private static _ShiftPressed: boolean = false;
    private static _Visible: boolean = true;

    private static _ClassKeys: any = {
        '27': 'Escape',
        '36': 'HomeEndInsertDelete',
        '35': 'HomeEndInsertDelete',
        '45': 'HomeEndInsertDelete',
        '46': 'HomeEndInsertDelete',
        '8': 'Backspace',
        '9': 'Tab',
        '220': 'Backslash',
        '20': 'CapsLock',
        '13': 'Enter',
        '1004': 'ShiftLeft',
        '38': 'ArrowUp',
        '17': 'Ctrl',
        '18': 'Alt',
        '32': 'Spacebar',
        '37': 'ArrowLeft',
        '40': 'ArrowDown',
        '39': 'ArrowRight'
    };

    private static _Keys: any[] = [];

    public static Init(container: HTMLElement): void {
        container.appendChild(this.CreateDivElement());

        // Handle click events for all keys
        var Keys: NodeList = document.getElementsByClassName('fTelnetKeyboardKey');
        for (var i: number = 0; i < Keys.length; i++) {
            if (Keys[i].addEventListener) {  // all browsers except IE before version 9
                var KeyCode: string = (<HTMLDivElement>Keys[i]).getAttribute('data-keycode');
                if (this._Keys[KeyCode][2] > 0) { // [2] is the CharCodeShifted, which only a non-special key has
                    // Regular character
                    Keys[i].addEventListener('click', VirtualKeyboard.OnCharCode, false);
                    Keys[i].addEventListener('touchend', VirtualKeyboard.OnCharCode, false);
                    Keys[i].addEventListener('touchstart', VirtualKeyboard.OnTouchStart, false);
                } else {
                    // Special character
                    Keys[i].addEventListener('click', VirtualKeyboard.OnKeyCode, false);
                    Keys[i].addEventListener('touchend', VirtualKeyboard.OnKeyCode, false);
                    Keys[i].addEventListener('touchstart', VirtualKeyboard.OnTouchStart, false);
                }
            }
        }
    }

    private static CreateDivElement(): HTMLDivElement {
        // Rows[Row][Key][0] = KeyCode
        // Rows[Row][Key][1] = Label
        // Rows[Row][Key][2] = CharCodeShifted (ie shift is pressed)
        // Rows[Row][Key][3] = CharCodeNormal (ie shift is not pressed)
        var Rows: any[] = [
            [
                [27, 'Esc', 0, 0],
                [112, 'F1', 0, 0],
                [113, 'F2', 0, 0],
                [114, 'F3', 0, 0],
                [115, 'F4', 0, 0],
                [116, 'F5', 0, 0],
                [117, 'F6', 0, 0],
                [118, 'F7', 0, 0],
                [119, 'F8', 0, 0],
                [120, 'F9', 0, 0],
                [121, 'F10', 0, 0],
                [122, 'F11', 0, 0],
                [123, 'F12', 0, 0],
                [36, 'Home', 0, 0],
                [35, 'End', 0, 0],
                [45, 'Ins', 0, 0],
                [46, 'Del', 0, 0]
            ],
            [
                [192, '~<br />`', 126, 96], //    [27, 'Esc', 0, 0],
                [49, '!<br />1', 33, 49],   //    [112, 'F1', 0, 0],
                [50, '@<br />2', 64, 50],   //    [113, 'F2', 0, 0],
                [51, '#<br />3', 35, 51],   //    [114, 'F3', 0, 0],
                [52, '$<br />4', 36, 52],   //    [115, 'F4', 0, 0],
                [53, '%<br />5', 37, 53],   //    [116, 'F5', 0, 0],
                [54, '^<br />6', 94, 54],   //    [117, 'F6', 0, 0],
                [55, '&<br />7', 38, 55],   //    [118, 'F7', 0, 0],
                [56, '*<br />8', 42, 56],   //    [119, 'F8', 0, 0],
                [57, '(<br />9', 40, 57],   //    [120, 'F9', 0, 0],
                [48, ')<br />0', 41, 48],   //    [121, 'F10', 0, 0],
                [173, '_<br />-', 95, 45],  //    [122, 'F11', 0, 0],
                [61, '+<br />=', 43, 61],   //    [123, 'F12', 0, 0],
                [8, 'Backspace', 0, 0]
            ],
            [
                [9, 'Tab', 0, 0],
                [81, 'Q', 81, 113],
                [87, 'W', 87, 119],
                [69, 'E', 69, 101],
                [82, 'R', 82, 114],
                [84, 'T', 84, 116],
                [89, 'Y', 89, 121],
                [85, 'U', 85, 117],
                [73, 'I', 73, 105],
                [79, 'O', 79, 111],
                [80, 'P', 80, 112],
                [219, '{<br />[', 123, 91],
                [221, '}<br />]', 125, 93],
                [220, '|<br />\\', 124, 92]
            ],
            [
                [20, 'Caps Lock', 0, 0],
                [65, 'A', 65, 97],
                [83, 'S', 83, 115],
                [68, 'D', 68, 100],
                [70, 'F', 70, 102],
                [71, 'G', 71, 103],
                [72, 'H', 72, 104],
                [74, 'J', 74, 106],
                [75, 'K', 75, 107],
                [76, 'L', 76, 108],
                [59, ':<br />;', 58, 59],
                [222, '"<br />\'', 34, 39],
                [13, 'Enter', 0, 0]
            ],
            [
                [1004, 'Shift', 0, 0],
                [90, 'Z', 90, 122],
                [88, 'X', 88, 120],
                [67, 'C', 67, 99],
                [86, 'V', 86, 118],
                [66, 'B', 66, 98],
                [78, 'N', 78, 110],
                [77, 'M', 77, 109],
                [188, '&lt;<br />,', 60, 44],
                [190, '&gt;<br />.', 62, 46],
                [191, '?<br />/', 63, 47],
                [33, 'Page<br />Up', 0, 0],
                [38, '', 0, 0], // Arrow up
                [34, 'Page<br />Down', 0, 0]
            ],
            [
                [17, 'Ctrl', 0, 0],
                [18, 'Alt', 0, 0],
                [32, '&nbsp;', 0, 0],
                [18, 'Alt', 0, 0],
                [17, 'Ctrl', 0, 0],
                [37, '', 0, 0], // Arrow left
                [40, '', 0, 0], // Arrow down
                [39, '', 0, 0] // Arrow right
            ]
        ];

        var Html: string = '';
        for (var Row: number = 0; Row < Rows.length; Row++) {
            Html += '<div class="fTelnetKeyboardRow';
            if (Row === 0) {
                // First row needs a second class
                Html += ' fTelnetKeyboardRowFunction';
            }
            Html += '">';

            for (var i: number = 0; i < Rows[Row].length; i++) {
                Html += '<div class="fTelnetKeyboardKey';
                if (typeof this._ClassKeys[Rows[Row][i][0]] !== 'undefined') {
                    Html += ' fTelnetKeyboardKey' + this._ClassKeys[Rows[Row][i][0]];
                }
                Html += '" data-keycode="' + Rows[Row][i][0] + '">';
                Html += Rows[Row][i][1];
                Html += '</div>';

                this._Keys[Rows[Row][i][0]] = Rows[Row][i];
            }

            Html += '</div>';
        }

        this._Div = document.createElement('div');
        this._Div.id = 'fTelnetKeyboard';
        this._Div.innerHTML = Html;
        this._Div.style.display = (this._Visible ? 'block' : 'none');

        return this._Div;
    }

    private static HighlightKey(className: string, lit: boolean): void {
        var Keys: NodeList = document.getElementsByClassName(className);
        for (var i: number = 0; i < Keys.length; i++) {
            if (lit) {
                (<HTMLDivElement>Keys[i]).style.color = '#00ff00';
            } else {
                (<HTMLDivElement>Keys[i]).removeAttribute('style');
            }
        }
    }

    // Can't use this. since it isn't referring to RIP (no fat arrow used to call this event)
    private static OnCharCode(e: Event): void {
        var KeyCode: number = parseInt((<HTMLDivElement>e.target).getAttribute('data-keycode'), 10);
        var CharCode: number = 0;

        if ((KeyCode >= 65) && (KeyCode <= 90)) {
            // Alphanumeric takes shift AND capslock into account
            CharCode = parseInt((VirtualKeyboard._ShiftPressed !== VirtualKeyboard._CapsLockEnabled) ? VirtualKeyboard._Keys[KeyCode][2] : VirtualKeyboard._Keys[KeyCode][3], 10);
        } else {
            // Other keys just take shift into account
            CharCode = parseInt(VirtualKeyboard._ShiftPressed ? VirtualKeyboard._Keys[KeyCode][2] : VirtualKeyboard._Keys[KeyCode][3], 10);
        }

        // Determine if ctrl, alt or shift were held down
        var NeedReDraw: boolean = false;
        var RegularKey: boolean = true;
        if (VirtualKeyboard._AltPressed) {
            NeedReDraw = true;
            RegularKey = false;
        }
        if (VirtualKeyboard._CtrlPressed) {
            NeedReDraw = true;
            RegularKey = false;
        }
        if (VirtualKeyboard._ShiftPressed) {
            NeedReDraw = true;
        }

        // Always dispatch onKeyDown, and then only OnTextEvent for regular keypresses
        Crt.PushKeyDown(0, KeyCode, VirtualKeyboard._CtrlPressed, VirtualKeyboard._AltPressed, VirtualKeyboard._ShiftPressed);
        if (RegularKey) {
            Crt.PushKeyPress(CharCode, 0, VirtualKeyboard._CtrlPressed, VirtualKeyboard._AltPressed, VirtualKeyboard._ShiftPressed);
        }

        // Reset flags and redraw, if necessary
        if (NeedReDraw) {
            VirtualKeyboard._AltPressed = false;
            VirtualKeyboard._CtrlPressed = false;
            VirtualKeyboard._ShiftPressed = false;
            VirtualKeyboard.ReDrawSpecialKeys();
        }
    }

    // Can't use this. since it isn't referring to RIP (no fat arrow used to call this event)
    private static OnKeyCode(e: Event): void {
        var KeyCode: number = parseInt((<HTMLDivElement>e.target).getAttribute('data-keycode'), 10);

        var NeedReset: boolean = false;
        switch (KeyCode) {
            case Keyboard.ALTERNATE:
                VirtualKeyboard._AltPressed = !VirtualKeyboard._AltPressed;
                VirtualKeyboard.ReDrawSpecialKeys();
                break;
            case Keyboard.CAPS_LOCK:
                VirtualKeyboard._CapsLockEnabled = !VirtualKeyboard._CapsLockEnabled;
                VirtualKeyboard.ReDrawSpecialKeys();
                break;
            case Keyboard.CONTROL:
                VirtualKeyboard._CtrlPressed = !VirtualKeyboard._CtrlPressed;
                VirtualKeyboard.ReDrawSpecialKeys();
                break;
            case Keyboard.SHIFTLEFT:
                VirtualKeyboard._ShiftPressed = !VirtualKeyboard._ShiftPressed;
                VirtualKeyboard.ReDrawSpecialKeys();
                break;
            default:
                NeedReset = true;
                break;
        }

        Crt.PushKeyDown(0, KeyCode, VirtualKeyboard._CtrlPressed, VirtualKeyboard._AltPressed, VirtualKeyboard._ShiftPressed);

        if (NeedReset) {
            VirtualKeyboard._AltPressed = false;
            VirtualKeyboard._CtrlPressed = false;
            VirtualKeyboard._ShiftPressed = false;
            VirtualKeyboard.ReDrawSpecialKeys();
        }
    }

    // Can't use this. since it isn't referring to RIP (no fat arrow used to call this event)
    private static OnTouchStart(e: Event): void {
        // We have touch events, unsubscribe to the click events
        var Keys: NodeList = document.getElementsByClassName('fTelnetKeyboardKey');
        for (var i: number = 0; i < Keys.length; i++) {
            if (Keys[i].removeEventListener) {  // all browsers except IE before version 9
                var KeyCode: string = (<HTMLDivElement>Keys[i]).getAttribute('data-keycode');
                if (VirtualKeyboard._Keys[KeyCode][2] > 0) { // [2] is the CharCodeShifted, which only a non-special key has
                    // Regular character
                    Keys[i].removeEventListener('click', VirtualKeyboard.OnCharCode);
                    Keys[i].removeEventListener('touchstart', VirtualKeyboard.OnTouchStart, false);
                } else {
                    // Special character
                    Keys[i].removeEventListener('click', VirtualKeyboard.OnKeyCode, false);
                    Keys[i].removeEventListener('touchstart', VirtualKeyboard.OnTouchStart, false);
                }
            }
        }
    }

    private static ReDrawSpecialKeys(): void {
        this.HighlightKey('fTelnetKeyboardKeyCapsLock', this._CapsLockEnabled);
        this.HighlightKey('fTelnetKeyboardKeyShiftLeft', this._ShiftPressed);
        this.HighlightKey('fTelnetKeyboardKeyCtrl', this._CtrlPressed);
        this.HighlightKey('fTelnetKeyboardKeyAlt', this._AltPressed);
    }

    public static get Visible(): boolean {
        return this._Visible;
    }

    public static set Visible(value: boolean) {
        this._Visible = value;

        if (this._Div != null) {
            this._Div.style.display = (value ? 'block' : 'none');
        }
    }

}
