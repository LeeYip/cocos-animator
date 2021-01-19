import Events, { EventName } from "../util/Events";

const { ccclass, property } = cc._decorator;

/**
 * 鼠标拉伸调节节点大小组件
 */
@ccclass
export default class ResizeArea extends cc.Component {
    @property(cc.Widget) Target: cc.Widget = null;
    @property(cc.Vec2) Limit: cc.Vec2 = cc.v2();
    @property({ tooltip: CC_DEV && '节点对齐的是否为左侧' }) isLeft: boolean = true;

    private _canvas: HTMLElement = null;
    private _startPos: cc.Vec2 = null;
    private _startWidth: number = 0;
    private _updateDirty: boolean = false;

    protected onLoad() {
        this._canvas = document.getElementById('GameCanvas');

        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);

        this.node.on(cc.Node.EventType.MOUSE_ENTER, this.onMouseEnter, this);
        this.node.on(cc.Node.EventType.MOUSE_LEAVE, this.onMouseLeave, this);
    }

    protected lateUpdate() {
        if (!this._updateDirty) {
            return;
        }
        this._updateDirty = false;
        this.Target.left = 0;
        this.Target.right = 0;
        this.Target.updateAlignment();

        Events.emit(EventName.RESIZE, this.Target.node);
        this.updateWidget(this.Target.node);
    }

    private onTouchStart(event: cc.Event.EventTouch) {
        this._canvas.style.cursor = 'w-resize';
        this._startPos = event.getLocation();
        this._startWidth = this.Target.node.width;
    }

    private onTouchMove(event: cc.Event.EventTouch) {
        let delt = event.getLocation().x - this._startPos.x;
        if (!this.isLeft) {
            delt = -delt;
        }
        this.Target.node.width = cc.misc.clampf(this._startWidth + delt, this.Limit.x, this.Limit.y);
        this._updateDirty = true;
    }

    private onMouseEnter(event: cc.Event.EventMouse) {
        this._canvas.style.cursor = 'w-resize';
    }

    private onMouseLeave(event: cc.Event.EventMouse) {
        this._canvas.style.cursor = 'default ';
    }

    private updateWidget(node: cc.Node) {
        node.children.forEach((c) => {
            let widget = c.getComponent(cc.Widget);
            widget && widget.updateAlignment();
            this.updateWidget(c);
        });
    }
}
