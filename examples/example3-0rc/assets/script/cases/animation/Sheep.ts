import { Component, EventKeyboard, macro, misc, SystemEvent, systemEvent, _decorator } from 'cc';
import AnimatorAnimation from '../../animator/AnimatorAnimation';
const { ccclass, property } = _decorator;

@ccclass('Sheep')
export class Sheep extends Component {

    public _animator: AnimatorAnimation = null!;
    public speed: number = 0;

    protected start() {
        this._animator = this.getComponent(AnimatorAnimation)!;

        systemEvent.on(SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        systemEvent.on(SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    protected update(dt: number) {
        let delt = this._animator.curStateName === 'sheep_hit' ? 0 : this.speed * -this._animator.node.scale.x * dt;
        let x = misc.clampf(this._animator.node.position.x + delt, -1000, 1000);
        this._animator.node.setPosition(x, this._animator.node.position.y, this._animator.node.position.z);
    }

    protected lateUpdate() {
        this._animator.setNumber('speed', this.speed);
        this._animator.manualUpdate();
    }

    protected onDestroy() {
        systemEvent.off(SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        systemEvent.off(SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    private onKeyDown(event: EventKeyboard) {
        let code: number = event.keyCode;
        switch (code) {
            case macro.KEY.left:
                this._animator.node.setScale(1, this._animator.node.scale.y, this._animator.node.scale.z);
                this.speed = 100;
                break;
            case macro.KEY.right:
                this._animator.node.setScale(-1, this._animator.node.scale.y, this._animator.node.scale.z);
                this.speed = 100;
                break;
            case macro.KEY.k:
                this._animator.setTrigger('hit');
            default:
                break;
        }
    }

    private onKeyUp(event: EventKeyboard) {
        let code: number = event.keyCode;
        switch (code) {
            case macro.KEY.left:
            case macro.KEY.right:
                this.speed = 0;
                break;
            default:
                break;
        }
    }
}
