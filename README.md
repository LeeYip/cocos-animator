# 仿Unity Animator可视化动画状态机编辑器

## TODO
- [ ] 加载界面
- [ ] 导入animation、spine、dragon bone文件生成状态节点
- [x] 选中状态节点时，可更改transition排序，用于决定优先级（inspector中的transition显示需要做特殊表现用以表示此时可以进行排序）
- [x] 状态节点与子状态机节点可以拖入到子状态机节点内，需解决跨越多层连线的问题
- [x] 连向状态机的连线选项显示多层状态
- [ ] 优化ui与代码、drawcall
- [ ] *?每个状态机的entry和exit，状态机和状态一样也可以绑定逻辑脚本*

## 注意点
- 参数名、子状态机名、状态名都不可重名
- trigger与Unity中trigger逻辑相同；autoTrigger与trigger类似，但每次状态机内部逻辑更新之后都会自动reset
- 状态机组件update会优先执行，添加了@executionOrder(-1000) 
- 当transition未勾选hasExitTime以及没有添加任何condition时，transition会被忽略
- Parameters和Inspector两个界面如果内容超出，使用鼠标滚轮滚动，因为为了防止与拖拽行为产生冲突，触摸事件已被屏蔽

## 文件格式
### 1. 编辑器工程文件格式
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

### 2. runtime解析所需的文件格式
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
