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
// Set based on whether we're debugging or not
var DEBUG = false;

// Used by embedded PNG assets encoded in base64
var PNGAsset = "data:image/png;base64,";

// Emulate legacy getter/setter API using ES5 APIs
// This allows IE9 to use __defineGetter__ and __defineSetter__
try {
    if (!Object.prototype.__defineGetter__ && Object.defineProperty({}, "x", { get: function () { return true; } }).x) {
        Object.defineProperty(Object.prototype, "__defineGetter__",
            { enumerable: false, configurable: true,
                value: function (name, func) {
                    Object.defineProperty(this, name,
                 { get: func, enumerable: true, configurable: true });
                }
            });
        Object.defineProperty(Object.prototype, "__defineSetter__",
            { enumerable: false, configurable: true,
                value: function (name, func) {
                    Object.defineProperty(this, name,
                 { set: func, enumerable: true, configurable: true });
                }
            });
    }
} catch (defPropException) {
    // Create a dummy function since the above failed (prevents errors with IE8)
    if (!Object.prototype.__defineGetter__) {
        Object.prototype.__defineGetter__ = function (prop, get) {
            // Do nothing
        };
        Object.prototype.__defineSetter__ = function (prop, set) {
            // Do nothing
        };
    }
}

// This allows IE to use addEventListener and removeEventListener
if (!Object.prototype.addEventListener && Object.attachEvent) {
    Object.defineProperty(Object.prototype, "addEventListener",
         { enumerable: false, configurable: true,
             value: function (eventname, func) {
                 Object.attachEvent("on" + eventname, func);
             }
         });
    Object.defineProperty(Object.prototype, "removeEventListener",
         { enumerable: false, configurable: true,
             value: function (eventname, func) {
                 Object.detachEvent("on" + eventname, func);
             }
         });
}

// This determines an elements position on the page
function getElementPosition(elem) {
    var offsetTrail = (typeof (elem) === "string") ? document.getElementById(elem) : elem;
    var offsetLeft = 0;
    var offsetTop = 0;
    while (offsetTrail) {
        offsetLeft += offsetTrail.offsetLeft;
        offsetTop += offsetTrail.offsetTop;
        offsetTrail = offsetTrail.offsetParent;
    }
    if (navigator.userAgent.indexOf('Mac') !== -1 && typeof document.body.leftMargin !== 'undefined') {
        offsetLeft += document.body.leftMargin;
        offsetTop += document.body.topMargin;
    }
    return new Point(offsetLeft, offsetTop);
}

// This adds a trace message to the javascript error console
function trace(AText) {
    try {
        console.log("trace: " + AText);
    } catch (e) {
        if (DEBUG) {
            setTimeout(function () { throw new Error("trace: " + AText); }, 0); 
        }
    }
}
