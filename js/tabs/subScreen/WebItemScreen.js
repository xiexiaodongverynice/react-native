/**
 * @flow
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Header, Left, Right, Body, Title, Icon, Button } from 'native-base';
import _ from 'lodash';
import { connect } from 'react-redux';
import LoadingScreen from '../common/LoadingScreen';
import FcWebView from '../../lib/FcWebView';
import themes from '../common/theme';
import { executeDetailExp } from '../../utils/util';
import { StyledHeader } from '../common/components';

class WebItemScreen extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    const { navigation } = props;
    const messageData = _.get(navigation, 'state.params', {});
    const params = _.get(messageData, 'options.params', []);
    const title = _.get(messageData, 'options.title', '');
    const url = _.get(messageData, 'options.src');
    this.state = {
      messageData,
      params,
      title,
      url,
    };
  }

  receivedMessage = (event) => {
    const { navigation } = this.props;
    const callback = _.get(navigation, 'state.params.callback');
    const receivedData = _.get(event.nativeEvent, 'data', '{}');
    const receivedMessageData = JSON.parse(receivedData);
    console.log('receivedMessageData===>', receivedMessageData);
    if (!_.isEmpty(receivedMessageData) && _.isFunction(callback)) {
      callback(receivedMessageData);
      navigation.goBack();
    }
  };

  joinParamsUrl = (params) => {
    if (_.isEmpty(params)) return '';

    let paramStr = '?';
    const paramKeyArr = Object.keys(params);
    _.each(paramKeyArr, (key) => {
      const expression = _.get(params, `${key}.expression`, 'return false ');
      const jointStr = `${key}=${executeDetailExp(expression)}&`;
      paramStr += jointStr;
    });
    return paramStr;
  };

  getUrl = () => {
    const { messageData, url, params } = this.state;
    if (!url) return false;

    if (_.isEmpty(params)) {
      return url;
    } else {
      const parmsStr = this.joinParamsUrl(params);
      return url + parmsStr;
    }
  };

  render() {
    const { navigation } = this.props;
    const { title, messageData } = this.state;

    const mediaUrl = this.getUrl();
    if (!mediaUrl) {
      return <LoadingScreen />;
    }
    console.log('mediaUrl===>', mediaUrl);
    const params = JSON.stringify({
      record_data: _.get(messageData, 'value', []),
      data_source: _.get(messageData, 'data_source', {}),
      render_type: _.get(messageData, 'render_type', 'select_one'),
      token: global.FC_CRM_TOKEN,
    });

    const patchPostMessageFunction = (res) => {
      const originalPostMessage = window.postMessage;

      const patchedPostMessage = (message, targetOrigin, transfer) => {
        originalPostMessage(message, targetOrigin, transfer);
      };

      patchedPostMessage.toString = () => {
        return String(Object.hasOwnProperty).replace('hasOwnProperty', 'postMessage');
      };
      window.postMessage = patchedPostMessage;
      window.crmData = res;
    };

    this.patchPostMessageJsCode = '(' + String(patchPostMessageFunction) + `)(${params});`;

    return (
      <View style={{ flex: 1 }}>
        <StyledHeader>
          <Left style={{ flex: 1 }}>
            <Button transparent onPress={() => navigation.goBack()}>
              <Icon
                name="ios-arrow-back"
                style={{
                  color: themes.title_icon_color,
                  fontSize: themes.font_header_size,
                }}
              />
            </Button>
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
          startInLoadingState
          source={{ uri: mediaUrl }}
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

export default connect(select)(WebItemScreen);

const styles = StyleSheet.create({
  icon: {
    color: themes.title_icon_color,
    fontSize: themes.font_header_size,
  },
});
