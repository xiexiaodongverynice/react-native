/**
 * @flow
 */
import React from 'react';
import _ from 'lodash';
import moment from 'moment';
import { createForm } from 'rc-form';
import { Body, Right, Title, Button, Left, Content } from 'native-base';
import { connect } from 'react-redux';
import { Text } from 'react-native';
import { StyledContainer, StyledHeader } from '../common/components';
import themes from '../common/theme';
import InnerEditView from '../common/InnerViews/InnerEditView';
import { getQueryInitialState } from '../common/helpers/QueryHelper';
import * as Util from '../../utils/util';
import { toastError } from '../../utils/toast';
import { checkValidExpression } from '../common/helpers/recordHelper';
import I18n from '../../i18n';

const ARRARY_NO_VALIDAT = ['sign_in_photo', 'sign_out_photo', 'survey_feedback', 'image', 'photo'];

class ApprovalCreateScreen extends React.PureComponent<Prop, State> {
  state = {};

  handleCreate = (actionLayout) => {
    const { form, navigation, updateLoading } = this.props;
    const {
      state: { params },
    } = navigation;
    const { handleSubmit } = params;
    const { record } = this.state;

    if (updateLoading) {
      console.warn('===>CreateScreen is loading, do not update anything');
      return;
    }

    //* 表单验证兼容处理
    _.forEach(record, (value, key) => {
      if (_.isArray(value) && !_.isEmpty(value) && ARRARY_NO_VALIDAT.every((e) => e !== key)) {
        form.setFieldsValue({
          [key]: value,
        });
      } else if (_.isBoolean(value)) {
        form.setFieldsValue({
          [key]: value,
        });
      }
    });

    form.validateFields(async (err, values) => {
      if (err) {
        return toastError(_.get(Object.values(err), ['0', 'errors', '0', 'message']));
      }
      /**
       * check valid_expression
       */
      const valid_result = checkValidExpression({
        layout: actionLayout,
        thizRecord: Object.assign({}, this.detailData || {}, values, record),
      });
      if (_.isString(valid_result)) return toastError(valid_result);

      // TODO: validates fields
      const validValues = _.omitBy(values, (v) => v == null);
      if (record) {
        for (const x in record) {
          if (typeof record[x] === 'object' && _.isEmpty(record[x])) {
            record[x] === null;
            if (validValues[x]) {
              record[x] = validValues[x];
            }
          }
        }
      }

      const processedData = _.cloneDeep(record); // 真正的需要更新的对象，修改了多少，就传参后台多少(可去除dcr变更字段)

      _.each(processedData, (val, key) => {
        if (_.has(val, '_isAMomentObject')) {
          _.set(processedData, key, val.valueOf());
        }
      });
      handleSubmit(processedData);
      navigation.goBack();
    });
  };

  debounceSetState = (data = {}, removeData = []) => {
    const _callback = (composeData, removeComposeData) => {
      const { record } = this.state;
      const resultData = _.assign({}, record, composeData);
      if (!_.isEmpty(removeComposeData)) {
        _.each(removeComposeData, (e) => {
          delete resultData[e];
        });
      }
      this.setState({ record: resultData }, () => {});
    };
    Util.debounceStateUpdate(data, removeData, _callback);
  };

  handleSelectData = ({ apiName, selected, multipleSelect, renderType }, fieldLayout = {}) => {
    if (!apiName) {
      console.warn('====>set empty apiName!!!');
      return;
    }

    if (!multipleSelect) {
      const value = _.get(selected, '[0].id', null) || _.get(selected, '[0].value', null);
      const onchangeClearMap = _.get(fieldLayout, 'onChange.clear', []);
      if (value || _.isBoolean(value)) {
        const _resultRemoveMap = [];
        const temp = _.set({}, apiName, value);
        const temp__r = _.set({}, apiName + '__r', _.get(selected, '[0]', {}));
        //* remove数据中有field和field__r的数据集合
        _.each(onchangeClearMap, (_fieldName) => {
          _resultRemoveMap.push(_fieldName);
          _resultRemoveMap.push(`${_fieldName}__r`);
        });
        this.debounceSetState({ ...temp__r, ...temp }, _resultRemoveMap);
      } else {
        const _resultRemoveMap = [];
        //* 清空select_one和relation，和其__r以及 onLookupChange
        const setFieldMap = _.get(fieldLayout, 'onLookupChange.setFields', []);
        const removeFieldMap = !_.isEmpty(setFieldMap) ? _.map(setFieldMap, (e) => e.target) : [];
        //* remove数据中有field和field__r的数据集合
        _.each([...onchangeClearMap, ...removeFieldMap], (_fieldName) => {
          _resultRemoveMap.push(_fieldName);
          _resultRemoveMap.push(`${_fieldName}__r`);
        });
        this.debounceSetState({}, [apiName, `${apiName}__r`].concat(_resultRemoveMap));
      }
    } else {
      const value = _.map(selected, (o) => o.value);
      const temp = _.set({}, apiName, value);
      this.debounceSetState(temp);
    }
  };

  clearRelateDatas = async (apiNameList) => {};

