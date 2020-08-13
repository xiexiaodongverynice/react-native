/**
 * * 绿谷定制产品定级 定级表单
 * @flow
 */

import React from 'react';
import _ from 'lodash';
import { View } from 'react-native';
import { connect } from 'react-redux';
import { ListItem } from 'native-base';
import { RequiredTextView, StyledLeft, StyledBody } from '../../../../tabs/common/components';
import * as Util from '../../../../utils/util';
import themes from '../../../../tabs/common/theme';
import EditInput from '../../../../components/formComponents/EditInput';
import IndexDataParser from '../../../../services/dataParser';
import handleUpdateCascade, { CASCADE_UPDATE } from '../../../../utils/helpers/handleUpdateCascade';
import { CUSTOMER_SEGMENTATION } from './const';
import SelectBtnView from '../../../../components/formComponents/SelectBtnView';

const SELECT_ONE = 'select_one';

type Prop = {
  cascadeProductList: object,
  // productId: string,
  fields: object,
  dispatch: void,
  currentDesc: any,
  navigation: any,
};

class ProductItem extends React.PureComponent<Prop, {}> {
  debounceSetState = (addData = {}, removeData = []) => {
    const _callback = (composeData, removeComposeData) => {
      const { cascadeProductList, dispatch } = this.props;
      const resultData = _.assign({}, cascadeProductList, composeData);

      if (!_.isEmpty(removeComposeData)) {
        _.each(removeComposeData, (e) => {
          delete resultData[e];
        });
      }

      handleUpdateCascade({
        data: resultData,
        relatedListName: CUSTOMER_SEGMENTATION,
        status: CASCADE_UPDATE,
        dispatch,
      });
    };
    Util.debounceStateUpdate(addData, removeData, _callback);
  };

  handleUpdate = (field, value, is_required) => {
    console.log('field:', field, 'value:', value);
    // * 修改valua值时判断是否必填，非必填时，为空或者underfined情况下设置为null
    // const is_required = _.get(field, 'is_required');
    // console.log('is_required:', is_required, 'value:', value);
    if (!is_required) {
      if (value == '' || value == undefined) {
        value = null;
      }
    }
    this.debounceSetState({ [field]: value });
  };

  composeSelectData = (fieldRecord) => {
    const { apiName, renderType, selected, is_required } = fieldRecord;
    if (renderType === SELECT_ONE) {
      const value = _.has(selected, '[0].id')
        ? _.get(selected, '[0].id')
        : _.get(selected, '[0].value');

      this.handleUpdate(apiName, value, is_required);
    }
  };

  renderItem = (fieldDesc, field, renderType) => {
    const { navigation } = this.props;
    if (renderType === 'text') {
      const type = _.get(fieldDesc, 'type');
      return (
        <EditInput
          type={type}
          handleChangeText={(value) =>
            this.handleUpdate(_.get(field, 'field'), value, _.get(field, 'is_required'))
          }
        />
      );
    } else if (renderType === SELECT_ONE) {
      return (
        <SelectBtnView
          handleSelect={this.composeSelectData}
          navigate={navigation.navigate}
          renderType={SELECT_ONE}
          multipleSelect={false}
          fieldDesc={fieldDesc}
          fieldLayout={field}
          disabled={false}
          record={{}}
        />
      );
    }
  };

  renderEditView = (field) => {
    const { currentDesc } = this.props;
    const renderType = _.get(field, 'render_type');
    const fieldDesc = IndexDataParser.parserFieldLabel(field, currentDesc);
    if (_.isEmpty(fieldDesc)) return null;

    const title =
      field && field.label
        ? field.label
        : fieldDesc
        ? typeof fieldDesc === 'string'
          ? fieldDesc
          : fieldDesc.label
        : '';

    return (
      <View key={`${title || ''}_item_${_.get(field, 'field', '')}`}>
        <ListItem style={{ marginLeft: 0, paddingRight: 0 }}>
          <StyledLeft>
            <RequiredTextView isRequired={field.is_required} title={title} />
          </StyledLeft>
          <StyledBody>
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'stretch',
                alignSelf: 'stretch',
              }}
            >
              {this.renderItem(fieldDesc, field, renderType)}
            </View>
          </StyledBody>
        </ListItem>
      </View>
    );
  };

  render() {
    const { fields } = this.props;

    return <View>{_.map(fields, (item) => this.renderEditView(item))}</View>;
  }
}

const select = (state, screen) => {
  const productId = _.get(screen, 'productId');
  return {
    cascadeProductList: _.get(
      state,
      `cascade.cascadeList.${CUSTOMER_SEGMENTATION}.${productId}`,
      {},
    ),
  };
};

export default connect(select)(ProductItem);
