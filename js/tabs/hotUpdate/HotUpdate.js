/**
 * @flow
 */
import React, { Component } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { bindActionCreators } from 'redux';
import { Spinner } from 'native-base';
import { connect } from 'react-redux';
import CodePush from 'react-native-code-push';
import _ from 'lodash';
import themes from '../../tabs/common/theme';
import { updateDeviceVersion, clearDeviceVersion } from '../../actions/updateVersion';
import ProgressBar from './ProgressBar';
import { isCloseUpdate } from '../../utils/config';
import I18n from '../../i18n';
import { toastDefault } from '../../utils/toast';

type Props = {
  success: boolean,
  loading: boolean,
  needUpdate: boolean,
  versionInfo: versionInfoType,
  actions: { clearDeviceVersion: void, updateDeviceVersion: void },
  error: boolean,
};

type States = {};

/***
 * props
 * isHandleUpdate 是否手动检查（true or false）默认false
 * updateMark 手动检查时首次加载组件不需要检查 默认 true
 */
class HotUpdate extends Component<Props, States> {
  constructor(props) {
    super(props);
    this.currProgress = 0.0;
    this.syncMessage = '';
    this.checkingResponses = false; //* 检查设备更新
    this.state = {
      isOverTime: false, // * 检查接口超时
      modalVisible: false, //* 弹窗状态
      immediateUpdate: false, //* 显示更新提示
      description: [], //* 更新内容
      isReload: false, //* 热更新下载重新加载状态
      progressNum: 0.0, //* 进度条数据
      defaultAppVersion: '', //* 备用更新版本号
    };
  }

  codePushStatusDidChange(syncStatus) {
    //* 检查版本状态
    if (this.state.immediateUpdate) {
      switch (syncStatus) {
        case CodePush.SyncStatus.CHECKING_FOR_UPDATE:
          //* 5 开始检查
          this.syncMessage = 'Checking for update';
          break;
        case CodePush.SyncStatus.DOWNLOADING_PACKAGE:
          //* 7 开始下载
          this.syncMessage = 'Downloading package';
          break;
        case CodePush.SyncStatus.AWAITING_USER_ACTION:
          //* 6 等待用户操作
          this.syncMessage = 'Awaiting user action';
          break;
        case CodePush.SyncStatus.INSTALLING_UPDATE:
          //* 8 正在安装
          this.syncMessage = 'Installing update';
          break;
        case CodePush.SyncStatus.UP_TO_DATE:
          //* 0 已经是最新版
          this.syncMessage = 'App up to date.';
          break;
        case CodePush.SyncStatus.UPDATE_IGNORED:
          //* 2 忽略更新
          this.syncMessage = 'Update cancelled by user';
          break;
        case CodePush.SyncStatus.UPDATE_INSTALLED:
          //* 1 更新安装成功
          this.syncMessage = 'Update installed and will be applied on restart.';
          this.showAlert(I18n.t('HotUpdate.InstallationSucc'));
          break;
        case CodePush.SyncStatus.UNKNOWN_ERROR:
          //* 3 更新出错
          this.syncMessage = 'An unknown error occurred';
          // Toast.showError('更新出错，请重启应用！');
          this.setState({ immediateUpdate: false, isReload: true });
          console.log('An unknown error occurred');
          break;
      }
    }
  }

  codePushDownloadDidProgress(progress) {
    const { actions } = this.props;
    //* 下载进度数据
    //* receivedBytes => 当前下载安装包大小
    //* totalBytes => 安装包总大小
    if (this.state.immediateUpdate) {
      this.currProgress = parseFloat(progress.receivedBytes / progress.totalBytes).toFixed(2);
      this.setState({
        progressNum: this.currProgress,
      });
      if (this.currProgress >= 1) {
        this.setState({ modalVisible: false });
        this.checkingResponses = false;
        actions.clearDeviceVersion();
      } else {
        this.refs.progressBar.progress = this.currProgress;
      }
    }
  }

  syncImmediate() {
    const { versionInfo }: { versionInfo: versionInfoType } = this.props;
    const { update_description = '', update_type } = versionInfo;
    let descArry = update_description.split('/');

    if (update_type == 0) {
      //* 热更新
      CodePush.checkForUpdate()
        .then((update) => {
          console.log(update, 'update=====>');

          if (isCloseUpdate) {
            // * 如果关闭更新功能描述从update中取
            const descStr = _.get(update, 'description', '');
            descArry = descStr.split('/');
            this.setState({
              defaultAppVersion: descArry[0],
            });
            if (descArry.length > 0) {
              descArry.shift();
            }
          }

          if (update) {
            this.setState({
              modalVisible: true,
              description: descArry,
            });
          }
        })
        .catch((err) => {
          console.log(err, 'err========>');
          toastDefault('检查热更新版本失败');
        });
    } else if (update_type == 1) {
      //* 安装包更新
      this.setState({
        modalVisible: true,
        description: descArry,
      });
    }
  }

