/**
 * Created by Uncle Charlie, 2018/01/15
 * @flow
 */

import React from 'react';
import { View, Text } from 'react-native';
import _ from 'lodash';
import I18n from '../../i18n';

const BAR_COLOR = {
  warning_bar: {
    background: '#fdf8e3',
    color: '#aa9f83',
  },
  danger_bar: {
    background: '#f2dedf',
    color: '#c38f93',
  },
  link_bar: {
    background: '#d9e4f7',
    color: '#5f9fbc',
  },
  info_bar: {
    background: '#d9edf6',
    color: '#85a3bb',
  },
  default_bar: {
    background: '#fff',
    color: '#ababad',
  },
};

export default function({ layout }: { layout: any }) {
  const { label, render_type } = layout;
  // const label = I18n.t(_.get(renderLayout, 'label.i18n_key'), renderLayout.label);
  if (_.isEmpty(render_type)) {
    return null;
  }

  if (_.isEmpty(label)) {
    return null;
  }
  let styles = BAR_COLOR.default_bar;
  if (_.get(BAR_COLOR, render_type)) {
    styles = _.get(BAR_COLOR, render_type);
  }

  return (
    <View style={{ backgroundColor: styles.background, padding: 15 }}>
      <Text style={{ color: styles.color }}>{label}</Text>
    </View>
  );
}
