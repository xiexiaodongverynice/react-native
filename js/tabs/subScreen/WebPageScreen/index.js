/**
 * Created by yjgao
 * @flow
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Header, Left, Right, Body, Title, Icon, Button } from 'native-base';
import Orientation from 'react-native-orientation';
import _ from 'lodash';
import FcWebView from '../../../lib/FcWebView';
import { getBestRouteForPoints } from '../../common/helpers/locationHelper';

import themes from '../../common/theme';
import { StyledHeader } from '../../common/components';

type Props = {
  navigation: {
    goBack: () => void,
  },
};

export default class WebPageScreen extends React.Component<Props, any> {
  componentDidMount() {
    // Orientation.unlockAllOrientations();
    // Orientation.addOrientationListener(this._orientationDidChange);
  }

  componentWillUnmount() {
    // Orientation.lockToPortrait();
    // Orientation.removeOrientationListener(this._orientationDidChange);
  }

  bootStrapJs = () => {
    const data = {
      start: {
        lat: 28.559,
        long: 115.899,
      },
      end: {
        lat: 28.199,
        long: 115.897,
      },
      waypoints: [
        {
          lat: 28.691,
          long: 115.899,
        },
        {
          lat: 28.699,
          long: 115.897,
        },
        {
          lat: 28.678,
          long: 115.919,
        },
        {
          lat: 28.687,
          long: 115.955,
        },
        {
          lat: 28.7,
          long: 115.867,
        },
        {
          lat: 28.671,
          long: 115.914,
        },
        {
          lat: 28.79,
          long: 115.865,
        },
        {
          lat: 28.658,
          long: 115.997,
        },
        {
          lat: 28.686,
          long: 115.834,
        },
      ],
    };
    let waypointsStr = '';
    data.waypoints.forEach((way, index) => {
      if (index === data.waypoints.length - 1) {
        waypointsStr += `${way.lat},${way.long}`;
      } else {
        waypointsStr += `${way.lat},${way.long}|`;
      }
    });

    // console.log('waypointsStr========>', waypointsStr);
    // const routes = await getBestRouteForPoints(
    //   data.start.lat + ',' + data.start.long,
    //   data.end.lat + ',' + data.end.long,
    //   waypointsStr,
    // );

    // console.log('the best route of the points is=======>', routes);

    // 请求steps 然后根据每个step绘制出来路线
    return `init(${JSON.stringify(data)})`;
  };

  render() {
    const htmlPath = require('./index.html');
    const { navigation } = this.props;
    console.log(this.props);
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
            <Title style={{ color: themes.title_text_color }}>测试</Title>
          </Body>
          <Right />
        </StyledHeader>
        <FcWebView source={htmlPath} injectedJavaScript={this.bootStrapJs()} />
      </View>
    );
  }
}
