/*
 * Created by yjgao
 * @flow
 * 筛选下属页面
 */

import React from 'react';
import { FlatList, Text, View, TouchableOpacity } from 'react-native';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import _ from 'lodash';
import { Body, Button, Container, Content, Header, Icon, Left, Right, Title } from 'native-base';
import { HeaderLeft, ListDivider, StyledHeader } from '../../common/components';
import optionAction from '../../../actions/options';
import I18n from '../../../i18n';
import themes from '../../common/theme';
import CheckBox from '../../common/components/CheckBox';
import { TENANT_ID_COLLECT } from '../../../utils/const';

type Prop = {
  navigation: any,
  actions: {
    optionAction: (selected: ?Array<any>) => { type: string, payload: any },
  },
  onComponentDidMount: any,
  onComponentUnMount: any,
};

type State = {
  selected: Array<any>,
};

class SelectTree extends React.Component<Prop, State> {
  state = {
    selected: [],
    items: [],
  };

  componentDidMount() {
    const { navigation, onComponentDidMount } = this.props;
    const { params } = navigation.state;
    const selectList = [];
    if (_.isFunction(onComponentDidMount)) {
      onComponentDidMount(this.refresh);
    }

    this.composeOptions();

    _.each(params.options, (option) => {
      const territoryId = _.get(option, 'item.territory_id');
      if (territoryId == global.CURRENT_ACTIVE_TERRITORY) {
        selectList.push(option);
      }
    });
    this.setState({
      items: selectList,
      selected: params.stashSubOptions || [],
    });
  }

  componentWillUnmount() {
    const { onComponentUnMount } = this.props;
    if (_.isFunction(onComponentUnMount)) {
      onComponentUnMount();
    }
  }

  composeOptions = () => {
    const options = _.get(this.props, 'navigation.state.params.options');
    const optionsParams = {};
    _.each(options, (option) => {
      const parentTerritoryId = _.get(option, 'item.parent_territory_id');
      if (!parentTerritoryId) return;

      if (_.has(optionsParams, parentTerritoryId)) {
        optionsParams[parentTerritoryId].push(option);
      } else {
        optionsParams[parentTerritoryId] = [option];
      }
    });
    this.optionsParams = optionsParams;
  };

  handleSelection = (item) => {
    const { navigation } = this.props;
    const { params } = navigation.state;

    // *未分配用户的岗位不做筛选条件
    if (!item.item.id) return false;

    if (!params.multipleSelect) {
      this.setState(
        {
          selected: [item],
        },
        this.selectDone,
      );
    } else {
      const { selected } = this.state;

      const allOptions = _.cloneDeep(this.optionsParams);
      const exists = _.findIndex(selected, item);
      if (exists >= 0) {
        const removeCacheObj = {};
        removeCacheObj.newSelected = _.cloneDeep(selected);
        this.popChildren(allOptions, item, removeCacheObj);

        this.setState({
          selected: removeCacheObj.newSelected,
        });
      } else {
        const cacheObj = {};
        cacheObj.newSelected = _.cloneDeep(selected);
        cacheObj.newSelected.push(item);
        if (!TENANT_ID_COLLECT.JMKX_TENEMENT.includes(global.TEAMID)) {
          // * 济民可信租户 勾选父节点后，不自动勾选子节点
          this.pushChildren(allOptions, item, cacheObj);
        }
        this.setState({
          selected: cacheObj.newSelected,
        });
      }
    }
  };

  popChildren(allOptions, item, removeCacheObj) {
    if (TENANT_ID_COLLECT.JMKX_TENEMENT.includes(global.TEAMID)) {
      // * 济民可信租户 勾选父节点后，不自动勾选子节点
      _.remove(removeCacheObj.newSelected, (selected) => {
        if (item.item.territory_id == selected.item.territory_id) {
          return true;
        }
      });
    } else {
      _.remove(removeCacheObj.newSelected, (selected) => {
        if (
          item.item.territory_id == selected.item.territory_id ||
          item.item.territory_id == selected.item.parent_territory_id
        ) {
          return true;
        }
      });

      const subOptions = _.get(allOptions, item.territory_id, []);
      if (_.isEmpty(subOptions)) return;
      delete allOptions[item.territory_id];

      _.each(subOptions, (subOption) => {
        this.popChildren(allOptions, subOption, removeCacheObj);
      });
    }
  }

  pushChildren(allOptions, item, cacheObj) {
    const subOptions = _.get(allOptions, item.item.territory_id, []);

    if (_.isEmpty(subOptions)) return;
    delete allOptions[item.item.territory_id];
    const selectedMap = _.concat(cacheObj.newSelected, subOptions);
    _.set(cacheObj, 'newSelected', selectedMap);

    _.each(subOptions, (subOption) => {
      this.pushChildren(allOptions, subOption, cacheObj);
    });
  }

  checkChildren = (options, item) => {
    let is_have = false;
    _.each(options, (option) => {
      if (option.item.parent_id && option.item.parent_id == item.value) {
        is_have = true;
      }
    });

    return is_have;
  };

  getSelectList = (listItems, territoryId) => {
    const selectList = [];
    if (listItems && listItems.length > 0) {
      _.each(listItems, (item) => {
        if (item.item && item.item.parent_territory_id == territoryId) {
          let is_in_select = false;
          _.each(selectList, (sel) => {
            if (sel.item.territory_id === item.item.territory_id) {
              is_in_select = true;
            }
          });
          if (!is_in_select) {
            selectList.push(item);
          }
        }
      });
    }
    return selectList;
  };

