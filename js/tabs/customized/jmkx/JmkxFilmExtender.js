/**
 * @flow
 */

import React from 'react';
import _ from 'lodash';
import { View, Text, TouchableOpacity } from 'react-native';
import { ListItem } from 'native-base';
import { StyledBody, StyledLeft, RequiredTextView } from '../../common/components';
import themes from '../../common/theme';
import { CALL_CLM_KEY } from '../../../components/extender/callProduct/const';
import handleUpdateCascade, { CASCADE_CREATE } from '../../../utils/helpers/handleUpdateCascade';
import detailScreen_styles from '../../../styles/detailScreen_styles';
import I18n from '../../../i18n';

type Prop = {
  navigation: any,
  pageType: string,
  formItemRequired: boolean,
  defaultClmList: any,
  checkClmList: any,
  selectedProduct: any,
  parentCallId: any,
  dispatch: void,
};

function FeatureFilms({
  size,
  handlePress,
  callback,
  validateFail,
}: {
  size: string,
  handlePress: (onChange: (val: any) => void) => void,
  callback: (val: any) => void,
  validateFail: boolean,
}) {
  if (validateFail) {
    this.textColor = themes.input_color_require;
  } else if (!size) {
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
      onPress={() => handlePress()}
    >
      <Text numberOfLines={1} style={{ textAlign: 'right', color: this.textColor }}>
        {size ? `已阅读${size}条` : '请点击'}
      </Text>
    </TouchableOpacity>
  );
}

export default class JmkxFilmExtender extends React.PureComponent<Prop, {}> {
  handleAddRecord = (surveyId, name) => {
    const { dispatch, parentCallId } = this.props;

    const addClmData = {
      clm_presentation: surveyId,
      reaction: '',
    };
    handleUpdateCascade({
      data: addClmData,
      relatedListName: CALL_CLM_KEY,
      status: CASCADE_CREATE,
      parentId: parentCallId,
      dispatch,
    });
  };

  handleArrive = () => {
    const { navigation, pageType, defaultClmList, selectedProduct, checkClmList } = this.props;

    let options;
    if (pageType !== 'detail') {
      const selectedProductIdMap = _.map(selectedProduct, (e) => _.get(e, 'product'));
      options = _.filter(defaultClmList, (e) => selectedProductIdMap.includes(_.get(e, 'product')));
    } else {
      const selectedClmIdMap = _.map(checkClmList, (e) => _.get(e, 'clm_presentation'));
      options = _.filter(defaultClmList, (e) => selectedClmIdMap.includes(_.get(e, 'id')));
    }

    navigation.navigate('FeatureFilmsOption', {
      callback: this.handleAddRecord,
      options,
      otherDatas: _.cloneDeep(checkClmList),
      pageType,
    });
  };

  renderContent = () => {
    const { pageType, checkClmList } = this.props;

    if (pageType === 'detail') {
      return (
        <TouchableOpacity onPress={this.handleArrive}>
          <View>
            <Text style={detailScreen_styles.rightTextStyle}>
              {checkClmList.length > 0 ? `${checkClmList.length}条` : '无'}
            </Text>
          </View>
        </TouchableOpacity>
      );
    } else {
      return <FeatureFilms size={checkClmList.length} handlePress={this.handleArrive} />;
    }
  };

  renderLeft() {
    const title = I18n.t('JmkxFilmExtender.MediaInfo');
    if (this.props.pageType === 'detail') {
      return <Text style={detailScreen_styles.leftTextStyle}>{title}</Text>;
    } else {
      const { formItemRequired = false } = this.props;
      return <RequiredTextView disabled={false} isRequired={formItemRequired} title="title" />;
    }
  }
  render() {
    return (
      <View>
        <ListItem>
          <StyledLeft>{this.renderLeft()}</StyledLeft>
          <StyledBody style={{ justifyContent: 'flex-end' }}>{this.renderContent()}</StyledBody>
        </ListItem>
      </View>
    );
  }
}
