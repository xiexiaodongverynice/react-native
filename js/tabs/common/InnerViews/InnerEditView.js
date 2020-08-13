/**
 * Created by Uncle Charlie, 2018/01/15
 * @flow
 */

import React from 'react';
import { View, Text } from 'react-native';
import { connect } from 'react-redux';
import _ from 'lodash';
import moment from 'moment';
import { ListItem } from 'native-base';
import Privilege from 'fc-common-lib/privilege';
import {
  CustomView,
  StyledSeparator,
  RequiredTextView,
  StyledLeft,
  StyledBody,
} from '../components';
import IndexDataParser from '../../../services/dataParser';
import EditInput from '../../../components/formComponents/EditInput';
import EditMoneyInputView from '../../../components/formComponents/EditMoneyInputView';
import EditPercentage from '../../../components/formComponents/percentage/EditPercentage';
import * as Util from '../../../utils/util';
import LoadingScreen from '../LoadingScreen';
import SelectButton from '../../../components/formComponents/select/SelectButton';
import SelectOneView from '../../../components/formComponents/select/SelectOneView';
import BarViewItem from '../BarViewItem';
import createField from '../createField';
import I18n from '../../../i18n';
import DatePickerField from '../DatePickerField';
import RelatedItem from '../../../components/formComponents/RelateItem';
import { validatorPercentage, rcFormValidator, MONEY_VALIDATOR } from '../helpers/validator';
import { intlValueMessage } from '../../../utils/crmIntlUtil';
import PhotoForm from '../../../components/formComponents/photo/PhotoForm';
import VideoForm from '../../../components/formComponents/video/VideoForm';
import { checkSectionShowable, checkConfigDefault, checkTip } from '../helpers/recordHelper';
import { TipContent, SectionSeparator } from '../../../components/formComponents/common';
import { isExistModalView } from './isExistModalView';
import AttachmentItem from '../../../components/formComponents/attachment/AttachmentItem';
import StarRating from '../../../components/formComponents/StarRating';
import { EDIT_AND_ADD_EXTENSION_CONFIGS } from '../../../components/extender';
import {
  getComponentsWithoutFancyHeader,
  getFirstComponentFromDetailLayout,
} from '../../../utils/layoutUtil';

const IS_EXTENDER_FIELD = 'is_extender';

const PAGE_TYPE_ADD = 'add';
const PAGE_TYPE_EDIT = 'edit';

type Prop = {
  token: string,
  detailData: ?any,
  objectApiName: string,
  detailLayout: any,
  layoutError: boolean,
  objectDescription: any,
  permission: any,
  pageType: string,
  pageTypeLevel: 'main' | 'sub',
  navigation: ?any,
  recordData: ?any,
  recordType: string,
  crmPowerSetting: any,
  initData: any,
  navigate: (string, any) => void,
  handleCreateData: ({
    apiName: string,
    selected: Array<any>,
    multipleSelect: boolean,
  }) => void,
  handleValueChange: (fieldName: string, fieldValue: any) => void,
  handleRelatedChange: (changedValues: Array<any>) => void,
  form: any,
  handleSectionData: any,
  handlerTimeChange: any,
  defaultCalenderTime: any,
  weekDay: any,
  theRelatedParentData: any,
  timestamp: any,
};

type State = {
  record: Array<any>,
  field?: string,
  value?: any,
  isInitStatus: boolean,
  dependencyFieldValueMap?: Object, //* 单选依赖集
  configDefaultValueMap: Object, //* 默认值配置集
  pitchTipField: string, //* 要展示的tip栏
};

type Section = {
  key: string,
};

type Item = {
  title: string,
  value: string,
};

const combineRecord = (target: State, source: State, key: string) => {
  const resultTarget = target.filter((t) => !source.map((s) => s[key]).includes(t[key]));
  return _.concat(resultTarget, source);
};

/**
 * TODO: 级联赋值的处理
 */
class InnerEditView extends React.PureComponent<Prop, State> {
  state: State = {
    record: [],
    dependencyFieldValueMap: {},
    configDefaultValueMap: {},
    pitchTipField: '',
  };
  backHandler = null;

  componentWillMount() {
    const { pageType } = this.props;
    //* 检查是否配置默认值
    if (pageType === 'add') {
      const { detailLayout } = this.props;
      const component = getFirstComponentFromDetailLayout(detailLayout);

      this.checkConfigDefaultValue(component);
    }
  }

  getFieldData = (field: any, currentDesc: any) => {
    const { detailData = {}, initData = {}, recordData = {} } = this.props;
    const assignData = Object.assign({}, detailData, initData, recordData);
    if (!_.isEmpty(assignData)) {
      return IndexDataParser.parseFieldValue(
        this.props.objectApiName,
        field,
        assignData,
        currentDesc,
      );
    }

    return null;
  };

  getFieldValue = (field: any, fieldDesc: any) => {
    const { pageType, detailData = {}, recordData = {}, initData = {} } = this.props;
    const assignData = Object.assign({}, detailData, recordData, initData);

    if (!_.isEmpty(assignData)) {
      return _.get(assignData, `${fieldDesc.api_name}`);
    }
    return null;
  };

  getRelatedField = (apiName: string) => {
    const record = _.get(this.state, 'record', []);
    const filtered = _.filter(record, (item) => item.apiName === apiName);
    if (_.isEmpty(filtered)) {
      return null;
    }

    return _.get(filtered, '[0].value');
  };

  // Display
  getRelatedData = (apiName: string) => {
    const relatedField = this.getRelatedField(apiName);
    return _.result(relatedField, 'name', relatedField);
  };

  // Id and something like this
  getRelatedValue = (apiName: string) => {
    const relatedField = this.getRelatedField(apiName);
    return _.result(relatedField, 'id', relatedField);
  };

  getTimeStamp = (value) => {
    let change = value;
    if (typeof value === 'number') {
      change = moment(value).format('HH:mm');
    }
    const index = change.indexOf(':');
    const hour = change.substring(0, index);
    const min = change.substring(index + 1);
    const realValue = hour * 60 * 60 * 1000 + min * 60 * 1000;
    const date = moment().format('YYYY-MM-DD') + ' 00:00:00';
    const today = moment(date).unix() * 1000;

    return realValue + today;
  };

