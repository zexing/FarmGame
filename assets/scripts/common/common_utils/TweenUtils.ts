import { Node, Tween, tween, v3 } from "cc";

export class TweenUtils {

    /**
     * 晃动函数
     * @param node 晃动主题(节点)
     * * @param shakeTimes 总晃动次数 -1代表无限晃动
     * @param shakeIntensity 晃动强度（像素）
     * @param shakeDuration 每次晃动的持续时间
     * @returns 
     */
    public static async playShakeAni(node: Node, shakeTimes: number = 5, shakeIntensity: number = 5, shakeDuration: number = 0.02) {
        return new Promise<void>(resolve => {
            const originalPosition = node.position.clone();

            let shakeCount = 0;

            const doShake = () => {
                if (shakeCount >= shakeTimes && shakeTimes > 0) {
                    Tween.stopAllByTarget(node);
                    // 晃动结束，恢复原位置
                    tween(node)
                        .to(shakeDuration, { position: originalPosition })
                        .call(() => {
                            resolve();
                        })
                        .start();
                    return;
                }

                // 随机晃动方向（左右）
                const shakeX = (Math.random() - 0.5) * shakeIntensity;
                const shakeY = (Math.random() - 0.5) * shakeIntensity;
                const targetPosition = v3(originalPosition.x + shakeX, originalPosition.y + shakeY, originalPosition.z);

                tween(node)
                    .to(shakeDuration, { position: targetPosition })
                    .call(() => {
                        shakeCount++;
                        doShake(); // 递归调用下一次晃动
                    })
                    .start();
            };

            doShake();
        });
    }
}


