/**
 * Create by Uncle Charlie, 4/1/2018
 * @flow
 */

import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import _ from 'lodash';
import I18n from '../../../i18n';
import HttpRequest from '../../../services/httpRequest';
import themes from '../../../tabs/common/theme';
import { crmTenant_luozhen } from '../../../utils/const';

type selectedItemType = { label: ?string, value?: number | string, id?: string | number };

type selectedType = {
  apiName: string,
  renderType: string,
  selected: Array<selectedItemType>,
};

type Prop = {
  fieldDesc: any,
  fieldLayout: any,
  navigate: any,
  multipleSelect: boolean,
  renderType: string,
  placeholderValue: ?string,
  disabled?: boolean,
  pageType: 'add' | 'edit',
  token: string,
  handleCreate: (selected: any) => void,
  record: ?any, //* 表单数据
  fieldItem: {
    target_object_api_name: string,
  },
  validateFail: boolean,
  value: any,
  from: string,
  relatedParentData: any,
  onChange: (string | number | null) => void,
};

type State = {
  selected: ?Array<selectedItemType>,
  placeholderValue: ?string,
};

export default class SelectButton extends React.Component<Prop, State> {
  textColor: string;
  constructor(props: Prop) {
    super(props);

    this.textColor = '';

    this.state = {
      selected: null,
      placeholderValue: props.placeholderValue,
    };
  }

  componentDidMount() {
    const {
      fieldLayout,
      multipleSelect,
      token,
      record,
      value,
      fieldItem,
      pageType,
      renderType,
      placeholderValue,
    } = this.props;

    const onLookupChange = _.get(fieldLayout, 'onLookupChange');
    // * 新建页面初始化时，有onLookupChange的relation字段，执行setfield
    if (
      onLookupChange &&
      !_.isEmpty(record) &&
      _.toLower(renderType) === 'relation' &&
      pageType === 'add'
    ) {
      //* 通过相关联的对象,找relation对应数据
      const targetObjectApiName = fieldItem.target_object_api_name;
      if (value) {
        this.handSelectedRecord(targetObjectApiName, value, token);
      }
    }
  }

  componentWillReceiveProps(nextprops: Prop) {
    const next = _.get(nextprops, 'placeholderValue');
    const current = _.get(this.props, 'placeholderValue');

    if (next !== current) {
      this.setState({ placeholderValue: next });
    }
  }

  isDisabled = () => {
    const { disabled, from, record } = this.props;

    //* disable优先考虑布局配置
    if (disabled) {
      return true;
    }

    return false;
  };

  handSelectedRecord = async (targetObjectApiName: string, recordId: any, token: string) => {
    const { handleCreate, fieldDesc, multipleSelect, renderType } = this.props;
    const data = await HttpRequest.queryUserBasicInfo({
      objectApiName: targetObjectApiName,
      userId: recordId,
      token,
    });

    if (_.isEmpty(data)) return;
    const apiName = _.get(fieldDesc, 'api_name');
    const params = {
      apiName,
      renderType,
      multipleSelect,
      selected: [data],
    };
    handleCreate(params);
  };

  // 调用的回调函数
  handleSelect = (selected: selectedType) => {
    const {
      handleCreate,
      fieldDesc,
      onChange,
      fieldItem,
      renderType,
      relatedParentData,
    } = this.props;
    const apiName = _.get(fieldDesc, 'api_name');

    _.set(selected, 'apiName', apiName);
    _.set(selected, 'renderType', renderType);

    //? 怀疑为罗诊兼容配置 待确定？
    if (
      crmTenant_luozhen() &&
      selected['selected'] &&
      !selected['selected'][0] &&
      apiName === 'customer'
    ) {
      _.set(selected, 'selected', [relatedParentData]);
    }

    this.setState({
      selected: selected.selected,
    });

    if (onChange) {
      const value = _.get(selected, 'selected[0].value') || _.get(selected, 'selected[0].id');
      onChange(value);
    }

    handleCreate(selected);
  };

