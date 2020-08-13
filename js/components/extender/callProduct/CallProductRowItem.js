/**
 * @flow
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import _ from 'lodash';
import { Button, ActionSheet, Text } from 'native-base';
import I18n from '../../../i18n';
import CallKeyMessageForm from './CallKeyMessageForm';
import themes from '../../../tabs/common/theme';
import CheckBox from '../../../tabs/common/components/CheckBox';
import preventDuplicate from '../../../tabs/common/helpers/preventDuplicate';
import { CALL_MESSAGE_KEY, CALL_PRODUCT_KEY, CALL_CLM_KEY } from './const';
import handleUpdateCascade, {
  CASCADE_CREATE,
  CASCADE_DELETE,
  CASCADE_UPDATE,
} from '../../../utils/helpers/handleUpdateCascade';

type Prop = {
  productReaction: any,
  productImportance: any,
  productItem: any, // * 选中产品具体信息
  objectDescription: any,
  checkedMessageList: any,
  defaultMessageList: any, // * 产品下关键信息
  keyMessageReaction: any,
  navigation: any,
  defaultClmList: Array,
  disabled: boolean,
  pageType?: string,
  checkClmList: Array,
  defaultProduct: any,
  isLastRow: boolean,
  hideProductReaction: ?boolean,
  showProductImportance: ?boolean,
  dispatch: void,
  parentCallId: any,
};

export default class CallProductRowItem extends React.Component<Prop, State> {
  static defaultProps = {
    pageType: 'detail',
  };

  //* 清空产品下已选中的关键信息
  clearMatchMessage = (product) => {
    const { checkedMessageList, dispatch, parentCallId } = this.props;

    const selectedMessagesList = _.filter(
      checkedMessageList,
      (message) => _.get(message, 'product') === product,
    );

    if (_.isEmpty(selectedMessagesList)) return;

    const messageParams = _.map(selectedMessagesList, (select) => {
      const params = {};
      const _id = _.get(select, '_id');
      if (_id) {
        _.set(params, '_id', _id);
      } else {
        params.id = _.get(select, 'id');
      }
      return params;
    });

    handleUpdateCascade({
      data: messageParams,
      relatedListName: CALL_MESSAGE_KEY,
      status: CASCADE_DELETE,
      parentId: parentCallId,
      dispatch,
    });
  };

  //* 清空产品下已选中的媒体信息
  clearClm = (product) => {
    const { checkClmList, defaultClmList, dispatch, parentCallId } = this.props;

    const clmIdMap = _.chain(defaultClmList)
      .filter((clm) => _.get(clm, 'product') === product)
      .map((item) => _.get(item, 'id'))
      .value();

    const selectedClmList = _.filter(checkClmList, (message) =>
      clmIdMap.includes(_.get(message, 'clm_presentation')),
    );

    if (_.isEmpty(selectedClmList)) return;

    const clmParams = _.map(selectedClmList, (select) => {
      const params = {};
      const _id = _.get(select, '_id');
      if (_id) {
        _.set(params, '_id', _id);
      } else {
        params.id = _.get(select, 'id');
      }
      return params;
    });

    handleUpdateCascade({
      data: clmParams,
      relatedListName: CALL_CLM_KEY,
      status: CASCADE_DELETE,
      parentId: parentCallId,
      dispatch,
    });
  };

  handleCheck = (productChecked: any) => {
    const { dispatch, parentCallId, defaultProduct, productItem } = this.props;

    const product = _.get(defaultProduct, 'product__r.id');
    const product__r = _.get(defaultProduct, 'product__r', {});
    const selectedProduct = {
      id: productItem && productItem.id,
      product,
      product__r,
      reaction: '',
    };

    const _id = _.get(productItem, '_id');
    if (_id) {
      _.set(selectedProduct, '_id', _id);
    }

    if (productChecked) {
      // * delete
      handleUpdateCascade({
        data: selectedProduct,
        relatedListName: CALL_PRODUCT_KEY,
        status: CASCADE_DELETE,
        parentId: parentCallId,
        dispatch,
      });
      this.clearMatchMessage(product);
      this.clearClm(product);
    } else {
      // * create
      handleUpdateCascade({
        data: selectedProduct,
        relatedListName: CALL_PRODUCT_KEY,
        status: CASCADE_CREATE,
        parentId: parentCallId,
        dispatch,
      });
    }
  };

  selectOpinion = (type) => {
    const {
      productReaction,
      productImportance,
      dispatch,
      parentCallId,
      disabled,
      productItem,
    } = this.props;

    if (disabled) {
      return;
    }
    const productType = type === 'reaction' ? productReaction : productImportance;

    let selectedProduct;
    const buttons = _.map(productType, (x) => x.label);
    const optionValue = [].concat(buttons, [I18n.t('common_cancel')]);
    ActionSheet.show(
      {
        options: optionValue,
        cancelButtonIndex: optionValue.length - 1,
        destructiveButtonIndex: optionValue.length - 1,
        title: I18n.t('select_action'),
      },
      (buttonIndex) => {
        if (buttonIndex >= productType.length) {
          return;
        }

        const selectedOption = _.find(productType, {
          label: `${optionValue[buttonIndex]}`,
        });

        selectedProduct = Object.assign({}, productItem, {
          [type]: selectedOption.value,
        });

        handleUpdateCascade({
          data: selectedProduct,
          relatedListName: CALL_PRODUCT_KEY,
          status: CASCADE_UPDATE,
          parentId: parentCallId,
          dispatch,
        });
      },
    );
  };

  renderRight = (productChecked) => {
    const {
      pageType,
      productItem,
      productReaction,
      productImportance,
      hideProductReaction,
      showProductImportance,
    } = this.props;

    const reaction = _.get(productItem, 'reaction');
    const importance = _.get(productItem, 'importance');

    //* 根据reaction查找productReaction中对应的label
    const reactionLabel = !reaction
      ? pageType !== 'detail'
        ? '选择反馈'
        : ''
      : _.chain(productReaction)
          .find((pr) => pr.value === reaction)
          .get('label')
          .value();
    const importanceLabel = !importance
      ? pageType !== 'detail'
        ? '重要度'
        : ''
      : _.chain(productImportance)
          .find((pr) => pr.value === importance)
          .get('label')
          .value();

    if (pageType === 'detail') {
      return (
        <View
          style={{
            flex: 1,
            // textAlign: 'right',
            paddingRight: 4,
            flexDirection: 'row',
            justifyContent: 'flex-end',
          }}
        >
          {showProductImportance && (
            <Text
              style={{
                marginRight: 20,
                fontSize: 13,
                fontFamily: 'PingFangSC-Regular',
                color: '#666666',
              }}
            >
              {importanceLabel}
            </Text>
          )}
          {!hideProductReaction && (
            <Text style={{ fontSize: 13, fontFamily: 'PingFangSC-Regular', color: '#666666' }}>
              {reactionLabel}
            </Text>
          )}
        </View>
      );
    } else {
      return (
        <View
          style={{
            flex: 1,
            // textAlign: 'right',
            paddingRight: 4,
            flexDirection: 'row',
            justifyContent: 'flex-end',
          }}
        >
          {showProductImportance && productChecked && (
            <Button
              transparent
              onPress={preventDuplicate(() => this.selectOpinion('importance'), 1000)}
            >
              <Text>{productItem && (importanceLabel || '重要度')}</Text>
            </Button>
          )}
          {!hideProductReaction && productChecked && (
            <Button
              transparent
              onPress={preventDuplicate(() => this.selectOpinion('reaction'), 1000)}
            >
              <Text>{productItem && (reactionLabel || '选择反馈')}</Text>
            </Button>
          )}
        </View>
      );
    }
  };

  renderMessageForm = (productChecked) => {
    const {
      productItem,
      objectDescription,
      checkedMessageList,
      keyMessageReaction,
      navigation,
      disabled,
      pageType,
      defaultMessageList,
      dispatch,
      parentCallId,
    } = this.props;

    if (_.isNull(checkedMessageList)) {
      return null;
    } else {
      return (
        productChecked && (
          <CallKeyMessageForm
            objectDescription={objectDescription}
            keyMessageReaction={keyMessageReaction}
            navigation={navigation}
            productItem={productItem}
            existMessageList={checkedMessageList}
            defaultMessageList={defaultMessageList}
            dispatch={dispatch}
            parentCallId={parentCallId}
            disabled={disabled}
            pageType={pageType}
          />
        )
      );
    }
  };

  renderItem = (productChecked) => {
    const { productItem, disabled, defaultProduct, pageType } = this.props;

    if (pageType !== 'detail') {
      return (
        <CheckBox
          key={_.get(productItem, 'id') || _.get(defaultProduct, 'id')}
          checked={productChecked}
          style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}
          handleCheck={() => {
            if (pageType === 'detail') return;
            this.handleCheck(productChecked);
          }}
          disabled={disabled}
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
                width: '45%',
                marginLeft: 20,
              }}
            >
              {_.get(defaultProduct, 'product__r.name') || ''}
            </Text>
            {this.renderRight(productChecked)}
          </View>
        </CheckBox>
      );
    } else {
      return (
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
              width: '45%',
              fontSize: 13,
              fontFamily: 'PingFangSC-Regular',
              color: '#666666',
            }}
          >
            {_.get(defaultProduct, 'product__r.name') || ''}
          </Text>
          {this.renderRight(productChecked)}
        </View>
      );
    }
  };

  render() {
    const { productItem, isLastRow } = this.props;
    const productChecked = !_.isEmpty(productItem) || false;

    return (
      <View>
        <View style={[styles.rowItem]}>
          {this.renderItem(productChecked)}
          {this.renderMessageForm(productChecked)}
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
