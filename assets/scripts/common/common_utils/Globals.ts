export class GlobalData {
	public static isInBackgroud: boolean = false;
	public static timeOfEnterBackground: number = 0; //单位为毫秒
}

export function isNil(v: any) {
	return v === undefined || v === null;
}

export function isEmpty(v: any) {
	return v === undefined || v === null || v === 0 || v === "";
}

