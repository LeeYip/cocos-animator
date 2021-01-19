/**
 * 用于使用节点池的节点所绑定脚本组件实现
 */
export interface RecycleNode {
    /**
     * 回收前调用
     */
    unuse(): void;
    /**
     * 取出前调用
     */
    reuse(): void;
}

/**
 * 节点池
 */
export default class RecyclePool {
    private static _poolMap: Map<{ prototype: cc.Component }, cc.Node[]> = new Map();

    /**
     * 根据类型判断节点池中节点数量
     */
    public static size(type: { prototype: cc.Component }): number {
        let list = this._poolMap.get(type);
        if (list === undefined) {
            return 0;
        }

        return list.length;
    }

    /**
     * 根据类型清空节点
     */
    public static clear(type: { prototype: cc.Component }) {
        let list = this._poolMap.get(type);
        if (list === undefined) {
            return;
        }

        let count = list.length;
        for (let i = 0; i < count; ++i) {
            list[i].destroy();
        }
        list.length = 0;
        this._poolMap.delete(type);
    }

    /**
     * 清空全部节点
     */
    public static clearAll() {
        this._poolMap.forEach((list: cc.Node[]) => {
            list.forEach((node: cc.Node) => {
                node.destroy();
            });
        });
        this._poolMap.clear();
    }

    /**
     * 根据类型从节点池取出节点
     */
    public static get(type: { prototype: cc.Component }): cc.Node {
        let list = this._poolMap.get(type);
        if (list === undefined || list.length <= 0) {
            return null;
        }

        let last = list.length - 1;
        let node = list[last];
        list.length = last;

        // Invoke pool handler
        let handler: any = node.getComponent(type);
        if (handler && handler.reuse) {
            handler.reuse();
        }
        return node;
    }

    /**
     * 根据类型将节点放入节点池
     */
    public static put(type: { prototype: cc.Component }, node: cc.Node) {
        if (!node) {
            cc.error(`[RecyclePool.put] error: 传入节点为空`);
            return;
        }

        let list = this._poolMap.get(type);
        if (list === undefined) {
            list = [];
            this._poolMap.set(type, list);
        } else if (list.indexOf(node) !== -1) {
            cc.error(`[RecyclePool.put] error: 不可将节点重复放入节点池中`);
            return;
        }

        node.removeFromParent(false);
        // Invoke pool handler
        let handler: any = node.getComponent(type);
        if (handler && handler.unuse) {
            handler.unuse();
        }

        list.push(node);
    }
}
