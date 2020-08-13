/**
 * * 筛选组件
 * @flow
 */
import React from 'react';
import _ from 'lodash';
import moment from 'moment';
import { ListItem, Button, Icon } from 'native-base';
import { Image, View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import theme from '../../tabs/common/theme';
import I18n from '../../i18n';
import SearchBar from './SearchBar';
import CheckBox from '../../tabs/common/components/CheckBox';
import CustomerInputView from '../common/CustomerInputView';
import DatePicker from '../../lib/date-picker';
import ListDataView from '../list/ListDataView';
import { processCriterias } from '../../utils/criteriaUtil';
import { DeleteAll } from './FilterEntranceView';
import assert from '../../utils/assert0';

type FilterCommomType = {
  type: string,
  activeFilter?: any,
  data: any,
  apiName: string,
  handleUpdateCondition: (apiName, value) => void,
};

type FilterTypeProps = {
  key: string,
  index: number,
  activeIndex: number,
  label: string,
  handleChangeActive: void,
};

type FilterBottomBtnProps = {
  handleUpdateConditionSync: void, //* 重置清空
  handleSaveCondition: void, //* 保存按钮
};

//* 筛选浮层左部组建
const FilterType = (props: FilterTypeProps) => {
  console.log(props, '======props=======');
  const { label = '', index, activeIndex, handleChangeActive } = props;
  const isSelected = index === activeIndex;

  return (
    <ListItem
      style={[styles.listItem, { backgroundColor: isSelected ? '#fff' : '#e4e5e4' }]}
      onPress={() => {
        !isSelected && handleChangeActive(index);
      }}
    >
      <Text>{label}</Text>
    </ListItem>
  );
};

//* 筛选页面底部有2个按钮，左边按钮"重置条件"，右边按钮是"确定"
const FilterBottomBtn = (props: FilterBottomBtnProps) => {
  const { handleUpdateConditionSync, handleSaveCondition } = props;
  return (
    <View style={styles.bottomBtn}>
      <TouchableOpacity
        style={styles.resetBtn}
        onPress={() => {
          handleUpdateConditionSync(DeleteAll);
        }}
      >
        <Text style={{ color: '#666' }}>{I18n.t('reset_condition')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.ensureBtn} onPress={handleSaveCondition}>
        <Text style={{ color: '#fff' }}>{I18n.t('confirm')}</Text>
      </TouchableOpacity>
    </View>
  );
};

//* 筛选文本类型
const FilterText = (props: FilterCommomType) => {
  const { type, data = '', apiName, handleUpdateCondition } = props;
  const _handle = (text) => {
    handleUpdateCondition(apiName, text);
  };
  return (
    <View
      style={{
        flexDirection: 'row',
        height: 30,
        padding: 5,
        alignItems: 'center',
        backgroundColor: '#F4F4F4',
        borderRadius: 8,
        marginTop: 13,
        marginHorizontal: 13,
      }}
    >
      <CustomerInputView value={data} type={type} handleChangeText={_handle} />
    </View>
  );
};

//* 筛选option组件
class FilterSelect extends React.PureComponent<FilterCommomType, {}> {
  constructor(props) {
    super(props);
    this.state = {
      searchName: '',
    };

    this.dataSource = _.get(props, 'activeFilter.dataSource', {});
    if (!_.isEmpty(this.dataSource)) {
      const criterias = processCriterias(_.get(this.dataSource, 'criterias', []).slice());
      this.objectApiName = _.get(this.dataSource, 'object_api_name');
      this.criterias = criterias;
    }
  }

  _handleUpdate = (value, status) => {
    const { type, data = [], handleUpdateCondition, apiName } = this.props;
    if (type === 'select_many') {
      const newData = data.slice();
      if (status) {
        _.remove(newData, (e) => e == `${value}`);
        handleUpdateCondition(apiName, newData);
      } else {
        handleUpdateCondition(apiName, _.concat(newData, [`${value}`]));
      }
    } else {
      if (!status) {
        handleUpdateCondition(apiName, [`${value}`]);
      }
    }
  };

  renderItem = ({ item, index }) => {
    let label;
    let value;
    const { data } = this.props;
    const { searchName } = this.state;

    const dataSource = _.get(this.props, 'activeFilter.dataSource', {});

    if (!_.isEmpty(dataSource)) {
      const targetField = _.get(dataSource, 'target_field');
      const option = _.get(item, targetField, {});
      label = _.get(option, 'name');

      value = _.get(option, 'id') || _.get(option, 'value');
    } else {
      label = _.get(item, 'label');
      value = _.get(item, 'value');
    }

    if ((searchName !== '' || !_.isUndefined(searchName)) && label.indexOf(searchName) <= -1) {
      return null;
    }

    const isChecked = _.includes(data, `${value}`);

    return (
      <View
        key={`${this.objectApiName}-${index}`}
        style={{
          borderBottomColor: '#333',
          borderBottomWidth: 0.5,
          paddingVertical: 10,
          paddingLeft: 10,
        }}
      >
        <CheckBox
          handleCheck={() => {
            this._handleUpdate(value, isChecked);
          }}
          checked={isChecked}
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
          <View
            style={{
              flex: 1,
            }}
          >
            <Text>{label}</Text>
          </View>
        </CheckBox>
      </View>
    );
  };

  render() {
    const { activeFilter, handleUpdateCondition } = this.props;
    const options = _.get(this.props, 'activeFilter.options', []).slice();
    const { apiName } = activeFilter;

    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={() => {
            handleUpdateCondition(apiName, []);
          }}
        >
          <Text>{I18n.t('filter.ClearCriterias')}</Text>
        </TouchableOpacity>
        <SearchBar
          onChange={(value) => {
            this.setState({ searchName: value });
          }}
        />
        <View style={{ flex: 1 }}>
          {_.isEmpty(this.dataSource) ? (
            <FlatList data={options} renderItem={this.renderItem} extraData={this.state} />
          ) : (
            <ListDataView
              objectApiName={this.objectApiName}
              criterias={this.criterias}
              renderItem={this.renderItem}
            />
          )}
        </View>
      </View>
    );
  }
}

