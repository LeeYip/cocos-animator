import Events, { EventName, preloadEvent } from "../../common/util/Events";
import State from "../data/State";
import StateMachine from "../data/StateMachine";
import Transition from "../data/Transition";
import UnitBase, { UnitColor } from "./UnitBase";
import UnitStateMachine from "./UnitStateMachine";

const { ccclass, property } = cc._decorator;

/**
 * 状态节点
 */
@ccclass
export default class UnitState extends UnitBase {
    private _state: State = null;
    public get state() { return this._state; }

    /** 是否为AnyState */
    public get isAnyState() { return this._state.isAnyState; }

    /**
     * 是否为默认状态
     * @override
     */
    public get isDefault() { return this._isDefault; }
    public set isDefault(v: boolean) {
        if (this.isAnyState) {
            return;
        }
        this._isDefault = v;
        this.BgNode.color = this._isDefault ? UnitColor.DEFAULT : UnitColor.NORMAL;
    }

    public onInit(upStateMachine: StateMachine, isAnyState: boolean = false) {
        this._state = new State(upStateMachine, isAnyState);
        if (isAnyState) {
            this.node.scale *= 0.8;
            this.NameLabel.node.scale *= 1 / 0.8;
            this.BgNode.color = UnitColor.ANY_STATE;
            this.NameLabel.string = 'AnyState';
        } else {
            this.NameLabel.string = this._state.name;
        }
    }

    public initByState(state: State) {
        this._state = state;
        this.NameLabel.string = this._state.name;
        this.node.position = state.position
    }

    protected onLoad() {
        Events.targetOn(this);
    }

    protected onDestroy() {
        Events.targetOff(this);
    }

    /**
     * 添加Transition
     * @override
     */
    public addTransition(toUnit: UnitBase, toState: State) {
        let transition = this.state.addTransition(toState);
        Events.emit(EventName.TRANSITION_ADD, this, toUnit, transition);
    }

    /**
     * 获取此节点到目标节点的所有Transition，不传参则返回所有从此节点出发的Transition
     * @override
     * @param toUnit 目标节点
     */
    public getTransitions(toUnit: UnitBase = null): Transition[] {
        if (toUnit instanceof UnitState) {
            return this.state.getTransitions(toUnit.state);
        } else if (toUnit instanceof UnitStateMachine) {
            return this.state.getTransitions(toUnit.stateMachine, this._state.upStateMachine);
        } else {
            return this.state.getTransitions();
        }
    }

    /**
     * 设置layer层坐标系下坐标
     * @override
     */
    public setPos(x: number | cc.Vec2 | cc.Vec3, y: number = 0) {
        let pos: cc.Vec2 = super.setPos(x, y);
        if (!this.state.position.equals(pos)) {
            this.state.setPosition(pos);
            if (this.isAnyState) {
                Events.emit(EventName.ANY_STATE_MOVE, pos);
            }
        }
        return pos;
    }

    @preloadEvent(EventName.STATE_NAME_CHANGED)
    private onEventStateNameChanged(state: State) {
        if (this.state !== state) {
            return;
        }
        this.NameLabel.string = state.name;
    }
}
