import { RNFFmpeg } from 'react-native-ffmpeg';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import _ from 'lodash';
import { MIDDLE_VIDEO_PATH } from '../../../utils/util';

/**
 * https://github.com/tanersener/react-native-ffmpeg
 * @flow
 */
const CACHE_DIR = RNFS.DocumentDirectoryPath + MIDDLE_VIDEO_PATH;
const COMPRESSION_ALGORITHM = 'mpeg4';
const PREFIX = 'mini-';
const SUFFIX = '.mp4';

export function compress2Mp4(filePath, config = {}) {
  const { prefix = PREFIX, suffix = SUFFIX, compressAlgorithm = COMPRESSION_ALGORITHM } = config;
  const pathArr = filePath.split('/');
  const outputName =
    prefix +
    pathArr
      .pop()
      .split('.')
      .slice(0, -1)
      .join('.') +
    suffix;
  const outputPath = pathArr.join('/') + '/' + outputName;

  return RNFFmpeg.executeWithArguments([
    '-i',
    filePath,
    '-c:v',
    compressAlgorithm,
    outputPath,
  ]).then((res) => {
    if (res.rc !== 0) {
      return Promise.reject(res);
    } else {
      return Promise.resolve({
        path: outputPath,
        name: outputName,
      });
    }
  });
}

export function getMediaInfo(filePath) {
  return RNFFmpeg.getMediaInformation(filePath);
}

/**
 * @param {string} uri 判断一个 uri 是否是本地资源
 */
export const isLocalResource = (uri: string): boolean => uri.startsWith('file:///');

/**
 * result will be between 0-100
 * @param {} total
 * @param {float} part
 */
export function caculateProgress(total, part): Number {
  if (_.isNaN(total) || _.isNaN(part) || part === 0) {
    return 0;
  }
  return Math.ceil((part / total) * 100);
}

function fixCacheName(cacheName) {
  return new RegExp('.\\' + SUFFIX + '$').test(cacheName) ? cacheName : cacheName + SUFFIX;
}

export async function cacheMedia(uri, cacheName, onProgress) {
  const localPath = CACHE_DIR + fixCacheName(cacheName);
  const cached = await RNFS.exists(localPath);

  if (cached) {
    return localPath;
  } else {
    await checkCacheDir();
    await downloadFile(uri, localPath, onProgress);
    return localPath;
  }
}

function checkCacheDir() {
  return checkDirectory(CACHE_DIR);
}

export async function checkDirectory(dir) {
  const cacheDirExists = await RNFS.exists(dir); // 这里以 boolean 为 false 为失败结果，具体还要看源码怎么处理。
  if (!cacheDirExists) {
    const result = await RNFS.mkdir(dir);
    if (result) {
      return 'success';
    }
  } else {
    return 'success';
  }
}

// 播放线上流因为 https://stackoverflow.com/questions/33823411/avplayer-fails-to-play-video-sometimes/42244954#42244954 服务端配置的问题，暂时使用手动缓存
export function downloadFile(from: string, to: string, onProgress: (res: any) => void) {
  const { jobId, promise } = RNFS.downloadFile({
    fromUrl: from,
    toFile: to,
    progress: ({ contentLength, bytesWritten }) =>
      onProgress(caculateProgress(contentLength, bytesWritten)),
    background: true,
    progressDivider: Platform.OS === 'ios' ? 1 : 10,
  });

  return promise.then((val) => {
    if (val.statusCode === 200) {
      Promise.resolve({
        jobId,
        finished: true,
        // size: val.bytesWritten
      });
    } else {
      Promise.reject(jobId);
    }
  });
}
