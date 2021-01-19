import FsmCtr from "./fsm/FsmCtr";
import InspectorCtr from "./inspector/InspectorCtr";
import Menu from "./menu/Menu";
import ParamCtr from "./parameters/ParamCtr";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Editor extends cc.Component {
    @property(FsmCtr) Fsm: FsmCtr = null;
    @property(InspectorCtr) Inspector: InspectorCtr = null;
    @property(ParamCtr) ParamCtr: ParamCtr = null;
    @property(Menu) Menu: Menu = null;

    public static Inst: Editor = null;

    /** 按下的按键 */
    private _keySet: Set<cc.macro.KEY> = new Set();

    protected onLoad() {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    protected onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    private onKeyDown(event: cc.Event.EventKeyboard) {
        this._keySet.add(event.keyCode);

        switch (event.keyCode) {
            case cc.macro.KEY.s:
                if (this._keySet.has(cc.macro.KEY.ctrl)) {
                    // 保存工程文件
                    this.saveProject();
                }
                break;
            case cc.macro.KEY.e:
                if (this._keySet.has(cc.macro.KEY.ctrl)) {
                    // 导出状态机runtime数据
                    this.exportRuntimeData();
                }
                break;
            case cc.macro.KEY.Delete:
                // 删除
                this.Fsm.deleteCurUnit();
                this.Fsm.deleteCurLine();
            default:
                break;
        }
    }

    private onKeyUp(event: cc.Event.EventKeyboard) {
        this._keySet.delete(event.keyCode);
    }

    private saveProject() {
        let data: any = this.Fsm.exportProject();
        data.parameters = this.ParamCtr.export();
        this.save('animator.json', data);
    }

    private exportRuntimeData() {
        let data: any = this.Fsm.exportRuntimeData();
        data.parameters = this.ParamCtr.export();
        this.save('runtimeData.json', data);
    }

    private save(fileName: string, data: any) {
        // 存储文件
        let content = JSON.stringify(data);
        let eleLink = document.createElement('a');
        eleLink.download = `${fileName}`;
        eleLink.style.display = 'none';
        // 字符内容转变成blob地址
        let blob = new Blob([content]);
        eleLink.href = URL.createObjectURL(blob);
        // 触发点击
        document.body.appendChild(eleLink);
        eleLink.click();
        // 移除
        document.body.removeChild(eleLink);
    }

    /**
     * 导入工程文件
     */
    public importProject(data: any) {
        if (!data.hasOwnProperty('animator')) {
            return;
        }

        this.ParamCtr.import(data.parameters);
        this.Fsm.importProject(data);
    }
}
