/**
 * * 绿谷定制产品定级 产品
 * @flow
 */

import React from 'react';
import _ from 'lodash';
import { View, Text, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import themes from '../../../../tabs/common/theme';
import SegmentationForm from './SegmentationForm';
import handleUpdateCascade, {
  CASCADE_CREATE,
  CASCADE_DELETE,
} from '../../../../utils/helpers/handleUpdateCascade';
import CheckBox from '../../../../tabs/common/components/CheckBox';
import { CUSTOMER_SEGMENTATION } from './const';

type Prop = {
  data: object,
  navigation: any,
  fields: Array,
  cascadeProductList: any,
  currentDesc: any,
  dispatch: void,
};

type State = {
  segmentationStatus: boolean,
};

class ProductItem extends React.Component<Prop, State> {
  productId = _.get(this.props, 'data.product');

  state = {
    segmentationStatus: false, //* 定级表单显示
  };

  changeSegmentationStatus = () => {
    const { fields, dispatch } = this.props;
    const { segmentationStatus } = this.state;

    if (segmentationStatus) {
      //* 隐藏定级表单，删除已储存的
      handleUpdateCascade({
        data: { _id: this.productId },
        relatedListName: CUSTOMER_SEGMENTATION,
        status: CASCADE_DELETE,
        dispatch,
      });
    } else {
      // * 显示表单，统一新增保存到cascade，value为undefined，用于表单验证，必填项为underfined,非必填项为null
      const fieldData = { product: this.productId };

      _.each(fields, (item) => {
        const field = _.get(item, 'field');
        const is_required = _.get(item, 'is_required');
        if (field && is_required) {
          fieldData[field] = undefined;
        } else {
          fieldData[field] = null;
        }
      });

      handleUpdateCascade({
        data: fieldData,
        relatedListName: CUSTOMER_SEGMENTATION,
        status: CASCADE_CREATE,
        dispatch,
        fakeId: this.productId,
      });
    }

    this.setState({ segmentationStatus: !segmentationStatus });
  };

  renderProductRow = (data) => {
    const { segmentationStatus } = this.state;
    return (
      <CheckBox
        checked={segmentationStatus}
        style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}
        handleCheck={this.changeSegmentationStatus}
        disabled={false}
      >
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              width: '70%',
              marginLeft: 20,
            }}
          >
            {_.get(data, 'product__r.name') || ''}
          </Text>
        </View>
      </CheckBox>
    );
  };

  render() {
    const { segmentationStatus } = this.state;
    const { data, fields, currentDesc, navigation, cascadeProductList, dispatch } = this.props;
    const segmentationData = _.get(cascadeProductList, this.productId, {});
    return (
      <View>
        <View style={[styles.rowItem]}>
          {this.renderProductRow(data)}
          {segmentationStatus && (
            <SegmentationForm
              productId={this.productId}
              segmentationData={segmentationData}
              fields={fields}
              dispatch={dispatch}
              currentDesc={currentDesc}
              navigation={navigation}
            />
          )}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  rowItem: {
    marginHorizontal: themes.h_spacing_lg,
    paddingVertical: themes.v_spacing_lg,
    justifyContent: 'center',
  },
});

const select = (state, screen) => ({
  cascadeProductList: _.get(state, `cascade.cascadeList.${CUSTOMER_SEGMENTATION}`, {}),
});

export default connect(select)(ProductItem);
