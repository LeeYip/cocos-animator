import AnimatorAnimation from "../../animator/AnimatorAnimation";
import AnimatorStateLogic from "../../animator/core/AnimatorStateLogic";
import SheepHit from "./SheepHit";
import SheepIdle from "./SheepIdle";
import SheepRun from "./SheepRun";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AnimationScene extends cc.Component {
    @property(AnimatorAnimation) Animator: AnimatorAnimation = null;

    public speed: number = 0;

    protected onLoad() {
        let map: Map<string, AnimatorStateLogic> = new Map();
        map.set('sheep_idle', new SheepIdle());
        map.set('sheep_run', new SheepRun());
        map.set('sheep_hit', new SheepHit(this));
        this.Animator.onInit(map);

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    protected update(dt: number) {
        let delt = this.Animator.curStateName === 'sheep_hit' ? 0 : this.speed * -this.Animator.node.scaleX * dt;
        this.Animator.node.x = cc.misc.clampf(this.Animator.node.x + delt, -1000, 1000);
    }

    protected lateUpdate() {
        this.Animator.setNumber('speed', this.speed);
        this.Animator.manualUpdate();
    }

    protected onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    private onKeyDown(event: cc.Event.EventKeyboard) {
        let code: cc.macro.KEY = event.keyCode;
        switch (code) {
            case cc.macro.KEY.left:
                this.Animator.node.scaleX = 1;
                this.speed = 100;
                break;
            case cc.macro.KEY.right:
                this.Animator.node.scaleX = -1;
                this.speed = 100;
                break;
            case cc.macro.KEY.k:
                this.Animator.setTrigger('hit');
            default:
                break;
        }
    }

    private onKeyUp(event: cc.Event.EventKeyboard) {
        let code: cc.macro.KEY = event.keyCode;
        switch (code) {
            case cc.macro.KEY.left:
            case cc.macro.KEY.right:
                this.speed = 0;
                break;
            default:
                break;
        }
    }
}
