/**
 * @flow
 */

import React from 'react';
import _ from 'lodash';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from 'native-base';
import theme from '../../../tabs/common/theme';

type TabHeaderType = {
  tabs: any,
  navDisabled: boolean, // * 是否启动日历翻页(未实现)
  activeTab: any,
  tabDayNames: Array, //* 日期
  tabNames: Array, //* 星期一、二...
  goToPage: (index) => void, //* 跳转scrollViewPage
  changeToBefore: void,
  changeToNext: void,
};

const TabHeader = (props: TabHeaderType) => {
  const {
    tabs,
    navDisabled,
    activeTab,
    changeToBefore = _.noop,
    tabDayNames,
    tabNames,
    goToPage = _.noop,
    changeToNext = _.noop,
  } = props;

  return (
    <View style={styles.tabs}>
      {navDisabled ? null : (
        <TouchableOpacity
          onPress={() => changeToBefore()}
          style={{ alignContent: 'center', flexDirection: 'column' }}
        >
          <View style={{ alignContent: 'center', flexDirection: 'column' }}>
            <Icon
              name="ios-arrow-back"
              style={{
                color: theme.fill_base_color,
                paddingLeft: 10,
                paddingTop: 10,
                fontSize: 16,
              }}
            />
          </View>
        </TouchableOpacity>
      )}

      {tabs.map((tab, i) => {
        const color = activeTab === i ? theme.fill_base_color : 'gray';
        const width = activeTab === i ? 2 : 0;
        return (
          <TouchableOpacity
            key={i}
            style={[styles.tab, { borderBottomColor: color, borderBottomWidth: width }]}
            onPress={() => goToPage(i)}
          >
            <View style={styles.tabItem}>
              <Text style={{ color, fontSize: 14 }}>{tabDayNames[i]}</Text>
              <Text style={{ color, fontSize: 14 }}>{tabNames[i]}</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {navDisabled ? null : (
        <TouchableOpacity
          onPress={() => changeToNext()}
          style={{ alignContent: 'center', flexDirection: 'column' }}
        >
          <View style={{ alignContent: 'center', flexDirection: 'column' }}>
            <Icon
              name="ios-arrow-forward"
              style={{
                color: theme.fill_base_color,
                paddingRight: 10,
                paddingTop: 10,
                fontSize: 16,
              }}
            />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default TabHeader;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  tabs: {
    flexDirection: 'row',
    marginTop: 10,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabItem: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 10,
  },
  icon: {
    width: 26,
    height: 26,
    marginBottom: 2,
  },
});
