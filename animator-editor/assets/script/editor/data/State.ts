import Events, { EventName } from "../../common/util/Events";
import Tool from "../../common/util/Tool";
import { TransitionData } from "../../constant/BaseConst";
import ParamItem from "../parameters/ParamItem";
import StateMachine from "./StateMachine";
import Transition from "./Transition";

/**
 * 管理运行时状态数据
 */
export default class State {
    //#region 静态成员
    /** 记录除AnyState外所有状态数据 */
    private static _allStates: Set<State> = new Set();

    public static getAllStates() {
        return this._allStates;
    }

    private static add(s: State) {
        this._allStates.add(s);
    }

    private static delete(s: State) {
        this._allStates.delete(s);
    }

    /**
     * 获取唯一的状态名
     * @param state 需要命名的state
     * @param name 传入的命名
     */
    private static getUniqueName(state: State, name: string = 'State') {
        let index = 0;
        let findName = false;

        while (!findName) {
            findName = true;
            let values = this._allStates.values();
            for (let i = 0; i < this._allStates.size; i++) {
                let s: State = values.next().value;
                if (s === state) {
                    continue;
                }
                if (s._name === `${name}${index > 0 ? index : ''}`) {
                    index++;
                    findName = false;
                    break;
                }
            }
        }
        return `${name}${index > 0 ? index : ''}`;
    }

    /**
     * 获取State数量（不包括AnyState）
     */
    public static getStateNum(): number {
        return this._allStates.size;
    }

    /**
     * 随机获取一个State
     */
    public static getRandState(): State {
        if (this._allStates.size === 0) {
            return null;
        }
        let values = this._allStates.values();
        return values.next().value;
    }
    //#endregion

    private _name: string = '';
    /** 状态名（唯一） */
    public get name() { return this._isAnyState ? 'AnyState' : this._name; }
    public set name(v: string) {
        if (this._isAnyState || this._name === v) {
            return;
        }
        this._name = State.getUniqueName(this, v);
        Events.emit(EventName.STATE_NAME_CHANGED, this);
    }

    /** 动画名 */
    public motion: string = '';

    private _speed: number = 1;
    /** 动画播放速度 */
    public get speed() { return this._speed; }
    public set speed(v: number) {
        this._speed = v;
    }

    /** 动画播放速度混合的number类型参数 */
    public multiplierParam: ParamItem = null;
    /** 动画是否循环播放 */
    public loop: boolean = false;

    /** 转向别的状态的转换数据 */
    private _transitions: Transition[] = [];

    private _position: cc.Vec2 = cc.v2(0, 0);
    /** 此节点在父状态机中的坐标 */
    public get position() { return this._position; }

    private _upStateMachine: StateMachine = null;
    /** 父状态机 */
    public get upStateMachine() { return this._upStateMachine; }

    private _isAnyState: boolean = false;
    /** 是否为AnyState */
    public get isAnyState() { return this._isAnyState; }

    constructor(upStateMachine: StateMachine, isAnyState: boolean) {
        this._isAnyState = isAnyState;
        if (!this._isAnyState) {
            this._upStateMachine = upStateMachine;
            this._upStateMachine.add(this);
            this._name = State.getUniqueName(this);
            State.add(this);
        }
    }

    /**
     * 销毁
     */
    public destroy() {
        if (!this._isAnyState) {
            State.delete(this);
        }
        this._transitions.forEach((e) => {
            e.destroy();
        });
        this._transitions.length = 0;
    }

    public changeUpStateMachine(upStateMachine: StateMachine) {
        if (!this._isAnyState) {
            this._upStateMachine.delete(this, false);
            this._upStateMachine = upStateMachine;
            this._upStateMachine.add(this);
        }
    }

    public addTransition(toState: State): Transition {
        let transition = new Transition(this, toState);
        Tool.arrayAdd(this._transitions, transition);
        return transition;
    }

    public deleteTransition(transition: Transition) {
        if (Tool.arrayDelete(this._transitions, transition)) {
            transition.destroy();
        }
    }

    /**
     * 获取指向目标的Transition，不传参则返回全部
     * @param to
     * @param cur 当前编辑器视图所在状态机
     */
    public getTransitions(to: State | StateMachine = null, cur: StateMachine = null): Transition[] {
        let transitionArr = [];
        if (to instanceof State) {
            this._transitions.forEach((e) => {
                if (to === e.toState) {
                    transitionArr.push(e);
                }
            });
        } else if (to instanceof StateMachine) {
            if (to.has(this)) {
                if (!cur) {
                    cc.error(`[State.getTransitions] error: cur is null`);
                    return transitionArr;
                }
                this._transitions.forEach((e) => {
                    if (!cur.has(e.toState)) {
                        transitionArr.push(e);
                    }
                });
            } else {
                this._transitions.forEach((e) => {
                    if (to.has(e.toState)) {
                        transitionArr.push(e);
                    }
                });
            }
        } else {
            transitionArr = this._transitions;
        }
        return transitionArr;
    }

    /**
     * 根据下标交换transition数组中元素
     */
    public swapTransition(idx1: number, idx2: number) {
        Tool.arraySwap(this._transitions, idx1, idx2);
    }

    /**
     * 将元素移动到目标下标的位置，其余元素相对位置不变
     */
    public moveTransition(fromIdx: number, toIdx: number) {
        Tool.arrayMove(this._transitions, fromIdx, toIdx);
    }

    public getMultiplierName() {
        return this.multiplierParam ? this.multiplierParam.paramName : '';
    }

    public setPosition(x: number | cc.Vec2 | cc.Vec3, y: number = 0) {
        this._position = cc.v2(x, y);
    }

    public getAllTransitionData(): TransitionData[] {
        let arr: TransitionData[] = [];
        this.getTransitions().forEach((e) => {
            arr.push(e.getTransitionData());
        });
        return arr;
    }
}