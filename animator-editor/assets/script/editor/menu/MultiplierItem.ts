import Events, { EventName } from "../../common/util/Events";
import ParamItem from "../parameters/ParamItem";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MultiplierItem extends cc.Component {
    @property(cc.Label) NameLabel: cc.Label = null;

    private _paramItem: ParamItem = null;

    public onInit(paramItem: ParamItem = null) {
        this._paramItem = paramItem;
        if (this._paramItem) {
            this.NameLabel.string = this._paramItem.paramName;
        } else {
            this.NameLabel.string = '<- empty ->';
        }
    }

    private onClick() {
        Events.emit(EventName.MULTIPLIER_SELECT, this._paramItem);
        Events.emit(EventName.CLOSE_MENU);
    }
}
