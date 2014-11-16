// From: http://javascript.info/tutorial/coordinates
module Offset {
    'use strict';
    function getOffsetSum(elem: HTMLElement): Point {
        var top: number = 0, left: number = 0;

        while (elem) {
            top = top + elem.offsetTop;
            left = left + elem.offsetLeft;
            elem = <HTMLElement>elem.offsetParent;
        }

        return { y: top, x: left };
    }

    function getOffsetRect(elem: HTMLElement): Point {
        var box: ClientRect = elem.getBoundingClientRect();

        var body: HTMLElement = document.body;
        var docElem: HTMLElement = document.documentElement;

        var scrollTop: number = window.pageYOffset || docElem.scrollTop || body.scrollTop;
        var scrollLeft: number = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;

        var clientTop: number = docElem.clientTop || body.clientTop || 0;
        var clientLeft: number = docElem.clientLeft || body.clientLeft || 0;

        var top: number = box.top + scrollTop - clientTop;
        var left: number = box.left + scrollLeft - clientLeft;

        return { y: Math.round(top), x: Math.round(left) };
    }

    export function getOffset(elem: HTMLElement): Point {
        if (elem.getBoundingClientRect) {
            return getOffsetRect(elem);
        } else {
            return getOffsetSum(elem);
        }
    }
}
