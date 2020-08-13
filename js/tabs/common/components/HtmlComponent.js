/**
 * @flow
 */

import React from 'react';
import _ from 'lodash';
import { Dimensions, Text } from 'react-native';
import HTML from 'react-native-render-html';
import { isHTML } from '../../../utils/util';

/**
 * * 渲染简单的HTML，同时支持纯文本（也就是 Text）
 * @param {*} param0
 */
export default function HtmlComponent({
  html,
  navigation,
  textStyle,
  ...others
}: {
  html: string,
  navigation: any,
  textStyle: any,
}) {
  return isHTML(html) ? (
    <HTML
      html={html}
      imagesMaxWidth={Dimensions.get('window').width}
      onLinkPress={(evt, href) => {
        navigate(href, navigation);
      }}
      {...others}
    />
  ) : (
    <Text style={textStyle} {...others}>
      {html}
    </Text>
  );
}

const navigate = (href, navigation) => {
  if (!href || _.includes(href, 'http') || _.isEmpty(navigation)) return;
  const _routerParms = getRouter(href);

  const _id = _.get(_routerParms, 'id');
  const _recordType = _.get(_routerParms, 'recordType');
  const _objectApiName = _.get(_routerParms, 'objectApiName');

  if (!_id || !_recordType || !_objectApiName) return;

  const navParam = {
    objectApiName: _objectApiName,
    record_type: _recordType,
    id: _id,
  };

  navigation.navigate('Detail', {
    navParam,
  });
};

const getRouter = (href) => {
  // 数组的平行赋值，误删
  const [unuse, object, objectApiName, id, typeCompose] = href.split('/');
  if (_.isNaN(parseFloat(id)) || !typeCompose) return;
  const [pageType, record, recordType] = typeCompose.split(/\?|=/);
  const result = {
    objectApiName,
    id,
    pageType,
    recordType,
  };
  return result;
};
