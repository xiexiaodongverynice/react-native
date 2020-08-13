/**
 * @flow
 */

import React from 'react';
import { View, Text } from 'react-native';
import { ListItem } from 'native-base';
import _ from 'lodash';
import { connect } from 'react-redux';
import CallProductRowItem from './CallProductRowItem';
import LoadingScreen from '../../../tabs/common/LoadingScreen';
import I18n from '../../../i18n';

type Prop = {
  token: string,
  disabled: boolean,
  objectDescription: any,
  navigation: any,
  pageType: string,
  pageTypeLevel: 'main' | 'sub',
  checkClmList: Array,
  defaultClmList: Array,
  hideProductReaction: boolean,
  showProductImportance: boolean,
  checkedProductList: Array<any>,
  checkKeyMessageList: Array,
  defaultProductList: Array<any>,
  defaultKeyMessageList: Array, //* 所有产品下的关键信息
  dispatch: void,
  parentCallId: any,
};

class CallProductForm extends React.Component<Prop, {}> {
  renderProductList = () => {
    const {
      token,
      objectDescription,
      navigation,
      disabled,
      pageType,
      defaultProductList,
      checkKeyMessageList,
      checkedProductList,
      defaultKeyMessageList,
      hideProductReaction,
      showProductImportance,
      checkClmList,
      defaultClmList,
      dispatch,
      parentCallId,
    } = this.props;

    const callProductReaction = _.get(
      _.find(_.get(objectDescription, 'items'), { api_name: 'call_product' }),
      'fields',
    );
    const callKeyMessageReaction = _.get(
      _.find(_.get(objectDescription, 'items'), { api_name: 'key_message' }),
      'fields',
    );
    const productReaction = _.get(_.find(callProductReaction, { api_name: 'reaction' }), 'options');
    const productImportance = _.get(
      _.find(callProductReaction, { api_name: 'importance' }),
      'options',
    );

    const keyMessageReaction = _.get(
      _.find(callKeyMessageReaction, { api_name: 'reaction_options' }),
      'options',
    );

    if (pageType === 'detail') {
      return _.map(checkedProductList, (item, index) => {
        const messageList = _.filter(
          checkKeyMessageList,
          (message) =>
            _.get(message, 'product') === _.get(item, 'product') && _.get(item, 'product'),
        );
        const defaultProduct = _.find(defaultProductList, {
          product: item.product,
        });

        const defaultMessageList = _.filter(
          defaultKeyMessageList,
          (message) =>
            _.get(message, 'product') && _.get(message, 'product') === _.get(item, 'product'),
        );

        const viewKey = _.get(item, 'id') + index + '';

        return (
          <View key={viewKey}>
            <CallProductRowItem
              key={viewKey}
              disabled={disabled}
              objectDescription={objectDescription}
              checkedMessageList={messageList}
              keyMessageReaction={keyMessageReaction}
              defaultMessageList={defaultMessageList}
              productReaction={productReaction}
              productImportance={productImportance}
              navigation={navigation}
              productItem={item}
              dispatch={dispatch}
              parentCallId={parentCallId}
              defaultProduct={defaultProduct}
              hideProductReaction={hideProductReaction}
              showProductImportance={showProductImportance}
              pageType={pageType}
            />
          </View>
        );
      });
    }
    return _.map(defaultProductList, (item, index) => {
      const messageList = _.filter(
        checkKeyMessageList,
        (message) =>
          _.get(message, 'product') && _.get(message, 'product') === _.get(item, 'product'),
      );

      const defaultMessageList = _.filter(
        defaultKeyMessageList,
        (message) =>
          _.get(message, 'product') && _.get(message, 'product') === _.get(item, 'product'),
      );

      const selectedProduct = _.find(checkedProductList, {
        product: item.product,
      });
      const viewKey = _.get(item, 'id') + index;

      return (
        <View key={viewKey}>
          <CallProductRowItem
            disabled={disabled}
            defaultClmList={defaultClmList}
            checkClmList={checkClmList}
            objectDescription={objectDescription}
            checkedMessageList={messageList}
            defaultMessageList={defaultMessageList}
            keyMessageReaction={keyMessageReaction}
            productReaction={productReaction}
            productImportance={productImportance}
            navigation={navigation}
            productItem={selectedProduct}
            defaultProduct={item}
            pageType={pageType}
            dispatch={dispatch}
            parentCallId={parentCallId}
            hideProductReaction={hideProductReaction}
            showProductImportance={showProductImportance}
          />
        </View>
      );
    });
  };

  render() {
    const { pageType, defaultProductList } = this.props;
    if (pageType !== 'detail' && defaultProductList === '') {
      return <LoadingScreen isNormalSized />;
    }

    if (pageType !== 'detail' && _.isEmpty(defaultProductList)) {
      return (
        <ListItem>
          <Text>{I18n.t('CallProductForm.NoRelatingProducts')}</Text>
        </ListItem>
      );
    }

    return <View>{this.renderProductList()}</View>;
  }
}

const select = (state, screen) => ({
  objectDescription: state.settings.objectDescription,
});

export default connect(select)(CallProductForm);
