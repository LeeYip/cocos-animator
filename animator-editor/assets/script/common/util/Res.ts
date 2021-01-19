/**
 * 资源管理类
 */
export default class Res {
    /**
     * 资源缓存
     */
    private static _cacheMap: Map<string, cc.Asset> = new Map();

    /**
     * 获取已经预加载的资源。！！！调用前需确保资源已预加载
     * @param url 资源路径
     */
    public static getLoaded(url: string): any {
        let asset = this._cacheMap.get(url);
        if (asset === undefined) {
            cc.error(`[Res.getLoaded] error: 资源未加载`);
            return null;
        }

        return asset;
    }

    /**
     * 加载resources文件夹下单个资源
     * @param url 资源路径
     * @param type 资源类型
     */
    public static async load(url: string, type: typeof cc.Asset): Promise<any> {
        let asset = this._cacheMap.get(url);
        if (asset) {
            return asset;
        }

        return await new Promise((resolve, reject) => {
            cc.loader.loadRes(url, type, (error: Error, resource: cc.Asset) => {
                if (error) {
                    cc.error(`[Res.load] error: ${error}`);
                    resolve(null);
                } else {
                    this._cacheMap.set(url, resource);
                    resolve(resource);
                }
            });
        });
    }

    /**
     * 加载resources文件夹下某个文件夹内全部资源
     * @param url 资源路径
     * @param type 资源类型
     */
    public static async loadDir(url: string, type: typeof cc.Asset): Promise<any[]> {
        return await new Promise((resolve, reject) => {
            cc.loader.loadResDir(url, type, (error: Error, resource: any[], urls: string[]) => {
                if (error) {
                    cc.error(`[Res.loadDir] error: ${error}`);
                    resolve([]);
                } else {
                    urls.forEach((v: string, i: number) => {
                        this._cacheMap.set(v, resource[i]);
                    });
                    resolve(resource);
                }
            });
        });
    }
}
