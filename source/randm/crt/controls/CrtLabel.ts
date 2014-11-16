/*
  fTelnet: An HTML5 WebSocket client
  Copyright (C) 2009-2013  Rick Parrish, R&M Software

  This file is part of fTelnet.

  fTelnet is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  any later version.

  fTelnet is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with fTelnet.  If not, see <http://www.gnu.org/licenses/>.
*/
class CrtLabel extends CrtControl {
    private _Text: string;
    private _TextAlign: ContentAlignment;

    constructor(parent: CrtControl, left: number, top: number, width: number, text: string, textAlign: ContentAlignment, foreColour: number, backColour: number) {
        super(parent, left, top, width, 1);

        this._Text = text;
        this._TextAlign = textAlign;

        // Do these second because they force a paint and will cause an exception if they happen before the text is assigned
        this.ForeColour = foreColour;
        this.BackColour = backColour;

        this.Paint(true);
    }

    public Paint(force: boolean): void {
        // Draw the message
        switch (this._TextAlign) {
            case ContentAlignment.Center:
                if (this._Text.length >= this.Width) {
                    // Text is greater than available space so chop it off with PadRight()
                    Crt.FastWrite(this._Text.substring(0, this.Width), this.ScreenLeft, this.ScreenTop, new CharInfo(' ', this.ForeColour + (this.BackColour << 4)));
                } else {
                    // Text needs to be centered
                    var i: number = 0;
                    var LeftSpaces: string = '';
                    for (i = 0; i < Math.floor((this.Width - this._Text.length) / 2); i++) {
                        LeftSpaces += ' ';
                    }
                    var RightSpaces: string = '';
                    for (i = 0; i < this.Width - this._Text.length - LeftSpaces.length; i++) {
                        RightSpaces += ' ';
                    }
                    Crt.FastWrite(LeftSpaces + this._Text + RightSpaces, this.ScreenLeft, this.ScreenTop, new CharInfo(' ', this.ForeColour + (this.BackColour << 4)));
                }
                break;
            case ContentAlignment.Left:
                Crt.FastWrite(StringUtils.PadRight(this._Text, ' ', this.Width), this.ScreenLeft, this.ScreenTop, new CharInfo(' ', this.ForeColour + (this.BackColour << 4)));
                break;
            case ContentAlignment.Right:
                Crt.FastWrite(StringUtils.PadLeft(this._Text, ' ', this.Width), this.ScreenLeft, this.ScreenTop, new CharInfo(' ', this.ForeColour + (this.BackColour << 4)));
                break;
        }
    }

    public get Text(): string {
        return this._Text;
    }

    public set Text(value: string) {
        this._Text = value;
        this.Paint(true);
    }

    public get TextAlign(): ContentAlignment {
        return this._TextAlign;
    }

    public set TextAlign(value: ContentAlignment) {
        if (value !== this._TextAlign) {
            this._TextAlign = value;
            this.Paint(true);
        }
    }
}
