
import { Component, _decorator } from 'cc';
import AnimatorAnimation from '../../animator/AnimatorAnimation';
const { ccclass, property } = _decorator;

@ccclass('Model')
export class Model extends Component {

    private _animator: AnimatorAnimation = null!;

    start() {
        this._animator = this.getComponent(AnimatorAnimation)!;
    }
}
