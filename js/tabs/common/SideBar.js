/**
 * Created by WangShuai, 2018/0118
 * @flow
 */

import React, { Component } from 'react';
import { StyleSheet, View, Text, FlatList, LayoutAnimation } from 'react-native';
import _ from 'lodash';
import { Content, ListItem, Icon, Container, Left, Right, Badge, Thumbnail } from 'native-base';
import { connect } from 'react-redux';
import theme from '../../utils/theme';
import I18n from '../../i18n';
import IcomoonIcon from '../../lib/IcomoonIcon';
import { fixIconStyle } from '../../utils/util';

type Prop = {
  menuData: any,
  userInfo: any,
  navigation: any,
  onItemTap: (boolean) => void,
};

type State = {
  selectedArr: Array<Object>,
};

const SUB_MENU = 'sub_menu';
const MAIN_MENU = 'main_menu';

class SideBar extends Component<Prop, State> {
  flatList: any = null;
  state = {
    selectedArr: [],
  };

  // 处理数据源
  makeData = () => {
    const { menuData } = this.props;
    const allData = [];
    const parentItem = _.filter(menuData, (asd) => !asd.p_api_name);
    const childrenItem = _.filter(menuData, (asd) => asd.p_api_name);
    parentItem.map((p, i) => {
      const arr = [];
      arr.push(p);
      childrenItem.map((c, j) => {
        if (c.p_api_name == p.api_name) {
          arr.push(c);
        }
      });
      allData.push(arr);
    });

    return allData;
  };

  // header点击
  itemTap = (parentItem) => {
    const apiName = _.get(parentItem, 'api_name');
    const routeName = _.get(parentItem, 'routeName');
    const tabsType = _.get(parentItem, 'type', '');

    LayoutAnimation.easeInEaseOut();
    const selectArr = this.state.selectedArr;
    if (selectArr.includes(apiName)) {
      _.remove(selectArr, (item) => item == apiName);
    } else {
      selectArr.push(apiName);
    }
    this.setState({
      selectedArr: selectArr,
    });

    // the tab that doesn't have sub_menus
    if (tabsType !== 'sub_menu') {
      this.navigate(routeName);
    }
  };

  navigate = (...params) => {
    this.props.onItemTap(true); // enableForceUpdate
    this.props.navigation.navigate(...params);
  };

  childrenItemIsShow = (subItem) => {
    if (this.state.selectedArr.includes(subItem.p_api_name)) {
      return true;
    } else {
      return false;
    }
  };

  getIconUPorDown = (childrenItem) => {
    if (this.childrenItemIsShow(childrenItem[0])) {
      return 'ios-arrow-up';
    } else {
      return 'ios-arrow-down';
    }
  };

  renderMenuIcon = (item, type) => {
    const gradeMenuStyles = type === SUB_MENU ? { marginLeft: 40 } : {};

    if (_.has(item, 'tabIcon.iconKey')) {
      // *读取租户菜单配置图标
      const { iconKey, iconColor } = item.tabIcon;

      return (
        <IcomoonIcon
          name={iconKey}
          style={[
            { fontSize: 26, width: 30, textAlign: 'center', color: iconColor || '#666666' },
            gradeMenuStyles,
            fixIconStyle(iconKey),
          ]}
        />
      );
    } else {
      //* 暂时保留原始配置图标
      // TODO 后续租户都配置菜单ICON后可以移除
      return (
        <Icon
          active
          name={item.icon}
          style={[
            {
              color: '#777',
              fontSize: 26,
              width: 30,
              textAlign: 'center',
            },
            gradeMenuStyles,
            fixIconStyle(item.icon),
          ]}
        />
      );
    }
  };

