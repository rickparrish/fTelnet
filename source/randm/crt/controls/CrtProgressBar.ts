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
class CrtProgressBar extends CrtControl {
    private _BarForeColour: number;
    private _BlankForeColour: number;
    private _LastBarWidth: number = 9999;
    private _LastMarqueeUpdate: number = 0;
    private _LastPercentText: string = '';
    private _MarqueeAnimationSpeed: number;
    private _Maximum: number;
    private _PercentPrecision: number;
    private _PercentVisible: boolean;
    private _Style: ProgressBarStyle;
    private _Value: number;

constructor(parent: CrtControl, left: number, top: number, width: number, style: ProgressBarStyle) {
    super(parent, left, top, width, 1);

    this._Style = style;

    this.BackColour = Crt.BLUE;
    this._BarForeColour = Crt.YELLOW; // TODO This causes blinking orange background behind percent text since Crt unit 
                                      // doesn't support high backgrounds unless you disable blink (so this note is to 
                                      // remind me to allow high backgrounds AND blink, like fTelnet)
    this._BlankForeColour = Crt.LIGHTGRAY;
    this._LastMarqueeUpdate = new Date().getTime();
    this._MarqueeAnimationSpeed = 25;
    this._Maximum = 100;
    this._PercentPrecision = 2;
    this._PercentVisible = true;
    this._Value = 0;

    this.Paint(true);
}

    public get BarForeColour(): number {
        return this._BarForeColour;
    }

    public set BarForeColour(value: number) {
        if (value !== this._BarForeColour) {
            this._BarForeColour = value;
            this.Paint(true);
        }
    }

    public get BlankForeColour(): number {
        return this._BlankForeColour;
    }

    public set BlankForeColour(value: number) {
        if (value !== this._BlankForeColour) {
            this._BlankForeColour = value;
            this.Paint(true);
        }
    }

    public get MarqueeAnimationSpeed(): number {
        return this._MarqueeAnimationSpeed;
    }

    public set MarqueeAnimationSpeed(value: number) {
        this._MarqueeAnimationSpeed = value;
    }

    public get Maximum(): number {
        return this._Maximum;
    }

    public set Maximum(value: number) {
        if (value !== this._Maximum) {
            this._Maximum = value;
            if (this._Value > this._Maximum) {
                this._Value = this._Maximum;
            }
            this.Paint(true);
        }
    }

