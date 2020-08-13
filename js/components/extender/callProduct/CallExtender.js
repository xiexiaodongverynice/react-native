/**
 * @flow
 */

import React from 'react';
import _ from 'lodash';
import { View } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  cascadeDeleteData,
  cascadeUpdateData,
  cascadeUpdateStatus,
} from '../../../actions/cascadeAction';
import CallClmForm from './CallClmForm';
import CallProductForm from './CallProductForm';
import CallService from '../../../services/callService';
import { queryClmProduct } from '../featureFilm/callClmProduct';
import { CALL_MESSAGE_KEY, CALL_PRODUCT_KEY, CALL_CLM_KEY } from './const';
import * as CallHelp from './help';
import LoadingView from '../../hintView/LoadingView';
import JmkxFilmExtender from '../../../tabs/customized/jmkx/JmkxFilmExtender';
import { crmTenant_isjmkx } from '../../../utils/const';
import reusableColors from '../../../styles/reusableColors';

type Prop = {
  field_section: any,
  pageType: 'detail' | 'edit',
  pageTypeLevel: 'main' | 'sub',
  parentRecord: any,
  navigation: any,
  objectDescription: any,
  canCreateClm: boolean,
  cascadeIndex: Array,
  cascadeProductList: Object,
  actions: {
    cascadeDeleteDataAction: void,
    cascadeUpdateStatusAction: void,
    cascadeUpdateDataAction: void,
  },
  cascadeKeyMessageList: any,
  cascadeClmList: any,
};

type State = {
  defaultProductList: Array<any>,
  clmProductList: Array,
  checkKeyMessageList: Array,
  checkedProductList: Array,
  defaultKeyMessageList: Array,
  checkClmList: Array,
  defaultClmList: Array,
  defaultFolderList: Array,
  defaultFolderRelationList: Array,
};

class CallExtender extends React.Component<Prop, State> {
  pageType = this.props.pageType;
  parentCallId = _.get(this.props, 'parentRecord.id', _.get(this.props, 'parentRecord._id'));
  hideProductReaction = _.get(this.props, 'field_section.hide_product_reaction', false); //* 隐藏产品反馈
  showProductImportance = _.get(this.props, 'field_section.show_product_importance', false); //* 显示产品重要度

  state = {
    defaultProductList: null, //*默认所有产品
    defaultKeyMessageList: null, //* 默认所有关键信息
    checkedProductList: null, // * 选中产品
    checkKeyMessageList: null, //* 选中关键信息
    checkClmList: null, //* 选中媒体信息
    defaultClmList: null, //* 所有媒体
    defaultFolderList: null, //* 所有的媒体文件夹
    defaultFolderRelationList: null, //* 所有的的媒体文件和文件夹关系
  };

  async componentWillMount() {
    const { parentRecord, field_section } = this.props;

    const defaultFilterCritera = _.get(
      field_section,
      'form_item_extender_filter.default_filter_criterias',
      [],
    );

    //* CRM-5655
    //* 产品选择扩展 支持布局配置 objectapiname，默认为 user_product
    const productObjectApiName = _.get(
      field_section,
      'form_item_extender_filter.object_api_name',
      'user_product',
    );

    //*获取该user_product所有产品和该拜访下已选择产品
    const [
      defaultProductList,
      checkedProductList,
      checkKeyMessageList,
      checkClmList,
    ] = await Promise.all([
      queryClmProduct(productObjectApiName, defaultFilterCritera, parentRecord),
      this.queryCallData(CALL_PRODUCT_KEY),
      this.queryCallData(CALL_MESSAGE_KEY),
      this.queryCallData(CALL_CLM_KEY),
    ]);

    let defaultKeyMessageList = [];
    let defaultClmList = [];
    let defaultFolderList = [];
    let defaultFolderRelationList = [];
    //* 获取所有产品关键信息
    const productIdMap = _.map(defaultProductList, (e) => _.get(e, 'product', ''));
    const showClmFolder = _.get(global.CRM_SETTINGS, 'show_clm_folder', false);
    if (!_.isEmpty(productIdMap)) {
      // CRM_SETTINGS设置show_clm_folder时请求媒体文件夹和媒体文件和文件夹关系接口
      let promiseArr = [];
      if (showClmFolder) {
        promiseArr = [
          CallService.getProductKeymensage(productIdMap),
          CallService.getProductClm(productIdMap),
          CallService.getProductFolder(productIdMap),
          CallService.getProductFolderRelation(productIdMap),
        ];
      } else {
        promiseArr = [
          CallService.getProductKeymensage(productIdMap),
          CallService.getProductClm(productIdMap),
        ];
      }

      const resultData = await Promise.all(promiseArr);
      defaultKeyMessageList = _.get(resultData, '[0]');
      defaultClmList = _.get(resultData, '[1]');
      if (showClmFolder) {
        defaultFolderList = _.get(resultData, '[2]');
        defaultFolderRelationList = _.get(resultData, '[3]');
      }
    }

    this.setState({
      checkedProductList,
      defaultProductList,
      checkKeyMessageList,
      defaultKeyMessageList,
      defaultClmList,
      checkClmList,
      defaultFolderList,
      defaultFolderRelationList,
    });
  }

