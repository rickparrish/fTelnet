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
class CrtFonts {
    private static _Fonts: any[] = [];

    // Static constructor
    private static __ctor = ((): void => {
        var FontNames: string[] = ['Amiga-BStrict_8x8', 'Amiga-BStruct_8x8', 'Amiga-MicroKnight_8x16', 'Amiga-MicroKnight_8x8', 'Amiga-MoSoul_8x16', 'Amiga-MoSoul_8x8', 'Amiga-PotNoodle_8x11', 'Amiga-PotNoodle_8x16', 'Amiga-TopazPlus_8x11', 'Amiga-Topaz_8x11', 'Amiga-Topaz_8x16', 'Atari-Arabic_16x16', 'Atari-Arabic_8x16', 'Atari-Graphics_16x16', 'Atari-Graphics_8x16', 'Atari-Graphics_8x8', 'Atari-International_16x16', 'Atari-International_8x16', 'C128-Lower_8x16', 'C128-Upper_8x16', 'C128-Upper_8x8', 'C128_Lower_8x8', 'C64-Lower_16x16', 'C64-Lower_8x16', 'C64-Lower_8x8', 'C64-Upper_16x16', 'C64-Upper_8x16', 'C64-Upper_8x8', 'CP437_10x19', 'CP437_12x23', 'CP437_6x8', 'CP437_7x12', 'CP437_8x12', 'CP437_8x13', 'CP437_8x14', 'CP437_8x16', 'CP437_8x8', 'CP437_9x16', 'CP737_12x23', 'CP737_9x16', 'CP775_9x16', 'CP850_10x19', 'CP850_12x23', 'CP850_8x13', 'CP850_9x16', 'CP852_10x19', 'CP852_12x23', 'CP852_9x16', 'CP855_9x16', 'CP857_9x16', 'CP860_9x16', 'CP861_9x16', 'CP862_10x19', 'CP863_9x16', 'CP865_10x19', 'CP865_12x23', 'CP865_8x13', 'CP865_9x16', 'CP866_9x16', 'CP869_9x16', 'SyncTerm-0_8x14', 'SyncTerm-0_8x16', 'SyncTerm-0_8x8', 'SyncTerm-10_8x16', 'SyncTerm-11_8x14', 'SyncTerm-11_8x16', 'SyncTerm-11_8x8', 'SyncTerm-12_8x16', 'SyncTerm-13_8x16', 'SyncTerm-14_8x14', 'SyncTerm-14_8x16', 'SyncTerm-14_8x8', 'SyncTerm-15_8x14', 'SyncTerm-15_8x16', 'SyncTerm-15_8x8', 'SyncTerm-16_8x14', 'SyncTerm-16_8x16', 'SyncTerm-16_8x8', 'SyncTerm-17_8x16', 'SyncTerm-17_8x8', 'SyncTerm-18_8x14', 'SyncTerm-18_8x16', 'SyncTerm-18_8x8', 'SyncTerm-19_8x16', 'SyncTerm-19_8x8', 'SyncTerm-1_8x16', 'SyncTerm-20_8x14', 'SyncTerm-20_8x16', 'SyncTerm-20_8x8', 'SyncTerm-21_8x14', 'SyncTerm-21_8x16', 'SyncTerm-21_8x8', 'SyncTerm-22_8x16', 'SyncTerm-23_8x14', 'SyncTerm-23_8x16', 'SyncTerm-23_8x8', 'SyncTerm-24_8x14', 'SyncTerm-24_8x16', 'SyncTerm-24_8x8', 'SyncTerm-25_8x14', 'SyncTerm-25_8x16', 'SyncTerm-25_8x8', 'SyncTerm-26_8x16', 'SyncTerm-26_8x8', 'SyncTerm-27_8x16', 'SyncTerm-28_8x14', 'SyncTerm-28_8x16', 'SyncTerm-28_8x8', 'SyncTerm-29_8x14', 'SyncTerm-29_8x16', 'SyncTerm-29_8x8', 'SyncTerm-2_8x14', 'SyncTerm-2_8x16', 'SyncTerm-2_8x8', 'SyncTerm-30_8x16', 'SyncTerm-31_8x16', 'SyncTerm-32_8x16', 'SyncTerm-32_8x8', 'SyncTerm-33_8x16', 'SyncTerm-33_8x8', 'SyncTerm-34_8x16', 'SyncTerm-34_8x8', 'SyncTerm-35_8x16', 'SyncTerm-35_8x8', 'SyncTerm-36_8x16', 'SyncTerm-36_8x8', 'SyncTerm-37_8x16', 'SyncTerm-38_8x16', 'SyncTerm-39_8x16', 'SyncTerm-3_8x14', 'SyncTerm-3_8x16', 'SyncTerm-3_8x8', 'SyncTerm-40_8x16', 'SyncTerm-4_8x16', 'SyncTerm-5_8x16', 'SyncTerm-6_8x16', 'SyncTerm-7_8x14', 'SyncTerm-7_8x16', 'SyncTerm-7_8x8', 'SyncTerm-8_8x14', 'SyncTerm-8_8x16', 'SyncTerm-8_8x8', 'SyncTerm-9_8x14', 'SyncTerm-9_8x16', 'SyncTerm-9_8x8'];
        for (var i: number = 0; i < FontNames.length; i++) {
            var NameSize: string[] = FontNames[i].split('_');
            var WidthHeight: string[] = NameSize[1].split('x');
            var Width: number = parseInt(WidthHeight[0], 10);
            var Height: number = parseInt(WidthHeight[1], 10);

            // Check if it's a new font and add it if it is
            if (typeof CrtFonts._Fonts[NameSize[0]] === 'undefined') {
                CrtFonts._Fonts[NameSize[0]] = [];
            }

            // Push the new size into the array
            CrtFonts._Fonts[NameSize[0]].push(new Point(Width, Height));
        }

        // Sort biggest to smallest
        for (var key in CrtFonts._Fonts) {
            CrtFonts._Fonts[key].sort((a: Point, b: Point): number => {
                if (b.x - a.x === 0) {
                    return b.y - a.y;
                } else {
                    return b.x - a.x;
                }
            });
        }
    })();

