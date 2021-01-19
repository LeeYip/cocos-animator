import AnimatorBase, { AnimationPlayer } from "./core/AnimatorBase";
import AnimatorStateLogic from "./core/AnimatorStateLogic";

const { ccclass, property, requireComponent } = cc._decorator;

/** Animation状态机组件 */
@ccclass
@requireComponent(cc.Animation)
export default class AnimatorAnimation extends AnimatorBase {
    /** Animation组件 */
    private _animation: cc.Animation = null;
    /** 当前的动画实例 */
    private _animState: cc.AnimationState = null;

    protected onLoad() {
        if (!this.PlayOnLoad || this._hasInit) {
            return;
        }
        this._hasInit = true;

        this._animation = this.getComponent(cc.Animation);
        this._animation.on("finished", this.onAnimFinished, this);
        this._animation.on("lastframe", this.onAnimFinished, this);

        if (this.AssetRawUrl !== null) {
            this.initJson(this.AssetRawUrl.json);
        }
    }

    /**
     * 手动初始化状态机，可传入0-3个参数，类型如下
     * - onStateChangeCall 状态切换时的回调
     * - stateLogicMap 各个状态逻辑控制
     * - animationPlayer 自定义动画控制
     * @override
     */
    public onInit(...args: Array<Map<string, AnimatorStateLogic> | ((fromState: string, toState: string) => void) | AnimationPlayer>) {
        if (this.PlayOnLoad || this._hasInit) {
            return;
        }
        this._hasInit = true;

        this.initArgs(...args);

        this._animation = this.getComponent(cc.Animation);
        this._animation.on("finished", this.onAnimFinished, this);
        this._animation.on("lastframe", this.onAnimFinished, this);

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
        this._animState = this._animation.play(animName);
        this._animState.wrapMode = loop ? cc.WrapMode.Loop : cc.WrapMode.Default;
    }

    /**
     * 缩放动画播放速率
     * @override
     * @param scale 缩放倍率
     */
    protected scaleTime(scale: number) {
        if (scale > 0 && this._animState)
            this._animState.speed = scale;
    }
}
