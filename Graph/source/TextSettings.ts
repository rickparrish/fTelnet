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
class TextSettings {
    public Direction: number = TextOrientation.Horizontal;
    public Font: number = 0;
    public HorizontalAlign: number = TextJustification.Left;
    public Size: number = 1;
    public StrokeScaleX: number;
    public StrokeScaleY: number;
    public VerticalAlign: number = TextJustification.Top;

    private static STROKE_SCALES: any[] = [
        [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
        [[0, 0], [13, 18], [14, 20], [16, 23], [22, 31], [29, 41], [36, 51], [44, 62], [55, 77], [66, 93], [88, 124]], // TriplexFont
        [[0, 0], [3, 5], [4, 6], [4, 6], [6, 9], [8, 12], [10, 15], [12, 18], [15, 22], [18, 27], [24, 36]], // SmallFont
        [[0, 0], [11, 19], [12, 21], [14, 24], [19, 32], [25, 42], [31, 53], [38, 64], [47, 80], [57, 96], [76, 128]], // SansSerifFont
        [[0, 0], [13, 19], [14, 21], [16, 24], [22, 32], [29, 42], [36, 53], [44, 64], [55, 80], [66, 96], [88, 128]], // GothicFont

        // These may not be 100% correct
        [[0, 0], [11, 19], [12, 21], [14, 24], [19, 32], [25, 42], [31, 53], [38, 64], [47, 80], [57, 96], [76, 128]], // ScriptFont
        [[0, 0], [11, 19], [12, 21], [14, 24], [19, 32], [25, 42], [31, 53], [38, 64], [47, 80], [57, 96], [76, 128]], // SimplexFont
        [[0, 0], [13, 18], [14, 20], [16, 23], [22, 31], [29, 41], [36, 51], [44, 62], [55, 77], [66, 93], [88, 124]], // TriplexScriptFont
        [[0, 0], [11, 19], [12, 21], [14, 24], [19, 32], [25, 42], [31, 53], [38, 64], [47, 80], [57, 96], [76, 128]], // ComplexFont
        [[0, 0], [11, 19], [12, 21], [14, 24], [19, 32], [25, 42], [31, 53], [38, 64], [47, 80], [57, 96], [76, 128]], // EuropeanFont
        [[0, 0], [11, 19], [12, 21], [14, 24], [19, 32], [25, 42], [31, 53], [38, 64], [47, 80], [57, 96], [76, 128]]]; // BoldFont

    constructor() {
        this.SetStrokeScale();
    }

    public SetStrokeScale(): void {
        this.StrokeScaleX = TextSettings.STROKE_SCALES[this.Font][this.Size][0] / TextSettings.STROKE_SCALES[this.Font][4][0];
        this.StrokeScaleY = TextSettings.STROKE_SCALES[this.Font][this.Size][1] / TextSettings.STROKE_SCALES[this.Font][4][1];
    }
}
