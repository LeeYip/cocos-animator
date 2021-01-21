import DragList from "../../common/cmpt/DragList";
import Events, { EventName, preloadEvent } from "../../common/util/Events";
import RecyclePool from "../../common/util/RecyclePool";
import Res from "../../common/util/Res";
import Tool from "../../common/util/Tool";
import { ResUrl } from "../../constant/ResUrl";
import Transition from "../data/Transition";
import Editor from "../Editor";
import Line from "../fsm/Line";
import UnitBase from "../fsm/UnitBase";
import UnitState from "../fsm/UnitState";
import UnitStateMachine from "../fsm/UnitStateMachine";
import ParamItem from "../parameters/ParamItem";
import ConditionItem from "./ConditionItem";
import TransitionItem from "./TransitionItem";

const { ccclass, property } = cc._decorator;

@ccclass
export default class InspectorCtr extends cc.Component {
    @property(cc.Node) UnitInfo: cc.Node = null;
    @property(cc.Node) NameNode: cc.Node = null;
    @property(cc.Node) MotionNode: cc.Node = null;
    @property(cc.Node) SpeedNode: cc.Node = null;
    @property(cc.Node) MultiplierNode: cc.Node = null;
    @property(cc.Node) LoopNode: cc.Node = null;

    @property(cc.Node) TransitionInfo: cc.Node = null;
    @property(DragList) TransitionList: DragList = null;

    @property(cc.Node) ConditionInfo: cc.Node = null;
    @property(DragList) ConditionList: DragList = null;
    @property(cc.Label) CurTransLab: cc.Label = null;
    @property(cc.Toggle) HasExitTime: cc.Toggle = null;

    private _layout: cc.Layout = null;
    private _transitionInfoLayout: cc.Layout = null;
    private _conditionInfoLayout: cc.Layout = null;

    private _nameEdit: cc.EditBox = null;
    private _motionEdit: cc.EditBox = null;
    private _speedEdit: cc.EditBox = null;
    private _loopToggle: cc.Toggle = null;
    private _multiplierLabel: cc.Label = null;

    /** fsm视图中选中的节点 */
    private _unit: UnitBase = null;
    /** fsm视图选中的连线 */
    private _line: Line = null;

    /** 选中的TransitionItem */
    private _transitionItem: TransitionItem = null;
    private _transLayoutDirty: boolean = false;

    /** 选中的ConditionItem */
    private _conditionItem: ConditionItem = null;
    private _conLayoutDirty: boolean = false;

    protected onLoad() {
        this.UnitInfo.active = false;
        this.TransitionInfo.active = false;
        this.ConditionInfo.active = false;

        this._layout = this.getComponent(cc.ScrollView).content.getComponent(cc.Layout);
        this._transitionInfoLayout = this.TransitionInfo.getComponent(cc.Layout);
        this._conditionInfoLayout = this.ConditionInfo.getComponent(cc.Layout);

        this._nameEdit = this.NameNode.children[0].getComponent(cc.EditBox);
        this._motionEdit = this.MotionNode.children[0].getComponent(cc.EditBox);
        this._speedEdit = this.SpeedNode.children[0].getComponent(cc.EditBox);
        this._loopToggle = this.LoopNode.children[0].getComponent(cc.Toggle);
        this._multiplierLabel = this.MultiplierNode.children[1].getComponent(cc.Label);

        // 注册拖拽回调
        this.TransitionList.setDragCall(this.transitionDragCall, this);
        this.ConditionList.setDragCall(this.conditionDragCall, this);

        Events.targetOn(this);
    }

    protected onEnable() {
        // 屏蔽scrollView内部touch事件，防止与拖拽行为产生冲突
        let scrollView = this.getComponent(cc.ScrollView);
        scrollView.node.off(cc.Node.EventType.TOUCH_START, scrollView['_onTouchBegan'], scrollView, true);
        scrollView.node.off(cc.Node.EventType.TOUCH_MOVE, scrollView['_onTouchMoved'], scrollView, true);
        scrollView.node.off(cc.Node.EventType.TOUCH_END, scrollView['_onTouchEnded'], scrollView, true);
        scrollView.node.off(cc.Node.EventType.TOUCH_CANCEL, scrollView['_onTouchCancelled'], scrollView, true);
    }