  selectDone = () => {
    const { actions, navigation } = this.props;
    const { params } = navigation.state;
    params.callback({
      selected: this.state.selected,
      multipleSelect: params.multipleSelect,
      apiName: params.apiName,
    });
    // TODO: deprecated
    actions.optionAction(this.state.selected);
    navigation.goBack();
  };

  selectDown = (item) => {
    const { navigation } = this.props;
    const { params } = navigation.state;
    const selectList = this.getSelectList(params.options, item.item.territory_id);
    this.setState({ items: selectList });
  };

  selectUp = (item) => {
    const { navigation } = this.props;
    const { params } = navigation.state;
    const { options } = params;
    let parent_territory_id;
    _.each(options, (option1) => {
      if (option1.item.territory_id == item.item.territory_id) {
        if (option1.item.parent_territory_id) {
          parent_territory_id = _.get(option1, 'item.parent_territory_id');
          if (parent_territory_id !== global.CURRENT_ACTIVE_TERRITORY) {
            _.each(options, (option) => {
              if (option.item.territory_id == parent_territory_id && option.item.territory_id) {
                const parent_territory_id1 = _.get(option, 'item.parent_territory_id');
                const selectList = this.getSelectList(options, parent_territory_id1);
                this.setState({ items: selectList });
              }
            });
          } else {
            const selectList = [];
            _.each(options, (option) => {
              if (option.item.territory_id == global.CURRENT_ACTIVE_TERRITORY) {
                selectList.push(option);
              }
            });
            this.setState({ items: selectList });
          }
        } else {
        }
      }
    });
  };

  renderItem = ({ item }) => {
    const { navigation } = this.props;
    const { params } = navigation.state;
    const { items } = this.state;
    const multipleSelect = _.get(navigation, 'state.params.multipleSelect');
    let exists;
    if (item.value) {
      exists = _.find(this.state.selected, (sl) => sl.item.territory_id === item.item.territory_id);
    } else if (item.id) {
      exists = _.find(this.state.selected, (sl) => sl.item.territory_id === item.item.territory_id);
    }

    const key = item.value ? `${item.value}` : `${item.id}`;
    const subItem = item.item;

    let is_have_in_charge = false;
    let is_have_sub_list = false;
    if (subItem.parent_territory_id) {
      is_have_in_charge = true;
    }
    _.each(params.options, (itm) => {
      if (itm.item.parent_territory_id && itm.item.parent_territory_id == subItem.territory_id) {
        is_have_sub_list = true;
      }
    });
    const itemTerritory_nameAndName = `${item.item.territory_name}-${item.item.name}`;
    const itemTerritoryNameFormat =
      itemTerritory_nameAndName.length > 24
        ? itemTerritory_nameAndName.substring(0, 24) + '...'
        : itemTerritory_nameAndName;
    return (
      <View style={{ padding: 5 }} flexDirection="row">
        <CheckBox
          key={`${item.value}`}
          handleCheck={() => this.handleSelection(item)}
          checked={!!exists}
          style={{
            flex: 3,
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexDirection: 'row',
          }}
          iconStyle={{
            marginRight: 10,
          }}
        >
          <View>
            <Text>
              {_.get(item, 'item.territory_name')
                ? _.get(item, 'item.territory_name').substring(0, 16) + '...'
                : ''}
            </Text>
            <Text>{item.item.name}</Text>
          </View>
        </CheckBox>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            alignContent: 'center',
            flexDirection: 'row',
          }}
        >
          {is_have_in_charge ? (
            <TouchableOpacity onPress={() => this.selectUp(item)}>
              <Text style={{ color: themes.fill_base_login, padding: 2 }}>
                {I18n.t('JMKX_selectTree.Superior')}
              </Text>
            </TouchableOpacity>
          ) : (
            undefined
          )}

          {is_have_sub_list ? (
            <TouchableOpacity onPress={() => this.selectDown(item)}>
              <Text style={{ color: 'red', padding: 2 }}>
                {I18n.t('JMKX_selectTree.Subordinate')}
              </Text>
            </TouchableOpacity>
          ) : (
            undefined
          )}
        </View>
      </View>
    );
  };

  render() {
    const { navigation } = this.props;
    const { params } = navigation.state;
    const { items } = this.state;
    const multipleSelect = _.get(params, 'multipleSelect');

    return (
      <Container style={{ backgroundColor: themes.fill_base }}>
        <StyledHeader>
          <HeaderLeft navigation={navigation} />
          <Body style={{ alignItems: 'center', flex: 1 }}>
            <Title
              style={{
                color: themes.title_text_color,
                fontSize: themes.title_size,
              }}
            >
              {I18n.t('common_options')}
            </Title>
          </Body>
          <Right>
            {multipleSelect && (
              <Button transparent onPress={() => this.selectDone()}>
                <Text style={{ color: themes.title_text_color }}>{I18n.t('common_sure')}</Text>
              </Button>
            )}
          </Right>
        </StyledHeader>
        <Content>
          <View>
            <FlatList data={items} extraData={this.state} renderItem={this.renderItem} />
          </View>
        </Content>
      </Container>
    );
  }
}

const act = (dispatch) => ({
  actions: bindActionCreators(
    {
      optionAction,
    },
    dispatch,
  ),
});

export default connect(null, act)(SelectTree);
