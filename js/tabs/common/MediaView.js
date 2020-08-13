/**
 * Created by Uncle Charlie, 2018/03/08
 * @flow
 */

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Button } from 'native-base';
import RNFS from 'react-native-fs';
import { zip, unzip, unzipAssets, subscribe } from 'react-native-zip-archive';
import _ from 'lodash';
import md5 from 'js-md5';

import themes from './theme';
import I18n from '../../i18n';

type Prop = {
  url: string,
  navigation: any,
  id: number,
};

type State = {
  progress: number,
  mediaStatus: 'init' | 'downloading' | 'done' | 'unzipping' | 'removed',
  previewImageFile: string,
};

const DOWMLOAD_DISABLED_STATUS = ['done', 'unzipping', 'downloading'];
const MIDDLE_PATH = '/media/cache/';
const platform = Platform.OS;

export default class MediaView extends React.Component<Prop, State> {
  toFile: string;
  unzipDir: string;
  jobId: number;

  state: State = {
    progress: 0,
    mediaStatus: 'init',
    previewImageFile: '',
  };

  constructor(props: Prop) {
    super(props);

    if (props.url) {
      const { url, id } = props;
      const seasonUrl = md5(`${url}_${id}`);

      this.toFile = `${RNFS.DocumentDirectoryPath + MIDDLE_PATH + seasonUrl}.zip`;
      this.unzipDir = `${RNFS.DocumentDirectoryPath + MIDDLE_PATH + seasonUrl}_unzipped`;
    }
  }

  async componentDidMount() {
    const exists = await RNFS.exists(this.unzipDir);

    if (exists) {
      // * 存在缓存文件夹且有预览图时，可直接读取缓存媒体
      const previewImageFile = await this.getPreviewImageFile();
      previewImageFile && this.setState({ mediaStatus: 'done', previewImageFile });
    }
  }

  componentWillUnmount() {
    const { mediaStatus } = this.state;
    if (mediaStatus === 'downloading') {
      RNFS.stopDownload(this.jobId);
    }
  }

  //* 获取缓存文件夹中预览图
  //* 预览图文件名为 thumbnail，但格式由上传图片决定
  getPreviewImageFile = async () => {
    const dirFiles = await RNFS.readdir(this.unzipDir);
    return _.find(dirFiles, (file) => file.match(/^thumbnail/));
  };

  createDir = async (filePath: string) => {
    try {
      await RNFS.mkdir(filePath);
      return true;
    } catch (e) {
      console.warn('===>mkdir error', e);
      return false;
    }
  };

  handleDownloadProgress = (res: any) => {
    if (!res) {
      console.error('===>download res is not valid can not calculate progress');
      return;
    }

    const { bytesWritten, contentLength } = res;

    this.setState({ progress: bytesWritten / contentLength });
  };

  handleDownload = async () => {
    const { url } = this.props;

    try {
      const exists = await RNFS.exists(this.unzipDir);
      let createSuccess = true;
      if (!exists) {
        createSuccess = await this.createDir(this.unzipDir);
      }

      if (!createSuccess) {
        console.warn('===>unzip dir can not be created');
        return;
      }

      // download
      this.setState({ mediaStatus: 'downloading' });
      await this.downloadFile(url, this.toFile, this.handleDownloadProgress);

      // unzip
      this.setState({ mediaStatus: 'unzipping' });
      await unzip(this.toFile, this.unzipDir);
      const previewImageFile = await this.getPreviewImageFile();
      this.setState({ mediaStatus: 'done', previewImageFile });
    } catch (e) {
      console.error('===>download media error', e);
    }
  };

  handlePlay = () => {
    const { navigation } = this.props;
    const params = navigation.state.params.navParam;

    navigation.navigate('Web', {
      mediaUrl: `${this.unzipDir}/index.html`,
      displayLocal: 'local',
      needRotate: true,
      params,
    });
    if (_.isFunction(params.filmCallback)) {
      params.filmCallback(params.id);
    }
  };

