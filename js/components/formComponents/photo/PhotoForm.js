/**
 * Created by Uncle Charlie, 2018/04/24
 * @flow
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ListItem } from 'native-base';
import _ from 'lodash';
import { RequiredTextView, StyledBody, StyledLeft } from '../../../tabs/common/components';
import createField from '../../../tabs/common/createField';
import themes from '../../../tabs/common/theme';
import { TipContent } from '../common';
import detailScreen_styles from '../../../styles/detailScreen_styles';

type Prop = {
  extenderName: string,
  form?: any,
  title: string,
  fieldDesc: any,
  navigation: any,
  parentRecord: any,
  pageType: string,
  formItemRequired: boolean,
  handleCreate?: any,
  disableField: boolean,
  fieldDesc: any,
  field: any,
};

type State = { photoList: string[], showTipContent: boolean };

const PhotoButton = ({
  photoNum,
  handlePress,
  callback = () => {},
  onChange = () => {},
  validateFail,
}: {
  photoNum: number,
  handlePress: (onChange: (val: any) => void) => void,
  callback?: (val: any) => void,
  onChange?: (val: any) => void,
  validateFail: boolean,
}) => {
  let textColor = '';
  if (validateFail) {
    textColor = themes.input_color_require;
  } else if (!photoNum) {
    textColor = themes.input_placeholder;
  } else {
    textColor = themes.input_color;
  }

  const _handle = () => {
    handlePress(onChange);
  };

  return (
    <TouchableOpacity
      style={{
        height: 30,
        justifyContent: 'center',
      }}
      transparent
      onPress={_handle}
    >
      <Text style={{ textAlign: 'right', color: textColor }}>
        {photoNum > 0 ? `${photoNum}张图` : '请选择'}
      </Text>
    </TouchableOpacity>
  );
};

export default class PhotoForm extends React.Component<Prop, State> {
  time = 0;
  state = { photoList: [], showTipContent: false };

  componentDidMount() {
    const fieldName = _.get(this.props, 'field.field', 'image');
    const { parentRecord = {} } = this.props;
    // const parentRecord = _.get(this.props, 'parentRecord', {});
    const propList = _.get(parentRecord, fieldName, []);
    const { photoList: stateList } = this.state;

    if (propList.length > 0) {
      this.setState({ photoList: propList });
    }
  }

  shouldComponentUpdate(nextProps) {
    const pageType = _.get(this.props, 'pageType');
    const fieldName = _.get(nextProps, 'field.field', 'image');
    const parentRecord = _.get(nextProps, 'parentRecord', {});
    const list = _.get(parentRecord, fieldName, []);
    //const list = _.get(nextProps, 'parentRecord.image', []);
    const { photoList } = this.state;
    //* 编辑后保存，替换详情页面的state
    if (pageType === 'detail' && !_.isEqual(list, photoList)) {
      this.setState({ photoList: list });
    }
    return true;
  }

  static getDerivedStateFromProps(nextProps: Prop, prevState: State) {
    const pageType = _.get(nextProps, 'pageType', 'detail');
    const fieldName = _.get(nextProps, 'field.field', 'image');
    const parentRecord = _.get(nextProps, 'parentRecord', {});
    const propList = _.get(parentRecord, fieldName, []);
    //const propList = _.get(nextProps, 'parentRecord.image', []);
    const stateList = _.get(prevState, 'photoList', []);
    if (pageType === 'detail' && propList.length !== stateList.length) {
      return {
        photoList: _.concat([], propList),
      };
    }

    return null;
  }

  handlePhotoData = (onChange: (val: any) => void) => (photoResultList: Array<string>) => {
    let valueList = photoResultList;
    const fieldName = _.get(this.props, 'field.field', 'image');
    if (!_.isEmpty(photoResultList)) {
      valueList = _.filter(photoResultList, _.isString);
    }

    const { handleCreate } = this.props;

    this.setState((prevState) => ({
      photoList: valueList,
    }));

    onChange(valueList);

    handleCreate &&
      handleCreate({
        apiName: fieldName,
        selected: [
          {
            value: valueList,
          },
        ],
        multipleSelect: false,
      });
  };

  handlePhoto = (onChange: (val: any) => void) => {
    const { disableField, field, navigation, pageType, fieldDesc, parentRecord } = this.props;

    if (pageType === 'detail' || disableField) {
      return;
    }
    const currentTime = new Date().getTime();
    if (currentTime - this.time < 20000) {
      return;
    }
    this.time = currentTime;

    navigation.navigate('Photo', {
      pageType,
      fieldDesc,
      fieldLayout: field,
      photoList: this.state.photoList,
      parentRecord,
      callback: this.handlePhotoData(onChange),
      clearTime: () => {
        this.time = 0;
      },
    });
  };

  renderContent = () => {
    const {
      navigation,
      title,
      pageType,
      extenderName,
      field,
      formItemRequired = false,
      form,
    } = this.props;

    const { photoList = [] } = this.state;
    const imageNum = _.filter(photoList, _.isString).length;

    if (pageType === 'detail') {
      return (
        <TouchableOpacity
          // style={{ textAlign: 'right' }}
          onPress={() => {
            navigation.navigate('Photo', {
              pageType,
              photoList: this.state.photoList,
              fieldLayout: field,
            });
          }}
        >
          <Text style={detailScreen_styles.rightTextStyle}>{`${imageNum}张图`}</Text>
        </TouchableOpacity>
      );
    } else {
      return createField(
        {
          name: extenderName,
          validOptions: {
            rules: [
              {
                required: formItemRequired,
                message: `${title}是必填项`,
              },
            ],
            initialValue: photoList,
          },
        },
        form,
      )(<PhotoButton handlePress={this.handlePhoto} photoNum={imageNum} />);
    }
  };

  checkTip = () => {
    const { field } = this.props;
    const _hint = _.get(field, 'tip.hint', '');
    if (_hint && _.isString(_hint)) {
      return _hint;
    }
    return false;
  };

  renderLeft() {
    const title = this.props.title;
    if (this.props.pageType === 'detail') {
      return <Text style={detailScreen_styles.leftTextStyle}>{title}</Text>;
    } else {
      const { formItemRequired = false, disableField, pageType } = this.props;
      const { showTipContent } = this.state;
      const _tip = this.checkTip();
      return (
        <RequiredTextView
          disabled={disableField}
          isRequired={formItemRequired}
          title={title}
          pageType={pageType}
          tipContent={_tip}
          handleTip={() => {
            this.setState({ showTipContent: !showTipContent });
          }}
        />
      );
    }
  }

  render() {
    const { fieldDesc } = this.props;
    const { showTipContent } = this.state;
    const _tip = this.checkTip();

    const _key = `wrap-${_.get(fieldDesc, 'id') || _.get(fieldDesc, 'api_name')}|| ''`;
    const _tipKey = `tip-${_.get(fieldDesc, 'id') || _.get(fieldDesc, 'api_name')}|| ''`;

    const viewStyle = this.props.pageType === 'detail' ? { backgroundColor: 'white' } : null;
    const noBorder = this.props.pageType === 'detail';
    return (
      <View key={_key} style={viewStyle}>
        <ListItem noBorder={noBorder}>
          <StyledLeft>{this.renderLeft()}</StyledLeft>
          <StyledBody style={{ justifyContent: 'flex-end' }}>{this.renderContent()}</StyledBody>
        </ListItem>
        {showTipContent ? <TipContent text={_tip} key={_tipKey} /> : null}
      </View>
    );
  }
}
