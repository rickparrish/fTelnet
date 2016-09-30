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
class Rectangle {
    public height: number = 0;
    public width: number = 0;
    public x: number = 0;
    public y: number = 0;

    constructor(x?: number, y?: number, width?: number, height?: number) {
        if (typeof x !== 'undefined') { this.x = x; }
        if (typeof y !== 'undefined') { this.y = y; }
        if (typeof width !== 'undefined') { this.width = width; }
        if (typeof height !== 'undefined') { this.height = height; }
    }

    public get bottom(): number {
        return this.y + this.height;
    }

    public set bottom(value: number) {
        this.height = value - this.top;
    }

    public get left(): number {
        return this.x;
    }

    public set left(value: number) {
        this.width = this.right - value;
        this.x = value;
    }

    public get right(): number {
        return this.x + this.width;
    }

    public set right(value: number) {
        this.width = value - this.left;
    }

    public get top(): number {
        return this.y;
    }

    public set top(value: number) {
        this.height = this.bottom - value;
        this.y = value;
    }
}
