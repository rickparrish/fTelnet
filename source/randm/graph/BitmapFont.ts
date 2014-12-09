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
    public static Pixels: any[];

    public static Init(): void {
        if (document.getElementById('fTelnetScript') !== null) {
            // TODO This logic is also in CrtFonts -- Should create a helper function so we don't have to duplicate this
            var ScriptUrl: string = (<HTMLScriptElement>document.getElementById('fTelnetScript')).src;
            var JsonUrl: string = ScriptUrl.replace('/ftelnet.min.js', '/fonts/RIP-Bitmap_8x8.json');
            JsonUrl = JsonUrl.replace('/ftelnet.debug.js', '/fonts/RIP-Bitmap_8x8.json');

            var xhr = new XMLHttpRequest();
            xhr.open('get', JsonUrl, true);
            xhr.onload = (): void => { this.OnJsonLoad(xhr); }
            xhr.send();
        }
    }

    private static OnJsonLoad(xhr: XMLHttpRequest) {
        var status = xhr.status;
        if (status == 200) {
            this.Pixels = JSON.parse(xhr.responseText)
        } else {
            alert('fTelnet Error: Unable to load RIP bitmap font');
            // TODO Retry with remote embed.ftelnet.ca url
        }
    }
}
