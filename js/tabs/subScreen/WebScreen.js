/**
 * Created by Uncle Charlie, 2018/03/09
 * only play local media files.
 * @flow
 */

import React from 'react';
import { View, Platform, StatusBar } from 'react-native';
import Orientation from 'react-native-orientation';
import { Left, Right, Body, Title, Icon, Button } from 'native-base';
import _ from 'lodash';
import FcWebView from '../../lib/FcWebView';
import LoadingScreen from '../common/LoadingScreen';
import themes from '../common/theme';
import I18n from '../../i18n';
import { StyledHeader } from '../common/components';

const platform = Platform.OS;
const ORIENTATION_PORTRAIT = 'PORTRAIT';
const ORIENTATION_LANDSCAPE = 'LANDSCAPE';

type Prop = {
  navigation: any,
};

export default class WebScreen extends React.Component<Prop> {
  state = {
    headerVisible: true,
  };
  rotateActived = false;

  componentWillUnmount() {
    const needRotate = _.get(this.props.navigation, 'state.params.needRotate');
    if (needRotate && this.rotateActived) {
      Orientation.lockToPortrait();
      Orientation.removeOrientationListener(this._orientationDidChange);
      this.didBlurSubscription && this.didBlurSubscription.remove();
    }
  }

  onLoadEnd = () => {
    const needRotate = _.get(this.props.navigation, 'state.params.needRotate');
    if (needRotate) {
      this.rotateActived = true;
      Orientation.unlockAllOrientations();
      Orientation.addOrientationListener(this._orientationDidChange);
      this.didBlurSubscription = this.props.navigation.addListener(
        'didBlur',
        Orientation.lockToPortrait,
      );
    }
  };

  _orientationDidChange = (res) => {
    this.setState({
      headerVisible: res === ORIENTATION_PORTRAIT,
    });
  };

  // AddCall() {
  //   const { navigation } = this.props;
  //   const displayLocal = _.get(navigation, 'state.params.displayLocal'); // https://survey.crmpower.cn/f/zWofHM
  //   const mediaUrl = _.get(navigation, 'state.params.mediaUrl');
  //   const param = _.get(navigation, 'state.params.params');

  //   const params = {
  //     navParam: {
  //       refObjectApiName: 'call',
  //       targetRecordType: 'report',
  //     },
  //     clmParams: param,
  //   };

  //   navigation.navigate('Create', params);
  // }

  renderHeader = () => {
    const { headerVisible } = this.state;

    if (!this.header) {
      const { navigation } = this.props;
      this.header = (
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
            <Title style={{ color: themes.title_text_color }}>{I18n.t('detail')}</Title>
          </Body>
          <Right />
        </StyledHeader>
      );
    }

    return headerVisible ? this.header : null;
  };

  render() {
    const { navigation } = this.props;
    const { headerVisible } = this.state;

    const displayLocal = _.get(navigation, 'state.params.displayLocal'); // https://survey.crmpower.cn/f/zWofHM
    const mediaUrl = _.get(navigation, 'state.params.mediaUrl');
    // const params = _.get(navigation, 'state.params.params');
    const baseUrl = _.get(navigation, 'state.params.baseUrl');
    if (!mediaUrl) {
      return <LoadingScreen />;
    }
    const fileUrl = `file://${mediaUrl}`;
    const htmlPath =
      displayLocal === 'local'
        ? platform === 'ios'
          ? mediaUrl
          : fileUrl
        : baseUrl
        ? baseUrl + mediaUrl
        : mediaUrl;

    return (
      <View style={{ flex: 1 }}>
        {Platform.OS === 'android' ? <StatusBar hidden={!headerVisible} /> : null}
        {this.renderHeader()}
        <FcWebView
          useWebKit
          allowFileAccess
          originWhitelist={['*']}
          onLoadEnd={this.onLoadEnd}
          mediaPlaybackRequiresUserAction={false}
          source={{ uri: htmlPath }}
        />
      </View>
    );
  }
}
