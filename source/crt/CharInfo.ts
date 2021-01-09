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
class CharInfo {
    public Attr: number;
    public Back24: number;
    public Blink: boolean;
    public Ch: string;
    public Fore24: number;
    public NeedsRedraw: boolean;
    public Reverse: boolean;
    public Underline: boolean;

    //constructor(ch: string, attr: number, blink?: boolean, underline?: boolean, reverse?: boolean) {
    //    if (typeof blink === 'undefined') { blink = false; }
    //    if (typeof underline === 'undefined') { underline = false; }
    //    if (typeof reverse === 'undefined') { reverse = false; }

    //    this.Ch = ch;
    //    this.Attr = attr;
    //    this.Blink = blink;
    //    this.Underline = underline;
    //    this.Reverse = reverse;
    //}

    constructor(oldCharInfo: CharInfo | null) {
        if (oldCharInfo == null) {
            this.Attr = Crt.LIGHTGRAY;
            this.Back24 = CrtFont.ANSI_COLOURS[Crt.BLACK];
            this.Blink = false;
            this.Ch = ' ';
            this.Fore24 = CrtFont.ANSI_COLOURS[Crt.LIGHTGRAY];
            this.NeedsRedraw = false;
            this.Reverse = false;
            this.Underline = false;
        } else {
            this.Set(oldCharInfo);
        }
    }

    static GetNew(ch: string, attr: number): CharInfo {
        var Result: CharInfo = new CharInfo(null);
        Result.Attr = attr;
        Result.Back24 = CrtFont.ANSI_COLOURS[(attr & 0xF0) >> 4];
        Result.Ch = ch;
        Result.Fore24 = CrtFont.ANSI_COLOURS[attr & 0x0F];
        return Result;
    }

    public Set(oldCharInfo: CharInfo) {
        this.Attr = oldCharInfo.Attr;
        this.Back24 = oldCharInfo.Back24;
        this.Blink = oldCharInfo.Blink;
        this.Ch = oldCharInfo.Ch;
        this.Fore24 = oldCharInfo.Fore24;
        this.Reverse = oldCharInfo.Reverse;
        this.Underline = oldCharInfo.Underline;
    }
}
