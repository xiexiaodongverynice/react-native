/**
 *@flow
 */

import React from 'react';
import { View } from 'react-native';
import { Text } from 'native-base';
import _ from 'lodash';
import CallClmInnerForm from './CallClmInnerForm';
import { DetailScreenSectionHeader, StyledSeparator } from '../../../tabs/common/components';
import themes from '../../../tabs/common/theme';
import CallService from '../../../services/callService';
import { intlValue } from '../../../utils/crmIntlUtil';
import VerticalSpacer from '../../common/VerticalSpacer';
import detailScreen_styles from '../../../styles/detailScreen_styles';
import reusableColors from '../../../styles/reusableColors';

type Prop = {
  objectDescription: any,
  pageType: string,
  navigation: any,
  defaultClmList: Array,
  checkClmList: Array, //* 选中的媒体
  selectedProduct: Array, //* 选中的产品
  parentCallId: any,
  defaultProductList: Array,
  dispatch: void,
  defaultFolderList: Array,
  defaultFolderRelationList: Array,
};

type State = {
  preClmlist: Array,
};

class CallClmForm extends React.Component<Prop, State> {
  state = {
    preClmlist: [],
  };

  async componentDidMount() {
    const { navigation } = this.props;

    const preClmlist = [];
    const { clmParams } = navigation.state.params;
    if (clmParams) {
      const result = await CallService.getPreClm(clmParams);
      _.each(result, (rst) => {
        preClmlist.push({
          clm_presentation: rst.id,
          clm_presentation__r: {
            id: rst.id,
            name: rst.name,
          },
          reaction: '',
        });
      });
    }

    this.setState({
      preClmlist,
    });
  }

  render() {
    const {
      objectDescription,
      navigation,
      pageType,
      defaultProductList,
      checkClmList,
      defaultClmList,
      selectedProduct,
      parentCallId,
      dispatch,
      defaultFolderList,
      defaultFolderRelationList,
    } = this.props;

    let clmList = checkClmList;
    const preClmlist = _.get(this.state, 'preClmlist');

    if (clmList.length === 0 && preClmlist.length > 0) {
      clmList = preClmlist;
    }

    const callKeyMessageReaction = _.get(
      _.find(_.get(objectDescription, 'items'), { api_name: 'key_message' }),
      'fields',
    );
    const KeyMessageReaction = _.get(
      _.find(callKeyMessageReaction, { api_name: 'reaction_options' }),
      'options',
    );

    const productIdMap = _.map(selectedProduct, (e) => _.get(e, 'product'));
    const clmOptions = _.filter(defaultClmList, (e) => productIdMap.includes(_.get(e, 'product')));
    // 要不要顾虑一下文件夹？？？
    // const clmFolderOptions = _.filter(defaultFolderList, (e) =>
    //   productIdMap.includes(_.get(e, 'product')),
    // );
    const headerElem = this.renderHeader();
    const innerFormElem = (
      <CallClmInnerForm
        defaultProductList={defaultProductList}
        pageType={pageType}
        clmData={clmOptions} //* 所有 媒体
        totalSelectedMedia={clmList} //* 选中的当前媒体
        keyMessageReaction={KeyMessageReaction}
        navigation={navigation}
        dispatch={dispatch}
        parentCallId={parentCallId}
        clmFolderData={defaultFolderList}
        allFolderRelationList={defaultFolderRelationList}
      />
    );
    if (this.props.pageType === 'detail') {
      const grayStyle = { backgroundColor: reusableColors.detailScreenBgColor };
      return (
        <View style={grayStyle}>
          <VerticalSpacer height={10} />
          <View style={detailScreen_styles.sectionWrapperStyle}>
            {headerElem}
            {innerFormElem}
          </View>
        </View>
      );
    } else {
      return (
        <View>
          {headerElem}
          {innerFormElem}
        </View>
      );
    }
  }
  renderHeader() {
    if (this.props.pageType === 'detail') {
      return <DetailScreenSectionHeader text={intlValue('label.clm_message')} />;
    } else {
      return (
        <StyledSeparator>
          <Text
            style={{
              fontSize: themes.list_separator_text_size,
              fontWeight: 'bold',
              color: themes.list_subtitle_color,
            }}
          >
            {intlValue('label.clm_message')}
          </Text>
        </StyledSeparator>
      );
    }
  }
}

export default CallClmForm;
