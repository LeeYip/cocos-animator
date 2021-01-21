import Editor from "./Editor";

/**
 * 本地设置
 */
export default class Setting {
    private static _inspectorWidth: number = 400;
    public static get inspectorWidth() { return this._inspectorWidth; }
    
    private static _parametersWidth: number = 300;
    public static get parametersWidth() { return this._parametersWidth; }

    /**
     * 初始化读取数据
     */
    public static read() {
        let str = cc.sys.localStorage.getItem('setting');
        if (!str) {
            return;
        }
        let data = JSON.parse(str);
        if (!data) {
            return;
        }
        if (data.inspectorWidth) {
            this._inspectorWidth = data.inspectorWidth;
        }
        if (data.parametersWidth) {
            this._parametersWidth = data.parametersWidth;
        }
    }

    /**
     * 保存数据
     */
    public static save() {
        this._inspectorWidth = Editor.Inst.Inspector.node.width;
        this._parametersWidth = Editor.Inst.Parameters.node.width;
        let data = {
            inspectorWidth: this._inspectorWidth,
            parametersWidth: this._parametersWidth
        };
        cc.sys.localStorage.setItem('setting', JSON.stringify(data));
    }
}