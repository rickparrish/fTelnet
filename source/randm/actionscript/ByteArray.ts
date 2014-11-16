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
class ByteArray {
    // Private variables
    private _Bytes: number[] = [];
    private _Length: number = 0;
    private _Position: number = 0;

    public get bytesAvailable(): number {
        return this._Length - this._Position;
    }

    public clear(): void {
        this._Bytes = [];
        this._Length = 0;
        this._Position = 0;
    }

    public get length(): number {
        return this._Length;
    }

    public set length(value: number) {
        if (value <= 0) {
            this.clear();
        } else {
            if (value < this._Length) {
                this._Bytes.splice(value, this._Length - value);
            } else if (value > this._Length) {
                for (var i: number = this._Length + 1; i <= value; i++) {
                    this._Bytes.push(0);
                }
            }

            this._Length = value;
        }
    }

    public get position(): number {
        return this._Position;
    }

    public set position(value: number) {
        if (value <= 0) {
            value = 0;
        } else if (value >= this._Length) {
            value = this._Length;
        }

        this._Position = value;
    }

    public readBytes(bytes: ByteArray, offset?: number, length?: number): void {
        if (typeof offset === 'undefined') { offset = 0; }
        if (typeof length === 'undefined') { length = 0; }

        if (this._Position + length > this._Length) {
            throw 'There is not sufficient data available to read.';
        }

        var BytesPosition: number = bytes.position;
        bytes.position = offset;

        for (var i: number = 0; i < length; i++) {
            bytes.writeByte(this._Bytes[this._Position++] & 0xFF);
        }

        bytes.position = BytesPosition;
    }

    public readString(length?: number): string {
        if (typeof length === 'undefined') {
            length = this._Length;
        }

        var Result: string = '';
        while ((length-- > 0) && (this._Position < this._Length)) {
            Result += String.fromCharCode(this._Bytes[this._Position++]);
        }

        // Reset if we've read all the data there is to read
        if (this.bytesAvailable === 0) {
            this.clear();
        }

        return Result;
    }

    public readUnsignedByte(): number {
        if (this._Position >= this._Length) {
            throw 'There is not sufficient data available to read.';
        }

        return (this._Bytes[this._Position++] & 0xFF);
    }

    public readUnsignedShort(): number {
        if (this._Position >= (this._Length - 1)) {
            throw 'There is not sufficient data available to read.';
        }

        return ((this._Bytes[this._Position++] & 0xFF) << 8) + (this._Bytes[this._Position++] & 0xFF);
    }

    public toString(): string {
        var Result: string = '';
        for (var i: number = 0; i < this._Length; i++) {
            Result += String.fromCharCode(this._Bytes[i]);
        }

        return Result;
    }

    public writeByte(value: number): void {
        this._Bytes[this._Position++] = (value & 0xFF);
        if (this._Position > this._Length) { this._Length++; }
    }

    public writeBytes(bytes: ByteArray, offset?: number, length?: number): void {
        if (!offset) {
            offset = 0;
        }
        if (!length) {
            length = 0;
        }

        if (offset < 0) {
            offset = 0;
        }
        if (length < 0) {
            return;
        } else if (length === 0) {
            length = bytes.length;
        }

        if (offset >= bytes.length) { offset = 0; }
        if (length > bytes.length) { length = bytes.length; }
        if (offset + length > bytes.length) { length = bytes.length - offset; }

        var BytesPosition: number = bytes.position;
        bytes.position = offset;

        for (var i: number = 0; i < length; i++) {
            this.writeByte(bytes.readUnsignedByte());
        }

        bytes.position = BytesPosition;
    }

    public writeShort(value: number): void {
        this.writeByte((value & 0xFF00) >> 8);
        this.writeByte(value & 0x00FF);
    }

    public writeString(text: string): void {
        var Textlength: number = text.length;
        for (var i: number = 0; i < Textlength; i++) {
            this.writeByte(text.charCodeAt(i));
        }
    }
}
