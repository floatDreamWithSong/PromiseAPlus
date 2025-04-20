module.exports = {
    // 创建一个用value实现了的promise
    resolved: (value) =>
        new PromiseAPlus(function (resolve) {
            resolve(value);
        }),
    // 创建一个以reason拒绝了的promise
    rejected: (reason) =>
        new PromiseAPlus(function (resolve, reject) {
            reject(reason);
        }),
    /**
     * 
     * @returns {{
     *    resolve: function,
     *    reject: function,
     *    promise: PromiseAPlus,
     * }}
     */
    deferred() {
        var r = {
            // 用value完成promise
            resolve: void 0,
            //用于让promise变为拒绝
            reject: void 0,
            // 一个正在处理中的promise
            promise: void 0
        };
        r.promise = new PromiseAPlus(function (res, rej) {
            r.resolve = res;
            r.reject = rej;
        })
        return r;
    },
};

const PENDING = "pending";
const FULLFILLED = "fullfilled";
const REJECTED = "rejected";

class PromiseAPlus {
    state = PENDING;
    result = void 0;
    reason = void 0;
    fullfilledHandler = void 0;
    rejectedHandler = void 0;
    promiseSubscribers = [];

    toFullfilledState(result) {
        if (this.state !== PENDING) return;
        this.state = FULLFILLED;
        this.result = result;
        this.tryPublish();
    }
    toRejectState(reason) {
        if (this.state !== PENDING) return;
        this.state = REJECTED;
        this.reason = reason;
        this.tryPublish();
    }
    exec(subscriber) {
        var handler = void 0;
        try {
            if (this.state === FULLFILLED) {
                handler = subscriber.fullfilledHandler || function (result) { return result };
                subscriber.toResolve(handler(this.result));
            } else if (this.state === REJECTED) {
                handler = subscriber.rejectedHandler || function (reason) { throw reason };
                subscriber.toResolve(handler(this.reason));
            }
        } catch (e) {
            subscriber.toRejectState(e);
        }
    }
    tryPublish() {
        if (this.state === PENDING) return;
        this.promiseSubscribers.forEach((subscriber) => {
            // 测试中要求异步实现
            setTimeout(() => {
                this.exec(subscriber)
            }, 0);
        });
        this.promiseSubscribers = [];
    }

    constructor(callback) {
        if (callback && typeof callback === "function") {
            callback((value) => {
                this.toResolve(value)
            }, (reason) => {
                this.toRejectState(reason)
            });
        }
        return this;
    }
    toResolve(x) {
        if (x === this) {
            this.toRejectState(new TypeError("循环引用自身"));
            return
        }
        /**
        * 如果 x 为 promise ，则使 promise 接受 x 的状态:
        *   如果 x 处于等待态， promise 需保持为等待态直至 x 被完成或拒绝
        *   如果 x 处于完成态，用相同的值完成 promise
        *   如果 x 处于拒绝态，用相同的拒绝原因拒绝 promise
        */
        if (x instanceof PromiseAPlus) {
            if (x.state === PENDING)
                x.then((value) => {
                    this.toResolve(value);
                }, (reason) => {
                    this.toRejectState(reason);
                });
            else if (x.state === FULLFILLED)
                this.toResolve(x.result);
            else if (x.state === REJECTED)
                this.toRejectState(x.reason);
        }
        /**
         * 如果 x 为对象或者函数：
         *  把 x.then 赋值给 then
         *  如果取 x.then 的值时抛出错误 e ，则以 e 为拒绝原因拒绝 promise
         */
        else if (typeof x === "object" || typeof x === "function") {
            let then;
            try {
                then = x.then;
            } catch (e) {
                return this.toRejectState(e);
            }
            if (typeof then === "function") {
                /**
                 * 如果 then 是函数，将 x 作为函数的this作用域，并调用之。
                 * 传递两个回调函数作为参数，第一个参数叫做 resolvePromise ，第二个参数叫做 rejectPromise:
                 *   如果 resolvePromise 以值 y 为参数被调用，则运行 [[Resolve]](promise, y)
                 *   如果 rejectPromise 以拒绝原因 r 为参数被调用，则以拒绝原因 r 拒绝 promise
                 *   如果 resolvePromise 和 rejectPromise 均被调用，或者被同一参数调用了多次，则优先采用首次调用并忽略剩下的调用
                 *   如果调用 then 方法抛出了异常 e：
                 *      如果 resolvePromise 或 rejectPromise 已经被调用，则忽略之
                 *      否则以 e 为拒绝原因拒绝 promise
                 */
                try {
                    then.call(x,
                        (y) => {
                            if (this.state !== PENDING) return;
                            this.toFullfilledState(y);
                        }, (r) => {
                            if (this.state !== PENDING) return;
                            this.toRejectState(r);
                        }
                    );
                } catch (e) {
                    if (this.state !== PENDING) return;
                    this.toRejectState(e);
                }
            }
            // 如果 then 不是函数，以 x 为参数完成 promise
            else {
                this.toFullfilledState(x);
            }
        }
        // 如果 x 不为对象或者函数，以 x 为参数完成 promise
        else {
            this.toFullfilledState(x);
        }
    }
    /**
       * onFulfilled 和 onRejected 都是可选参数。
       * 如果 onFulfilled 不是函数，其必须被忽略
       * 如果 onRejected 不是函数，其必须被忽略
       * 如果 onFulfilled 是函数：
       * 当 promise 完成结束后其必须被调用，其第一个参数为 promise 的终值
       * 在 promise 完成结束前其不可被调用
       * 其调用次数不可超过一次
       * 如果 onRejected 是函数：
       * 当 promise 被拒绝完成后其必须被调用，其第一个参数为 promise 的拒绝原因
       * 在 promise 被拒绝完成前其不可被调用
       * 其调用次数不可超过一次
       * @returns {PromiseAPlus}
       */
    then(onFullfilled, onRejected) {
        // 新建一个跟随在这个promise后的新promise
        var subscriber = new PromiseAPlus()
        if (typeof onFullfilled === "function") {
            subscriber.fullfilledHandler = onFullfilled;
        }
        if (typeof onRejected === "function") {
            subscriber.rejectedHandler = onRejected;
        }
        this.promiseSubscribers.push(subscriber);
        this.tryPublish();
        return subscriber;
    }
}