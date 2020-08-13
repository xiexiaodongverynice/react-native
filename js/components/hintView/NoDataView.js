/**
 * @flow
 * * 该模块用于提供无数据显示组件
 */

import React from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
import I18n from '../../i18n';
import themes from '../../tabs/common/theme';
import NoDataPlaceholder from '../common/NoDataPlaceholder';

/**
 * * 用于搜索页，显示无数据
 */
const NoSearchDataView = () => <NoDataPlaceholder text="暂无搜索内容" />;

/**
 * * 用于列表底部显示
 * @param {*} props
 */
const NoMoreDataView = (props: { isNormalSized: boolean, tip: string }) => {
  const { isNormalSized, tip = I18n.t('NoMoreData.Tip') } = props;

  return (
    <View
      style={[
        styles.container,
        !isNormalSized
          ? { flex: 1, justifyContent: 'center', alignItems: 'center' }
          : { height: 60 },
      ]}
    >
      <Text>{tip}</Text>
    </View>
  );
};

//NoMoreDataView不支持提供style，这个组件允许提供style
type TypeNoMoreDataViewStylable = {
  isNormalSized: boolean,
  tip: string,
  style: {},
};
export function NoMoreDataViewStylable(props: TypeNoMoreDataViewStylable) {
  const { isNormalSized, tip = I18n.t('NoMoreData.Tip') } = props;

  return (
    <View
      style={[
        styles.container,
        !isNormalSized
          ? { flex: 1, justifyContent: 'center', alignItems: 'center' }
          : { height: 60 },
        props.style,
      ]}
    >
      <Text>{tip}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themes.fill_base,
  },
});

export { NoSearchDataView, NoMoreDataView };
