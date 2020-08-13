/**
 * * 筛选组件入口
 * @flow
 */

import React from 'react';
import _ from 'lodash';
import moment from 'moment';
import { connect } from 'react-redux';
import { StyleSheet } from 'react-native';
import { Icon, Button } from 'native-base';
import Privilege from 'fc-common-lib/privilege';
import { SortFilter2BtnRow } from './components';
import ModalWrapper from '../modal/ModalWrapper';
import IndexDataParser from '../../services/dataParser';
import * as Util from '../../utils/util';
import themes from '../../tabs/common/theme';
import FilterModal from './FilterModal';
import { FilterObj } from './SelectedFiltersRow';
import assert from '../../utils/assert0';

export const DeleteAll = 'delete_all';
const RELATION_TEXT = ['create_by', 'update_by', 'owner'];

type Props = {
  setFilterObjs: (Array) => void, //告诉parent需要更新filterObjs了。filterObjs是当前选中的筛选条件
  layout: any,
  objectDescription: any,
  permission: any,
  objectApiName: string,
  location: 'bottom' | 'right',
  sortDes: {
    sortOrder: string,
    sortBy: string,
  },
  handleFilter: (filter) => void,
  handleOrder: ({ sort_by: string, sort_order: string }) => void,
};

type State = {
  filterTypeMap: Array | null, //* 筛选类型
  filterSelectMap: Object, //* 已选择(selected)筛选集合。示例 {"pharmacy_type": ["1"], "name": "fff" }
  locationState: 'right' | 'bottom', //* 判断显现的modal 根据是否有顺序配置
  modalActive: 'none' | 'filter' | 'sort', //* 当前浮层显示筛选或排序
  filterSortMap: ?[
    {
      sort_by: string,
      sort_order: string,
      label: string,
    },
  ], //* 布局筛选排序 配置
};

const top__filename = 'FilterEntranceView';
class FilterEntranceView extends React.PureComponent<Props, State> {
  objectApiName = this.props.objectApiName || '';
  previousFilterSelection = null; //打开modal前，记住选中状态。用户关闭modal未保存，恢复到此状态
  state = {
    filterTypeMap: null, //* 筛选数据集合
    filterSelectMap: {}, //* 已选择筛选集合
    modalActive: 'none',
    filterSortMap: [],
  };

  constructor(props) {
    super(props);
    console.logConstructorHash(top__filename, this);
  }
  componentDidMount() {
    const { layout } = this.props;
    const filterFieldMap = _.get(layout, 'filter_fields', []);
    const filterSortMap = _.get(layout, 'filter_sort', []);
    const locationState = _.isEmpty(filterSortMap) ? 'right' : 'bottom';
    this.setState({ filterSortMap, locationState });

    this.getFilterSelectOptions(layout, filterFieldMap);
  }

  call_parent_setFilterObjs() {
    const setFilterObjs = this.props.setFilterObjs;
    if (_.isFunction(setFilterObjs)) {
      const filterObjs = this.filterObjs_from_filterSelectMap();
      setFilterObjs(filterObjs);
    }
  }

  setFilterOptions = async (data, parms, layout) => {
    let _options = [];
    const _type = _.get(data, 'type');
    const _apiName = _.get(data, 'api_name');
    const _filterConfig = _.get(layout, 'filter_fields_extra_config', {});

    //* 单选 设置data_source
    const _dataSource = _.get(_filterConfig, `${_apiName}.data_source`, {});

    if (!_.isEmpty(_dataSource)) {
      _.set(parms, 'options', _options);
      _.set(parms, 'dataSource', _dataSource);
      return;
    }

    if (_type === 'select_one' || _type === 'select_many') {
      _options = _.cloneDeep(_.get(data, 'options', []));
    } else if (_type === 'boolean') {
      _options = [
        { label: '是', value: true },
        { label: '否', value: false },
      ];
    } else {
      return;
    }
    _.set(parms, 'options', _options);
  };

