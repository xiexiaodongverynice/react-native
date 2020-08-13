// /**
//  * Created by Uncle Charlie, 2017/12/06
//  * @flow
//  */

// import { AsyncStorage } from 'react-native';
// import _ from 'lodash';
// import RNFS from 'react-native-fs';

// const CACHE_DIR = `${RNFS.DocumentDirectoryPath}/app/7t5mtgvz/cache/`;
// const SYS_CACHE_FILE = 'ait6m4ih.json';
// const OTHER_CACHE_FILE = '461n2j.json';

// export default class CacheService {
//   static async prepare() {
//     try {
//       const sysCacheFile = createCachePath(SYS_CACHE_FILE);
//       const otherCacheFile = createCachePath(OTHER_CACHE_FILE, 'data');

//       const [sysCacheExists, otherCacheExists] = [
//         await RNFS.exists(sysCacheFile),
//         await RNFS.exists(otherCacheFile),
//       ];
//       if (!sysCacheExists && !otherCacheExists) {
//         console.log('===>cache exists sys & other', sysCacheExists, otherCacheExists);
//         await RNFS.mkdir(CACHE_DIR);
//       }

//       if (!sysCacheExists) {
//         await RNFS.writeFile(sysCacheFile, '');
//       }

//       if (!otherCacheExists) {
//         await RNFS.writeFile(otherCacheFile, '');
//       }
//       return true;
//     } catch (e) {
//       console.warn('cache-prepare, create file error', e);
//       return false;
//     }
//   }

//   /**
//    * Load multiple caches specified by keys
//    * @param cacheKeys Array<String>
//    * @returns {Promise<void>}
//    */
//   static async laodMultCache(cacheKeys: Array<string>, cacheLocation: CacheLocation = 'sys') {
//     try {
//       const sysCacheFile = createCachePath('', cacheLocation);

//       const content = await RNFS.readFile(sysCacheFile);
//       const contentJson = JSON.parse(content);

//       // set current user id to global cache
//       const currentUserId = _.get(contentJson, 'userId', '');
//       const crmPowerSetting = _.get(contentJson, 'crmPowerSetting');
//       const permission = _.get(contentJson, 'permission', '');
//       // Globals.setupGlobals({ permission });

//       // await Globals.setGlobalCRMSettings(crmPowerSetting, currentUserId);
//       return [null, contentJson];
//     } catch (e) {
//       console.warn(`cache load multiple cache error ${cacheKeys && cacheKeys.join(',')}`, e);
//       return [e, null];
//     }
//   }

//   static async storeMultiCache(
//     data: any,
//     keys: Array<string>,
//     cacheLocation: CacheLocation = 'sys',
//   ) {
//     try {
//       const sysCacheFile = createCachePath('', cacheLocation);
//       const content = JSON.stringify(data);
//       await RNFS.writeFile(sysCacheFile, content);
//       return true;
//     } catch (e) {
//       console.warn('multi-cache error', e);
//       return false;
//     }
//   }

//   static async storeSingle(
//     data: any,
//     key: string,
//     cacheLocation: CacheLocation = 'sys',
//   ): Promise<boolean> {
//     try {
//       const serializedData = JSON.stringify(data);
//       // await AsyncStorage.setItem(key, serializedData);

//       // Use file as cache directly.
//       // const otherCacheFile =
//       //   CACHE_DIR + (fromSys ? SYS_CACHE_FILE : OTHER_CACHE_FILE);
//       const otherCacheFile = createCachePath('', cacheLocation);

//       const content = await RNFS.readFile(otherCacheFile);
//       const contentJson = JSON.parse(content);

//       _.set(contentJson, 'key', data);
//       await RNFS.writeFile(otherCacheFile, JSON.stringify(contentJson));

//       return true;
//     } catch (e) {
//       console.warn('storeSingle error', e);
//       return false;
//     }
//   }

