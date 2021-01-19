import Events, { EventName, preloadEvent } from "../../common/util/Events";
import StateMachine from "../data/StateMachine";
import Transition from "../data/Transition";
import UnitBase, { UnitColor } from "./UnitBase";
import UnitState from "./UnitState";

const { ccclass, property } = cc._decorator;

/**
 * 状态机节点
 */
@ccclass
export default class UnitStateMachine extends UnitBase {
    private _stateMachine: StateMachine = null;
    public get stateMachine() { return this._stateMachine; }

    private _isUp: boolean = false;
    /** 是否为当前状态机视图的父状态机节点 */
    public get isUp() { return this._isUp; }
    public set isUp(v: boolean) {
        this._isUp = v;
    }

    /**
     * 是否为默认状态
     * @override
     */
    public get isDefault() { return this._isDefault; }
    public set isDefault(v: boolean) {
        this._isDefault = v;
        this.BgNode.color = this._isDefault ? UnitColor.DEFAULT : UnitColor.NORMAL;
    }

    public onInit(upStateMachine: StateMachine) {
        this._stateMachine = new StateMachine(upStateMachine);
        this.NameLabel.string = `${this.isUp ? '(up)' : ''}${this._stateMachine.name}`;
    }

    public initByStateMachine(stateMachine: StateMachine, upPos: cc.Vec2 = null) {
        this._stateMachine = stateMachine;
        this.isUp = !!upPos;
        this.NameLabel.string = `${this.isUp ? '(up)' : ''}${this._stateMachine.name}`;
        this.node.position = this.isUp ? upPos : stateMachine.position;
    }

    protected onLoad() {
        Events.targetOn(this);
    }

    protected onDestroy() {
        Events.targetOff(this);
    }

    /**
     * 获取此节点到目标节点的所有Transition
     * @override
     * @param toUnit 目标节点
     */
    public getTransitions(toUnit: UnitBase = null): Transition[] {
        if (toUnit instanceof UnitState) {
            return this.stateMachine.getTransitions(toUnit.state);
        } else if (toUnit instanceof UnitStateMachine) {
            return this.stateMachine.getTransitions(toUnit.stateMachine);
        } else {
            return [];
        }
    }

    /**
     * 设置layer层坐标系下坐标
     * @override
     */
    public setPos(x: number | cc.Vec2 | cc.Vec3, y: number = 0) {
        let pos: cc.Vec2 = super.setPos(x, y);
        if (!this.stateMachine.position.equals(pos)) {
            if (this.isUp) {
                Events.emit(EventName.UP_STATE_MACHINE_MOVE, pos);
            } else {
                this.stateMachine.setPosition(pos);
            }
        }
        return pos;
    }

    @preloadEvent(EventName.STATE_MACHINE_NAME_CHANGED)
    private onEventStateNameChanged(stateMachine: StateMachine) {
        if (this.stateMachine !== stateMachine) {
            return;
        }
        this.NameLabel.string = `${this.isUp ? '(up)' : ''}${this.stateMachine.name}`;
    }
}
