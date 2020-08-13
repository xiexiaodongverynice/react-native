/**
 * Create by Uncle Charlie, 4/1/2018
 * @flow
 */

import React from 'react';
import { Body, Icon, Left, Right, Picker, Title, Button, Text as TextNB } from 'native-base';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import _ from 'lodash';
import ModalSelector from '../../../lib/modalSelector';
import { StyledHeader } from '../../../tabs/common/components';
import I18n from '../../../i18n';
import HttpRequest from '../../../services/httpRequest';
import themes from '../../../tabs/common/theme';
import request from '../../../utils/request';
import { baseURL, api } from '../../../utils/config';
import { executeDetailExp } from '../../../utils/util';
import { toastWaring } from '../../../utils/toast';
import { processCriterias } from '../../../utils/criteriaUtil';

const { tutorial_query } = api;

type Prop = {
  fieldDesc: any,
  fieldLayout: any,
  navigate: any,
  multipleSelect: boolean,
  renderType: string,
  placeholderValue: ?string,
  title: string,
  disabled: ?boolean,
  token: string,
  handleCreate: (selected: any) => void,
  record: ?any, //* 表单数据
  validateFail: boolean,
  isRadio: boolean,
  value: any,
  relatedParentData: any,
  onChange: () => void,
  reserveOptions: [],
};

type State = {
  selected: ?Array<any>,
  subordinateList: Array, // * 用于选择下属类型数据储存
};

export default class SelectOneView extends React.Component<Prop, State> {
  constructor(props) {
    super(props);
    const { fieldLayout, fieldDesc } = props;
    const mergedObjectFieldDescribe = Object.assign({}, fieldDesc, fieldLayout);

    //* data_source 配置项
    this.dataSource = _.get(fieldLayout, 'data_source', {});
    this.target_field = '';

    // * 单选多选配置查询布局
    this.targetRecordType =
      _.get(fieldLayout, 'target_record_type') ||
      _.get(fieldLayout, 'target_layout_record_type') ||
      'master';
    this.dataRecordType =
      _.get(fieldLayout, 'target_data_record_type') || _.get(fieldLayout, 'target_record_type');

    //* 判断是否设置依赖
    this.dependency = _.get(mergedObjectFieldDescribe, 'dependency');
    this.textColor = '';

    //* 布局配置默认options
    this.hasLayoutOptions = false;

    this.state = {
      selected: null,
      ModalSelector: false,
      subordinateList: [],
    };
  }

  componentDidMount() {
    const { multipleSelect, token, renderType, placeholderValue } = this.props;

    if (!_.isEmpty(this.dataSource)) {
      const { object_api_name, criterias = [], target_field = '' } = this.dataSource;
      this.target_field = target_field;
      this.fetchData(token, object_api_name, criterias);
    }

    if (renderType === 'subordinate') {
      // ? 筛选下属组件？
      this.fetchSubordinateData(token);
    }

    //* 初始化给多选 已选中
    if (renderType === 'select_multiple' && placeholderValue && _.isEmpty(this.dataSource)) {
      const options = this.getOptions();
      const selected = [];
      _.each(options, (option) => {
        _.each(placeholderValue, (val) => {
          if (option.value === val) {
            selected.push(option);
          }
        });
      });
      this.setState({
        selected,
      });
    }

    //* 单选默认选中
    if (!multipleSelect) {
      this.checkedDefaultValue();
    }
  }

  componentDidUpdate(prevProps, prevStates) {
    const field = _.get(this.props, 'fieldDesc.api_name');
    const currentValue = _.get(this.props, `record.${field}`);
    const prevValue = _.get(prevProps, `record.${field}`);

    if (currentValue != prevValue) {
      // * 清空value
      if (_.isUndefined(currentValue)) {
        this.handleSelect({ selected: [] });
        return;
      }

      //* 后面的程序，是外部赋值给该fiield，在值改变的同时
      //* 需要同步调用rc-form的onchange和获取到对应的label来显示
      //! 所以如果是data_source 就无法同步进行赋值,尽量减少外部修改data_source的值
      const options = this.getOptions();
      if (_.isEmpty(options) || !_.isEmpty(this.dataSource)) return;

      const selected = _.find(options, { value: currentValue });
      //* 传递value没有匹配的options
      if (_.isEmpty(selected)) return;
      this.handleSelect({ selected: [selected] });
    }
  }

