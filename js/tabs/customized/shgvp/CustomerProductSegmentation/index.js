/**
 * * 绿谷定制产品定级
 * @flow
 */

import React from 'react';
import _ from 'lodash';
import { View, Text } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { cascadeAddEmpty } from '../../../../actions/cascadeAction';
import ProductItem from './ProductItem';
import IndexDataParser from '../../../../services/dataParser';
import HttpRequest from '../../../../services/httpRequest';
import LoadingView from '../../../../components/hintView/LoadingView';
import { processCriterias, executeDefaultFieldVal } from '../../../../utils/criteriaUtil';
import { CUSTOMER_SEGMENTATION } from './const';
import I18n from '../../../../i18n';

type Prop = {
  field_section: any, //* 扩展布局
  navigation: any,
  objectDescription: any,
  parentRecord: any,
  actions: {
    cascadeAddEmptyAction: void,
  },
};

type State = {
  productList: Array, //* 可定级产品
};

class CustomerProductSegmentation extends React.Component<Prop, State> {
  state = {
    productList: null,
  };

  async componentWillMount() {
    const { parentRecord, objectDescription, field_section } = this.props;

    const defaultFilterCritera = _.get(
      field_section,
      'form_item_extender_filter.default_filter_criterias',
      [],
    );

    if (!_.isEmpty(defaultFilterCritera)) {
      const criteria = processCriterias(defaultFilterCritera, {}, parentRecord);
      this.getProduct(criteria);
    }

    this.fields = _.get(field_section, 'fields', []);

    //* 获取产品定级的对象描述
    this.currentDesc = IndexDataParser.getObjectDescByApiName(
      'segmentation_history',
      objectDescription,
    );
  }

  getProduct = async (criteria = []) => {
    const { actions } = this.props;

    const payload = {
      token: global.FC_CRM_TOKEN,
      criteria,
      joiner: 'and',
      objectApiName: 'user_product',
      order: 'asc',
      orderBy: 'create_time',
      pageNo: 1,
      pageSize: 100,
    };

    const resultData = await HttpRequest.query(payload);
    const result = _.get(resultData, 'result', []);

    if (!_.isEmpty(result)) {
      actions.cascadeAddEmptyAction({ relationListName: CUSTOMER_SEGMENTATION });
    }

    this.setState({ productList: result });
  };

  render() {
    const { navigation } = this.props;
    const { productList } = this.state;

    if (_.isNull(productList)) {
      return <LoadingView />;
    } else if (_.isEmpty(productList)) {
      return (
        <View style={{ marginLeft: 13, marginTop: 13 }}>
          <Text>{I18n.t('CustomerProductSegmentation.NoProductsNeedToBeRanked')}</Text>
        </View>
      );
    }

    return (
      <View>
        {_.map(productList, (item, index) => (
          <ProductItem
            data={item}
            navigation={navigation}
            key={`ProductSegmentation-${index}`}
            fields={this.fields}
            currentDesc={this.currentDesc}
          />
        ))}
      </View>
    );
  }
}

const select = (state, screen) => ({
  cascadeIndex: _.get(state, 'cascade.cascadeIndexs', []),
});

const act = (dispatch, props) => ({
  actions: bindActionCreators(
    {
      cascadeAddEmptyAction: cascadeAddEmpty,
    },
    dispatch,
  ),
  dispatch,
});

export default connect(select, act)(CustomerProductSegmentation);