//   static async fetchSingle(
//     key: string,
//     fromSys: boolean = true,
//     cacheLocation: CacheLocation = 'sys',
//   ): Promise<?any> {
//     try {
//       // const otherCacheFile =
//       //   CACHE_DIR + (fromSys ? SYS_CACHE_FILE : OTHER_CACHE_FILE);
//       const otherCacheFile = createCachePath('', cacheLocation);
//       const content = await RNFS.readFile(otherCacheFile);

//       const jsonContent = JSON.parse(content);
//       const result = _.get(jsonContent, key);
//       return result;
//     } catch (e) {
//       console.warn(`###fetch cache error ${key}`, e);
//       return null;
//     }
//   }

//   /**
//    * Remove caches with given keys.
//    * @param {*} keys keys to be removed from cache.
//    */
//   static async removeAll(keys: Array<string>, cacheLocation: CacheLocation = 'sys') {
//     // return AsyncStorage.multiRemove(keys);
//     try {
//       // const sysCacheFile = CACHE_DIR + SYS_CACHE_FILE;
//       const sysCacheFile = createCachePath('', cacheLocation);
//       const content = await RNFS.readFile(sysCacheFile);
//       const contentJson = JSON.parse(content);

//       _.each(keys, (k) => {
//         _.set(contentJson, k, null);
//       });

//       const result = JSON.stringify(contentJson);
//       await RNFS.writeFile(sysCacheFile, result);
//       return true;
//     } catch (e) {
//       console.warn('cache-remove-all, error', e);
//       return false;
//     }
//   }

//   static async cacheLayout(layoutFileName: string, layoutContent: any) {
//     try {
//       const serializedData = JSON.stringify(layoutContent);
//       const otherCacheFile = createCachePath(layoutFileName, 'layout');

//       await RNFS.writeFile(otherCacheFile, serializedData);

//       return true;
//     } catch (e) {
//       console.warn('[error] cacheLayout', layoutFileName, e);
//       return false;
//     }
//   }

//   static async loadLayoutCache(layoutFileName: string) {
//     try {
//       const otherCacheFile = createCachePath(layoutFileName, 'layout');
//       const content = await RNFS.readFile(otherCacheFile);
//       const jsonContent = JSON.parse(content);

//       return jsonContent;
//     } catch (e) {
//       console.warn(`[error] loadLayoutCache  ${layoutFileName}`, e);
//       return null;
//     }
//   }

//   /**
//    * Private method to check if keys exist.
//    * @param {*} cacheKeys keys to be checked.
//    */
//   static async _keysExists(cacheKeys) {
//     return AsyncStorage.getAllKeys()
//       .then(
//         (keys) => {
//           if (!keys || !cacheKeys) {
//             return null;
//           }
//           const storedKeys = _.intersection(keys, cacheKeys);
//           return storedKeys;
//         },
//         (err) => {
//           console.log('===>storage error', err);
//           return null;
//         },
//       )
//       .catch((err) => {
//         console.log('===>storage error', err);
//         return null;
//       });
//   }

//   static convertToObj(cacheData: {}) {
//     const result = {};
//     _.map(cacheData, (item) => {
//       result[item[0]] = JSON.parse(item[1]);
//     });
//     return result;
//   }

//   static async loadSingleCache(cacheKey: string) {
//     const data = await AsyncStorage.getItem(cacheKey);
//     return data;
//   }
// }

// function createCachePath(fileName: string, cacheType: CacheType = 'sys') {
//   if (cacheType === 'sys') {
//     const sysCacheFile = CACHE_DIR + SYS_CACHE_FILE;
//     return sysCacheFile;
//   } else if (cacheType === 'data') {
//     const otherCacheFile = CACHE_DIR + OTHER_CACHE_FILE;
//     return otherCacheFile;
//   } else if (cacheType === 'layout') {
//     const layoutCacheFile = CACHE_DIR + fileName;
//     return layoutCacheFile;
//   }
//   return null;
// }
