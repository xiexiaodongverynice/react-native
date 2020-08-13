/**
 * @flow
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Modal,
} from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Title, Container } from 'native-base';
import _ from 'lodash';
// import RNFS from 'react-native-fs';
// 本库对相机和相册已经做了动态权限检查
import ImagePicker from 'react-native-image-picker';
import Video from './Video';
import { compress2Mp4, getMediaInfo } from './util';
import { HeaderLeft, StyledBody, HeaderRight, StyledHeader } from '../../../tabs/common/components';
// import { getFileName, MIDDLE_ATTACH_PATH } from '../../../utils/util';
import UtilConfig from '../../../utils/config';
import { toastError, toastWaring } from '../../../utils/toast';
import themes from '../../../tabs/common/theme';
import preventDuplicate from '../../../tabs/common/helpers/preventDuplicate';
import ModalLoadingScreen from '../../modal/ModalLoadingScreen';
import { genFormData } from '../../../utils/request';
import VideoItem from './VideoItem';
import HttpRequest from '../../../services/httpRequest';
import I18n from '../../../i18n';
// import { MIDDLE_ATTACH_PATH } from '../../../utils/util';

const VIDEO_TYPE_CHOOSE = 'video/choose';
const VIDEO_TYPE_RECORD = 'video/record';
const VIDEO_TYPES = [VIDEO_TYPE_CHOOSE, VIDEO_TYPE_RECORD];
const MAX_VIDEO_LIMIT: number = 9;

const PAGE_TYPE_DETAIL = 'detail';
const PAGE_TYPE_ADD = 'add';
const PAGE_TYPE_EDIT = 'edit';

type Prop = {
  navigation: {
    state: {
      params: {
        fieldDesc: {
          is_camera_only: boolean,
          max_count: string,
        },
        allowSelect: boolean,
        videoList: Array,
        callback: void,
        pageType: string,
      },
    },
    goBack: Function,
  },
  dispatch: any,
  screen: string,
  onComponentDidMount: void,
  onComponentUnMount: void,
};

type State = {
  editing: boolean,
  photoList: Array<string>,
  completeDownload: boolean,
  localPhotoList: Array<string>,
  uploadLoading: boolean, //* 上传loading状态
};
class VideoScreen extends React.Component<Prop, State> {
  static defaultProps = {
    allowSelect: true,
  };

  constructor(props) {
    super(props);
    this.pageType = _.get(props.navigation, 'state.params.pageType', PAGE_TYPE_ADD);
    this.maxCount = Number(
      _.get(props.navigation, 'state.params.fieldDesc.max_count', MAX_VIDEO_LIMIT),
    );

    this.state = {
      isProcessingMedia: false,
      isLoading: true,
      isUploading: false,
      isEditing: false,
      isMuted: false,
      activedVideo: null,
      baseVideoList: [],
      videoList: [],
    };
  }

  componentDidMount() {
    const { onComponentDidMount } = this.props;

    if (_.isFunction(onComponentDidMount)) {
      onComponentDidMount();
    }

    this.loadFilesInfo()
      .catch((err) => {
        toastError(err.message);
      })
      .finally((res) => {
        this.setState({
          isLoading: false,
        });
      });
  }

  componentWillUnmount() {
    const { onComponentUnMount } = this.props;
    if (_.isFunction(onComponentUnMount)) {
      onComponentUnMount();
    }
  }

  get isDetailPage() {
    return this.pageType === PAGE_TYPE_DETAIL;
  }

  get reachMax() {
    const { baseVideoList, videoList } = this.state;
    return baseVideoList.length + videoList.length === this.maxCount;
  }

  get needUpdate() {
    const initVideoKeys = _.get(this.props.navigation, 'state.params.videoList', []);
    const { videoList, baseVideoList } = this.state;
    return !(videoList.length === 0 && baseVideoList.length === initVideoKeys.length);
  }

  /**
   * 希望可以做批量请求的接口
   */
  loadFilesInfo = () => {
    const {
      file_server,
      api: { upload_files },
    } = UtilConfig;
    const videoKeys = _.get(this.props.navigation, 'state.params.videoList', []);
    this.setState({ isLoading: true });

    return Promise.all(
      videoKeys.map((key) => HttpRequest.queryFileInfo({ key, token: global.FC_CRM_TOKEN })),
    ).then((res) => {
      this.setState({
        baseVideoList: res.map((item) => ({
          key: item.key,
          name: _.get(item, 'userMetadata.original-name', item.key),
          uri: `${file_server + upload_files + 'video/' + item.key}?token=${global.FC_CRM_TOKEN}`,
          duration: parseInt(_.get(item, 'userMetadata.duration', 0)),
          isPortrait: parseInt(_.get(item, 'userMetadata.is-portrait', 1)),
        })),
      });
    });
  };

  uploadFile = (params: Object, duration: Number, isPortrait: Number) => {
    const data = genFormData({ file: params, duration, isPortrait });

    const {
      file_server,
      api: { upload_files },
    } = UtilConfig;
    const config = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'multipart/form-data;',
        token: global.FC_CRM_TOKEN,
      },
      body: data,
    };

    return fetch(`${file_server + upload_files}`, config).then((res) => res.json());
  };

  uploadVideos = () => {
    const { videoList, baseVideoList } = this.state;
    const { navigation } = this.props;
    const onUpload = _.get(navigation, 'state.params.onUpload', () => null);

    if (!this.needUpdate) {
      toastWaring(
        this.pageType === PAGE_TYPE_ADD
          ? I18n.t('VideoScreen.PleaseAddNewVideo')
          : I18n.t('VideoScreen.ListNotChanges'),
      );
      return;
    }

    this.setState({ isUploading: true });

    Promise.all(
      _.map(videoList, (video) =>
        this.uploadFile(
          {
            // iOS 的请求框架会自动根据文件内容生成 type，名为 Content-Type, Android 由 okHttp 实现，不会自动识别。
            uri: video.uri,
            name: video.name,
            type: 'video/mp4',
          },
          video.duration,
          video.isPortrait,
        ),
      ),
    )
      .then((res) => {
        onUpload([...baseVideoList.map((item) => item.key), ...res.map((item) => item.key)]);
        this.setState({ isUploading: false }, () => {
          navigation.goBack();
        });
      })
      .catch((err) => {
        this.setState({ isUploading: false });
        toastError(err.message);
      });
  };

  toggleAction = () => {
    this.setState({
      isEditing: !this.state.isEditing,
    });
  };

  chooseVideo = (type) => {
    if (!VIDEO_TYPES.includes(type)) {
      return;
    }

    const { videoList } = this.state;

    const launchDirect = true;
    const bottomSheet = [I18n.t('VideoScreen.Btn.Record'), I18n.t('VideoScreen.Btn.FromAlbum')];
    const options = {
      title: I18n.t('VideoScreen.Options.Title.Choose'),
      cameraType: 'back',
      takePhotoButtonTitle: I18n.t('VideoScreen.Options.Camera'),
      chooseFromLibraryButtonTitle: launchDirect ? null : bottomSheet,
      cancelButtonTitle: I18n.t('common_cancel'),
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
      mediaType: 'video',
      videoQuality: 'high',
      durationLimit: 60,
      allowsisEditing: false,
      permissionDenied: {
        title: I18n.t('VideoScreen.RetryLater'),
        text: I18n.t('VideoScreen.CameraOrAlbum'),
        reTryTitle: I18n.t('VideoScreen.Retry'),
        okTitle: I18n.t('common_sure'),
      },
    };

    const fn = launchDirect
      ? type === VIDEO_TYPE_CHOOSE
        ? ImagePicker.launchImageLibrary
        : ImagePicker.launchCamera
      : ImagePicker.showImagePicker;

    fn(options, (res) => {
      if (res.didCancel) {
        console.log('User cancelled image picker');
      } else if (res.error) {
        console.log('ImagePicker Error: ', res.error);
      } else if (res.customButton) {
        console.log('User tapped custom button: ', res.customButton);
      } else {
        const path = Platform.OS === 'android' ? 'file://' + res.path : res.uri;

        this.setState({ isProcessingMedia: true });
        this.processVideo(path)
          .then((processedVideo) => {
            this.setState({ videoList: [...videoList, processedVideo] });
          })
          .catch(() => {
            toastError(I18n.t('VideoScreen.ErrorWhenProcess'));
          })
          .finally(() => {
            this.setState({ isProcessingMedia: false });
          });
      }
    });
  };

  processVideo = (path) =>
    compress2Mp4(path).then((compressRes) =>
      getMediaInfo(compressRes.path).then((info) => ({
        name: compressRes.name,
        uri: compressRes.path,
        duration: Math.round(info.duration / 1000),
        isPortrait: info.streams[0].height > info.streams[0].width ? 1 : 0,
      })),
    );

  deleteVideo = (video) => {
    this.setState({
      baseVideoList: this.state.baseVideoList.filter((item) => item !== video),
      videoList: this.state.videoList.filter((item) => item !== video),
    });
  };

  openVideo = (video) => {
    if (!video.uri) {
      toastError(I18n.t('VideoScreen.LinkInvalid'));
      return;
    }

    this.setState({
      activedVideo: video,
    });
  };

  closeVideo = () => {
    this.setState({
      activedVideo: null,
    });
  };

  toggleMuted = () => {
    this.video.toggleMute();
    this.setState({
      isMuted: !this.state.isMuted,
    });
  };

  updateLastVideo = (res) => {
    const { videoList } = this.state;
    this.setState({
      videoList: [...videoList.slice(0, -1), { ...videoList[videoList.length - 1], ...res }],
    });
  };

  render() {
    const { navigation, dispatch, screen } = this.props;
    const { isEditing, isUploading, isLoading, isProcessingMedia } = this.state;

    return (
      <Container style={{ flex: 1 }}>
        <StyledHeader>
          <HeaderLeft
            style={{ flex: 1 }}
            navigation={navigation}
            dispatch={dispatch}
            screen={screen}
          />
          <StyledBody>
            <Title style={{ color: themes.title_text_color, fontSize: themes.title_size }}>
              {this.isDetailPage
                ? I18n.t('VideoScreen.VideoList')
                : I18n.t('VideoScreen.UploadVideo')}
            </Title>
          </StyledBody>
          <HeaderRight>{!this.isDetailPage && this.renderActionButton()}</HeaderRight>
        </StyledHeader>
        <View style={styles.content}>
          {this.renderVideos()}
          {!(isEditing || this.isDetailPage || this.reachMax) && this._renderRecordButton()}
        </View>
        <ModalLoadingScreen
          tip={
            isUploading
              ? I18n.t('VideoScreen.Uploading')
              : isLoading
              ? I18n.t('VideoScreen.Loading')
              : I18n.t('VideoScreen.Processing')
          }
          visibleStatus={isUploading || isLoading || isProcessingMedia}
        />
        {!this.isDetailPage && this._renderUploadButton()}
        {this._renderModalPlayer()}
      </Container>
    );
  }

  _renderModalPlayer() {
    const { activedVideo, isMuted } = this.state;
    const muteButtonBg = {
      backgroundColor: `
        rgba(255, 255, 255, ${isMuted ? 0.8 : 0.3})
      `,
    };
    const muteTextColor = { color: isMuted ? 'black' : 'white' };
    const touchConfig = {
      left: 30,
      right: 30,
      top: 0,
      bottom: 0,
    };

    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={activedVideo !== null}
        onRequestClose={() => this.video.toggleVideo()}
      >
        <View style={styles.videoContainer}>
          {activedVideo && (
            <Video
              autoStart
              key={activedVideo.uri}
              ref={(ref) => (this.video = ref)}
              cacheName={activedVideo.name}
              uri={activedVideo.uri}
              isPortrait={activedVideo.isPortrait === 1}
            />
          )}
        </View>
        <SafeAreaView style={styles.safeContainer}>
          <View style={styles.topBar}>
            <TouchableOpacity
              hitSlop={touchConfig}
              onPress={this.closeVideo}
              style={styles.modalOperator}
            >
              <Text style={{ color: 'white' }}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              hitSlop={touchConfig}
              onPress={this.toggleMuted}
              style={[styles.modalOperator, muteButtonBg]}
            >
              <Text style={muteTextColor}>Mute</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  renderVideos() {
    const { videoList, baseVideoList } = this.state;
    return _.map([...baseVideoList, ...videoList], (video, index) => (
      <VideoItem
        key={index}
        name={video.name}
        isEditing={this.state.isEditing}
        duration={video.duration}
        onPress={() => this.openVideo(video)}
        onDelete={() => this.deleteVideo(video)}
      />
    ));
  }

  renderActionButton() {
    const { isEditing } = this.state;
    return (
      <TouchableOpacity onPress={this.toggleAction}>
        <Text style={styles.actionText}>
          {isEditing ? I18n.t('VideoScreen.Done') : I18n.t('VideoScreen.Edit')}
        </Text>
      </TouchableOpacity>
    );
  }

  _renderRecordButton() {
    return (
      <TouchableOpacity
        style={styles.recordButton}
        onPress={preventDuplicate(() => this.chooseVideo(VIDEO_TYPE_RECORD), 1000)}
      >
        <Text style={styles.recordText}>{I18n.t('VideoScreen.Record')}</Text>
      </TouchableOpacity>
    );
  }

  _renderUploadButton() {
    const { isEditing } = this.state;
    return (
      <TouchableOpacity
        style={[
          styles.uploadButton,
          { backgroundColor: isEditing ? themes.fill_disabled : themes.fill_base_color },
        ]}
        activeOpacity={isEditing ? 1 : 0.7}
        onPress={!isEditing ? preventDuplicate(this.uploadVideos, 1000) : null}
      >
        <Text style={[styles.uploadText, isEditing ? { color: themes.input_disable_color } : null]}>
          {this.reachMax ? I18n.t('VideoScreen.MaximumCountReached') : I18n.t('VideoScreen.Upload')}
        </Text>
      </TouchableOpacity>
    );
  }
}

const select = (state, screen) => ({ crmPowerSetting: state.settings.crmPowerSetting });
const act = (dispatch, { navigation }) => ({
  actions: bindActionCreators({}, dispatch),
  dispatch,
});

export default connect(select, act)(VideoScreen);

const styles = StyleSheet.create({
  safeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: '70%',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  topBar: {
    paddingHorizontal: 15,
    marginTop: 15,
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  modalOperator: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButton: {
    marginHorizontal: 5,
    height: 35,
    justifyContent: 'center',
    alignItems: 'stretch',
    margin: 10,
  },
  actionText: {
    textAlign: 'center',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  recordButton: {
    height: 50,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'stretch',
    margin: 20,
    marginBottom: 100,
    borderStyle: 'dashed',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: themes.brand_primary,
  },
  recordText: {
    textAlign: 'center',
    color: themes.brand_primary,
  },
  uploadButton: {
    marginHorizontal: 5,
    height: 44,
    justifyContent: 'center',
    alignItems: 'stretch',
    margin: 20,
    borderRadius: 4,
    marginBottom: themes.isIphoneX ? 50 : 20,
  },
  uploadText: {
    textAlign: 'center',
    color: 'white',
  },
});
