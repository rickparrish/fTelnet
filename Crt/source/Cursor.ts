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
class Cursor {
    // Events
    public onhide: IEvent = new TypedEvent();
    public onshow: IEvent = new TypedEvent();

    // Private variables
    private _BlinkRate: number;
    private _BlinkState: BlinkState;
    private _Colour: string;
    private _LastPosition: Point;
    private _Position: Point;
    private _Size: Point;
    private _Timer: number;
    private _Visible: boolean;
    private _WindowOffset: Point;
    private _WindowOffsetAdjusted: Point;

    constructor(colour: number, size: Point) {
        this._BlinkRate = 500;
        this._BlinkState = BlinkState.Hide;
        // this._Canvas
        this._Colour = '#' + StringUtils.PadLeft(colour.toString(16), '0', 6);
        // this._Context
        this._LastPosition = new Point(1, 1);
        this._Position = new Point(1, 1);
        this._Size = size;
        // this._Timer
        this._Visible = true;
        this._WindowOffset = new Point(0, 0);
        this._WindowOffsetAdjusted = new Point(0, 0);

        this._Timer = setInterval((): void => { this.OnTimer(); }, this._BlinkRate);
    }

    public set BlinkRate(value: number) {
        this._BlinkRate = value;
        clearInterval(this._Timer);
        this._Timer = setInterval((): void => { this.OnTimer(); }, this._BlinkRate);
    }

    public get Colour(): string {
        return this._Colour;
    }

    public set Colour(value: string) {
        this._Colour = value;
    }

    public get LastPosition(): Point {
        return this._LastPosition;
    }

    public set LastPosition(value: Point) {
        this._LastPosition = value;
    }

    private OnTimer(): void {
        // Flip the blink state
        this._BlinkState = (this._BlinkState === BlinkState.Hide) ? BlinkState.Show : BlinkState.Hide;

        // Let the Crt unit know it can blink text now
        switch (this._BlinkState) {
            case BlinkState.Hide: this.onhide.trigger(); break;
            case BlinkState.Show: this.onshow.trigger(); break;
        }
    }

    public get Position(): Point {
        return this._Position;
    }

    public set Position(value: Point) {
        this._Position = value;
    }

    public get Size(): Point {
        return this._Size;
    }

    public set Size(value: Point) {
        this._Size = value;
    }

    public set Visible(value: boolean) {
        this._Visible = value;
    }
}