  /**
   * Handle extender sections
   * @param fieldSection: from layout, which are component's sections.
   * @param displayFields: Fields which will displayed in view.
   */
  handleExtenderSection = (fieldSection: any, displayFields: Array<any>, currentDesc: any) => {
    const {
      recordData,
      detailData,
      pageType,
      token,
      handleCreateData,
      objectApiName,
      recordType,
      pageTypeLevel,
      detailLayout,
    } = this.props;

    fieldSection.header &&
      displayFields.push(
        <StyledSeparator key={`${fieldSection.header}`}>
          <Text>{fieldSection.header || ''}</Text>
        </StyledSeparator>,
      );

    const formItemExtender = _.get(fieldSection, 'form_item_extender');
    const formItemRequired = _.get(fieldSection, 'is_required', false);

    const basicProps = {
      extenderName: formItemExtender,
      token,
      formItemRequired,
      pageType,
      pageTypeLevel,
      header: fieldSection.header,
      parentRecord: _.get(this.props, 'detailData'),
      navigation: this.props.navigation,
      handleCreate: handleCreateData,
      objectDescription: this.props.objectDescription,
      field_section: fieldSection,
      parentApiName: objectApiName,
      parentRecordType: recordType,
    };

    const extensionConfig = _.get(EDIT_AND_ADD_EXTENSION_CONFIGS, formItemExtender, {});

    if (!_.isEmpty(extensionConfig)) {
      //* 获取扩展组件和扩展所需的props
      const ExtensionComponent = extensionConfig.component;
      const extensionalPropsFields = _.get(extensionConfig, 'extensionalPropsFields', []);

      const extensionalProps = {};
      const extensionalPropsData = _.assign({}, this.props, {
        components: _.get(detailLayout, 'containers[0].components', {}),
        disabled: false,
        createRecord: recordData,
        currentDesc,
        recordData: _.assign({}, detailData, recordData),
      });

      _.each(extensionalPropsFields, (field) => {
        if (_.has(extensionalPropsData, field)) {
          extensionalProps[field] = _.get(extensionalPropsData, field);
        }
      });

      displayFields.push(
        <ExtensionComponent key={formItemExtender} {...basicProps} {...extensionalProps} />,
      );
    }
  };

  canRenderSection = (section: any, pageType: string) => {
    const hiddenWhen = _.get(section, 'hidden_when', []);
    if (pageType === PAGE_TYPE_ADD && _.indexOf(hiddenWhen, PAGE_TYPE_ADD) >= 0) {
      return false;
    } else if (pageType === PAGE_TYPE_EDIT && _.indexOf(hiddenWhen, PAGE_TYPE_EDIT) >= 0) {
      return false;
    }
    return true;
  };

  canRenderField = (field: any, pageType: string, fieldDescription: DescriptionField) => {
    const { objectApiName, weekDay } = this.props;
    const hiddenWhen = _.get(field, 'hidden_when', []);
    const isVirtual = _.get(fieldDescription, 'is_virtual', false);
    //特殊对待拜访模板日模板的日期字段，自动隐藏
    if (
      objectApiName === 'call_template_detail' &&
      weekDay === undefined &&
      field.field === 'day'
    ) {
      return false;
    }
    if (pageType === PAGE_TYPE_ADD && (_.indexOf(hiddenWhen, PAGE_TYPE_ADD) >= 0 || isVirtual)) {
      return false;
    } else if (
      pageType === PAGE_TYPE_EDIT &&
      (_.indexOf(hiddenWhen, PAGE_TYPE_EDIT) >= 0 || isVirtual)
    ) {
      return false;
    }
    return true;
  };

  canDisableField = (
    field: any,
    pageType: string,
    fieldDescription: DescriptionField,
    data: ?any,
  ): boolean => {
    const { recordData = {} } = this.props;
    const mergeData = _.assign({}, recordData, data);
    const disableWhen = _.get(field, 'disabled_when', []);
    const layoutExpression = _.get(field, 'disabled_expression');
    const desExpression = _.get(fieldDescription, 'disabled_expression');

    if (disableWhen.includes(pageType)) return true;
    if (layoutExpression) {
      return Util.executeExpression(layoutExpression, mergeData) || false;
    }
    if (desExpression) {
      return Util.executeExpression(desExpression, mergeData) || false;
    }

    return false;
  };

  handleDateValueChange = ({ field, mergedObjectFieldDescribe }) => (fieldName, fieldValue) => {
    const { objectApiName } = this.props;
    const onDatePickerChangeLayout = _.get(mergedObjectFieldDescribe, 'onDatePickerChange');
    let value = fieldValue;
    if (
      (fieldName == 'start_time' || fieldName == 'end_time') &&
      objectApiName == 'call_template_detail'
    ) {
      value = this.getTimeStamp(fieldValue);
    }
    const updateObj = {};
    if (!_.isEmpty(onDatePickerChangeLayout)) {
      const setFieldsLayout = _.get(onDatePickerChangeLayout, 'setFields');
      _.forEach(setFieldsLayout, (setFields) => {
        const { target } = setFields;
        const source = _.get(setFields, 'source', fieldName);
        const operator = _.get(setFields, 'operator', 'add');
        let val = _.get(setFields, 'val');
        const sourceVal = value;
        if (operator === 'add') {
          _.set(updateObj, `${target}`, moment(sourceVal).add(val, 'seconds'));
        } else if (operator === 'subtract') {
          if (val < 0) {
            val *= -1;
            _.set(updateObj, `${target}`, moment(sourceVal).subtract(val, 'seconds'));
          } else {
            _.set(updateObj, `${target}`, moment(sourceVal).subtract(val, 'seconds'));
          }
        } else {
          console.warn(`[警告]您的配置操作符${operator}仅支持add,subtract操作符，请确认。`);
        }
      });
    }
    const updateFields = [];

    if (_.get(field, 'render_type') === 'time' && _.isString(value) && value) {
      const arr = value.split(':');
      value = moment.utc((arr[0] * 60 + parseInt(arr[1])) * 60 * 1000);
    }
    updateFields.push({
      apiName: fieldName,
      value,
    });

    _.forOwn(updateObj, (value, key) => {
      updateFields.push({
        apiName: key,
        value: moment(value).valueOf(),
      });
    });
    this.setState({
      record: combineRecord(this.state.record, updateFields, 'apiName'),
    });

    const { handleRelatedChange } = this.props;
    handleRelatedChange && handleRelatedChange(updateFields);
  };

  handleInput = (fieldName: string, fieldValue: string) => {
    const { handleValueChange } = this.props;
    handleValueChange(fieldName, fieldValue);
  };

  handleLookChange = (fieldLayout: any, fieldRecord: any, parentData: any) => {
    const onLookupChange = _.get(fieldLayout, 'onLookupChange');

    const setFields = _.get(onLookupChange, 'setFields');
    const recordVal = _.get(fieldRecord, 'selected[0]') || parentData;

    const updateFields = [];

    _.each(setFields, ({ source, target }) => {
      const sourceExpression = _.get(source, 'expression', false);
      const sourceVal = _.get(recordVal, source, null);
      const updateField = {
        apiName: target,
        value: sourceExpression
          ? Util.executeDetailExp(sourceExpression, null, null, recordVal) || null
          : sourceVal,
      };
      updateFields.push(updateField);
      if (_.get(recordVal, `${source}__r`)) {
        const updateField = {
          apiName: target + '__r',
          value: _.get(recordVal, `${source}__r`),
        };
        updateFields.push(updateField);
      }
    });

    this.setState({
      record: combineRecord(this.state.record, updateFields, 'apiName'),
    });
    const { handleRelatedChange } = this.props;

    handleRelatedChange && handleRelatedChange(updateFields);
  };

  handleRelatedSelect = (fieldLayout: any, fieldRecord: any, parentData: any) => {
    const { handleCreateData } = this.props;
    const onLookupChange = _.get(fieldLayout, 'onLookupChange');

    handleCreateData(fieldRecord, fieldLayout);
    if (onLookupChange) {
      this.handleLookChange(fieldLayout, fieldRecord, parentData);
    }
  };

