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
var TCrtProgressBar = function(AParent, ALeft, ATop, AWidth, AStyle) {
    var that = this; 
    var FBarForeColour;
    var FBlankForeColour;
    var FLastBarWidth = 9999;
    var FLastMarqueeUpdate = 0; 
    var FLastPercentText = "";
    var FMarqueeAnimationSpeed;
    var FMaximum;
    var FPercentPrecision;
    var FPercentVisible;
    var FStyle;
    var FValue;

    this.__defineGetter__("BarForeColour", function () {
        return FBarForeColour;
    });

    this.__defineSetter__("BarForeColour", function (ABarForeColour) {
        if (ABarForeColour !== FBarForeColour)
        {
            FBarForeColour = ABarForeColour;
            that.Paint(true);
        }
    });
		
    this.__defineGetter__("BlankForeColour", function () {
        return FBlankForeColour;
    });

    this.__defineSetter__("BlankForeColour", function (ABlankForeColour) {
        if (ABlankForeColour !== FBlankForeColour)
        {
            FBlankForeColour = ABlankForeColour;
            that.Paint(true);
        }
    });
		
    this.__defineGetter__("MarqueeAnimationSpeed", function () {
        return FMarqueeAnimationSpeed;
    });

    this.__defineSetter__("MarqueeAnimationSpeed", function (AMarqueeAnimationSpeed) {
        FMarqueeAnimationSpeed = AMarqueeAnimationSpeed;
    });
		
    this.__defineGetter__("Maximum", function () {
        return FMaximum;
    });

    this.__defineSetter__("Maximum", function (AMaximum) {
        if (AMaximum !== FMaximum)
        {
            FMaximum = AMaximum;
            if (FValue > FMaximum) {
                FValue = FMaximum;
            }
            that.Paint(true);
        }
    });
		
    /// <summary>
    /// Re-Draw the bar and percent text.
    /// </summary>
    /// <param name="AForce">When true, the bar and percent will always be Paintn.  When false, the bar and percent will only be Paintn as necessary, which reduces the number of unnecessary Paints (especially when a large maximum is used)</param>
    this.PaintCrtProgressBar = function (AForce) {
        if (FStyle === ProgressBarStyle.Marquee) {
            if (AForce) {
                // Erase the old bar
                Crt.FastWrite(StringUtils.NewString(String.fromCharCode(176), that.Width), that.ScreenLeft, that.ScreenTop, new TCharInfo(" ", FBlankForeColour + (that.BackColour << 4)));
            }

            // Draw the new bar
            if (FValue > 0) {
                if (FValue > that.Width) {
                    Crt.FastWrite(String.fromCharCode(176), that.ScreenLeft + that.Width - (15 - Math.floor(FValue - that.Width)), that.ScreenTop, new TCharInfo(" ", FBlankForeColour + (that.BackColour << 4)));
                }
                else if (FValue >= 15) {
                    Crt.FastWrite(StringUtils.NewString(String.fromCharCode(219), Math.min(FValue, 15)), that.ScreenLeft + FValue - 15, that.ScreenTop, new TCharInfo(" ", FBarForeColour + (that.BackColour << 4)));
                    Crt.FastWrite(String.fromCharCode(176), that.ScreenLeft + FValue - 15, that.ScreenTop, new TCharInfo(" ", FBlankForeColour + (that.BackColour << 4)));
                }
                else {
                    Crt.FastWrite(StringUtils.NewString(String.fromCharCode(219), Math.min(FValue, 15)), that.ScreenLeft, that.ScreenTop, new TCharInfo(" ", FBarForeColour + (that.BackColour << 4)));
                }
            }
        }
        else {
            // Check if we're forcing an update (probably due to a change in Left, Top, Width, etc)
            if (AForce) {
                // Yep, so reset the "Last" variables
                FLastBarWidth = 9999;
                FLastPercentText = "";
            }

            var PaintPercentText = false;
            var Percent = FValue / FMaximum;
            var NewBarWidth = Math.floor(Percent * that.Width);
            if (NewBarWidth !== FLastBarWidth) {
                // Check if the bar shrank (if so, we need to delete the old bar)
                if (NewBarWidth < FLastBarWidth) {
                    // Erase the old bar
                    Crt.FastWrite(StringUtils.NewString(String.fromCharCode(176), that.Width), that.ScreenLeft, that.ScreenTop, new TCharInfo(" ", FBlankForeColour + (that.BackColour << 4)));
                }

                // Draw the new bar
                Crt.FastWrite(StringUtils.NewString(String.fromCharCode(FStyle), NewBarWidth), that.ScreenLeft, that.ScreenTop, new TCharInfo(" ", FBarForeColour + (that.BackColour << 4)));

                FLastBarWidth = NewBarWidth;
                PaintPercentText = true;
            }

            // Draw the percentage
            if (FPercentVisible) {
                var NewPercentText = StringUtils.FormatPercent(Percent, FPercentPrecision);
                if ((NewPercentText !== FLastPercentText) || (PaintPercentText)) {
                    FLastPercentText = NewPercentText;

                    var ProgressStart = Math.round((that.Width - NewPercentText.length) / 2);
                    if (ProgressStart >= NewBarWidth) {
                        // Bar hasn't reached the percent text, so draw in the bar's empty color
                        Crt.FastWrite(NewPercentText, that.ScreenLeft + ProgressStart, that.ScreenTop, new TCharInfo(" ", FBlankForeColour + (that.BackColour << 4)));
                    }
                    else if (ProgressStart + NewPercentText.length <= NewBarWidth) {
                        // Bar has passed the percent text, so draw in the bar's foreground colour (or still use background for Blocks)
                        Crt.FastWrite(NewPercentText, that.ScreenLeft + ProgressStart, that.ScreenTop, new TCharInfo(" ", that.BackColour + (FBarForeColour << 4)));
                    }
                    else {
                        // Bar is in the middle of the percent text, so draw the colour as necessary for each letter in the text
                        var i;
                        for (i = 0; i < NewPercentText.length; i++) {
                            var LetterPosition = ProgressStart + i;
                            var FG = (LetterPosition >= NewBarWidth) ? FBlankForeColour : that.BackColour;
                            var BG = (LetterPosition >= NewBarWidth) ? that.BackColour : FBarForeColour;
                            Crt.FastWrite(NewPercentText.charAt(i), that.ScreenLeft + LetterPosition, that.ScreenTop, new TCharInfo(" ", FG + (BG << 4)));
                        }
                    }
                }
            }
        }
    };

    this.__defineGetter__("PercentPrecision", function () {
        return FPercentPrecision;
    });

    this.__defineSetter__("PercentPrecision", function (APercentPrecision) {
        if (APercentPrecision !== FPercentPrecision)
        {
            FPercentPrecision = APercentPrecision;
            that.Paint(true);
        }
    });
		
    this.__defineGetter__("PercentVisible", function () {
        return FPercentVisible;
    });

    this.__defineSetter__("PercentVisible", function (APercentVisible) {
        if (APercentVisible !== FPercentVisible)
        {
            FPercentVisible = APercentVisible;
            that.Paint(true);
        }
    });
		
    this.Step = function() {
        that.StepBy(1);
    };
		
    this.StepBy = function(ABy) {
        that.Value += ABy;
    };
		
    this.__defineGetter__("Style", function () {
        return FStyle;
    });

    this.__defineSetter__("Style", function (AStyle) {
        if (AStyle !== FStyle)
        {
            FStyle = AStyle;
            that.Paint(true);
        }
    });

    this.__defineGetter__("Value", function () {
        return FValue;
    });

    this.__defineSetter__("Value", function (AValue) {
        if (AValue !== FValue)
        {
            if (FStyle === ProgressBarStyle.Marquee)
            {
                if ((new Date()) - FLastMarqueeUpdate >= FMarqueeAnimationSpeed)
                {
                    // Keep value between 0 and Maximum + 15
                    if (AValue < 0) {
                        AValue = 0;
                    }
                    if (AValue >= that.Width + 15) {
                        AValue = 0;
                    }
                    FValue = AValue;
                    that.Paint(false);
                    FLastMarqueeUpdate = new Date();
                }
            }
            else
            {
                // Keep value between 0 and Maximum
                FValue = Math.max(0, Math.min(AValue, FMaximum));
                that.Paint(false);
            }
        }
    });

    // Constructor
    TCrtControl.call(this, AParent, ALeft, ATop, AWidth, 1);

    FStyle = AStyle;
			
    that.BackColour = Crt.BLUE;
    FBarForeColour = Crt.YELLOW; // TODO This causes blinking orange background behind percent text since Crt unit doesn't support high backgrounds unless you disable blink (so this note is to remind me to allow high backgrounds AND blink, like fTelnet)
    FBlankForeColour = Crt.LIGHTGRAY;
    FLastMarqueeUpdate = new Date();
    FMarqueeAnimationSpeed = 25;
    FMaximum = 100;
    FPercentPrecision = 2;
    FPercentVisible = true;
    FValue = 0;
			
    that.Paint(true);
};

TCrtProgressBar.prototype = new TCrtControlSurrogate();
TCrtProgressBar.prototype.constructor = TCrtProgressBar;

TCrtProgressBar.prototype.Paint = function (AForce) {
    this.PaintCrtProgressBar();
};