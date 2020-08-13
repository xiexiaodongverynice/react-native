/**
 * @flow
 */
import React, { Component } from 'react';
import { StyleSheet, Text } from 'react-native';
import _ from 'lodash';
import { Container, Tab, Tabs, View } from 'native-base';
import theme from '../../../utils/theme';
import { MainList, renderNoData } from '../helper/renderListHelper';
import { CustomTouch } from '../../../lib/androidWebview';

type Props = {
  content: Object,
  parentParam: {
    navigation: Object,
    objectDescription: Object,
  },
  queryConditions: Object,
  queryState: boolean,
  homeData: any,
  onMainListItemUpdate: Function,
};
type State = {
  items: Array<Object>,
  dataList: Array<Object>,
  queryConditions: Object,
};
export default class extends Component<Props, State> {
  state = {
    items: [],
    dataList: [],
    queryConditions: {},
  };
  componentDidMount() {
    const { content, homeData = [], queryConditions } = this.props;
    const { display_items = [] } = content;

    this.setState({
      items: display_items,
      dataList: homeData,
      queryConditions,
    });
  }

  static getDerivedStateFromProps(props: Object, state: Object) {
    if (props.homeData !== state.dataList) {
      const { queryConditions } = props;
      return {
        dataList: props.homeData,
        queryConditions,
      };
    } else {
      return null;
    }
  }

  // 跳转到所有对象的一个list页面
  goToAllObjectListPage = (itemProps: Object) => {
    const { navigation, ...rest } = itemProps;
    navigation.navigate('AllObjectList', rest);
  };

  renderTabContent = (itemProps: Object) => {
    const { itemName, itemDataList = [], isLimit = true, limitNum = 0 } = itemProps;
    const needAction = isLimit && itemDataList.length > limitNum && limitNum !== 0;

    return itemDataList.length > 0 ? (
      <React.Fragment>
        <MainList {...itemProps} onItemUpdate={this.props.onMainListItemUpdate} />
        {needAction && (
          <CustomTouch
            style={styles.actionWrapper}
            onPress={needAction ? () => this.goToAllObjectListPage(itemProps) : undefined}
          >
            <Text style={styles.action}>查看全部</Text>
          </CustomTouch>
        )}
      </React.Fragment>
    ) : (
      renderNoData(itemName)
    );
  };

  renderTab = (item: Object, index: number) => {
    const { dataList = [], queryConditions = {} } = this.state;
    const { objects = {} } = queryConditions;
    const {
      parentParam: { objectDescription, navigation },
    } = this.props;

    const deviceList = _.get(item, 'show_in_devices', []);
    if (deviceList.length === 0 || _.has(deviceList, (device) => device === 'cellphone')) {
      const itemName = _.get(item, 'name', 'text');
      const displayStyle = _.get(item, 'display_style', 'object_list');
      const itemApiName = _.get(item, 'item_api', '');
      const limitNum = _.get(item, 'limit_number', 0);
      const styleObjects = objects[itemApiName];
      const itemDataList =
        (_.find(dataList, (subList) => subList.api_name === itemApiName) || {}).dataList || [];

      const itemProps = {
        itemName,
        displayStyle,
        styleObjects,
        itemDataList,
        itemApiName,
        objectDescription,
        limitNum,
        navigation,
      };
      return (
        <Tab
          style={{ backgroundColor: theme.contentBackground }}
          tabStyle={styles.tabStyle}
          activeTabStyle={styles.tabStyle}
          textStyle={styles.tabTextStyle}
          activeTextStyle={styles.activeTextStyle}
          key={`tab_${index}`}
          heading={itemName}
        >
          {this.renderTabContent(itemProps)}
        </Tab>
      );
    }
  };

  render() {
    const tabWidth = SCREEN_WIDTH / this.state.items.length;
    const underLineWidth = tabWidth * 0.3;
    return (
      <Container>
        <Tabs
          tabContainerStyle={{
            borderColor: theme.listItem.dividerLineColor,
            borderBottomWidth: theme.listItem.dividerLineThickness,
            elevation: 0,
          }}
          tabBarUnderlineStyle={{
            backgroundColor: theme.baseColor,
            width: underLineWidth,
            height: 3,
            borderRadius: 2,
            marginLeft: (tabWidth - underLineWidth) / 2,
          }}
        >
          {_.map(this.state.items, this.renderTab)}
        </Tabs>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  tabStyle: {
    backgroundColor: 'white',
  },
  tabTextStyle: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'PingFangSC-Regular',
  },
  activeTextStyle: {
    fontFamily: 'PingFangSC-Medium',
    color: '#333',
    fontSize: 15,
  },
  actionWrapper: {
    height: 50,
    borderTopWidth: theme.listItem.dividerLineThickness,
    borderColor: theme.listItem.dividerLineColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  action: {
    fontSize: theme.baseFontSize,
    fontFamily: 'PingFangSC-Regular',
    color: '#4cb7ff',
  },
});
