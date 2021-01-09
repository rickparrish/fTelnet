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
class Benchmark {
    private _CumulativeElapsed: number = 0;
    private _StartTime: number;
    private _StopTime: number;

    public get CumulativeElapsed(): number | undefined {
        if (this._CumulativeElapsed > 0) {
            return this._CumulativeElapsed;
        } else {
            return undefined;
        }
    }

    public get Elapsed(): number | undefined {
        if (this._StopTime > 0) {
            return this._StopTime - this._StartTime;
        } else {
            return undefined;
        }
    }

    public Reset(): void {
        this._CumulativeElapsed = 0;
    }

    public Start(): void {
        this._StartTime = performance.now();
        this._StopTime = 0;
    }

    public Stop(): void {
        if (this._StartTime > 0) {
            this._StopTime = performance.now();
            this._CumulativeElapsed += this.Elapsed;
        }
    }
}