    public static GetBestFit(font: string, maxWidth: number, maxHeight: number): Point {
        // Check how many matches we found
        if (typeof this._Fonts[font] === 'undefined') {
            // None, it's not a valid font
            return null;
        } else if (this._Fonts[font].length === 1) {
            // One, so return it
            return this._Fonts[font][0];
        } else {
            // More than one, so find the biggest one that is less than the max width and heights
            for (var i: number = 0; i < this._Fonts[font].length; i++) {
                if ((this._Fonts[font][i].x <= maxWidth) && (this._Fonts[font][i].y <= maxHeight)) {
                    return this._Fonts[font][i];
                }
            }

            // If we get here, nothing matched, so return the smallest match
            return this._Fonts[font][this._Fonts[font].length - 1];
        }
    }

    public static GetLocalUrl(font: string, width: number, height: number): string {
        if (document.getElementById('fTelnetScript') === null) {
            // Use remote url instead
            return this.GetRemoteUrl(font, width, height);
        } else {
            var ScriptUrl: string = (<HTMLScriptElement>document.getElementById('fTelnetScript')).src;
            var PngUrl: string = ScriptUrl.replace('/ftelnet.min.js', '/fonts/' + font + '_' + width.toString(10) + 'x' + height.toString(10) + '.png');
            PngUrl = PngUrl.replace('/ftelnet.debug.js', '/fonts/' + font + '_' + width.toString(10) + 'x' + height.toString(10) + '.png');
            return PngUrl;
        }
    }

    public static GetRemoteUrl(font: string, width: number, height: number): string {
        var PngUrl: string = 'http://embed.ftelnet.ca/ftelnet/fonts/' + font + '_' + width.toString(10) + 'x' + height.toString(10) + '.png';
        return PngUrl;
    }
}
