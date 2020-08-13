/*  eslint-disable */
/**
 * 函数防抖 (只执行最后一次点击)
 * @param fn
 * @param delay
 * @returns {Function}
 * @constructor
 */
export function Debounce(fn: any, delay: number = 1000) {
  let timer;
  return function() {
    let args = arguments;
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * 函数节流
 * @param fn
 * @param interval
 * @returns {Function}
 * @constructor
 */
export function Throttle(fn: any, interval: number = 1000) {
  let last;
  let timer;
  return function() {
    let args = arguments;
    let now = +new Date();
    if (last && now - last < interval) {
      //   console.log('小于间隔');
      //     clearTimeout(timer);
      //     timer = setTimeout(() => {
      //       last = now;
      //       fn.apply(this, args);
      //     }, interval);
    } else {
      last = now;
      fn.apply(this, args);
    }
  };
}

// /**
//  * 改装函数节流
//  * @param fn
//  * @param interval
//  * @returns {Function}
//  * @constructor
//  */
// export function RefitThrottle(fn: any, interval: number = 1000) {
//   let last;
//   let timer;
//   let status = true;
//   return function() {
//     let args = arguments;
//     let now = +new Date();
//     if (last && now - last < interval) {
//       console.log('小于间隔1');

//       if (status) {
//         console.log('小于间隔');
//         clearTimeout(timer);
//         timer = setTimeout(() => {
//           last = now;
//           fn.apply(this, args);
//         }, interval);
//       }
//     } else {
//       console.log('刚刚好');
//       console.log(Debounce, now);
//       last = now;
//       fn.apply(this, args);
//       status = false;
//       Throttle(() => {
//         status = true;
//       }, 500);
//     }
//   };
// }