  fetchSubordinateData = async (token: string) => {
    const url = `${baseURL}${tutorial_query.replace(
      '{id}',
      global.FC_CRM_USERID,
    )}/?restrict=true&token=${token}`;
    const resultData = await request(url, 'GET');
    const data = _.get(resultData, 'body.result', []);
    const renderData = [];
    _.map(data, (item) => {
      renderData.push({
        label: item.name,
        value: item.id,
      });
    });
    this.setState({ subordinateList: renderData });
  };

  isDisabled = () => {
    const { disabled, record } = this.props;

    //* disable优先考虑布局配置
    if (disabled) {
      return true;
    }

    //* 布局不为disable，则考虑是否设置了依赖字段
    if (!_.isEmpty(this.dependency)) {
      //* 有依赖项进行依赖判断
      const { on } = this.dependency;
      const dependencyFieldValue = _.get(record, on);
      if (_.isUndefined(dependencyFieldValue) || _.isNull(dependencyFieldValue)) {
        return true;
      }
    }
    return false;
  };

  checkedDefaultValue = () => {
    const { fieldDesc, fieldLayout } = this.props;
    const mergedObjectFieldDescribe = Object.assign({}, fieldDesc, fieldLayout);
    const need_default_checked = _.get(mergedObjectFieldDescribe, 'need_default_checked');

    if (!_.isEmpty(need_default_checked) && _.get(need_default_checked, 'need_checked')) {
      const defaultValue = _.get(need_default_checked, 'checked_value');
      const options = _.get(mergedObjectFieldDescribe, 'options');
      const defaultCheck = _.find(options, (e) => e.value === defaultValue);
      if (!_.isEmpty(defaultCheck)) {
        this.handleSelect({ selected: [defaultCheck], multipleSelect: false });
      }
    }
  };

  // 调用的回调函数
  handleSelect = (selected) => {
    const { handleCreate, fieldDesc, onChange, renderType, relatedParentData } = this.props;
    const apiName = _.get(fieldDesc, 'api_name');

    _.set(selected, 'apiName', apiName);
    _.set(selected, 'renderType', renderType);
    if (selected['selected'] && !selected['selected'][0] && apiName === 'customer') {
      _.set(selected, 'selected', [relatedParentData]);
      _.set(selected, 'apiName', apiName);
      _.set(selected, 'renderType', renderType);
    }
    this.setState({
      selected: selected.selected,
    });

    if (onChange) {
      const value = _.get(selected, 'selected[0].value', _.get(selected, 'selected[0].id'));
      onChange(value);
    }

    handleCreate(selected);
  };

  fetchData = async (token: string, object_api_name: string, criterias: Array<any>) => {
    const { renderType, placeholderValue, fieldLayout, value, record } = this.props;
    const objectApiName = object_api_name;

    const fieldValueList = _.split(_.toString(value), ',');
    // 修改格式不正确的查询条件
    const valueList = [];
    fieldValueList.forEach((val) => {
      if (typeof val === 'string') {
        if (val.indexOf('[') > -1) {
          val = _.replace(val, '[', '');
        }
        if (val.indexOf(']') > -1) {
          val = _.replace(val, ']', '');
        }
      }
      valueList.push(val);
    });

    const dataSourceCriterias = processCriterias(_.get(this.dataSource, 'criterias', []), record);
    const fieldValueListCriteria = {
      field: this.target_field ? `${this.target_field}.id` : 'id',
      operator: 'in',
      value: value ? valueList : [],
    };

    // * enablec_async_criterias默认为false，当为true时dataSource初始化查询条件取配置和id(target_field)的并集
    const enablecAsyncCriterias = _.get(this.dataSource, 'enablec_async_criterias', false);
    const criteria = enablecAsyncCriterias
      ? _.concat([fieldValueListCriteria], dataSourceCriterias)
      : [fieldValueListCriteria];

    const payload = {
      token,
      objectApiName,
      criteria,
      joiner: 'and',
      pageSize: 2500,
      pageNo: 1,
    };
    const data = await HttpRequest.query(payload);
    const fetchList = _.get(data, 'result');

    const selected = [];
    const labelExp = _.get(fieldLayout, 'render_label_expression');
    if (renderType === 'select_multiple' && placeholderValue) {
      _.each(placeholderValue, (val) => {
        _.each(fetchList, (fetchData) => {
          const tmpData = this.target_field ? _.get(fetchData, this.target_field) : fetchData;
          if (_.get(tmpData, 'id') == val) {
            selected.push({
              label: labelExp ? executeDetailExp(labelExp, tmpData) : _.get(tmpData, 'name'),
              value: val,
            });
          }
        });
      });
      this.setState({ selected });
    }

    if (renderType === 'select_one' && placeholderValue) {
      const tmpData = this.target_field
        ? _.get(fetchList, ['0', this.target_field])
        : _.get(fetchList, '0');

      this.setState({
        selected: {
          label: labelExp ? executeDetailExp(labelExp, tmpData) : _.get(tmpData, 'name'),
          value: _.get(tmpData, 'id'),
        },
      });
    }
  };