  getFilterSelectOptions = (layout, filterFieldMap) => {
    const { objectDescription, permission } = this.props;

    const filterFields = [];
    const filterTypeMap = [];
    const currentDescription = IndexDataParser.getObjectDescByApiName(
      this.objectApiName,
      objectDescription,
    );

    _.each(filterFieldMap, (field) => {
      if (Privilege.checkFieldInOkArr(permission, this.objectApiName, field, [2, 4])) {
        filterFields.push(field);
      }
    });

    _.each(filterFields, (field) => {
      const exists = _.find(
        _.get(currentDescription, 'fields'),
        (option) => field === option.api_name,
      );

      if (!_.isEmpty(exists)) {
        const parms = {
          apiName: _.get(exists, 'api_name'),
          type: _.get(exists, 'type'),
          label: _.get(exists, 'label'),
        };
        this.setFilterOptions(exists, parms, layout);

        filterTypeMap.push(parms);
      }
    });

    this.setState({ filterTypeMap });
  };

  composeCondition = (apiName, data, type) => {
    if (_.isUndefined(data) || data === '' || _.isEmpty(data)) return null;

    if (type === 'relation' || RELATION_TEXT.includes(apiName)) {
      return this.composeConditionCri(`${apiName}__r.name`, 'contains', [data]);
    } else if (type === 'text') {
      return this.composeConditionCri(apiName, 'contains', [data]);
    } else if (type === 'select_one' || type === 'boolean') {
      return this.composeConditionCri(apiName, '==', data);
    } else if (type === 'select_many') {
      return this.composeConditionCri(apiName, 'contains', data);
    } else if (type === 'date_time') {
      const startTime = _.get(data, 'start');
      const endTime = _.get(data, 'end');
      const timeMap = [];
      if (startTime) {
        timeMap.push(this.composeConditionCri(apiName, '>=', [startTime]));
      }
      if (endTime) {
        timeMap.push(this.composeConditionCri(apiName, '<=', [endTime]));
      }
      return timeMap;
    } else if (type === 'real_number' || type === 'big_int') {
      const startNum = _.get(data, 'startNum');
      const endNum = _.get(data, 'endNum');
      const numMap = [];
      if (startNum) {
        numMap.push(this.composeConditionCri(apiName, '>=', [startNum]));
      }
      if (endNum) {
        numMap.push(this.composeConditionCri(apiName, '<=', [endNum]));
      }
      return numMap;
    }
  };

  composeConditionCri = (apiName, operator, value) => ({ field: apiName, operator, value });

  //保存按钮 onPress事件
  handleSaveCondition = (hide) => {
    const { handleFilter } = this.props;
    const { filterSelectMap, filterTypeMap } = this.state;

    let filterCri = [];
    const conditionKeys = Object.keys(filterSelectMap);
    _.each(conditionKeys, (apiName) => {
      const data = filterSelectMap[apiName];
      const type = _.chain(filterTypeMap)
        .find((item) => _.get(item, 'apiName') === apiName)
        .get('type')
        .value();

      const cri = this.composeCondition(apiName, data, type);
      if (!_.isEmpty(cri)) {
        filterCri = filterCri.concat(cri);
      }
    });

    handleFilter(filterCri);
    hide();
  };

  hideWithoutSave = (hide) => {
    //hide是一个function
    this.setState({ filterSelectMap: this.previousFilterSelection }, () => {
      this.call_parent_setFilterObjs();
    }); //恢复之前状态
    this.setState({ modalActive: 'none' }, hide);
  };

  handleUpdateConditionSync = (apiName, value) => {
    let _addCondition = {};
    if (apiName === DeleteAll) {
      //* 当不传递apiname时，重置所有筛选条件
      this.setState({ filterSelectMap: {} }, () => {
        this.call_parent_setFilterObjs();
      });
      return;
    }
    const { filterSelectMap } = this.state;
    _addCondition[apiName] = value;

    const resultData = _.assign({}, filterSelectMap, _addCondition);
    this.setState({ filterSelectMap: resultData }, () => {
      _addCondition = {};
      this.call_parent_setFilterObjs();
    });
  };

  handleUpdateConditionAsync = _.debounce(this.handleUpdateConditionSync, 50);

  //modalActive就是currentModal的意思，或currentTab
  setState_modalActive = (value) => {
    this.setState({ modalActive: value });
  };

  static sortBtnTextFromDes_filterSortMap(sortDes, filterSortMap): string {
    assert(_.isObject(sortDes));
    assert(_.isArray(filterSortMap));
    for (let i = 0; i < filterSortMap.length; i++) {
      const item = filterSortMap[i];
      if (item.sort_by === sortDes.sortBy) {
        return item.label;
      }
    }
    return ''; //如果没找到，返回 空string
  }

