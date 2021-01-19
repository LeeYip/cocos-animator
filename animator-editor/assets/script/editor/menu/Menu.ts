import Events, { EventName, preloadEvent } from "../../common/util/Events";
import RecyclePool from "../../common/util/RecyclePool";
import Res from "../../common/util/Res";
import { ParamType } from "../../constant/BaseConst";
import { ResUrl } from "../../constant/ResUrl";
import State from "../data/State";
import StateMachine from "../data/StateMachine";
import Editor from "../Editor";
import UnitBase from "../fsm/UnitBase";
import UnitState from "../fsm/UnitState";
import UnitStateMachine from "../fsm/UnitStateMachine";
import ConditionItem from "../inspector/ConditionItem";
import ParamItem from "../parameters/ParamItem";
import LineToSubItem from "./LineToSubItem";
import MultiplierItem from "./MultiplierItem";
import ParamSelectItem from "./ParamSelectItem";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Menu extends cc.Component {
    @property(cc.Node) RightMenu: cc.Node = null;
    @property(cc.ScrollView) LineToSubList: cc.ScrollView = null;
    @property(cc.ScrollView) MultiplierList: cc.ScrollView = null;
    @property(cc.Node) ParamAdd: cc.Node = null;
    @property(cc.ScrollView) ParamSelect: cc.ScrollView = null;
    @property(cc.Node) ConditionLogic: cc.Node = null;

    /**
     * 选中弹出ConditionLogic菜单的conditionItem
     */
    private _conditionItem: ConditionItem = null;

    protected onLoad() {
        this.node.active = false;
        this.node.on(cc.Node.EventType.TOUCH_START, this.close, this);
        Events.targetOn(this);
    }

    protected onDestroy() {
        Events.targetOff(this);
    }

    private show(node: cc.Node) {
        this.node.active = true;
        this.RightMenu.active = this.RightMenu === node;
        this.LineToSubList.node.active = this.LineToSubList.node === node;
        this.MultiplierList.node.active = this.MultiplierList.node === node;
        this.ParamAdd.active = this.ParamAdd === node;
        this.ParamSelect.node.active = this.ParamSelect.node === node;
        this.ConditionLogic.active = this.ConditionLogic === node;
    }

    private close() {
        this.node.active = false;
    }

    private onClickConditionLogic(event: cc.Event, str: string) {
        this.close();
        this._conditionItem && this._conditionItem.changeLogic(parseInt(str));
    }

    @preloadEvent(EventName.CLOSE_MENU)
    private onEventCloseMenu() {
        this.close();
    }

    @preloadEvent(EventName.SHOW_RIGHT_MENU)
    private onEventShowRightMenu(worldPos: cc.Vec2, curUnit: UnitBase = null) {
        this.show(this.RightMenu);

        if (curUnit) {
            this.RightMenu.getChildByName('create').active = false;
            this.RightMenu.getChildByName('state').active = true;
            if (curUnit instanceof UnitState) {
                this.RightMenu.getChildByName('state').children[0].active = true;
                if (curUnit.isAnyState) {
                    this.RightMenu.getChildByName('state').children[1].active = false;
                    this.RightMenu.getChildByName('state').children[2].active = false;
                } else {
                    this.RightMenu.getChildByName('state').children[1].active = true;
                    this.RightMenu.getChildByName('state').children[2].active = true;
                }
            } else if (curUnit instanceof UnitStateMachine) {
                if (curUnit.isUp) {
                    this.close();
                    return;
                }
                this.RightMenu.getChildByName('state').children[0].active = false;
                this.RightMenu.getChildByName('state').children[1].active = false;
                this.RightMenu.getChildByName('state').children[2].active = true;
            }
            this.RightMenu.height = this.RightMenu.getChildByName('state').height;
        } else {
            this.RightMenu.getChildByName('create').active = true;
            this.RightMenu.getChildByName('state').active = false;
            this.RightMenu.height = this.RightMenu.getChildByName('create').height;
        }

        // 设置右键菜单坐标
        let pos = this.node.convertToNodeSpaceAR(worldPos);
        let x = pos.x;
        let y = pos.y - this.RightMenu.height < -this.node.height / 2 ? pos.y + this.RightMenu.height : pos.y;
        this.RightMenu.position = cc.v2(x, y);
    }

    @preloadEvent(EventName.SHOW_LINE_TO_List)
    private onEventShowLineToList(worldPos: cc.Vec2, toUnit: UnitStateMachine, cur: StateMachine) {
        this.show(this.LineToSubList.node);

        // 生成item
        for (let i = this.LineToSubList.content.childrenCount - 1; i >= 0; i--) {
            RecyclePool.put(LineToSubItem, this.LineToSubList.content.children[i]);
        }
        let states: Set<State> = null;
        if (toUnit.isUp) {
            states = cur.getAllOutStates();
        } else {
            states = toUnit.stateMachine.getAllSubStates();
        }
        if (states.size === 0) {
            let node: cc.Node = RecyclePool.get(LineToSubItem) || cc.instantiate(Res.getLoaded(ResUrl.PREFAB.LINE_TO_SUB_ITEM));
            this.LineToSubList.content.addChild(node);
            node.getComponent(LineToSubItem).onInit();
        } else {
            states.forEach((e) => {
                let node: cc.Node = RecyclePool.get(LineToSubItem) || cc.instantiate(Res.getLoaded(ResUrl.PREFAB.LINE_TO_SUB_ITEM));
                this.LineToSubList.content.addChild(node);
                node.getComponent(LineToSubItem).onInit(e, toUnit);
            });
        }

        // 修改高度
        let num = cc.misc.clampf(this.LineToSubList.content.childrenCount, 1, 10);
        this.LineToSubList.node.height = 40 * num + 20;
        this.LineToSubList.content.parent.height = 40 * num + 20;
        this.LineToSubList.node.getChildByName('scrollBar').getComponent(cc.Widget).updateAlignment();
        // 设置坐标
        let pos = this.node.convertToNodeSpaceAR(worldPos);
        let x = pos.x;
        let y = pos.y - this.LineToSubList.node.height < -this.node.height / 2 ? pos.y + this.LineToSubList.node.height : pos.y;
        this.LineToSubList.node.position = cc.v2(x, y);
    }

    @preloadEvent(EventName.SHOW_MULTIPLIER)
    private onEventShowMultiplierSelect(worldPos: cc.Vec2) {
        this.show(this.MultiplierList.node);

        this.MultiplierList.node.position = this.node.convertToNodeSpaceAR(worldPos);
        for (let i = this.MultiplierList.content.childrenCount - 1; i >= 0; i--) {
            RecyclePool.put(MultiplierItem, this.MultiplierList.content.children[i]);
        }
        let node: cc.Node = RecyclePool.get(MultiplierItem) || cc.instantiate(Res.getLoaded(ResUrl.PREFAB.MULTIPLIER_ITEM));
        this.MultiplierList.content.addChild(node);
        node.getComponent(MultiplierItem).onInit();
        Editor.Inst.ParamCtr.ParamContent.children.forEach((e) => {
            let paramItem = e.getComponent(ParamItem);
            if (paramItem.type !== ParamType.NUMBER) {
                return;
            }
            let node: cc.Node = RecyclePool.get(MultiplierItem) || cc.instantiate(Res.getLoaded(ResUrl.PREFAB.MULTIPLIER_ITEM));
            this.MultiplierList.content.addChild(node);
            node.getComponent(MultiplierItem).onInit(paramItem);
        });
        let num = cc.misc.clampf(this.MultiplierList.content.childrenCount, 1, 10);
        this.MultiplierList.node.height = 40 * num + 20;
        this.MultiplierList.content.parent.height = 40 * num + 20;
        this.MultiplierList.node.getChildByName('scrollBar').getComponent(cc.Widget).updateAlignment();
    }

    @preloadEvent(EventName.SHOW_PARAM_ADD)
    private onEventShowParamAdd(worldPos: cc.Vec2) {
        this.show(this.ParamAdd);

        this.ParamAdd.position = this.node.convertToNodeSpaceAR(worldPos);
    }

    @preloadEvent(EventName.SHOW_PARAM_SELECT)
    private onEventShowParamSelect(worldPos: cc.Vec2, targetHeight: number, conditionItem: ConditionItem) {
        this.show(this.ParamSelect.node);

        for (let i = this.ParamSelect.content.childrenCount - 1; i >= 0; i--) {
            RecyclePool.put(ParamSelectItem, this.ParamSelect.content.children[i]);
        }
        // 生成item
        Editor.Inst.ParamCtr.ParamContent.children.forEach((e) => {
            let node: cc.Node = RecyclePool.get(ParamSelectItem) || cc.instantiate(Res.getLoaded(ResUrl.PREFAB.PARAM_SELECT_ITEM));
            this.ParamSelect.content.addChild(node);
            node.getComponent(ParamSelectItem).onInit(e.getComponent(ParamItem), conditionItem);
        });

        let num = cc.misc.clampf(this.ParamSelect.content.childrenCount, 1, 10);
        this.ParamSelect.node.height = 40 * num + 10;
        this.ParamSelect.content.parent.height = 40 * num + 10;
        this.ParamSelect.node.getChildByName('scrollBar').getComponent(cc.Widget).updateAlignment();
        if (worldPos.y - targetHeight / 2 - this.ParamSelect.node.height > 0) {
            this.ParamSelect.node.position = this.node.convertToNodeSpaceAR(cc.v2(worldPos.x, worldPos.y - targetHeight / 2));
        } else {
            this.ParamSelect.node.position = this.node.convertToNodeSpaceAR(cc.v2(worldPos.x, worldPos.y + targetHeight / 2 + this.ParamSelect.node.height));
        }
    }

    @preloadEvent(EventName.SHOW_LOGIC)
    private onEventShowLogic(worldPos: cc.Vec2, targetHeight: number, conditionItem: ConditionItem) {
        this.show(this.ConditionLogic);

        if (worldPos.y - targetHeight / 2 - this.ConditionLogic.height > 0) {
            this.ConditionLogic.position = this.node.convertToNodeSpaceAR(cc.v2(worldPos.x, worldPos.y - targetHeight / 2));
        } else {
            this.ConditionLogic.position = this.node.convertToNodeSpaceAR(cc.v2(worldPos.x, worldPos.y + targetHeight / 2 + this.ConditionLogic.height));
        }

        this._conditionItem = conditionItem;
    }
}
