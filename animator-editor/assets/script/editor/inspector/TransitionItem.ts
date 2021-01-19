import Events, { EventName, preloadEvent } from "../../common/util/Events";
import { RecycleNode } from "../../common/util/RecyclePool";
import Transition from "../data/Transition";
import UnitBase from "../fsm/UnitBase";
import UnitState from "../fsm/UnitState";

const { ccclass, property } = cc._decorator;

@ccclass
export default class TransitionItem extends cc.Component implements RecycleNode {
    @property(cc.Node) Bg: cc.Node = null;
    @property(cc.Node) Arrow: cc.Node = null;
    @property(cc.Label) Label: cc.Label = null;

    /** 对应的transition */
    public transition: Transition = null;

    public reuse() {
    }

    public unuse() {
        Events.targetOff(this);
    }

    public onInit(transition: Transition, curUnit: UnitBase) {
        this.Bg.opacity = 0;
        this.Arrow.active = !!curUnit;
        this.transition = transition;
        this.Label.string = this.transition.getTransStr();
        Events.targetOn(this);
    }

    protected onLoad() {
        this.Bg.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
    }

    protected onDestroy() {
        Events.targetOff(this);
    }

    private onTouchStart() {
        Events.emit(EventName.TRANSITION_SELECT, this);
    }

    /**
     * 选中
     */
    public select(value: boolean) {
        this.Bg.opacity = value ? 255 : 0;
    }

    public delete() {
        this.transition.fromState.deleteTransition(this.transition);
        Events.emit(EventName.TRANSITION_DELETE, this.transition);
    }

    @preloadEvent(EventName.STATE_NAME_CHANGED)
    private onEventStateChanged(unit: UnitState) {
        this.Label.string = this.transition.getTransStr();
    }
}
