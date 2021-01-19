import Events, { EventName } from "../../common/util/Events";
import ConditionItem from "../inspector/ConditionItem";
import ParamItem from "../parameters/ParamItem";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ParamSelectItem extends cc.Component {
    @property(cc.Label) ParamName: cc.Label = null;

    private _paramItem: ParamItem = null;
    private _conditionItem: ConditionItem = null;

    public onInit(paramItem: ParamItem, conditionItem: ConditionItem) {
        this._paramItem = paramItem;
        this._conditionItem = conditionItem;

        this.ParamName.string = this._paramItem.paramName;
    }

    private onClick() {
        this._conditionItem.onReset(this._paramItem);
        Events.emit(EventName.CLOSE_MENU);
    }
}
