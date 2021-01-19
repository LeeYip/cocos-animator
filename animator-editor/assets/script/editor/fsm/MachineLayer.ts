import Events, { EventName, preloadEvent } from "../../common/util/Events";
import Res from "../../common/util/Res";
import { ResUrl } from "../../constant/ResUrl";
import State from "../data/State";
import StateMachine from "../data/StateMachine";
import Transition from "../data/Transition";
import Line from "./Line";
import NavBar from "./NavBar";
import UnitBase from "./UnitBase";
import UnitState from "./UnitState";
import UnitStateMachine from "./UnitStateMachine";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MachineLayer extends cc.Component {
    @property(cc.Node) Grid: cc.Node = null;
    @property(cc.Node) UnitContent: cc.Node = null;
    @property(cc.Node) LineContent: cc.Node = null;
    @property(NavBar) NavBar: NavBar = null;

    /** 默认状态，整个状态机运行的入口 */
    private _defaultState: State = null;
    public get defaultState() { return this._defaultState; }
    public set defaultState(v: State) { this._defaultState = v; }
    /** 主状态机 */
    private _mainStateMachine: StateMachine = null;
    public get mainStateMachine() { return this._mainStateMachine; }
    /** 当前视图显示的状态机 */
    private _curStateMachine: StateMachine = null;
    public get curStateMachine() { return this._curStateMachine; }
    /** AnyState节点 */
    private _anyState: UnitState = null;
    public get anyState() { return this._anyState; }
    /** 父状态机节点 */
    private _upUnit: UnitStateMachine = null;

    protected onLoad() {
        this.node.setContentSize(6750, 6750);
        this.Grid.setContentSize(6750, 6750);
        this._mainStateMachine = new StateMachine(null);
        this._curStateMachine = this._mainStateMachine;
        this._anyState = this.createState(cc.v2(-360, 300), true);
        this._curStateMachine.setAnyStatePos(this._anyState.node.position);

        this.NavBar.refreshBar([this._mainStateMachine]);

        Events.targetOn(this);
    }

    protected onDestroy() {
        this.clear();
        Events.targetOff(this);
    }

    /**
     * 更新面包屑导航栏的显示
     */
    private refreshNavBar(curStateMachine: StateMachine) {
        // 更新面包屑导航栏的显示
        let arr: StateMachine[] = [curStateMachine];
        while (curStateMachine.upStateMachine) {
            arr.unshift(curStateMachine.upStateMachine);
            curStateMachine = curStateMachine.upStateMachine;
        }
        this.NavBar.refreshBar(arr);
    }

    /**
     * 清空状态机数据
     */
    public clear() {
        this._mainStateMachine.destroy();
    }

    /**
     * 改变当前视图显示的状态机，不传参则刷新当前视图
     */
    public setCurStateMachine(stateMachine: StateMachine = null) {
        if (this._curStateMachine === stateMachine) {
            return;
        }
        if (stateMachine === null) {
            stateMachine = this._curStateMachine;
        }
        this._curStateMachine = stateMachine;

        this.refreshNavBar(stateMachine);

        // 处理父状态机节点和AnyState
        if (!stateMachine.upStateMachine) {
            if (this._upUnit) {
                this._upUnit.node.removeFromParent();
                this._upUnit.node.destroy();
                this._upUnit = null;
            }
        } else {
            if (!this._upUnit) {
                let node: cc.Node = cc.instantiate(Res.getLoaded(ResUrl.PREFAB.STATE_MACHINE_NODE));
                this.UnitContent.addChild(node);
                let unitStateMachine = node.getComponent(UnitStateMachine);
                this._upUnit = unitStateMachine;
            }
            this._upUnit.initByStateMachine(stateMachine.upStateMachine, stateMachine.upStateMachinePos);
            this._upUnit.isDefault = stateMachine.upStateMachine.has(this._defaultState, false);
        }
        this._anyState.setPos(stateMachine.anyStatePos);
        this.node.position = stateMachine.layerPos;
        this.node.scale = stateMachine.layerScale;

        // 清理连线、状态、状态机节点
        this.LineContent.destroyAllChildren();
        this.LineContent.removeAllChildren();
        for (let i = this.UnitContent.childrenCount - 1; i >= 0; i--) {
            let node = this.UnitContent.children[i];
            let unit = node.getComponent(UnitBase);
            if (unit === this._anyState || unit === this._upUnit) {
                continue;
            }
            node.removeFromParent();
            node.destroy();
        }

        // 生成状态机、状态、连线节点
        let stateMap: Map<State, UnitState> = new Map();
        let machineMap: Map<StateMachine, UnitStateMachine> = new Map();
        this._upUnit && machineMap.set(stateMachine.upStateMachine, this._upUnit);
        stateMachine.subStates.forEach((e) => {
            let node: cc.Node = cc.instantiate(Res.getLoaded(ResUrl.PREFAB.STATE_NODE));
            this.UnitContent.addChild(node);
            let unitState = node.getComponent(UnitState);
            unitState.initByState(e);
            unitState.isDefault = e === this._defaultState;
            stateMap.set(e, unitState);
        });
        stateMachine.subStateMachines.forEach((e) => {
            let node: cc.Node = cc.instantiate(Res.getLoaded(ResUrl.PREFAB.STATE_MACHINE_NODE));
            this.UnitContent.addChild(node);
            let unitStateMachine = node.getComponent(UnitStateMachine);
            unitStateMachine.initByStateMachine(e);
            unitStateMachine.isDefault = e.has(this._defaultState);
            if (machineMap.size >= 1) {
                machineMap.forEach((v, k) => {
                    // 状态机节点相互之间的连线
                    if (k.getTransitions(e).length > 0) {
                        let line = this.createLine();
                        line.onInit(v, unitStateMachine);
                    }
                    if (e.getTransitions(k).length > 0) {
                        let line = this.createLine();
                        line.onInit(unitStateMachine, v);
                    }
                });
            }
            machineMap.set(e, unitStateMachine);
        });

        let stateKeys = stateMap.keys();
        for (let i = 0; i < stateMap.size; i++) {
            let state: State = stateKeys.next().value;
            let fromUnit: UnitBase = stateMap.get(state);
            let toUnitSet: Set<UnitBase> = new Set();
            let transitions = state.getTransitions();
            transitions.forEach((t: Transition) => {
                let toUnit: UnitBase = stateMap.get(t.toState);
                if (!toUnit) {
                    if (stateMachine.has(t.toState)) {
                        let machineKeys = machineMap.keys();
                        for (let j = 0; j < machineMap.size; j++) {
                            let machine: StateMachine = machineKeys.next().value;
                            if (machine !== stateMachine.upStateMachine && machine.has(t.toState)) {
                                toUnit = machineMap.get(machine);
                                break;
                            }
                        }
                    } else {
                        toUnit = this._upUnit;
                    }
                    if (!toUnit) {
                        cc.error(`[MachineLayer.setCurStateMachine] error transition: ${t}`);
                        return;
                    }
                }

                // fromUnit向其余状态、状态机的连线
                if (!toUnitSet.has(toUnit)) {
                    toUnitSet.add(toUnit);
                    let line = this.createLine();
                    line.onInit(fromUnit, toUnit);
                }
            });

            // AnyState连向fromUnit的连线
            if (this._anyState.state.getTransitions(state).length > 0) {
                let line = this.createLine();
                line.onInit(this._anyState, fromUnit);
            }

            // 状态机节点连向fromUnit的连线
            let machineKeys = machineMap.keys();
            for (let j = 0; j < machineMap.size; j++) {
                let machine: StateMachine = machineKeys.next().value;
                if (machine.getTransitions(state).length > 0) {
                    let line = this.createLine();
                    line.onInit(machineMap.get(machine), fromUnit);
                }
            }
        }
    }

    /**
     * 新建状态机节点
     */
    public createStateMachine(pos: cc.Vec2): UnitStateMachine {
        let node: cc.Node = cc.instantiate(Res.getLoaded(ResUrl.PREFAB.STATE_MACHINE_NODE));
        this.UnitContent.addChild(node);
        let unitStateMachine = node.getComponent(UnitStateMachine);
        unitStateMachine.onInit(this._curStateMachine);
        unitStateMachine.setPos(pos);

        return unitStateMachine;
    }

    /**
     * 新建状态节点
     */
    public createState(pos: cc.Vec2, isAnyState: boolean = false): UnitState {
        let node: cc.Node = cc.instantiate(Res.getLoaded(ResUrl.PREFAB.STATE_NODE));
        this.UnitContent.addChild(node);
        let unitState = node.getComponent(UnitState);
        unitState.onInit(this._curStateMachine, isAnyState);
        unitState.setPos(pos);

        // 新建状态时，如果为当前唯一一个状态则设置为默认状态
        if (State.getStateNum() === 1) {
            this.setDefaultState(unitState);
        }

        return unitState;
    }

    public createLine(): Line {
        let node: cc.Node = cc.instantiate(Res.getLoaded(ResUrl.PREFAB.LINE));
        this.LineContent.addChild(node);
        return node.getComponent(Line);
    }

    /**
     * 删除子状态机
     */
    public deleteStateMachine(unitStateMachine: UnitStateMachine) {
        // 先删除连线，再删除状态机（删除顺序倒过来会影响查找到的连线数据）
        for (let i = this.LineContent.childrenCount - 1; i >= 0; i--) {
            let line: Line = this.LineContent.children[i].getComponent(Line);
            if (line.relatedState(unitStateMachine)) {
                this.deleteLine(line);
            }
        }
        this._curStateMachine.delete(unitStateMachine.stateMachine);
        unitStateMachine.node.removeFromParent();
        unitStateMachine.node.destroy();

        // 删除默认状态时，更改另一个状态为默认状态
        if (unitStateMachine.isDefault) {
            this.setDefaultState();
        }
    }

    /**
     * 删除状态
     */
    public deleteState(unitState: UnitState) {
        // 先删除连线，再删除状态（删除顺序倒过来会影响查找到的连线数据）
        for (let i = this.LineContent.childrenCount - 1; i >= 0; i--) {
            let line: Line = this.LineContent.children[i].getComponent(Line);
            if (line.relatedState(unitState)) {
                this.deleteLine(line);
            }
        }
        this._curStateMachine.delete(unitState.state);
        unitState.node.removeFromParent();
        unitState.node.destroy();

        // 删除默认状态时，更改另一个状态为默认状态
        if (unitState.isDefault) {
            this.setDefaultState();
        }
    }

    /**
     * 删除连线
     */
    public deleteLine(line: Line) {
        line.getTransitions().forEach((e) => {
            e.fromState.deleteTransition(e);
        });

        line.node.removeFromParent();
        line.node.destroy();
    }

    /**
     * 根据Layer层坐标获取点击到的unit
     */
    public getUnitByPos(pos: cc.Vec2): UnitBase {
        for (let i = this.UnitContent.childrenCount - 1; i >= 0; i--) {
            let node = this.UnitContent.children[i];
            let rect = node.getBoundingBox();
            if (rect.contains(pos)) {
                return node.getComponent(UnitBase);
            }
        }
        return null;
    }

    /**
     * 根据Layer层坐标获取点击到的line
     */
    public getLineByPos(pos: cc.Vec2): Line {
        for (let i = this.LineContent.childrenCount - 1; i >= 0; i--) {
            let node = this.LineContent.children[i];
            let line = node.getComponent(Line);
            if (line.contains(pos)) {
                return line;
            }
        }
        return null;
    }

    /**
     * 根据连线两端节点获取line
     */
    public getLineByUnit(from: UnitBase, to: UnitBase): Line {
        for (let i = this.LineContent.childrenCount - 1; i >= 0; i--) {
            let node = this.LineContent.children[i];
            let line = node.getComponent(Line);
            if (line.fromUnit === from && line.toUnit === to) {
                return line;
            }
        }
        return null;
    }

    /**
     * 判断moveUnit节点是否可移入某个状态机节点内
     * @param moveUnit 跟随鼠标移动的unit
     */
    public checkMoveUnit(moveUnit: UnitBase): UnitStateMachine {
        if (moveUnit === this._anyState || moveUnit === this._upUnit) {
            return null;
        }
        for (let i = this.UnitContent.childrenCount - 1; i >= 0; i--) {
            let node = this.UnitContent.children[i];
            let unit = node.getComponent(UnitStateMachine);
            if (!unit || unit === moveUnit) {
                continue;
            }
            let rect = node.getBoundingBox();
            if (rect.contains(moveUnit.node.position)) {
                return unit;
            }
        }
        return null;
    }

    /**
     * 尝试将moveUnit节点移入重叠的状态机内
     * @param moveUnit 
     * @returns 是否进行移入操作
     */
    public moveIntoStateMachine(moveUnit: UnitBase): boolean {
        let unit: UnitStateMachine = this.checkMoveUnit(moveUnit);
        if (!unit) {
            return false;
        }

        let needRefresh: boolean = false;
        if (moveUnit instanceof UnitState) {
            needRefresh = unit.stateMachine.moveTargetIn(moveUnit.state);
        } else if (moveUnit instanceof UnitStateMachine) {
            needRefresh = unit.stateMachine.moveTargetIn(moveUnit.stateMachine);
        }
        if (!needRefresh) {
            return false;
        }

        this.setCurStateMachine();
        return true;
    }

    /**
     * 设置默认状态
     * @param unitState 不传参则表示随机一个设置为默认状态
     */
    public setDefaultState(unitState: UnitState = null) {
        if (!unitState) {
            if (this._curStateMachine.subStates.size === 0) {
                // 当前视图没有State
                this._defaultState = State.getRandState();
                if (!this._defaultState) {
                    return;
                }
                for (let i = this.UnitContent.childrenCount - 1; i >= 0; i--) {
                    let node = this.UnitContent.children[i];
                    let v = node.getComponent(UnitStateMachine);
                    if (v) {
                        v.isDefault = v.stateMachine.has(this._defaultState);
                        break;
                    }
                }
            } else {
                for (let i = this.UnitContent.childrenCount - 1; i >= 0; i--) {
                    let node = this.UnitContent.children[i];
                    let v = node.getComponent(UnitState);
                    if (v && !v.isAnyState) {
                        v.isDefault = true;
                        this._defaultState = v.state;
                        break;
                    }
                }
            }
        } else {
            if (unitState.state === this._defaultState || unitState.isAnyState) {
                return;
            }
            this.UnitContent.children.forEach((e) => {
                let v = e.getComponent(UnitBase);
                if (v === this._anyState) {
                    return;
                }
                if (v === unitState) {
                    v.isDefault = true;
                    this._defaultState = unitState.state;
                } else {
                    v.isDefault = false;
                }
            });
        }
    }

    /**
     * 限制节点修改坐标时不超出边缘
     * @param pos 
     */
    public setPos(pos: cc.Vec2) {
        let rect = this.node.getBoundingBox();
        let x = cc.misc.clampf(pos.x, -this.node.parent.width / 2 + rect.width / 2, this.node.parent.width / 2 - rect.width / 2);
        let y = cc.misc.clampf(pos.y, -this.node.parent.height / 2 + rect.height / 2, this.node.parent.height / 2 - rect.height / 2);
        this.node.x = x;
        this.node.y = y;

        this._curStateMachine.setLayerPos(x, y);
    }

    /**
     * 缩放
     * @param value true为放大， false为缩小
     * @param worldPos 鼠标所在的世界坐标
     */
    public changeScale(value: boolean, worldPos: cc.Vec2) {
        let localPos1 = this.node.convertToNodeSpaceAR(worldPos);
        this.node.scale = cc.misc.clampf(value ? this.node.scale + 0.1 : this.node.scale - 0.1, 0.3, 3);
        let localPos2 = this.node.convertToNodeSpaceAR(worldPos);
        let delta = localPos2.sub(localPos1).mul(this.node.scale);
        this.setPos(this.node.position.add(delta));

        this._curStateMachine.setLayerScale(this.node.scale);
    }

    @preloadEvent(EventName.ANY_STATE_MOVE)
    private onEventAnyStateMove(pos: cc.Vec2) {
        this._curStateMachine.setAnyStatePos(pos);
    }

    @preloadEvent(EventName.UP_STATE_MACHINE_MOVE)
    private onEventUpStateMachineMove(pos: cc.Vec2) {
        this._curStateMachine.setUpStateMachinePos(pos);
    }
}
