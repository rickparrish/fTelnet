/*
  HtmlTerm: An HTML5 WebSocket client
  Copyright (C) 2009-2013  Rick Parrish, R&M Software

  This file is part of HtmlTerm.

  HtmlTerm is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  any later version.

  HtmlTerm is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with HtmlTerm.  If not, see <http://www.gnu.org/licenses/>.
*/
class StringUtils {
    public static AddCommas(value: number): string {
        var Result: string = '';

        var Position: number = 1;
        for (var i: number = value.toString().length - 1; i >= 0; i--) {
            if ((Position > 3) && (Position % 3 === 1)) { Result = ',' + Result; }
            Result = value.toString().charAt(i) + Result;
            Position++;
        }

        return Result;
    }

    public static FormatPercent(value: number, fractionDigits: number): string {
        return (value * 100).toFixed(fractionDigits) + '%';
    }

    public static NewString(ch: string, length: number): string {
        if (ch.length === 0) { return ''; }

        var Result: string = '';
        for (var i: number = 0; i < length; i++) { Result += ch.charAt(0); }
        return Result;
    }

    public static PadLeft(text: string, ch: string, length: number): string {
        if (ch.length === 0) { return text; }

        while (text.length < length) { text = ch.charAt(0) + text; }
        return text.substring(0, length);
    }

    public static PadRight(text: string, ch: string, length: number): string {
        if (ch.length === 0) { return text; }

        while (text.length < length) { text += ch.charAt(0); }
        return text.substring(0, length);
    }

    public static Trim(text: string): string {
        return this.TrimLeft(this.TrimRight(text));
    }

    public static TrimLeft(text: string): string {
        return text.replace(/^\s+/g, '');
    }

    public static TrimRight(text: string): string {
        return text.replace(/\s+$/g, '');
    }
}
