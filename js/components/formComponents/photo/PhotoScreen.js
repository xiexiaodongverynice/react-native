/**
 * Created by Uncle Charlie, 2018/04/24
 * @flow
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Header, Title, Container, Content, Spinner } from 'native-base';
import RNFS from 'react-native-fs';
import _ from 'lodash';
// 本库对相机和相册已经做了动态权限检查
import ImagePicker from 'react-native-image-picker';
import moment from 'moment';
import { HeaderLeft, StyledBody, HeaderRight, StyledHeader } from '../../../tabs/common/components';
import UtilConfig from '../../../utils/config';
import { toastError, toastWaring } from '../../../utils/toast';
import themes from '../../../tabs/common/theme';
import ImageItem from './ImageItem';
import Globals from '../../../utils/Globals';
import { getFileName, getPhotoKey, MIDDLE_PATH } from '../../../utils/util';
import preventDuplicate from '../../../tabs/common/helpers/preventDuplicate';
import ModalLoadingScreen from '../../modal/ModalLoadingScreen';
import { genFormData } from '../../../utils/request';
import { SETTING_FIELD } from '../../../utils/const';
import I18n from '../../../i18n';

const { width: ScreenWidth, height: ScreenHeight } = Dimensions.get('window');

type Prop = {
  navigation: {
    state: {
      params: {
        fieldDesc: {
          is_camera_only: boolean,
          max_count: string,
        },
        photoList: Array,
        fromSource: string,
        callback: void,
        pageType: string,
        fieldLayout?: any,
        parentRecord?: any,
      },
    },
    navigate: (route: string) => void,
    goBack: () => void,
  },
  dispatch: any,
  screen: string,
  crmPowerSetting: any,
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

const MAX_IMAGE_LIMIT: number = 9;
const platform = Platform.OS;
const IMAGE_WIDTH = (ScreenWidth - 45) / 3;

class PhotoScreen extends React.Component<Prop, State> {
  state = {
    photoList: [],
    completeDownload: false,
    localPhotoList: [],
    editing: false,
    uploadLoading: false,
  };
  photoCacheDir: string = RNFS.DocumentDirectoryPath + MIDDLE_PATH;

  async componentDidMount() {
    const { navigation, onComponentDidMount } = this.props;

    if (_.isFunction(onComponentDidMount)) {
      onComponentDidMount(this.refresh);
    }

    const cacheDirExists = await RNFS.exists(this.photoCacheDir);
    let success = false;
    if (!cacheDirExists) {
      success = await this.createDir(this.photoCacheDir);
      if (!success) {
        console.warn('Create photo cache dir error');
      }
    }

    const params = _.get(navigation, 'state.params', {});
    if (
      _.chain(params)
        .get('onlyCamera')
        .isBoolean()
        .value()
    ) {
      this.onlyCamera = _.get(params, 'onlyCamera');
    } else {
      this.onlyCamera = _.get(params, 'fieldDesc.is_camera_only');
    }

    this.max_count = Number(_.get(navigation, 'state.params.fieldDesc.max_count', MAX_IMAGE_LIMIT));
    this.fieldLayout = _.get(params, 'fieldLayout', {});
    this.parentRecord = _.get(params, 'parentRecord', {});

    const photoList = _.get(navigation, 'state.params.photoList', []);
    this.setState({ photoList: _.filter(photoList, _.isString) });
  }

  async componentDidUpdate() {
    const { completeDownload } = this.state;
    if (!completeDownload) {
      await this.downloadPhotos();
      this.setState({
        completeDownload: true,
      });
    }
  }

  componentWillUnmount() {
    Globals.enableTokenAutoCleaner();
    const { navigation, onComponentUnMount } = this.props;
    const clearTime = _.get(navigation, 'state.params.clearTime');
    if (_.isFunction(onComponentUnMount)) {
      onComponentUnMount();
    }
    if (_.isFunction(clearTime)) {
      console.log('clear time');
      clearTime();
    }
  }

  //*验证 renderType photo 的拍摄时间是否需要匹配对应field
  validPhotoDate = (response: PhotoTypes): boolean => {
    const photoTime = _.get(response, 'timestamp');
    //* 拍照模式下不能获取时间
    if (_.isUndefined(photoTime) || _.isEmpty(this.fieldLayout) || _.isEmpty(this.parentRecord)) {
      return true;
    }

    const errorMes = _.get(
      this.fieldLayout,
      SETTING_FIELD.DISABLED_TIP_TITLE,
      '照片拍摄日期不符合要求',
    );

    //* 当为时间戳时，拍照日期与时间戳时期为同一天，如果为数组，则拍照时间在该数据范围内
    const matchField: string | Array<string> = _.get(
      this.fieldLayout,
      SETTING_FIELD.TARGET_DATE_MATCH_PHOTO,
    );

    //* 布局没有配置 SETTING_FIELD.TARGET_DATE_MATCH_PHOTO 时不做校验
    if (_.isUndefined(matchField)) return true;

    //* 通过布局配置的field字段，获取对应的value
    const matchFieldDate = _.isString(matchField)
      ? _.get(this.parentRecord, matchField)
      : _.map(matchField, (cell) => _.get(this.parentRecord, cell));

    try {
      if (_.isNumber(matchFieldDate)) {
        const photoDateInday = moment(photoTime).format('YYYY-MM-DD');
        const fieldTimeIndays = moment(matchFieldDate).format('YYYY-MM-DD');

        //* 拍照时间在同一天
        if (photoDateInday == fieldTimeIndays) {
          return true;
        }
      } else if (_.isArray(matchFieldDate) && matchFieldDate.length === 2) {
        const startTimestamp = Math.min(...matchFieldDate);
        const endTimestamp = Math.max(...matchFieldDate);
        const photoTimestamp = moment(photoTime).valueOf();
        //* 拍照时间需在指定范围内
        if (
          !_.isNaN(startTimestamp) &&
          !_.isNaN(endTimestamp) &&
          photoTimestamp > startTimestamp &&
          photoTimestamp < endTimestamp
        ) {
          return true;
        }
      }
    } catch (e) {
      toastError(errorMes);
      return false;
    }

    toastError(errorMes);
    return false;
  };

  createDir = async (filePath: string): Promise<boolean> => {
    try {
      await RNFS.mkdir(filePath);
      return true;
    } catch (e) {
      console.warn('===>mkdir error', e);
      return false;
    }
  };

  handlePhoto = async (res: { path: string, uri: string }) => {
    const imageUri = Platform.OS === 'android' ? res.path : res.uri;

    const { photoList } = this.state;
    try {
      const filename = getFileName(imageUri);
      const exists = await RNFS.exists(this.photoCacheDir + filename);
      if (!exists) {
        const moveResult = await RNFS.moveFile(imageUri, this.photoCacheDir + filename);
      }

      this.setState({
        photoList: _.concat([], photoList, filename),
      });
    } catch (e) {
      console.warn('copy image error', e);
      toastError('图片处理出错');
    }
  };

  navTakePic = () => {
    Globals.disableTokenAutoCleaner();

    const { crmPowerSetting } = this.props;
    const quality = _.get(crmPowerSetting, 'photo_compression_ratio', '40');
    const options = {
      title: I18n.t('PhotoScreen.Title.Select'),
      takePhotoButtonTitle: '拍照',
      chooseFromLibraryButtonTitle: this.onlyCamera ? null : '相册选择',
      cancelButtonTitle: '取消',
      storageOptions: {
        skipBackup: true,
        // path: 'images',
      },
      mediaType: 'photo',
      quality: +quality / 100,
      allowsEditing: false,
      permissionDenied: {
        title: '稍后重试',
        text: '拍摄或从相册选择',
        reTryTitle: '重试',
        okTitle: '确定',
      },
    };

    const _callbackPicker = (response: PhotoTypes) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        toastError('保存图片出错');
      } else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton);
      } else {
        this.validPhotoDate(response) && this.handlePhoto(response);
      }
    };

    if (this.onlyCamera) {
      //对于设置只拍照的，点击加号直接拉起相机
      ImagePicker.launchCamera(options, _callbackPicker);
    } else {
      ImagePicker.showImagePicker(options, _callbackPicker);
    }
  };

  getLocalPath = (photo: string) => {
    if (platform === 'ios') {
      if (photo.indexOf('.jpg') > 0) {
        return this.photoCacheDir + photo;
      }
      return `${this.photoCacheDir + photo}.jpg`;
    } else {
      if (photo.indexOf('.jpg') > 0) {
        return `file://${this.photoCacheDir}${photo}`;
      }
      return `file://${this.photoCacheDir}${photo}.jpg`;
    }
  };

  handleEdit = () => {
    this.setState((prevState) => ({
      editing: !prevState.editing,
    }));
  };

  handleDelete = (path: string) => {
    const { photoList } = this.state;
    const currentKey = getPhotoKey(path);
    const filtered = _.filter(photoList, (photoKey: string) => photoKey !== currentKey);

    this.setState({
      photoList: filtered,
    });
  };

  navToDetail = (path: string, photoKey: string) => {
    const { navigation } = this.props;
    navigation.navigate('PhotoDetail', {
      photoKey,
      imagePath: path,
    });
  };

  renderPhotos = () => {
    const { navigation } = this.props;
    const { editing } = this.state;
    const pageType = _.get(navigation, 'state.params.pageType');
    const photoList = _.get(this.state, 'photoList', []);
    const photoNum = photoList.length;
    const imagePlaceholder = 'add_image';
    const renderPhotoList = _.concat([], photoList);

    photoNum < this.max_count && renderPhotoList.push(imagePlaceholder);

    const {
      file_server,
      api: { upload_image },
    } = UtilConfig;

    if (renderPhotoList) {
      return _.map(renderPhotoList, (photo) => {
        if (photo !== imagePlaceholder) {
          const photoPath =
            photo.indexOf('.jpg') > 0
              ? this.getLocalPath(photo)
              : `${file_server + upload_image + photo}?token=${global.FC_CRM_TOKEN}`;
          return (
            <ImageItem
              key={photo}
              photo={photo}
              token={global.FC_CRM_TOKEN}
              imagePath={photoPath}
              edge={IMAGE_WIDTH}
              editing={editing}
              onDelete={this.handleDelete}
              navToDetail={this.navToDetail}
            />
          );
        } else {
          return (
            pageType !== 'detail' && (
              <TouchableOpacity key={photo} onPress={this.navTakePic}>
                <Image
                  style={[styles.image, { height: IMAGE_WIDTH, width: IMAGE_WIDTH }]}
                  source={require('../../../tabs/img/add_image.png')}
                />
              </TouchableOpacity>
            )
          );
        }
      });
    }
  };

  downloadPhotos = async () => {
    const { navigation } = this.props;
    const photoList = _.get(this.state, 'photoList', []);
    const {
      file_server,
      api: { upload_image },
    } = UtilConfig;

    try {
      const downloadActions = [];
      _.each(photoList, (photo) => {
        if (photo.indexOf('.jpg') < 0) {
          const url = `${file_server + upload_image + photo}_200_200?token=${global.FC_CRM_TOKEN}`;
          const { promise } = RNFS.downloadFile({
            fromUrl: url,
            toFile: `${this.photoCacheDir + photo}.jpg`,
          });
          downloadActions.push(promise);
        }
      });

      const results = await Promise.all(downloadActions);
      this.setState({
        completeDownload: true,
      });
    } catch (e) {
      console.warn('download photos error', e);
    }
  };

  // TODO: refactor to photo service
  uploadPhotos = async () => {
    const { navigation } = this.props;
    const { photoList, editing } = this.state;
    const callback = _.get(navigation, 'state.params.callback');
    const fromSource = _.get(navigation, 'state.params.fromSource');
    const watermarkInfo = _.get(navigation, 'state.params.watermarkInfo');

    //* 判断是否是签到照片
    if (fromSource && fromSource === 'sign') {
      if (_.isEmpty(photoList)) {
        toastWaring('请添加照片');
        return;
      }
    }

    if (_.isEmpty(photoList)) {
      callback && callback([]);
      navigation.goBack();
      return;
    }
    if (editing) {
      return;
    }

    const {
      file_server,
      api: { upload_image },
    } = UtilConfig;

    const imageDate = moment().format('YYYY-MM-DD HH:mm');

    try {
      const uploadActions = [];
      this.setState({ uploadLoading: true });
      const externalFormData = watermarkInfo // only for sign
        ? {
            watermarkArr: watermarkInfo.content,
            water_needed: watermarkInfo.needed,
          }
        : {};

      _.each(photoList, (photo, index) => {
        if (photo.indexOf('.jpg') < 0) {
          return;
        }

        const fileName = `${imageDate} - ${index}.jpg`;
        const photoPath = this.getLocalPath(getFileName(photo));

        const data = genFormData({
          file: {
            uri: photoPath,
            name: fileName,
            type: 'image/jpg',
          },
          ...externalFormData,
        });

        const config = {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'multipart/form-data;',
            token: global.FC_CRM_TOKEN,
          },
          body: data,
        };
        const url = `${file_server + upload_image}?sizes=200_200`;
        const action = fetch(url, config).then((res) => {
          const result = res && res.json();
          return result;
        });

        uploadActions.push(action);
      });

      //* 如果没有新拍摄的相片，直接将现有照片列表传递给主对象
      if (_.isEmpty(uploadActions)) {
        this.setState({ uploadLoading: false });
        callback && callback(photoList);
        navigation.goBack();
        return;
      }

      const result = await Promise.all(uploadActions);
      /*  eslint-disable */
      if (
        !_.isArray(result) ||
        _.isEmpty(result) ||
        result.some((e) => (_.get(e, 'key') ? false : true))
      ) {
        console.warn('[error]upload photo faild', result);
        toastWaring('上传图片超时，请重新上传');
        this.setState({ uploadLoading: false });
        return;
      }
      /*  eslint-disable */
      const photoKeys = _.map(result, (item) => _.get(item, 'key'));

      const photoKeysList = _.get(this.state, 'photoList', []);
      const onlineKeys = _.filter(photoKeysList, (item) => item.indexOf('.jpg') < 0) || [];
      const processedPhotos = _.concat([], photoKeys, onlineKeys);

      this.setState({ uploadLoading: false });
      callback && callback(processedPhotos);
      navigation.goBack();
    } catch (err) {
      this.setState({ uploadLoading: false });
      console.warn('Upload image error', err);
    }
  };

  renderUploadButton = () => {
    const { navigation } = this.props;
    const { editing } = this.state;
    const pageType = _.get(navigation, 'state.params.pageType', 'detail');

    return (
      pageType !== 'detail' && (
        <TouchableOpacity onPress={this.handleEdit}>
          <View
            style={{
              marginHorizontal: 5,
              height: 35,
              justifyContent: 'center',
              alignItems: 'stretch',
              margin: 10,
            }}
          >
            <Text style={{ textAlign: 'center', color: 'white' }}>{editing ? '完成' : '编辑'}</Text>
          </View>
        </TouchableOpacity>
      )
    );
  };

  render() {
    const { navigation, dispatch, screen } = this.props;
    const { editing, uploadLoading } = this.state;
    const pageType = _.get(navigation, 'state.params.pageType', 'detail');
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
            <Title
              style={{
                color: themes.title_text_color,
                fontSize: themes.title_size,
              }}
            >
              {'上传照片'}
            </Title>
          </StyledBody>
          <HeaderRight>{this.renderUploadButton()}</HeaderRight>
        </StyledHeader>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginHorizontal: 10,
            justifyContent: 'flex-start',
          }}
        >
          {this.renderPhotos()}
        </View>
        <View
          style={[
            {
              position: 'absolute',
              left: 10,
              right: 10,
              bottom: themes.isIphoneX ? 50 : 20,
              backgroundColor: themes.fill_base_color,
            },
            editing ? { backgroundColor: themes.fill_disabled } : null,
          ]}
        >
          {pageType !== 'detail' && (
            <TouchableOpacity onPress={preventDuplicate(this.uploadPhotos, 1000)}>
              <View
                style={[
                  {
                    marginHorizontal: 5,
                    height: 35,
                    justifyContent: 'center',
                    alignItems: 'stretch',
                    margin: 10,
                  },
                  editing ? { backgroundColor: themes.fill_disabled } : null,
                ]}
              >
                <Text
                  style={[
                    { textAlign: 'center', color: 'white' },
                    editing ? { color: themes.input_disable_color } : null,
                  ]}
                >
                  {'上传'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
        <ModalLoadingScreen
          visibleStatus={uploadLoading}
          handleModalLoading={() => {
            this.setState({ uploadLoading: false });
          }}
        />
      </Container>
    );
  }
}
const select = (state, screen) => ({ crmPowerSetting: state.settings.crmPowerSetting });

const act = (dispatch, { navigation }) => {
  const key = _.get(navigation, 'state.key');
  return {
    actions: bindActionCreators({}, dispatch),
    dispatch,
  };
};

export default connect(select, act)(PhotoScreen);
const styles = StyleSheet.create({
  image: {
    marginTop: 10,
    marginLeft: 8,
  },
});
