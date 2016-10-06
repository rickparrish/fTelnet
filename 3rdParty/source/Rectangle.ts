// Partial port of AS3 Rectangle class
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
