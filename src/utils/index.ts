import datatable from "./datatable";
const sleep = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
const random = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min)) + min;
}
const timenow = (): number => {
    return Math.floor(Date.now() / 1000) * 1000;
}
const groupByKey = (list: any[], key: string) => list.reduce((hash, obj) => ({...hash, [obj[key]]:( hash[obj[key]] || [] ).concat(obj)}), {})
const explodeBy = (begin: string, end: string, data: string) => {
    try {
        let result = data.split(begin);
        result = result[1].split(end);
        return result[0];
    } catch (ex) {
        return "";
    }
}
const convertSlug = (str: string) => {
    try {
        // Chuyển hết sang chữ thường
        str = str.toLowerCase();
        // xóa dấu
        str = str.replace(/(à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ)/g, 'a');
        str = str.replace(/(è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ)/g, 'e');
        str = str.replace(/(ì|í|ị|ỉ|ĩ)/g, 'i');
        str = str.replace(/(ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ)/g, 'o');
        str = str.replace(/(ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ)/g, 'u');
        str = str.replace(/(ỳ|ý|ỵ|ỷ|ỹ)/g, 'y');
        str = str.replace(/(đ)/g, 'd');
        // Xóa ký tự đặc biệt
        str = str.replace(/([^0-9a-z-\s])/g, '');
        // Xóa khoảng trắng thay bằng ký tự -
        str = str.replace(/(\s+)/g, '-');
        // xóa phần dự - ở đầu
        str = str.replace(/^-+/g, '');
        // xóa phần dư - ở cuối
        str = str.replace(/-+$/g, '');
        // return
        return str;
    } catch(ex) {
        return "full";
    }
}
const numberFormat = (num: string | number, decimals: any, decPoint: any, thousandsSep: any): string => {
    try {
        num = (num + '').replace(/[^0-9+\-Ee.]/g, '')
        let n = !isFinite(+num) ? 0 : +num
        let prec = !isFinite(+decimals) ? 0 : Math.abs(decimals)
        let sep = (typeof thousandsSep === 'undefined') ? ',' : thousandsSep
        let dec = (typeof decPoint === 'undefined') ? '.' : decPoint
        let s: any = ''
        let toFixedFix = (ns: any, precs: any) => {
            if (('' + ns).indexOf('e') === -1) {
                let vls: any = ns + 'e+' + precs;
                return +(Math.round(vls) + 'e-' + prec)
            } else {
                let arr = ('' + n).split('e')
                let sig = ''
                if (+arr[1] + precs > 0) {
                    sig = '+'
                }
                let vlss :any = +arr[0] + 'e' + sig + (+arr[1] + precs);
                let vlsss = (+(Math.round(vlss)) + 'e-' + precs);
                return Number(vlsss).toFixed(precs);
            }
        }
        s = (prec ? toFixedFix(n, prec).toString() : '' + Math.round(n)).split('.')
        if (s[0].length > 3) {
            s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep)
        }
        if ((s[1] || '').length < prec) {
            s[1] = s[1] || ''
            s[1] += new Array(prec - s[1].length + 1).join('0')
        }
        return s.join(dec)
    } catch(ex) {
        return "0";
    }
}
export {
    sleep,
    random,
    timenow,
    explodeBy,
    convertSlug,
    groupByKey,
    numberFormat,
    datatable
}
export default {
    sleep,
    random,
    timenow,
    explodeBy,
    convertSlug,
    groupByKey,
    numberFormat,
    datatable
}