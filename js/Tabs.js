/**
 * Created by Uncle Charlie, 2017/12/11
 * 嵌套路由跳转原则
 * 抽屉套着栈路由时，navigate 遵循以下规则：
 *  1. 当前栈中寻找目标路由，如发现，则压栈
 *  2. 找不到，则去抽屉中寻找目标，发现，则清空所有栈，压入命中抽屉的路由
 *  3. 还找不到，那么就去所有抽屉中查找目标，找到之后，则是 index: 1, [0, 1]。的 reset 节奏，0 表示抽屉中命中路由栈的默认路由。
 *  *总结*
 *  如果想要在栈路由中直接切换抽屉，那么请保证所切的 routeName 一定要在抽屉中而不在当前 StackNaivgator 中。
 */
import React from 'react';
import { DrawerNavigator } from 'react-navigation';
import _ from 'lodash';

// import IndexScreen from './tabs/IndexScreen';
import SideBar from './tabs/common/SideBar';
// import SearchBarScreen from './tabs/subScreen/SearchBarScreen';
import matchIcon from './utils/menuIcon';
import { intlValue } from './utils/crmIntlUtil';
import { createDrawer, STACK_TYPES, getApiNameFromData, getDrawerName } from './utils/routeUtil';

const TAB_PERMISSION_PREFIX = 'tab.';

export default function Navigations({ items = [], size }, permission, { dispatch }) {
  // only tab.* keys is needed

  const avaliableTabs = _.sortBy(items, ['display_order']).filter((item) => {
    const permissionKey = TAB_PERMISSION_PREFIX + item.api_name;
    const tabPermission = _.get(permission, permissionKey);
    const hiddenDevices = _.get(item, 'hidden_devices', []);
    //* 兼容过去菜单配置，没有设置show_app时默认展示
    const showApp = _.isEmpty(item.show_app) ? ['CRM'] : item.show_app;
    // only show tabs below permissions.

    return (
      _.includes(showApp, 'CRM') && !_.includes(hiddenDevices, 'cellphone') && tabPermission === 2
    );
  });

  const menuList = [
    {
      name: intlValue('tab.home'),
      api_name: 'home',
      routeName: getDrawerName('home'),
      icon: 'home',
      bg: '#C5F442',
    },
    ...avaliableTabs.map((item) => ({
      name: item.label,
      routeName: getDrawerName(getApiNameFromData(item), item.record_type),
      p_api_name: item.p_api_name,
      api_name: item.api_name,
      type: item.type,
      icon: matchIcon(item) || 'phone-portrait',
      bg: '#C5F442',
      tabIcon: _.get(item, 'tabIcon', {}),
    })),
    {
      name: intlValue('tab.settings'),
      api_name: 'settings',
      routeName: getDrawerName('settings'),
      icon: 'settings',
      bg: '#C5F442',
    },
  ];

  const drawerItemsFromBackend = avaliableTabs.map((item) => ({
    ...item,
    type: STACK_TYPES.reactable,
    stackPayload: {
      config: { initialRouteName: item.type === 'external_page' ? 'WebView' : 'Index' },
      data: { item, dispatch },
    },
  }));

  const drawer = createDrawer([
    ...drawerItemsFromBackend,
    // 四个自定义路由
    {
      object_describe_api_name: 'home',
      type: STACK_TYPES.common,
      stackPayload: { config: { initialRouteName: 'Home' } },
    },
    {
      object_describe_api_name: 'settings',
      type: STACK_TYPES.common,
      stackPayload: { config: { initialRouteName: 'Settings' } },
      options: ({ navigation }) => ({
        title: intlValue('tab.settings'),
      }),
    },
    {
      object_describe_api_name: 'calendar',
      type: STACK_TYPES.common,
      stackPayload: { config: { initialRouteName: 'Calendar' } },
      options: ({ navigation }) => ({
        title: intlValue('tab.calender'),
      }),
    },
    {
      object_describe_api_name: 'notice',
      type: STACK_TYPES.common,
      stackPayload: { config: { initialRouteName: 'NoticeList' } },
      options: ({ navigation }) => ({
        title: intlValue('tab.settings'),
      }),
    },
  ]);

  return DrawerNavigator(drawer, {
    initialRouteName: getDrawerName('home'),
    contentOptions: {
      activeTintColor: '#e91e63',
    },
    navigationOptions: {
      drawerLockMode: 'locked-closed',
    },
    contentComponent: (props) => <SideBar {...props} menuData={menuList} />,
  });
}
