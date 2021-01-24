import AnimatorStateLogic from "../../animator/core/AnimatorStateLogic";

export default class SheepRun extends AnimatorStateLogic {

    public onEntry() {
        cc.log('run entry');
    }

    public onUpdate() {
        cc.log('run update');
    }

    public onExit() {
        cc.log('run exit');
    }
}
