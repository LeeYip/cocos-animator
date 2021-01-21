/**
 * 工具类
 */
export default class Tool {
    /**
     * 随机返回数组中的某个元素
     * @param arr
     */
    public static randArray<T>(arr: Array<T>): T {
        if (arr.length <= 0) {
            return null;
        }

        return arr[this.randInt(0, arr.length - 1)];
    }

    /**
     * 获取 [min, max] 区间的随机整数
     * @param min
     * @param max
     */
    public static randInt(min: number, max: number) {
        min = Math.ceil(min);
        max = Math.floor(max);
        if (min >= max) {
            return max;
        }
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * 获取 [min, max) 区间的随机浮点数
     * @param min 
     * @param max 
     */
    public static randFloat(min: number, max: number) {
        if (min >= max) {
            return max;
        }
        return Math.random() * (max - min) + min;
    }

    /**
     * 返回value是否在 [min, max] 区间内
     * @param min 
     * @param max 
     * @param value
     * @param includeEdge 是否包含边界值min和max，默认包含
     */
    public static inRange(min: number, max: number, value: number, includeEdge: boolean = true) {
        return includeEdge ? value >= min && value <= max : value > min && value < max;
    }

    /**
     * 判断数组中是否有某个元素
     */
    public static arrayHas<T>(arr: T[], ele: T): boolean {
        let idx = arr.findIndex((e) => { return e === ele; });
        return idx >= 0;
    }

    /**
     * 根据下标交换数组两个元素位置
     */
    public static arraySwap<T>(arr: T[], idx1: number, idx2: number) {
        if (idx1 === idx2 || !this.inRange(0, arr.length - 1, idx1) || !this.inRange(0, arr.length - 1, idx2)) {
            return;
        }
        [arr[idx1], arr[idx2]] = [arr[idx2], arr[idx1]];
    }

    /**
     * 将元素从fromIdx位置移到toIdx位置，其余元素相对位置不变
     */
    public static arrayMove<T>(arr: T[], fromIdx: number, toIdx: number) {
        if (fromIdx === toIdx || !this.inRange(0, arr.length - 1, fromIdx) || !this.inRange(0, arr.length - 1, toIdx)) {
            return;
        }
        let from: T[] = arr.splice(fromIdx, 1);
        arr.splice(toIdx, 0, from[0]);
    }

    /**
     * 添加元素
     * @param canRepeat 是否可重复添加相同元素 默认false
     * @returns 是否确实执行了添加操作
     */
    public static arrayAdd<T>(arr: T[], ele: T, canRepeat: boolean = false): boolean {
        if (!canRepeat && this.arrayHas(arr, ele)) {
            return false;
        }
        arr.push(ele);
        return true;
    }

    /**
     * 删除元素
     * @returns 是否确实执行了删除操作
     */
    public static arrayDelete<T>(arr: T[], ele: T): boolean {
        let idx = arr.findIndex((e) => { return e === ele; });
        if (idx === -1) {
            return false;
        }
        arr.splice(idx, 1);
        return true
    }

    /**
     * 递归遍历所有子节点并更新widget组件
     * @param node 目标节点，需遍历其子节点
     * @param ignoreList 忽略节点，这些节点的子节点跳过遍历
     */
    public static updateWidget(node: cc.Node, ...ignoreList: cc.Node[]) {
        node.children.forEach((c) => {
            let widget = c.getComponent(cc.Widget);
            widget && widget.updateAlignment();
            if (this.arrayHas(ignoreList, c)) {
                return;
            }
            this.updateWidget(c, ...ignoreList);
        });
    }
}
