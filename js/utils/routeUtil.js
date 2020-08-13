/**
 * @flow
 */
import React from 'react';
import { StackNavigator } from 'react-navigation';
import _ from 'lodash';
import SettingsScreen from '../tabs/SettingsScreen';
import ChangePasswordScreen from '../tabs/subScreen/ChangePasswordScreen';
import TerritoryChangeScreen from '../tabs/subScreen/TerritoryChangeScreen';

// import IndexScreen from '../tabs/IndexScreen';
import VideoScreen from '../components/formComponents/video/VideoScreen';
import { IndexScreen } from '../tabs/customized/jmkx';
import DetailScreen from '../tabs/DetailPages/DetailScreen';
import EditScreen from '../tabs/EditPages/EditScreen';
import EditModalScreen from '../tabs/EditPages/EditModalScreen';
import CreateScreen from '../tabs/CreatePages/CreateScreen';
import OptionSelect from '../tabs/subScreen/OptionSelect';
import loadingScreen from '../tabs/common/LoadingScreen';
import errorScreen from '../tabs/common/ErrorScreen';
import NoticeDetailScreen from '../tabs/notice/NoticeDetailScreen';
import NoticeListScreen from '../tabs/notice/NoticeListScreen';
import RelationshipSelect from '../tabs/subScreen/RelationshipSelect';
import DetailModalScreen from '../tabs/DetailPages/DetailModalScreen';
import CreateModalScreen from '../tabs/CreatePages/CreateModalScreen';
import WebScreen from '../tabs/subScreen/WebScreen';
import WebPageScreen from '../tabs/subScreen/WebPageScreen';
import WorkFlowOpinionScreen from '../tabs/subScreen/WorkFlowOpinionScreen';
import WorkFlowSelectScreen from '../tabs/subScreen/WorkFlowSelectScreen';
import DocViewerScreen from '../tabs/subScreen/DocViewerScreen';
import WebViewScreen from '../tabs/subScreen/WebViewScreen';
import MapScreen from '../tabs/subScreen/MapScreen';
import CalenderScreen from '../tabs/calender/CalenderScreen';
import { pushNavigationHistory } from '../actions/navigation';
import WebItemScreen from '../tabs/subScreen/WebItemScreen';
import PhotoScreen from '../components/formComponents/photo/PhotoScreen';
import PhotoDetailScreen from '../components/formComponents/photo/PhotoDetailScreen';
import WeekTemplateScreen from '../tabs/template/WeekTemplateScreen';
import DayTemplateScreen from '../tabs/template/DayTemplateScreen';
import DataSourceListScreen from '../tabs/subScreen/DataSourceListScreen';
import SelectListScreen from '../tabs/common/SelectList';
import CopySelect from '../tabs/template/CopySelect';
import PreviewScreen from '../tabs/subScreen/PreviewScreen';
import SelectTree from '../tabs/subScreen/SelectTree';
import RelatedScreen from '../tabs/subScreen/RelatedScreen';
import FeatureFilmsOptionView from '../tabs/subScreen/FeatureFilmsOptionView';
import TypeSelect from '../components/extender/calendar/TypeSelectScreent';
import AttachmentView from '../components/formComponents/attachment/AttachmentView';
import TimeLineScreen from '../tabs/subScreen/TimeLineScreen';
// import SearchBarScreen from '../tabs/subScreen/SearchBarScreen';
import NewHomeScreen from '../tabs/new-home/NewHomeScreen';
import { intlValue } from './crmIntlUtil';
import AllObjectList from '../tabs/new-home/objects/AllObjectList';
import RelateModalScreen from '../tabs/subScreen/RelateModalScreen';
import ApprovalCreateScreen from '../tabs/subScreen/ApprovalCreateScreen';

const craftReactableScreenInfo = (item, params, dispatch) =>
  Object.assign(
    {},
    {
      objectApiName: item.object_describe_api_name,
      recordType: item.record_type,
    },
    _.result(params, 'navigation.state.params.screenInfo', {}),
  );
const pushNavigation = (params, dispatch, onRefresh = () => null, pageType = '') => {
  const { navigation } = params;
  const key = _.get(navigation, 'state.key');
  if (key) {
    dispatch(
      pushNavigationHistory({
        key,
        onRefresh,
        pageType,
      }),
    );
  }
};