  fetchWidgetRelationData = async (relationId: string | number) => {
    if (!relationId) return;

    const { fieldLayout } = this.props;
    const objectApiName = _.get(fieldLayout, 'field');

    const criteria = [
      {
        field: 'id',
        value: [relationId],
        operator: '==',
      },
    ];
    const payload = {
      token: global.FC_CRM_TOKEN,
      objectApiName,
      criteria,
      joiner: 'and',
      // orderBy: 'create_time',
      //order: 'desc',
      pageSize: 20,
      pageNo: 1,
    };
    const data = await HttpRequest.query(payload);
    return _.get(data, 'result[0]', {});
  };

  selectedWebCallback = async (messageData: any) => {
    const { handleCreate, fieldDesc, onChange, renderType, multipleSelect } = this.props;

    const apiName = _.get(fieldDesc, 'api_name');

    if (renderType === 'relation') {
      if (!_.isEmpty(messageData)) {
        //* 当为relation时，外部页面只传递id和label，无法满足onlookupchange等操作，需要请求获取relation其他信息
        const relationId = _.get(messageData, '0.value');
        const relationData = await this.fetchWidgetRelationData(relationId);
        _.set(messageData, '0', relationData);
      }
    }

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

  navigatePage = (disable?: boolean, destination: string, param: Object) => {
    const { selected } = this.state;
    const { navigate, fieldLayout } = this.props;
    if (disable) {
      return;
    }

    //* 接收跳转外部webview 链接
    const { widget = false } = fieldLayout;
    if (widget) {
      let data = [];
      if (!_.isEmpty(selected)) {
        data = _.map(selected, (item) => ({ ...item, value: parseInt(_.get(item, 'value')) }));
      }

      navigate('WebItem', { ...fieldLayout, value: data, callback: this.selectedWebCallback });
      return;
    }

    navigate(destination, param);
  };

  render() {
    const { selected, placeholderValue } = this.state;

    const {
      fieldDesc,
      fieldLayout,
      multipleSelect,
      validateFail = false,
      record,
      onChange = _.noop,
      fieldItem,
      disabled,
      value,
    } = this.props;

    const field = _.get(fieldItem, 'field', '');

    const targetRecordType =
      _.get(fieldLayout, 'target_record_type') ||
      _.get(fieldLayout, 'target_layout_record_type') ||
      'master';

    const dataRecordType =
      _.get(fieldLayout, 'target_data_record_type') || _.get(fieldLayout, 'target_record_type');

    const param = {
      apiName: _.get(fieldDesc, 'target_object_api_name')
        ? _.get(fieldDesc, 'target_object_api_name')
        : _.get(fieldDesc, 'api_name'),
      fieldDesc,
      fieldLayout,
      targetRecordType,
      dataRecordType: dataRecordType || [],
      multipleSelect,
      options: [],
      callback: this.handleSelect,
      selected,
      record,
    };

    let placeholder;
    if (_.isNumber(selected) || !_.isEmpty(selected)) {
      if (_.isArray(selected)) {
        placeholder = _.map(selected, (o) => _.get(o, `${field}__r.name`) || _.get(o, 'name'));
      } else if (_.isObject(selected)) {
        placeholder = _.get(selected, `${field}__r.name`) || _.get(selected, 'name');
      }
      if (placeholderValue) {
        placeholder = placeholderValue;
      }
    } else {
      placeholder = placeholderValue || I18n.t('common_select');
    }

    if (disabled) {
      this.textColor = themes.input_disable_color;
    } else if (!disabled && placeholder == I18n.t('common_select')) {
      this.textColor = themes.input_placeholder;
    } else {
      this.textColor = themes.input_color;
    }

    if (validateFail) {
      this.textColor = themes.input_color_require;
    }

    if (_.isObject(placeholder) && !placeholder[0]) {
      placeholder = I18n.t('common_select');
    }

    //* onChange是rc-form的回调函数，将value汇总后验证
    if (disabled && !value) {
      const initValue = _.get(this.props, 'data-__meta.initialValue');
      if (initValue) {
        onChange(initValue);
      }
    }

    return (
      <TouchableOpacity
        style={{
          justifyContent: 'center',
        }}
        onPress={() => {
          this.navigatePage(disabled, 'Relation', param);
        }}
      >
        <Text style={{ textAlign: 'right', paddingRight: 5, color: this.textColor }}>
          {placeholder}
        </Text>
      </TouchableOpacity>
    );
  }
}
