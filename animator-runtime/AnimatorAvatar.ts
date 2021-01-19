import AnimatorBase, { AnimationPlayer } from "./core/AnimatorBase";
import AnimatorStateLogic from "./core/AnimatorStateLogic";

const { ccclass, property, requireComponent } = cc._decorator;

/** 纸娃娃系统状态机组件 */
@ccclass
export default class AnimatorAvatar extends AnimatorBase {
    /**
     * 手动初始化状态机，可传入0-3个参数，类型如下
     * - onStateChangeCall 状态切换时的回调
     * - stateLogicMap 各个状态逻辑控制
     * - animationPlayer 自定义动画控制
     * @override
     */
    public onInit(...args: Array<Map<string, AnimatorStateLogic> | ((fromState: string, toState: string) => void) | AnimationPlayer>) {
        if (this._hasInit) {
            return;
        }
        this._hasInit = true;

        this.initArgs(...args);

        if (this.AssetRawUrl !== null) {
            this.initJson(this.AssetRawUrl.json);
        }
    }

    /**
     * 播放动画
     * @override
     * @param animName 动画名
     * @param loop 是否循环播放
     */
    protected playAnimation(animName: string, loop: boolean) {
        if (this._animationPlayer) {
            this._animationPlayer.playAnimation(animName, loop);
        }
    }

    /**
     * 缩放动画播放速率
     * @override
     * @param scale 缩放倍率
     */
    protected scaleTime(scale: number) {
        if (this._animationPlayer) {
            this._animationPlayer.scaleTime(scale);
        }
    }
}