  getOptions = () => {
    const { fieldDesc, fieldLayout, record, reserveOptions, renderType } = this.props;

    if (renderType === 'subordinate') {
      return _.get(this.state, 'subordinateList', []);
    }

    if (!_.isEmpty(reserveOptions)) {
      return reserveOptions;
    }

    let options = [];
    const mergedObjectFieldDescribe = Object.assign({}, fieldDesc, fieldLayout);

    if (!_.isEmpty(this.dataSource)) {
      return options;
    }

    const { dependency = {} } = mergedObjectFieldDescribe;

    //* 如果布局配置了options优先布局
    if (!_.isEmpty(_.get(fieldLayout, 'options', ''))) {
      this.hasLayoutOptions = true;
      options = _.get(fieldLayout, 'options');
    } else if (!_.isEmpty(dependency)) {
      //* 有依赖项进行依赖判断
      const { on, rules, defaults = [] } = dependency;
      const dependencyFieldValue = _.get(record, on);
      // * 当被依赖项未选择时，为disable状态
      const rule = rules.find((x) => x.when.indexOf(dependencyFieldValue) >= 0);
      //* 若没有设置对应的规则，则下拉选项为空,dependencyFieldValueMap = true
      const optionValues = rule ? rule.then : defaults;
      options = _.isEmpty(optionValues) ? [] : _.cloneDeep(_.get(fieldDesc, 'options'));
      _.remove(options, (option) => _.indexOf(optionValues, option.value) < 0);
    } else if (!_.isEmpty(_.get(fieldDesc, 'options'))) {
      //* 根据对象描述填充options
      options = _.cloneDeep(_.get(fieldDesc, 'options'));
    }

    return options;
  };

  matchMultipleName = (item, value) => {
    let _resultValue = '';
    if (this.target_field) {
      _.each(value, (e) => {
        const _id = _.get(item, `${this.target_field}.id`);
        const _name = _.get(item, `${this.target_field}.name`);
        if (e == _id && _name) {
          _resultValue = _name;
          return false;
        }
      });
    } else {
      _.each(value, (e) => {
        const _id = _.get(item, 'id');
        const _name = _.get(item, 'name');
        if (e == _id && _name) {
          _resultValue = _name;
          return false;
        }
      });
    }
    return _resultValue;
  };

  selectedWebCallback = async (messageData) => {
    const { handleCreate, fieldDesc, onChange, renderType, multipleSelect } = this.props;

    const apiName = _.get(fieldDesc, 'api_name');

    const resultData = {
      selected: messageData,
      apiName,
      renderType,
      multipleSelect,
    };

    this.setState({
      selected: messageData,
    });

    if (onChange) {
      const value = _.get(messageData, '[0].value') || _.get(messageData, '[0].id');
      onChange(value);
    }

    handleCreate(resultData);
  };

