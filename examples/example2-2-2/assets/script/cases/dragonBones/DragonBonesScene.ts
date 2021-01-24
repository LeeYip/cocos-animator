import AnimatorDragonBones from "../../animator/AnimatorDragonBones";

const {ccclass, property} = cc._decorator;

@ccclass
export default class DragonBonesScene extends cc.Component {
    @property(AnimatorDragonBones) Animator: AnimatorDragonBones = null;

    protected onLoad() {
        this.node.on(cc.Node.EventType.TOUCH_START, () => { this.Animator.setTrigger('next'); }, this);
    }
}
