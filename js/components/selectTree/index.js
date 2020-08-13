/**
 * @flow
 */

import React from 'react';
import _ from 'lodash';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { Content } from 'native-base';
import { TreeItem, TreeAccordionList, SubordinateContext } from './common';
import themes from '../../tabs/common/theme';
import SubordinateHelp, { getTerritoryId, getUserId } from './help';
import { subOption } from './type';
import I18n from '../../i18n';

type Props = {
  composeOptions: { [parent_territory_id: number | string]: Array<subOption> },
  currentUserInfo: subOption,
  params: object,
  navigation: any,
  stashSubOptions: object,
};

type States = {
  selected: Array<subOption>,
  cascadeStatus: boolean,
  composeOptions: object,
  updateSelected: void,
};

export default class SelectTreeView extends React.PureComponent<Props, States> {
  constructor(props) {
    super(props);

    this.cacheData = {};

    this.state = {
      selected: props.stashSubOptions,
      cascadeStatus: true, //* 是否级联
      composeOptions: props.composeOptions,
      updateSelected: this.handleUpdateSelected,
    };
  }

  handleUpdateSelected = (selectData: subOption) => {
    const { selected, composeOptions, cascadeStatus } = this.state;
    const selectTerritoryId = getTerritoryId(selectData);
    const assignState = { ...selected };

    if (!cascadeStatus) {
      //* 非级联
      if (_.has(assignState, selectTerritoryId)) {
        delete assignState[selectTerritoryId];
      } else {
        if (!getUserId(selectData)) return;
        assignState[selectTerritoryId] = selectData;
      }
    } else {
      //* 级联
      let subordinateSet;
      if (_.has(this.cacheData, selectTerritoryId)) {
        //* 优先获取缓存中的数据
        subordinateSet = _.get(this.cacheData, selectTerritoryId);
      } else {
        subordinateSet = SubordinateHelp.getSelectSubordinate({
          territoryId: selectTerritoryId,
          composeOptions,
          selectData,
        });
        this.cacheData[selectTerritoryId] = subordinateSet;
      }

      if (_.has(assignState, selectTerritoryId)) {
        SubordinateHelp.removeAllSubordinate({ assignState, subordinateSet });
      } else {
        SubordinateHelp.addAllSubordinate({ assignState, subordinateSet });
      }
    }

    this.setState({ selected: assignState });
  };

  renderChildrenList = () => {
    const { composeOptions, currentUserInfo } = this.props;
    const territoryId = getTerritoryId(currentUserInfo);
    const subChildren = _.get(composeOptions, territoryId);
    if (!subChildren) return null;

    return <TreeAccordionList key={`0_${territoryId}`} level={0} subChildren={subChildren} />;
  };

  resetCondition = () => {
    this.setState({ selected: {} });
  };

  completedChoice = () => {
    const { selected } = this.state;
    const { navigation, params } = this.props;

    params.callback({
      selected: _.values(selected),
      multipleSelect: params.multipleSelect,
      apiName: params.apiName,
    });

    navigation.goBack();
  };

  render() {
    const { currentUserInfo } = this.props;
    const { cascadeStatus, selected } = this.state;
    return (
      <View style={{ justifyContent: 'space-between', flex: 1 }}>
        <Content>
          <TreeItem
            key="cascade"
            name="包含下属"
            listStyle={{ paddingTop: 5, paddingBottom: 5 }}
            checked={cascadeStatus}
            handleCheck={() => {
              this.setState({ cascadeStatus: !cascadeStatus });
            }}
          />
          <TreeItem
            key="current_user"
            territoryName={_.get(currentUserInfo, 'item.territory_name')}
            name={_.get(currentUserInfo, 'item.name')}
            listStyle={{ backgroundColor: '#ececec' }}
            checked={_.has(selected, getTerritoryId(currentUserInfo))}
            handleCheck={() => {
              this.handleUpdateSelected(currentUserInfo);
            }}
          />
          <SubordinateContext.Provider value={this.state}>
            {this.renderChildrenList()}
          </SubordinateContext.Provider>
        </Content>
        <View style={styles.bottomBtn}>
          <TouchableOpacity style={styles.resetBtn} onPress={this.resetCondition}>
            <Text style={{ color: '#666' }}>{I18n.t('SelectTree.Reset')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ensureBtn} onPress={this.completedChoice}>
            <Text style={{ color: '#fff' }}>{I18n.t('SelectTree.Confirm')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  listItem: {
    paddingLeft: 13,
    marginLeft: 0,
  },
  resetBtn: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  ensureBtn: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themes.fill_base_color,
  },
  bottomBtn: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
