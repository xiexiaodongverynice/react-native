/**
 * * 筛选modal
 * @flow
 */
import React from 'react';
import _ from 'lodash';
import { List, ListItem, Text, Icon } from 'native-base';
import { View, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import themes from '../../tabs/common/theme';
import { renderAdjustResizeView } from '../../utils/util';
import {
  FilterType,
  FilterBottomBtn,
  FilterSelect,
  FilterText,
  FilterDate,
  FilterRangeNum,
  SortFilter2BtnRow,
} from './components';
import VerticalSpacer from '../../components/common/VerticalSpacer';
import I18n from '../../i18n';

type filterTypeMapType = [
  {
    apiName: string,
    type: string,
    label: string,
    options: Array,
    dataSource: ?Array,
  },
];

type SortMapItem = {
  sort_by: string,
  sort_order: string,
  label: string,
};
type Props = {
  visible: boolean,
  hideWithoutSave: void, //调用这个方法可以将Modal关闭。Modal的visible是从props中读取的，它会调用ModalWrapper的hide方法。
  filterTypeMap: filterTypeMapType, // * 筛选类型
  filterSelectMap: any,
  locationState: 'right' | 'bottom', //* 判断显现的modal 根据是否有顺序配置
  handleSaveCondition: void, // * 保存
  handleOrder: ({ sortOrder: string, sortBy: string }) => void, //点击后记录选中的排序方式
  handleUpdateCondition: (apiName, value) => void, //* 更新筛选条件
  handleUpdateConditionSync: (apiName, value) => void, //* 更新筛选条件
  modalActive: 'none' | 'filter' | 'sort',
  sortMap: Array<SortMapItem>,
  sortDes: {
    sortOrder: string, //desc
    sortBy: string, //update_time
  },
  setState_modalActive: (value: string) => void, //将值传给parent
  objectApiName: string, //为了查询 翻译key
};

type State = {
  active: string,
  selectedOptions: any,
};

export default class FilterModal extends React.Component<Props, State> {
  FilterHeight = themes.deviceHeight - themes.menuHeight - themes.filterMarginBottom;

  state = {
    activeIndex: 0,
    refresh: true,
  };

  handleChangeActive = (index) => {
    this.setState({ activeIndex: index, refresh: true });
  };

  renderRightComppinents = () => {
    const { filterTypeMap, filterSelectMap, handleUpdateCondition } = this.props;
    const { activeIndex, refresh } = this.state;
    if (refresh) {
      setTimeout(() => {
        this.setState({ refresh: false });
      }, 0);
      return null;
    }

    const activeFilter = filterTypeMap[activeIndex];
    const apiName = _.get(activeFilter, 'apiName', '');
    const data = _.get(filterSelectMap, apiName);

    const type = _.get(activeFilter, 'type');
    if (!type) return null;

    if (type === 'select_one' || type === 'select_many' || type === 'boolean') {
      return (
        <FilterSelect
          type={type}
          activeFilter={activeFilter}
          apiName={apiName}
          data={data}
          handleUpdateCondition={handleUpdateCondition}
        />
      );
    } else if (type === 'text' || type === 'long_text' || type === 'relation') {
      return (
        <FilterText
          type={type}
          apiName={apiName}
          activeFilter={activeFilter}
          data={data}
          handleUpdateCondition={handleUpdateCondition}
        />
      );
    } else if (type === 'date_time') {
      return (
        <FilterDate
          activeFilter={activeFilter}
          data={data}
          apiName={apiName}
          handleUpdateCondition={handleUpdateCondition}
        />
      );
    } else if (type === 'real_number' || type === 'big_int') {
      return (
        <FilterRangeNum
          type={type}
          apiName={apiName}
          activeFilter={activeFilter}
          data={data}
          handleUpdateCondition={handleUpdateCondition}
        />
      );
    }
  };

  renderLeftFilter = () => {
    const { filterTypeMap, locationState } = this.props;
    const { activeIndex } = this.state;
    const items = _.map(filterTypeMap, (filter, index) => {
      const field = _.get(filter, 'apiName');
      let label = _.get(filter, 'label');
      label = I18n.t_object_field(this.props.objectApiName, field, label);
      return (
        <FilterType
          key={`${_.get(filter, 'apiName')}`}
          index={index}
          activeIndex={activeIndex}
          label={label}
          handleChangeActive={this.handleChangeActive}
        />
      );
    });
    return (
      <View
        style={[
          styles.leftView,
          { height: locationState === 'bottom' ? this.FilterHeight - 50 : this.FilterHeight },
        ]}
      >
        <ScrollView>{items}</ScrollView>
      </View>
    );
  };

  renderRightFilter = () => {
    const { locationState } = this.props;
    return (
      <View
        style={[
          styles.rightView,
          { height: locationState === 'bottom' ? this.FilterHeight - 50 : this.FilterHeight },
        ]}
      >
        {this.renderRightComppinents()}
      </View>
    );
  };

  renderFilterView = () => {
    const { handleSaveCondition, handleUpdateConditionSync } = this.props;
    return (
      <View style={{ backgroundColor: themes.fill_mask, flex: 1 }}>
        <View style={{ backgroundColor: '#fff', flex: 1, flexDirection: 'row' }}>
          {this.renderLeftFilter()}
          {this.renderRightFilter()}
        </View>
        {renderAdjustResizeView(
          <FilterBottomBtn
            handleSaveCondition={handleSaveCondition} //重置清空
            handleUpdateConditionSync={handleUpdateConditionSync} //保存按钮
          />,
        )}
      </View>
    );
  };

  renderSortViewCell_RightCheckmark = (isCurrentSelectedItem) => {
    const iconStyle = { color: themes.fill_base_color };
    const viewStyle = {
      position: 'absolute',
      right: 15, //等于marginRight:15，这个值是 native-base中的ListItem默认值
      top: 0,
      bottom: 0,
    };

    if (isCurrentSelectedItem) {
      return (
        <View style={[viewStyle, styles.center]}>
          <Icon name="ios-checkmark" style={iconStyle} />
        </View>
      );
    } else {
      return null;
    }
  };

  //每个排序按钮
  renderSortViewCells = () => {
    const { hideWithoutSave, sortMap, handleOrder, sortDes } = this.props;
    const { sortOrder, sortBy } = sortDes; //当前选中的排序规则
    const cells = [];
    _.forEach(sortMap, (item: SortMapItem, index) => {
      const { sort_order, sort_by } = item; //item中的变量都是server端返回的，明明风格是_
      const isCurrentSelectedItem = sortOrder === sort_order && sortBy === sort_by; //这个item正好是当前选中的
      const style = {
        paddingLeft: themes.h_spacing_md,
        marginLeft: 0,
        justifyContent: 'space-between',
        backgroundColor: '#f9f9f9',
      };
      const cell = (
        <ListItem
          style={style}
          key={`${index}`}
          onPress={() => {
            if (isCurrentSelectedItem) return; //已经选中了，直接关闭
            handleOrder({ sortOrder: sort_order, sortBy: sort_by });
            hideWithoutSave();
          }}
        >
          <Text>{_.get(item, 'label')}</Text>
          {this.renderSortViewCell_RightCheckmark(isCurrentSelectedItem)}
        </ListItem>
      );
      cells.push(cell);
    });
    return cells;
  };

  renderSortView = () => {
    const { hideWithoutSave } = this.props;
    return (
      <TouchableOpacity
        style={{ backgroundColor: themes.fill_mask, flex: 1 }}
        onPress={hideWithoutSave}
      >
        <List>{this.renderSortViewCells()}</List>
      </TouchableOpacity>
    );
  };

  renderBtnRow() {
    const {
      modalActive,
      filterTypeMap,
      sortMap,
      locationState,
      hideWithoutSave,
      setState_modalActive,
    } = this.props;
    if (locationState === 'bottom' && !_.isEmpty(sortMap)) {
      const onPress = (btn) => {
        if (btn === modalActive) {
          hideWithoutSave();
        } else {
          setState_modalActive(btn);
        }
      };
      return (
        <SortFilter2BtnRow
          visible={true}
          showItem={{ filter: !_.isEmpty(filterTypeMap), sort: !_.isEmpty(sortMap) }}
          sortBtnOnPress={() => onPress('sort')}
          filterBtnOnPress={() => onPress('filter')}
        />
      );
    } else {
      return null;
    }
  }

  //隐形Button，点击header时关闭Modal
  renderHeaderBtn() {
    const { hideWithoutSave } = this.props;
    return <TouchableOpacity style={{ height: themes.menuHeight }} onPress={hideWithoutSave} />;
  }

  render1pxSpacer = () => {
    const style = { backgroundColor: '#f2f2f2' };
    return <VerticalSpacer height={1} style={style} />;
  };

  render() {
    const { visible, modalActive } = this.props;
    return (
      <Modal visible={visible} animationType="none" transparent>
        {this.renderHeaderBtn()}
        {this.renderBtnRow()}
        {this.render1pxSpacer()}
        {modalActive === 'sort' ? this.renderSortView() : this.renderFilterView()}
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: '#fff',
    paddingLeft: themes.list_item_horizon,
  },
  listItem: {
    justifyContent: 'center',
    height: themes.list_item_height,
    borderBottomColor: themes.border_color_base,
    borderBottomWidth: 0.5,
  },
  leftView: {
    flex: 1,
    backgroundColor: '#e4e5e4',
  },
  rightView: {
    flex: 2,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