    protected onDestroy() {
        Events.targetOff(this);
    }

    protected lateUpdate() {
        let doUpdate: boolean = false;
        if (this._transLayoutDirty) {
            this._transLayoutDirty = false;
            this.TransitionList.node.height = 40;
            this.TransitionList.layout.updateLayout();
            this._transitionInfoLayout.updateLayout();
            doUpdate = true;
        }
        if (this._conLayoutDirty) {
            this._conLayoutDirty = false;
            this.ConditionList.node.height = 40;
            this.ConditionList.layout.updateLayout();
            this._conditionInfoLayout.updateLayout();
            doUpdate = true;
        }
        if (doUpdate) {
            this._layout.updateLayout();
        }
    }

    private transitionDragCall(dragIdx: number, toIdx: number) {
        if (!(this._unit instanceof UnitState) || !this._transitionItem) {
            return;
        }
        this._unit.state.moveTransition(dragIdx, toIdx);
    }

    private conditionDragCall(dragIdx: number, toIdx: number) {
        if (!this._transitionItem || !this._conditionItem) {
            return;
        }
        this._transitionItem.transition.moveCondition(dragIdx, toIdx);
    }

    private getTransitionItem() {
        let prefab = Res.getLoaded(ResUrl.PREFAB.TRANSITION_ITEM);
        let node: cc.Node = RecyclePool.get(TransitionItem) || cc.instantiate(prefab);
        node.width = this.TransitionList.node.width;
        Tool.updateWidget(node);
        return node;
    }

    private putTransitionItem(node: cc.Node) {
        this._transLayoutDirty = true;
        RecyclePool.put(TransitionItem, node);
    }

    private getConditionItem() {
        let prefab = Res.getLoaded(ResUrl.PREFAB.CONDITION_ITEM);
        let node: cc.Node = RecyclePool.get(ConditionItem) || cc.instantiate(prefab);
        node.width = this.ConditionList.node.width;
        Tool.updateWidget(node);
        return node;
    }

    private putConditionItem(node: cc.Node) {
        this._conLayoutDirty = true;
        RecyclePool.put(ConditionItem, node);
    }

    private showUnitInfo() {
        if (!this._unit) {
            this.UnitInfo.active = false;
            return;
        }

        if (this._unit instanceof UnitState) {
            if (this._unit.isAnyState) {
                this.UnitInfo.active = false;
                return;
            }
            this.NameNode.active = true;
            this.MotionNode.active = true;
            this.SpeedNode.active = true;
            this.MultiplierNode.active = true
            this.LoopNode.active = true;
            this._nameEdit.string = this._unit.state.name;
            this._motionEdit.string = this._unit.state.motion;
            this._speedEdit.string = `${this._unit.state.speed}`;
            this._loopToggle.isChecked = this._unit.state.loop;
            this._multiplierLabel.string = this._unit.state.getMultiplierName();
        } else if (this._unit instanceof UnitStateMachine) {
            this.NameNode.active = true;
            this.MotionNode.active = false;
            this.SpeedNode.active = false;
            this.MultiplierNode.active = false
            this.LoopNode.active = false;
            this._nameEdit.string = this._unit.stateMachine.name;
        }
        this.UnitInfo.active = true;
    }

    private showTransitionInfo() {
        this.TransitionInfo.active = true;

        this._transitionItem = null;
        for (let i = this.TransitionList.node.childrenCount - 1; i >= 0; i--) {
            this.putTransitionItem(this.TransitionList.node.children[i]);
        }

        if (this._unit) {
            if (this._unit instanceof UnitStateMachine) {
                this.TransitionInfo.active = false;
                return;
            }
            this._unit.getTransitions().forEach((data: Transition) => {
                let item = this.getTransitionItem();
                this.TransitionList.node.addChild(item);
                item.getComponent(TransitionItem).onInit(data, this._unit);
            });
            this.TransitionList.canDrag = true;
        } else if (this._line) {
            let isFirst: boolean = true;
            this._line.getTransitions().forEach((data: Transition) => {
                let item = this.getTransitionItem();
                this.TransitionList.node.addChild(item);
                let transitionItem: TransitionItem = item.getComponent(TransitionItem);
                transitionItem.onInit(data, this._unit);
                if (isFirst) {
                    transitionItem.select(isFirst);
                    this._transitionItem = transitionItem;
                    isFirst = false;
                }
            });
            this.TransitionList.canDrag = false;
        }
    }

