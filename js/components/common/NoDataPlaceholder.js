// @flow
import _ from 'lodash';
import React from 'react';
import { Text, View, Image } from 'react-native';
import I18n from '../../i18n';

type typeProps = {
  text?: string,
  height?: number,
};
export default function NoDataPlaceholder(props: typeProps) {
  let text = props.text;
  if (_.isEmpty(text)) {
    text = I18n.t('NoDataPlaceholder.PageIsEmpty');
  }

  const concrete = (
    <View style={[styles.flexDirectionCol, styles.top33p]}>
      <Image source={require('./kongzhuangtai.png')} />
      <Text
        style={[styles.color999, styles.fontSize14, styles.marginTop10, styles.textAlignCenter]}
      >
        {text}
      </Text>
    </View>
  );

  const height = props.height;
  const heightStyle = {};
  if (_.isNumber(height)) {
    heightStyle.height = height;
  }
  return <View style={[styles.flex1, styles.alignItemsCenter, heightStyle]}>{concrete}</View>;
}

const styles = {
  flex1: {
    flex: 1,
  },
  flexDirectionCol: {
    flexDirection: 'column',
  },
  top33p: {
    top: '33%',
  },
  alignItemsCenter: {
    alignItems: 'center',
  },
  color999: {
    color: '#999999',
  },
  fontSize14: {
    fontSize: 14,
  },
  marginTop10: {
    marginTop: 10,
  },
  textAlignCenter: {
    textAlign: 'center',
  },
};
