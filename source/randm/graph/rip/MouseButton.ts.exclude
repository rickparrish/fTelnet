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
class MouseButton {
    private _Coords: Rectangle;
    private _Flags: number;
    private _HostCommand: string;
    private _HotKey: string;

    constructor(coords: Rectangle, hostCommand: string, flags: number, hotKey: string) {
        this._Coords = coords;
        this._HostCommand = hostCommand;
        this._Flags = flags;
        this._HotKey = hotKey;
    }

    public get Coords(): Rectangle {
        return this._Coords;
    }

    public DoResetScreen(): boolean {
        return ((this._Flags & 4) == 4);
    }

    public get HotKey(): string {
        return this._HotKey;
    }

    public IsInvertable(): Boolean {
        return ((this._Flags & 2) == 2);
    }

    public get HostCommand(): string {
        return this._HostCommand;
    }
}
