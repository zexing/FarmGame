//---------------------------------
// 通用辅助接口
//---------------------------------

import { isNil } from "./Globals";


if (!ArrayBuffer["transfer"]) {
	ArrayBuffer["transfer"] = function (source, length) {
		source = Object(source);
		var dest = new ArrayBuffer(length);

		if (!(source instanceof ArrayBuffer) || !(dest instanceof ArrayBuffer)) {
			throw new TypeError("ArrayBuffer.transfer, error: Source and destination must be ArrayBuffer instances");
		}

		if (dest.byteLength >= source.byteLength) {
			var buf = new Uint8Array(dest);
			buf.set(new Uint8Array(source), 0);
		}
		else {
			throw new RangeError("ArrayBuffer.transfer, error: destination has not enough space");
		}

		return dest;
	};
};


export default class CommonUtil {

	//通用的销毁接口，销毁任意对象
	public static safeDelete(obj: any): any {
		if (obj === null || obj === undefined) {
			return null;
		}
		if (obj.delInstance) {
			obj.delInstance();
			return null;
		}
		if (obj.do_dtor) {
			obj.do_dtor();
			return null;
		}
		if (obj.node) {
			obj.node.destroy();
			return null;
		}
		obj.destroy();
		return null;
	}

	public static getClsName(obj: any): string {
		if (!obj || !obj.constructor) { return ""; }
		return obj.constructor.name;
	}

	public static getUUID(): string {
		var s = [];
		var hexDigits = "0123456789abcdef";
		for (var i = 0; i < 36; i++) {
			s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
		}
		s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
		s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
		s[8] = s[13] = s[18] = s[23] = "-";

		var uuid = s.join("");
		return uuid;
	}

	public static num00(v: number): string {
		if (v < 10) { return "0" + v; }
		return v.toString();
	}

	//--------------------------------------------------------------------------------------------

	//浅复制
	static simpleCopy(target, source, ignoreKeys?: any) {
		if (source === undefined || source === null) { return; }
		if (target === undefined || target === null) { return; }
		for (var key in source) {
			if (source.hasOwnProperty(key)) {
				if (ignoreKeys && ignoreKeys[key]) {
					//
				} else {
					target[key] = source[key];
				}
				//	logger.log("copy: ", key, target[key]);
			}
		}
	}

	//深复制
	static deepClone(source: Object): any {
		if (null === source || undefined === source || typeof ({}) !== typeof (source) || typeof ([]) !== typeof (source)) {
			return source;
		}

		let newObject: any;
		let isArray = false;
		if ((source as any).length) {
			newObject = [];
			isArray = true;
		} else {
			newObject = {};
			isArray = false;
		}
		for (let key of Object.keys(source)) {
			if (null == source[key]) {
				if (isArray) {
					newObject.push(null);
				} else {
					newObject[key] = null;
				}
			} else {
				let sub = (typeof source[key] == 'object') ? this.deepClone(source[key]) : source[key];
				if (isArray) {
					newObject.push(sub);
				} else {
					newObject[key] = sub;
				}
			}
		}
		return newObject;
	}

	static isEqual(obj1: any, obj2: any): boolean {
		if (obj1 === obj2) {
			return true;
		}

		if (typeof (obj1) != typeof (obj2)) {
			return false;
		}

		if (this.isArray(obj1)) {
			return this.isSameArray(obj2, obj1);
		} else {
			for (let k in obj1) {
				if (!this.isEqual(obj1[k], obj2[k])) {
					return false;
				}
			}
		}

		return false;
	}

	static addArray(a: any, b: any): Array<any> {
		var rlt = [];
		if (a) {
			for (var i in a) {
				rlt.push(a[i]);
			}
		}
		if (b) {
			for (var i in b) {
				rlt.push(b[i]);
			}
		}
		return rlt;
	}

	//
	static appendArray(dst: any[], arr: any[]): void {
		if (arr) {
			for (var i in arr) {
				dst.push(arr[i]);
			}
		}
	}

	//
	static minusArray(src: any[], arr: any[]): void {
		if (!src || src.length <= 0) { return; }
		if (!arr || arr.length <= 0) { return; }
		for (var i = 0; i < arr.length; i++) {
			var idx = src.indexOf(arr[i]);
			if (idx >= 0) {
				src.splice(idx, 1);
			}
		}
	}

	static addArrayItem(arr: number[], value: number, count: number) {
		if (!count || count == 0) {
			return;
		}

		if (count > 0) {
			for (let i = 0; i < count; i++) {
				arr.push(value);
			}

		} else {

			for (let j = arr.length; j >= 0; j--) {
				if (arr[j] == value) {
					arr.splice(j, 1);
					count++;
					if (count >= 0) {
						break;
					}
				}
			}
		}
	}

	static isSameArray(a1: any[], a2: any[]): boolean {
		if (typeof a1 != typeof a2) { return false; }
		if (a1.length != a2.length) { return false; }
		for (var i in a1) {
			if (a2.indexOf(a1[i]) < 0) {
				return false;
			}
		}
		for (var i in a2) {
			if (a1.indexOf(a2[i]) < 0) {
				return false;
			}
		}
		return true;
	}

	static cloneArray(src: Uint8Array | any[]): Uint8Array | Array<any> {
		var dst = [];
		if (isNil(src)) { return dst; }
		for (var i in src) {
			dst.push(src[i]);
		}
		return dst;
	}

	static isArray(obj: any): boolean {
		return !isNil(obj.length)
	}


	static Uint8Arr2NumArr(src: Uint8Array | null): Array<number> {
		var dst = [];
		if (src) {
			for (var i in src) {
				dst.push(src[i]);
			}
		}
		return dst;
	}

	static NumArr2Uint8Arr(src: Array<number>): Uint8Array {
		if (isNil(src) || src.length <= 0) { return null; }
		var arrBuff: ArrayBuffer = new ArrayBuffer(src.length);
		var dv: DataView = new DataView(arrBuff);
		for (var i = 0; i < src.length; i++) {
			dv.setUint8(i, src[i]);
		}
		return new Uint8Array(dv.buffer)
	}

}
