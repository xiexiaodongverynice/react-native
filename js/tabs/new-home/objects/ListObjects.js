/**
 * @flow
 * 目前首页结构为：
 *  轮播图
 *  快捷入口
 *  列表（所有的列表，都只是部分数据以供概览）
 *    1. Tab 布局 （TabObjects）
 *    2. List 布局（ListObjects）
 *  WebView
 */
import React, { Component } from 'react';
import _ from 'lodash';
import { Container, Text } from 'native-base';
import { View, Image } from 'react-native';
import I18n from '../../../i18n/index';
import themes from '../../common/theme';
import { MainList, Artical, renderNoData } from '../helper/renderListHelper';
import ObjectPart from '../../../components/home/ObjectPart';

type Props = {
  content: Object,
  parentParam: Object,
  queryConditions: Object,
  queryState: boolean,
  homeData: any,
  onMainListItemUpdate: Function,
};
type State = {
  items: Array<Object>,
  dataList: Array<Object>,
  queryConditions: Object,
  columnNumber: number,
};
export default class extends Component<Props, State> {
  state = {
    items: [],
    dataList: [],
    queryConditions: {},
    columnNumber: 0,
  };
  componentDidMount() {
    const { content, homeData = [], queryConditions } = this.props;
    const { display_items = [], column } = content;
    const columnNumber = _.get(column, 'cellphone', 1);

    this.setState({
      items: display_items,
      dataList: homeData,
      queryConditions,
      columnNumber,
    });
  }

  static getDerivedStateFromProps(props: Object, state: Object) {
    if (props.homeData !== state.dataList) {
      const { queryConditions } = props;
      return {
        dataList: props.homeData,
        queryConditions,
        queryState: props.queryState,
      };
    }
    return null;
  }
  // 没有数据时渲染的组件
  getEmptyContent = (itemApiName: string) => {
    switch (itemApiName) {
      case 'my_todo':
        return {
          image: require('../../img/unbacklog.png'),
          text: I18n.t('no_data_todo'),
        };
      case 'notice':
        return {
          image: require('../../img/unnotice.png'),
          text: I18n.t('no_data_notice'),
        };
      case 'my_schedule':
        return {
          image: require('../../img/unschedule.png'),
          text: I18n.t('no_data_schedule'),
        };
      default:
        return null;
    }
  };

  // 跳转到所有对象的一个list页面
  goToAllObjectListPage = (itemProps: Object) => {
    const { navigation, ...rest } = itemProps;
    navigation.navigate('AllObjectList', rest);
  };

  renderItem(itemProps: Object) {
    const {
      itemName,
      displayStyle,
      itemDataList = [],
      itemApiName,
      isLimit = true,
      limitNum = 0,
    } = itemProps;
    const needAction = isLimit && itemDataList.length > limitNum && limitNum !== 0;

    const EmptyView = ({ apiName }) => {
      const emptyContent = this.getEmptyContent(apiName);

      if (!emptyContent) {
        return renderNoData();
      } else {
        return (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <Image
              style={{ height: 0.432 * themes.deviceWidth, width: themes.deviceWidth }}
              resizeMode="contain"
              source={emptyContent.image}
            />
            <Text style={{ color: '#7C8397', fontSize: 15 }}> {emptyContent.text}</Text>
          </View>
        );
      }
    };

    return (
      <ObjectPart
        title={itemName}
        style={{ paddingBottom: 0 }}
        onAction={needAction ? () => this.goToAllObjectListPage(itemProps) : undefined}
      >
        {itemDataList.length > 0 ? (
          <View style={{ marginHorizontal: -10 }}>
            {displayStyle === 'object_detail' ? (
              <Artical {...itemProps} />
            ) : (
              <MainList {...itemProps} onItemUpdate={this.props.onMainListItemUpdate} />
            )}
          </View>
        ) : (
          <EmptyView apiName={itemApiName} />
        )}
      </ObjectPart>
    );
  }

  renderContent() {
    const { items = [], dataList = [], columnNumber, queryConditions = {} } = this.state;
    const { objects = {} } = queryConditions;
    const {
      parentParam: { objectDescription, navigation },
    } = this.props;
    const width = (100 / columnNumber).toFixed(2) + '%';
    return (
      <View style={{ flexDirection: columnNumber === 1 ? 'column' : 'row' }}>
        {_.map(items, (item, index) => {
          const showInDevice = _.get(item, 'show_in_devices', []);
          let showFlag = false;
          _.each(showInDevice, (showItem) => {
            if (showItem === 'cellphone') {
              showFlag = true;
            }
          });
          if (showInDevice.length === 0 || showFlag) {
            const itemName = _.get(item, 'name', 'text');
            const displayStyle = _.get(item, 'display_style', 'object_list');
            const itemApiName = _.get(item, 'item_api', '');
            const limitNum = _.get(item, 'limit_number', 0);
            const styleObjects = objects[itemApiName];
            const defaultFieldVal = _.get(item, 'default_field_val', []);
            let itemDataList = [];
            if (dataList.length > 0) {
              _.each(dataList, (list) => {
                if (list && list.api_name === itemApiName) {
                  itemDataList = list.dataList;
                }
              });
            }
            const itemProps = {
              itemName,
              displayStyle,
              styleObjects,
              itemDataList,
              itemApiName,
              defaultFieldVal,
              objectDescription,
              limitNum,
              navigation,
            };
            return (
              <View key={`list_tab_${index}`} style={{ width }}>
                {this.renderItem(itemProps)}
              </View>
            );
          }
        })}
      </View>
    );
  }
  render() {
    return <Container style={{ height: '100%' }}>{this.renderContent()}</Container>;
  }
}
