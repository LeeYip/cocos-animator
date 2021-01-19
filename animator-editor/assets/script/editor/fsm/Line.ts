import Events, { EventName, preloadEvent } from "../../common/util/Events";
import Transition from "../data/Transition";
import UnitBase from "./UnitBase";

const { ccclass, property } = cc._decorator;

const RADIUS = 10;
const Color = {
    NORMAL: cc.color(255, 255, 255),
    SELECT: cc.color(137, 161, 255),
    TEMP: cc.color(50, 200, 40)
};

@ccclass
export default class Line extends cc.Component {
    @property(cc.Node) SprNode: cc.Node = null;
    @property(cc.Node) TriNodes: cc.Node[] = [];

    private _hasInit: boolean = false;
    private _needUpdate: boolean = false;

    /** 连线起点 */
    private _fromPos: cc.Vec2 = cc.v2(0, 0);
    /** 连线终点 */
    private _toPos: cc.Vec2 = cc.v2(0, 0);
    /** 连线与节点中心的的偏移值 */
    private _offset: cc.Vec2 = cc.v2(0, 0);

    private _fromUnit: UnitBase = null;
    public get fromUnit() { return this._fromUnit; }

    private _toUnit: UnitBase = null;
    public get toUnit() { return this._toUnit; }

    protected onLoad() {
        this.setColor(Color.TEMP);
    }

    public onInit(from: UnitBase, to: UnitBase) {
        this._hasInit = true;
        this._needUpdate = true;
        this._fromUnit = from;
        this._toUnit = to;

        this.setColor(Color.NORMAL);
        this.checkSize(this.getTransitions().length);

        this._fromUnit.node.on(cc.Node.EventType.POSITION_CHANGED, this.onStateMoved, this);
        this._toUnit.node.on(cc.Node.EventType.POSITION_CHANGED, this.onStateMoved, this);

        Events.targetOn(this);
    }

    protected onDestroy() {
        if (!this._hasInit) {
            return;
        }

        this._fromUnit.node && this._fromUnit.node.off(cc.Node.EventType.POSITION_CHANGED, this.onStateMoved, this);
        this._toUnit.node && this._toUnit.node.off(cc.Node.EventType.POSITION_CHANGED, this.onStateMoved, this);

        Events.targetOff(this);
    }

    protected lateUpdate() {
        if (!this._needUpdate) {
            return;
        }

        this._needUpdate = true;
        this.setLine(this._fromUnit.node.position, this._toUnit.node.position);
    }

    private onStateMoved() {
        this._needUpdate = true;
    }

    /**
     * 根据transitionSet数量更改line上三角的显示
     */
    private checkSize(size: number) {
        if (size > 1) {
            this.TriNodes[1].active = true;
            this.TriNodes[2].active = true;
        } else {
            this.TriNodes[1].active = false;
            this.TriNodes[2].active = false;
        }
    }

    /**
     * 设置连线颜色
     */
    private setColor(color: cc.Color) {
        this.SprNode.color = color;
        this.TriNodes.forEach((e) => {
            e.color = color;
        });
    }

    /**
     * 获取连线所代表的所有Transition
     */
    public getTransitions(): Transition[] {
        if (!this._hasInit) {
            return [];
        }
        return this._fromUnit.getTransitions(this._toUnit);
    }

    /**
     * 根据起点坐标与终点坐标设置线段
     * @param fromPos 起点坐标
     * @param toPos 终点坐标
     */
    public setLine(fromPos: cc.Vec2, toPos: cc.Vec2) {
        let dir = cc.v2(toPos.sub(fromPos));
        this._offset = this._hasInit ? dir.rotate(-Math.PI / 2).normalize().mul(RADIUS) : cc.v2(0, 0);
        this._fromPos = fromPos.add(this._offset);
        this._toPos = toPos.add(this._offset);

        this.node.position = this._fromPos.add(this._toPos).mul(0.5);
        this.node.angle = dir.equals(cc.Vec2.ZERO) ? 0 : -cc.misc.radiansToDegrees(dir.signAngle(cc.v2(0, 1)));
        this.node.height = dir.mag();
        this.SprNode.height = this.node.height;
    }

    /**
     * 判断参数是否为连线端点的state
     */
    public relatedState(state: UnitBase) {
        return this._fromUnit === state || this._toUnit === state;
    }

    /**
     * 判断Layer层坐标是否在line节点内
     * @param pos 
     */
    public contains(pos: cc.Vec2) {
        if (!this._hasInit) {
            return false;
        }
        let delt = this._offset;
        let points: cc.Vec2[] = [this._fromPos.add(delt), this._toPos.add(delt), this._toPos.sub(delt), this._fromPos.sub(delt)];
        return cc.Intersection.pointInPolygon(pos, points);
    }

    /**
     * 选中line
     * @param value true:选中 false:取消选中
     */
    public select(value: boolean) {
        this.setColor(value ? Color.SELECT : Color.NORMAL);
    }

    @preloadEvent(EventName.TRANSITION_ADD)
    private onEventTransitionAdd(fromUnit: UnitBase, toUnit: UnitBase, transition: Transition) {
        if (this._fromUnit === fromUnit && this._toUnit === toUnit) {
            this.checkSize(this.getTransitions().length);
        }
    }

    @preloadEvent(EventName.TRANSITION_DELETE)
    private onEventTransitionDelete(transition: Transition) {
        let arr = this.getTransitions();
        if (arr.length <= 0) {
            // 删除线条
            Events.emit(EventName.LINE_DELETE, this);
        } else {
            this.checkSize(arr.length);
        }
    }
}