  //IndexScreen中有两个FilterEntranceView（rightOne和bottomOne）。只会显示出1个。在这里通过逻辑判断隐藏掉另一个
  renderFilterView = (visible, show, hide) => {
    const { location } = this.props;
    const { filterTypeMap, filterSelectMap, modalActive, filterSortMap } = this.state;

    //bottomOne，如果提供了排序，显示这个
    if (location === 'bottom' && !_.isEmpty(filterSortMap)) {
      const sortBtnOnPress = () => {
        this.setState_modalActive('sort');
        show();
      };
      const filterBtnOnPress = () => {
        this.previousFilterSelection = filterSelectMap; //打开modal前记住
        this.setState_modalActive('filter');
        show();
      };
      return (
        <SortFilter2BtnRow
          visible={!visible}
          sortBtnDisplayText={FilterEntranceView.sortBtnTextFromDes_filterSortMap(
            this.props.sortDes,
            filterSortMap,
          )}
          showItem={{ filter: !_.isEmpty(filterTypeMap), sort: !_.isEmpty(filterSortMap) }}
          updateCacheFilterSelectMap={this.updateCacheFilterSelectMap}
          sortBtnOnPress={sortBtnOnPress}
          filterBtnOnPress={filterBtnOnPress}
        />
      );
    } else if (location === 'right' && _.isEmpty(filterSortMap)) {
      //rightOne。如果没提供排序，显示这个
      return (
        <Button
          transparent
          onPress={() => {
            this.previousFilterSelection = filterSelectMap; //打开modal前记住
            if (!visible) {
              show();
            }
          }}
        >
          <Icon name="ios-funnel-outline" style={styles.icon} />
        </Button>
      );
    } else {
      return null;
    }
  };

  //真正的Modal，react-native提供的Modal组件
  renderFilterModal = (visible, show, hide) => {
    const { handleOrder, sortDes } = this.props;
    const {
      filterTypeMap,
      filterSelectMap,
      modalActive,
      filterSortMap,
      locationState,
    } = this.state;
    return (
      <FilterModal
        visible={visible}
        setState_modalActive={this.setState_modalActive}
        hideWithoutSave={() => this.hideWithoutSave(hide)}
        filterTypeMap={filterTypeMap}
        filterSelectMap={filterSelectMap}
        handleSaveCondition={() => {
          this.handleSaveCondition(hide);
        }}
        locationState={locationState}
        modalActive={modalActive}
        handleUpdateConditionSync={this.handleUpdateConditionSync}
        handleUpdateCondition={this.handleUpdateConditionAsync}
        handleOrder={handleOrder}
        sortDes={sortDes}
        sortMap={filterSortMap}
        objectApiName={this.props.objectApiName}
      />
    );
  };

  //filterSelectMap中key、value都是英文或数字。而需要显示为文字。文字从filterTypeMap中读取
  //返回array
  //在IndexScreen中会调用
  filterObjs_from_filterSelectMap = () => {
    const { filterSelectMap, filterTypeMap } = this.state;
    if (_.size(filterTypeMap) === 0 || _.size(filterSelectMap) === 0) {
      return [];
    }

    assert(_.isObject(filterSelectMap), 'need be Object');
    assert(_.isArray(filterTypeMap), '虽然叫map，实际类型是array');

    const filter_fields = _.get(this.props.layout, 'filter_fields', []);
    const filterSelectMapOrdered = FilterEntranceView.filterSelectMap_orderedBy_filter_fields(
      filterSelectMap,
      filter_fields,
    );

    //先转为 kv形式
    const filterTypeMap_kv = {};
    filterTypeMap.forEach((obj) => {
      filterTypeMap_kv[obj.apiName] = obj;
    });

    const filterObjs = [];
    _.forEach(filterSelectMapOrdered, (value, key) => {
      const filterObj = FilterEntranceView.filterObj_from_apiName_apiValue_filterTypeMapKV(
        key,
        value,
        filterTypeMap_kv,
      );
      //filterObj可能是null
      if (filterObj) {
        filterObjs.push(filterObj);
      }
    });
    return filterObjs;
  };

