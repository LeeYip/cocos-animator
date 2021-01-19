const { ccclass, property } = cc._decorator;

@ccclass
export default class CanvasAdapt extends cc.Component {
    protected onLoad() {
        this.adapt();
        // 仅web有效
        cc.view.setResizeCallback(() => {
            this.adapt();
        });
    }

    private adapt() {
        let resolutionRatio = cc.Canvas.instance.designResolution.width / cc.Canvas.instance.designResolution.height;
        let ratio = cc.winSize.width / cc.winSize.height;
        if (ratio > resolutionRatio) {
            cc.Canvas.instance.fitHeight = true;
            cc.Canvas.instance.fitWidth = false;
        } else {
            cc.Canvas.instance.fitHeight = false;
            cc.Canvas.instance.fitWidth = true;
        }
    }
}