    private showConditionInfo() {
        if (!this._transitionItem) {
            this.ConditionInfo.active = false;
            return;
        }

        this.ConditionInfo.active = true;
        this.CurTransLab.string = this._transitionItem.transition.getTransStr();
        this.HasExitTime.isChecked = this._transitionItem.transition.hasExitTime;

        // 根据transition生成condition
        this._conditionItem = null;
        for (let i = this.ConditionList.node.childrenCount - 1; i >= 0; i--) {
            this.putConditionItem(this.ConditionList.node.children[i]);
        }
        this._transitionItem.transition.conditions.forEach((e) => {
            let item = this.getConditionItem();
            this.ConditionList.node.addChild(item);
            item.getComponent(ConditionItem).onInit(e);
        });
    }

    /**
     * 隐藏inspector显示的内容
     */
    private hide() {
        this._unit = null;
        this._line = null;
        this.UnitInfo.active = false;
        this.TransitionInfo.active = false;
        this.ConditionInfo.active = false;
    }

    //#region editbox、toggle、按钮回调
    private onNameChanged() {
        if (this._unit instanceof UnitState) {
            if (this._nameEdit.string === '') {
                this._nameEdit.string = this._unit.state.name;
                return;
            }
            this._unit.state.name = this._nameEdit.string;
            this._nameEdit.string = this._unit.state.name;
        } else if (this._unit instanceof UnitStateMachine) {
            if (this._nameEdit.string === '') {
                this._nameEdit.string = this._unit.stateMachine.name;
                return;
            }
            this._unit.stateMachine.name = this._nameEdit.string;
            this._nameEdit.string = this._unit.stateMachine.name;
        }
    }

    private onMotionChanged() {
        if (!(this._unit instanceof UnitState)) {
            return;
        }
        this._unit.state.motion = this._motionEdit.string;
    }

    private onSpeedChanged() {
        if (!(this._unit instanceof UnitState)) {
            return;
        }
        this._speedEdit.string = this._speedEdit.string.replace(/[^.\d]/g, '');
        if (this._speedEdit.string === '') {
            return;
        }
        let speed = parseFloat(this._speedEdit.string);
        this._unit.state.speed = isNaN(speed) ? 1 : speed;
        this._speedEdit.string = `${this._unit.state.speed}`;
    }

    private onLoopCheckd() {
        if (!(this._unit instanceof UnitState)) {
            return;
        }
        this._unit.state.loop = this._loopToggle.isChecked;
    }

    private onClickMultiplier(event: cc.Event) {
        if (!(this._unit instanceof UnitState)) {
            return;
        }
        Events.emit(EventName.SHOW_MULTIPLIER, event.target);
    }

    private onClickDeleteTransition() {
        if (!this._transitionItem) {
            return;
        }

        this._transitionItem.delete();
        this.putTransitionItem(this._transitionItem.node);
        this._transitionItem = null;

        if (this._unit) {
            this.ConditionInfo.active = false;
        } else {
            if (this.TransitionList.node.childrenCount <= 0) {
                this.hide();
            } else {
                this.ConditionInfo.active = false;
            }
        }
    }

    private onHasExitTimeCheckd() {
        if (!this._transitionItem) {
            return;
        }

        this._transitionItem.transition.hasExitTime = this.HasExitTime.isChecked;
    }

    private onClickAddCondition() {
        if (!this._transitionItem) {
            return;
        }
        if (Editor.Inst.Parameters.ParamContent.childrenCount <= 0) {
            return;
        }

        let paramItem: ParamItem = Editor.Inst.Parameters.ParamContent.children[0].getComponent(ParamItem);
        let data = this._transitionItem.transition.addCondition(paramItem);
        let node = this.getConditionItem();
        this.ConditionList.node.addChild(node);
        node.getComponent(ConditionItem).onInit(data);
    }

