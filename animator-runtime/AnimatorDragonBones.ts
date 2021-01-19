// import AnimatorBase from "./lib/AnimatorBase";

// const { ccclass, property, requireComponent } = cc._decorator;

// /** DragonBones状态机组件 */
// @ccclass
// @requireComponent(dragonBones.ArmatureDisplay)
// export default class AnimatorDragonBones extends AnimatorBase {
// 	/** DragonBones组件 */
// 	private _dragonBones: dragonBones.ArmatureDisplay = null;

// 	protected start() {
// 		this._dragonBones = this.getComponent(dragonBones.ArmatureDisplay);
// 		if (this.AssetRawUrl !== null) {
// 			this.initJson(this.AssetRawUrl.json);
// 		}

// 		this._dragonBones.addEventListener(dragonBones.EventObject.COMPLETE, this.onAnimFinished, this);
// 	}

// 	public playAnimation(animName: string, loop: boolean) {
// 		this._dragonBones.playAnimation(animName, loop ? 0 : -1);
// 	}

// 	public scaleTime(scale: number) {
// 		if (scale > 0)
// 			this._dragonBones.timeScale = scale;
// 	}
// }
