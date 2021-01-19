import Res from "../common/util/Res";
import { ResDirUrl, ResUrl } from "../constant/ResUrl";
import Editor from "../editor/Editor";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Main extends cc.Component {
    private _editorNode: cc.Node = null;

    protected onLoad() {
        cc.debug.setDisplayStats(false);
        this.onInit();
    }

    private async onInit() {
        await Res.loadDir(ResDirUrl.PREFAB, cc.Prefab);

        this.resetEditor();

        // 注册拖拽文件事件监听
        this.dragOn();
    }

    private resetEditor(): Editor {
        if (this._editorNode) {
            this._editorNode.getComponent(Editor).Fsm.MachineLayer.clear();
            this._editorNode.removeFromParent();
            this._editorNode.destroy();
        }
        this._editorNode = cc.instantiate(Res.getLoaded(ResUrl.PREFAB.EDITOR));
        this.node.addChild(this._editorNode);
        let editor = this._editorNode.getComponent(Editor);
        Editor.Inst = editor;
        return editor;
    }

    /**
     * 注册拖拽文件事件监听
     */
    private dragOn() {
        if (!cc.sys.isBrowser) {
            return;
        }
        let canvas = document.getElementById('GameCanvas');
        canvas.addEventListener("dragenter", (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);

        canvas.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);

        canvas.addEventListener("dragleave", (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);

        canvas.addEventListener("drop", (e) => {
            e.preventDefault();
            e.stopPropagation();
            // 处理拖拽文件的逻辑
            let files = e.dataTransfer.files;
            let reg = /\.json$/;
            if (!reg.test(files[0].name)) {
                return;
            }
            this.readProject(files[0]);
        }, false);
    }

    /**
     * 读取工程文件
     */
    private readProject(file: File) {
        let fileReader = new FileReader();
        fileReader.readAsText(file);
        fileReader.onload = () => {
            cc.log(fileReader.result);

            let editor = this.resetEditor();
            editor.importProject(JSON.parse(fileReader.result as string));
        };
    }
}