    /// <summary>
    /// Re-Draw the bar and percent text.
    /// </summary>
    /// <param name='AForce'>When true, the bar and percent will always be Paintn.  
    ///   When false, the bar and percent will only be Paintn as necessary, which reduces the number of unnecessary 
    ///   Paints(especially when a large maximum is used)</param>
    public Paint(force: boolean): void {
        if (this._Style === ProgressBarStyle.Marquee) {
            if (force) {
                // Erase the old bar
                Crt.FastWrite(StringUtils.NewString(String.fromCharCode(176), this.Width), this.ScreenLeft, this.ScreenTop, new CharInfo(' ', this._BlankForeColour + (this.BackColour << 4)));
            }

            // Draw the new bar
            if (this._Value > 0) {
                if (this._Value > this.Width) {
                    Crt.FastWrite(String.fromCharCode(176), this.ScreenLeft + this.Width - (15 - Math.floor(this._Value - this.Width)), this.ScreenTop, new CharInfo(' ', this._BlankForeColour + (this.BackColour << 4)));
                } else if (this._Value >= 15) {
                    Crt.FastWrite(StringUtils.NewString(String.fromCharCode(219), Math.min(this._Value, 15)), this.ScreenLeft + this._Value - 15, this.ScreenTop, new CharInfo(' ', this._BarForeColour + (this.BackColour << 4)));
                    Crt.FastWrite(String.fromCharCode(176), this.ScreenLeft + this._Value - 15, this.ScreenTop, new CharInfo(' ', this._BlankForeColour + (this.BackColour << 4)));
                } else {
                    Crt.FastWrite(StringUtils.NewString(String.fromCharCode(219), Math.min(this._Value, 15)), this.ScreenLeft, this.ScreenTop, new CharInfo(' ', this._BarForeColour + (this.BackColour << 4)));
                }
            }
        } else {
            // Check if we're forcing an update (probably due to a change in Left, Top, Width, etc)
            if (force) {
                // Yep, so reset the 'Last' variables
                this._LastBarWidth = 9999;
                this._LastPercentText = '';
            }

            var PaintPercentText: boolean = false;
            var Percent: number = this._Value / this._Maximum;
            var NewBarWidth: number = Math.floor(Percent * this.Width);
            if (NewBarWidth !== this._LastBarWidth) {
                // Check if the bar shrank (if so, we need to delete the old bar)
                if (NewBarWidth < this._LastBarWidth) {
                    // Erase the old bar
                    Crt.FastWrite(StringUtils.NewString(String.fromCharCode(176), this.Width), this.ScreenLeft, this.ScreenTop, new CharInfo(' ', this._BlankForeColour + (this.BackColour << 4)));
                }

                // Draw the new bar
                Crt.FastWrite(StringUtils.NewString(String.fromCharCode(this._Style), NewBarWidth), this.ScreenLeft, this.ScreenTop, new CharInfo(' ', this._BarForeColour + (this.BackColour << 4)));

                this._LastBarWidth = NewBarWidth;
                PaintPercentText = true;
            }

            // Draw the percentage
            if (this._PercentVisible) {
                var NewPercentText: string = StringUtils.FormatPercent(Percent, this._PercentPrecision);
                if ((NewPercentText !== this._LastPercentText) || (PaintPercentText)) {
                    this._LastPercentText = NewPercentText;

                    var ProgressStart: number = Math.round((this.Width - NewPercentText.length) / 2);
                    if (ProgressStart >= NewBarWidth) {
                        // Bar hasn't reached the percent text, so draw in the bar's empty color
                        Crt.FastWrite(NewPercentText, this.ScreenLeft + ProgressStart, this.ScreenTop, new CharInfo(' ', this._BlankForeColour + (this.BackColour << 4)));
                    } else if (ProgressStart + NewPercentText.length <= NewBarWidth) {
                        // Bar has passed the percent text, so draw in the bar's foreground colour 
                        // (or still use background for Blocks)
                        Crt.FastWrite(NewPercentText, this.ScreenLeft + ProgressStart, this.ScreenTop, new CharInfo(' ', this.BackColour + (this._BarForeColour << 4)));
                    } else {
                        // Bar is in the middle of the percent text, so draw the colour as necessary for each letter in the text
                        for (var i: number = 0; i < NewPercentText.length; i++) {
                            var LetterPosition: number = ProgressStart + i;
                            var FG: number = (LetterPosition >= NewBarWidth) ? this._BlankForeColour : this.BackColour;
                            var BG: number = (LetterPosition >= NewBarWidth) ? this.BackColour : this._BarForeColour;
                            Crt.FastWrite(NewPercentText.charAt(i), this.ScreenLeft + LetterPosition, this.ScreenTop, new CharInfo(' ', FG + (BG << 4)));
                        }
                    }
                }
            }
        }
    }

    public get PercentPrecision(): number {
        return this._PercentPrecision;
    }

    public set PercentPrecision(value: number) {
        if (value !== this._PercentPrecision) {
            this._PercentPrecision = value;
            this.Paint(true);
        }
    }

    public get PercentVisible(): boolean {
        return this._PercentVisible;
    }

    public set PercentVisible(value: boolean) {
        if (value !== this._PercentVisible) {
            this._PercentVisible = value;
            this.Paint(true);
        }
    }

    public Step(): void {
        this.StepBy(1);
    }

    public StepBy(count: number): void {
        this.Value += count;
    }

    public get Style(): ProgressBarStyle {
        return this._Style;
    }

    public set Style(style: ProgressBarStyle) {
        if (style !== this._Style) {
            this._Style = style;
            this.Paint(true);
        }
    }

    public get Value(): number {
        return this._Value;
    }

    public set Value(value: number) {
        if (value !== this._Value) {
            if (this._Style === ProgressBarStyle.Marquee) {
                if ((new Date()).getTime() - this._LastMarqueeUpdate >= this._MarqueeAnimationSpeed) {
                    // Keep value between 0 and Maximum + 15
                    if (value < 0) {
                        value = 0;
                    }
                    if (value >= this.Width + 15) {
                        value = 0;
                    }
                    this._Value = value;
                    this.Paint(false);
                    this._LastMarqueeUpdate = (new Date()).getTime();
                }
            } else {
                // Keep value between 0 and Maximum
                this._Value = Math.max(0, Math.min(value, this._Maximum));
                this.Paint(false);
            }
        }
    }
}
