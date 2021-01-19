import State from "../data/State";
import Transition from "../data/Transition";

const { ccclass, property } = cc._decorator;

export const UnitColor = {
    NORMAL: cc.color(150, 150, 150),
    DEFAULT: cc.color(210, 120, 70),
    ANY_STATE: cc.color(92, 190, 199)
}

/**
 * 状态节点或者状态机节点的基类
 */
@ccclass
export default class UnitBase extends cc.Component {
    @property(cc.Node) SelectNode: cc.Node = null;
    @property(cc.Node) BgNode: cc.Node = null;
    @property(cc.Label) NameLabel: cc.Label = null;

    protected _isDefault: boolean = false;
    /**
     * 是否为默认状态
     * @virtual
     */
    public get isDefault() { return this._isDefault; }
    public set isDefault(v: boolean) {
        this._isDefault = v;
        this.BgNode.color = this._isDefault ? UnitColor.DEFAULT : UnitColor.NORMAL;
    }

    /**
     * 选中节点
     * @param value true:选中 false:取消选中
     */
    public select(value: boolean) {
        this.SelectNode.active = value;
        this.node.setSiblingIndex(this.node.parent.childrenCount - 1);
    }

    /**
     * 添加Transition
     * @virtual
     */
    public addTransition(toUnit: UnitBase, toState: State) {
    }

    /**
     * 获取此节点到目标节点的所有Transition
     * @virtual
     * @param toUnit 目标节点
     */
    public getTransitions(toUnit: UnitBase = null): Transition[] {
        return [];
    }

    /**
     * 设置layer层坐标系下坐标
     * @virtual
     */
    public setPos(x: number | cc.Vec2 | cc.Vec3, y: number = 0) {
        let pos: cc.Vec2 = cc.v2(x, y);
        pos = cc.v2(Math.round(pos.x / 30) * 30, Math.round(pos.y / 30) * 30);
        this.node.position = pos;
        return pos;
    }
}
