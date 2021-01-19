import Events, { EventName, preloadEvent } from "../../common/util/Events";
import { RecycleNode } from "../../common/util/RecyclePool";
import StateMachine from "../data/StateMachine";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BarItem extends cc.Component implements RecycleNode {
    @property(cc.Node) BgNode: cc.Node = null;
    @property(cc.Label) NameLabel: cc.Label = null;
    @property(cc.SpriteFrame) BgFrames: cc.SpriteFrame[] = [];

    private _stateMachine: StateMachine = null;
    private _needUpdate: boolean = false;

    public reuse() {
    }

    public unuse() {
        Events.targetOff(this);
    }

    public onInit(stateMachine: StateMachine, isCur: boolean) {
        this._stateMachine = stateMachine;
        this._needUpdate = true;
        this.BgNode.getComponent(cc.Sprite).spriteFrame = this._stateMachine.isMain ? this.BgFrames[0] : this.BgFrames[1];
        this.NameLabel.string = stateMachine.name;
        this.getComponent(cc.Button).interactable = !isCur;

        this.NameLabel.node.on(cc.Node.EventType.SIZE_CHANGED, this.onLabSizeChanged, this);
        Events.targetOn(this);
    }

    protected onDestroy() {
        Events.targetOff(this);
    }

    protected lateUpdate() {
        if (!this._needUpdate) {
            return;
        }
        this._needUpdate = false;

        let left = this._stateMachine.isMain ? 35 : 40;
        this.node.width = this.NameLabel.node.width + left + 15;
        this.BgNode.width = (this.node.width + 30) * 2;
    }

    private onLabSizeChanged() {
        this._needUpdate = true;
    }

    private onClick() {
        Events.emit(EventName.SET_CUR_STATE_MACHINE, this._stateMachine);
    }

    @preloadEvent(EventName.STATE_MACHINE_NAME_CHANGED)
    private onEventStateNameChanged(stateMachine: StateMachine) {
        if (this._stateMachine !== stateMachine) {
            return;
        }
        this.NameLabel.string = stateMachine.name;
    }
}