  queryCallData = async (key) => {
    if (
      this.pageType === 'add' ||
      !this.parentCallId ||
      !_.isNumber(parseFloat(this.parentCallId))
    ) {
      return [];
    }

    if (key === CALL_PRODUCT_KEY) {
      //* 获取用户产品
      const result = await CallService.getCallProductList(this.parentCallId);
      return result;
    } else if (key === CALL_MESSAGE_KEY) {
      //* 获取该拜访下已选中的关键信息
      const result = await CallService.getCallKeyMessage(this.parentCallId);
      return result;
    } else if (key === CALL_CLM_KEY) {
      //* 获取拜访下已选中的媒体信息
      const result = await CallService.getCallClm(this.parentCallId);
      return result;
    }
  };

  renderCallClm = (selectedClm, selectedProduct) => {
    const { canCreateClm = true, navigation } = this.props;
    const {
      defaultProductList,
      defaultClmList,
      defaultFolderList,
      defaultFolderRelationList,
    } = this.state;

    if (crmTenant_isjmkx()) {
      return (
        <JmkxFilmExtender
          {...this.props}
          defaultClmList={defaultClmList}
          checkClmList={selectedClm}
          selectedProduct={selectedProduct}
          navigation={navigation}
          parentCallId={this.parentCallId}
        />
      );
    } else if (canCreateClm) {
      return (
        <CallClmForm
          {...this.props}
          defaultClmList={defaultClmList}
          defaultFolderList={defaultFolderList}
          defaultFolderRelationList={defaultFolderRelationList}
          checkClmList={selectedClm}
          selectedProduct={selectedProduct}
          defaultProductList={defaultProductList}
          parentCallId={this.parentCallId}
          navigation={navigation}
        />
      );
    }
  };

  render() {
    const { cascadeIndex, cascadeProductList, cascadeKeyMessageList, cascadeClmList } = this.props;
    const {
      defaultProductList,
      checkKeyMessageList,
      checkedProductList,
      defaultKeyMessageList,
      defaultClmList,
      checkClmList,
    } = this.state;

    if (
      _.isNull(checkedProductList) ||
      _.isNull(defaultProductList) ||
      _.isNull(defaultKeyMessageList)
    ) {
      return <LoadingView />;
    }

    const selectedProduct = CallHelp.composeCallCascade({
      checkList: checkedProductList,
      cascadeList: cascadeProductList,
      cascadeIndex,
      key: CALL_PRODUCT_KEY,
      parentCallId: this.parentCallId,
    });

    const selectedMessage = CallHelp.composeCallCascade({
      checkList: checkKeyMessageList,
      cascadeList: cascadeKeyMessageList,
      cascadeIndex,
      key: CALL_MESSAGE_KEY,
      parentCallId: this.parentCallId,
    });

    const selectedClm = CallHelp.composeCallCascade({
      checkList: checkClmList,
      cascadeList: cascadeClmList,
      cascadeIndex,
      key: CALL_CLM_KEY,
      parentCallId: this.parentCallId,
    });

    const bottomRadius = {
      //模拟底部两个圆角
      borderBottomLeftRadius: 5,
      borderBottomRightRadius: 5,
    };
    return (
      <React.Fragment>
        <View style={{ backgroundColor: reusableColors.detailScreenBgColor }}>
          <View style={[{ backgroundColor: 'white' }, bottomRadius]}>
            <CallProductForm
              {...this.props}
              defaultProductList={defaultProductList}
              defaultKeyMessageList={defaultKeyMessageList}
              checkedProductList={selectedProduct}
              checkKeyMessageList={selectedMessage}
              checkClmList={selectedClm}
              defaultClmList={defaultClmList}
              parentCallId={this.parentCallId}
              hideProductReaction={this.hideProductReaction}
              showProductImportance={this.showProductImportance}
            />
          </View>
        </View>

        {this.renderCallClm(selectedClm, selectedProduct)}
      </React.Fragment>
    );
  }
}

const select = (state, screen) => ({
  cascadeProductList: _.get(state, `cascade.cascadeList.${CALL_PRODUCT_KEY}`, {}),
  cascadeKeyMessageList: _.get(state, `cascade.cascadeList.${CALL_MESSAGE_KEY}`, {}),
  cascadeClmList: _.get(state, `cascade.cascadeList.${CALL_CLM_KEY}`, {}),
  cascadeIndex: _.get(state, 'cascade.cascadeIndexs', []),
  canCreateClm: _.get(state.settings.crmPowerSetting, 'create_clm_in_call'),
});

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

export default connect(select, act)(CallExtender);
