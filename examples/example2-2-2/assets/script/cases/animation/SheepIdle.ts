import AnimatorStateLogic from "../../animator/core/AnimatorStateLogic";

export default class SheepIdle extends AnimatorStateLogic {

    public onEntry() {
        cc.log('idle entry');
    }

    public onUpdate() {
        cc.log('idle update');
    }

    public onExit() {
        cc.log('idle exit');
    }
}
