/**
 * @flow
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ListItem, Left, Body, Icon, Spinner } from 'native-base';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import _ from 'lodash';
import themes from '../../tabs/common/theme';
import {
  cascadeUpdateData,
  cascadeDeleteAllData,
  cascadeUpdateStatus,
  cascadeDeleteData,
} from '../../actions/cascadeAction';
import { processCriterias } from '../../utils/criteriaUtil';
import { checktIsFillout } from '../../tabs/customized/jmkx/validPreProduct';
import handleUpdateCascade, {
  CASCADE_CREATE,
  CASCADE_INIT,
} from '../../utils/helpers/handleUpdateCascade';
import recordService from '../../services/recordService';

type Props = {
  pageType: 'edit' | 'add' | 'detail',
  layout: any,
  parentData: any,
  navigation: any,
  pageTypeLevel: 'main' | 'modal',
  actions: any,
  component: any,
  isTopLevel: boolean,
  parentApiName: any,
  dispatch: void,
  terminationTime: number,
  cascadeData: any,
};

type State = {
  isExist: boolean,
  headerText: string,
  navigateStatus: 'start' | 'done',
};

class RelatedItem extends React.PureComponent<Props, State> {
  state = {
    navigateStatus: 'start',
  };

  listener: any;

  async componentDidMount() {
    const { pageType, layout, parentData } = this.props;

    if (pageType !== 'add') {
      await this.getInitData(layout, parentData);
      await this.preSetProduct(parentData);
    }

    this.setState({ navigateStatus: 'done' });
  }

  componentWillReceiveProps(nextProps) {
    const { pageType, layout, parentData, isTopLevel, terminationTime } = this.props;
    const { parentData: nextParentData, terminationTime: nextTerminationTime } = nextProps;

    // * 检查配置是否需要预填充产品
    // * 当customer改变时，重新预加载产品
    // 如果是选中了客户（更改客户），nextParentData_customer有值（整数），这时才预加载。
    // 如果是清空客户，nextParentData_customer是undefined，无需发送请求
    const parentData_customer = _.get(parentData, 'customer');
    const nextParentData_customer = _.get(nextParentData, 'customer');
    const customer_changed = parentData_customer !== nextParentData_customer;
    if (nextParentData_customer && customer_changed) {
      this.setState({ navigateStatus: 'start' });
      this.preSetProduct(nextParentData).then(() => {
        this.setState({ navigateStatus: 'done' });
      });
    }

    //* 回到顶层 详情页进行刷新
    if (
      pageType === 'detail' &&
      isTopLevel &&
      !this.loading &&
      nextTerminationTime != terminationTime
    ) {
      this.getInitData(layout, parentData).then(() => {
        this.setState({ navigateStatus: 'done' });
      });
    }
  }

  // * 预加载产品为定制需求，只有layout配置了 product_setting 才会预加载产品id，详细需求见 CRM-5093
  preSetProduct = async (parentData) => {
    const cascadeTerminationTime = Date.now();
    const { layout, pageType, cascadeData, dispatch } = this.props;
    const product_setting = _.get(layout, 'product_setting', {});

    if (pageType == 'detail' || _.isEmpty(product_setting)) return;

    const criterias = processCriterias(_.get(product_setting, 'criterias', []), parentData);

    const payload = {
      head: { token: global.FC_CRM_TOKEN },
      body: {
        joiner: 'and',
        criterias,
        objectApiName: _.get(product_setting, 'ref_object', ''),
        pageSize: 50,
        pageNo: 1,
      },
    };

    const productList = await recordService.queryRecordListService(payload);
    const result = _.get(productList, 'result', []);

    if (_.isEmpty(result)) return;

    //* 获取cascade中productlist
    const cacheProductIdList = _.reduce(
      cascadeData,
      (sum, item) => {
        sum.push(_.get(item, 'product'));
        return sum;
      },
      [],
    );

    // *获取最后需要预加载productlist
    const preProductIdList = _.chain(result)
      .map((product) => ({
        product: _.get(product, _.get(product_setting, 'target_field', 'id')),
        product__r: product,
      }))
      .remove((valueObj) => !cacheProductIdList.includes(_.get(valueObj, 'product'))) //* 预加载时去掉已填写的数据(用于edit)
      .value();

    handleUpdateCascade({
      data: preProductIdList,
      relatedListName: _.get(layout, 'related_list_name'),
      status: CASCADE_CREATE,
      parentId: _.get(parentData, 'id'),
      dispatch,
      cascadeLimitTime: cascadeTerminationTime,
    });

    return true;
  };

  async getInitData(layout, pData) {
    const { dispatch } = this.props;
    const cascadeTerminationTime = Date.now();
    this.setState({ navigateStatus: 'start' });
    this.loading = true;

    const { pageType, actions } = this.props;
    const apiName = _.get(layout, 'ref_obj_describe');
    const parentApiName = _.get(pData, 'object_describe_name');
    const orderBy = _.get(layout, 'default_sort_by', 'create_time');
    const order = _.get(layout, 'default_sort_order', 'desc');

    const criterias = [
      {
        field: parentApiName,
        operator: '==',
        value: [pData.id],
      },
    ];
    const payload = {
      head: { token: global.FC_CRM_TOKEN },
      body: {
        joiner: 'and',
        criterias,
        orderBy,
        order,
        objectApiName: apiName,
        pageSize: 1000,
        pageNo: 1,
      },
    };

    if (pageType === 'detail' || pageType === 'edit') {
      const data = await recordService.queryRecordListService(payload);
      const resultData = _.get(data, 'result', []);
      this.loading = false;
      if (!_.isEmpty(resultData)) {
        handleUpdateCascade({
          data: resultData,
          relatedListName: _.get(layout, 'related_list_name'),
          status: CASCADE_INIT,
          parentId: _.get(pData, 'id'),
          dispatch,
          cascadeLimitTime: cascadeTerminationTime,
        });
      }
    }
    return true;
  }

  checkFillOut = () => {
    const { pageType, cascadeData, layout } = this.props;

    const product_setting = _.get(layout, 'product_setting', {});
    if (!_.isEmpty(product_setting) && pageType !== 'detail') {
      const cascadeDataKeys = Object.keys(cascadeData);
      return _.some(cascadeDataKeys, (key) => !checktIsFillout(cascadeData[key]));
    } else {
      return !_.isEmpty(cascadeData);
    }
  };

  gotoRelatedScreen = () => {
    const { navigateStatus } = this.state;
    if (navigateStatus != 'done') return false;
    const {
      layout,
      parentApiName,
      component,
      parentData,
      navigation,
      pageType,
      pageTypeLevel,
    } = this.props;

    const objectApiName = _.get(layout, 'ref_obj_describe');
    const params = {
      relateComponent: layout,
      parentData,
      pageType,
      objectApiName,
      parentApiName,
      pageTypeLevel,
      component,
    };
    navigation.navigate('RelatedList', params);
  };

  renderLoading = () => (
    <View
      style={{
        flex: 1,
        height: 25,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'flex-end',
      }}
    >
      {/* android,需要引入 ActivityIndicator否则会闪退，ios正常 */}
      <Spinner color="#333" size="small" />
    </View>
  );

  renderDes = () => {
    const isExist = this.checkFillOut();

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={this.gotoRelatedScreen}
        style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}
      >
        <Text style={{ flex: 1, textAlign: 'right', alignItems: 'center' }}>
          {isExist ? '已填写' : ''}
        </Text>
        <Icon
          name="ios-arrow-forward"
          style={[styles.icon, { textAlign: 'right', paddingLeft: 5 }]}
        />
      </TouchableOpacity>
    );
  };

  render() {
    const { layout } = this.props;
    const { navigateStatus } = this.state;
    const headerText = _.get(layout, 'header', '');

    return (
      <View style={{ backgroundColor: '#fff' }}>
        <ListItem style={{ borderColor: '#fff' }}>
          <Left>
            <Text
              style={{ flex: 1, fontFamily: 'PingFangSC-Regular', fontSize: 13, color: '#666666' }}
            >
              {headerText}
            </Text>
          </Left>
          <Body>{navigateStatus === 'start' ? this.renderLoading() : this.renderDes()}</Body>
        </ListItem>
      </View>
    );
  }
}

const select = (state, screen) => {
  const relatedListName = _.get(screen, 'layout.related_list_name');
  const cascadeData = _.get(state, `cascade.cascadeList.${relatedListName}`, {});
  const terminationTime = _.get(state, 'cascade.terminationTime', 0);
  return {
    objectDescription: state.settings.objectDescription,
    cascadeData,
    terminationTime,
  };
};

const act = (dispatch, props) => ({
  actions: bindActionCreators(
    { cascadeUpdateData, cascadeDeleteAllData, cascadeUpdateStatus, cascadeDeleteData },
    dispatch,
  ),
  dispatch,
});

export default connect(select, act)(RelatedItem);

const styles = StyleSheet.create({
  item: {},
  icon: {
    color: themes.color_header_icon,
    fontSize: themes.font_header_size,
  },
});
