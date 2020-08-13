/**
 * @flow
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ListItem } from 'native-base';
import _ from 'lodash';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  cascadeDeleteData,
  cascadeUpdateData,
  cascadeUpdateStatus,
} from '../../../actions/cascadeAction';
import { StyledBody, StyledLeft, RequiredTextView } from '../../../tabs/common/components';
import createField from '../../../tabs/common/createField';
import themes from '../../../tabs/common/theme';
import { queryProduct, selectClmProduct } from './callClmProduct';
import * as CallHelp from '../callProduct/help';
import CallService from '../../../services/callService';
import handleUpdateCascade, { CASCADE_CREATE } from '../../../utils/helpers/handleUpdateCascade';
import detailScreen_styles from '../../../styles/detailScreen_styles';

const CALL_CLM_KEY = 'call_survey_feedback_list';

type Prop = {
  form: any,
  dispatch: void,
  navigation: any,
  pageType: string,
  formItemRequired: boolean,
  pageTypeLevel: 'main' | 'sub',
  parentRecord: any,
  field_section: any,
  cascadeClmList: Object,
  cascadeIndex: Array,
  terminationTime: number,
  actions: any,
};

type State = {
  survey_feedback?: any, //* 视图显示条数
  clmData: any, //* 获取到的所有媒体
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
  let textColor = themes.input_placeholder;
  if (validateFail) {
    textColor = themes.input_color_require;
  } else if (!size) {
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
      onPress={handlePress}
    >
      <Text style={{ textAlign: 'right', color: textColor }}>
        {size ? `已播放${size}条` : '请点击'}
      </Text>
    </TouchableOpacity>
  );
}

class FeatureFilmsExtender extends React.Component<Prop, State> {
  parentCallId = _.get(this.props, 'parentRecord.id');
  state = {
    survey_feedback: null,
    clmData: null,
  };

  componentDidMount() {
    if (
      this.props.pageType !== 'add' ||
      _.get(global.CRM_SETTINGS, 'clm_filter_criterias') === '1'
    ) {
      this.refresh();
    }
  }

  refresh = async (data = {}) => {
    const DuclmProductList = await this.getClmProduct(data);
    const clmProductList = [...new Set(DuclmProductList)];
    const { pageType } = this.props;

    const clmResult = await CallService.getProductClm(clmProductList);
    if (_.isArray(clmResult)) {
      this.setState({ clmData: clmResult });
    } else {
      this.setState({ clmData: [] });
    }

    //* 拜访id
    const feedbackObj = [];
    if (pageType !== 'add') {
      const feedbackResult = await CallService.getCallClm(this.parentCallId);

      if (!_.isEmpty(feedbackResult)) {
        _.forEach(feedbackResult, (e) => {
          feedbackObj.push({
            id: e.clm_presentation,
            name: e.name,
          });
        });
        this.feedbackObj = feedbackObj;
      }
    }
    this.setState({ survey_feedback: feedbackObj });
  };

  componentWillReceiveProps(nextprops) {
    const { pageType, pageTypeLevel, parentRecord, terminationTime } = this.props;
    const { terminationTime: nextTerminationTime } = nextprops;
    if (
      pageType === 'detail' &&
      pageTypeLevel === 'main' &&
      nextTerminationTime != terminationTime
    ) {
      this.refresh();
    }

    if (
      pageType === 'add' &&
      (_.get(global.CRM_SETTINGS, 'clm_filter_criterias') === '2' ||
        _.get(global.CRM_SETTINGS, 'clm_filter_criterias') === '3') &&
      _.get(nextprops, 'parentRecord.customer') !== _.get(parentRecord, 'customer')
    ) {
      this.refresh(nextprops.parentRecord);
    }
  }

  getClmProduct = async (nextData) => {
    let data = [];
    const { field_section, parentRecord } = this.props;
    const updateData = !_.isEmpty(nextData) ? nextData : parentRecord;
    const defaultCloneFilterCritera = _.get(
      field_section,
      'form_item_extender_filter.default_filter_criterias',
      [],
    );

    const defaultFilterCritera = _.cloneDeep(defaultCloneFilterCritera);
    const clm_filter_criterias = _.get(global.CRM_SETTINGS, 'clm_filter_criterias');
    if (_.isEmpty(clm_filter_criterias) && !_.isNumber(clm_filter_criterias)) {
      return data;
    } else if (clm_filter_criterias === '1') {
      data = await queryProduct('user_product', defaultFilterCritera, updateData);
    } else if (clm_filter_criterias === '2') {
      data = await queryProduct('customer_product', defaultFilterCritera, updateData);
    } else if (clm_filter_criterias === '3') {
      const productList = await queryProduct('user_product', defaultFilterCritera, updateData);
      data = await selectClmProduct(productList, defaultFilterCritera, updateData);
    }

    if (!_.isEmpty(data)) {
      data = _.map(data, (e) => e.product);
    }
    return data;
  };

  handleAddRecord = (surveyId, name) => {
    const { dispatch } = this.props;
    const addClmData = {
      clm_presentation: surveyId,
      reaction: '',
    };
    handleUpdateCascade({
      data: addClmData,
      relatedListName: CALL_CLM_KEY,
      status: CASCADE_CREATE,
      parentId: this.parentCallId,
      dispatch,
    });
  };

  handleArrive = (selectedClm) => {
    const { navigation, pageType } = this.props;
    const { clmData } = this.state;
    let options = clmData;

    if (pageType === 'detail') {
      options = _.filter(clmData, (e) => _.some(selectedClm, { id: e.id }));
    }

    navigation.navigate('FeatureFilmsOption', {
      callback: this.handleAddRecord,
      options,
      otherDatas: _.cloneDeep(selectedClm),
      pageType,
    });
  };

  renderContent = () => {
    const { pageType, cascadeClmList, cascadeIndex, form } = this.props;
    const { survey_feedback, clmData } = this.state;
    if (_.isNull(clmData) || _.isNull(survey_feedback)) return null;

    const selectedClm = CallHelp.composeCallCascade({
      checkList: survey_feedback,
      cascadeList: cascadeClmList,
      cascadeIndex,
      key: CALL_CLM_KEY,
      parentCallId: this.parentCallId,
    });

    const options = _.filter(clmData, (e) => _.some(selectedClm, { id: e.id }));
    if (pageType === 'detail') {
      return (
        <TouchableOpacity
          onPress={() => {
            this.handleArrive(selectedClm);
          }}
        >
          <View>
            <Text style={detailScreen_styles.rightTextStyle}>
              {options.length > 0 ? `${options.length}条` : '无'}
            </Text>
          </View>
        </TouchableOpacity>
      );
    } else {
      return createField(
        {
          name: 'survey_feedback',
          validOptions: {
            rules: [
              {
                required: false,
                message: 'FeatureFilms form is required',
              },
            ],
            initialValue: selectedClm,
          },
        },
        form,
      )(
        <FeatureFilms
          size={selectedClm.length}
          handlePress={() => {
            this.handleArrive(selectedClm);
          }}
        />,
      );
    }
  };

  renderLeft() {
    if (this.props.pageType === 'detail') {
      return <Text style={detailScreen_styles.leftTextStyle}>专题片</Text>;
    } else {
      const { formItemRequired = false } = this.props;
      return <RequiredTextView disabled={false} isRequired={formItemRequired} title="专题片" />;
    }
  }
  render() {
    const noBorder = this.props.pageType === 'detail';
    const style = { backgroundColor: 'white' };
    return (
      <View style={style}>
        <ListItem noBorder={noBorder}>
          <StyledLeft>{this.renderLeft()}</StyledLeft>
          <StyledBody style={{ justifyContent: 'flex-end' }}>{this.renderContent()}</StyledBody>
        </ListItem>
      </View>
    );
  }
}

const select = (state, screen) => {
  const terminationTime = _.get(state, 'cascade.terminationTime', 0);
  return {
    cascadeClmList: _.get(state, `cascade.cascadeList.${CALL_CLM_KEY}`, {}),
    cascadeIndex: _.get(state, 'cascade.cascadeIndexs', []),
    objectDescription: state.settings.objectDescription,
    terminationTime,
  };
};

const act = (dispatch, props) => ({
  actions: bindActionCreators(
    {
      cascadeUpdateDataAction: cascadeUpdateData,
      cascadeUpdateStatusAction: cascadeUpdateStatus,
      cascadeDeleteDataAction: cascadeDeleteData,
    },
    dispatch,
  ),
  dispatch,
});

export default connect(select, act)(FeatureFilmsExtender);
