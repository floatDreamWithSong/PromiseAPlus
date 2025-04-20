module.exports = {
    // 创建一个用value实现了的promise
    resolved: (value) => new PromiseAPlus(function (resolve) { resolve(value) }),
    // 创建一个以reason拒绝了的promise
    rejected: (reason) => new PromiseAPlus(function (resolve, reject) { reject(reason) }),
    deferred() {
        var resolve, reject
        return {
            // 用value完成promise
            resolve: resolve,
            //用于让promise变为拒绝
            reject: reject,
            // 一个正在处理中的promise
            promise: new PromiseAPlus(function (res, rej) {
                resolve = res+""
                reject = rej
            })
        }
    }
}

class PromiseAPlus {
    state
    constructor(callback) {
        return this
    }
    /**
     * @returns {PromiseAPlus}
     */
    then() {
        return this
    }
    /**
    * @returns {PromiseAPlus}
    */
    finally() {

    }
    /**
    * @returns {PromiseAPlus}
    */
    catch() {

    }
}