/**
 * Created by Uncle Charlie, 2018/07/29
 * @flow */

import React from 'react';
import { View, Platform, NativeModules } from 'react-native';
import _ from 'lodash';
import { Title, Content, Text, Button, Icon } from 'native-base';
import RNFS from 'react-native-fs';
// import OpenFile from 'react-native-doc-viewer';
import I18n from '../../i18n';
import themes from '../common/theme';
import {
  StyledContainer,
  StyledBody,
  HeaderLeft,
  HeaderRight,
  StyledHeader,
} from '../common/components';
import { MIDDLE_ATTACH_PATH } from '../../utils/util';
import UtilConfig from '../../utils/config';
import viewFile from '../common/FileViewer';
import request from '../../utils/request';

type Prop = { layout: any, navigation: any };
type State = { downloadStatus: string, progressNum: string };

const platform = Platform.OS;
const PREVIEW_FORMAT = ['.pdf'];
const IMAGE_FORMAT = ['.png', '.jpg'];

export default class PreviewScreen extends React.PureComponent<Prop, State> {
  state: State = { downloadStatus: 'none' };
  attachmentCacheDir: string = RNFS.DocumentDirectoryPath + MIDDLE_ATTACH_PATH;
  fileInfo: ?{} = null;
  fileInfoKey: string = '';
  token: string = '';
  fileExt: string;

  constructor(props: Prop) {
    super(props);

    const {
      fileInfo,
      fileInfo: { key },
      token,
    } = _.get(this.props, 'navigation.state.params');
    this.fileInfo = fileInfo;
    this.fileInfoKey = key;
    this.token = token;

    const extension = _.get(this.fileInfo, 'userMetadata.file-extension');

    //* ios兼容
    // this.fileExt = Platform.OS === 'ios' && extension == '.xlsx' ? '.xls' : extension;
    this.fileExt = extension;
  }

  async componentDidMount() {
    // Create attachment dir
    const cacheDirExists = await RNFS.exists(this.attachmentCacheDir);
    let success = false;
    if (!cacheDirExists) {
      success = await this.createDir(this.attachmentCacheDir);
      if (!success) {
        console.warn('Create attachment dir error');
      }
    }
    const mediaUrl =
      RNFS.DocumentDirectoryPath + MIDDLE_ATTACH_PATH + this.fileInfoKey + this.fileExt;
    const isFileExist = await RNFS.exists(mediaUrl);
    if (isFileExist) {
      this.setState({
        downloadStatus: 'done',
        progressNum: '',
      });
    }
  }

  createDir = async (filePath: string): Promise<boolean> => {
    try {
      await RNFS.mkdir(filePath);
      return true;
    } catch (e) {
      console.warn('===>mkdir error', e);
      return false;
    }
  };

  downloadAttachment = async () => {
    const {
      file_server,
      api: { upload_files },
    } = UtilConfig;
    try {
      const url = `${file_server + upload_files + this.fileInfoKey}?token=${this.token}`;
      const ret = RNFS.downloadFile({
        fromUrl: url,
        toFile: this.attachmentCacheDir + this.fileInfoKey + this.fileExt,
        progress: (res) => {
          const pro = (parseFloat(res.bytesWritten / res.contentLength) * 100).toFixed(2) + '%';
          if (pro === '100.00%') {
            this.setState({
              downloadStatus: 'done',
              progressNum: '',
            });
          } else {
            this.setState({
              downloadStatus: 'loading',
              progressNum: pro,
            });
          }
        },
      });
      ret.promise.then((res) => {
        this.setState({
          downloadStatus: 'done',
          progressNum: '',
        });
      });
    } catch (err) {
      this.setState({ downloadStatus: 'none', progressNum: '下载失败' });
      console.error('===>download attachment error: ', err);
    }
  };