const reactableScreensCreator = ({ item, dispatch }) => ({
  Index: {
    screen: (params, b, c) => (
      <IndexScreen
        {...params}
        screenInfo={craftReactableScreenInfo(item, params, dispatch)}
        onComponentDidMount={(onRefresh) => {
          pushNavigation(params, dispatch, onRefresh, 'index');
        }}
      />
    ),
  },
  Detail: {
    screen: (params) => (
      <DetailScreen
        {...params}
        screenInfo={craftReactableScreenInfo(item, params, dispatch)}
        onComponentDidMount={(onRefresh) => {
          pushNavigation(params, dispatch, onRefresh, 'detail');
        }}
      />
    ),
  },
  Edit: {
    screen: (params) => (
      <EditScreen
        {...params}
        screenInfo={craftReactableScreenInfo(item, params, dispatch)}
        onComponentDidMount={(onRefresh) => {
          pushNavigation(params, dispatch, onRefresh, 'edit');
        }}
      />
    ),
  },
  Create: {
    screen: (params) => (
      <CreateScreen
        {...params}
        screenInfo={craftReactableScreenInfo(item, params, dispatch)}
        onComponentDidMount={(onRefresh) => {
          pushNavigation(params, dispatch, onRefresh, 'create');
        }}
      />
    ),
  },
  Option: {
    screen: (params) => (
      <OptionSelect {...params} screenInfo={craftReactableScreenInfo(item, params, dispatch)} />
    ),
  },
  DataSourceList: {
    screen: (params) => (
      <DataSourceListScreen
        {...params}
        screenInfo={craftReactableScreenInfo(item, params, dispatch)}
      />
    ),
  },
  FeatureFilmsOption: {
    screen: (params) => (
      <FeatureFilmsOptionView
        {...params}
        screenInfo={craftReactableScreenInfo(item, params, dispatch)}
      />
    ),
  },
  SelectTree: {
    screen: (params) => (
      <SelectTree {...params} screenInfo={craftReactableScreenInfo(item, params, dispatch)} />
    ),
  },
  Relation: {
    screen: (params) => (
      <RelationshipSelect
        {...params}
        screenInfo={craftReactableScreenInfo(item, params, dispatch)}
      />
    ),
  },
  WebView: {
    screen: (params) => (
      <WebViewScreen
        {...params}
        {...item}
        screenInfo={craftReactableScreenInfo(item, params, dispatch)}
      />
    ),
  },
});

const commonScreens = {
  Home: {
    screen: NewHomeScreen,
    navigationOptions: {
      title: intlValue('tab.home'),
    },
  },
  Index: {
    screen: (params) => <IndexScreen {...params} />,
  },
  NoticeDetail: {
    screen: NoticeDetailScreen,
    navigationOptions: {
      headerTitle: intlValue('tab.notice'),
    },
  },
  NoticeList: {
    screen: NoticeListScreen,
    navigationOptions: {
      headerTitle: intlValue('tab.notice'),
    },
  },
  Detail: {
    screen: DetailScreen,
  },
  Edit: {
    screen: (params) => <EditScreen {...params} screenInfo />,
  },
  Create: {
    screen: (params) => <CreateScreen {...params} screenInfo />,
  },
  Option: {
    screen: (params) => <OptionSelect {...params} screenInfo />,
  },
  FeatureFilmsOption: {
    screen: (params) => <FeatureFilmsOptionView {...params} screenInfo />,
  },
  SelectTree: {
    screen: (params) => <SelectTree {...params} screenInfo />,
  },
  Relation: {
    screen: (params) => <RelationshipSelect {...params} screenInfo />,
  },
  EditModal: {
    screen: (params) => <EditModalScreen {...params} />,
  },
  CreateModal: {
    screen: (params) => <CreateModalScreen {...params} />,
  },
  DetailModal: {
    screen: (params) => <DetailModalScreen {...params} />,
  },
  DataSourceList: {
    screen: (params) => <DataSourceListScreen {...params} />,
  },
  Web: {
    screen: (params) => <WebScreen {...params} />,
  },
  WebPageScreen: {
    screen: (params) => <WebPageScreen {...params} />,
  },
  DocView: {
    screen: (params) => <DocViewerScreen {...params} />,
  },
  WebItem: {
    screen: (params) => <WebItemScreen {...params} />,
  },
  WebView: {
    screen: (params) => <WebViewScreen {...params} />,
  },
  Map: {
    screen: (params) => <MapScreen {...params} />,
  },
  Video: {
    screen: (params) => <VideoScreen {...params} />,
  },
  Photo: {
    screen: (params) => <PhotoScreen {...params} />,
  },
  PhotoDetail: {
    screen: (params) => <PhotoDetailScreen {...params} />,
  },
  WeekTemplate: {
    screen: (params) => <WeekTemplateScreen {...params} />,
  },
  DayTemplate: {
    screen: (params) => <DayTemplateScreen {...params} />,
  },
  WorkFlowSelect: {
    screen: (params) => <WorkFlowSelectScreen {...params} />,
  },
  WorkFlowOpinion: {
    screen: (params) => <WorkFlowOpinionScreen {...params} />,
  },
  SelectList: {
    screen: (params) => <SelectListScreen {...params} />,
  },
  RelatedList: {
    screen: (params) => <RelatedScreen {...params} />,
  },
  CopySelect: {
    screen: (params) => <CopySelect {...params} />,
  },
  TypeSelect: {
    screen: (params) => <TypeSelect {...params} />,
  },
  AttachmentView: {
    screen: (params) => <AttachmentView {...params} />,
  },
  Preview: {
    screen: (params) => <PreviewScreen {...params} />,
  },
  TimeLine: {
    screen: (params) => <TimeLineScreen {...params} />,
  },
  AllObjectList: {
    screen: (params) => <AllObjectList {...params} />,
  },
  RelateModal: {
    screen: (params) => <RelateModalScreen {...params} />,
  },
  Calendar: {
    screen: CalenderScreen,
    navigationOptions: {
      headerTitle: intlValue('tab.calender'),
    },
  },
  Approval: {
    screen: (params) => <ApprovalCreateScreen {...params} />,
  },
  Loading: {
    screen: loadingScreen,
  },
  Error: {
    screen: errorScreen,
  },
  Settings: {
    screen: SettingsScreen,
    navigationOptions: {
      headerTitle: intlValue('tab.settings'),
    },
  },
  ChangePassword: {
    screen: ChangePasswordScreen,
    navigationOptions: {
      headerTitle: intlValue('tab.change_password'),
    },
  },
  TerritoryChange: {
    screen: TerritoryChangeScreen,
    navigationOptions: {
      headerTitle: intlValue('tab.territory_change'),
    },
  },
};

