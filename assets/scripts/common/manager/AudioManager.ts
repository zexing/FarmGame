import { AudioClip, AudioSource, director, game, Node } from "cc";
import { GameDefine } from "../../const/GameDefine";
import { UserData } from "../../data/UserData";
import { SystemEvent } from "../../events";
import { LangManager, LanguageMode } from "../../language/LangManager";
import { SingletonManager } from "../base/SingletonManager";
import { BundleManager } from "./BundleManager";
import { EventManager } from "./EventManager";
import { GameTimerManager } from "./GameTimerManager";
import { Res } from "./Res";

/**
 * 音频管理器
 * 使用统一的单例模式管理
 */
export class AudioManager extends SingletonManager {
    /**
     * 获取单例实例
     */
    public static get instance(): AudioManager {
        return AudioManager.getInstance<AudioManager>();
    }

    /**
     * 销毁单例实例
     */
    public static delInstance(): void {
        AudioManager.destroyInstance();
    }

    private effects: Map<string, AudioClip> = new Map<string, AudioClip>();

    private sourceIdx: number = 0;


    public currentBgm: string = "";//当前播放的背景音乐

    private _audioSource: AudioSource;//背景音乐播放源
    private _audioSourceEffect: AudioSource;//音效播放源（用于playOneShot）
    private _stoppableEffects: Map<string, AudioSource> = new Map();//可停止音效池
    constructor() {
        super(); // 调用父类构造函数

        this.addAudioPersist();

        // //注册全局背景音乐事件
        // window['setupBgAudio'] = (type: number) => {
        //     if (type) {
        //         this.resume();
        //     } else {
        //         this.pause();
        //     }
        // }

        EventManager.instance.on(SystemEvent.UpdateBgmVolume, this.updateBgmVolume, this);
        EventManager.instance.on(SystemEvent.UpdateSoundVolume, this.updateEffectVolume, this);
    }
    public removeAudioPersist() {
        // 清理所有可停止音效
        this._stoppableEffects.forEach((audioSource) => {
            audioSource.stop();
            if (audioSource.node) {
                audioSource.node.removeFromParent();
                director.removePersistRootNode(audioSource.node);
            }
            audioSource.destroy();
        });
        this._stoppableEffects.clear();

        if (this._audioSourceEffect) {
            this._audioSourceEffect.stop();
            if (this._audioSourceEffect.node) {
                this._audioSourceEffect.node.removeFromParent();
                director.removePersistRootNode(this._audioSourceEffect.node);
            }
            this._audioSourceEffect.destroy();
            this._audioSourceEffect = null;
            this.effects.clear();
            this.audioEffectCd.clear();
        }
        if (this._audioSource) {
            this._audioSource.stop();
            if (this._audioSource.node) {
                this._audioSource.node.removeFromParent();
                director.removePersistRootNode(this._audioSource.node);
            }
            this._audioSource.destroy();
            this._audioSource = null;
        }
        EventManager.instance.off(SystemEvent.UpdateBgmVolume, this.updateBgmVolume, this);
        EventManager.instance.off(SystemEvent.UpdateSoundVolume, this.updateEffectVolume, this);
    }
    public addAudioPersist() {
        if (!this._audioSourceEffect && !this._audioSourceEffect?.node) {
            let audioMgrEffect = new Node();
            audioMgrEffect.name = this.sourceIdx + '__audioMgrEffect__';
            director.getScene().addChild(audioMgrEffect);
            director.addPersistRootNode(audioMgrEffect);
            this._audioSourceEffect = audioMgrEffect.getComponent(AudioSource) || audioMgrEffect.addComponent(AudioSource);
        }

        if (!this._audioSource && !this._audioSource?.node) {
            let audioMgr = new Node();
            audioMgr.name = '__audioMgr__';
            //@zh 添加节点到场景
            director.getScene().addChild(audioMgr);
            //@zh 标记为常驻节点，这样场景切换的时候就不会被销毁了
            director.addPersistRootNode(audioMgr);
            //@zh 添加 AudioSource 组件，用于播放音频。
            this._audioSource = audioMgr.getComponent(AudioSource) || audioMgr.addComponent(AudioSource);
        }
    }

    onEffectEnded() {

    }

