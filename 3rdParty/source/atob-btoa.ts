// From: Unknown, forgot to save the url!

// Base64 utility methods
// Needed for: IE9-
(function (): void {
    if ('atob' in window && 'btoa' in window) { return; }

    var B64_ALPHABET: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    function atob(input: string): string {
        input = String(input);
        var position: number = 0,
            output: string[] = [],
            buffer: number = 0, bits: number = 0, n: number;
        input = input.replace(/\s/g, '');
        if ((input.length % 4) === 0) { input = input.replace(/=+$/, ''); }
        if ((input.length % 4) === 1) { throw Error('InvalidCharacterError'); }
        if (/[^+/0-9A-Za-z]/.test(input)) { throw Error('InvalidCharacterError'); }
        while (position < input.length) {
            n = B64_ALPHABET.indexOf(input.charAt(position));
            buffer = (buffer << 6) | n;
            bits += 6;
            if (bits === 24) {
                output.push(String.fromCharCode((buffer >> 16) & 0xFF));
                output.push(String.fromCharCode((buffer >> 8) & 0xFF));
                output.push(String.fromCharCode(buffer & 0xFF));
                bits = 0;
                buffer = 0;
            }
            position += 1;
        }
        if (bits === 12) {
            buffer = buffer >> 4;
            output.push(String.fromCharCode(buffer & 0xFF));
        } else if (bits === 18) {
            buffer = buffer >> 2;
            output.push(String.fromCharCode((buffer >> 8) & 0xFF));
            output.push(String.fromCharCode(buffer & 0xFF));
        }
        return output.join('');
    };
    function btoa(input: string): string {
        input = String(input);
        var position: number = 0,
            out: string[] = [],
            o1: number, o2: number, o3: number,
            e1: number, e2: number, e3: number, e4: number;
        if (/[^\x00-\xFF]/.test(input)) { throw Error('InvalidCharacterError'); }
        while (position < input.length) {
            o1 = input.charCodeAt(position++);
            o2 = input.charCodeAt(position++);
            o3 = input.charCodeAt(position++);
            // 111111 112222 222233 333333
            e1 = o1 >> 2;
            e2 = ((o1 & 0x3) << 4) | (o2 >> 4);
            e3 = ((o2 & 0xf) << 2) | (o3 >> 6);
            e4 = o3 & 0x3f;
            if (position === input.length + 2) {
                e3 = 64;
                e4 = 64;
            } else if (position === input.length + 1) {
                e4 = 64;
            }
            out.push(B64_ALPHABET.charAt(e1),
                B64_ALPHABET.charAt(e2),
                B64_ALPHABET.charAt(e3),
                B64_ALPHABET.charAt(e4));
        }
        return out.join('');
    };
    window.atob = atob;
    window.btoa = btoa;
} ());
