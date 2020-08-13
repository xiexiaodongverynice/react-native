/**
 * * SignInLiteFormItem 扩展
 * * 基础签到功能
 * @flow
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ListItem } from 'native-base';
import moment from 'moment';
import _ from 'lodash';
import { StyledBody, StyledLeft, RequiredTextView } from '../../../tabs/common/components';
import createField from '../../../tabs/common/createField';
import themes from '../../../tabs/common/theme';

type Prop = {
  form: any,
  navigation: any,
  extenderName: string,
  parentRecord: any,
  pageType: string,
  formItemRequired: boolean,
  handleCreate: (param: any) => void,
  createRecord: any,
  field_section: any,
};

type State = { address?: string };

function SignInButton({
  address,
  handlePress,
  callback,
  onChange = () => {},
  validateFail,
}: {
  address: string,
  handlePress: (onChange: (val: any) => void) => void,
  callback: (val: any) => void,
  onChange: (val: any) => void,
  validateFail: boolean,
}) {
  if (validateFail) {
    this.textColor = themes.input_color_require;
  } else if (!address) {
    this.textColor = themes.input_placeholder;
  } else {
    this.textColor = themes.input_color;
  }

  return (
    <TouchableOpacity
      style={{
        height: 30,
        justifyContent: 'center',
      }}
      transparent
      onPress={() => handlePress(onChange)}
    >
      <Text numberOfLines={1} style={{ textAlign: 'right', color: this.textColor }}>
        {address || '请选择'}
      </Text>
    </TouchableOpacity>
  );
}

export default class SignInForm extends React.PureComponent<Prop, State> {
  state: { address: '' };

  handleSignInData = (onChange: (val: any) => void) => (geoData: any) => {
    const { handleCreate } = this.props;
    const address =
      (_.get(geoData, 'address') !== ' ' && _.get(geoData, 'address')) || _.get(geoData, 'name');

    this.setState(() => ({
      address,
    }));

    onChange(address);
    handleCreate &&
      handleCreate({
        apiName: 'geo',
        selected: [
          {
            value: {
              sign_in_location: address,
              latitude: _.get(geoData, 'latitude'),
              longitude: _.get(geoData, 'longitude'),
              mapType: 'baidu',
              sign_in_time: _.get(geoData, 'time'),
            },
          },
        ],
        multipleSelect: false,
      });
  };

  handleArrive = (onChange: (val: any) => void) => {
    const { navigation, pageType, parentRecord, createRecord, field_section } = this.props;

    if (pageType === 'detail') {
      return;
    }

    const validLocation = _.get(field_section, 'valid_location', true);

    navigation.navigate('Map', {
      callback: this.handleSignInData(onChange),
      parentData: _.assign({}, parentRecord, createRecord),
      validLocation,
    });
  };

  renderContent = () => {
    const { parentRecord, pageType, extenderName, formItemRequired = false, form } = this.props;

    const propAddress = _.get(parentRecord, 'sign_in_location');
    const currentAddress = _.get(this.state, 'address') || propAddress;

    if (pageType === 'detail') {
      return (
        <View style={{ textAlign: 'right' }}>
          <Text>{propAddress}</Text>
        </View>
      );
    } else {
      return createField(
        {
          name: extenderName,
          validOptions: {
            rules: [
              {
                required: formItemRequired,
                message: 'signin form is required',
              },
            ],
            initialValue: currentAddress,
          },
        },
        form,
      )(<SignInButton handlePress={this.handleArrive} address={currentAddress} />);
    }
  };

  renderTime = () => {
    const { parentRecord, pageType } = this.props;
    const sign_in_time = _.get(parentRecord, 'sign_in_time');
    if (pageType === 'detail' && sign_in_time) {
      return this.renderItem('签到时间', moment(sign_in_time).format('YYYY-MM-DD HH:mm'));
    } else {
      return null;
    }
  };

  renderDeviation = () => {
    const { parentRecord, pageType } = this.props;
    const sign_in_deviation = _.get(parentRecord, 'sign_in_deviation');
    if (pageType === 'detail' && sign_in_deviation) {
      return this.renderItem('偏差距离', `${parseInt(sign_in_deviation)}米`);
    } else {
      return null;
    }
  };

  renderItem = (title, data, required = false, disabled = false) => (
    <ListItem>
      <StyledLeft>
        <RequiredTextView disabled={disabled} isRequired={required} title={title} />
      </StyledLeft>
      <StyledBody style={{ justifyContent: 'flex-end' }}>
        <View style={{ textAlign: 'right' }}>
          <Text>{data}</Text>
        </View>
      </StyledBody>
    </ListItem>
  );

  render() {
    const { formItemRequired = false } = this.props;

    // const propAddress = _.get(parentRecord, 'sign_in_location');
    // const currentAddress = _.get(this.state, 'address') || propAddress;

    return (
      <View>
        <ListItem>
          <StyledLeft>
            <RequiredTextView disabled={false} isRequired={formItemRequired} title="签到位置" />
          </StyledLeft>
          <StyledBody style={{ justifyContent: 'flex-end' }}>{this.renderContent()}</StyledBody>
        </ListItem>
        {this.renderTime()}
        {this.renderDeviation()}
      </View>
    );
  }
}
