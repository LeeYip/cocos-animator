import Events, { EventName, preloadEvent } from "../../common/util/Events";
import Tool from "../../common/util/Tool";
import { TransitionData } from "../../constant/BaseConst";
import ParamItem from "../parameters/ParamItem";
import Condition from "./Condition";
import State from "./State";

/**
 * 管理运行时单个状态转换数据
 */
export default class Transition {
    private _fromState: State = null;
    public get fromState() { return this._fromState; }

    private _toState: State = null;
    public get toState() { return this._toState; }

    /** 状态转换的条件 */
    private _conditions: Condition[] = [];
    public get conditions() { return this._conditions; }

    /** 状态转换是否需要满足动画播放结束 */
    public hasExitTime: boolean = false;

    constructor(from: State, to: State) {
        this._fromState = from;
        this._toState = to;

        Events.targetOn(this);
    }

    /**
     * 销毁
     */
    public destroy() {
        this._conditions.forEach((e) => {
            e.destroy();
        });
        this._conditions.length = 0;
        Events.targetOff(this);
    }

    /**
     * 状态转换字符串
     */
    public getTransStr() {
        return `${this._fromState.name} -> ${this._toState.name}`;
    }

    public addCondition(paramItem: ParamItem) {
        let condition = new Condition(paramItem);
        Tool.arrayAdd(this._conditions, condition);
        return condition;
    }

    public deleteCondition(condition: Condition) {
        if (Tool.arrayDelete(this._conditions, condition)) {
            condition.destroy();
        }
    }

    /**
     * 将元素移动到目标下标的位置，其余元素相对位置不变
     */
    public moveCondition(fromIdx: number, toIdx: number) {
        Tool.arrayMove(this._conditions, fromIdx, toIdx);
    }

    public getTransitionData() {
        let data: TransitionData = {
            toState: this.toState.name,
            hasExitTime: this.hasExitTime,
            conditions: []
        };
        this._conditions.forEach((e) => {
            data.conditions.push(e.getConditionData());
        });
        return data;
    }

    @preloadEvent(EventName.PARAM_DELETE)
    private onEventParamDelete(paramItem: ParamItem) {
        for (let i = this._conditions.length - 1; i >= 0; i--) {
            if (this._conditions[i].paramItem === paramItem) {
                this._conditions.splice(i, 1);
            }
        }
    }
}
