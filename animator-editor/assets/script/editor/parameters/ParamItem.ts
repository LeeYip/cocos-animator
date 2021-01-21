import Events, { EventName } from "../../common/util/Events";
import { RecycleNode } from "../../common/util/RecyclePool";
import { ParamType } from "../../constant/BaseConst";
import Editor from "../Editor";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ParamItem extends cc.Component implements RecycleNode {
    @property(cc.Node) Bg: cc.Node = null;
    @property(cc.EditBox) NameEdit: cc.EditBox = null;
    @property(cc.Node) InitValue: cc.Node = null;

    /** 组件是否初始化完成 */
    private _hasInit: boolean = false;

    private _paramName: string = '';
    /** 参数名 */
    public get paramName() {
        return this._paramName;
    }
    public set paramName(v: string) {
        if (this._paramName === v) {
            return;
        }

        this._paramName = v;
        this.NameEdit.string = v;
        Events.emit(EventName.PARAM_NAME_CHANGED, this);
    }

    /** 参数类型 */
    public type: ParamType = null;
    /** 初始值 */
    public init: number = 0;

    public reuse() {
    }

    public unuse() {
        this._hasInit = false;
    }

    public onInit(param: string, type: ParamType, init: number = 0) {
        this.Bg.opacity = 0;
        this.paramName = param;
        this.type = type;
        this.init = init;
        this.showInitValue();

        this._hasInit = true;
    }

    protected onLoad() {
        this.Bg.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
    }

    private showInitValue() {
        this.InitValue.children.forEach((e, index) => {
            e.active = (this.type === (index + 1));
            if (e.active) {
                if (this.type === ParamType.NUMBER) {
                    e.getComponent(cc.EditBox).string = `${this.init}`;
                } else {
                    e.getComponent(cc.Toggle).isChecked = this.init === 1 ? true : false;
                }
            }
        });
    }

    private onTouchStart() {
        this._hasInit && Events.emit(EventName.PARAM_SELECT, this);
    }

    /**
     * 选中
     */
    public select(value: boolean) {
        this.Bg.opacity = value ? 255 : 0;
    }

    private onNameEditBegan() {
        this._hasInit && Events.emit(EventName.PARAM_SELECT, this);
    }

    private onNameChanged() {
        if (this.NameEdit.string === '') {
            this.NameEdit.string = this.paramName;
            return;
        }

        this.NameEdit.string = Editor.Inst.Parameters.getParamName(this, this.NameEdit.string);
        this.paramName = this.NameEdit.string;
    }

    private onNumberEditBegan() {
        this._hasInit && Events.emit(EventName.PARAM_SELECT, this);
    }

    private onNumberChanged(str: string, edit: cc.EditBox) {
        str = str.replace(/[^-.\d]/g, '');
        if (str === '') {
            return;
        }
        let num = parseFloat(str);
        this.init = isNaN(num) ? 0 : num;
        edit.string = `${this.init}`;
    }

    private onBooleanCheckd(toggle: cc.Toggle) {
        this.init = toggle.isChecked ? 1 : 0;
        this._hasInit && Events.emit(EventName.PARAM_SELECT, this);
    }

    private onTriggerCheckd(toggle: cc.Toggle) {
        this.init = toggle.isChecked ? 1 : 0;
        this._hasInit && Events.emit(EventName.PARAM_SELECT, this);
    }

    private onAutoTriggerCheckd(toggle: cc.Toggle) {
        this.init = toggle.isChecked ? 1 : 0;
        this._hasInit && Events.emit(EventName.PARAM_SELECT, this);
    }

    private onClickDelete() {
        Events.emit(EventName.PARAM_DELETE, this);
    }
}