//* 筛选实数组件
const FilterRangeNum = (props: FilterCommomType) => {
  const { apiName, handleUpdateCondition, data = {}, type } = props;

  const _handleStart = (value) => {
    if (value === '') {
      delete data.startNum;
      handleUpdateCondition(apiName, data);
    }
    if (!_.isNumber(value)) return;
    _.set(data, 'startNum', Number(value));
    handleUpdateCondition(apiName, data);
  };

  const _handleEnd = (value) => {
    if (value === '') {
      delete data.endNum;
      handleUpdateCondition(apiName, data);
    }
    if (!_.isNumber(value)) return;
    _.set(data, 'endNum', Number(value));
    handleUpdateCondition(apiName, data);
  };

  const startNum = `${_.get(data, 'startNum', '')}`;
  const endNum = `${_.get(data, 'endNum', '')}`;

  return (
    <View>
      <TouchableOpacity
        style={styles.clearBtn}
        onPress={() => {
          handleUpdateCondition(apiName, {});
        }}
      >
        <Text>{I18n.t('filter.ClearCriterias')}</Text>
      </TouchableOpacity>
      <View>
        <View
          style={[
            styles.input,
            {
              alignItems: 'center',
            },
          ]}
        >
          <CustomerInputView value={startNum} type={type} handleChangeText={_handleStart} />
        </View>
        <View style={{ justifyContent: 'center', alignSelf: 'center', marginTop: 10 }}>
          <Text>{I18n.t('filter.To')}</Text>
        </View>
        <View
          style={[
            styles.input,
            {
              alignItems: 'center',
            },
          ]}
        >
          <CustomerInputView value={endNum} type={type} handleChangeText={_handleEnd} />
        </View>
      </View>
    </View>
  );
};

// * 筛选时间
const FilterDate = (props: FilterCommomType) => {
  const { apiName, handleUpdateCondition, data = {}, type } = props;
  const _handleStartDate = (time) => {
    const resultDate = moment(time).valueOf();
    _.set(data, 'start', resultDate);
    handleUpdateCondition(apiName, data);
  };

  const _handleEndDate = (time) => {
    const resultDate = moment(time).valueOf();
    _.set(data, 'end', resultDate);
    handleUpdateCondition(apiName, data);
  };

  const startTime = _.get(data, 'start') ? moment(data.start).toDate() : '';
  const endTime = _.get(data, 'end') ? moment(data.end).toDate() : '';

  return (
    <View>
      <TouchableOpacity
        style={styles.clearBtn}
        onPress={() => {
          handleUpdateCondition(apiName, {});
        }}
      >
        <Text>{I18n.t('filter.ClearCriterias')}</Text>
      </TouchableOpacity>
      <DatePickerView
        mode="datetime"
        handle={_handleStartDate}
        placeholder={I18n.t('filter.Select')}
        value={startTime}
      />
      <View
        style={{
          alignItems: 'center',
          marginTop: 40,
          paddingTop: 10,
        }}
      >
        <Text>{I18n.t('filter.To')}</Text>
      </View>
      <DatePickerView
        mode="datetime"
        handle={_handleEndDate}
        placeholder={I18n.t('filter.Select')}
        value={endTime}
      />
    </View>
  );
};

