// From: http://stackoverflow.com/a/13382873/342378
class GetScrollbarWidth {
    private static _Width: number;

    public static get Width(): number {
        if (typeof this._Width === 'undefined') {
            var outer = document.createElement('div');
            outer.style.visibility = 'hidden';
            outer.style.width = '100px';
            // TODOX msOverflowStyle not defined outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps

            document.body.appendChild(outer);

            var widthNoScroll = outer.offsetWidth;
            // force scrollbars
            outer.style.overflow = 'scroll';

            // add innerdiv
            var inner = document.createElement('div');
            inner.style.width = '100%';
            outer.appendChild(inner);

            var widthWithScroll = inner.offsetWidth;

            // remove divs
            if (outer.parentNode !== null) {
                outer.parentNode.removeChild(outer);
            }

            this._Width = widthNoScroll - widthWithScroll;
        }
        return this._Width;
    }
}
