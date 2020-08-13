/**
 * @flow
 *Created by 19/01/14;
 */
import React, { Component } from 'react';
import { Text, StyleSheet, Platform, View, TouchableOpacity, Dimensions } from 'react-native';
import { Button, Container, Body, Right, Title, Icon, Row, Left, Spinner } from 'native-base';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import _ from 'lodash';
import I18n from '../../i18n/index';
import Constants from '../common/Constants';
import { HeaderLeft, StyledHeader } from '../common/components';
import themes from '../common/theme';
import { TENANT_ID_COLLECT, COUNT_APP_TIME } from '../../utils/const';
import { toastWaring, toastSuccess, toastError } from '../../utils/toast';
import { resetCacheAction, setCacheAction } from '../../actions/cache';
import UserService from '../../services/userService';
import HttpRequest from '../../services/httpRequest';
import helpGlobal from '../../utils/helpers/helpGlobal';
import AcStorage from '../../utils/AcStorage';
import Globals from '../../utils/Globals';

const DEVICE_WIDTH = Dimensions.get('window').width;

type Props = {
  actions: {
    resetCacheAction: void,
  },
  goLogin: any,
  navigation: any,
  dispatch: void,
};

class ChangePasswordScreen extends Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      selectedItem: {},
      userTerritoryList: [],
      loading: false,
    };
  }

  async componentWillMount() {
    //* 登录进入，拿到岗位列表，遍历得到主岗为true的设置为默认选中；
    //* 应用内的岗位列表从AcStorage中获取 isSelectedMark == true 为选中
    // const userTerritoryListStr = await AcStorage.get('userTerritoryListArr');

    const cacheUserTerritoryListArr =
      global.USER_TERRITORY_LIST_ARR && _.isString(global.USER_TERRITORY_LIST_ARR)
        ? JSON.parse(global.USER_TERRITORY_LIST_ARR)
        : [];

    const userTerritoryListArr = _.get(this.props, 'userTerritoryList', cacheUserTerritoryListArr);

    _.map(userTerritoryListArr, (item, index) => {
      if (item.isSelectedMark) {
        this.setState({ selectedItem: item });
      }
    });

    this.setState({
      userTerritoryList: userTerritoryListArr,
    });
  }

  itemOnpress = (item) => {
    this.setState({
      selectedItem: item,
    });
  };

  changeTerritory = async () => {
    this.setState({ loading: true });
    const { selectedItem, userTerritoryList } = this.state;
    if (_.isEmpty(selectedItem)) {
      toastWaring(I18n.t('TerritoryChangeScreen.PleaseChooseTerritory'));
      this.setState({ loading: false });
      return;
    }
    const token = _.get(this.props, 'token');
    const payload = {
      authTerritory: selectedItem.id,
    };
    // 发送请求
    const [err, result] = await HttpRequest.changeAuthTerritory(token, payload);
    this.setState({ loading: false });
    if (err) {
      toastError(I18n.t('TerritoryChangeScreen.FailedToSwitchTerritory'));
      return;
    }
    Globals.clearGlobals();
    _.map(userTerritoryList, (item, index) => {
      //* 从设置进入的获取用户信息的当前岗位信息为默认选中没有就设置主岗为默认选中
      if (item.id == selectedItem.id) {
        item.isSelectedMark = true;
      } else {
        item.isSelectedMark = false;
      }
    });
    // AcStorage.save({ userTerritoryListArr: userTerritoryList });
    Globals.setUserTerritoryListArr(userTerritoryList);
    await helpGlobal.setGlobalHelper(result);
    Globals.setCurrentActiveTerritory(selectedItem.id);

    this.props.dispatch(setCacheAction(result));
    //* 储存TEAMID
    this.saveTeamId(result);
  };

  saveTeamId = (result) => {
    const teamId = _.get(result, 'profile.tenant_id');
    if (!teamId) return;
    if (TENANT_ID_COLLECT.LUOZHEN_TENEMENT.includes(teamId)) {
      AcStorage.save({ [COUNT_APP_TIME]: 60 * 2 });
    } else if (TENANT_ID_COLLECT.JMKX_TENEMENT.includes(teamId)) {
      AcStorage.save({ [COUNT_APP_TIME]: 60 * 6 });
    } else {
      AcStorage.save({ [COUNT_APP_TIME]: 10 });
    }
  };

  renderItems = () => {
    const { userTerritoryList, selectedItem } = this.state;
    return (
      <View>
        {_.map(userTerritoryList, (item, index) => {
          const isSelected = item.id == selectedItem.id;
          return (
            <TouchableOpacity style={styles.item} onPress={() => this.itemOnpress(item)}>
              <Icon
                name="ios-contacts"
                key={`ios-contacts-${Math.random()}`}
                style={[
                  {
                    color: '#4990EC',
                    fontSize: 25,
                    paddingLeft: 20,
                    paddingRight: 20,
                  },
                ]}
              />
              <Text
                style={{
                  flex: 1,
                  color: isSelected ? '#4990EC' : '#333',
                }}
              >
                {item.name}
              </Text>
              <Icon
                name="ios-checkmark"
                key={`ios-checkmark-${Math.random()}`}
                style={[
                  {
                    color: isSelected ? '#4990EC' : '#fff',
                    fontSize: 35,
                    paddingRight: 20,
                  },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  render() {
    const { loading } = this.state;
    return (
      <Container style={{ backgroundColor: '#f4f4f4' }}>
        <StyledHeader
          style={{
            backgroundColor: themes.title_background,
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          {/* <HeaderLeft style={{ flex: 1 }} navigation={this.props.navigation} /> */}
          <Left style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <Button
              transparent
              onPress={() => {
                if (!loading) {
                  this.props.goLogin
                    ? this.props.actions.resetCacheAction()
                    : this.props.navigation.goBack();
                }
              }}
            >
              <Icon
                name="ios-arrow-back"
                style={{
                  color: themes.title_icon_color,
                  fontSize: themes.font_header_size,
                  opacity: loading ? 0.3 : 1,
                }}
              />
            </Button>
          </Left>
          <Body
            style={{
              alignItems: 'center',
              flex: 1,
            }}
          >
            <Title
              style={{
                color: themes.title_text_color,
                fontWeight: '600',
                fontSize: 17,
                textAlign: 'center',
              }}
            >
              {I18n.t('territory_change')}
            </Title>
          </Body>
          <Right />
        </StyledHeader>
        <View>
          <Text style={styles.tip_text}>
            {I18n.t('TerritoryChangeScreen.PleaseChooseTerritory')}
          </Text>
          {this.renderItems()}
        </View>
        <Button
          block
          style={{
            marginTop: 20,
            backgroundColor: loading ? '#BEDCFF' : '#4990EC',
            marginHorizontal: 20,
          }}
          onPress={() => {
            !loading ? this.changeTerritory() : null;
          }}
        >
          {loading ? (
            <Spinner color="#fff" style={{ position: 'absolute', left: DEVICE_WIDTH * 0.25 }} />
          ) : null}
          <Text
            style={{
              color: '#fff',
              fontSize: themes.button_font_size,
            }}
          >
            {I18n.t('change_password_button')}
          </Text>
        </Button>
      </Container>
    );
  }
}

const select = (state) => ({
  token: state.settings.token,
  userInfo: state.settings.userInfo,
  userTerritoryList: state.settings.userTerritoryList,
});

const act = (dispatch) => ({
  actions: bindActionCreators({ resetCacheAction }, dispatch),
  dispatch,
});

export default connect(select, act)(ChangePasswordScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    padding: 20,
  },
  item: {
    backgroundColor: '#fff',
    // marginLeft: 0,
    // padding: 10,
    marginBottom: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    marginLeft: 20,
  },
  input: {
    marginRight: themes.h_spacing,
    textAlign: 'right',
  },
  tip_text: {
    color: '#333',
    paddingLeft: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
});
