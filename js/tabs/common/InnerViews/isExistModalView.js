/**
 * @flow
 */

import _ from 'lodash';
import React from 'react';
import { View, Text } from 'react-native';

import ModalActionView from './ModalActionView';
import { checkExpression } from '../helpers/recordHelper';

const isExistModalView = (
  relateComponent,
  parentData,
  navigation,
  pageType,
  pageTypeLevel,
  isTopLevel = false,
  component, //实际是Array
) => {
  const modalViews = [];
  const isShow = _.get(relateComponent, 'show_in_phone_detail', false);
  if (!isShow) return false;
  const modalActions = _.chain(relateComponent)
    .get('actions', [])
    .filter((_action) => {
      const actioncode = _.get(_action, 'action');
      if (
        _.get(_action, 'show_render_mode', false) === 'modal' &&
        _.toUpper(actioncode) === 'ADD'
      ) {
        return true;
      }
    })
    .valueOf();
  if (!_.isEmpty(modalActions)) {
    // _.each(modalActions, (action) => {
    //   //* 检查hidden_expression
    //   const hiddenExpression = _.get(action, 'hidden_expression', false);
    //   if (hiddenExpression && checkExpression(hiddenExpression, {}, parentData)) return;

    //* 添加action modal view
    modalViews.push(
      <ModalActionView
        modalActions={modalActions}
        relateComponent={relateComponent}
        parentData={parentData}
        navigation={navigation}
        pageType={pageType}
        pageTypeLevel={pageTypeLevel}
        isTopLevel={isTopLevel}
        component={component}
      />,
    );
    // });
    return modalViews;
  }

  return false;
};

export { isExistModalView };
