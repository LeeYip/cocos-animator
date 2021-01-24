import AnimatorCustomization from "../../animator/AnimatorCustomization";
import { AnimationPlayer } from "../../animator/core/AnimatorBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class CustomizationScene extends cc.Component implements AnimationPlayer {
    @property(cc.Node) Cube: cc.Node = null;

    private _animator: AnimatorCustomization = null;

    private _curTween: cc.Tween = null;
    private _call: () => void = null;
    private _traget: any = null;

    protected onLoad() {
        this._animator = this.Cube.getComponent(AnimatorCustomization);
        // 自定义动画播放必须要将实现了AnimationPlayer接口的对象传入
        this._animator.onInit(this);

        this.node.on(cc.Node.EventType.TOUCH_START, () => { this._animator.setTrigger('next'); }, this);
    }

    private move(dur: number, pos: cc.Vec3, loop: boolean) {
        if (loop) {
            this._curTween = cc.tween(this.Cube)
                .repeatForever(
                    cc.tween()
                        .to(dur, { position: pos })
                        .call(() => {
                            this._call.call(this._traget);
                        })
                )
                .start();
        } else {
            this._curTween = cc.tween(this.Cube)
                .to(dur, { position: pos })
                .call(() => {
                    this._call.call(this._traget);
                })
                .start();
        }
    }

    /** 
     * - 实现接口 AnimationPlayer
     * 设置动画播放结束的回调
     */
    public setFinishedCallback(callback: () => void, target: any): void {
        this._call = callback;
        this._traget = target;
    }

    /**
     * - 实现接口 AnimationPlayer 
     * 播放动画
     */
    public playAnimation(animName: string, loop: boolean): void {
        this._curTween && this._curTween.stop();
        if (animName === 'idle') {
            if (loop) {
                this._curTween = cc.tween(this.Cube)
                    .repeatForever(
                        cc.tween()
                            .to(1, { scale: 2 })
                            .to(1, { scale: 0.5 })
                            .call(() => {
                                this._call.call(this._traget);
                            })
                    )
                    .start();
            } else {
                this._curTween = cc.tween(this.Cube)
                    .to(1, { scale: 2 })
                    .to(1, { scale: 0.5 })
                    .call(() => {
                        this._call.call(this._traget);
                    })
                    .start();
            }
        } else if (animName === 'move1') {
            this.move(2, cc.v3(500, 500, 0), loop);
        } else if (animName === 'move2') {
            this.move(4, cc.v3(0, 0, 0), loop);
        }
    }

    /** 
     * - 实现接口 AnimationPlayer 
     * 缩放动画播放速率
     */
    public scaleTime(scale: number): void {

    }
}