    private audioEffectCd: Map<string, number> = new Map();//音效播放cd
    private playLength = 0;
    public update() {
        let time = game.totalTime;
        this.playLength = 0;
        this.audioEffectCd.forEach((value, key) => {
            if (time < value) {
                this.playLength++;
            }
        });
    }

    /**
     * @en
     * play long audio, such as the bg music
     * @zh
     * 播放长音频，比如 背景音乐
     * @param sound clip or url for the sound
     * @param volume 
     */
    playBGM(sound: AudioClip | string) {
        this.currentBgm = sound instanceof AudioClip ? sound.name : sound;
        let bgm_vol = UserData.instance.bgm_vol / 3;
        if (bgm_vol === 0) return;
        this.addAudioPersist();
        this.stop();
        if (sound instanceof AudioClip) {
            this._audioSource.clip = sound;
            this._audioSource.play();
            this._audioSource.volume = bgm_vol;
        }
        else {
            if (this.effects.get(sound)) {
                // this.stop();
                this._audioSource.clip = this.effects.get(sound);
                this._audioSource.loop = true;
                this._audioSource.play();
                this._audioSource.volume = bgm_vol;
            } else {
                Res.load(BundleManager.bundleName, GameDefine.SoundsUrl + sound)
                    .then((clip: AudioClip) => {
                        this.effects.set(sound, clip);
                        this._audioSource.clip = clip;
                        this._audioSource.loop = true;
                        this._audioSource.play();
                        this._audioSource.volume = bgm_vol;
                    })
                    .catch(err => {
                        console.error(`playBGM error: ${err}`);
                    })
            }
        }
    }



    /**
     * 播放音效
     * @param sound clip or url for the sound
     * @param endCall 播放结束回调
     * @param needStop 是否需要停止
     * @param loop 是否循环播放
     * @param needMultiLanguage 是否需要多语言支持（默认false）
     */
    playEffect(sound: string, endCall?: Function, needStop: boolean = false, loop: boolean = false, needMultiLanguage: boolean = false) {

        // /**测试代码，解决内存泄漏屏蔽音效播放 */
        // endCall && endCall();
        // return;

        // console.log("playEffect: ", sound);
        // if (SetupManager.Instance.effSoundSwitch && this._audioSourceEffect) {
        let sound_vol = UserData.instance.sound_vol / 3;
        if (sound_vol === 0) return;
        // if (this.playLength > 10) {//最大播放音效
        //     return;
        // }
        let time = game.totalTime;
        let clip = this.effects.get(sound)
        if (clip) {
            // if (this.audioEffectCd.get(clip.uuid) >= time) return;
            if (needStop) {
                this.playEffectNeedStop(clip, sound_vol, sound, endCall, loop);
            } else {
                this._audioSourceEffect.playOneShot(clip, sound_vol);
                // 非循环模式下，执行回调
                if (endCall && !loop) {
                    const duration = clip.getDuration() * 1000;
                    GameTimerManager.instance.doTimer(duration, 1, () => {
                        endCall();
                    }, this);
                }
            }

        } else {
            // 如果需要多语言支持，使用多语言加载逻辑
            if (needMultiLanguage) {
                this.loadEffectByLanguage(sound, time, sound_vol, endCall, needStop, loop);
            } else {
                // 默认加载逻辑
                this.loadEffectDefault(sound, time, sound_vol, endCall, needStop, loop);
            }
        }
        // }
    }

    /**
     * 播放需要停止控制的音效（内部方法）
     * 为每个音效创建独立的AudioSource，支持精确停止
     */
    private playEffectNeedStop(clip: AudioClip, volume: number, sound: string, endCall?: Function, loop: boolean = false) {


        // 如果该音效已在播放，先停止
        if (this._stoppableEffects.has(sound)) {
            const oldSource = this._stoppableEffects.get(sound);
            oldSource.stop();
            if (oldSource.node) {
                oldSource.node.removeFromParent();
                director.removePersistRootNode(oldSource.node);
            }
            oldSource.destroy();
            this._stoppableEffects.delete(sound);
        }

        // 创建独立的AudioSource节点
        const effectNode = new Node(`Effect_${sound}`);
        director.getScene().addChild(effectNode);
        director.addPersistRootNode(effectNode);

        const audioSource = effectNode.addComponent(AudioSource);
        audioSource.clip = clip;
        audioSource.volume = volume;
        audioSource.loop = loop;
        audioSource.play();

        // 存入可停止音效池
        this._stoppableEffects.set(sound, audioSource);

        // 非循环模式：播放结束后自动清理
        if (!loop) {
            const duration = clip.getDuration() * 1000;
            GameTimerManager.instance.doTimer(duration, 1, () => {
                if (endCall) {
                    endCall();
                }
                // 清理AudioSource
                if (this._stoppableEffects.has(sound)) {
                    const source = this._stoppableEffects.get(sound);
                    if (source && source.node) {
                        source.node.removeFromParent();
                        director.removePersistRootNode(source.node);
                        source.destroy();
                    }
                    this._stoppableEffects.delete(sound);
                }
            }, this);
        } else {
            // 循环模式：执行回调（如果有）
            if (endCall) {
                endCall();
            }
        }
    }

