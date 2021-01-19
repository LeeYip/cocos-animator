import Events, { EventName } from "../../common/util/Events";
import State from "./State";
import Transition from "./Transition";

/**
 * 管理运行时状态机数据
 */
export default class StateMachine {
    //#region 静态成员
    /** 记录子状态机数据 */
    private static _allSubStateMachines: Set<StateMachine> = new Set();

    private static add(s: StateMachine) {
        this._allSubStateMachines.add(s);
    }

    private static delete(s: StateMachine) {
        this._allSubStateMachines.delete(s);
    }

    /**
     * 获取唯一的状态机名
     * @param stateMachine 需要命名的StateMachine
     * @param name 传入的命名
     */
    private static getUniqueName(stateMachine: StateMachine, name: string = 'StateMachine') {
        let index = 0;
        let findName = false;

        while (!findName) {
            findName = true;
            let values = this._allSubStateMachines.values();
            for (let i = 0; i < this._allSubStateMachines.size; i++) {
                let s: StateMachine = values.next().value;
                if (s === stateMachine) {
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
    //#endregion

    private _name: string = '';
    /** 状态机名（唯一） */
    public get name() { return this.isMain ? 'BaseLayer' : this._name; }
    public set name(v: string) {
        if (this._name === v || this.isMain) {
            return;
        }
        this._name = StateMachine.getUniqueName(this, v);
        Events.emit(EventName.STATE_MACHINE_NAME_CHANGED, this);
    }

    private _position: cc.Vec2 = cc.v2(0, 0);
    /** 此节点在父状态机中的坐标 */
    public get position() { return this._position; }

    private _layerPos: cc.Vec2 = cc.v2(0, 0);
    /** 此状态机视图坐标 */
    public get layerPos() { return this._layerPos; }

    private _layerScale: number = 1;
    /** 此状态机视图缩放 */
    public get layerScale() { return this._layerScale; }

    private _anyStatePos: cc.Vec2 = cc.v2(-360, 300);
    /** AnyState节点在此状态机视图中的坐标 */
    public get anyStatePos() { return this._anyStatePos; }

    private _upStateMachinePos: cc.Vec2 = cc.v2(360, 300);
    /** 父状态机节点在此状态机视图中的坐标 */
    public get upStateMachinePos() { return this._upStateMachinePos; }

    private _upStateMachine: StateMachine = null;
    /** 父状态机 */
    public get upStateMachine() { return this._upStateMachine; }

    private _subStateMachines: Set<StateMachine> = new Set();
    /** 内部子状态机 */
    public get subStateMachines() { return this._subStateMachines; }

    private _subStates: Set<State> = new Set();
    /** 内部状态 */
    public get subStates() { return this._subStates; }

    /** 是否为主状态机 */
    public get isMain() { return this._upStateMachine === null; }

    constructor(upStateMachine: StateMachine) {
        this._upStateMachine = upStateMachine;
        if (!this.isMain) {
            this._upStateMachine.add(this);
            this._name = StateMachine.getUniqueName(this);
            StateMachine.add(this);
        }
    }

    /**
     * 销毁
     */
    public destroy() {
        if (!this.isMain) {
            StateMachine.delete(this);
        }
        this._subStateMachines.forEach((e) => {
            e.destroy();
        });
        this._subStateMachines.clear();
        this._subStates.forEach((e) => {
            e.destroy();
        });
        this._subStates.clear();
    }

    /**
     * 更改父状态机
     */
    public changeUpStateMachine(upStateMachine: StateMachine) {
        if (!this.isMain) {
            this._upStateMachine.delete(this, false);
            this._upStateMachine = upStateMachine;
            this._upStateMachine.add(this);
        }
    }

    /**
     * 判断某个状态或状态机是否在当前状态机内部（默认递归）
     * @param sub
     * @param recursive 是否递归查找内部
     */
    public has(sub: State | StateMachine, recursive: boolean = true): boolean {
        if (this.isMain && recursive) {
            return true;
        }

        if (sub instanceof State) {
            if (!recursive) {
                return this._subStates.has(sub);
            } else {
                if (this._subStates.has(sub)) {
                    return true;
                }
                let values = this._subStateMachines.values();
                for (let i = 0; i < this._subStateMachines.size; i++) {
                    let stateMachine: StateMachine = values.next().value;
                    if (stateMachine.has(sub)) {
                        return true;
                    }
                }
            }
        } else if (sub instanceof StateMachine) {
            if (!recursive) {
                return this._subStateMachines.has(sub);
            } else {
                if (this._subStateMachines.has(sub)) {
                    return true;
                }
                let values = this._subStateMachines.values();
                for (let i = 0; i < this._subStateMachines.size; i++) {
                    let stateMachine: StateMachine = values.next().value;
                    if (stateMachine.has(sub)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    public add(sub: State | StateMachine) {
        if (sub instanceof State) {
            if (sub.isAnyState) {
                return;
            }
            this._subStates.add(sub);
        } else if (sub instanceof StateMachine) {
            this._subStateMachines.add(sub);
        }
    }

    public delete(sub: State | StateMachine, destroy: boolean = true) {
        if (destroy) {
            sub.destroy();
        }
        if (sub instanceof State) {
            this._subStates.delete(sub);
        } else if (sub instanceof StateMachine) {
            this._subStateMachines.delete(sub);
        }
    }

    /**
     * 将目标从别的状态机移入当前状态机内
     * @param target 目标状态或状态机
     * @returns 是否成功进行移入操作
     */
    public moveTargetIn(target: State | StateMachine): boolean {
        if (target instanceof State) {
            if (this._subStates.has(target)) {
                return false;
            }
            target.changeUpStateMachine(this);
            return true;
        } else if (target instanceof StateMachine) {
            if (this === target || this._subStateMachines.has(target) || target.has(this)) {
                return false;
            }
            target.changeUpStateMachine(this);
            return true;
        }
        return false;
    }

    /**
     * 递归查找内部所有子状态
     */
    public getAllSubStates(states: Set<State> = new Set()): Set<State> {
        this._subStates.forEach((e) => {
            states.add(e);
        });
        this._subStateMachines.forEach((e) => {
            e.getAllSubStates(states);
        });
        return states;
    }

    /**
     * 查找所有外部状态
     */
    public getAllOutStates(): Set<State> {
        let states: Set<State> = new Set()
        let allSub = this.getAllSubStates();
        State.getAllStates().forEach((e) => {
            if (!allSub.has(e)) {
                states.add(e);
            }
        });
        return states;
    }

    /**
     * 获取所有子状态指向目标的Transition（递归查找）
     * @param cur 当前编辑器视图所在状态机
     */
    private getSubTransitions(to: State | StateMachine, transitionArr: Transition[], cur: StateMachine) {
        this._subStates.forEach((e) => {
            transitionArr = transitionArr.concat(e.getTransitions(to, cur));
        });
        this._subStateMachines.forEach((e) => {
            transitionArr = e.getSubTransitions(to, transitionArr, cur);
        });
        return transitionArr;
    }

    /**
     * 获取所有外部状态指向目标的Transition
     * @param exclude 遍历子状态机时过滤的状态机
     * @param cur 当前编辑器视图所在状态机
     */
    private getOutTransitions(to: State | StateMachine, transitionArr: Transition[], exclude: StateMachine, cur: StateMachine) {
        this._subStates.forEach((e) => {
            transitionArr = transitionArr.concat(e.getTransitions(to, cur));
        });
        this._subStateMachines.forEach((e) => {
            if (e !== exclude)
                transitionArr = e.getSubTransitions(to, transitionArr, cur);
        });

        if (this.isMain) {
            return transitionArr;
        }
        transitionArr = this._upStateMachine.getOutTransitions(to, transitionArr, this, cur);
        return transitionArr;
    }

    /**
     * 获取指向目标的Transition
     * @param to
     */
    public getTransitions(to: State | StateMachine): Transition[] {
        let transitionArr = [];
        if (this.has(to)) {
            transitionArr = this.getOutTransitions(to, transitionArr, to.upStateMachine, to.upStateMachine);
        } else {
            transitionArr = this.getSubTransitions(to, transitionArr, this._upStateMachine);
        }
        return transitionArr;
    }

    public setPosition(x: number | cc.Vec2 | cc.Vec3, y: number = 0) {
        this._position = cc.v2(x, y);
    }

    public setLayerPos(x: number | cc.Vec2 | cc.Vec3, y: number = 0) {
        this._layerPos = cc.v2(x, y);
    }

    public setLayerScale(scale: number) {
        this._layerScale = scale;
    }

    public setAnyStatePos(x: number | cc.Vec2 | cc.Vec3, y: number = 0) {
        this._anyStatePos = cc.v2(x, y);
    }

    public setUpStateMachinePos(x: number | cc.Vec2 | cc.Vec3, y: number = 0) {
        this._upStateMachinePos = cc.v2(x, y);
    }
}
