module.exports = {
    resolved: (value) => new PromiseAPlus(function (resolve) { resolve(value) }),
    rejected: (reason) => new PromiseAPlus(function (resolve, reject) { reject(reason) }),
    deferred(){
        var resolve, reject
        return {
            resolve: resolve,
            reject: reject,
            promise: new PromiseAPlus(function(res,rej){
                resolve = res
                reject = rej
            })
        }
    }
}

class PromiseAPlus {
    constructor(callback) {
    }
}