  //展示 已选中的条件 时，需要和页面顺序一直。而filterSelectMap是用户操作的顺序，和页面顺序不一致。在这里就需要进行排序
  static filterSelectMap_orderedBy_filter_fields(filterSelectMap, filter_fields) {
    if (!_.isArray(filter_fields)) {
      return filterSelectMap;
    }
    assert(_.isArray(filter_fields));
    const orderedMap = {};
    for (let i = 0; i < filter_fields.length; i++) {
      const fieldKey = filter_fields[i];
      const itemValue = filterSelectMap[fieldKey];
      if (itemValue) {
        orderedMap[fieldKey] = itemValue;
      }
    }
    return orderedMap;
  }

  static strFromTimestamp(ts) {
    const o = moment(ts);
    o.utcOffset(8); //以北京时间（UTC+8）格式化
    const str = o.format('YYYYMMDD HH:mm');
    return str;
  }

  //可能返回null！
  static filterObj_from_apiName_apiValue_filterTypeMapKV(
    apiName: string,
    selectedValue: any,
    filterTypeMap_kv: {},
  ) {
    const filterTypeObj = filterTypeMap_kv[apiName];
    const displayName = filterTypeObj.label;

    let displayValue;
    switch (filterTypeObj.type) {
      case 'text':
        assert(_.isString(selectedValue), 'text类型，value应该是string');
        displayValue = selectedValue; // 用户输入的值
        break;
      case 'select_one':
      case 'boolean':
      case 'select_multiple': //不知道select_multiple和select_many有啥区别
      case 'select_many':
        assert(_.isArray(selectedValue), 'text类型，value应该是Array');
        const displayValues = _.map(selectedValue, (optionValue) =>
          FilterEntranceView.optionLabel_from_optionValue(optionValue, filterTypeObj.options),
        );
        displayValue = _.join(displayValues, ', ');
        break;
      case 'date_time':
        const startTime = _.get(selectedValue, 'start', false);
        const endTime = _.get(selectedValue, 'end', false);
        const startTimeIsNum = _.isNumber(startTime);
        const endTimeIsNum = _.isNumber(endTime);
        const startStr = startTimeIsNum ? FilterEntranceView.strFromTimestamp(startTime) : '';
        const endStr = endTimeIsNum ? FilterEntranceView.strFromTimestamp(endTime) : '';
        if (startStr.length && endStr.length) {
          displayValue = `${startStr}-${endStr}`;
        } else if (startStr.length) {
          displayValue = `>=${startStr}`;
        } else if (endStr.length) {
          displayValue = `<=${endStr}`;
        } else {
          displayValue = '';
        }
        break;
      case 'big_int':
      case 'real_number':
        const startNum = _.get(selectedValue, 'startNum', false);
        const endNum = _.get(selectedValue, 'endNum', false);
        const startNumIsNum = _.isNumber(startNum);
        const endNumIsNum = _.isNumber(endNum);
        if (startNumIsNum && endNumIsNum) {
          displayValue = `${startNum}-${endNum}`;
        } else if (startNumIsNum) {
          displayValue = `>=${startNum}`;
        } else if (endNumIsNum) {
          displayValue = `<=${endNum}`;
        } else {
          displayValue = '';
        }
        break;
      default:
        displayValue = _.toString(selectedValue);
        break;
    }
    const underlying = { apiName, selectedValue };
    assert(_.isString(displayValue));
    if (displayValue.length === 0) {
      return null;
    }
    return new FilterObj(displayName, displayValue, underlying);
  }

  static optionLabel_from_optionValue(optionValue: any, options: Array) {
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      const strictEqual = option.value === optionValue;
      //有这种情况：optionValue为string "true",而options=[{label:"是",value:true}]，所以需要toStringEqual
      const toStringEqual = _.toString(option.value) === _.toString(optionValue);
      if (strictEqual || toStringEqual) {
        return option.label;
      }
    }
    return 'notFound ' + optionValue;
  }

  render() {
    const { filterTypeMap } = this.state;

    if (_.isEmpty(filterTypeMap)) {
      return null;
    }

    return (
      <ModalWrapper>
        {({ visible, show, hide }) => (
          <React.Fragment>
            {this.renderFilterView(visible, show, hide)}
            {this.renderFilterModal(visible, show, hide)}
          </React.Fragment>
        )}
      </ModalWrapper>
    );
  }
}

const select = (state) => ({
  token: state.settings.token,
  objectDescription: state.settings.objectDescription,
  permission: state.settings.permission,
});

export default connect(select)(FilterEntranceView);

const styles = StyleSheet.create({
  icon: {
    color: themes.title_icon_color,
    fontSize: themes.font_header_size,
  },
});
