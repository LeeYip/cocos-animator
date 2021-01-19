import Events, { EventName } from "../../common/util/Events";
import State from "../data/State";
import UnitStateMachine from "../fsm/UnitStateMachine";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LineToSubItem extends cc.Component {
    @property(cc.Label) NameLabel: cc.Label = null;

    private _state: State = null;
    /**
     * 连线目标状态机
     */
    private _toStateMachine: UnitStateMachine = null;

    public onInit(state: State = null, to: UnitStateMachine = null) {
        if (state) {
            this._state = state;
            this._toStateMachine = to;
            this.NameLabel.string = state.name;
        } else {
            this.NameLabel.string = '<- empty ->';
        }
    }

    private onClickSelect() {
        Events.emit(EventName.CLOSE_MENU);
        this._state && Events.emit(EventName.LINE_TO_MACHINE_STATE, this._state, this._toStateMachine);
    }
}
