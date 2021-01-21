import Events, { EventName, preloadEvent } from "../../common/util/Events";
import Tool from "../../common/util/Tool";
import { ANIMATOR_VERSION } from "../../constant/BaseConst";
import Condition from "../data/Condition";
import State from "../data/State";
import StateMachine from "../data/StateMachine";
import Transition from "../data/Transition";
import Editor from "../Editor";
import ParamItem from "../parameters/ParamItem";
import Line from "./Line";
import MachineLayer from "./MachineLayer";
import UnitBase from "./UnitBase";
import UnitState from "./UnitState";
import UnitStateMachine from "./UnitStateMachine";

const { ccclass, property } = cc._decorator;

@ccclass
export default class FsmCtr extends cc.Component {
    @property(MachineLayer) MachineLayer: MachineLayer = null;
    @property(cc.Node) Cross: cc.Node = null;

    /** 当前按下的鼠标按键 */
    private _curMouseBtn: number = null;
    /** moveUnit跟随鼠标的偏移值 */
    private _moveUnitOffset: cc.Vec2 = cc.v2(0, 0);
    /** 跟随鼠标移动的unit */
    private _moveUnit: UnitBase = null;
    /** 当前选中的unit */
    private _curUnit: UnitBase = null;
    /** 临时连线 */
    private _tempLine: Line = null;
    /** 当前选中的line */
    private _curLine: Line = null;

    /** 上一次点击到StateMachine的时间 ms */
    private _lastClickTime: number = 0;

