import Events, { EventName, preloadEvent } from "../../common/util/Events";
import { RecycleNode } from "../../common/util/RecyclePool";
import { LogicType, ParamType } from "../../constant/BaseConst";
import Condition from "../data/Condition";
import ParamItem from "../parameters/ParamItem";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ConditionItem extends cc.Component implements RecycleNode {
    @property(cc.Node) Bg: cc.Node = null;
    @property(cc.Label) ParamName: cc.Label = null;
    @property(cc.Node) LogicNode: cc.Node = null;
    @property(cc.Node) ValueNode: cc.Node = null;

    /** 组件是否初始化完成 */
    private _hasInit: boolean = false;

    public condition: Condition = null;

    public reuse() {
    }

    public unuse() {
        this._hasInit = false;
        Events.targetOff(this);
    }

    public onInit(condition: Condition) {
        this.Bg.opacity = 0;
        this.condition = condition;
        this.ParamName.string = this.condition.paramItem.paramName;
        if (this.condition.paramItem.type === ParamType.BOOLEAN) {
            this.LogicNode.active = false;
            this.ValueNode.active = true;
            this.ValueNode.getChildByName('number').active = false;
            this.ValueNode.getChildByName('boolean').active = true;

            let toggle = this.ValueNode.getChildByName('boolean').getComponent(cc.Toggle);
            toggle.isChecked = this.condition.value !== 0 ? true : false;
        } else if (this.condition.paramItem.type === ParamType.NUMBER) {
            this.LogicNode.active = true;
            this.ValueNode.active = true;
            this.ValueNode.getChildByName('number').active = true;
            this.ValueNode.getChildByName('boolean').active = false;

            this.changeLogic(this.condition.logic);
            let edit = this.ValueNode.getChildByName('number').getComponent(cc.EditBox);
            edit.string = `${this.condition.value}`;
        } else {
            this.LogicNode.active = false;
            this.ValueNode.active = false;
        }

        this._hasInit = true;
        Events.targetOn(this);
    }

    protected onLoad() {
        this.Bg.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
    }

    protected onDestroy() {
        Events.targetOff(this);
    }

    /**
     * 重置参数
     * @param paramItem 
     */
    public onReset(paramItem: ParamItem) {
        this.condition.reset(paramItem);
        this.ParamName.string = this.condition.paramItem.paramName;
        if (this.condition.paramItem.type === ParamType.BOOLEAN) {
            this.LogicNode.active = false;
            this.ValueNode.active = true;
            this.ValueNode.getChildByName('number').active = false;
            this.ValueNode.getChildByName('boolean').active = true;

            let toggle = this.ValueNode.getChildByName('boolean').getComponent(cc.Toggle);
            toggle.isChecked = this.condition.value !== 0 ? true : false;
        } else if (this.condition.paramItem.type === ParamType.NUMBER) {
            this.LogicNode.active = true;
            this.ValueNode.active = true;
            this.ValueNode.getChildByName('number').active = true;
            this.ValueNode.getChildByName('boolean').active = false;

            this.changeLogic(this.condition.logic);
            let edit = this.ValueNode.getChildByName('number').getComponent(cc.EditBox);
            edit.string = `${this.condition.value}`;
        } else {
            this.LogicNode.active = false;
            this.ValueNode.active = false;
        }
    }

    /**
     * 切换logic选项
     */
    public changeLogic(logic: LogicType) {
        this.condition.logic = logic;
        let logicLab: cc.Label = this.LogicNode.getChildByName('lab').getComponent(cc.Label);
        if (logic === LogicType.EQUAL) {
            logicLab.string = '===';
        } else if (logic === LogicType.NOTEQUAL) {
            logicLab.string = '!==';
        } else if (logic === LogicType.GREATER) {
            logicLab.string = '>';
        } else if (logic === LogicType.LESS) {
            logicLab.string = '<';
        } else if (logic === LogicType.GREATER_EQUAL) {
            logicLab.string = '>=';
        } else if (logic === LogicType.LESS_EQUAL) {
            logicLab.string = '<=';
        }
    }

    /**
     * 选中
     */
    public select(value: boolean) {
        this.Bg.opacity = value ? 255 : 0;
    }

    private onTouchStart() {
        this._hasInit && Events.emit(EventName.CONDITION_SELECT, this);
    }

    private onClickParamSelect(event: cc.Event) {
        let target: cc.Node = event.target;
        let worldPos: cc.Vec2 = target.parent.convertToWorldSpaceAR(target.position.sub(cc.v2(0, 0)));
        Events.emit(EventName.SHOW_PARAM_SELECT, worldPos, 30, this);
        this._hasInit && Events.emit(EventName.CONDITION_SELECT, this);
    }

    private onClickLogicSelect(event: cc.Event) {
        let target: cc.Node = event.target;
        let worldPos: cc.Vec2 = target.parent.convertToWorldSpaceAR(target.position.sub(cc.v2(0, 0)));
        Events.emit(EventName.SHOW_LOGIC, worldPos, 30, this);
        this._hasInit && Events.emit(EventName.CONDITION_SELECT, this);
    }

    private onValueBoolCheckd(toggle: cc.Toggle) {
        this.condition.value = toggle.isChecked ? 1 : 0;
        this._hasInit && Events.emit(EventName.CONDITION_SELECT, this);
    }

    private onValueNumberEditBegan() {
        this._hasInit && Events.emit(EventName.CONDITION_SELECT, this);
    }

    private onValueNumberChanged(str: string, edit: cc.EditBox) {
        str = str.replace(/[^-.\d]/g, '');
        if (str === '') {
            return;
        }
        let num = parseFloat(str);
        this.condition.value = isNaN(num) ? 0 : num;
        edit.string = `${this.condition.value}`;
    }

    @preloadEvent(EventName.PARAM_NAME_CHANGED)
    private onEventParamChanged(paramItem: ParamItem) {
        if (this.condition.paramItem !== paramItem) {
            return;
        }
        this.ParamName.string = this.condition.paramItem.paramName;
    }
}
