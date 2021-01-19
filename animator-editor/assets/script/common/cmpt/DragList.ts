import Tool from "../util/Tool";
import DragItem from "./DragItem";

const { ccclass, property } = cc._decorator;

/**
 * 拖拽排序列表
 */
@ccclass
export default class DragList extends cc.Component {
    /** 进行拖拽操作的元素下标 */
    private _dragIdx: number = -1;
    /** 所有元素 */
    private _items: DragItem[] = [];

    /** 
     * 拖拽回调
     * @param dragIdx 拖拽元素初始下标
     * @param toIdx 拖拽元素完成拖拽后所在的下标
     */
    private _dragCall: (dragIdx: number, toIdx: number) => void = null;
    /** 调用拖拽回调传入的this对象 */
    private _target: any = null;

    private _layout: cc.Layout = null;
    /** 元素容器 */
    public get layout() {
        if (!this._layout) {
            this._layout = this.getComponent(cc.Layout);
        }
        return this._layout;
    }

    /** 拖拽开关 */
    public canDrag: boolean = true;

    protected onLoad() {
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    private onTouchStart(event: cc.Event.EventTouch) {
        if (!this.canDrag || this.node.childrenCount <= 1) {
            this._dragIdx = -1;
            return;
        }

        let pos = this.node.convertToNodeSpaceAR(event.getLocation());
        this._dragIdx = this.getItemIdx(pos);
        if (this._dragIdx < 0) {
            return;
        }

        this.layout.enabled = false;
        this._items = [];
        this.node.children.forEach((e: cc.Node, idx: number) => {
            let item = e.getComponent(DragItem);
            if (!item) {
                item = e.addComponent(DragItem);
            }
            item.onInit(idx);
            this._items.push(item);
        });
        this._items[this._dragIdx].node.setSiblingIndex(this.node.childrenCount - 1);
    }

    private onTouchMove(event: cc.Event.EventTouch) {
        if (this._dragIdx < 0) {
            return;
        }

        let pos = this.node.convertToNodeSpaceAR(event.getLocation());
        // 进行拖拽操作
        let yMax = this._items[0].startRect.center.y;
        let yMin = this._items[this._items.length - 1].startRect.center.y;
        this._items[this._dragIdx].node.y = cc.misc.clampf(pos.y, yMin, yMax);

        let curIdx = this.getCurIdx(pos);
        if (curIdx < this._dragIdx) {
            this._items.forEach((item: DragItem, idx: number) => {
                if (idx === this._dragIdx) {
                    return;
                }

                if (Tool.inRange(curIdx, this._dragIdx - 1, idx)) {
                    item.moveTo(idx + 1, this._items[idx + 1].startRect.center.y);
                } else {
                    item.moveTo(idx, this._items[idx].startRect.center.y);
                }
            });
        } else {
            this._items.forEach((item: DragItem, idx: number) => {
                if (idx === this._dragIdx) {
                    return;
                }

                if (Tool.inRange(this._dragIdx + 1, curIdx, idx)) {
                    item.moveTo(idx - 1, this._items[idx - 1].startRect.center.y);
                } else {
                    item.moveTo(idx, this._items[idx].startRect.center.y);
                }
            });
        }
    }

    private onTouchEnd(event: cc.Event.EventTouch) {
        if (this._dragIdx < 0) {
            return;
        }

        let pos = this.node.convertToNodeSpaceAR(event.getLocation());
        // 结束拖拽操作
        let curIdx = this.getCurIdx(pos);
        this._items[this._dragIdx].node.setSiblingIndex(curIdx);
        this._items.forEach((item: DragItem) => {
            item.stop();
        });

        // 触发回调
        if (curIdx !== this._dragIdx && this._dragCall) {
            if (this._target)
                this._dragCall.call(this._target, this._dragIdx, curIdx);
            else
                this._dragCall(this._dragIdx, curIdx);
        }

        // 重置
        this.layout.enabled = true;
        this.layout.updateLayout();
        this._dragIdx = -1;
        this._items = [];
    }

    /**
     * 获取选中的元素下标
     */
    private getItemIdx(pos: cc.Vec2) {
        for (let i = 0; i < this.node.childrenCount; i++) {
            let item = this.node.children[i];
            if (item.getBoundingBox().contains(pos)) {
                return i;
            }
        }
        return -1;
    }

    /**
     * 根据坐标获取当前移动到哪个下标的位置
     */
    private getCurIdx(pos: cc.Vec2) {
        let yMax = this._items[0].startRect.center.y;
        let yMin = this._items[this._items.length - 1].startRect.center.y;
        if (pos.y >= yMax) {
            return 0;
        } else if (pos.y <= yMin) {
            return this._items.length - 1;
        }

        let idx: number = 0;
        let minDis: number = Math.abs(this._items[0].startRect.center.y - pos.y);
        for (let i = 1; i < this._items.length; i++) {
            let item = this._items[i];
            let dis = Math.abs(item.startRect.center.y - pos.y);
            if (dis < minDis) {
                idx = i;
                minDis = dis;
            } else {
                break;
            }
        }

        return idx;
    }

    /**
     * 注册拖拽回调
     */
    public setDragCall(call: (dragIdx: number, toIdx: number) => void, target: any) {
        this._dragCall = call;
        this._target = target;
    }
}
