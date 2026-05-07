import { isEmpty, isNil } from "./Globals";

var REGEXP_NUM_OR_STR = /(%d)|(%s)/;
var REGEXP_STR = /%s/;


export default class StringUtil {

	static getSufix(str: string) {
		if (isEmpty(str)) { return ""; }
		var idx = str.lastIndexOf(".")
		if (idx === null || idx === undefined || idx <= 0) {
			return "";
		}
		return str.substring(idx + 1);
	}

	public static format(str: string, ...params: string[]): string {
		params.forEach(function (v, i) {
			str = str.replace(`{${i}}`, v);
		})
		return str;
	}

	public static formatStr(...args: any[]): string {
		var argLen = arguments.length;
		if (argLen === 0) {
			return '';
		}
		var msg = arguments[0];
		if (argLen === 1) {
			return '' + msg;
		}

		var hasSubstitution = typeof msg === 'string' && REGEXP_NUM_OR_STR.test(msg);
		if (hasSubstitution) {
			for (let i = 1; i < argLen; ++i) {
				var arg = arguments[i];
				var regExpToTest = typeof arg === 'number' ? REGEXP_NUM_OR_STR : REGEXP_STR;
				if (regExpToTest.test(msg))
					msg = msg.replace(regExpToTest, arg);
				else
					msg += ' ' + arg;
			}
		}
		else {
			for (let i = 1; i < argLen; ++i) {
				msg += ' ' + arguments[i];
			}
		}
		return msg;
	};

	static lineStr(str: string, len: number = 12) {
		if (!str) { return ""; }
		if (str.length < len) { return str; }
		let newStr = "";
		for (let i = 0; i < str.length; i++) {
			newStr += str[i];
			if ((i + 1) % len == 0) {
				newStr += "\n";
			}
		}
		return newStr;
	}

	public static shortString(s: string): string {
		if (isEmpty(s)) { return s; }
		if (s.length > 10) {
			return s.substring(0, 9) + "...";
		}
		return s;
	}

	public static lastCharIs(str: string, s: string): boolean {
		if (isEmpty(str)) { return false; }
		return str[str.length - 1] == s;
	}

	//
	static Bytes2Str(arr: Uint8Array, flagPos: number = 7): string {
		let str = "";
		for (let i = 0; i < arr.length; i++) {
			let tmp = arr[i].toString(16);
			if (tmp.length == 1) {
				tmp = "0" + tmp;
			}
			str += " " + tmp;
			if (i == flagPos) { str += "  "; }
		}
		return str;
	}

	//utf8数组转换为字符串
	public static utf8ArrayToString(array): string {
		if (isNil(array) || array.length <= 0) { return ""; }
		var out: string, i: number, len: number, c: number;
		var char2: number, char3: number;

		out = "";
		len = array.length;
		i = 0;

		while (i < len) {
			c = array[i++];

			switch (c >> 4) {
				case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
					// 0xxxxxxx
					out += String.fromCharCode(c);
					break;
				case 12: case 13:
					// 110x xxxx   10xx xxxx
					char2 = array[i++];
					out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
					break;
				case 14:
					// 1110 xxxx  10xx xxxx  10xx xxxx
					char2 = array[i++];
					char3 = array[i++];
					out += String.fromCharCode(((c & 0x0F) << 12) |
						((char2 & 0x3F) << 6) |
						((char3 & 0x3F) << 0));
					break;
			}
		}

		return out;
	}

	//字符串转换为utf8数组
	public static stringToUTF8Bytes(str: string): any[] {
		var utf8 = [];
		for (var i = 0; i < str.length; i++) {
			var charcode = str.charCodeAt(i);
			if (charcode < 0x80) utf8.push(charcode);
			else if (charcode < 0x800) {
				utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
			}
			else if (charcode < 0xd800 || charcode >= 0xe000) {
				utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
			}
			// surrogate pair
			else {
				i++;
				// UTF-16 encodes 0x10000-0x10FFFF by
				// subtracting 0x10000 and splitting the
				// 20 bits of 0x0-0xFFFFF into two halves
				charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff))
				utf8.push(0xf0 | (charcode >> 18),
					0x80 | ((charcode >> 12) & 0x3f),
					0x80 | ((charcode >> 6) & 0x3f),
					0x80 | (charcode & 0x3f));
			}
		}
		return utf8;
	}

	static printLn(obj: any) {
		let cur = "{\n";
		for (let k in obj) {
			if (k == "data") {
				cur += "data: {\n"
				for (let n in obj.data) {
					cur += "    " + n + ": " + JSON.stringify(obj.data[n]) + "\n";
				}
				cur += "}\n"
			} else {
				cur += "" + k + ": " + JSON.stringify(obj[k]) + "\n";
			}
		}
		cur += "}"
		console.log(cur);
	}

}


