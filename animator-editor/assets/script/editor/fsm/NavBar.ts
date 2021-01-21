import Events, { EventName, preloadEvent } from "../../common/util/Events";
import RecyclePool from "../../common/util/RecyclePool";
import Res from "../../common/util/Res";
import { ResUrl } from "../../constant/ResUrl";
import StateMachine from "../data/StateMachine";
import Editor from "../Editor";
import BarItem from "./BarItem";

const { ccclass, property } = cc._decorator;

@ccclass
export default class NavBar extends cc.Component {
    @property(cc.Node) Content: cc.Node = null;

    private _widget: cc.Widget = null;
    private _contentWidget: cc.Widget = null;

    protected onLoad() {
        this._widget = this.getComponent(cc.Widget);
        this._contentWidget = this.Content.getComponent(cc.Widget);
        this.onEventResize();
        Events.targetOn(this);
    }

    protected onDestroy() {
        Events.targetOff(this);
    }

    /**
     * 刷新面包屑导航栏显示
     * @param stateMachines 按层级顺序排列的状态机数组
     */
    public refreshBar(stateMachines: StateMachine[]) {
        for (let i = this.Content.childrenCount - 1; i >= 0; i--) {
            RecyclePool.put(BarItem, this.Content.children[i]);
        }

        stateMachines.forEach((e, index) => {
            let node: cc.Node = RecyclePool.get(BarItem) || cc.instantiate(Res.getLoaded(ResUrl.PREFAB.BAR_ITEM));
            this.Content.addChild(node);
            let bar = node.getComponent(BarItem);
            bar.onInit(e, index === stateMachines.length - 1);
        });
    }

    @preloadEvent(EventName.RESIZE)
    private onEventResize(node?: cc.Node) {
        this._widget.left = Editor.Inst.Parameters.node.width;
        this._widget.right = Editor.Inst.Inspector.node.width;
        this._widget.updateAlignment();
        this._contentWidget.updateAlignment();
    }
}
