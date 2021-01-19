/** 参数类型 */
export enum ParamType {
    COMPLETE = 0,
    BOOLEAN = 1,
    NUMBER = 2,
    TRIGGER = 3,
    AUTO_TRIGGER = 4
}

/** 逻辑类型 */
export enum LogicType {
    EQUAL = 0,
    NOTEQUAL = 1,
    GREATER = 2,
    LESS = 3,
    GREATER_EQUAL = 4,
    LESS_EQUAL = 5
}

/** 调用时机 */
export enum CheckType {
    /** 每帧调用 */
    CHECK_ON_UPDATE = 1,
    /** 动画结束 */
    CHECK_ON_COMPLETE = 2,
    CHECK_ON_TRIGGER = 3
}

/**
 * 参数数据
 */
export interface ParameterData {
    /** 参数名 */
    param: string;
    /** 参数类型 */
    type: ParamType;
    /** 初始值 */
    init: number;
}

/**
 * 状态数据
 */
export interface StateData {
    /** 状态名 */
    state: string;
    /** 动画名 */
    motion: string;
    /** 动画播放速度 */
    speed: number;
    /** number类型的参数名，用于speed的乘积 */
    multiplier: string;
    /** 动画是否循环播放 */
    loop: boolean;
    /** 连线 */
    transitions: TransitionData[];
}

/**
 * 连线数据
 */
export interface TransitionData {
    /** 目标状态 */
    toState: string;
    /** 是否等动画播放完跳转 */
    hasExitTime: boolean;
    /** 条件 */
    conditions: ConditionData[];
}

/**
 * 条件数据
 */
export interface ConditionData {
    /** 此条件对应的参数名 */
    param: string;
    /** 此条件对应的值 */
    value: number;
    /** 此条件与值比较的逻辑 */
    logic: LogicType;
}

/** 
 * 编辑器版本号
 */
export const ANIMATOR_VERSION = '1.0.0';
