/**
 * MD5 hash function implementation
 * @param string The string to hash
 * @returns The hex MD5 hash
 */
export function hex_md5(string: string): string {
    function rotateLeft(value: number, shift: number) {
        return (value << shift) | (value >>> (32 - shift));
    }
    
    function addUnsigned(a: number, b: number) {
        var lsw = (a & 0xFFFF) + (b & 0xFFFF);
        var msw = (a >> 16) + (b >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    }
    
    function F(x: number, y: number, z: number) {
        return (x & y) | (~x & z);
    }
    
    function G(x: number, y: number, z: number) {
        return (x & z) | (y & ~z);
    }
    
    function H(x: number, y: number, z: number) {
        return x ^ y ^ z;
    }
    
    function I(x: number, y: number, z: number) {
        return y ^ (x | ~z);
    }
    
    function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
        a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    
    function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
        a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    
    function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
        a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    
    function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
        a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    
    function stringToWordArray(string: string) {
        var wordArray: number[] = [];
        for (var i = 0; i < 8 * string.length; i += 8) {
            wordArray[i >> 5] |= (string.charCodeAt(i / 8) & 0xFF) << (i % 32);
        }
        return wordArray;
    }
    
    function wordArrayToHex(wordArray: number[]) {
        var hexChars = "0123456789abcdef";
        var hexString = "";
        for (var i = 0; i < 4 * wordArray.length; i++) {
            hexString += hexChars.charAt((wordArray[i >> 2] >> ((i % 4) * 8 + 4)) & 0xF) +
                        hexChars.charAt((wordArray[i >> 2] >> ((i % 4) * 8)) & 0xF);
        }
        return hexString;
    }
    
    function coreMD5(x: any[], len: number) {
        x[len >> 5] |= 0x80 << ((len) % 32);
        x[14 + (((len + 64) >>> 9) << 4)] = len;
        
        var a = 1732584193;
        var b = -271733879;
        var c = -1732584194;
        var d = 271733878;
        
        for (var i = 0; i < x.length; i += 16) {
            var olda = a;
            var oldb = b;
            var oldc = c;
            var oldd = d;
            
            a = FF(a, b, c, d, x[i + 0], 7, -680876936);
            d = FF(d, a, b, c, x[i + 1], 12, -389564586);
            c = FF(c, d, a, b, x[i + 2], 17, 606105819);
            b = FF(b, c, d, a, x[i + 3], 22, -1044525330);
            a = FF(a, b, c, d, x[i + 4], 7, -176418897);
            d = FF(d, a, b, c, x[i + 5], 12, 1200080426);
            c = FF(c, d, a, b, x[i + 6], 17, -1473231341);
            b = FF(b, c, d, a, x[i + 7], 22, -45705983);
            a = FF(a, b, c, d, x[i + 8], 7, 1770035416);
            d = FF(d, a, b, c, x[i + 9], 12, -1958414417);
            c = FF(c, d, a, b, x[i + 10], 17, -42063);
            b = FF(b, c, d, a, x[i + 11], 22, -1990404162);
            a = FF(a, b, c, d, x[i + 12], 7, 1804603682);
            d = FF(d, a, b, c, x[i + 13], 12, -40341101);
            c = FF(c, d, a, b, x[i + 14], 17, -1502002290);
            b = FF(b, c, d, a, x[i + 15], 22, 1236535329);
            
            a = GG(a, b, c, d, x[i + 1], 5, -165796510);
            d = GG(d, a, b, c, x[i + 6], 9, -1069501632);
            c = GG(c, d, a, b, x[i + 11], 14, 643717713);
            b = GG(b, c, d, a, x[i + 0], 20, -373897302);
            a = GG(a, b, c, d, x[i + 5], 5, -701558691);
            d = GG(d, a, b, c, x[i + 10], 9, 38016083);
            c = GG(c, d, a, b, x[i + 15], 14, -660478335);
            b = GG(b, c, d, a, x[i + 4], 20, -405537848);
            a = GG(a, b, c, d, x[i + 9], 5, 568446438);
            d = GG(d, a, b, c, x[i + 14], 9, -1019803690);
            c = GG(c, d, a, b, x[i + 3], 14, -187363961);
            b = GG(b, c, d, a, x[i + 8], 20, 1163531501);
            a = GG(a, b, c, d, x[i + 13], 5, -1444681467);
            d = GG(d, a, b, c, x[i + 2], 9, -51403784);
            c = GG(c, d, a, b, x[i + 7], 14, 1735328473);
            b = GG(b, c, d, a, x[i + 12], 20, -1926607734);
            
            a = HH(a, b, c, d, x[i + 5], 4, -378558);
            d = HH(d, a, b, c, x[i + 8], 11, -2022574463);
            c = HH(c, d, a, b, x[i + 11], 16, 1839030562);
            b = HH(b, c, d, a, x[i + 14], 23, -35309556);
            a = HH(a, b, c, d, x[i + 1], 4, -1530992060);
            d = HH(d, a, b, c, x[i + 4], 11, 1272893353);
            c = HH(c, d, a, b, x[i + 7], 16, -155497632);
            b = HH(b, c, d, a, x[i + 10], 23, -1094730640);
            a = HH(a, b, c, d, x[i + 13], 4, 681279174);
            d = HH(d, a, b, c, x[i + 0], 11, -358537222);
            c = HH(c, d, a, b, x[i + 3], 16, -722521979);
            b = HH(b, c, d, a, x[i + 6], 23, 76029189);
            a = HH(a, b, c, d, x[i + 9], 4, -640364487);
            d = HH(d, a, b, c, x[i + 12], 11, -421815835);
            c = HH(c, d, a, b, x[i + 15], 16, 530742520);
            b = HH(b, c, d, a, x[i + 2], 23, -995338651);
            
            a = II(a, b, c, d, x[i + 0], 6, -198630844);
            d = II(d, a, b, c, x[i + 7], 10, 1126891415);
            c = II(c, d, a, b, x[i + 14], 15, -1416354905);
            b = II(b, c, d, a, x[i + 5], 21, -57434055);
            a = II(a, b, c, d, x[i + 12], 6, 1700485571);
            d = II(d, a, b, c, x[i + 3], 10, -1894986606);
            c = II(c, d, a, b, x[i + 10], 15, -1051523);
            b = II(b, c, d, a, x[i + 1], 21, -2054922799);
            a = II(a, b, c, d, x[i + 8], 6, 1873313359);
            d = II(d, a, b, c, x[i + 15], 10, -30611744);
            c = II(c, d, a, b, x[i + 6], 15, -1560198380);
            b = II(b, c, d, a, x[i + 13], 21, 1309151649);
            a = II(a, b, c, d, x[i + 4], 6, -145523070);
            d = II(d, a, b, c, x[i + 11], 10, -1120210379);
            c = II(c, d, a, b, x[i + 2], 15, 718787259);
            b = II(b, c, d, a, x[i + 9], 21, -343485551);
            
            a = addUnsigned(a, olda);
            b = addUnsigned(b, oldb);
            c = addUnsigned(c, oldc);
            d = addUnsigned(d, oldd);
        }
        
        return [a, b, c, d];
    }
    
    var wordArray = stringToWordArray(string);
    var hash = coreMD5(wordArray, 8 * string.length);
    return wordArrayToHex(hash);
}
