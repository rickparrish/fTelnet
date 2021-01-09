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
class Benchmarks {
    private static _Benchmarks: { [name: string]: Benchmark; } = {};
    private static _Names: string[] = [];

    public static Alert(): void {
        var text: string = '';
        for (var i: number = 0; i < this._Names.length; i++) {
            text += this._Names[i] + ': ' + this._Benchmarks[this._Names[i]].CumulativeElapsed + '\n';
        }
        alert(text);
    }

    public static Reset(): void {
        this._Benchmarks = {};
        this._Names = [];
    }

    public static Start(name: string): Benchmark {
        if (this._Benchmarks[name] === undefined) {
            this._Benchmarks[name] = new Benchmark();
            this._Names.push(name);
        }

        this._Benchmarks[name].Start();

        return this._Benchmarks[name];
    }

    public static Stop(name: string): void {
        this._Benchmarks[name].Stop();
    }

    public static Log(): void {
        for (var i: number = 0; i < this._Names.length; i++) {
            var text: string = '';
            text += this._Names[i] + ': ' + this._Benchmarks[this._Names[i]].CumulativeElapsed;
            console.log(text);
        }
    }
}