  // 渲染FlatList的item
  renderItem = (data) => {
    const menuData = _.get(data, 'item', []);
    const parentItem = _.filter(menuData, (asd) => !asd.p_api_name);
    const childrenItem = _.filter(menuData, (asd) => asd.p_api_name);

    return (
      <View>
        <ListItem
          button
          noBorder
          onPress={() => {
            this.itemTap(parentItem[0]);
          }}
        >
          <Left style={{ alignItems: 'center' }}>
            {this.renderMenuIcon(parentItem[0], MAIN_MENU)}
            <Text style={[styles.text]}>
              {I18n.t('tab.' + parentItem[0].api_name, { defaultValue: parentItem[0].name })}
            </Text>
          </Left>
          <Right style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end' }}>
            {parentItem[0].types ? (
              <Badge
                style={{
                  borderRadius: 3,
                  height: 25,
                  width: 72,
                  backgroundColor: parentItem[0].bg,
                }}
              >
                <Text style={styles.badgeText}>{`${parentItem[0].types} Types`}</Text>
              </Badge>
            ) : null}
            {childrenItem.length ? (
              <Icon
                active
                name={this.getIconUPorDown(childrenItem)}
                style={{
                  color: '#777',
                  fontSize: 26,
                  width: 30,
                  textAlign: 'center',
                  marginLeft: 20,
                }}
              />
            ) : null}
          </Right>
        </ListItem>
        <View>
          {childrenItem.map((subItem, subItemIndex) => {
            const route = _.get(subItem, 'routeName');
            if (this.childrenItemIsShow(subItem)) {
              return (
                <ListItem
                  button
                  noBorder
                  key={`${route}-${subItemIndex}`}
                  onPress={() => {
                    this.navigate(route);
                  }}
                >
                  <Left style={{ alignItems: 'center' }}>
                    {this.renderMenuIcon(subItem, SUB_MENU)}
                    <Text style={[styles.text]}>
                      {I18n.t('tab.' + subItem.api_name, { defaultValue: subItem.name })}
                    </Text>
                  </Left>
                  {subItem.types ? (
                    <Right style={{ flex: 1 }}>
                      <Badge
                        style={{
                          borderRadius: 3,
                          height: 25,
                          width: 72,
                          backgroundColor: parentItem[0].bg,
                        }}
                      >
                        <Text style={styles.badgeText}>{`${subItem.types} Types`}</Text>
                      </Badge>
                    </Right>
                  ) : null}
                </ListItem>
              );
            }
          })}
        </View>
      </View>
    );
  };

  render() {
    const { userInfo } = this.props;
    return (
      <Container>
        <Content bounces={false} style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={styles.drawerHead}>
            <Thumbnail style={styles.HeadImage} source={require('../img/default_avatar.png')} />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ fontSize: 16, color: '#fff' }}>
                {_.get(userInfo, 'name')}
              </Text>
            </View>
          </View>
          <View>
            <FlatList
              ref={(flatList) => (this.flatList = flatList)}
              keyExtractor={(item, index) => `menu-${index}`}
              data={this.makeData()}
              renderItem={this.renderItem}
              extraData={this.state}
            />
          </View>
        </Content>
      </Container>
    );
  }
}

const select = (state) => ({
  locale: state.settings.locale,
  userInfo: state.settings.userInfo,
  profile: state.settings.profile,
});

export default connect(select)(SideBar);
const styles = StyleSheet.create({
  drawerCover: {
    alignSelf: 'stretch',
    height: SCREEN_HEIGHT / 3.5,
    width: null,
    position: 'relative',
    marginBottom: 10,
  },
  drawerHead: {
    paddingLeft: 20,
    paddingBottom: 10,
    backgroundColor: theme.baseColor,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0,
    paddingTop: NAV_BAR_HEIGHT,
  },
  HeadImage: {
    marginRight: 7,
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  drawerImage: {
    position: 'absolute',
    left: isAndroid ? SCREEN_WIDTH / 10 : SCREEN_WIDTH / 9,
    top: isAndroid ? SCREEN_HEIGHT / 13 : SCREEN_HEIGHT / 12,
    width: 210,
    height: 75,
    resizeMode: 'cover',
  },
  text: {
    fontWeight: isIOS ? '500' : '400',
    fontSize: 16,
    marginLeft: 20,
    // marginTop: 3,
  },
  badgeText: {
    fontSize: isIOS ? 13 : 11,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: isAndroid ? -3 : undefined,
  },
  headerCard: { flex: 0 },
});
