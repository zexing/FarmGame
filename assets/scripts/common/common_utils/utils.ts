export class utils {
    static fixFloatNumber(n: number, len: number = 2): number {
        if (n && len >= 0) {
            return Number(n.toFixed(len))
        }
        else {
            return n || 0
        }
    }

    static makeUInt64(hi: number, lo: number): number {
        let n = hi << 32
        n += lo
        return n
    }

    static parseUInt64(n: number): number[] {
        let lo = n & 0xFFFFFFFF
        let hi = n >> 32

        return [hi, lo]
    }

    static bytes2string(arraybuffer: ArrayBufferLike, start: number, size: number): string {
        if (typeof arraybuffer === 'string') {
            return arraybuffer
        }
        let dataview = new DataView(arraybuffer)
        let ints = new Uint8Array(size)
        for (let n = start; n < (start + size); n++) {
            ints[n - start] = dataview.getUint8(n)
        }
        let str = ''
        for (let i = 0; i < ints.byteLength; i++) {
            let one = ints[i].toString(2),
                v = one.match(/^1+?(?=0)/)
            if (v && one.length == 8) {
                let bytesLength = v[0].length;
                let store = ints[i].toString(2).slice(7 - bytesLength)
                for (let st = 1; st < bytesLength; st++) {
                    //  store += ints[(st + i)].toString(2).slice(2)
                    store += ints[st + i].toString(2).slice(2)
                }
                str += String.fromCharCode(parseInt(store, 2))
                i += bytesLength - 1
            } else {
                str += String.fromCharCode(ints[i])
            }
        }
        return str
    }

    static string2bytes(str: string): Array<number> {
        let bytes = new Array()
        let len, c;
        len = str.length;
        for (let i = 0; i < len; i++) {
            c = str.charCodeAt(i)
            if (c >= 0x010000 && c <= 0x10FFFF) {
                bytes.push(((c >> 18) & 0x07) | 0xF0)
                bytes.push(((c >> 12) & 0x3F) | 0x80)
                bytes.push(((c >> 6) & 0x3F) | 0x80)
                bytes.push((c & 0x3F) | 0x80)
            } else if (c >= 0x000800 && c <= 0x00FFFF) {
                bytes.push(((c >> 12) & 0x0F) | 0xE0)
                bytes.push(((c >> 6) & 0x3F) | 0x80)
                bytes.push((c & 0x3F) | 0x80)
            } else if (c >= 0x000080 && c <= 0x0007FF) {
                bytes.push(((c >> 6) & 0x1F) | 0xC0)
                bytes.push((c & 0x3F) | 0x80)
            } else {
                bytes.push(c & 0xFF)
            }
        }
        return bytes
    }
}
