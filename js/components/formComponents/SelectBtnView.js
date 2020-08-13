/**
 * * 重构单选多选(包含data_source)
 * @flow
 */

import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import _ from 'lodash';
import I18n from '../../i18n';
import HttpRequest from '../../services/httpRequest';
import themes from '../../tabs/common/theme';
import request from '../../utils/request';
import { baseURL, api } from '../../utils/config';
import { executeDetailExp } from '../../utils/util';

type Prop = {
  fieldDesc: any,
  fieldLayout: any,
  navigate: any,
  multipleSelect: boolean,
  fieldItem: ?any,
  validateFail: boolean,
  record: any,
  // value: any,
  // from: string,
  onChange: () => void,
  renderType: string,
  handleSelect: () => void,
};

type State = {
  selected: ?Array<any>,
  fetchList: any,
};

export default class SelectBtnView extends React.Component<Prop, State> {
  constructor(props) {
    super(props);
    const { fieldLayout, fieldDesc } = props;
    const mergedObjectFieldDescribe = Object.assign({}, fieldDesc, fieldLayout);

    //* data_source 配置项
    this.target_field = '';
    //* 判断是否设置依赖
    this.dependency = _.get(mergedObjectFieldDescribe, 'dependency');
    this.textColor = '';
    //* 布局配置默认options
    this.hasLayoutOptions = false;
    this.state = {
      selected: null,
    };
  }

  // 调用的回调函数
  handleSelect = (selected) => {
    const { fieldDesc, onChange, renderType, handleSelect, fieldLayout } = this.props;
    const apiName = _.get(fieldDesc, 'api_name');
    const is_required = _.get(fieldLayout, 'is_required');
    _.set(selected, 'apiName', apiName);
    _.set(selected, 'renderType', renderType);
    _.set(selected, 'is_required', is_required);
    this.setState({
      selected: selected.selected,
    });

    if (onChange) {
      const value = _.get(selected, 'selected[0].value') || _.get(selected, 'selected[0].id');
      onChange(value);
    }

    handleSelect(selected);
  };

  getOptions = () => {
    let options = [];
    const { fieldDesc, fieldLayout } = this.props;

    //* 优先获取布局options，其次从对象描述中获取
    if (!_.isEmpty(_.get(fieldLayout, 'options', ''))) {
      this.hasLayoutOptions = true;
      options = _.get(fieldLayout, 'options');
    } else if (!_.isEmpty(_.get(fieldDesc, 'options'))) {
      options = _.get(fieldDesc, 'options');
    }

    return options;
  };

  getPlaceholder = () => {
    const { selected } = this.state;
    const { renderType } = this.props;
    let label = '请选择';
    if (renderType === 'select_one') {
      const selectedLabel = _.get(selected, '[0].label');
      label = !_.isUndefined(selectedLabel) ? selectedLabel : '请选择';
    }

    return label;
  };

  navigatePage = (disable, destination, param) => {
    const { selected } = this.state;
    const { navigate, fieldLayout } = this.props;
    if (disable) {
      return;
    }

    //* 接收跳转外部webview 链接
    const { data_source = {} } = fieldLayout;

    if (!_.isEmpty(data_source)) {
      navigate('DataSourceList', _.omit(param, 'options'));
      return;
    }

    navigate(destination, param);
  };

  render() {
    const { selected } = this.state;

    const {
      fieldDesc,
      fieldLayout,
      multipleSelect,
      validateFail = false,
      onChange = () => {},
      fieldItem,
      record,
      renderType,
    } = this.props;

    const field = _.get(fieldItem, 'field', '');

    const targetRecordType =
      _.get(fieldLayout, 'target_record_type') ||
      _.get(fieldLayout, 'target_layout_record_type') ||
      'master';
    const dataRecordType =
      _.get(fieldLayout, 'target_data_record_type') || _.get(fieldLayout, 'target_record_type');

    const options = this.getOptions();
    const param = {
      apiName: _.get(fieldDesc, 'target_object_api_name')
        ? _.get(fieldDesc, 'target_object_api_name')
        : _.get(fieldDesc, 'api_name'),
      fieldDesc,
      fieldLayout,
      targetRecordType,
      dataRecordType: dataRecordType || [],
      multipleSelect,
      options,
      callback: this.handleSelect,
      selected,
      record,
    };

    const destination = renderType === 'relation' ? 'Relation' : 'Option';

    const placeholder = this.getPlaceholder();

    return (
      <TouchableOpacity
        style={{
          // height: 30,
          justifyContent: 'center',
        }}
        onPress={() => {
          this.navigatePage(false, destination, param);
        }}
      >
        <Text style={{ textAlign: 'right', paddingRight: 5 }}>{placeholder}</Text>
      </TouchableOpacity>
    );
  }
}
