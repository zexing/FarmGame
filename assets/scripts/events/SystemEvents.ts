/**
 * 系统和网络事件枚举
 */

/** ========== 系统事件 ========== */
export enum SystemEvents {
    /** 更新背景音量 */
    UpdateBgmVolume = "updateVolume",
    /** 更新音效音量 */
    UpdateSoundVolume = "updateSoundVolume",
    /** 重新开始 */
    Restart = "reStart",
    /** 点击空格键 */
    ClickSpace = "clickSpace",
    /** 鼠标滚轮 */
    MouseWheel = "mouseWheel",
    /** 显示调试按钮 */
    ShowBtnDebug = "showBtnDebug",
    /** 退出游戏 */
    ExitGame = "exitGame",
    /** 更新 */
    Update = "update",
    /** 下一帧更新 */
    LaterUpdate = "oneFrameLater",
    /** 震屏 */
    ShakeCamera = "ShakeCamera",
    /** 游戏提示 */
    GameTip = "gameTip",

    /** 切枪/工具切换事件 */
    ToolChanged = "toolChanged",

    /** 地图包围盒改变 */
    MapBoundsChanged = "mapBoundsChanged",

    /** 摄像机视窗缩放比例改变 */
    CameraZoomChanged = "cameraZoomChanged",

    /** 屏幕尺寸改变 */
    ScreenSizeChanged = "screenSizeChanged",
}

/** ========== 网络事件 ========== */
export enum NetworkEvent {
    /** 网络错误 */
    Error = "networkError",
    /** 用户登录成功 */
    UserLoginSuccess = "userLoginSuccess",
    /** 用户登录失败 */
    UserLoginFail = "userLoginFail",
    /** 响应结束 */
    ResponseFinishSpin = "responseFinishSpin",
    /** 响应简要记录 */
    ResponseBriefRecord = "responseBriefRecord",
    /** 响应详细记录 */
    ResponseDetailRecord = "responseDetailRecord",
    /** 响应搜索记录 */
    ResponseSearchRecord = "responseSearchRecord",
    /** 网络状态改变 */
    NetworkChange = "networkChage",
    /** 重试请求 */
    RetryRequest = "retryRequest",
    /** 刷新重试次数 */
    RefreshRetryCount = "refreshRetryCount",
}

