/**
 * @flow
 */

import React from 'react';
import _ from 'lodash';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { ListItem, Icon } from 'native-base';
import CheckBoxView from '../common/CheckBoxView';
import theme from '../../tabs/common/theme';
import { getTerritoryId } from './help';
import { subOption, composeOptionType } from './type';

const LEVEL_SIZE = 20;

type TreeItemType = {
  handleCheck: void,
  checked: boolean,
  listStyle: object,
  name: string,
  territoryName: string,
  nameStyle: object,
  existChildren: boolean,
  handleShowList: void,
  accordionStatus: boolean,
  level: number,
};

type AccordionListProps = {
  subChildren: object,
  level: number,
};

type AccordionItemProps = {
  composeOptions: composeOptionType,
  handleSelect: void,
  option: subOption,
  level: number,
  selected: object,
};

const TreeItem = ({
  handleCheck,
  listStyle = {},
  checked,
  name,
  territoryName,
  nameStyle = {},
  level = 0,
  existChildren = false,
  handleShowList = _.noop,
  accordionStatus = false,
}: TreeItemType) => (
  <ListItem style={[styles.listItem, listStyle]}>
    <CheckBoxView
      handleCheck={handleCheck}
      checked={checked}
      onlyIconClick
      style={{
        flex: 3,
        paddingLeft: level * LEVEL_SIZE,
        justifyContent: 'flex-start',
        alignItems: 'center',
        flexDirection: 'row',
      }}
      iconStyle={{
        marginRight: 10,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          flex: 1,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View>
          {territoryName ? (
            <Text
              style={{ fontSize: 13, color: theme.input_placeholder, ...nameStyle }}
              numberOfLines={1}
            >
              {territoryName}
            </Text>
          ) : null}
          {name ? <Text numberOfLines={1}>{name}</Text> : null}
        </View>
        {existChildren ? (
          <TouchableOpacity
            style={{ alignItems: 'flex-end', alignSelf: 'flex-end' }}
            onPress={handleShowList}
          >
            <Icon
              name={accordionStatus ? 'ios-arrow-up' : 'ios-arrow-down'}
              style={{ color: '#999' }}
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </CheckBoxView>
  </ListItem>
);

const TreeAccordionList = (props: AccordionListProps) => {
  const { subChildren, level } = props;

  if (!subChildren) return null;

  return _.map(subChildren, (option) => {
    const territoryId = getTerritoryId(option);
    return (
      <SubordinateContext.Consumer>
        {({ selected, updateSelected, composeOptions }) => (
          <TreeAccordionItem
            key={territoryId}
            option={option}
            level={level}
            composeOptions={composeOptions}
            selected={selected}
            handleSelect={updateSelected}
          />
        )}
      </SubordinateContext.Consumer>
    );
  });
};

class TreeAccordionItem extends React.PureComponent<AccordionItemProps, State> {
  constructor(props) {
    super(props);
    this.territoryId = getTerritoryId(props.option);
    this.existChildren = _.get(props, `composeOptions.${this.territoryId}`);

    this.state = {
      accordionStatus: false,
    };
  }

  handleUpdateListStatus = () => {
    const { accordionStatus } = this.state;
    this.setState({ accordionStatus: !accordionStatus });
  };

  renderChildrenList = () => {
    const { level } = this.props;
    return (
      <TreeAccordionList
        key={`${level + 1}_${this.territoryId}`}
        level={level + 1}
        subChildren={this.existChildren}
      />
    );
  };

  handleCheck = () => {
    const { handleSelect, option } = this.props;
    handleSelect(option);
  };

  render() {
    const { option, level, selected } = this.props;
    const { accordionStatus } = this.state;
    const name = _.get(option, 'item.name');
    const territoryName = _.get(option, 'item.territory_name');

    return (
      <React.Fragment>
        <TreeItem
          name={name}
          checked={_.has(selected, this.territoryId)}
          level={level}
          handleCheck={this.handleCheck}
          territoryName={territoryName}
          handleShowList={this.handleUpdateListStatus}
          existChildren={this.existChildren}
          accordionStatus={accordionStatus}
        />
        {this.existChildren && accordionStatus ? this.renderChildrenList() : null}
      </React.Fragment>
    );
  }
}

const SubordinateContext = React.createContext({
  selected: {},
  updateSelected: () => {},
  composeOptions: {},
});

export { TreeItem, TreeAccordionItem, TreeAccordionList, SubordinateContext };

const styles = StyleSheet.create({
  listItem: {
    paddingLeft: 13,
    marginLeft: 0,
    paddingTop: 8,
    paddingBottom: 8,
  },
});