    /**
     * 播放指定次数的音效
     * @param sound 音效名称
     * @param times 播放次数（必须大于0）
     * @param endCall 所有次数播放完成后的回调
     * @param needMultiLanguage 是否需要多语言支持（默认false）
     * @example
     * AudioManager.instance.playEffectByTimes('coin', 3); // 播放3次硬币音效
     * AudioManager.instance.playEffectByTimes('win', 5, () => {
     *     console.log('所有音效播放完成');
     * });
     */
    public playEffectByTimes(sound: string, times: number, endCall?: Function, needMultiLanguage: boolean = false) {
        if (times <= 0) {
            console.warn(`[AudioManager] playEffectByTimes: times参数必须大于0，当前值: ${times}`);
            endCall?.();
            return;
        }

        // 播放音效，并在播放结束后递归调用
        this.playEffect(sound, () => {
            times--;
            if (times > 0) {
                // 继续播放剩余次数
                this.playEffectByTimes(sound, times, endCall, needMultiLanguage);
            } else {
                // 所有次数播放完成，执行回调
                endCall?.();
            }
        }, false, false, needMultiLanguage);
    }

    /**
     * 指定音效是否正在播放
     * 检查可停止音效池和普通音效源
     */
    public isEffectPlaying(sound: string): boolean {
        // 先检查可停止音效池
        const stoppableSource = this._stoppableEffects.get(sound);
        if (stoppableSource && stoppableSource.playing) {
            return true;
        }

        // 再检查普通音效源（playOneShot方式）
        let clip = this.effects.get(sound)
        if (clip) {
            return this._audioSourceEffect.clip === clip && this._audioSourceEffect.playing;
        }
        return false;
    }


    /**
     * 根据当前语言环境加载并播放音效
     * 优先加载语言目录（cn/en）下的音效，失败则回退到默认路径
     */
    private loadEffectByLanguage(sound: string, time: number, sound_vol: number, endCall?: Function, needStop: boolean = false, loop: boolean = false) {
        let sound_url;
        const langMode = LangManager.instance.getLangMode();

        // 根据语言模式构建路径
        if (langMode == LanguageMode.cn) {
            sound_url = GameDefine.SoundsUrl + 'cn/' + sound;
        } else if (langMode == LanguageMode.en) {
            sound_url = GameDefine.SoundsUrl + 'en/' + sound;
        } else {
            // 其他语言直接使用默认路径
            sound_url = GameDefine.SoundsUrl + sound;
        }

        // 优先尝试加载语言特定路径
        this.loadResource(
            sound_url,
            (ac: AudioClip) => {
                // 加载成功，缓存并播放
                this.audioEffectCd.set(ac.uuid, time + ac.getDuration() * 1000);
                this.effects.set(sound, ac);
                this.playLoadedEffect(ac, sound_vol, sound, endCall, needStop, loop);
            },
            () => {
                // 语言路径加载失败，回退到默认路径
                console.warn(`语言音效【${sound_url}】不存在，回退到默认路径`);
                const default_url = GameDefine.SoundsUrl + sound;

                this.loadResource(
                    default_url,
                    (ac: AudioClip) => {
                        this.audioEffectCd.set(ac.uuid, time + ac.getDuration() * 1000);
                        this.effects.set(sound, ac);
                        this.playLoadedEffect(ac, sound_vol, sound, endCall, needStop, loop);
                    },
                    () => {
                        console.error(`加载音效【${default_url}】失败，文件不存在`);
                    }
                )
            }
        )
    }

