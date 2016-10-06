// Partial port of AS3 Point class
class Point {
    public x: number;
    public y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public toString(): string {
        return '[' + this.x.toString(10) + ',' + this.y.toString(10) + ']';
    }
}
