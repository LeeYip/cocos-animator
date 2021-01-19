/**
 * 事件名
 */
export enum EventName {
    /** 调节节点大小 */
    RESIZE,

    /** 删除参数 */
    PARAM_DELETE,
    /** 参数名更改 */
    PARAM_NAME_CHANGED,
    /** 选中ParamItem */
    PARAM_SELECT,

    /** 设置状态机视图的显示 */
    SET_CUR_STATE_MACHINE,
    
    /** 状态名更改 */
    STATE_NAME_CHANGED,
    /** AnyState改变坐标 */
    ANY_STATE_MOVE,
    /** 状态机名更改 */
    STATE_MACHINE_NAME_CHANGED,
    /** 父状态机节点改变坐标 */
    UP_STATE_MACHINE_MOVE,

    /** 选择连线连向子状态机内部的状态 */
    LINE_TO_MACHINE_STATE,
    /** 删除line */
    LINE_DELETE,

    /** 新增transition */
    TRANSITION_ADD,
    /** 删除transition */
    TRANSITION_DELETE,
    /** 点击按钮选中TransitionItem */
    TRANSITION_SELECT,
    /** 点击按钮选中ConditionItem */
    CONDITION_SELECT,
    /** 选中multiplier参数 */
    MULTIPLIER_SELECT,

    /** 隐藏inspector显示的内容 */
    INSPECTOR_HIDE,
    /** 显示unit信息 */
    INSPECTOR_SHOW_UNIT,
    /** 显示line信息 */
    INSPECTOR_SHOW_LINE,

    /** 关闭菜单层 */
    CLOSE_MENU,
    /** 显示状态机界面右键菜单 */
    SHOW_RIGHT_MENU,
    /** 显示连线目标状态机内部所有状态选择界面 */
    SHOW_LINE_TO_List,
    /** 显示添加参数时选择界面 */
    SHOW_PARAM_ADD,
    /** 显示condition的参数选择界面 */
    SHOW_PARAM_SELECT,
    /** 显示condition的logic选项 */
    SHOW_LOGIC,
    /** 显示multiplier选择界面 */
    SHOW_MULTIPLIER,
};

/**
 * 非静态成员函数装饰器，用于预先载入待注册的事件，配合targetOn使用
 * @param event 事件名
 */
export function preloadEvent(event: EventName) {
    return function (target: any, funcName: string, desc: PropertyDescriptor) {
        let arr = Events.classMap.get(target.constructor);
        if (arr === undefined) {
            arr = [];
            Events.classMap.set(target.constructor, arr);
        } else {
            let find = arr.find((e) => {
                return e.event === event && e.funcName === funcName;
            });
            if (find) {
                cc.error(`event: ${EventName[event]} 重复载入`);
                return;
            }
        }

        arr.push({
            event: event,
            funcName: funcName
        });
    };
}

/**
 * 监听函数类型
 */
type Listener = (arg: any) => void;

/**
 * 事件收发管理类
 */
export default class Events {
    /**
     * 存储监听事件、监听函数与监听对象
     */
    private static _eventsMap: Map<EventName, Map<Object, Listener[]>> = new Map();

    /**
     * 存储构造函数、监听事件、监听函数名，用于实例化时注册事件
     */
    public static classMap: Map<Function, Array<{ event: EventName, funcName: string }>> = new Map();

    /**
     * 注册与target构造函数预先绑定的所有事件
     * @param target 注册目标
     * @param onSuper 是否注册父类成员函数上绑定的事件
     */
    public static targetOn(target: Object, onSuper: boolean = true) {
        if (onSuper) {
            this.classMap.forEach((value: Array<{ event: EventName, funcName: string }>, key: Function) => {
                if (target instanceof key) {
                    value.forEach((e) => {
                        this.on(e.event, target[e.funcName], target);
                    });
                }
            });
        } else {
            let arr = this.classMap.get(target.constructor);
            if (arr) {
                arr.forEach((e) => {
                    this.on(e.event, target[e.funcName], target);
                });
            }
        }
    }

    /**
     * 注册事件
     * @param event 事件名
     * @param listener 处理事件的监听函数
     * @param target 注册目标
     */
    public static on(event: EventName, listener: Listener, target: Object) {
        if (!listener || !target) {
            cc.error(`event: ${EventName[event]} listener或target不能为空`);
            return;
        }

        let map: Map<Object, Listener[]> = this._eventsMap.get(event);
        let list: Listener[] = [];
        if (map === undefined) {
            map = new Map();
            map.set(target, list);
            this._eventsMap.set(event, map);
        } else {
            list = map.get(target);
            if (list === undefined) {
                list = [];
                map.set(target, list);
            } else {
                let result = list.find((e) => { return e === listener });
                if (result) {
                    cc.error(`event: ${EventName[event]} 重复注册`);
                    return;
                }
            }
        }

        list.push(listener);
    }

    /**
     * 移除事件
     * @param event 事件名
     * @param listener 处理事件的监听函数
     * @param target 注册目标
     */
    public static off(event: EventName, listener: Listener, target: Object) {
        if (!listener || !target) {
            cc.error(`event: ${EventName[event]} listener或target不能为空`);
            return;
        }

        let map: Map<Object, Listener[]> = this._eventsMap.get(event);
        if (map === undefined) {
            cc.error(`event: ${EventName[event]} 未注册该事件`);
            return;
        }

        let list: Listener[] = map.get(target);
        if (list === undefined) {
            cc.error(`event: ${EventName[event]} target上未注册该事件`);
            return;
        }

        let index = list.findIndex((e) => { return e === listener; });
        if (index < 0) {
            cc.error(`event: ${EventName[event]} target上未以该listener注册该事件`);
            return;
        }

        list.splice(index, 1);
        if (list.length <= 0) {
            map.delete(target);
            map.size <= 0 && this._eventsMap.delete(event);
        }
    }

    /**
     * 移除target上注册的所有事件
     * @param target 注册目标
     */
    public static targetOff(target: Object) {
        if (!target) {
            cc.error(`event: ${target} target不能为空`);
            return;
        }

        this._eventsMap.forEach((map, event) => {
            map.delete(target);
            map.size <= 0 && this._eventsMap.delete(event);
        });
    }

    /**
     * 派发事件
     * @param event 事件名
     * @param args 事件参数
     */
    public static emit(event: EventName, ...args: any[]) {
        let map: Map<Object, Listener[]> = this._eventsMap.get(event);
        if (map === undefined) {
            cc.warn(`event: ${EventName[event]} 未注册该事件`);
            return;
        }

        map.forEach((list, target) => {
            list.forEach((listener) => {
                listener.call(target, ...args);
            });
        });
    }
}
