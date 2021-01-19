// import AnimatorBase from "./lib/AnimatorBase";

// const { ccclass, property, requireComponent } = cc._decorator;

// /** Spine状态机组件 */
// @ccclass
// @requireComponent(sp.Skeleton)
// export default class AnimatorSpine extends AnimatorBase {
// 	spine: sp.Skeleton = null;
// 	listeners: Array<Function>;

// 	protected start(): void {
// 		this.listeners = new Array<Function>();
// 		this.spine = this.getComponent(sp.Skeleton);
// 		if (this.AssetRawUrl !== null) {
// 			this.initJson(this.AssetRawUrl.json);
// 		}

// 		this.spine.setCompleteListener(this.spineAniStateEvent.bind(this));
// 		this.spine.setEventListener(this.spineAniEvent.bind(this));
// 	}

// 	private spineAniStateEvent(obj, trackIndex, type, event, loopCount): void {
// 		this._animatorController.onAnimationComplete();
// 	}

// 	private spineAniEvent(track, event): void {
// 		for (let i = 0; i < this.listeners.length; i++) {
// 			this.listeners[i](track, event);
// 		}
// 	}

// 	public addEventListener(cb: Function): void {
// 		this.listeners.push(cb);
// 	}

// 	public playAnimation(aniName: string, loop: boolean): void {
// 		this.spine.setAnimation(0, aniName, loop);
// 	}

// 	public scaleTime(scale: number): void {
// 		if (scale > 0)
// 			this.spine.timeScale = scale;
// 	}
// }