const DatePickerView = (props: { handle: void, placeholder: string, mode: string, value: any }) => {
  const { handle, placeholder, mode, value } = props;
  return (
    <DatePicker
      style={{ flex: 1, height: 50, width: '100%' }}
      showIcon={false}
      mode={mode}
      onDateChange={handle}
      date={value}
      placeholder={placeholder || I18n.t('select_date')}
      confirmBtnText={I18n.t('common_sure')}
      cancelBtnText={I18n.t('common_cancel')}
      hideClear
      customStyles={{
        btnTextCancel: {
          fontSize: theme.modal_button_font_size,
          height: 20,
          color: theme.color_text_caption,
        },
        btnTextConfirm: {
          fontSize: theme.modal_button_font_size,
          height: 20,
          color: theme.primary_button_fill_tap,
        },
        dateText: {
          color: '#ccc',
        },
        dateTouchBody: styles.input,
        dateInput: {
          alignItems: 'center',
        },
      }}
    />
  );
};

function VerticalBar(props) {
  const style = {
    width: 1,
    height: 20,
    backgroundColor: '#eeeeee',
  };
  return <View style={style} />;
}

// 一行、只有2个按钮：排序按钮、筛选按钮
const SortFilter2BtnRow = ({
  visible,
  sortBtnDisplayText, //选择排序后，将选中的排序方式展示到按钮上
  showItem = {},
  sortBtnOnPress,
  filterBtnOnPress,
}: {
  visible: boolean,
  sortBtnDisplayText: string,
  showItem: object,
  sortBtnOnPress: () => void,
  filterBtnOnPress: () => void,
}) => {
  const showFilter = _.get(showItem, 'filter', false);
  const showSort = _.get(showItem, 'sort', false);
  const showVerticalBar = showFilter && showSort;

  //* 针对外显层，当modal出现，外显层需要消失
  if (visible === false) return <View style={{ height: 45 }} />;
  const sortButtonText = _.isString(sortBtnDisplayText) ? sortBtnDisplayText : '排序';
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
      }}
    >
      {showSort && (
        <Button style={styles.btn} transparent onPress={sortBtnOnPress}>
          <Image style={styles.marginRight3} source={require('./img/paixu.png')} />
          <Text style={styles.font14Color333}>{sortButtonText}</Text>
        </Button>
      )}
      {showVerticalBar && <VerticalBar />}
      {showFilter && (
        <Button transparent style={styles.btn} onPress={filterBtnOnPress}>
          <Image style={styles.marginRight3} source={require('./img/shaixuan.png')} />
          <Text style={styles.font14Color333}>{I18n.t('SortFilter2BtnRow.Button.Filter')}</Text>
        </Button>
      )}
    </View>
  );
};

export {
  FilterType,
  FilterBottomBtn,
  FilterSelect,
  FilterText,
  FilterDate,
  FilterRangeNum,
  SortFilter2BtnRow,
};

const styles = StyleSheet.create({
  listItem: {
    marginLeft: 0,
    paddingLeft: 15,
  },
  resetBtn: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  ensureBtn: {
    flex: 2,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.fill_base_color,
  },
  bottomBtn: {
    position: 'absolute',
    height: 50,
    flex: 1,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearBtn: {
    marginTop: 13,
    marginRight: 13,
    alignItems: 'flex-end',
  },
  dateBtn: {
    flex: 1,
    height: 30,
    backgroundColor: 'red',
  },
  input: {
    flexDirection: 'row',
    height: 30,
    padding: 5,
    backgroundColor: '#F4F4F4',
    borderRadius: 8,
    marginTop: 13,
    marginHorizontal: 13,
  },
  btn: {
    justifyContent: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  marginRight3: {
    marginRight: 3,
  },
  font14Color333: {
    fontSize: 14,
    color: '#333333',
  },
});
