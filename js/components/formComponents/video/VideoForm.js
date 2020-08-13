/**
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

type State = { videoList: string[], showTipContent: boolean };

const VideoButton = ({
  videoNum,
  handlePress,
  callback = () => {},
  onChange = () => {},
  validateFail,
}: {
  videoNum: number,
  handlePress: (onChange: (val: any) => void) => void,
  callback?: (val: any) => void,
  onChange?: (val: any) => void,
  validateFail: boolean,
}) => {
  let textColor = '';
  if (validateFail) {
    textColor = themes.input_color_require;
  } else if (!videoNum) {
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
        {videoNum > 0 ? `${videoNum}个视频` : '请选择'}
      </Text>
    </TouchableOpacity>
  );
};

export default class VideoForm extends React.Component<Prop, State> {
  time = 0;
  state = { videoList: [], showTipContent: false };

  componentDidMount() {
    const fieldName = _.get(this.props, 'field.field', 'video'); // here could be video_test
    const { parentRecord = {} } = this.props;
    // const parentRecord = _.get(this.props, 'parentRecord', {});
    const propList = _.get(parentRecord, fieldName, []);

    if (propList.length > 0) {
      this.setState({ videoList: propList });
    }
  }

  // PhotoForm should be same as here.
  static getDerivedStateFromProps(nextProps: Prop, prevState: State) {
    const pageType = _.get(nextProps, 'pageType', 'detail');
    const fieldName = _.get(nextProps, 'field.field', 'video');
    const parentRecord = _.get(nextProps, 'parentRecord', {});
    const propList = _.get(parentRecord, fieldName, []);
    const stateList = _.get(prevState, 'videoList', []);

    if (pageType === 'detail' && !_.isEqual(propList, stateList)) {
      return {
        videoList: _.concat([], propList), // It could be better to return propList directly
      };
    }

    return null;
  }

  handleVideoData = (onChange: (val: any) => void) => (photoResultList: Array<string>) => {
    console.log('photoResultList: ', photoResultList);
    // photoResultList needs to be filtered by isString;
    const fieldName = _.get(this.props, 'field.field', 'video');
    const { handleCreate } = this.props;

    this.setState((prevState) => ({
      videoList: photoResultList,
    }));

    onChange(photoResultList);

    handleCreate &&
      handleCreate({
        apiName: fieldName,
        selected: [
          {
            value: photoResultList,
          },
        ],
        multipleSelect: false,
      });
  };

  handleVideo = (onChange: (val: any) => void) => {
    const { disableField, navigation, pageType, fieldDesc, field } = this.props;

    if (pageType === 'detail' || disableField) {
      return;
    }

    navigation.navigate('Video', {
      pageType,
      fieldDesc,
      allowSelect: field.allow_select,
      videoList: this.state.videoList,
      onUpload: this.handleVideoData(onChange),
    });
  };

  renderContent = () => {
    const {
      navigation,
      title,
      pageType,
      extenderName,
      formItemRequired = false,
      form,
    } = this.props;

    const { videoList = [] } = this.state;
    const videoNum = _.filter(videoList, _.isString).length;

    if (pageType === 'detail') {
      return (
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('Video', {
              pageType,
              videoList: this.state.videoList,
            });
          }}
        >
          <Text>{`${videoNum}个视频`}</Text>
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
            initialValue: videoList,
          },
        },
        form,
      )(<VideoButton handlePress={this.handleVideo} videoNum={videoNum} />);
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

  render() {
    const { title, formItemRequired = false, disableField, fieldDesc, pageType } = this.props;
    const { showTipContent } = this.state;
    const _key = `wrap-${_.get(fieldDesc, 'id') || _.get(fieldDesc, 'api_name')}|| ''`;
    const _tip = this.checkTip();
    const _tipKey = `tip-${_.get(fieldDesc, 'id') || _.get(fieldDesc, 'api_name')}|| ''`;
    return (
      <View key={_key}>
        <ListItem>
          <StyledLeft>
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
          </StyledLeft>
          <StyledBody style={{ justifyContent: 'flex-end' }}>{this.renderContent()}</StyledBody>
        </ListItem>
        {showTipContent ? <TipContent text={_tip} key={_tipKey} /> : null}
      </View>
    );
  }
}