  navigatePage = (disable, destination, param) => {
    const { selected } = this.state;
    const { navigate, fieldLayout } = this.props;
    if (disable) {
      return;
    }

    //* 接收跳转外部webview 链接
    const { widget = false, data_source = {} } = fieldLayout;
    if (widget) {
      let data = [];
      if (!_.isEmpty(selected)) {
        data = _.map(selected, (item) => ({ ...item, value: parseInt(_.get(item, 'value')) }));
      }

      navigate('WebItem', { ...fieldLayout, value: data, callback: this.selectedWebCallback });
      return;
    }

    if (!_.isEmpty(data_source)) {
      navigate('DataSourceList', _.omit(param, 'options'));
      return;
    }

    navigate(destination, param);
  };

  getPlaceholder = () => {
    const { selected } = this.state;
    const { renderType, placeholderValue } = this.props;

    let placeholder = I18n.t('common_select');

    if (_.isNumber(selected) || !_.isEmpty(selected)) {
      if (_.isArray(selected)) {
        if (renderType === 'select_multiple') {
          placeholder = '已选择';
        } else {
          placeholder = _.map(selected, (o) => _.get(o, 'label'));
        }
      } else if (_.isObject(selected)) {
        placeholder = _.get(selected, 'label');
      }
    } else {
      placeholder = placeholderValue || I18n.t('common_select');

      if (!_.isEmpty(placeholderValue) && renderType == 'select_multiple') {
        placeholder = '已选择';
      }
    }

    if (_.isObject(placeholder) && !placeholder[0]) {
      placeholder = I18n.t('common_select');
    }

    return placeholder;
  };

  getPlaceholderColor = (disable, placeholder) => {
    let placeholderColor;
    const { validateFail = false, isRadio } = this.props;

    if (disable) {
      placeholderColor = themes.input_disable_color;
    } else if (!disable && placeholder == I18n.t('common_select')) {
      placeholderColor = themes.input_placeholder;
    } else {
      placeholderColor = themes.input_color;
    }

    if (validateFail) {
      placeholderColor = themes.input_color_require;
    }

    if (validateFail && isRadio && placeholder !== I18n.t('common_select')) {
      placeholderColor = themes.input_color;
    }

    return placeholderColor;
  };

  //* 当为单选切options小于10个时
  renderSimpleView = ({ options, disable, placeholder, placeholderColor, title }) => {
    const _simpleHandleSelet = (pikerValue) => {
      const label = _.chain(options)
        .find((option) => _.get(option, 'value') == pikerValue)
        .get('label')
        .value();
      const data = { selected: [{ value: pikerValue, label }] };
      this.handleSelect(data);
    };

    if (themes.platform !== 'ios') {
      return (
        <ModalSelector
          data={options}
          cancelText="取消"
          visibility={this.state.ModalSelector}
          supportedOrientations={['landscape']}
          disabled={disable}
          onChange={(option) => {
            const value = _.get(option, 'value');
            _.isUndefined(value) || _simpleHandleSelet(value);
          }}
        >
          <Text
            numberOfLines={1}
            style={{ textAlign: 'right', paddingRight: 5, color: placeholderColor }}
          >
            {placeholder}
          </Text>
        </ModalSelector>
      );
    } else {
      return disable ? (
        <View
          style={{
            justifyContent: 'center',
          }}
        >
          <Text
            numberOfLines={1}
            style={{ textAlign: 'right', paddingRight: 5, color: placeholderColor }}
          >
            {placeholder}
          </Text>
        </View>
      ) : (
        <Picker
          style={styles.pikerStyle}
          textStyle={[
            styles.pikerTextStyle,
            {
              color: placeholderColor,
            },
          ]}
          itemStyle={styles.pikerItemStyle}
          itemTextStyle={styles.pickerItemTextStyle}
          renderButton={({ onPress, text, picker, selectedItem }) => {
            const emptyCheckOnPress = () => {
              if (options.length === 0) {
                toastWaring(I18n.t('filter_non_matched'));
              } else {
                onPress();
              }
            };

            // 为了添加属性，索性重写了 renderButton 属性。
            const textStyle = [
              styles.pikerTextStyle,
              {
                color: placeholderColor,
              },
            ];
            return (
              <Button
                style={[styles.pickerStyle, { alignSelf: 'flex-end' }]}
                dark
                picker
                transparent
                onPress={emptyCheckOnPress}
              >
                {text ? (
                  <TextNB style={textStyle} note numberOfLines={1}>
                    {text}
                  </TextNB>
                ) : (
                  <TextNB numberOfLines={1} style={textStyle} note>
                    {placeholder}
                  </TextNB>
                )}
              </Button>
            );
          }}
          renderHeader={(backAction) => (
            <StyledHeader>
              <Left>
                <TouchableOpacity onPress={backAction}>
                  <Icon name="arrow-down" color="#fff" style={{ color: '#fff' }} />
                </TouchableOpacity>
              </Left>
              <Body style={{ alignItems: 'center', flex: 1 }}>
                <Title
                  style={{
                    color: themes.title_text_color,
                    fontSize: themes.title_size,
                  }}
                >
                  {title || I18n.t('common_options')}
                </Title>
              </Body>
              <Right />
            </StyledHeader>
          )}
          mode="dialog"
          placeholder={placeholder}
          onValueChange={_simpleHandleSelet}
        >
          {_.map(options, (item, index) => (
            <Picker.Item
              key={index}
              label={_.get(item, 'label')}
              value={_.get(item, 'value', '')}
            />
          ))}
        </Picker>
      );
    }
  };