  handleFieldChange = (fieldRecord: any, fieldLayout: any) => {
    const { handleCreateData } = this.props;
    // const { apiName: fieldApiName, selected, value } = fieldRecord;

    // const fieldItemValue = value || _.get(_.first(selected), 'value');

    handleCreateData && handleCreateData(fieldRecord, fieldLayout);
  };

  changeTipField = (field) => () => {
    const { pitchTipField } = this.state;
    if (!field && !_.isString(field)) return;

    if (field === pitchTipField) {
      this.setState({ pitchTipField: '' });
    } else {
      this.setState({ pitchTipField: field });
    }
  };

  checkConfigDefaultValue = (component) => {
    const { pageType, objectDescription, objectApiName } = this.props;
    const { configDefaultValueMap } = this.state;
    const currentDesc = IndexDataParser.getObjectDescByApiName(objectApiName, objectDescription);
    _.each(component.field_sections, (section) => {
      // Hide this section if the layout said so.
      if (!this.canRenderSection(section, pageType)) return;
      if (!checkSectionShowable(section, 'phone', pageType)) return;
      if (_.get(section, IS_EXTENDER_FIELD, false)) return;

      const fieldsInSecion: Array<any> = _.get(section, 'fields', []);
      _.each(fieldsInSecion, (field, fieldIndex) => {
        const fieldDesc: DescriptionField = IndexDataParser.parserFieldLabel(field, currentDesc);

        if (_.isEmpty(fieldDesc)) {
          if (__DEV__) {
            console.warn("[warn] Field's object descriptioin is not valid", objectApiName, field);
          }
          return;
        }
        const fieldRenderType = _.get(field, 'render_type');
        if (
          pageType === 'add' &&
          (fieldRenderType === 'text' ||
            fieldRenderType === 'select_one' ||
            fieldRenderType === 'radio')
        ) {
          const configDefaultValue = checkConfigDefault(fieldDesc, field);
          const apiName = _.get(field, 'field');
          if (!configDefaultValue && !_.isNumber(configDefaultValue)) return;

          if (fieldRenderType === 'text' || fieldRenderType === 'radio') {
            this.handleInput(apiName, configDefaultValue);
            configDefaultValueMap[apiName] = configDefaultValue;
          } else if (fieldRenderType === 'select_one') {
            this.handleFieldChange(configDefaultValue.result);
            configDefaultValueMap[apiName] = {
              value: configDefaultValue.value,
              label: configDefaultValue.label,
            };
          }
        }
      });
    });
  };

