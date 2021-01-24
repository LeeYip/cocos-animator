import AnimatorSpine from "../../animator/AnimatorSpine";
import AnimatorSpineSecondary from "../../animator/AnimatorSpineSecondary";

const { ccclass, property } = cc._decorator;

@ccclass
export default class SpineScene extends cc.Component {
    @property(sp.Skeleton) SpineBoy: sp.Skeleton = null;

    private _updateSpeed: boolean = false;
    private _speed: number = 0;
    private _animatorMain: AnimatorSpine = null;
    private _animatorSecondary: AnimatorSpineSecondary[] = [];

    protected onLoad() {
        this._animatorMain = this.SpineBoy.getComponent(AnimatorSpine);
        this._animatorMain.onInit((fromState: string, toState: string) => {
            cc.log(`state change: ${fromState} -> ${toState}`);
        });
        this._animatorSecondary = this.SpineBoy.getComponents(AnimatorSpineSecondary);

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    protected update(dt: number) {
        this._speed = this._updateSpeed ? Math.min(5, this._speed + dt) : Math.max(0, this._speed - dt * 2);
        this._animatorMain.setNumber('speed', this._speed);
    }

    protected onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    private onKeyDown(event: cc.Event.EventKeyboard) {
        let code: cc.macro.KEY = event.keyCode;
        switch (code) {
            case cc.macro.KEY.left:
            case cc.macro.KEY.right:
                this._updateSpeed = true;
                break;
            case cc.macro.KEY.space:
                this._animatorMain.autoTrigger('jump');
                break;
            case cc.macro.KEY.k:
                this._animatorSecondary[0].autoTrigger('shoot');
            default:
                break;
        }
    }

    private onKeyUp(event: cc.Event.EventKeyboard) {
        let code: cc.macro.KEY = event.keyCode;
        switch (code) {
            case cc.macro.KEY.left:
            case cc.macro.KEY.right:
                this._updateSpeed = false;
                break;
            default:
                break;
        }
    }
}
