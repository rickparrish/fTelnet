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
class CrtControl {
    private _BackColour: number = Crt.BLACK;
    private _Background: CharInfo[][] = null;
    private _Controls: CrtControl[] = [];
    private _ForeColour: number = Crt.LIGHTGRAY;
    private _Height: number;
    private _Left: number;
    private _Parent: CrtControl = null;
    private _Top: number;
    private _Width: number;

    constructor(parent: CrtControl, left: number, top: number, width: number, height: number) {
        this._Parent = parent;
        this._Left = left;
        this._Top = top;
        this._Width = width;
        this._Height = height;

        this.SaveBackground();

        if (this._Parent !== null) {
            parent.AddControl(this);
        }
    }

    public AddControl(child: CrtControl): void {
        this._Controls.push(child);
    }

    public get BackColour(): number {
        return this._BackColour;
    }

    public set BackColour(value: number) {
        if (value !== this._BackColour) {
            this._BackColour = value;
            this.Paint(true);
        }
    }

    public get ForeColour(): number {
        return this._ForeColour;
    }

    public set ForeColour(value: number) {
        if (value !== this._ForeColour) {
            this._ForeColour = value;
            this.Paint(true);
        }
    }

    public get Height(): number {
        return this._Height;
    }

    public set Height(value: number) {
        if (value !== this._Height) {
            this.RestoreBackground();
            this._Height = value;
            this.SaveBackground();
            this.Paint(true);
        }
    }

    public Hide(): void {
        this.RestoreBackground();
    }

    public get Left(): number {
        return this._Left;
    }

    public set Left(value: number) {
        if (value !== this._Left) {
            this.RestoreBackground();
            this._Left = value;
            this.SaveBackground();
            this.Paint(true);

            for (var i: number = 0; i < this._Controls.length; i++) {
                this._Controls[i].Paint(true);
            }
        }
    }

    public Paint(force: boolean): void {
        // Override in base class
    }

    public get Parent(): CrtControl {
        return this._Parent;
    }

    public set Parent(value: CrtControl) {
        this.RestoreBackground();
        this._Parent = value;
        this.SaveBackground();
        this.Paint(true);
    }

    private RestoreBackground(): void {
        var Left: number = this._Left;
        var Top: number = this._Top;
        var P: CrtControl = this._Parent;
        while (P) {
            Left += P.Left;
            Top += P.Top;
            P = P.Parent;
        }
        Crt.RestoreScreen(this._Background, Left, Top, Left + this._Width - 1, Top + this._Height - 1);
    }

    private SaveBackground(): void {
        var Left: number = this._Left;
        var Top: number = this._Top;
        var P: CrtControl = this._Parent;
        while (P) {
            Left += P.Left;
            Top += P.Top;
            P = P.Parent;
        }
        this._Background = Crt.SaveScreen(Left, Top, Left + this._Width - 1, Top + this._Height - 1);
    }

    public get ScreenLeft(): number {
        return this._Left + ((this._Parent === null) ? 0 : this._Parent.Left);
    }

    public get ScreenTop(): number {
        return this._Top + ((this._Parent === null) ? 0 : this._Parent.Top);
    }

    public Show(): void {
        this.Paint(true);

        for (var i: number = 0; i < this._Controls.length; i++) {
            this._Controls[i].Paint(true);
        }
    }

    public get Top(): number {
        return this._Top;
    }

    public set Top(value: number) {
        if (value !== this._Top) {
            this.RestoreBackground();
            this._Top = value;
            this.SaveBackground();
            this.Paint(true);

            for (var i: number = 0; i < this._Controls.length; i++) {
                this._Controls[i].Paint(true);
            }
        }
    }

    public get Width(): number {
        return this._Width;
    }

    public set Width(value: number) {
        if (value !== this._Width) {
            this.RestoreBackground();
            this._Width = value;
            this.SaveBackground();
            this.Paint(true);
        }
    }
}
