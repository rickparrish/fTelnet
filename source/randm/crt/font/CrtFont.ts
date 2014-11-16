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
var CrtFonts: string[] = [];

CrtFonts['437x9x16'] = 'data:image/png;base64,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';
CrtFonts['ASCIIx9x16'] = 'data:image/png;base64,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';

class CrtFont {
    // Public event
    public onchange: Function = function (): void { }; // Do nothing

    // Public variables
    public static ANSI_COLOURS: number[] = [
        0x000000, 0x0000A8, 0x00A800, 0x00A8A8, 0xA80000, 0xA800A8, 0xA85400, 0xA8A8A8,
		0x545454, 0x5454FC, 0x54FC54, 0x54FCFC, 0xFC5454, 0xFC54FC, 0xFCFC54, 0xFCFCFC];

    // From http://www.c64-wiki.com/index.php/Color
    // public static PETSCII_COLOURS: string[] = [
    //     '#000000', '#ffffff', '#880000', '#aaffee', '#cc44cc', '#00cc55', '#0000aa', '#eeee77',
    //     '#dd8855', '#664400', '#ff7777', '#333333', '#777777', '#aaff66', '#0088ff', '#bbbbbb'];

    // From http://www.pepto.de/projects/colorvic/
    // public static PETSCII_COLOURS: string[] = [
    //     '#000000', '#ffffff', '#68372B', '#70A4B2', '#6F3D86', '#588D43', '#352879', '#B8C76F',
    //     '#6F4F25', '#433900', '#9A6759', '#444444', '#6C6C6C', '#9AD284', '#6C5EB5', '#959595'];

    // From http://en.wikipedia.org/wiki/File:C64_ntsc_cxa2025.bmp.png
    // public static PETSCII_COLOURS: string[] = [
    //     '#000000', '#ffffff', '#FA3200', '#1DE0FF', '#A84BCC', '#68BB50', '#004AD0', '#FFEB45',
    //     '#FF5B00', '#C23D00', '#FF7142', '#FF7142', '#8A9578', '#B3FF97', '#4788FF', '#C3B8D7'];

    // From CGterm
    public static PETSCII_COLOURS: number[] = [
        0x000000, 0xFDFEFC, 0xBE1A24, 0x30E6C6, 0xB41AE2, 0x1FD21E, 0x211BAE, 0xDFF60A,
        0xB84104, 0x6A3304, 0xFE4A57, 0x424540, 0x70746F, 0x59FE59, 0x5F53FE, 0xA4A7A2];

    // Private variables
    private _Canvas: HTMLCanvasElement;
    private _CanvasContext: CanvasRenderingContext2D;
    private _CharMap: ImageData[];
    private _CodePage: string;
    private _Loading: number;
    private _Lower: HTMLImageElement;
    private _NewCodePage: string;
    private _NewSize: Point;
    private _Size: Point;
    private _Upper: HTMLImageElement;

    constructor() {
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

    public get CodePage(): string {
        return this._CodePage;
    }

    public GetChar(charCode: number, charInfo: CharInfo): ImageData {
        if (this._Loading > 0) { return null; }

        // Validate values
        if ((charCode < 0) || (charCode > 255) || (charInfo.Attr < 0) || (charInfo.Attr > 255)) { return null; }

        var CharMapKey: string = charCode + '-' + charInfo.Attr + '-' + charInfo.Reverse;

        // Check if we have used this character before
        if (!this._CharMap[CharMapKey]) {
            // Nope, so get character (in black and white)
            this._CharMap[CharMapKey] = this._CanvasContext.getImageData(charCode * this._Size.x, 0, this._Size.x, this._Size.y);

            // Now colour the character
            var Back: number;
            var Fore: number;
            if (this._CodePage.indexOf('PETSCII') === 0) {
                Back = CrtFont.PETSCII_COLOURS[(charInfo.Attr & 0xF0) >> 4];
                Fore = CrtFont.PETSCII_COLOURS[(charInfo.Attr & 0x0F)];
            } else {
                Back = CrtFont.ANSI_COLOURS[(charInfo.Attr & 0xF0) >> 4];
                Fore = CrtFont.ANSI_COLOURS[(charInfo.Attr & 0x0F)];
            }

            // Reverse if necessary
            if (charInfo.Reverse) {
                var Temp: number = Fore;
                Fore = Back;
                Back = Temp;
            }

            // Get the individual RGB colours
            var BackR: number = Back >> 16; // parseInt(Back[1].toString() + Back[2].toString(), 16);
            var BackG: number = (Back >> 8) & 0xFF; // parseInt(Back[3].toString() + Back[4].toString(), 16);
            var BackB: number = Back & 0xFF; // parseInt(Back[5].toString() + Back[6].toString(), 16);
            var ForeR: number = Fore >> 16; // parseInt(Fore[1].toString() + Fore[2].toString(), 16);
            var ForeG: number = (Fore >> 8) & 0xFF; // parseInt(Fore[3].toString() + Fore[4].toString(), 16);
            var ForeB: number = Fore & 0xFF; // parseInt(Fore[5].toString() + Fore[6].toString(), 16);

            // Colour the pixels 1 at a time
            var R: number = 0;
            var G: number = 0;
            var B: number = 0;
            for (var i: number = 0; i < this._CharMap[CharMapKey].data.length; i += 4) {
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
    }

    public get Height(): number {
        return this._Size.y;
    }

    public Load(codePage: string, width: number, height: number): void {
        // Ensure the requested font exists
        if (CrtFonts[codePage + 'x' + width + 'x' + height] !== undefined) {
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
                this._Lower.onload = () => { this.OnLoadUpper(); }
                this._Lower.src = CrtFonts[this._NewCodePage + 'x' + this._NewSize.x + 'x' + this._NewSize.y];
                this._Upper = null;
            } else {
                // Load the lower font
                this._Lower = new Image();
                this._Lower.onload = () => { this.OnLoadLower(); }
                this._Lower.src = CrtFonts['ASCIIx' + width + 'x' + height];
            }
        } else {
            console.log('fTelnet Error: Font CP=' + codePage + ', Width=' + width + ', Height=' + height + ' does not exist');
        }
    }

    private OnLoadLower(): void {
        // Load the upper font
        this._Upper = new Image();
        this._Upper.onload = () => { this.OnLoadUpper(); }
        this._Upper.src = CrtFonts[this._NewCodePage + 'x' + this._NewSize.x + 'x' + this._NewSize.y];
    }

    private OnLoadUpper(): void {
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
        if (this._Upper) { this._CanvasContext.drawImage(this._Upper, this._Lower.width, 0); }

        // Reset CharMap
        this._CharMap = [];

        // Raise change event
        this._Loading -= 1;
        this.onchange();
    }

    public get Size(): Point {
        return this._Size;
    }

    public get Width(): number {
        return this._Size.x;
    }
}