  handlePress = () => {
    const {
      file_server,
      api: { upload_image },
    } = UtilConfig;

    const { navigation } = this.props;
    const { downloadStatus } = this.state;
    if (downloadStatus === 'none') {
      this.downloadAttachment();
    } else {
      const mediaUrl =
        RNFS.DocumentDirectoryPath + MIDDLE_ATTACH_PATH + this.fileInfoKey + this.fileExt;
      if (platform !== 'ios') {
        viewFile(mediaUrl);
        // OpenFile.openDoc(
        //   [
        //     {
        //       url: mediaUrl,
        //       fileName: 'Android',
        //       cache: true,
        //       fileType: this.fileExt,
        //     },
        //   ],
        //   (error, url) => {
        //     if (error) {
        //       console.log(error);
        //     } else {
        //       console.log(url);
        //     }
        //   },
        // );
        return;
      }

      if (IMAGE_FORMAT.includes(this.fileExt)) {
        const imagePath = `${file_server + upload_image + this.fileInfoKey}?token=${
          global.FC_CRM_TOKEN
        }`;

        navigation.navigate('PhotoDetail', {
          photoKey: this.fileInfoKey,
          imagePath,
        });
      } else {
        navigation.navigate('Web', { displayLocal: 'local', mediaUrl });
      }
    }
  };

  renderContent = () => {
    const { downloadStatus } = this.state;
    // const mediaUrl = this.attachmentCacheDir + this.fileInfoKey + this.fileExt;

    return (
      <View
        style={{
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          alignContent: 'center',
          marginTop: 50,
        }}
      >
        <Text>{_.get(this.fileInfo, 'userMetadata.original-name', '')}</Text>
        <View
          style={{
            marginTop: 10,
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            alignContent: 'center',
          }}
        >
          <Text>{this.state.progressNum}</Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 20,
          }}
        >
          {downloadStatus === 'none' ? (
            <Button iconLeft onPress={this.handlePress} info>
              <Icon name="download" type="Foundation" />
              <Text>{I18n.t('PreviewScreen.Button.Download')}</Text>
            </Button>
          ) : null}
          {downloadStatus === 'done' ? (
            <Button iconLeft onPress={this.handlePress} success>
              <Icon type="FontAwesome" name="folder-open" />
              <Text>{I18n.t('PreviewScreen.Button.Open')}</Text>
            </Button>
          ) : null}
          {downloadStatus === 'loading' ? (
            <Button iconLeft warning>
              <Icon name="arrow-down" type="FontAwesome" />
              <Text>{I18n.t('PreviewScreen.Button.Downloading')}</Text>
            </Button>
          ) : null}
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            paddingTop: 20,
          }}
        >
          <Button iconLeft onPress={_.debounce(this.preview, 300)} info>
            <Icon name="ios-eye" type="ios-eye" />
            <Text>{I18n.t('PreviewScreen.Button.Preview')}</Text>
          </Button>
        </View>
      </View>
    );
  };

  preview = async () => {
    const { navigation } = this.props;
    const url = `${UtilConfig.previewUrl}${UtilConfig.api.preview
      .replace('{attachment}', this.fileInfoKey)
      .replace('query', global.FC_CRM_TOKEN)}`;
    const resultData = await request(url, 'GET');
    const previewUrl = _.get(resultData, 'body.result', '');
    navigation.navigate('Web', {
      mediaUrl: previewUrl,
    });
  };

  render() {
    const { layout, navigation } = this.props;
    return (
      <StyledContainer style={{ backgroundColor: themes.fill_base }}>
        <StyledHeader>
          <HeaderLeft navigation={navigation} />
          <StyledBody>
            <Title
              style={{
                color: themes.title_text_color,
                fontSize: themes.title_size,
              }}
            >
              {I18n.t_layout_headerTitle(layout, I18n.t('preview'))}
            </Title>
          </StyledBody>
          <HeaderRight />
        </StyledHeader>
        <Content>{this.renderContent()}</Content>
      </StyledContainer>
    );
  }
}