    private onClickDeleteCondition() {
        if (!this._transitionItem || !this._conditionItem) {
            return;
        }

        this._transitionItem.transition.deleteCondition(this._conditionItem.condition);
        this.putConditionItem(this._conditionItem.node);
        this._conditionItem = null;
    }
    //#endregion

    //#region 事件监听
    @preloadEvent(EventName.STATE_NAME_CHANGED)
    private onEventStateChanged(unit: UnitState) {
        if (!this._transitionItem) {
            return;
        }

        this.CurTransLab.string = this._transitionItem.transition.getTransStr();
    }

    @preloadEvent(EventName.TRANSITION_ADD)
    private onEventTransitionAdd(fromUnit: UnitBase, toUnit: UnitBase, transition: Transition) {
        if (this._unit === fromUnit) {
            let item = this.getTransitionItem();
            this.TransitionList.node.addChild(item);
            item.getComponent(TransitionItem).onInit(transition, this._unit);
        }
    }

    @preloadEvent(EventName.TRANSITION_SELECT)
    private onEventTransitionSelect(item: TransitionItem) {
        this._transitionItem = item;
        this.TransitionList.node.children.forEach((e) => {
            let ti = e.getComponent(TransitionItem);
            ti.select(ti === item);
        });

        this.showConditionInfo();
    }

    @preloadEvent(EventName.CONDITION_SELECT)
    private onEventConditionSelect(item: ConditionItem) {
        this._conditionItem = item;
        this.ConditionList.node.children.forEach((e) => {
            let ti = e.getComponent(ConditionItem);
            ti.select(ti === item);
        });
    }

    @preloadEvent(EventName.MULTIPLIER_SELECT)
    private onEventMultiplierSelect(paramItem: ParamItem) {
        if (!(this._unit instanceof UnitState)) {
            return;
        }
        this._unit.state.multiplierParam = paramItem;
        this._multiplierLabel.string = this._unit.state.getMultiplierName();
    }

    @preloadEvent(EventName.PARAM_DELETE)
    private onEventParamDelete(paramItem: ParamItem) {
        if (!this._transitionItem) {
            return;
        }

        // 删除
        if (this._conditionItem && this._conditionItem.condition.paramItem === paramItem) {
            this._conditionItem = null;
        }
        for (let i = this.ConditionList.node.childrenCount - 1; i >= 0; i--) {
            let ci: ConditionItem = this.ConditionList.node.children[i].getComponent(ConditionItem);
            if (ci.condition.paramItem === paramItem) {
                this.putConditionItem(this.ConditionList.node.children[i]);
            }
        }
    }

    @preloadEvent(EventName.PARAM_NAME_CHANGED)
    private onEventParamChanged(paramItem: ParamItem) {
        if (!(this._unit instanceof UnitState) || this._unit.state.multiplierParam !== paramItem) {
            return;
        }
        this._multiplierLabel.string = this._unit.state.multiplierParam.paramName;
    }

    @preloadEvent(EventName.INSPECTOR_HIDE)
    private onEventInspectorHide() {
        this.hide();
    }

    @preloadEvent(EventName.INSPECTOR_SHOW_UNIT)
    private onEventShowUnit(unit: UnitBase) {
        this._unit = unit;
        this._line = null;
        this.showUnitInfo();
        this.showTransitionInfo();
        this.showConditionInfo();
    }

    @preloadEvent(EventName.INSPECTOR_SHOW_LINE)
    private onEventShowLine(line: Line) {
        this._unit = null;
        this._line = line;

        this.showUnitInfo();
        this.showTransitionInfo();
        this.showConditionInfo();
    }

    @preloadEvent(EventName.RESIZE)
    private onEventResize(node: cc.Node) {
        if (node !== this.node) {
            return;
        }

        Tool.updateWidget(this.node, this.TransitionList.node, this.ConditionList.node);
        if (!this.TransitionInfo.active) {
            return;
        }
        this.TransitionList.node.children.forEach((e) => {
            e.width = this.TransitionList.node.width;
            Tool.updateWidget(e);
        });
        if (!this.ConditionInfo.active) {
            return;
        }
        this.ConditionList.node.children.forEach((e) => {
            e.width = this.ConditionList.node.width;
            Tool.updateWidget(e);
        });
    }
    //#endregion
}
