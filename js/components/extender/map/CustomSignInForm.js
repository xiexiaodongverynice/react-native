/**
 * * CustomSignFormItem 扩展
 * * 复合功能签到扩展
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
import { SIGN_OUT_STATE, SIGN_IN_STATE } from '../../../utils/const';
import * as Utils from '../../../utils/util';
import { toastWaring } from '../../../utils/toast';
import IndexDataParser from '../../../services/dataParser';
import detailScreen_styles from '../../../styles/detailScreen_styles';

type Prop = {
  field_section: any,
  form: any,
  navigation: any,
  parentRecord: any,
  pageType: string,
  formItemRequired: boolean,
  handleCreate: (param: any) => void,
  createRecord: any,
  disabled: boolean,
  currentDesc: any,
};

type State = { address?: string, sign_type?: string };

function SignInButton({
  address,
  handlePress,
  disabled,
  onChange = () => {},
  validateFail,
  signType,
}: {
  address: string,
  handlePress: (onChange: (val: any) => void) => void,
  onChange: (val: any) => void,
  validateFail: boolean,
  signType: string,
  disabled: boolean,
}) {
  let textColor = themes.input_color;
  if (validateFail) {
    textColor = themes.input_color_require;
  } else if (disabled) {
    textColor = themes.input_disable_color;
  } else if (!address) {
    textColor = themes.input_placeholder;
  } else {
    textColor = themes.input_color;
  }

  return (
    <TouchableOpacity
      style={{
        height: 30,
        justifyContent: 'center',
      }}
      transparent
      onPress={() => {
        if (!disabled) {
          handlePress(onChange);
        }
      }}
    >
      <Text numberOfLines={1} style={{ textAlign: 'right', color: textColor }}>
        {(address && (signType === 'sign_in' ? '已签到' : '已签出')) || '请选择'}
      </Text>
    </TouchableOpacity>
  );
}

export default class CustomSignInForm extends React.PureComponent<Prop, State> {
  state = {
    address: '',
  };

  showItem = ['abnormal', 'time', 'photo'];
  sign_type = _.get(this.props.field_section, 'sign_type', 'sign_in');
  signField = this.sign_type === 'sign_in' ? SIGN_IN_STATE : SIGN_OUT_STATE;
  validLocation = _.get(this.props.field_section, 'validLocation', true);

  handleSignInData = (onChange: (val: any) => void) => (geoData: any, screenKey: string) => (
    photoData: any,
  ) => {
    const { handleCreate, navigation } = this.props;
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
              [this.signField.location]: address,
              [this.signField.latitude]: _.get(geoData, 'latitude'),
              [this.signField.longitude]: _.get(geoData, 'longitude'),
              mapType: 'baidu',
              [this.signField.photo]: photoData,
              [this.signField.time]: _.get(geoData, 'time'),
              [this.signField.extra]: _.get(geoData, 'extra', ''),
            },
          },
        ],
        multipleSelect: false,
      });
    navigation.goBack(screenKey);
  };

  //* 仅支持
  handleOnlySignIn = (onChange: () => void) => (geoData) => {
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
              [this.signField.location]: address,
              [this.signField.latitude]: _.get(geoData, 'latitude'),
              [this.signField.longitude]: _.get(geoData, 'longitude'),
              mapType: 'baidu',
              [this.signField.time]: _.get(geoData, 'time'),
              [this.signField.extra]: _.get(geoData, 'extra', ''),
            },
          },
        ],
        multipleSelect: false,
      });
  };

  vaildData = () => {
    const { field_section, createRecord, parentRecord } = this.props;
    const disable_expression = _.get(field_section, 'disable_expression');
    const mergeData = _.assign({}, createRecord, parentRecord);

    if (disable_expression) {
      return Utils.executeDetailExp(disable_expression, mergeData);
    }
    return false;
  };

  handleArrive = async (onChange: (val: any) => void) => {
    const {
      navigation,
      pageType,
      field_section,
      parentRecord,
      currentDesc,
      createRecord,
    } = this.props;
    const process = _.get(field_section, 'process');

    if (pageType === 'detail') {
      return;
    }

    const vaildStatus = this.vaildData();
    if (vaildStatus) {
      toastWaring(vaildStatus);
      return;
    }

    if (_.isArray(process) && process.includes('sign')) {
      navigation.navigate('Map', {
        callback: this.handleOnlySignIn(onChange),
        pageSize: 1,
        parentData: _.assign({}, createRecord, parentRecord),
        type: 'sign',
      });
    } else {
      const field = this.sign_type === 'sign_in' ? 'sign_in_photo' : 'sign_out_photo';
      const fieldDesc = IndexDataParser.parserFieldLabel(field, currentDesc);
      navigation.navigate('Map', {
        callback: this.handleSignInData(onChange),
        gotoPage: 'photo',
        pageType: 'add',
        fieldDesc,
        pageSize: 1,
        parentData: _.assign({}, createRecord, parentRecord),
        validLocation: this.validLocation,
      });
    }
  };

  handleToPhoto = (photos) => () => {
    const { navigation } = this.props;
    navigation.navigate('Photo', {
      token: global.FC_CRM_TOKEN,
      pageType: 'detail',
      photoList: photos,
    });
  };

  renderDetailList = () => {
    const { field_section } = this.props;
    if (!_.isEmpty(_.get(field_section, 'detail_show_item'))) {
      this.showItem = _.get(field_section, 'detail_show_item');
    }

    const renderlistItem = [];
    _.forEach(this.showItem, (value) => {
      if (value === 'abnormal') {
        const item = this.renderAbnormal(this.signField);
        if (!_.isEmpty(item)) {
          renderlistItem.push(item);
        }
      } else if (value === 'time') {
        const item = this.renderTime(this.signField);
        if (!_.isEmpty(item)) {
          renderlistItem.push(item);
        }
      } else if (value === 'location') {
        const item = this.renderLocation(this.signField);
        if (!_.isEmpty(item)) {
          renderlistItem.push(item);
        }
      } else if (value === 'photo') {
        const item = this.renderPhoto(this.signField);
        if (!_.isEmpty(item)) {
          renderlistItem.push(item);
        }
      } else if (value === 'deviation') {
        const item = this.renderDeviation(this.signField);
        if (!_.isEmpty(item)) {
          renderlistItem.push(item);
        }
      }
    });
    return renderlistItem;
  };

  renderDeviation = (signField) => {
    const { parentRecord } = this.props;
    if (_.toString(_.get(parentRecord, signField['deviation'], ''))) {
      const deviation = _.get(parentRecord, signField['deviation']);
      const leftText = this.sign_type === 'sign_in' ? '签到偏差距离' : '签出偏差距离';
      const rightText = deviation ? `${deviation}米` : '';
      return this.renderRow(leftText, rightText);
    } else {
      return null;
    }
  };

  renderRow = (leftText, rightText) => {
    return (
      <ListItem noBorder>
        <StyledLeft>
          <Text style={detailScreen_styles.leftTextStyle}>{leftText}</Text>
        </StyledLeft>
        <StyledBody style={{ justifyContent: 'flex-end' }}>
          <View style={{ textAlign: 'right' }}>
            <Text style={detailScreen_styles.rightTextStyle}>{rightText}</Text>
          </View>
        </StyledBody>
      </ListItem>
    );
  };
  renderPhoto = (signField) => {
    const { parentRecord } = this.props;
    if (_.toString(_.get(parentRecord, signField['photo'], ''))) {
      const photos = _.get(parentRecord, signField['photo']);
      return (
        <ListItem noBorder>
          <StyledLeft>
            <Text style={detailScreen_styles.leftTextStyle}>
              {this.sign_type === 'sign_in' ? '签到照片' : '签出照片'}
            </Text>
          </StyledLeft>
          <StyledBody style={{ justifyContent: 'flex-end' }}>
            <TouchableOpacity onPress={this.handleToPhoto(photos)}>
              <View style={{ textAlign: 'right' }}>
                <Text style={detailScreen_styles.rightTextStyle}>{photos.length}张</Text>
              </View>
            </TouchableOpacity>
          </StyledBody>
        </ListItem>
      );
    } else {
      return null;
    }
  };

  renderAbnormal = (signField) => {
    const { parentRecord } = this.props;
    if (_.toString(_.get(parentRecord, signField['abnormal'], ''))) {
      const leftText = this.sign_type === 'sign_in' ? '签到是否异常' : '签出是否异常';
      const rightText = _.get(parentRecord, signField['abnormal']) ? '是' : '否';
      return this.renderRow(leftText, rightText);
    } else {
      return null;
    }
  };

  renderTime = (signField) => {
    const { parentRecord } = this.props;
    const signTime = _.get(parentRecord, signField['time'], '');
    if (!signTime) {
      return null;
    } else {
      const leftText = this.sign_type === 'sign_in' ? '签到时间' : '签出时间';
      const rightText = moment(signTime).format('YYYY-MM-DD HH:mm');
      return this.renderRow(leftText, rightText);
    }
  };

  renderLocation = (signField) => {
    const { parentRecord } = this.props;
    const signLocation = _.get(parentRecord, signField['location']);
    if (_.isEmpty(signLocation)) {
      return null;
    } else {
      const leftText = this.sign_type === 'sign_in' ? '签到位置' : '签出位置';
      const rightText = signLocation;
      return this.renderRow(leftText, rightText);
    }
  };

  renderContent = () => {
    const { parentRecord, formItemRequired = false, form, disabled } = this.props;
    const propAddress = _.get(parentRecord, this.signField['location']);
    const currentAddress = _.get(this.state, 'address') || propAddress;
    const title = this.sign_type === 'sign_in' ? '签到' : '签出';
    return createField(
      {
        name: this.signField['location'],
        validOptions: {
          rules: [
            {
              required: formItemRequired,
              message: `${title}为必填项`,
            },
          ],
          initialValue: currentAddress,
        },
      },
      form,
    )(
      <SignInButton
        handlePress={this.handleArrive}
        address={currentAddress}
        signType={this.sign_type}
        disabled={disabled}
      />,
    );
  };

  render() {
    console.log('this.props===>', this.props);
    const { pageType, formItemRequired = false, disabled } = this.props;
    if (pageType === 'detail') {
      return this.renderDetailList();
    } else {
      return (
        <View>
          <ListItem>
            <StyledLeft>
              <RequiredTextView
                disabled={disabled}
                isRequired={formItemRequired}
                title={this.sign_type === 'sign_in' ? '签到' : '签出'}
              />
            </StyledLeft>
            <StyledBody style={{ justifyContent: 'flex-end' }}>{this.renderContent()}</StyledBody>
          </ListItem>
        </View>
      );
    }
  }
}
