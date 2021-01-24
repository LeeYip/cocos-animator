import AnimatorStateLogic from "../../animator/core/AnimatorStateLogic";
import AnimationScene from "./AnimationScene";

export default class SheepHit extends AnimatorStateLogic {
    private _ctr: AnimationScene = null;

    public constructor(ctr: AnimationScene) {
        super();
        this._ctr = ctr;
    }

    public onEntry() {
        this._ctr.speed = 0;
        cc.log('hit entry');
    }

    public onUpdate() {
        this._ctr.speed = 0;
        cc.log('hit update');
    }

    public onExit() {
        cc.log('hit exit');
    }
}