  render() {
    const { selected } = this.state;
    const {
      fieldDesc,
      fieldLayout,
      value,
      multipleSelect,
      renderType,
      title,
      record,
      onChange = () => {},
    } = this.props;

    const disable = this.isDisabled();
    const options = this.getOptions();
    const placeholder = this.getPlaceholder();
    const placeholderColor = this.getPlaceholderColor(disable, placeholder);

    const param = {
      apiName: _.get(fieldDesc, 'target_object_api_name')
        ? _.get(fieldDesc, 'target_object_api_name')
        : _.get(fieldDesc, 'api_name'),
      fieldDesc,
      fieldLayout,
      targetRecordType: this.targetRecordType,
      dataRecordType: this.dataRecordType || [],
      multipleSelect,
      options,
      callback: this.handleSelect,
      selected,
      record,
    };

    // * 后期查看单选是否配置
    const destination = renderType === 'relation' ? 'Relation' : 'Option';

    if (!_.isEmpty(fieldDesc.dependency) && !this.hasLayoutOptions) {
      const { on } = this.dependency;
      const dependencyFieldValue = _.get(record, on);
      // * 当被依赖项切换且options改变，或者被依赖项清空时，清空依赖item的数据
      const isClear = _.isUndefined(dependencyFieldValue) || _.isNull(dependencyFieldValue);
      if (!_.isEmpty(selected) && (_.findIndex(options, selected[0]) < 0 || isClear)) {
        this.handleSelect({ selected: [], multipleSelect });
      }
    }

    //* onChange是rc-form的回调函数，将value汇总后验证
    if (disable && !value) {
      const initValue = _.get(this.props, 'data-__meta.initialValue');
      if (initValue) {
        onChange(initValue);
      }
    }

    const optLen = options.length;

    // * 当为多选或者options大于10，跳转新页面，否则采用新UI
    if (renderType == 'select_multiple' || !_.isEmpty(this.dataSource) || optLen > 10) {
      return (
        <TouchableOpacity
          style={{
            justifyContent: 'center',
          }}
          onPress={() => {
            this.navigatePage(disable, destination, param);
          }}
        >
          <Text style={{ textAlign: 'right', paddingRight: 5, color: placeholderColor }}>
            {placeholder}
          </Text>
        </TouchableOpacity>
      );
    } else {
      return this.renderSimpleView({ options, disable, placeholder, placeholderColor, title });
    }
  }
}

const styles = StyleSheet.create({
  pikerStyle: {
    alignSelf: 'flex-end',
    height: 15, //在iOS上未生效，因为内部有个Button，指定的是height:45
    paddingTop: 0,
    paddingBottom: 0,
    borderRadius: 0,
  },
  pikerTextStyle: {
    //Text style of header
    fontSize: 14,
    paddingRight: 5,
    paddingLeft: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  pickerItemTextStyle: {
    color: '#333333',
    fontSize: 15,
    lineHeight: 21,
  },
  pikerItemStyle: {
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0,
    marginBottom: 0,

    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 11,
    paddingBottom: 11,

    borderBottomColor: '#dddddd',
    borderBottomWidth: themes.borderWidth,
  },
});
