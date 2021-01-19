import Events, { EventName, preloadEvent } from "../../common/util/Events";
import RecyclePool from "../../common/util/RecyclePool";
import Res from "../../common/util/Res";
import { ParameterData } from "../../constant/BaseConst";
import { ResUrl } from "../../constant/ResUrl";
import ParamItem from "./ParamItem";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ParamCtr extends cc.Component {
    @property(cc.Node) ParamContent: cc.Node = null;
    @property(cc.Node) SelectPosNode: cc.Node = null;

    protected onLoad() {
        Events.targetOn(this);
    }

    protected onEnable() {
        // 屏蔽scrollView内部touch事件，防止与拖拽行为产生冲突
        let scrollView = this.getComponent(cc.ScrollView);
        scrollView.node.off(cc.Node.EventType.TOUCH_START, scrollView['_onTouchBegan'], scrollView, true);
        scrollView.node.off(cc.Node.EventType.TOUCH_MOVE, scrollView['_onTouchMoved'], scrollView, true);
        scrollView.node.off(cc.Node.EventType.TOUCH_END, scrollView['_onTouchEnded'], scrollView, true);
        scrollView.node.off(cc.Node.EventType.TOUCH_CANCEL, scrollView['_onTouchCancelled'], scrollView, true);
    }

    protected onDestroy() {
        Events.targetOff(this);
    }

    //#region import and export
    /**
     * 导入数据
     */
    public import(arr: ParameterData[]) {
        arr.forEach((data: ParameterData) => {
            let node = this.getParamItem();
            this.ParamContent.addChild(node);
            let pi = node.getComponent(ParamItem);
            pi.onInit(data.param, data.type, data.init);
        });
    }

    /**
     * 导出数据
     */
    public export(): ParameterData[] {
        let arr: ParameterData[] = [];
        this.ParamContent.children.forEach((e) => {
            let pi = e.getComponent(ParamItem);
            let data: ParameterData = {
                param: pi.paramName,
                type: pi.type,
                init: pi.init
            };
            arr.push(data);
        });
        return arr;
    }
    //#endregion

    public getParamMap() {
        let map: Map<string, ParamItem> = new Map();
        this.ParamContent.children.forEach((e) => {
            let pi = e.getComponent(ParamItem);
            map.set(pi.paramName, pi);
        });
        return map;
    }

    private getParamItem() {
        let prefab = Res.getLoaded(ResUrl.PREFAB.PARAM_ITEM);
        let node: cc.Node = RecyclePool.get(ParamItem) || cc.instantiate(prefab);
        node.width = this.ParamContent.width;
        return node;
    }

    private putParamItem(node: cc.Node) {
        RecyclePool.put(ParamItem, node);
    }

    public getParamItemByName(name: string) {
        for (let i = 0; i < this.ParamContent.childrenCount; i++) {
            let pi = this.ParamContent.children[i].getComponent(ParamItem);
            if (name === pi.paramName) {
                return pi;
            }
        }
        return null;
    }

    /**
     * 获取一个不重复的参数名
     */
    public getParamName(paramItem: ParamItem, name: string = 'param'): string {
        let index = 0;
        let findName = false;

        while (!findName) {
            findName = true;
            for (let i = 0; i < this.ParamContent.childrenCount; i++) {
                let pi = this.ParamContent.children[i].getComponent(ParamItem);
                if (pi === paramItem) {
                    continue;
                }
                if (pi.paramName === `${name}${index > 0 ? index : ''}`) {
                    index++;
                    findName = false;
                    break;
                }
            }
        }
        return `${name}${index > 0 ? index : ''}`;
    }

    private onClickAddParam(event: cc.Event, typeStr: string) {
        Events.emit(EventName.CLOSE_MENU);

        let type = parseInt(typeStr);
        let node = this.getParamItem();
        this.ParamContent.addChild(node);
        let pi = node.getComponent(ParamItem);
        pi.onInit(this.getParamName(pi), type);
    }

    private onClickOpenSelect() {
        Events.emit(EventName.SHOW_PARAM_ADD, this.SelectPosNode.parent.convertToWorldSpaceAR(this.SelectPosNode.position));
    }

    @preloadEvent(EventName.PARAM_DELETE)
    private onEventParamDelete(item: ParamItem) {
        this.putParamItem(item.node);
    }

    @preloadEvent(EventName.PARAM_SELECT)
    private onEventParamSelect(item: ParamItem) {
        this.ParamContent.children.forEach((e) => {
            let ti = e.getComponent(ParamItem);
            ti.select(ti === item);
        });
    }

    @preloadEvent(EventName.RESIZE)
    private onEventResize(node: cc.Node) {
        if (node !== this.node) {
            return;
        }
        this.ParamContent.children.forEach((e) => {
            e.width = this.ParamContent.width;
        });
    }
}