    protected onLoad() {
        this.node.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
        this.node.on(cc.Node.EventType.MOUSE_UP, this.onMouseUp, this);
        this.node.on(cc.Node.EventType.MOUSE_ENTER, this.onMouseEnter, this);
        this.node.on(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.node.on(cc.Node.EventType.MOUSE_LEAVE, this.onMouseLeave, this);
        this.node.on(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);

        Events.targetOn(this);
    }

    protected onDestroy() {
        Events.targetOff(this);
    }

    protected lateUpdate() {
        if (this._moveUnit && this.MachineLayer.checkMoveUnit(this._moveUnit)) {
            this.Cross.active = true;
        } else {
            this.Cross.active = false;
        }
    }

    /**
     * 按下鼠标左键的处理
     */
    private onMouseDownLeft(worldPos: cc.Vec2, posInCurLayer: cc.Vec2) {
        let nextUnit = this.MachineLayer.getUnitByPos(posInCurLayer);
        if (nextUnit instanceof UnitState) {
            // 点击到AnyState删除临时连线
            if (nextUnit.isAnyState) {
                this.deleteLine(this._tempLine);
            }

            this._curLine && this._curLine.select(false);
            this._curLine = null;
            this._moveUnitOffset = posInCurLayer.sub(nextUnit.node.position);
            this._moveUnit = nextUnit;

            if (this._curUnit !== nextUnit) {
                if (this._tempLine) {
                    this._moveUnit = null;

                    // 处理临时连线
                    let line = this.MachineLayer.getLineByUnit(this._curUnit, nextUnit);
                    // 新增transition
                    this._curUnit.addTransition(nextUnit, nextUnit.state);
                    if (line) {
                        // 删除临时连线
                        this.deleteLine(this._tempLine);
                    } else {
                        // 连接line
                        this._tempLine.onInit(this._curUnit, nextUnit);
                        // 清除
                        this._tempLine = null;
                    }
                } else {
                    // 选中state
                    this._curUnit && this._curUnit.select(false);
                    this._curUnit = nextUnit;
                    this._curUnit.select(true);
                    Events.emit(EventName.INSPECTOR_SHOW_UNIT, this._curUnit);
                }
            }
        } else if (nextUnit instanceof UnitStateMachine) {
            let now = Date.now();
            let delt = now - this._lastClickTime;
            this._lastClickTime = now;
            if (this._curUnit === nextUnit && delt < 500) {
                this.setCurStateMachine(nextUnit.stateMachine);
                return;
            }

            this._curLine && this._curLine.select(false);
            this._curLine = null;
            this._moveUnitOffset = posInCurLayer.sub(nextUnit.node.position);
            this._moveUnit = nextUnit;

            if (this._curUnit !== nextUnit) {
                if (this._tempLine) {
                    this._moveUnit = null;

                    // 弹出选择菜单，显示状态机中所有状态
                    Events.emit(EventName.SHOW_LINE_TO_List, worldPos, nextUnit, this.MachineLayer.curStateMachine);
                } else {
                    // 选中unit
                    this._curUnit && this._curUnit.select(false);
                    this._curUnit = nextUnit;
                    this._curUnit.select(true);
                    Events.emit(EventName.INSPECTOR_SHOW_UNIT, this._curUnit);
                }
            }
        } else {
            this._moveUnit = null;
            this._curUnit && this._curUnit.select(false);
            this._curUnit = null;
            let nextLine = this.MachineLayer.getLineByPos(posInCurLayer);
            if (nextLine) {
                if (this._curLine !== nextLine) {
                    // 选中line
                    this._curLine && this._curLine.select(false);
                    this._curLine = nextLine;
                    this._curLine.select(true);
                    Events.emit(EventName.INSPECTOR_SHOW_LINE, this._curLine);
                }
            } else {
                this._curLine && this._curLine.select(false);
                this._curLine = null;
                Events.emit(EventName.INSPECTOR_HIDE);
            }

            // 删除临时连线
            this.deleteLine(this._tempLine);
        }
    }

    /**
     * 按下鼠标右键的处理
     */
    private onMouseDownRight(posInCurLayer: cc.Vec2) {
        // 判断是否选中state
        let nextUnit = this.MachineLayer.getUnitByPos(posInCurLayer);
        if (nextUnit) {
            this._curLine && this._curLine.select(false);
            this._curLine = null;
            this._moveUnitOffset = posInCurLayer.sub(nextUnit.node.position);

            if (this._curUnit !== nextUnit) {
                this._curUnit && this._curUnit.select(false);
                this._curUnit = nextUnit;
                this._curUnit.select(true);
                Events.emit(EventName.INSPECTOR_SHOW_UNIT, this._curUnit);
            }
        }

        // 删除临时连线
        this.deleteLine(this._tempLine);
    }

    private onMouseDown(event: cc.Event.EventMouse) {
        this._curMouseBtn = event.getButton();
        let posInCtr: cc.Vec2 = this.node.convertToNodeSpaceAR(event.getLocation());
        let posInCurLayer: cc.Vec2 = this.MachineLayer.node.convertToNodeSpaceAR(event.getLocation());

        if (this._curMouseBtn === cc.Event.EventMouse.BUTTON_LEFT) {
            // 按下鼠标左键
            this.onMouseDownLeft(event.getLocation(), posInCurLayer);
        } else if (this._curMouseBtn === cc.Event.EventMouse.BUTTON_RIGHT) {
            // 按下鼠标右键
            this.onMouseDownRight(posInCurLayer);
        } else if (this._curMouseBtn === cc.Event.EventMouse.BUTTON_MIDDLE) {

        }
    }

    private onMouseUp(event: cc.Event.EventMouse) {
        let posInCtr: cc.Vec2 = this.node.convertToNodeSpaceAR(event.getLocation());
        let posInCurLayer: cc.Vec2 = this.MachineLayer.node.convertToNodeSpaceAR(event.getLocation());

        if (this._curMouseBtn === cc.Event.EventMouse.BUTTON_LEFT) {
            // bug: 没处理跨越多层transition
            if (this._moveUnit && this.MachineLayer.moveIntoStateMachine(this._moveUnit)) {
                this._moveUnit = null;
                this._curUnit = null;
                Events.emit(EventName.INSPECTOR_HIDE);
            }
        } else if (this._curMouseBtn === cc.Event.EventMouse.BUTTON_RIGHT) {
            // 松开鼠标右键 弹出右键菜单
            let state = this.MachineLayer.getUnitByPos(posInCurLayer);
            let curState = (this._curUnit && this._curUnit === state) ? this._curUnit : null;
            Events.emit(EventName.SHOW_RIGHT_MENU, event.getLocation(), curState);
        } else if (this._curMouseBtn === cc.Event.EventMouse.BUTTON_MIDDLE) {
        }

        // 松开鼠标按键时清空
        this._curMouseBtn = null;
    }

    private onMouseEnter(event: cc.Event.EventMouse) {
        if (event.getButton() === null) {
            this._curMouseBtn = null;
        }
    }

    private onMouseMove(event: cc.Event.EventMouse) {
        let posInCtr: cc.Vec2 = this.node.convertToNodeSpaceAR(event.getLocation());
        let posInCurLayer: cc.Vec2 = this.MachineLayer.node.convertToNodeSpaceAR(event.getLocation());

        if (event.getButton() === null) {
            this._curMouseBtn = null;
        }

        // 移动临时连线
        if (this._curUnit && this._tempLine) {
            let unit = this.MachineLayer.getUnitByPos(posInCurLayer);
            if (unit && unit !== this._curUnit && ((unit instanceof UnitState && !unit.isAnyState) || unit instanceof UnitStateMachine)) {
                this._tempLine.setLine(this._curUnit.node.position, unit.node.position);
            } else {
                this._tempLine.setLine(this._curUnit.node.position, posInCurLayer);
            }
        }

        if (this._curMouseBtn === cc.Event.EventMouse.BUTTON_LEFT) {
            // 按住鼠标左键 移动选中的状态
            if (this._moveUnit) {
                this._moveUnit.setPos(posInCurLayer.sub(this._moveUnitOffset));
                this.Cross.position = posInCtr;
            }
        } else if (this._curMouseBtn === cc.Event.EventMouse.BUTTON_RIGHT) {

        } else if (this._curMouseBtn === cc.Event.EventMouse.BUTTON_MIDDLE) {
            // 按住鼠标中键 移动当前MachineLayer
            this.MachineLayer.setPos(this.MachineLayer.node.position.add(event.getDelta()));
        }
    }

    private onMouseLeave(event: cc.Event.EventMouse) {
        if (event.getButton() === null) {
            this._curMouseBtn = null;
        }
    }

    private onMouseWheel(event: cc.Event.EventMouse) {
        // 滚动鼠标滚轮 缩放当前MachineLayer
        this.MachineLayer.changeScale(event.getScrollY() > 0, event.getLocation());
    }

    private setCurStateMachine(stateMachine: StateMachine) {
        if (this.MachineLayer.curStateMachine === stateMachine) {
            return;
        }
        this._lastClickTime = 0;
        this._moveUnit = null;
        this._curUnit = null;
        this._tempLine = null;
        this._curLine = null;
        this.MachineLayer.setCurStateMachine(stateMachine);
        Events.emit(EventName.INSPECTOR_HIDE);
    }

    /**
     * 删除line
     */
    private deleteLine(line: Line) {
        if (!line) {
            return;
        }
        if (this._curLine === line) {
            this._curLine = null;
        }
        if (this._tempLine === line) {
            this._tempLine = null;
        }
        this.MachineLayer.deleteLine(line);
    }

    /**
     * 删除当前选中的line
     */
    public deleteCurLine() {
        if (!this._curLine) {
            return;
        }

        this.deleteLine(this._curLine);
        Events.emit(EventName.INSPECTOR_HIDE);
    }

    /**
     * 删除当前选中的unit
     */
    public deleteCurUnit() {
        if (!this._curUnit) {
            return;
        }

        if (this._curUnit instanceof UnitState) {
            if (this._curUnit.isAnyState) {
                return;
            }
            this.MachineLayer.deleteState(this._curUnit);
        } else if (this._curUnit instanceof UnitStateMachine) {
            if (this._curUnit.isUp) {
                return;
            }
            this.MachineLayer.deleteStateMachine(this._curUnit);
        }
        this._curUnit = null;
        this._moveUnit = null;
        this.deleteLine(this._tempLine);
        Events.emit(EventName.INSPECTOR_HIDE);
    }

    //#region 按钮回调
    private onClickCreateState(event: cc.Event) {
        Events.emit(EventName.CLOSE_MENU);
        let menuNode: cc.Node = Editor.Inst.Menu.RightMenu;
        let posInCurLayer: cc.Vec2 = this.MachineLayer.node.convertToNodeSpaceAR(menuNode.parent.convertToWorldSpaceAR(menuNode.position));
        this.MachineLayer.createState(posInCurLayer);
    }

    private onClickCreateSubMachine() {
        Events.emit(EventName.CLOSE_MENU);
        let menuNode: cc.Node = Editor.Inst.Menu.RightMenu;
        let posInCurLayer: cc.Vec2 = this.MachineLayer.node.convertToNodeSpaceAR(menuNode.parent.convertToWorldSpaceAR(menuNode.position));
        this.MachineLayer.createStateMachine(posInCurLayer);
    }

    private onClickMakeTrasition() {
        Events.emit(EventName.CLOSE_MENU);
        if (!this._curUnit) {
            return;
        }
        this._tempLine = this.MachineLayer.createLine();
        this._tempLine.setLine(this._curUnit.node.position, this._curUnit.node.position);
    }

    private onClickSetDefault() {
        Events.emit(EventName.CLOSE_MENU);
        if (!this._curUnit || !(this._curUnit instanceof UnitState) || this._curUnit.isAnyState) {
            return;
        }
        this.MachineLayer.setDefaultState(this._curUnit);
    }

    private onClickDeleteCurUnit() {
        Events.emit(EventName.CLOSE_MENU);
        this.deleteCurUnit();
    }
    //#endregion

    //#region 事件监听
    @preloadEvent(EventName.LINE_TO_MACHINE_STATE)
    private onEventLineToMachineState(state: State, to: UnitStateMachine) {
        if (!this._curUnit || !this._tempLine) {
            return;
        }

        this._moveUnit = null;

        // 处理临时连线
        let line = this.MachineLayer.getLineByUnit(this._curUnit, to);
        // 新增transition
        this._curUnit.addTransition(to, state);
        if (line || (this._curUnit instanceof UnitState && this._curUnit.isAnyState)) {
            // 删除临时连线
            this.deleteLine(this._tempLine);
        } else {
            // 连接line
            this._tempLine.onInit(this._curUnit, to);
            // 清除
            this._tempLine = null;
        }
    }

    @preloadEvent(EventName.LINE_DELETE)
    private onEventLineDelete(line: Line) {
        this.deleteLine(line);
    }

    @preloadEvent(EventName.SET_CUR_STATE_MACHINE)
    private onEventSetCurStateMachine(stateMachine: StateMachine) {
        this.setCurStateMachine(stateMachine);
    }
    //#endregion

    //#region import and export
    private importTransitions(transitionsData: any[], state: State, stateMap: Map<string, State>, paramMap: Map<string, ParamItem>) {
        transitionsData.forEach((e) => {
            let toState: State = stateMap.get(e.toState);
            let transition: Transition = state.addTransition(toState);
            transition.hasExitTime = e.hasExitTime;
            e.conditions.forEach((cData) => {
                let paramItem = paramMap.get(cData.param);
                let condition: Condition = transition.addCondition(paramItem);
                condition.value = cData.value;
                condition.logic = cData.logic;
            });
        });
    }

    private importSubState(upData: any, upMachine: StateMachine, stateDataMap: Map<string, any>, stateMap: Map<string, State>, paramMap: Map<string, ParamItem>) {
        upData.subStates.forEach((name: string) => {
            let state = new State(upMachine, false);
            stateMap.set(name, state);
            let data = stateDataMap.get(name);
            state.setPosition(data.position[0], data.position[1]);
            state.name = data.state;
            state.motion = data.motion;
            state.speed = data.speed;
            state.multiplierParam = paramMap.get(data.multiplier) || null;
            state.loop = data.loop;

            upMachine.add(state);
        });
    }

    private importSubMachine(upData: any, upMachine: StateMachine, subMachineDataMap: Map<string, any>, subMachineMap: Map<string, StateMachine>, stateDataMap: Map<string, any>, stateMap: Map<string, State>, paramMap: Map<string, ParamItem>) {
        upData.subStateMachines.forEach((name: string) => {
            let stateMachine = new StateMachine(upMachine);
            subMachineMap.set(name, stateMachine);
            let data = subMachineDataMap.get(name);
            stateMachine.setLayerPos(data.layerPos[0], data.layerPos[1]);
            stateMachine.setLayerScale(data.layerScale);
            stateMachine.setAnyStatePos(data.anyStatePos[0], data.anyStatePos[1]);
            stateMachine.name = data.name;
            stateMachine.setPosition(data.position[0], data.position[1]);
            stateMachine.setUpStateMachinePos(data.upStateMachinePos[0], data.upStateMachinePos[1]);

            upMachine.add(stateMachine);

            this.importSubState(data, stateMachine, stateDataMap, stateMap, paramMap);
            this.importSubMachine(data, stateMachine, subMachineDataMap, subMachineMap, stateDataMap, stateMap, paramMap);
        });
    }

    private exportAllSubMachine(arr: any[], stateMachine: StateMachine) {
        stateMachine.subStateMachines.forEach((sub) => {
            let data = {
                layerPos: [sub.layerPos.x, sub.layerPos.y],
                layerScale: sub.layerScale,
                anyStatePos: [sub.anyStatePos.x, sub.anyStatePos.y],
                name: sub.name,
                position: [sub.position.x, sub.position.y],
                upStateMachine: sub.upStateMachine.name,
                upStateMachinePos: [sub.upStateMachinePos.x, sub.upStateMachinePos.y],
                subStates: [],
                subStateMachines: [],
            }
            sub.subStates.forEach((e) => {
                data.subStates.push(e.name);
            });
            sub.subStateMachines.forEach((e) => {
                data.subStateMachines.push(e.name);
            });
            arr.push(data);
            this.exportAllSubMachine(arr, sub);
        });
    }

    private exportAllState(arr: any[], stateMachine: StateMachine, isRuntimeData: boolean = false) {
        stateMachine.subStates.forEach((e) => {
            let data = null;
            if (isRuntimeData) {
                data = {
                    state: e.name,
                    motion: e.motion,
                    speed: e.speed,
                    multiplier: e.getMultiplierName(),
                    loop: e.loop,
                    transitions: e.getAllTransitionData()
                }
            } else {
                data = {
                    position: [e.position.x, e.position.y],
                    upStateMachine: e.upStateMachine.name,
                    state: e.name,
                    motion: e.motion,
                    speed: e.speed,
                    multiplier: e.getMultiplierName(),
                    loop: e.loop,
                    transitions: e.getAllTransitionData()
                }
            }
            arr.push(data);
        });
        stateMachine.subStateMachines.forEach((sub) => {
            this.exportAllState(arr, sub);
        });
    }

    /**
     * 导入工程数据
     */
    public importProject(data: any) {
        let paramMap: Map<string, ParamItem> = Editor.Inst.Parameters.getParamMap();

        let mainStateMachineData = data.mainStateMachine;
        let subStateMachinesData = data.subStateMachines;
        let defaultStateData: string = data.defaultState;
        let anyStateData = data.anyState;
        let statesData = data.states;

        let stateDataMap: Map<string, any> = new Map();
        statesData.forEach((e: any) => { stateDataMap.set(e.state, e); });
        let stateMap: Map<string, State> = new Map();

        let subMachineDataMap: Map<string, any> = new Map();
        subStateMachinesData.forEach((e: any) => { subMachineDataMap.set(e.name, e) });
        let subMachineMap: Map<string, StateMachine> = new Map();

        let main = this.MachineLayer.mainStateMachine;
        main.setLayerPos(mainStateMachineData.layerPos[0], mainStateMachineData.layerPos[1]);
        main.setLayerScale(mainStateMachineData.layerScale);
        main.setAnyStatePos(mainStateMachineData.anyStatePos[0], mainStateMachineData.anyStatePos[1]);
        this.importSubState(mainStateMachineData, main, stateDataMap, stateMap, paramMap);
        this.importSubMachine(mainStateMachineData, main, subMachineDataMap, subMachineMap, stateDataMap, stateMap, paramMap);

        if (stateMap.has(defaultStateData))
            this.MachineLayer.defaultState = stateMap.get(defaultStateData);

        this.importTransitions(anyStateData.transitions, this.MachineLayer.anyState.state, stateMap, paramMap);
        statesData.forEach((e: any) => {
            let state: State = stateMap.get(e.state);
            if (!state) {
                cc.error('error');
            }
            this.importTransitions(e.transitions, state, stateMap, paramMap);
        });

        this.MachineLayer.setCurStateMachine();
    }

    /**
     * 导入cocos animation文件
     */
    public importAnim(animData: any) {
        let x = Tool.randFloat(-this.MachineLayer.node.x - 100, -this.MachineLayer.node.x + 100);
        let y = Tool.randFloat(-this.MachineLayer.node.y - 100, -this.MachineLayer.node.y + 100);
        let unitState = this.MachineLayer.createState(cc.v2(x, y));
        let state: State = unitState.state;
        state.name = animData._name;
        state.motion = animData._name;
        state.speed = animData.speed;
        state.loop = animData.wrapMode === cc.WrapMode.Loop;
    }

    /**
     * 导入spine json文件
     */
    public improtSpine(spineData: any) {
        for (let name in spineData.animations) {
            let x = Tool.randFloat(-this.MachineLayer.node.x - 100, -this.MachineLayer.node.x + 100);
            let y = Tool.randFloat(-this.MachineLayer.node.y - 100, -this.MachineLayer.node.y + 100);
            let unitState = this.MachineLayer.createState(cc.v2(x, y));
            let state: State = unitState.state;
            state.name = name;
            state.motion = name;
        }
    }

    /**
     * 导入dragonbones json文件
     */
    public importDragonBones(data: any) {
        data.armature.forEach((e) => {
            e.animation.forEach((anim) => {
                let x = Tool.randFloat(-this.MachineLayer.node.x - 100, -this.MachineLayer.node.x + 100);
                let y = Tool.randFloat(-this.MachineLayer.node.y - 100, -this.MachineLayer.node.y + 100);
                let unitState = this.MachineLayer.createState(cc.v2(x, y));
                let state: State = unitState.state;
                state.name = anim.name;
                state.motion = anim.name;
                state.loop = anim.playTimes === 0;
            });
        });
    }

    /**
     * 导出工程数据
     */
    public exportProject() {
        let main = this.MachineLayer.mainStateMachine;
        let animator = ANIMATOR_VERSION;
        let mainStateMachine = {
            layerPos: [main.layerPos.x, main.layerPos.y],
            layerScale: main.layerScale,
            anyStatePos: [main.anyStatePos.x, main.anyStatePos.y],
            subStates: [],
            subStateMachines: [],
        };
        main.subStates.forEach((e) => {
            mainStateMachine.subStates.push(e.name);
        });
        main.subStateMachines.forEach((e) => {
            mainStateMachine.subStateMachines.push(e.name);
        });
        let subStateMachines = [];
        this.exportAllSubMachine(subStateMachines, main);

        let defaultState: string = this.MachineLayer.defaultState ? this.MachineLayer.defaultState.name : '';
        let anyState = {
            transitions: this.MachineLayer.anyState.state.getAllTransitionData()
        };
        let states = [];
        this.exportAllState(states, main);
        return {
            animator: animator,
            mainStateMachine: mainStateMachine,
            subStateMachines: subStateMachines,
            defaultState: defaultState,
            anyState: anyState,
            states: states
        };
    }

    /**
     * 导出runtime数据
     */
    public exportRuntimeData() {
        let main = this.MachineLayer.mainStateMachine;
        let defaultState: string = this.MachineLayer.defaultState ? this.MachineLayer.defaultState.name : '';
        let anyState = {
            transitions: this.MachineLayer.anyState.state.getAllTransitionData()
        };
        let states = [];
        this.exportAllState(states, main, true);
        return {
            defaultState: defaultState,
            anyState: anyState,
            states: states
        };
    }
    //#endregion
}