  componentWillMount() {
    CodePush.disallowRestart(); // 不允许重启app
  }

  componentDidMount() {
    CodePush.allowRestart(); // 允许重启app
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.error != nextProps.error && nextProps.error) {
      toastDefault('检查更新失败');
    }
  }

  checkUpdateBeforeRender() {
    const { success, needUpdate } = this.props;
    if (needUpdate && success && !this.checkingResponses && !__DEV__) {
      this.checkingResponses = true;
      this.syncImmediate();
    }
  }

  _immediateUpdate() {
    const { versionInfo } = this.props;
    const { update_type } = versionInfo;
    if (update_type == 0) {
      this.setState({ immediateUpdate: true, isReload: false });
      CodePush.changeDownloadMark(); //* 修改源码，在检查的时候可以下载安装包
      CodePush.sync(
        {
          updateDialog: null,
          installMode: CodePush.InstallMode.IMMEDIATE,
        },
        this.codePushStatusDidChange.bind(this),
        this.codePushDownloadDidProgress.bind(this),
      );
    } else if (update_type == 1) {
      const uoloadUrl =
        themes.platform === 'ios'
          ? _.get(versionInfo, 'ios_download_link')
          : _.get(versionInfo, 'android_download_link');

      if (uoloadUrl) {
        Linking.openURL(uoloadUrl);
      }
    }
  }

  //* 取消更新
  closeHotUpdate = () => {
    const { actions } = this.props;
    this.setState(
      {
        immediateUpdate: false,
        modalVisible: false,
        isReload: false,
        isOverTime: false,
      },
      () => {
        actions.clearDeviceVersion();
        this.checkingResponses = false;
      },
    );
  };

  // * 重新加载
  againHotUpdate = () => {
    const { actions } = this.props;
    this.setState(
      {
        immediateUpdate: false,
        modalVisible: false,
        isReload: false,
        isOverTime: false,
      },
      () => {
        actions.clearDeviceVersion();
        this.checkingResponses = false;
        actions.updateDeviceVersion();
      },
    );
  };

  //* 重试
  renderUpdateErrorView = () => {
    const { actions, versionInfo } = this.props;
    const { isOverTime } = this.state;
    const is_force_update = _.get(versionInfo, 'is_force_update', false);
    const tipString = isOverTime
      ? I18n.t('HotUpdate.Tip.Timeout')
      : I18n.t('HotUpdate.Tip.InstallFail');
    if (is_force_update) {
      return (
        <View>
          <View
            style={{
              backgroundColor: '#FFF',
              paddingTop: 20,
              borderRadius: 8,
            }}
          >
            <View style={{ alignItems: 'center', marginVertical: 20 }}>
              <Text style={{ fontSize: 14, color: '#333' }}>{tipString}</Text>
            </View>
            <View style={styles.clickBtnWrap}>
              <TouchableOpacity style={styles.clickBtn} onPress={() => this.againHotUpdate()}>
                <View style={styles.clickTextView}>
                  <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#fff' }}>
                    {I18n.t('HotUpdate.Reload')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    } else {
      return (
        <View>
          <View
            style={{
              backgroundColor: '#FFF',
              paddingTop: 20,
              borderRadius: 8,
            }}
          >
            <View style={{ alignItems: 'center', marginVertical: 20 }}>
              <Text style={{ fontSize: 14, color: '#333' }}>{tipString}</Text>
            </View>
            <View style={[styles.clickBtnWrap, { justifyContent: 'center' }]}>
              <TouchableOpacity
                style={([styles.clickBtn], { width: 150 })}
                onPress={() => this.closeHotUpdate()}
              >
                <View style={[styles.clickTextView, { marginVertical: 5, marginLeft: 10 }]}>
                  <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#fff' }}>
                    {I18n.t('common_cancel')}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={([styles.clickBtn], { width: 150 })}
                onPress={() => this.againHotUpdate()}
              >
                <View style={[styles.clickTextView, { marginVertical: 5, marginRight: 10 }]}>
                  <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#fff' }}>
                    {I18n.t('HotUpdate.Reload')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }
  };

  //* 更新modal
  renderUpdateDeviceView = () => {
    const { versionInfo } = this.props;
    const { description, immediateUpdate, progressNum, defaultAppVersion } = this.state;
    const app_version = _.get(versionInfo, 'app_version', defaultAppVersion);
    const is_force_update = _.get(versionInfo, 'is_force_update', false);
    if (!immediateUpdate) {
      return (
        <View>
          {/* 是否显示更新提示弹窗 */}
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 8,
            }}
          >
            <View style={{ marginHorizontal: 15 }}>
              <Text
                style={{
                  marginTop: 20,
                  fontWeight: 'bold',
                  color: '#333',
                }}
              >
                {`${I18n.t('HotUpdate.FoundNewVersion')} ${app_version}`}
              </Text>
              {!_.isEmpty(description) ? (
                <View>
                  <Text
                    style={{
                      marginVertical: 20,
                      fontWeight: 'bold',
                      color: '#333',
                    }}
                  >
                    {I18n.t('HotUpdate.UpdatedContent')}
                  </Text>
                  {_.map(description, (item, index) => (
                    <Text key={`hot-desc-${index}`} style={{ lineHeight: 20, color: '#333' }}>
                      {item}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>

            {is_force_update ? (
              <View style={[styles.clickBtnWrap, { alignItems: 'center' }]}>
                <TouchableOpacity
                  style={([styles.clickBtn], { width: themes.deviceWidth - 60 })}
                  onPress={() => this._immediateUpdate()}
                >
                  <View style={styles.clickTextView}>
                    <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#fff' }}>
                      {I18n.t('HotUpdate.UpdateNow')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.clickBtnWrap, { justifyContent: 'center' }]}>
                <TouchableOpacity
                  style={([styles.clickBtn], { width: 150 })}
                  onPress={() => this.closeHotUpdate()}
                >
                  <View style={[styles.clickTextView, { marginVertical: 5, marginLeft: 10 }]}>
                    <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#fff' }}>
                      {I18n.t('common_cancel')}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={([styles.clickBtn], { width: 150 })}
                  onPress={() => this._immediateUpdate()}
                >
                  <View style={[styles.clickTextView, { marginVertical: 5, marginRight: 10 }]}>
                    <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#fff' }}>
                      {I18n.t('HotUpdate.UpdateNow')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      );
    } else {
      return (
        <View>
          {/* 是否显示下载进度条 */}
          <View
            style={{
              backgroundColor: '#FFF',
              paddingVertical: 20,
              borderRadius: 8,
            }}
          >
            <View style={{ alignItems: 'center', marginVertical: 20 }}>
              <Text style={{ fontSize: 14, color: '#333' }}>
                {I18n.t('HotUpdate.WaitUpdating')}
              </Text>
            </View>
            <View style={{ alignItems: 'center', marginVertical: 10 }}>
              <Text>{`${parseFloat(+progressNum * 100).toFixed()}%`}</Text>
            </View>
            <ProgressBar
              ref="progressBar"
              progressColor="#3385ff"
              style={{
                marginTop: 20,
                height: 10,
                width: themes.deviceWidth - 140,
                backgroundColor: 'rgba(220, 220, 220, 0.5)',
                borderRadius: 10,
              }}
            />
          </View>
        </View>
      );
    }
  };

  renderModal() {
    const { isOverTime } = this.state;
    return (
      <View>
        <Modal animationType="none" transparent visible={this.state.modalVisible}>
          <View style={themes.modal}>
            <View style={styles.modalContainer}>
              {/* {this.renderOverTimeErrorView()} */}
              {this.state.isReload || isOverTime
                ? this.renderUpdateErrorView()
                : this.renderUpdateDeviceView()}
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  render() {
    this.checkUpdateBeforeRender();
    return <View>{this.renderModal()}</View>;
  }
}

const select = (state) => ({
  loading: state.versionInfo.loading,
  error: state.versionInfo.error,
  success: state.versionInfo.success,
  needUpdate: state.versionInfo.needUpdate,
  versionInfo: state.versionInfo.data,
});

const act = (dispatch) => ({
  actions: bindActionCreators({ updateDeviceVersion, clearDeviceVersion }, dispatch),
  dispatch,
});

export default connect(select, act)(HotUpdate);

const styles = StyleSheet.create({
  modalContainer: {
    marginHorizontal: 60,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  clickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    width: themes.deviceWidth - 60,
    height: 50,
    // justifyContent: 'center',
  },
  clickBtnWrap: {
    // backgroundColor: '#FFF',
    flexDirection: 'row',
    height: 50,
    marginTop: 20,
    borderTopColor: '#ccc',
    borderTopWidth: 1,
    width: themes.deviceWidth - 60,
  },
  clickTextView: {
    backgroundColor: '#3385ff',
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    marginHorizontal: 40,
    marginVertical: 5,
  },
});
