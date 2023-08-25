import { Setting } from "./sequelize";
import { SettingAttributes } from "./models/setting.model";
const defaultValue: SettingAttributes[] = [{
    key: "DELAY",
    content: "10000",
    description: "Delay thời gian get chart",
    type: "number"
}, {
    key: "MARK_PERCENT_OPEN",
    content: "5",
    description: "Giá đã tăng hoặc giảm bn % từ activePrice để open lệnh",
    type: "number"
}, {
    key: "CALLBACK_RATE_OPEN",
    content: "1",
    description: "Callback rate để open lệnh",
    type: "number"
}, {
    key: "MARK_PERCENT_CLOSE",
    content: "5",
    description: "Giá đã tăng hoặc giảm bn % từ activePrice để close lệnh",
    type: "number"
}, {
    key: "CALLBACK_RATE_CLOSE",
    content: "1",
    description: "Callback Rate để close lệnh",
    type: "number"
}, {
    key: "CALLBACK_RATE_CLOSE_DISTANCE",
    content: "0.5",
    description: "Callback Rate để close lệnh đỡ",
    type: "number"
}, {
    key: "DISTANCE_SHIELD",
    content: "2",
    description: "Khoảng cách nếu thị trường tiếp tục đi xuống hoặc đi lên thì vào lệnh",
    type: "number"
}, {
    key: "DISTANCE_SIZE",
    content: "20",
    description: "Phần trăm size so với entry gốc",
    type: "number"
}, {
    key: "DCA",
    content: "-1000",
    description: "Âm bn % thì DCA",
    type: "number"
}];
const initDB = () => {
    return new Promise(async(resolve, reject) => {
        for(const item of defaultValue) {
            await Setting.create(item).catch(() => "");
        }
        resolve("OK");
    });
}
export default initDB;