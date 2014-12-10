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
class StrokeFont {
    public static MOVE: number = 0;
    public static DRAW: number = 1;
    public static Heights: number[] = [31, 9, 32, 32, 37, 35, 31, 35, 55, 60];
    public static Strokes: any[] = [];
    public static Loaded: Boolean = false;

    public static Init(): void {
        // This initializes the strokes array so that all 256 chars in all 10 fonts are blank
        // This is so if we fail loading the strokes array from the HTTP server, the client won't crash (but it means stroke fonts text won't display)
        for (var Stroke: number = 0; Stroke < 10; Stroke++) {
            var Chars: any[] = [];
            for (var Char: number = 0; Char < 256; Char++) {
                Chars.push([[0], [0, 0, 0]]);
            }
            this.Strokes.push(Chars);
        }

        if (document.getElementById('fTelnetScript') !== null) {
            // TODO This logic is also in CrtFonts -- Should create a helper function so we don't have to duplicate this
            var ScriptUrl: string = (<HTMLScriptElement>document.getElementById('fTelnetScript')).src;
            var JsonUrl: string = ScriptUrl.replace('/ftelnet.min.js', '/fonts/RIP-Strokes.json');
            JsonUrl = JsonUrl.replace('/ftelnet.debug.js', '/fonts/RIP-Strokes.json');

            var xhr: XMLHttpRequest = new XMLHttpRequest();
            xhr.open('get', JsonUrl, true);
            xhr.onload = (): void => { this.OnJsonLoad(xhr); }
            xhr.send();
        }
    }

    private static OnJsonLoad(xhr: XMLHttpRequest) {
        var status: number = xhr.status;
        if (status === 200) {
            this.Strokes = JSON.parse(xhr.responseText);
            this.Loaded = true;
        } else {
            alert('fTelnet Error: Unable to load RIP stroke fonts');
            // TODO Retry with remote embed.ftelnet.ca url
        }
    }
}
