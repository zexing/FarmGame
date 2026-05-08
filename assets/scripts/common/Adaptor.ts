//-------------------------------------
//-- 屏幕适配
//-------------------------------------
import { Node, ResolutionPolicy, screen, size, sys, view, Widget } from "cc";
import { SystemEvents } from "../events/SystemEvents";
import { EventManager } from "./manager/EventManager";

//设计尺寸
export const DESIGN_SIZE = {
	width: 1920,
	height: 1080
}
//最大
export const MAX_SCREEN = {
	width: 1920,
	height: 1080
}
//最小
export const MIN_SCREEN = {
	width: 1920,
	height: 1080
}

class ScreenHelper {

	static nnn(e, t, i) {
		(void 0 === i ? !e.classList.contains(t) : i) ? e.classList.add(t) : e.classList.remove(t)
	}

	static hideCocosToolbar() {
		if (sys.isMobile) {
			return;
		}
		let _query = document.querySelector.bind(document);
		let _toolbar = _query(".toolbar");
		if (!_toolbar) {
			return;
		}
		this.nnn(_toolbar, "hide", !0);
	}

	static onWindowResize() {
		// console.log("设置Frame大小开始", window.innerWidth, window.innerHeight);
		let screenWid = Math.floor(window.innerWidth);
		let screenHei = Math.floor(window.innerHeight);

		let maxRatio = MAX_SCREEN.width / MAX_SCREEN.height;
		let minRatio = MIN_SCREEN.width / MIN_SCREEN.height;
		let ratio = screenWid / screenHei;

		if (ratio < minRatio) {
			let w = Math.floor(screenWid);
			let h = Math.floor(screenHei);
			h = Math.min(h, w / maxRatio);
			screen.windowSize = size(w * screen.devicePixelRatio, h * screen.devicePixelRatio);
			// console.log("设置Frame大小1:", w, h);
		} else {
			let w = Math.floor(screenHei * DESIGN_SIZE.width / DESIGN_SIZE.height);
			let h = Math.floor(screenHei);
			screen.windowSize = size(w * screen.devicePixelRatio, h * screen.devicePixelRatio);
			// console.log("设置Frame大小2:", w, h);
		}

		// console.log("设置Frame大小结果：", screen.windowSize);

	}

}


export default class Adaptor {

	private static s_is_full_screen: boolean = false;

	//监听屏幕尺寸变化
	public static listenScreen() {
		// console.log("操作系统: ", sys.os);

		window.addEventListener("resize", () => {
			// console.log("......窗口事件 resize");
			// ScreenHelper.hideCocosToolbar();
			// Adaptor.adaptScreen();
			EventManager.instance.dispatchEvent(SystemEvents.ScreenSizeChanged);
		});

		ScreenHelper.hideCocosToolbar();
		// Adaptor.adaptScreen();
	}

	//监听到横竖屏切换时
	static onOrientation(bLandscape: boolean) {
		Adaptor.swapDesiginDefine(bLandscape);
		Adaptor.adaptScreen();
	}


	//全屏适配
	//调用时机：在监听到窗口大小变化时 + 场景onLoad时
	public static adaptScreen() {
		ScreenHelper.onWindowResize();
		var fs = screen.windowSize;
		var bb = fs.width / fs.height;
		let maxRatio = MAX_SCREEN.width / MAX_SCREEN.height;
		let minRatio = MIN_SCREEN.width / MIN_SCREEN.height;


		// console.log("adapt screen ...", fs.width, fs.height, minRatio, bb, maxRatio);
		// console.log("设置为 :", DESIGN_SIZE.width, DESIGN_SIZE.height * (fs.height / fs.width));


		if (bb >= minRatio) { //&& bb <= maxRatio
			// console.log("FIXED_WIDTH");
			view.setDesignResolutionSize(DESIGN_SIZE.width, DESIGN_SIZE.height * (fs.height / fs.width), ResolutionPolicy.FIXED_WIDTH);
		} else {
			// console.log("SHOW_ALL");
			this.adaptScreen2();
		}

	}

	//即时更新widget
	public static deepUpdateAlignment(node: Node) {
		if (!node) {
			return;
		}
		let wgt = node.getComponent(Widget)
		if (wgt) {
			wgt.updateAlignment();
		}
		for (const child of node.children) {
			Adaptor.deepUpdateAlignment(child);
		}
	}

	//全屏
	public static isFullScreen(): boolean {
		return this.s_is_full_screen;
	}

	//全屏
	public static setFullScreen(bFull: boolean) {
		if (sys.isNative) {
			return;
		}
		if (bFull === Adaptor.s_is_full_screen) {
			return;
		}

		Adaptor.s_is_full_screen = bFull;

		if (bFull) {
			var de = document && document.documentElement;
			if (de) {
				if (de.requestFullscreen) {
					de.requestFullscreen();
				} else if (de["mozRequestFullScreen"]) {
					de["mozRequestFullScreen"]();
				} else if (de["webkitRequestFullScreen"]) {
					de["webkitRequestFullScreen"]();
				}
			}
		} else {
			var dc = document;
			if (dc) {
				if (dc.exitFullscreen) {
					dc.exitFullscreen();
				} else if (dc["mozCancelFullScreen"]) {
					dc["mozCancelFullScreen"]();
				} else if (dc["webkitCancelFullScreen"]) {
					dc["webkitCancelFullScreen"]();
				}
			}
		}
	}

	//与adaptScreen是一样的
	private static adaptScreen2() {
		var fs = screen.windowSize;
		var scaleX = fs.width / DESIGN_SIZE.width;
		var scaleY = fs.height / DESIGN_SIZE.height;
		var fitScale = Math.min(scaleX, scaleY);
		var width = Math.floor(fs.width / fitScale);
		var height = Math.floor(fs.height / fitScale);
		view.setDesignResolutionSize(width, height, ResolutionPolicy.SHOW_ALL);
	}

	//横竖屏切换时，调整设计尺寸
	private static swapDesiginDefine(bLandscape: boolean) {
		let bigger = Math.max(DESIGN_SIZE.width, DESIGN_SIZE.height);
		let smaller = Math.min(DESIGN_SIZE.width, DESIGN_SIZE.height);
		if (bLandscape) {
			DESIGN_SIZE.width = bigger;
			DESIGN_SIZE.height = smaller;
		} else {
			DESIGN_SIZE.width = smaller;
			DESIGN_SIZE.height = bigger;
		}
	}

}
