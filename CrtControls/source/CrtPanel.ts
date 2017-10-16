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
class CrtPanel extends CrtControl {
    private _Border: BorderStyle;
    private _Text: string;
    private _TextAlign: ContentAlignment;

    constructor(crt: Crt, parent: CrtControl | undefined, left: number, top: number, width: number, height: number, border: BorderStyle, foreColour: number, backColour: number, text: string, textAlign: ContentAlignment) {
        super(crt, parent, left, top, width, height);

        this._Border = border;
        this._Text = text;
        this._TextAlign = textAlign;

        // Do these second because they force a paint and will cause an exception if they happen before the text is assigned
        this.ForeColour = foreColour;
        this.BackColour = backColour;

        this.Paint(true);
    }

    public get Border(): BorderStyle {
        return this._Border;
    }

    public set Border(value: BorderStyle) {
        if (value !== this._Border) {
            this._Border = value;
            this.Paint(true);
        }
    }

    public Paint(force: boolean): void {
        force = force; // Avoid unused parameter error

        // Characters for the box
        var TopLeft: string = '+';
        var TopRight: string = '+';
        var BottomLeft: string = '+';
        var BottomRight: string = '+';
        var TopBottom: string = '|';
        var LeftRight: string = '-';

        // Determine which character set to use
        switch (this._Border) {
            case BorderStyle.Single:
                TopLeft = String.fromCharCode(218);
                TopRight = String.fromCharCode(191);
                BottomLeft = String.fromCharCode(192);
                BottomRight = String.fromCharCode(217);
                TopBottom = String.fromCharCode(196);
                LeftRight = String.fromCharCode(179);
                break;
            case BorderStyle.Double:
                TopLeft = String.fromCharCode(201);
                TopRight = String.fromCharCode(187);
                BottomLeft = String.fromCharCode(200);
                BottomRight = String.fromCharCode(188);
                TopBottom = String.fromCharCode(205);
                LeftRight = String.fromCharCode(186);
                break;
            case BorderStyle.DoubleH:
            case BorderStyle.SingleV:
                TopLeft = String.fromCharCode(213);
                TopRight = String.fromCharCode(184);
                BottomLeft = String.fromCharCode(212);
                BottomRight = String.fromCharCode(190);
                TopBottom = String.fromCharCode(205);
                LeftRight = String.fromCharCode(179);
                break;
            case BorderStyle.DoubleV:
            case BorderStyle.SingleH:
                TopLeft = String.fromCharCode(214);
                TopRight = String.fromCharCode(183);
                BottomLeft = String.fromCharCode(211);
                BottomRight = String.fromCharCode(189);
                TopBottom = String.fromCharCode(196);
                LeftRight = String.fromCharCode(186);
                break;
        }

        // Draw top row
        this._Crt.FastWrite(TopLeft + StringUtils.NewString(TopBottom, this.Width - 2) + TopRight, this.ScreenLeft, this.ScreenTop, CharInfo.GetNew(' ', this.ForeColour + (this.BackColour << 4)));

        // Draw middle rows
        for (var Line: number = this.ScreenTop + 1; Line < this.ScreenTop + this.Height - 1; Line++) {
            this._Crt.FastWrite(LeftRight + StringUtils.NewString(' ', this.Width - 2) + LeftRight, this.ScreenLeft, Line, CharInfo.GetNew(' ', this.ForeColour + (this.BackColour << 4)));
        }

        // Draw bottom row
        this._Crt.FastWrite(BottomLeft + StringUtils.NewString(TopBottom, this.Width - 2) + BottomRight, this.ScreenLeft, this.ScreenTop + this.Height - 1, CharInfo.GetNew(' ', this.ForeColour + (this.BackColour << 4)));

        // Draw window title
        if (StringUtils.Trim(this._Text).length > 0) {
            var TitleX: number = 0;
            var TitleY: number = 0;
            var WindowTitle: string = ' ' + StringUtils.Trim(this._Text) + ' ';

            // Get X component
            switch (this._TextAlign) {
                case ContentAlignment.BottomLeft:
                case ContentAlignment.MiddleLeft:
                case ContentAlignment.TopLeft:
                    TitleX = this.ScreenLeft + 2;
                    break;
                case ContentAlignment.BottomCenter:
                case ContentAlignment.MiddleCenter:
                case ContentAlignment.TopCenter:
                    TitleX = this.ScreenLeft + Math.round((this.Width - WindowTitle.length) / 2);
                    break;
                case ContentAlignment.BottomRight:
                case ContentAlignment.MiddleRight:
                case ContentAlignment.TopRight:
                    TitleX = this.ScreenLeft + this.Width - WindowTitle.length - 2;
                    break;
            }

            // Get the Y component
            switch (this._TextAlign) {
                case ContentAlignment.BottomCenter:
                case ContentAlignment.BottomLeft:
                case ContentAlignment.BottomRight:
                    TitleY = this.ScreenTop + this.Height - 1;
                    break;
                case ContentAlignment.MiddleCenter:
                case ContentAlignment.MiddleLeft:
                case ContentAlignment.MiddleRight:
                case ContentAlignment.TopCenter:
                case ContentAlignment.TopLeft:
                case ContentAlignment.TopRight:
                    TitleY = this.ScreenTop;
                    break;
            }

            // Draw title
            this._Crt.FastWrite(WindowTitle, TitleX, TitleY, CharInfo.GetNew(' ', this.ForeColour + (this.BackColour << 4)));
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