/**
 * 不论是一级还是二级菜单，object_describe_api_name 为路由唯一标记的一部分，api_name 做替补。
 * https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
 * @param {Object} item
 */
export function getApiNameFromData(item: Object) {
  return item.object_describe_api_name || item.api_name;
}

// :? 类型兼容 null，否则不兼容
// 项目中与 undefined 不同的是，null 大多数为有效值。
export function getDrawerName(apiName: string, recordType: ?string = 'master') {
  function correctApiName(val) {
    switch (val) {
      case 'schedule':
        return 'calendar';
      case 'fc_calendar':
        return 'calendar';
      case 'fc_notice':
        return 'notice';
      case 'tab_customer':
        return 'customer';
      case 'tab_call_plan':
        return 'call_plan';
      default:
        return val;
    }
  }
  const result = correctApiName(apiName);
  // 这里 null 被视作是有效的 recordType.
  return `${result}___` + (recordType === null || !_.isEmpty(recordType) ? recordType : 'master');
}

let drawerRouteNames = [];
export const STACK_TYPES = {
  common: 'common',
  reactable: 'reactableScreens',
};
export function createStack({ type = 'common', payload = {} }: { type: string, payload: Object }) {
  return StackNavigator(
    {
      ...commonScreens,
      ...(type === STACK_TYPES.common ? {} : reactableScreensCreator(payload.data)),
    },
    {
      headerMode: 'none',
      ...payload.config,
    },
  );
}

export function createDrawer(drawerItems: Array<Object>) {
  const drawer = {};
  drawerItems.forEach((item) => {
    const { type, stackPayload = {}, options = {} } = item;
    drawer[getDrawerName(getApiNameFromData(item), item.record_type)] = {
      screen: createStack({ type, payload: stackPayload }),
      navigationOptions: options,
    };
  });
  drawerRouteNames = Object.keys(drawer);
  return drawer;
}

/**
 * 切换抽屉路由需要满足以下两个条件
 * 1. 当前（或所有） Stack 路由中没有 routeName
 * 2. 抽屉中要有 routeName
 * @param {String} name
 */
export function isDrawerNameAvaliable(name: string) {
  const totalRoutes = Object.keys({
    ...commonScreens,
    ...reactableScreensCreator({ item: {}, dispatch: {} }),
  });
  return totalRoutes.indexOf(name) < 0 && drawerRouteNames.indexOf(name) > -1;
}

/**
 * 切换抽屉请使用本函数
 * @param {Object} navigation
 * @param {String} routeName
 * @param  {...any} rest
 */
export function switchDrawer(navigation: Object, drawerName: string, ...rest: Object) {
  if (isDrawerNameAvaliable(drawerName)) {
    navigation.navigate(drawerName, ...rest);
  } else {
    throw Error('drawer not avaliable, maybe you misspell route name: ' + drawerName);
  }
}
