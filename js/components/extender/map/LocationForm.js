/**
 * * GeographicalLocationFormItem 扩展
 * * 用于详情页显示地理位置
 * @flow
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ListItem } from 'native-base';
import _ from 'lodash';
import { StyledBody, StyledLeft, RequiredTextView } from '../../../tabs/common/components';
import detailScreen_styles from '../../../styles/detailScreen_styles';

type Props = {
  navigation: any,
  parentRecord: {
    longitude: string,
    latitude: string,
  },
};

type States = {
  existLocation: boolean,
};

export default class LocationForm extends React.PureComponent<Props, States> {
  latitude: string;
  longitude: string;

  constructor(props: Props) {
    super(props);

    this.latitude = _.get(props, 'parentRecord.latitude', '');
    this.longitude = _.get(props, 'parentRecord.longitude', '');

    this.state = {
      existLocation: !_.isNaN(_.toNumber(this.longitude)) && !_.isNaN(_.toNumber(this.latitude)),
    };
  }

  toMapScreen = () => {
    const { existLocation } = this.state;
    const { navigation } = this.props;
    if (!existLocation) return;
    navigation.navigate('Map', {
      longitude: this.longitude,
      latitude: this.latitude,
      type: 'lookup',
    });
  };

  render() {
    const { existLocation } = this.state;

    return (
      <View style={{ backgroundColor: 'white' }}>
        <ListItem noBorder>
          <StyledLeft>
            <Text style={detailScreen_styles.leftTextStyle}>地理位置</Text>
          </StyledLeft>
          <StyledBody style={{ justifyContent: 'flex-end' }}>
            <TouchableOpacity
              style={{
                height: 30,
                justifyContent: 'center',
              }}
              transparent
              onPress={this.toMapScreen}
            >
              <Text
                numberOfLines={1}
                style={[{ textAlign: 'right' }, detailScreen_styles.rightTextStyle]}
              >
                {existLocation ? '点击查看' : '地理位置异常'}
              </Text>
            </TouchableOpacity>
          </StyledBody>
        </ListItem>
      </View>
    );
  }
}