  handleRemove = async () => {
    const [zipExists, unzippedExists] = [
      await RNFS.exists(this.toFile),
      await RNFS.exists(this.unzipDir),
    ];

    try {
      if (zipExists) {
        await RNFS.unlink(this.toFile);
      }

      if (unzippedExists) {
        await RNFS.unlink(this.unzipDir);
      }

      this.setState({ mediaStatus: 'removed', progress: 0 });
    } catch (e) {
      console.error('===>media remove error', e);
    }
  };

  downloadFile = (from: string, to: string, progressHandler: (res: any) => void) => {
    const { jobId, promise } = RNFS.downloadFile({
      fromUrl: from,
      toFile: to,
      progress: progressHandler,
      background: true,
      progressDivider: platform === 'ios' ? 1 : 10,
    });

    this.jobId = jobId;

    return promise.then((val) => {
      const taskId = _.get(val, 'jobId');
      if (jobId !== taskId) {
        throw new Error('job ids are not equal to each other!');
      }
    });
  };

  renderImage = () => {
    const { mediaStatus, previewImageFile } = this.state;

    const imageLocalPath =
      platform === 'ios'
        ? `${this.unzipDir}/${previewImageFile}`
        : `file:///${this.unzipDir}/${previewImageFile}`;

    return (
      <View style={{ flex: 1 }}>
        <Image
          resizeMode="contain"
          style={[styles.image, mediaStatus === 'done' ? { height: 0 } : { height: 200 }]}
          source={require('../img/media_default.png')}
        />
        <Image
          resizeMethod="resize"
          style={[
            styles.image,
            mediaStatus !== 'done' ? { height: 0 } : { height: 200 },
            { resizeMode: 'stretch' },
          ]}
          source={{ uri: imageLocalPath }}
        />
      </View>
    );
  };

  renderProgress = () => {
    const { mediaStatus, progress } = this.state;

    return `progress: ${mediaStatus === 'done' ? '100%' : `${Math.ceil(progress * 100)}%`}`;
  };

  render() {
    const { url } = this.props;
    const { mediaStatus } = this.state;
    const downloadDisabled = !url || DOWMLOAD_DISABLED_STATUS.includes(mediaStatus);

    return (
      <View style={{ flex: 1, alignSelf: 'stretch', overflow: 'hidden' }}>
        {this.renderImage()}
        <View style={{ flexDirection: 'row' }}>
          <Text>{this.renderProgress()}</Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Button
            style={[
              styles.actionButton,
              downloadDisabled && {
                backgroundColor: themes.fill_button_disabled,
              },
            ]}
            disabled={downloadDisabled}
            onPress={this.handleDownload}
          >
            <Text
              style={[
                {
                  color: themes.primary_button_text_color,
                  fontSize: themes.button_font_size,
                },
                downloadDisabled && { color: themes.color_text_light },
              ]}
            >
              {I18n.t('download')}
            </Text>
          </Button>
          <Button
            disabled={mediaStatus !== 'done'}
            style={[
              styles.actionButton,
              mediaStatus !== 'done' && {
                backgroundColor: themes.fill_button_disabled,
              },
            ]}
            onPress={this.handlePlay}
          >
            <Text
              style={[
                {
                  color: themes.primary_button_text_color,
                  fontSize: themes.button_font_size,
                },
                mediaStatus !== 'done' && { color: themes.color_text_light },
              ]}
            >
              {I18n.t('media_play')}
            </Text>
          </Button>
          <Button
            disabled={mediaStatus !== 'done'}
            style={[
              styles.actionButton,
              mediaStatus !== 'done' && {
                backgroundColor: themes.fill_button_disabled,
              },
            ]}
            onPress={this.handleRemove}
          >
            <Text
              style={[
                {
                  color: themes.primary_button_text_color,
                  fontSize: themes.button_font_size,
                },
                mediaStatus !== 'done' && { color: themes.color_text_light },
              ]}
            >
              {I18n.t('media_delete')}
            </Text>
          </Button>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
    marginTop: 10,
    marginBottom: 5,
    marginHorizontal: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themes.primary_button_fill,
  },
  disabledButton: {
    backgroundColor: themes.fill_button_disabled,
    color: themes.color_text_light,
  },
  buttonText: {
    color: themes.primary_button_text_color,
    fontSize: themes.button_font_size,
  },
  image: {
    height: 200,
    backgroundColor: 'white',
    marginHorizontal: 1,
  },
});