    /**
     * 默认加载音效（不考虑多语言）
     */
    private loadEffectDefault(sound: string, time: number, sound_vol: number, endCall?: Function, needStop: boolean = false, loop: boolean = false) {
        const sound_url = GameDefine.SoundsUrl + sound;

        Res.load(BundleManager.bundleName, sound_url)
            .then((ac: AudioClip) => {
                this.audioEffectCd.set(ac.uuid, time + ac.getDuration() * 1000);
                this.effects.set(sound, ac);
                this.playLoadedEffect(ac, sound_vol, sound, endCall, needStop, loop);
            })
            .catch(err => {
                console.error(`playEffect error: ${err}`);
            })
    }

    /**
     * 播放已加载的音效（统一播放逻辑）
     */
    private playLoadedEffect(clip: AudioClip, sound_vol: number, sound: string, endCall?: Function, needStop: boolean = false, loop: boolean = false) {
        if (needStop) {
            this.playEffectNeedStop(clip, sound_vol, sound, endCall, loop);
        } else {
            this._audioSourceEffect.playOneShot(clip, sound_vol);
            // 非循环模式下，执行回调
            if (endCall && !loop) {
                const duration = clip.getDuration() * 1000;
                GameTimerManager.instance.doTimer(duration, 1, () => {
                    endCall();
                }, this);
            }
        }
    }

    /**加载音频文件 */
    private loadResource(url: string, finishCall?: Function, failCall?: Function) {
        Res.load(BundleManager.bundleName, url)
            .then((ac: AudioClip) => {
                finishCall?.(ac);
            })
            .catch(err => {
                failCall?.();
            })
    }


    /**
     * 停止背景音乐
     */
    stop() {
        if (this._audioSource) {
            this._audioSource.stop();
        }
    }
    /**
     * 停止音效
     * @param sound 音效名称（可选）
     *              - 传入音效名：停止指定音效
     *              - 不传参数：停止所有可停止的音效
     * @example
     * AudioManager.instance.stopEffect('spin'); // 停止spin音效
     * AudioManager.instance.stopEffect();       // 停止所有音效
     */
    stopEffect(sound?: string) {
        if (sound) {
            // 停止指定音效
            const audioSource = this._stoppableEffects.get(sound);
            if (audioSource) {
                audioSource.stop();
                if (audioSource.node) {
                    audioSource.node.removeFromParent();
                    director.removePersistRootNode(audioSource.node);
                }
                audioSource.destroy();
                this._stoppableEffects.delete(sound);
                // console.log(`[AudioManager] 停止音效: ${sound}`);
            }
        } else {
            // 停止所有可停止的音效
            this._stoppableEffects.forEach((audioSource, key) => {
                audioSource.stop();
                if (audioSource.node) {
                    audioSource.node.removeFromParent();
                    director.removePersistRootNode(audioSource.node);
                }
                audioSource.destroy();
            });
            this._stoppableEffects.clear();
            // console.log(`[AudioManager] 停止所有可停止音效`);

            // 同时停止 playOneShot 的音效源
            if (this._audioSourceEffect) {
                this._audioSourceEffect.stop();
            }
        }
    }

    /**
     * 暂停背景音乐
     */
    pause() {
        if (this._audioSource) {
            this._audioSource.pause();
        }
    }
    /**
     * 恢复背景音乐
     */
    resume() {
        if (this._audioSource) {
            this._audioSource.play();
        }
    }

    updateBgmVolume() {
        if (this._audioSource) {
            this._audioSource.volume = UserData.instance.bgm_vol / 3;
        }
    }

    updateEffectVolume() {
        if (this._audioSourceEffect) {
            this._audioSourceEffect.volume = UserData.instance.sound_vol / 3;
        }
    }

    /**
     * 销毁时的清理方法
     */
    protected onDestroy(): void {
        this.removeAudioPersist();
        this.effects.clear();
        EventManager.instance.off(SystemEvent.UpdateBgmVolume, this.updateBgmVolume, this);
        EventManager.instance.off(SystemEvent.UpdateSoundVolume, this.updateEffectVolume, this);
        console.log('[AudioManager] Audio resources cleared');
    }
}


