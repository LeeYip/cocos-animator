const { ccclass, property } = cc._decorator;

/** 移动速度 px/s */
const MOVE_SPEED = 200;

/**
 * 用于拖拽排序的元素
 */
@ccclass
export default class DragItem extends cc.Component {
    /** 触摸开始时的boundingbox */
    private _startRect: cc.Rect = null;
    public get startRect() { return this._startRect; }

    /** 移动动画的目标下标 */
    private _toIdx: number = 0;

    public onInit(idx: number) {
        this._toIdx = idx;
        this._startRect = this.node.getBoundingBox();
    }

    public moveTo(toIdx: number, toY: number) {
        if (toIdx === this._toIdx) {
            return;
        }
        this._toIdx = toIdx;
        this.node.stopAllActions();
        let moveTo = cc.moveTo(Math.abs(this.node.y - toY) / MOVE_SPEED, cc.v2(0, toY));
        this.node.runAction(moveTo);
    }

    public stop() {
        this.node.stopAllActions();
    }
}