  composeBasicInfo = () => {
    const {
      objectApiName,
      handleValueChange,
      pageType,
      form,
      objectDescription,
      handleCreateData,
      navigate,
      token,
      navigation,
      detailData = {},
      weekDay,
      timestamp,
      permission,
      recordData = {},
      initData = {},
      theRelatedParentData = {},
      pageTypeLevel,
      detailLayout,
    } = this.props;

    const { configDefaultValueMap, pitchTipField } = this.state;

    const mergeData = _.assign({}, detailData, recordData);

    if (pageType !== PAGE_TYPE_ADD && pageType !== PAGE_TYPE_EDIT) {
      console.warn('WARNING: pageType is invalid');
    }

    const currentDesc = IndexDataParser.getObjectDescByApiName(objectApiName, objectDescription);

    const fields = [];
    const component = getFirstComponentFromDetailLayout(detailLayout);
    let componentList = _.get(detailLayout, 'containers[0].components');
    componentList = getComponentsWithoutFancyHeader(componentList);

    _.each(component.field_sections, (section) => {
      // Hide this section if the layout said so.
      const detailTabs = [];
      const refs = _.get(section, 'related_refs', []);
      if (refs.length > 0) {
        _.each(refs, (ref) => {
          detailTabs.push(ref);
        });
      }
      if (!this.canRenderSection(section, pageType)) {
        return;
      }

      if (!checkSectionShowable(section, 'phone', pageType)) {
        return;
      }

      const isExtender = _.get(section, IS_EXTENDER_FIELD, false);
      if (isExtender) {
        this.handleExtenderSection(section, fields, currentDesc);
      } else {
        const fieldsInSecion: Array<any> = _.get(section, 'fields', []);

        section.header &&
          fields.push(
            <StyledSeparator key={section.header || ''}>
              <Text>{section.header || ''}</Text>
            </StyledSeparator>,
          );

        _.each(fieldsInSecion, (field, fieldIndex) => {
          //* 固定文本配置
          if (_.endsWith(_.get(field, 'render_type'), '_bar')) {
            fields.push(<BarViewItem layout={field} key={`bar_${Math.random()}`} />);
            return fields;
          }

          if (_.get(field, 'hidden_expression')) {
            const is_hidden = Util.executeExpression(field.hidden_expression);
            if (is_hidden) return;
          }

          const fieldDesc: DescriptionField = IndexDataParser.parserFieldLabel(field, currentDesc);

          if (_.isEmpty(fieldDesc)) {
            if (__DEV__) {
              console.warn("[warn] Field's object descriptioin is not valid", objectApiName, field);
            }
            return;
          }

          const fieldData = this.getFieldData(field, currentDesc);
          const fieldValue = _.get(field, 'field');
          let fieldInitialValue = this.getFieldValue(field, fieldDesc);
          if (initData && initData.start_time && objectApiName === 'call') {
            if (fieldValue === 'start_time') {
              fieldInitialValue = initData.start_time;
            }
          }
          if (initData && initData.end_time && objectApiName === 'call') {
            if (fieldValue === 'end_time') {
              fieldInitialValue = initData.end_time;
            }
          }

          //check if call template detail and set day of the week
          if (objectApiName === 'call_template_detail') {
            if (weekDay && fieldValue === 'day') {
              fieldInitialValue = weekDay;
            }
            if (typeof timestamp !== 'undefined') {
              const today = moment().format('YYYY-MM-DD');
              const preTime = moment(today).format('x');
              if (fieldValue === 'start_time') {
                fieldInitialValue = parseInt(preTime) + parseInt(timestamp);
              } else if (fieldValue === 'end_time') {
                fieldInitialValue = parseInt(preTime) + parseInt(timestamp) + 1800000;
              }
            }
          }
          if (!this.canRenderField(field, pageType, fieldDesc)) {
            return;
          }

          //* 检查是否有tip
          const _tipContent = checkTip(field);

          const disableField: boolean = this.canDisableField(
            field,
            pageType,
            fieldDesc,
            Object.assign({}, detailData, initData, recordData),
          );
          // Check if config is right

          if (_.isEmpty(fieldValue)) {
            if (_.endsWith(_.get(field, 'render_type'), '_bar')) {
              return <BarViewItem layout={field} key={`${fieldIndex}_bar`} />;
            }
            console.warn('===>this maybe caused by incorrect config!');
            return;
          }

          // Check if a user's has access right of a field
          const userPrivilage = Privilege.checkFieldInOkArr(
            this.props.permission,
            objectApiName,
            field.field,
            [4],
          );
          if (!userPrivilage) {
            console.warn(
              `===> Edit screen, user has no right to access this field - ${_.get(field, 'field')}`,
            );
            return;
          }
          // Generate element
          // 用布局的field属性覆盖字段描述的属性，以支持布局覆盖字段的功能
          const mergedObjectFieldDescribe = _.assign({}, fieldDesc, field);
          const pattern = _.get(mergedObjectFieldDescribe, 'pattern');
          const message = _.get(mergedObjectFieldDescribe, 'message');
          const fieldRenderType = _.get(field, 'render_type');
          const fieldType = _.get(fieldDesc, 'type');
          const fieldRequired = _.get(mergedObjectFieldDescribe, 'is_required', false);
          const relatedValue = this.getRelatedData(_.get(fieldDesc, 'api_name'));
          const relatedName = _.get(
            _.assign({}, detailData, recordData),
            `${_.get(fieldDesc, 'api_name')}__r.name`,
          );
          const relatedData = this.getRelatedValue(_.get(fieldDesc, 'api_name'));
          /**
           * TODO 不应该住在这里去option的label,而应该修改select组件
           */
          const relatedLabel = _.chain(fieldDesc)
            .result('options')
            .find({
              value: relatedValue,
            })
            .result('label')
            .value();

          const title =
            field && field.label
              ? field.label
              : fieldDesc
              ? typeof fieldDesc === 'string'
                ? fieldDesc
                : fieldDesc.label
              : '';
          if (!checkSectionShowable(field, 'phone', pageType)) {
            return;
          }
          if (fieldRenderType === 'radio' && fieldType === 'boolean') {
            let options: Array<any> = _.get(fieldDesc, 'options');
            const type = _.get(fieldDesc, 'type');
            const configDefaultValue = _.get(configDefaultValueMap, _.get(field, 'field'));
            let placeholder = fieldData;

            if (type === 'boolean') {
              if (_.isEmpty(options)) {
                options = [
                  {
                    label: I18n.t('common_true'),
                    value: 'true',
                  },
                  {
                    label: I18n.t('common_false'),
                    value: 'false',
                  },
                ];
              }

              const matchedOption = _.find(options, { value: _.toString(placeholder) });
              if (matchedOption) {
                placeholder = matchedOption.label;
              }
            }

            const assignData = Object.assign({}, detailData, initData, recordData);

            let placeholderValue = relatedLabel || relatedData || placeholder;

            if (_.isBoolean(placeholderValue)) {
              placeholderValue = placeholderValue ? I18n.t('common_true') : I18n.t('common_false');
            }
            fields.push(
              <View key={`${title || ''}_item_${_.get(field, 'field', '')}`}>
                <ListItem>
                  <StyledLeft>
                    <RequiredTextView
                      disabled={disableField}
                      isRequired={fieldRequired}
                      title={title}
                      tipContent={_tipContent}
                      handleTip={this.changeTipField(_.get(field, 'field', ''))}
                    />
                  </StyledLeft>
                  <StyledBody>
                    {createField(
                      {
                        name: _.get(field, 'field'),
                        validOptions: {
                          rules: [
                            {
                              required: fieldRequired,
                              message: `${title} ${intlValueMessage(message) || '为必填项'}`,
                            },
                          ],
                          initialValue: configDefaultValue || fieldInitialValue,
                        },
                      },
                      form,
                    )(
                      <SelectOneView
                        token={token}
                        handleCreate={(fieldRecord) => {
                          this.handleFieldChange(fieldRecord, field);
                        }}
                        renderType="select_one"
                        isRadio
                        multipleSelect={false}
                        placeholderValue={placeholderValue}
                        fieldDesc={fieldDesc}
                        fieldLayout={field}
                        disabled={disableField}
                        title={title}
                        reserveOptions={options}
                        record={assignData}
                        relatedParentData={theRelatedParentData}
                      />,
                    )}
                  </StyledBody>
                </ListItem>
                {_.get(field, 'field') === pitchTipField && _tipContent ? (
                  <TipContent text={_tipContent} />
                ) : null}
              </View>,
            );
          } else if (fieldRenderType === 'select_one' || fieldRenderType === 'radio') {
            const { value: configDefaultValue, label: configDefaultLabel } = _.get(
              configDefaultValueMap,
              _.get(field, 'field'),
              {
                value: '',
                label: '',
              },
            );
            const assignData = Object.assign({}, detailData, initData, recordData);
            fields.push(
              <View key={`${title || ''}_item_${_.get(field, 'field', '')}`}>
                <ListItem>
                  <StyledLeft>
                    <RequiredTextView
                      disabled={disableField}
                      isRequired={fieldRequired}
                      title={title}
                      tipContent={_tipContent}
                      handleTip={this.changeTipField(_.get(field, 'field', ''))}
                    />
                  </StyledLeft>
                  <StyledBody>
                    {createField(
                      {
                        name: _.get(field, 'field'),
                        validOptions: {
                          rules: [
                            {
                              required: fieldRequired,
                              message: `${title} ${message || '为必填项'}`,
                            },
                          ],
                          initialValue: configDefaultValue || fieldInitialValue,
                        },
                      },
                      form,
                    )(
                      <SelectOneView
                        token={token}
                        handleCreate={(fieldRecord) => {
                          this.handleFieldChange(fieldRecord, field);
                        }}
                        navigate={navigate}
                        renderType="select_one"
                        multipleSelect={false}
                        placeholderValue={
                          configDefaultLabel || relatedLabel || relatedData || fieldData
                        }
                        fieldDesc={fieldDesc}
                        fieldLayout={field}
                        disabled={disableField}
                        title={title}
                        // updateRecord={recordData}
                        // detailData={detailData}
                        record={assignData}
                        relatedParentData={theRelatedParentData}
                      />,
                    )}
                  </StyledBody>
                </ListItem>
                {_.get(field, 'field') === pitchTipField && _tipContent ? (
                  <TipContent text={_tipContent} />
                ) : null}
              </View>,
            );
          } else if (fieldRenderType === 'star') {
            fields.push(
              <View key={`${title || ''}_item_${_.get(field, 'field', '')}`}>
                <ListItem>
                  <StyledLeft>
                    <RequiredTextView
                      disabled={disableField}
                      isRequired={fieldRequired}
                      title={title}
                      tipContent={_tipContent}
                      handleTip={this.changeTipField(_.get(field, 'field', ''))}
                    />
                  </StyledLeft>
                  <StyledBody>
                    {createField(
                      {
                        name: _.get(field, 'field'),
                        validOptions: {
                          rules: [
                            {
                              required: fieldRequired,
                              message: `${title} ${message || '为必填项'}`,
                            },
                          ],
                          initialValue: fieldData,
                        },
                      },
                      form,
                    )(
                      <StarRating
                        pageType="edit"
                        data={fieldData}
                        field={field}
                        maxStars={5}
                        rating={fieldData}
                        disabled={false}
                        starSize={20}
                        onStarChange={(value) => this.handleInput(_.get(field, 'field'), value)}
                      />,
                    )}
                  </StyledBody>
                </ListItem>
              </View>,
            );
          } else if (fieldRenderType === 'select_multiple') {
            const assignData = Object.assign({}, detailData, initData, recordData);

            fields.push(
              <View key={`${title || ''}_item_${_.get(field, 'field', '')}`}>
                <ListItem>
                  <StyledLeft>
                    <RequiredTextView
                      disabled={disableField}
                      isRequired={fieldRequired}
                      title={title}
                      tipContent={_tipContent}
                      handleTip={this.changeTipField(_.get(field, 'field', ''))}
                    />
                  </StyledLeft>
                  <StyledBody>
                    {createField(
                      {
                        name: _.get(field, 'field'),
                        validOptions: {
                          rules: [
                            {
                              required: fieldRequired,
                              message: `${title} ${message || '为必填项'}`,
                            },
                          ],
                          initialValue: fieldInitialValue || fieldData,
                        },
                      },
                      form,
                    )(
                      <SelectOneView
                        token={token}
                        handleCreate={handleCreateData}
                        navigate={navigate}
                        renderType="select_multiple"
                        multipleSelect
                        placeholderValue={relatedValue || fieldData || fieldInitialValue}
                        fieldDesc={fieldDesc}
                        title={title}
                        fieldLayout={field}
                        disabled={disableField}
                        key={`${title}`}
                        // updateRecord={recordData}
                        record={assignData}
                        // detailData={detailData}
                        relatedParentData={theRelatedParentData}
                      />,
                    )}
                  </StyledBody>
                </ListItem>
                {_.get(field, 'field') === pitchTipField && _tipContent ? (
                  <TipContent text={_tipContent} />
                ) : null}
              </View>,
            );
          } else if (fieldRenderType === 'checkbox') {
            fields.push(
              <ListItem key={`${title || ''}_item_${_.get(field, 'field', '')}`}>
                <StyledLeft>
                  <RequiredTextView
                    disabled={disableField}
                    isRequired={fieldRequired}
                    title={title}
                  />
                </StyledLeft>
                <StyledBody>
                  {createField(
                    {
                      name: _.get(field, 'field'),
                      validOptions: {
                        rules: [
                          {
                            required: fieldRequired,
                            message: `${title} ${message || '为必填项'}`,
                          },
                        ],
                        initialValue: fieldInitialValue,
                      },
                    },
                    form,
                  )(<CustomView content="" checked={fieldData} onChange={handleValueChange} />)}
                </StyledBody>
              </ListItem>,
            );
          } else if (fieldRenderType === 'switch') {
            fields.push(
              <ListItem key={`${title || ''}_item_${_.get(field, 'field', '')}`}>
                <StyledLeft>
                  <RequiredTextView
                    disabled={disableField}
                    isRequired={fieldRequired}
                    title={title}
                  />
                </StyledLeft>
                <StyledBody>
                  {createField(
                    {
                      name: _.get(field, 'field'),
                      validOptions: {
                        rules: [
                          {
                            required: fieldRequired,
                            message: `${title} ${message || '为必填项'}`,
                          },
                        ],
                        initialValue: fieldInitialValue,
                      },
                    },
                    form,
                  )(
                    <CustomView
                      id={fieldIndex}
                      type="switch"
                      content={fieldData}
                      disabled={disableField}
                      onChange={handleValueChange}
                    />,
                  )}
                </StyledBody>
              </ListItem>,
            );
          } else if (fieldRenderType === 'long_text') {
            fields.push(
              <View key={`${title || ''}_item_${_.get(field, 'field', '')}`}>
                <View
                  style={{
                    minHeight: 90,
                    flexDirection: 'row',
                    marginLeft: 15,
                    paddingTop: 13,
                    paddingBottom: 13,
                    paddingRight: 15,
                    borderColor: '#c9c9c9',
                    borderBottomWidth: 0.5,
                  }}
                >
                  <StyledLeft>
                    <RequiredTextView
                      renderType="long_text"
                      disabled={disableField}
                      isRequired={fieldRequired}
                      title={title}
                      tipContent={_tipContent}
                      handleTip={this.changeTipField(_.get(field, 'field', ''))}
                    />
                  </StyledLeft>
                  <StyledBody
                    style={{
                      height: 70,
                    }}
                  >
                    {createField(
                      {
                        name: _.get(field, 'field'),
                        validOptions: {
                          rules: [
                            {
                              required: fieldRequired,
                              message: `${title} ${intlValueMessage(message) || '为必填项'}`,
                            },
                          ],
                          initialValue: fieldInitialValue,
                        },
                      },
                      form,
                    )(
                      <EditInput
                        id={fieldIndex}
                        handleChangeText={(value) => this.handleInput(_.get(field, 'field'), value)}
                        disabled={disableField}
                        content={fieldData}
                        key={`${title}`}
                        fieldRenderType="long_text"
                      />,
                    )}
                  </StyledBody>
                </View>
                {_.get(field, 'field') === pitchTipField && _tipContent ? (
                  <TipContent text={_tipContent} />
                ) : null}
              </View>,
            );
          } else if (fieldRenderType === 'phone') {
            fields.push(
              <View key={`${title || ''}_item_${_.get(field, 'field', '')}`}>
                <ListItem>
                  <StyledLeft>
                    <RequiredTextView
                      disabled={disableField}
                      isRequired={fieldRequired}
                      title={title}
                      tipContent={_tipContent}
                      handleTip={this.changeTipField(_.get(field, 'field', ''))}
                    />
                  </StyledLeft>
                  <StyledBody>
                    {createField(
                      {
                        name: _.get(field, 'field'),
                        validOptions: {
                          rules: [
                            {
                              required: fieldRequired,
                              message: `${title} ${intlValueMessage(message) || '为必填项'}`,
                            },
                            {
                              pattern:
                                pattern ||
                                /^(0|86|17951)?(13[0-9]|15[012356789]|166|17[3678]|18[0-9]|14[57])[0-9]{8}$/,
                              message: `请输入正确的${title} ${intlValueMessage(message)}`,
                            },
                          ],
                          initialValue: fieldInitialValue,
                        },
                      },
                      form,
                    )(
                      <EditInput
                        id={fieldIndex}
                        handleChangeText={(value) => this.handleInput(_.get(field, 'field'), value)}
                        disabled={disableField}
                        content={fieldData}
                        key={`${title}`}
                      />,
                    )}
                  </StyledBody>
                </ListItem>
                {_.get(field, 'field') === pitchTipField && _tipContent ? (
                  <TipContent text={_tipContent} />
                ) : null}
              </View>,
            );
          } else if (fieldRenderType === 'email') {
            fields.push(
              <View key={`${title || ''}_item_${_.get(field, 'field', '')}`}>
                <ListItem>
                  <StyledLeft>
                    <RequiredTextView
                      disabled={disableField}
                      isRequired={fieldRequired}
                      title={title}
                      tipContent={_tipContent}
                      handleTip={this.changeTipField(_.get(field, 'field', ''))}
                    />
                  </StyledLeft>
                  <StyledBody>
                    {createField(
                      {
                        name: _.get(field, 'field'),
                        validOptions: {
                          type: 'email',
                          pattern: pattern || /\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/,
                          required: fieldRequired,
                          message: `${title} ${message || '为必填项'}`,
                          initialValue: fieldInitialValue,
                        },
                      },
                      form,
                    )(
                      <EditInput
                        id={fieldIndex}
                        handleChangeText={(value) => this.handleInput(_.get(field, 'field'), value)}
                        disabled={disableField}
                        content={fieldData}
                        key={`${title}`}
                      />,
                    )}
                  </StyledBody>
                </ListItem>
                {_.get(field, 'field') === pitchTipField && _tipContent ? (
                  <TipContent text={_tipContent} />
                ) : null}
              </View>,
            );
          } else if (fieldRenderType === 'subordinate') {
            const assignData = Object.assign({}, detailData, initData, recordData);

            fields.push(
              <ListItem key={`${title || ''}_item_${_.get(field, 'field', '')}`}>
                <StyledLeft>
                  <RequiredTextView
                    disabled={disableField}
                    isRequired={fieldRequired}
                    title={title}
                  />
                </StyledLeft>
                <StyledBody>
                  {createField(
                    {
                      name: _.get(field, 'field'),
                      validOptions: {
                        rules: [
                          {
                            required: fieldRequired,
                            message: `${title} ${message || '为必填项'}`,
                          },
                        ],
                        initialValue: fieldInitialValue || relatedData || fieldValue || fieldData,
                      },
                    },
                    form,
                  )(
                    <SelectOneView
                      token={token}
                      handleCreate={(fieldRecord) =>
                        this.handleRelatedSelect(field, fieldRecord, theRelatedParentData)
                      }
                      navigate={navigate}
                      renderType="subordinate"
                      multipleSelect={false}
                      placeholderValue={fieldData}
                      record={assignData}
                      fieldDesc={fieldDesc}
                      fieldLayout={field}
                      disabled={disableField}
                      key={`${title}`}
                      relatedParentData={theRelatedParentData}
                    />,
                  )}
                </StyledBody>
              </ListItem>,
            );
          } else if (fieldType === 'relation' || fieldRenderType === 'relation') {
            const assignData = Object.assign({}, detailData, initData, recordData);
            let assignFieldValue = '';

            let assignFieldData = fieldData;
            if (
              assignData &&
              _.get(field, 'field', '') &&
              assignData[_.get(field, 'field', '') + '__r']
            ) {
              if (pageType === 'add') {
                assignFieldData = assignData[_.get(field, 'field', '') + '__r'].name;
                assignFieldValue = assignData[_.get(field, 'field', '') + '__r'].id;
              } else {
                assignFieldData = assignData[_.get(field, 'field', '')];
              }
            }

            fields.push(
              <View key={`${title || ''}_item_${_.get(field, 'field', '')}_math`}>
                <ListItem>
                  <StyledLeft>
                    <RequiredTextView
                      disabled={disableField}
                      isRequired={fieldRequired}
                      title={title}
                      tipContent={_tipContent}
                      handleTip={this.changeTipField(_.get(field, 'field', ''))}
                    />
                  </StyledLeft>
                  <StyledBody>
                    {createField(
                      {
                        name: _.get(field, 'field'),
                        validOptions: {
                          rules: [
                            {
                              required: fieldRequired,
                              message: `${title} ${message || '为必填项'}`,
                            },
                          ],
                          initialValue:
                            assignFieldValue ||
                            assignFieldData ||
                            fieldInitialValue ||
                            relatedData ||
                            relatedValue,
                        },
                      },
                      form,
                    )(
                      <SelectButton
                        token={token}
                        handleCreate={(fieldRecord) =>
                          this.handleRelatedSelect(field, fieldRecord, theRelatedParentData)
                        }
                        navigate={navigate}
                        pageType={pageType}
                        renderType="relation"
                        title={title}
                        multipleSelect={false}
                        placeholderValue={relatedName || assignFieldData} //relatedValue
                        objectApiName={objectApiName}
                        record={assignData}
                        fieldDesc={fieldDesc}
                        fieldLayout={field}
                        fieldItem={mergedObjectFieldDescribe}
                        disabled={disableField}
                        key={`${title}`}
                        relatedParentData={theRelatedParentData}
                      />,
                    )}
                  </StyledBody>
                </ListItem>
                {_.get(field, 'field') === pitchTipField && _tipContent ? (
                  <TipContent text={_tipContent} />
                ) : null}
              </View>,
            );
          } else if (
            fieldRenderType === 'date_time' ||
            fieldType === 'date_time' ||
            fieldType === 'date'
          ) {
            fields.push(
              <View key={`${title || ''}_item_${_.get(field, 'field', '')}`}>
                <ListItem>
                  <StyledLeft>
                    <RequiredTextView
                      disabled={disableField}
                      isRequired={fieldRequired}
                      title={title}
                      tipContent={_tipContent}
                      handleTip={this.changeTipField(_.get(field, 'field', ''))}
                    />
                  </StyledLeft>
                  <StyledBody>
                    {createField(
                      {
                        name: _.get(field, 'field'),
                        validOptions: {
                          rules: [
                            {
                              required: fieldRequired,
                              message: `${title} ${message || '为必填项'}`,
                            },
                          ],
                          initialValue: fieldInitialValue,
                        },
                      },
                      form,
                    )(
                      <DatePickerField
                        disabled={disableField}
                        field={field}
                        fieldData={relatedData || fieldData}
                        handleValueChange={this.handleDateValueChange({
                          mergedObjectFieldDescribe,
                          field,
                          fieldsInSecion,
                          currentDesc,
                        })}
                      />,
                    )}
                  </StyledBody>
                </ListItem>
                {_.get(field, 'field') === pitchTipField && _tipContent ? (
                  <TipContent text={_tipContent} />
                ) : null}
              </View>,
            );
          } else if (fieldRenderType === 'money') {
            const configDefaultValue = _.get(configDefaultValueMap, _.get(field, 'field'));
            const plain_EditMoneyInputView = (
              <EditMoneyInputView
                id={fieldIndex}
                handleChangeText={(value) => this.handleInput(_.get(field, 'field'), value)}
                disabled={disableField}
                fieldLayout={field}
                key={`${title}`}
                type={fieldType}
              />
            );
            //validating_EditMoneyInputView给props增加了value、onChange、validateFail
            const validating_EditMoneyInputView = createField(
              {
                name: _.get(field, 'field'),
                validOptions: {
                  rules: [
                    {
                      validator: rcFormValidator({
                        fieldDesc,
                        title,
                        fieldRequired,
                        type: MONEY_VALIDATOR,
                      }),
                      validateStatus: 'error',
                    },
                  ],
                  initialValue:
                    configDefaultValue || _.isNumber(configDefaultValue)
                      ? configDefaultValue
                      : fieldInitialValue,
                },
              },
              form,
            )(plain_EditMoneyInputView);
            fields.push(
              <View key={`${title || ''}_item_${_.get(field, 'field', '')}`}>
                <ListItem>
                  <StyledLeft>
                    <RequiredTextView
                      disabled={disableField}
                      isRequired={fieldRequired}
                      title={title}
                      tipContent={_tipContent}
                      handleTip={this.changeTipField(_.get(field, 'field', ''))}
                    />
                  </StyledLeft>
                  <StyledBody>{validating_EditMoneyInputView}</StyledBody>
                </ListItem>
                {_.get(field, 'field') === pitchTipField && _tipContent ? (
                  <TipContent text={_tipContent} />
                ) : null}
              </View>,
            );
          } else if (fieldType === 'big_int') {
            const maxLength = _.get(fieldDesc, 'max_length', 5);
            const bigIntPattern = new RegExp(`^-?[0-9]\\d{0,${maxLength}}?$`);
            const configDefaultValue = _.get(configDefaultValueMap, _.get(field, 'field'));
            fields.push(
              <View key={`${title || ''}_item_${_.get(field, 'field', '')}`}>
                <ListItem>
                  <StyledLeft>
                    <RequiredTextView
                      disabled={disableField}
                      isRequired={fieldRequired}
                      title={title}
                      tipContent={_tipContent}
                      handleTip={this.changeTipField(_.get(field, 'field', ''))}
                    />
                  </StyledLeft>
                  <StyledBody>
                    {createField(
                      {
                        name: _.get(field, 'field'),
                        validOptions: {
                          rules: [
                            {
                              required: fieldRequired,
                              pattern: pattern || bigIntPattern,
                              message: `${title} ${intlValueMessage(message) || '必填且为数字'}`,
                            },
                          ],
                          initialValue:
                            configDefaultValue || _.isNumber(configDefaultValue)
                              ? configDefaultValue
                              : fieldInitialValue,
                        },
                      },
                      form,
                    )(
                      <EditInput
                        id={fieldIndex}
                        handleChangeText={(value) => this.handleInput(_.get(field, 'field'), value)}
                        disabled={disableField}
                        content={fieldData}
                        key={`${title}`}
                        type={fieldType}
                      />,
                    )}
                  </StyledBody>
                </ListItem>
                {_.get(field, 'field') === pitchTipField && _tipContent ? (
                  <TipContent text={_tipContent} />
                ) : null}
              </View>,
            );
          } else if (fieldRenderType === 'real_number' || fieldType === 'real_number') {
            const decimalPlaces = _.get(fieldDesc, 'decimal_places', 1);
            const realNumberPattern = new RegExp(`^[+-]?\\d+(\\.\\d{1,${decimalPlaces}})?$`);
            const configDefaultValue = _.get(configDefaultValueMap, _.get(field, 'field'));
            fields.push(
              <View key={`${title || ''}_item_${_.get(field, 'field', '')}`}>
                <ListItem>
                  <StyledLeft>
                    <RequiredTextView
                      disabled={disableField}
                      isRequired={fieldRequired}
                      title={title}
                      tipContent={_tipContent}
                      handleTip={this.changeTipField(_.get(field, 'field', ''))}
                    />
                  </StyledLeft>
                  <StyledBody>
                    {createField(
                      {
                        name: _.get(field, 'field'),
                        validOptions: {
                          rules: [
                            {
                              required: fieldRequired,
                              pattern: pattern || realNumberPattern,
                              message: `${title} ${intlValueMessage(message) || '必填且为数字'}`,
                            },
                          ],
                          initialValue:
                            configDefaultValue || _.isNumber(configDefaultValue)
                              ? configDefaultValue
                              : fieldInitialValue || fieldData,
                        },
                      },
                      form,
                    )(
                      <EditInput
                        id={fieldIndex}
                        handleChangeText={(value) => this.handleInput(_.get(field, 'field'), value)}
                        disabled={disableField}
                        content={fieldData}
                        key={`${title}`}
                        type={fieldType}
                      />,
                    )}
                  </StyledBody>
                </ListItem>
                {_.get(field, 'field') === pitchTipField && _tipContent ? (
                  <TipContent text={_tipContent} />
                ) : null}
              </View>,
            );
          } else if (fieldType === 'percentage') {
            fields.push(
              <View key={`${title || ''}_item_${_.get(field, 'field', '')}`}>
                <ListItem>
                  <StyledLeft>
                    <RequiredTextView
                      disabled={disableField}
                      isRequired={fieldRequired}
                      title={title}
                      tipContent={_tipContent}
                      handleTip={this.changeTipField(_.get(field, 'field', ''))}
                    />
                  </StyledLeft>
                  <StyledBody>
                    {createField(
                      {
                        name: _.get(field, 'field'),
                        validOptions: {
                          rules: [
                            {
                              validator: validatorPercentage(fieldDesc, title, fieldRequired),
                              validateStatus: 'error',
                            },
                          ],
                          initialValue: fieldInitialValue,
                        },
                      },
                      form,
                    )(
                      <EditPercentage
                        id={fieldIndex}
                        handleChangeText={(value) => {
                          let real_value;
                          if (_.isNull(value)) {
                            real_value = null;
                          } else {
                            real_value = parseFloat(value);
                          }
                          this.handleInput(_.get(field, 'field'), real_value);
                        }}
                        fieldDesc={fieldDesc}
                        disabled={disableField}
                        content={fieldData}
                        key={`${title}`}
                        title={title}
                        type={fieldType}
                      />,
                    )}
                  </StyledBody>
                </ListItem>
                {_.get(field, 'field') === pitchTipField && _tipContent ? (
                  <TipContent text={_tipContent} />
                ) : null}
              </View>,
            );
          } else if (fieldType === 'attachment' && fieldRenderType === 'video') {
            // 需要告知管理后台去除 audio，否则 audio 会被当做普通字段渲染
            const fieldApiName = _.get(fieldDesc, 'api_name') || _.get(field, 'field');
            fields.push(
              <VideoForm
                key={title || 'video' + fieldIndex}
                title={title}
                form={form}
                navigation={navigation}
                parentRecord={detailData}
                pageType={pageType}
                objectApiName={objectApiName}
                extenderName={fieldApiName}
                formItemRequired={fieldRequired}
                handleCreate={handleCreateData}
                field={field}
                fieldDesc={fieldDesc}
                disableField={disableField}
              />,
            );
          } else if (fieldType === 'image_upload' || fieldRenderType === 'image_upload') {
            const fieldApiName = _.get(fieldDesc, 'api_name') || _.get(field, 'field');
            const assignData = Object.assign({}, detailData, initData, recordData);
            fields.push(
              <PhotoForm
                key={title || 'photo'}
                title={title}
                form={form}
                navigation={navigation}
                parentRecord={assignData}
                pageType={pageType}
                objectApiName={objectApiName}
                extenderName={fieldApiName}
                formItemRequired={fieldRequired}
                handleCreate={handleCreateData}
                field={field}
                fieldDesc={fieldDesc}
                disableField={disableField}
              />,
            );
          } else if (fieldType === 'time' || fieldRenderType === 'time') {
            const dateFormat = _.get(field, 'date_time_format') || 'HH:mm';
            let editData = null;
            if (fieldData) {
              editData = moment.utc(fieldData).format(dateFormat);
            }
            const createValue = fieldInitialValue;
            fields.push(
              <ListItem key={`${title || ''}_item_${_.get(field, 'field', '')}`}>
                <StyledLeft>
                  <RequiredTextView
                    disabled={disableField}
                    isRequired={fieldRequired}
                    title={title}
                  />
                </StyledLeft>
                <StyledBody>
                  {createField(
                    {
                      name: _.get(field, 'field'),
                      validOptions: {
                        rules: [
                          {
                            required: fieldRequired,
                            message: `${title} ${message || '为必填项'}`,
                          },
                        ],
                        initialValue: fieldInitialValue,
                      },
                    },
                    form,
                  )(
                    <DatePickerField
                      disabled={disableField}
                      field={field}
                      fieldData={relatedData || editData || createValue}
                      handleValueChange={this.handleDateValueChange({
                        mergedObjectFieldDescribe,
                        field,
                        fieldsInSecion,
                        currentDesc,
                      })}
                    />,
                  )}
                </StyledBody>
              </ListItem>,
            );
          } else if (fieldRenderType === 'url') {
            const configDefaultValue = _.get(configDefaultValueMap, _.get(field, 'field'));
            fields.push(
              <View key={`${title || ''}_item_${_.get(field, 'field', '')}`}>
                <ListItem>
                  <StyledLeft>
                    <RequiredTextView
                      disabled={disableField}
                      isRequired={fieldRequired}
                      title={title}
                      tipContent={_tipContent}
                      handleTip={this.changeTipField(_.get(field, 'field', ''))}
                    />
                  </StyledLeft>
                  <StyledBody>
                    {createField(
                      {
                        name: _.get(field, 'field'),
                        validOptions: {
                          rules: [
                            {
                              pattern: pattern || /^https?:\/\//,
                              required: fieldRenderType === 'component' ? false : fieldRequired,
                              message: `请输入正确格式的 ${title}`,
                            },
                          ],
                          initialValue: configDefaultValue || fieldData || fieldInitialValue,
                        },
                      },
                      form,
                    )(
                      <EditInput
                        id={fieldIndex}
                        handleChangeText={(value) => this.handleInput(_.get(field, 'field'), value)}
                        disabled={disableField}
                        content={configDefaultValue || relatedValue || fieldData}
                        key={`${title}`}
                      />,
                    )}
                  </StyledBody>
                </ListItem>
                {_.get(field, 'field') === pitchTipField && _tipContent ? (
                  <TipContent text={_tipContent} />
                ) : null}
              </View>,
            );
          } else if (fieldRenderType === 'attachment') {
            const configDefaultValue = _.get(configDefaultValueMap, _.get(field, 'field'));
            fields.push(
              <View key={`${title || ''}_item_${_.get(field, 'field', '')}`}>
                <ListItem>
                  <StyledLeft>
                    <RequiredTextView
                      disabled={disableField}
                      isRequired={fieldRequired}
                      title={title}
                      tipContent={_tipContent}
                      handleTip={this.changeTipField(_.get(field, 'field', ''))}
                    />
                  </StyledLeft>
                  <StyledBody>
                    {createField(
                      {
                        name: _.get(field, 'field'),
                        validOptions: {
                          rules: [
                            {
                              required: fieldRenderType === 'component' ? false : fieldRequired,
                              message: `${title} ${message || '为必填项'}`,
                            },
                          ],
                          initialValue: configDefaultValue || fieldData || fieldInitialValue,
                        },
                      },
                      form,
                    )(
                      <AttachmentItem
                        disabled={disableField}
                        navigation={navigation}
                        data={configDefaultValue || relatedValue || fieldData || []}
                        key={`${title}`}
                        handleCreate={handleCreateData}
                        desc={fieldDesc}
                        field={field}
                        pageType={pageType}
                        title={title}
                      />,
                    )}
                  </StyledBody>
                </ListItem>
                {_.get(field, 'field') === pitchTipField && _tipContent ? (
                  <TipContent text={_tipContent} />
                ) : null}
              </View>,
            );
          } else {
            const configDefaultValue = _.get(configDefaultValueMap, _.get(field, 'field'));
            fields.push(
              <View key={`${title || ''}_item_${_.get(field, 'field', '')}`}>
                <ListItem>
                  <StyledLeft>
                    <RequiredTextView
                      disabled={disableField}
                      isRequired={fieldRequired}
                      title={title}
                      tipContent={_tipContent}
                      handleTip={this.changeTipField(_.get(field, 'field', ''))}
                    />
                  </StyledLeft>
                  <StyledBody>
                    {createField(
                      {
                        name: _.get(field, 'field'),
                        validOptions: {
                          rules: [
                            {
                              pattern,
                              required: fieldRenderType === 'component' ? false : fieldRequired,
                              message: `${title} ${message || '为必填项'}`,
                            },
                          ],
                          initialValue: configDefaultValue || fieldData || fieldInitialValue,
                        },
                      },
                      form,
                    )(
                      <EditInput
                        id={fieldIndex}
                        handleChangeText={(value) => this.handleInput(_.get(field, 'field'), value)}
                        disabled={disableField}
                        content={configDefaultValue || relatedValue || fieldData}
                        key={`${title}`}
                      />,
                    )}
                  </StyledBody>
                </ListItem>
                {_.get(field, 'field') === pitchTipField && _tipContent ? (
                  <TipContent text={_tipContent} />
                ) : null}
              </View>,
            );
          }
        });
      }
      const relateRefs = _.get(section, 'related_refs', []);
      if (relateRefs.length > 0) {
        _.each(relateRefs, (ref) => {
          let relatedComp;

          _.each(componentList, (comp) => {
            if (comp.related_list_name && comp.related_list_name == ref.ref) {
              relatedComp = comp;
            }
          });

          const relatedParentData = detailData;

          const parentData = _.assign({}, relatedParentData, recordData);
          fields.push(
            <RelatedItem
              token={token}
              navigation={navigation}
              parentData={parentData}
              layout={relatedComp}
              permission={permission}
              objectDescription={objectDescription}
              pageType={pageType}
              pageTypeLevel={pageTypeLevel}
              recordData={recordData}
              parentApiName={objectApiName}
              component={componentList}
            />,
          );
        });
      }
    });

    let relateForm = [];
    _.each(componentList.slice(1), (relateComponent) => {
      const AddModalView = isExistModalView(
        relateComponent,
        mergeData,
        navigation,
        pageType,
        pageTypeLevel,
        componentList,
      );

      if (AddModalView) {
        relateForm = _.concat(relateForm, AddModalView);
      }
    });

    const resultFields = _.concat(fields, relateForm);
    return resultFields;
  };

  render() {
    const { detailLayout } = this.props;
    const component = getFirstComponentFromDetailLayout(detailLayout);
    const fieldSections = _.get(component, 'field_sections', []);

    if (_.isEmpty(detailLayout) || _.isEmpty(fieldSections)) {
      return <LoadingScreen isNormalSized={false} />;
    }

    return <View style={{ marginBottom: 20 }}>{this.composeBasicInfo()}</View>;
  }
}

const select = (state, screen) => ({
  crmPowerSetting: state.settings.crmPowerSetting,
});

export default connect(select)(InnerEditView);
