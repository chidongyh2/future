import { Setting } from "../sequelize";
import redis from "../redis";
import { SettingAttributes } from "../models/setting.model";
import { generateKey } from "../utils/cache";
const getAllSetting = (): Promise<SettingAttributes[]> => {
    return new Promise((resolve, reject) => {
        let key = generateKey({
            type: "all_setting"
        });
        redis.get(key, (err, values) => {
            if(err || !values) {
                Setting.findAll({
                    raw: true
                }).then((data) => {
                    redis.set(key, JSON.stringify(data), "ex", 86400);
                    resolve(data);
                }).catch(() => {
                    resolve([]);
                })
            } else {
                try {
                    let data: any = JSON.parse(values)
                    resolve(data);
                } catch(ex) {
                    resolve([]);
                }
            }
        })
    })
}
const getSetting = (key: string): Promise<string | number | boolean | any> => {
    return new Promise(async(resolve, reject) => {
        let settings = await getAllSetting();
        let search = settings.filter((arr) => arr.key === key);
        if(search.length > 0) {
            switch(search[0].type) {
                case "boolean":
                    resolve(JSON.parse(search[0].content));
                case "number":
                    resolve(Number(search[0].content));
                case "string":
                    resolve(String(search[0].content));
            }
        } else {
            reject("Notfound");
        }
    });
}
export {
    getSetting,
    getAllSetting
}
export default getSetting;