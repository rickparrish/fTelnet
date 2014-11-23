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
class Cursor {
    // Events
    public onhide: IEvent = new TypedEvent();
    public onshow: IEvent = new TypedEvent();

    // Private variables
    private _BlinkRate: number;
    private _BlinkState: BlinkState;
    private _Canvas: HTMLCanvasElement;
    private _Colour: string;
    private _Context: CanvasRenderingContext2D;
    private _Position: Point;
    private _Size: Point;
    private _Timer: number;
    private _Visible: boolean;
    private _WindowOffset: Point;
    private _WindowOffsetAdjusted: Point;

    constructor(parent: HTMLElement, colour: number, size: Point) {
        this._BlinkRate = 500;
        this._BlinkState = BlinkState.Hide;
        // this._Canvas
        this._Colour = '#' + colour.toString(16);
        // this._Context
        this._Position = new Point(1, 1);
        this._Size = size;
        // this._Timer
        this._Visible = true;
        this._WindowOffset = new Point(0, 0);
        this._WindowOffsetAdjusted = new Point(0, 0);

        this._Canvas = document.createElement('canvas');
        if (this._Canvas.getContext) {
            this._Canvas.style.position = 'absolute';
            this._Context = this._Canvas.getContext('2d');
            parent.appendChild(this._Canvas);

            // Draw the initial position
            this.Update();
            this.Draw();

            // Start the I/O timer
            this._Timer = setInterval((): void => { this.OnTimer(); }, this._BlinkRate);
        }
    }

    public set BlinkRate(value: number) {
        this._BlinkRate = value;
        clearInterval(this._Timer);
        this._Timer = setInterval((): void => { this.OnTimer(); }, this._BlinkRate);
    }

    public set Colour(value: string) {
        this._Colour = value;
        this.Draw();
    }

    private Draw(): void {
        if (this._Context) {
            this._Canvas.width = this._Size.x;
            this._Canvas.height = this._Size.y;

            this._Context.fillStyle = this._Colour;
            this._Context.fillRect(0, this._Size.y - (this._Size.y * 0.20), this._Size.x, this._Size.y * 0.20);
        }
    }

    private OnTimer(): void {
        // Flip the blink state
        this._BlinkState = (this._BlinkState === BlinkState.Hide) ? BlinkState.Show : BlinkState.Hide;

        // Update the opacity
        if (this._Visible) {
            // Set the opacity to the desired state
            this._Canvas.style.opacity = (this._BlinkState === BlinkState.Hide) ? '0' : '1';
        } else {
            // Set the opacity to off
            this._Canvas.style.opacity = '0';
        }

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
        this.Update();
    }

    public set Size(value: Point) {
        this._Size = value;
        this.Draw();
        this.Update();
    }

    private Update(): void {
        if (this._Canvas && this._Visible) {
            this._Canvas.style.left = (this._Position.x - 1) * this._Size.x + this._WindowOffsetAdjusted.x + 'px';
            this._Canvas.style.top = (this._Position.y - 1) * this._Size.y + this._WindowOffsetAdjusted.y + 'px';
        }
    }

    public set Visible(value: boolean) {
        this._Visible = value;
        if (this._Visible) { this.Update(); }
    }

    public set WindowOffset(value: Point) {
        // Store new window offset
        if ((value.x !== this._WindowOffset.x) || (value.y !== this._WindowOffset.y)) {
            this._WindowOffset = value;

            // Reset button position
            this._Canvas.style.left = '0px';
            this._Canvas.style.top = '0px';
            var CursorPosition: Point = Offset.getOffset(this._Canvas);

            this._WindowOffsetAdjusted.x = value.x - CursorPosition.x;
            this._WindowOffsetAdjusted.y = value.y - CursorPosition.y;

            this.Update();
        }
    }
}
