/**
 * @flow
 * for sub tab screen
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Left, Right, Body, Title, Icon, Button } from 'native-base';
import _ from 'lodash';
import { connect } from 'react-redux';
import QueryComposer from 'fc-common-lib/query-composer';
import { bindActionCreators } from 'redux';
import FcWebView from '../../lib/FcWebView';
import { clearQuery } from '../../actions/query';
import LoadingScreen from '../common/LoadingScreen';
import themes from '../common/theme';
import Linking from '../../utils/Linking';
import { executeDetailExp, joinParams, mapObject } from '../../utils/util';
import { StyledHeader } from '../common/components';
import { getSrc } from '../common/helpers/modalWidget';

type Props = {
  token: string,
  navigation: any,
  external_page_src: string,
  label: string,
  showBack: boolean,
  external_page_param: string,
};

type States = {
  loadingStatus: boolean,
  contentHeight: number,
  contentWidth: number,
};

type receivedMessageType = {
  action: 'resolvePage' | 'refreshList',
  data: {
    hashPath: string,
    fillPageRecord: Object, //* 传递给跳转页面的参数
  },
};

const CHECK_BAIDU_MAP = 'crmCheckForBaiduMap=';

export class WebViewScreen extends React.PureComponent<Props, States> {
  isExistBaiduMap = true;
  state = {
    loadingStatus: true,
  };

  async componentWillMount() {
    // * 兼容postMessage
    const patchPostMessageFunction = () => {
      const originalPostMessage = window.postMessage;
      const patchedPostMessage = (message, targetOrigin, transfer) => {
        originalPostMessage(message, targetOrigin, transfer);
      };
      patchedPostMessage.toString = () =>
        String(Object.hasOwnProperty).replace('hasOwnProperty', 'postMessage');

      window.postMessage = patchedPostMessage;
    };
    this.patchPostMessageJsCode = '(' + String(patchPostMessageFunction) + ')();';

    // * 判断是否有百度地图app
    this.isExistBaiduMapApp();
  }

  isExistBaiduMapApp = async () => {
    const { external_page_param } = this.props;

    if (!external_page_param) {
      this.setState({ loadingStatus: false });
      return;
    }

    const array = external_page_param.split('\n');
    if (!_.isEmpty(array)) {
      if (!_.includes(array, CHECK_BAIDU_MAP)) {
        this.setState({ loadingStatus: false });
        return;
      }

      try {
        this.isExistBaiduMap = await Linking.checkForBaiduMap();
      } catch (e) {
        console.warn('【checkForBaiduMap】error message', e);
      }

      this.setState({ loadingStatus: false });
    } else {
      this.setState({ loadingStatus: false });
    }
  };

  /**
   * from text area which is divided by '\n'
   * TODO: waiting for test
   */
  joinParamsFromProps = (paramStr: string): string => {
    const { token } = this.props;

    const parseMatched = (matched) => {
      switch (matched) {
        case 'token':
          return token;
        case 'fc_token':
          return token;
        case 'fc_territoryId':
          return global.CURRENT_ACTIVE_TERRITORY;
        case [CHECK_BAIDU_MAP]:
          return this.isExistBaiduMap;
        default:
          return (function() {
            // 需要兼容 web 的内容均采用 if else 来写。
            if (/user\./.test(matched)) {
              return _.get({ user: fc_getCurrentUserInfo() }, matched, '');
            } else {
              return executeDetailExp(matched);
            }
          })();
      }
    };

    return '?' + QueryComposer.fromString(paramStr, parseMatched);
  };

  /**
   * params could be: [{name: xxx, value: xxx, type: xxx}, ...] which is from json config
   */
  joinParamsFromNavigation = (params: Array<Object>): string => {
    if (_.isEmpty(params)) return '';

    return '?' + QueryComposer.fromObjectArray(params, executeDetailExp);
  };

  getQueryStringObj = (url) => {
    const args = {};
    if (url) {
      const qs = url.substring(url.lastIndexOf('?') + 1);
      const items = qs.length > 0 ? qs.split('&') : [];
      let item = null;
      let name = null;
      let value = null;
      _.map(items, (ite, index) => {
        item = ite.split('=');
        name = decodeURIComponent(item[0]);
        value = decodeURIComponent(item[1]);

        if (name.length) {
          args[name] = value;
        }
      });
    }

    return args;
  };

  getQueryStringArr = (url) => {
    const qs = url.substring(0, url.lastIndexOf('?'));
    const items = qs.length > 0 ? qs.split('/') : [];
    return items;
  };

  receivedMessage = (event) => {
    const { navigation } = this.props;
    const navParam = _.get(navigation, 'state.params.navParam');
    const callback = _.get(navParam, 'callback');
    const receivedData = _.get(event.nativeEvent, 'data', '{}');
    const receivedMessageData: receivedMessageType = JSON.parse(receivedData);

    if (
      !_.isEmpty(receivedMessageData) &&
      receivedMessageData.action &&
      _.get(receivedMessageData, 'data.hashPath', '')
    ) {
      const urlRrrData = this.getQueryStringArr(receivedMessageData.data.hashPath);
      const urlObjData = this.getQueryStringObj(receivedMessageData.data.hashPath);
      const fillPageRecord = _.get(receivedMessageData, 'data.fillPageRecord', {});

      const RecordType = _.get(urlObjData, 'recordType');
      const jumpPath = urlRrrData.pop();
      let params = {};
      const widgetAction = _.get(receivedMessageData, 'action');

      switch (widgetAction) {
        case 'refreshList':
          //目前支持列表刷新
          navigation.goBack();
          callback && callback();
          break;
        case 'resolvePage':
          if (jumpPath) {
            switch (jumpPath) {
              case 'add_page':
                params = {
                  refObjectApiName: urlRrrData[urlRrrData.length - 1],
                  targetRecordType: RecordType,
                  initData: fillPageRecord,
                };
                navigation.navigate('Create', { navParam: params });
                break;
              case 'edit_page':
                params = {
                  objectApiName: urlRrrData[urlRrrData.length - 2],
                  id: urlRrrData[urlRrrData.length - 1],
                  record_type: RecordType,
                };

                navigation.navigate('Edit', { navParam: params });
                break;
              case 'detail_page':
                params = {
                  objectApiName: urlRrrData[urlRrrData.length - 2],
                  id: urlRrrData[urlRrrData.length - 1],
                  record_type: RecordType,
                };
                navigation.navigate('Detail', { navParam: params });
                break;
              case 'modal_widget':
                // 需要在 postMessage 的数据中的 data 字段中添加如下几个字段。为了避免与以上逻辑冲突，取别名 p
                const { src, params: p, thizRecord, label = '' } = receivedMessageData.data;
                navigation.navigate('WebView', {
                  navParam: {
                    label,
                    external_page_src: `${getSrc(src)}?${joinParams(mapObject(p, { thizRecord }))}`,
                    showBack: true,
                  },
                });
                break;
              case 'attachment':
                const { attachmentData } = receivedMessageData.data;
                navigation.navigate('AttachmentView', {
                  data: attachmentData,
                  pageType: 'detail',
                });
                break;
              default:
                console.warn('模式窗口未知动作', `jumpPath:${jumpPath}`);
                break;
            }
          }
          break;
        default:
          console.warn('模式窗口未知动作', `widgetAction:${widgetAction}`);
          break;
      }
    }
  };

  /**
   * 此处完全隔离侧边栏菜单和 MODAL_WIDGET Action 配置。
   * 并且将 external_page_src 外部链接认为是区分数据来源的唯一标记
   */
  deriveDataFromProps = () => {
    const {
      label = '',
      external_page_src,
      showBack = false,
      external_page_param,
      navigation = {},
    } = this.props;

    const navParams = _.get(navigation, 'state.params.navParam');

    return _.get(navParams, 'external_page_src')
      ? {
          label: _.get(navParams, 'label', ''),
          showBack: _.get(navParams, 'showBack', true),
          mediaUrl:
            _.get(navParams, 'external_page_src') +
            this.joinParamsFromNavigation(_.get(navParams, 'external_page_param')),
        }
      : {
          label,
          showBack,
          mediaUrl: external_page_src + this.joinParamsFromProps(external_page_param),
        };
  };

  render() {
    const { loadingStatus, contentHeight, contentWidth } = this.state;
    const { navigation } = this.props;
    const { showBack, mediaUrl, label } = this.deriveDataFromProps();
    /**
     * 是否显示返回按钮，默认不显示
     */
    const title = label;
    if (!mediaUrl || loadingStatus) {
      return <LoadingScreen />;
    }

    const htmlPath = mediaUrl;

    return (
      <View style={{ flex: 1 }}>
        <StyledHeader>
          <Left style={{ flex: 1 }}>
            {showBack ? (
              <Button transparent onPress={() => navigation.goBack()}>
                <Icon
                  name="ios-arrow-back"
                  style={{
                    color: themes.title_icon_color,
                    fontSize: themes.font_header_size,
                  }}
                />
              </Button>
            ) : (
              <Button transparent onPress={() => navigation.navigate('DrawerOpen')}>
                <Icon name="menu" style={styles.icon} />
              </Button>
            )}
          </Left>
          <Body style={{ flex: 1, alignItems: 'center' }}>
            <Title style={{ color: themes.title_text_color }}>{title}</Title>
          </Body>
          <Right />
        </StyledHeader>
        <FcWebView
          useWebKit
          injectedJavaScript={this.patchPostMessageJsCode}
          mixedContentMode="always"
          renderError={() => {}}
          source={{ uri: htmlPath }}
          onMessage={this.receivedMessage}
        />
      </View>
    );
  }
}

const select = (state) => ({
  token: state.settings.token,
  objectDescription: state.settings.objectDescription,
  permission: state.settings.permission,
});

const act = (dispatch, { navigation }) => {
  const key = _.get(navigation, 'state.key');
  return {
    actions: bindActionCreators(
      {
        clearQuery: clearQuery(key),
      },
      dispatch,
    ),
  };
};

export default connect(select, act)(WebViewScreen);

const styles = StyleSheet.create({
  icon: {
    color: themes.title_icon_color,
    fontSize: themes.font_header_size,
  },
});
