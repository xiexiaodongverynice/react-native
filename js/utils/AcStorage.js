/**
 * @flow
 */

import _ from 'lodash';
import { AsyncStorage } from 'react-native';

/**
 * TODO:重构
 * 1. 作为持久化存储工具，还是希望能够保持输入和输出的统一性。（目前存在的问题是输入数据类型，输出的是序列化后的内容），可以参考 react-native-storage 这个库的实现
 * 2. 函数名一般是： load(read)/save、set/get 这样的匹配方式
 * 3. 不要在函数内部对不同类型的输入做兼容，否则对该函数的输入会造成不确定性（除非非法输入的检查）必要的话，使用多个函数实现
 * 4. 在异步函数的实现中，非理想状况应当统一输出并说明原因 throw new Error('reason') 或者 return Promise.reject(new Error('reason'))
 * 5. 调用 async await 的时候想好到底有没有必要阻塞当前 stack frame 中剩余的逻辑，以及是否能够达到自己想要的结果。
 */
export default class AcStorage {
  /**
   *
   *
   * @static
   * @param {*} data object
   * @returns
   * @memberof AcStorage
   */
  static async save(data) {
    const saveData = data;
    if (_.isObject(saveData) && !_.isEmpty(saveData)) {
      const saveStorageList = [];
      _.each(saveData, (value, key) => {
        const storageValue = JSON.stringify(value);
        console.log('storageValue====>', storageValue);
        saveStorageList.push(AsyncStorage.setItem(key, storageValue));
      });
      const resultMessage = await Promise.all(saveStorageList);
      console.log('resultMessage====>', resultMessage);
      return true;
    } else {
      console.error('[error]AcStorage need object');
    }
    return false;
  }

  /**
   *
   *
   * @static
   * @param {*} data Arrary or string
   * @returns
   * @memberof AcStorage
   */
  static async get(data) {
    if (data && _.isArray(data) && !_.isEmpty(data)) {
      const getStorageList = [];
      _.each(data, (key) => {
        getStorageList.push(AsyncStorage.getItem(key));
      });
      const resultData = await Promise.all(getStorageList);
      console.log('resultData====>', resultData);
      return resultData;
    } else if (data && _.isString(data)) {
      const resultData = await AsyncStorage.getItem(data);
      console.log('resultData====>string', resultData);
      return resultData;
    }
    return false;
  }

  /**
   *
   *
   * @static
   * @param {*} data Arrary or string
   * @returns
   * @memberof AcStorage
   */
  static async remove(data) {
    if (data && _.isArray(data) && !_.isEmpty(data)) {
      const removeStorageList = [];
      _.each(data, (key) => {
        removeStorageList.push(AsyncStorage.removeItem(key));
      });
      const resultData = await Promise.all(removeStorageList);
      console.log('resultData====>', resultData);
      return resultData;
    } else if (data && _.isString(data)) {
      console.log('data====>', data);
      const resultData = await AsyncStorage.removeItem(data);
      console.log('remove=====resultData====>string', resultData);
      return resultData;
    }
    return false;
  }

  static async clear() {
    AsyncStorage.clear();
  }
}