  handleRelatedChange = (changedValues: Array<ChangeValue>) => {
    console.log('===>create screen related change1', changedValues);
    _.each(changedValues, (change) => {
      _.each(this.changeSetFields, (setField) => {
        if (change.apiName == setField.field && setField.onChange) {
          //去掉当客户变动的时候，相关联的库存等操作，需要增加新的配置支持
          const clearRelates = setField.onChange.clear;
          const clearList = [];
          _.each(clearRelates, (clearR) => {
            _.each(this.components, (comp) => {
              if (comp.related_list_name && comp.related_list_name == clearR) {
                clearList.push(comp.ref_obj_describe);
              }
            });
          });
          this.clearRelateDatas(clearList);
        }
      });
    });
    const getValue = (item) => {
      const { value } = item;
      if (value === null) {
        return null;
      }
      if (item.apiName == 'end_time' && value.indexOf && value.indexOf(':') == 2) {
        const today = moment().format('YYYY-MM-DD');
        const str = today + ' 00:00';
        const time = moment(str).unix() * 1000;
        return time + this.getTimestamp(value);
      }
      if (_.isObject(value)) {
        return _.get(item, 'value.id') || _.get(item, 'value.value') || _.get(item, 'value');
      } else {
        return value;
      }
    };
    let relateObj = {};
    const temp = {};
    _.each(changedValues, (item) => {
      //* 后续使用_.has进行修改，测试有无影响
      if (
        (getValue(item) === null || getValue(item) || _.get(item, 'value') === 0) &&
        item.apiName.indexOf('__r') < 0
      ) {
        _.set(temp, `${item.apiName}`, getValue(item));
        const itemValue = _.get(item, 'value');
        if (_.isObject(itemValue) && itemValue) {
          relateObj = itemValue;
        }
      } else if (item.apiName.indexOf('__r') > -1) {
        _.set(temp, `${item.apiName}`, item.value);
        relateObj = item.value;
      }
    });

    const newRecord = temp;
    this.debounceSetState(newRecord);
  };

  handleFieldValueChange = (fieldName: string, fieldValue: any) => {
    console.log('===>create screen handleFieldValueChange', {
      fieldName,
      fieldValue,
    });
    const { record = {} } = this.state;
    const temp = {};
    _.set(temp, fieldName, fieldValue);
    if (this.initData) {
      for (const i in this.initData) {
        if (!record[i]) {
          record[i] = this.initData[i];
        } else {
          if (
            record[`${i}__r`] &&
            this.initData[`${i}__r`] &&
            record[`${i}__r`] !== this.initData[`${i}__r`]
          ) {
            for (const x in this.initData[`${i}__r`]) {
              if (!record[`${i}__r`][x]) {
                record[`${i}__r`][x] = this.initData[`${i}__r`][x];
              }
            }
          }
        }
      }
    }
    const newRecord = _.assign({}, record, temp);
    if (this.defaultCalenderTime) {
      newRecord['defaultCalenderTime'] = this.defaultCalenderTime;
    }
    this.setState({ record: newRecord });
  };

  renderContent = () => {
    const { record } = this.state;
    const { navigation, objectDescription, permission, form } = this.props;
    const {
      state: { params },
    } = navigation;
    const { approvalContent, token } = params;
    const detailLayout = {
      containers: [
        {
          components: [
            {
              field_sections: [
                {
                  fields: approvalContent,
                },
              ],
            },
          ],
        },
      ],
    };
    return (
      <InnerEditView
        token={token}
        objectApiName="approval_node"
        objectDescription={objectDescription}
        permission={permission}
        detailLayout={detailLayout}
        pageType="edit"
        navigation={navigation}
        navigate={navigation.navigate}
        form={form}
        handleCreateData={this.handleSelectData}
        handleValueChange={this.handleFieldValueChange}
        handleRelatedChange={this.handleRelatedChange}
        recordData={record}
      />
    );
  };

  render() {
    const { navigation } = this.props;
    const {
      state: { params },
    } = navigation;
    const { title } = params;
    return (
      <StyledContainer style={{ backgroundColor: themes.fill_base }}>
        <StyledHeader>
          <Left style={{ flex: 1 }}>
            <Button
              transparent
              onPress={() => {
                const { navigation } = this.props;
                navigation.goBack();
              }}
            >
              <Text style={{ color: themes.title_text_color }}>{I18n.t('common_cancel')}</Text>
            </Button>
          </Left>
          <Body style={{ flex: 1, alignItems: 'center' }}>
            <Title
              style={{
                color: themes.title_text_color,
                fontSize: themes.title_size,
              }}
            >
              {title}
            </Title>
          </Body>
          <Right style={{ flex: 1 }}>
            <Button transparent onPress={this.handleCreate}>
              <Text style={{ color: themes.title_text_color }}>{I18n.t('common_sure')}</Text>
            </Button>
          </Right>
        </StyledHeader>
        <Content>{this.renderContent()}</Content>
      </StyledContainer>
    );
  }
}

const select = (state, screen) => {
  const query = getQueryInitialState({ state, screen });
  return {
    token: state.settings.token,
    objectDescription: state.settings.objectDescription,
    permission: state.settings.permission,
    apiName: query.apiName,
    updateLoading: query.updateLoading,
    screen,
  };
};

export default connect(select)(createForm()(ApprovalCreateScreen));
