# Cocos Animator
一个用于Cocos Creator的可视化动画状态机编辑器。<br/>
编辑器地址：https://leeyip.github.io/cocos-animator/

## 目录

## 前言

## 使用

## 注意点
- 参数名、子状态机名、状态名都不可重名
- trigger与Unity中trigger逻辑相同；autoTrigger与trigger类似，但每次状态机内部逻辑更新之后都会自动reset
- 状态机组件update会优先执行，添加了@executionOrder(-1000) 
- 当transition未勾选hasExitTime以及没有添加任何condition时，transition会被忽略
- Parameters和Inspector两个界面如果内容超出，使用鼠标滚轮滚动，因为为了防止与拖拽行为产生冲突，触摸事件已被屏蔽

## 数据格式
### 1. 编辑器工程数据格式
```
{
    /** 编辑器版本号 */
    animator: string;
    parameters: [
        {
            /** 参数名 */
            param: string;
            /** 参数类型 */
            type: ParamType;
            /** 初始值 */
            init: number;
        }
    ];
    mainStateMachine: {
        layerPos: [number, number];
        layerScale: number;
        anyStatePos: [number, number];

        subStates: string[];
        subStateMachines: string[];
    };
    subStateMachines: [
        {
            /** 此状态机视图坐标 */
            layerPos: [number, number];
            /** 此状态机视图缩放 */
            layerScale: number;
            /** 此状态机视图内AnyState坐标 */
            anyStatePos: [number, number];

            /** 状态机名 **/
            name: string;
            /** 在父状态机视图下的坐标 */
            position: [number, number];
            /** 父状态机 **/
            upStateMachine: string;
            /** 在此状态机视图内父状态机的坐标 */
            upStateMachinePos: [number, number];
            /** 子状态 */
            subStates: string[];
            /** 子状态机 */
            subStateMachines: string[];
        }
    ];
    defaultState: string;
    anyState: {
        transitions: [
            {
                toState: string;
                hasExitTime: boolean;
                conditions: [
                    {
                        param: string;
                        value: number;
                        logic: LogicType;
                    }
                ]
            }
        ]
    };
    states: [
        {
            /** 在父状态机视图下的坐标 */
            position: [number, number];
            /** 父状态机 **/
            upStateMachine: string;

            /** 状态名 */
            state: string;
            /** 动画名 */
            motion: string;
            /** 动画播放速度 */
            speed: number;
            /** 动画播放速度混合参数 */
            multiplier: string;
            /** 动画是否循环播放 */
            loop: boolean;
            /** 转向别的状态的连线 */
            transitions: [
                {
                    /** 目标状态名 */
                    toState: string;
                    /** 是否需等动画播放完毕才可转换 */
                    hasExitTime: boolean;
                    /** 转换需满足的参数条件 */
                    conditions: [
                        {
                            /** 此条件对应的参数名 */
                            param: string;
                            /** 此条件对应的值 */
                            value: number;
                            /** 此条件与值比较的逻辑 */
                            logic: LogicType;
                        }
                    ]
                }
            ]
        }
    ];
}
```

### 2. runtime解析所需的数据格式
```
{
    parameters: [
        {
            param: string;
            type: ParamType;
            init: number;
        }
    ];
    defaultState: string;
    anyState: {
        transitions: [
            {
                toState: string;
                hasExitTime: boolean;
                conditions: [
                    {
                        param: string;
                        value: number;
                        logic: LogicType;
                    }
                ]
            }
        ]
    };
    states: [
        {
            state: string;
            motion: string;
            speed: number;
            multiplier: string;
            loop: boolean;
            transitions: [
                {
                    toState: string;
                    hasExitTime: boolean;
                    conditions: [
                        {
                            param: string;
                            value: number;
                            logic: LogicType;
                        }
                    ]
                }
            ]
        }
    ];
}
```
