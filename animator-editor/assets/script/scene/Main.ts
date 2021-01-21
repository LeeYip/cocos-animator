import Res from "../common/util/Res";
import { ResDirUrl, ResUrl } from "../constant/ResUrl";
import Editor from "../editor/Editor";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Main extends cc.Component {
    private _editor: Editor = null;

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

    private resetEditor() {
        if (this._editor) {
            this._editor.Fsm.MachineLayer.clear();
            this._editor.node.removeFromParent();
            this._editor.node.destroy();
        }
        let node = cc.instantiate(Res.getLoaded(ResUrl.PREFAB.EDITOR));
        this._editor = node.getComponent(Editor);
        Editor.Inst = this._editor;
        this.node.addChild(node);
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
            this.readFiles(files);
        }, false);
    }

    /**
     * 文件读取
     */
    private readFiles(files: FileList) {
        for (let i = 0; i < files.length; i++) {
            let file: File = files[i];
            if (/\.json$/.test(file.name)) {
                this.readJson(file);
            } else if (/\.anim$/.test(file.name)) {
                this.readAnim(file);
            }
        }
    }

    /**
     * 读取.json文件
     */
    private readJson(file: File) {
        let fileReader = new FileReader();
        fileReader.readAsText(file);
        fileReader.onload = () => {
            cc.log(fileReader.result);
            let data: any = JSON.parse(fileReader.result as string);
            if (data.animator) {
                // 读取状态机工程文件
                this.resetEditor();
                this._editor.Parameters.import(data.parameters);
                this._editor.Fsm.importProject(data);
            } else if (data.skeleton && data.animations) {
                // 读取spine文件
                this._editor.Fsm.improtSpine(data);
            } else if (data.armature) {
                // 读取龙骨文件
                this._editor.Fsm.importDragonBones(data);
            }
        };
    }

    /**
     * 读取cocos .anim文件
     */
    private readAnim(file: File) {
        let fileReader = new FileReader();
        fileReader.readAsText(file);
        fileReader.onload = () => {
            cc.log(fileReader.result);
            let data: any = JSON.parse(fileReader.result as string);
            this._editor.Fsm.importAnim(data);
        };
    }
}
