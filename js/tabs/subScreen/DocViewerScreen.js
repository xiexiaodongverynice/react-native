/**
 * Created by Uncle Charlie, 2018/03/09
 * @flow
 */

import React from 'react';
import { View, Platform } from 'react-native';
import { Header, Left, Right, Body, Title, Icon, Button } from 'native-base';
import Orientation from 'react-native-orientation';
import _ from 'lodash';

import FcWebView from '../../lib/FcWebView';
import LoadingScreen from '../common/LoadingScreen';
import themes from '../common/theme';
import I18n from '../../i18n';
import { StyledHeader } from '../common/components';

const platform = Platform.OS;

type Props = {
  navigation: {
    navigate: (string, Object) => void,
    goBack: () => void,
  },
};
export default class DocViewerScreen extends React.Component<Props, any> {
  componentDidMount() {
    Orientation.unlockAllOrientations();
    // Orientation.addOrientationListener(this._orientationDidChange);
  }

  componentWillUnmount() {
    Orientation.lockToPortrait();
    // Orientation.removeOrientationListener(this._orientationDidChange);
  }

  AddCall() {
    const { navigation } = this.props;
    const param = _.get(navigation, 'state.params.params');

    const params = {
      navParam: {
        refObjectApiName: 'call',
        targetRecordType: 'report',
      },
      clmParams: param,
    };

    navigation.navigate('Create', params);
  }

  render() {
    const { navigation } = this.props;
    const displayLocal = _.get(navigation, 'state.params.displayLocal'); // https://survey.crmpower.cn/f/zWofHM
    const mediaUrl = _.get(navigation, 'state.params.mediaUrl');

    if (!mediaUrl) {
      return <LoadingScreen />;
    }

    const htmlPath =
      displayLocal === 'local' ? (platform === 'ios' ? mediaUrl : `file:///${mediaUrl}`) : mediaUrl;
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
            <Title style={{ color: themes.title_text_color }}>{I18n.t('detail')}</Title>
          </Body>
          <Right />
        </StyledHeader>
        <FcWebView source={{ uri: htmlPath }} />
      </View>
    );
  }
}
