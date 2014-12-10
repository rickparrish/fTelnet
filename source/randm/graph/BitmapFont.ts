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
class BitmapFont {
    // TODO Figure out a better way to do this, or load on demand like other fonts
    public static Loaded: boolean = false;
    public static Pixels: any[] = [];

    public static Init(): void {
        // This initializes the pixels array so that all 256 chars are blank
        // This is so if we fail loading the pixels array from the HTTP server, the client won't crash (but it means the bitmap font text won't display)
        for (var char: number = 0; char < 256; char++) {
            this.Pixels[char] = [];
            for (var y: number = 0; y < 8; y++) {
                this.Pixels[char][y] = [];
                for (var x: number = 0; x < 8; x++) {
                    this.Pixels[char][y][x] = 0;
                }
            }
        }

        if (document.getElementById('fTelnetScript') !== null) {
            // TODO This logic is also in CrtFonts -- Should create a helper function so we don't have to duplicate this
            var ScriptUrl: string = (<HTMLScriptElement>document.getElementById('fTelnetScript')).src;
            var JsonUrl: string = ScriptUrl.replace('/ftelnet.min.js', '/fonts/RIP-Bitmap_8x8.json');
            JsonUrl = JsonUrl.replace('/ftelnet.debug.js', '/fonts/RIP-Bitmap_8x8.json');

            var xhr: XMLHttpRequest = new XMLHttpRequest();
            xhr.open('get', JsonUrl, true);
            xhr.onload = (): void => { this.OnJsonLoad(xhr); }
            xhr.send();
        }
    }

    private static OnJsonLoad(xhr: XMLHttpRequest) {
        var status: number = xhr.status;
        if (status === 200) {
            this.Pixels = JSON.parse(xhr.responseText)
            this.Loaded = true;
        } else {
            alert('fTelnet Error: Unable to load RIP bitmap font');
            // TODO Retry with remote embed.ftelnet.ca url
        }
    }
}
