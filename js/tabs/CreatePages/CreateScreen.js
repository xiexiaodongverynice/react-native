/**
 * Create by Uncle Charlie, 4/1/2018
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import moment from 'moment';
import { Body, Button, Content, Icon, Right, Title } from 'native-base';
import { createForm } from 'rc-form';
import _ from 'lodash';
import Privilege from 'fc-common-lib/privilege';
import { updateDetail, resetUpdateState, clearQuery } from '../../actions/query';
import requestLayout from '../../actions/pageLayout';
import LoadingScreen from '../common/LoadingScreen';
import * as Util from '../../utils/util';
import InnerEditView from '../common/InnerViews/InnerEditView';
import Constants from '../common/Constants';
import DetailService from '../../services/detailService';
import themes from '../common/theme';
import ModalLoadingScreen from '../../components/modal/ModalLoadingScreen';
import IndexDataParser from '../../services/dataParser';
import {
  ButtonListContainer,
  HeaderLeft,
  StyledContainer,
  StyledHeader,
} from '../common/components';
import { addAttendee, needRefreshAttendee } from '../../actions/event';
import ModalPopoverScreen from '../common/ModalPopoverScreen';
import styles from '../common/screenStyle';
import * as CreateCascadeHelp from './createCascadeHelp';
import { getQueryInitialState } from '../common/helpers/QueryHelper';
import I18n from '../../i18n/index';
import handleUpdateCascade, { CASCADE_DELETE } from '../../utils/helpers/handleUpdateCascade';
import { toastError } from '../../utils/toast';
import StickButtonView from '../../components/detailComponents/StickButtonView';
import { CreateSideEffect } from './CreateSideEffect';
import { cascadeDeleteAllData } from '../../actions/cascadeAction';
import { checkValidExpression } from '../common/helpers/recordHelper';
import CreateCustomerAction from './createCustomerAction';
import {
  getComponentsWithoutFancyHeader,
  getFirstComponentFromDetailLayout,
} from '../../utils/layoutUtil';

//* 无需验证
const ARRARY_NO_VALIDAT = ['sign_in_photo', 'sign_out_photo', 'survey_feedback', 'image', 'photo'];
type Prop = {
  token: string,
  objectDescription: any,
  form: any,
  permission: any,
  navigation: Navigation<{}>,
  screenInfo: ScreenInfo,
  updateError: any,
  crmPowerSetting: any,
  layoutError: any,
  apiName: string,
  onComponentDidMount: void,
  updateLoading: boolean,
  updateData: any,
  updateSuccess: boolean,
  cascadeIndexs: any,
  cascadeList: any,
  dispatch: void,
  screen: any,
  actions: {
    resetUpdateState: () => void,
    updateDetail: (string, string, string, any, any, any, any) => void,
    requestLayout: (string, string, string, string) => void,
    clearQuery: void,
    cascadeDeleteAllData: void,
    addAttendee: void,
  },
};

type State = {
  record: Object,
  _cascade: ?any,
  detailLayout: ?Layout,
  needReturn?: boolean,
};

type ChangeValue = { apiName: string, value: any };

/**
 * Create something.
 */
class CreateScreen extends React.PureComponent<Prop, State> {
  buttonPreventTime = 0;

  //拜访模板相关特殊数据
  callTemplateData = {
    week: [],
    day: [],
  };
  from: any;
  preFields: any;
  //* onchange clear 清空相关列表
  changeSetFields: Array = [];

  constructor(props: Prop) {
    super(props);

    const {
      navigation,
      objectDescription,
      screenInfo: { recordType, objectApiName },
    } = this.props;
    const relatedParams = _.get(navigation, 'state.params.navParam', {});
    const {
      refObjectApiName,
      relatedListName,
      targetRecordType,
      parentId,
      parentName,
      needReturn,
      parentData,
      from,
      fromType,
      initData,
      my_product,
    } = relatedParams;

    this.from = from;
    this.fromType = fromType;
    this.parentId = parentId;
    this.initData = initData;
    this.parentData = parentData;

    const callback = _.get(navigation, 'state.params.callback');
    const targetLayoutType: string =
      targetRecordType || _.get(navigation, 'state.params.navParam.recordType');
    const layoutRecordType = targetLayoutType || recordType;
    this.recordType = layoutRecordType || 'master';
    this.objectApiName = refObjectApiName || objectApiName;
    this.needReturn = needReturn;
    this.callback = callback;

    this.state = {
      needReturn: this.needReturn, //?
      btnInitTime: 0,
      record: {
        owner: `${global.FC_CRM_USERID}`,
        create_by: `${global.FC_CRM_USERID}`,
      },
      _cascade: {},
      detailLayout: {},
      preFields: {},
    };

    if (parentId && relatedListName) {
      const currentObjectDesc = IndexDataParser.getObjectDescByApiName(
        refObjectApiName,
        objectDescription,
      );
      const refFieldDesc = _.find(_.get(currentObjectDesc, 'fields'), {
        related_list_api_name: relatedListName,
      });
      const fieldApiName = _.get(refFieldDesc, 'api_name');
      this.detailData = {
        [fieldApiName]: parentId,
        [`${fieldApiName}__r.id`]: parentId,
        [`${fieldApiName}__r.name`]: parentName,
        [`${fieldApiName}__r`]: { my_product, id: parentId, name: parentName },
        record_type: this.recordType,
      };
      if (!this.initData) {
        this.initData = this.detailData;
      }
    }

    this.modalRef = null;
  }

  componentWillUnmount() {
    const { actions } = this.props;
    actions.cascadeDeleteAllData();
    actions.clearQuery();
  }

  async componentDidMount() {
    const { onComponentDidMount, navigation } = this.props;

    if (_.isFunction(onComponentDidMount)) {
      onComponentDidMount(this.refresh);
    }

    this.refresh();
  }

  refresh = async () => {
    const detailLayout = await DetailService.getDetailLayout({
      objectApiName: this.objectApiName,
      recordType: this.recordType,
    });

    const components = _.get(detailLayout, 'containers[0].components');
    this.components = getComponentsWithoutFancyHeader(components);
    const detailForm = this.components[0];
    const { field_sections } = detailForm;

    //* 用于onchange clear 列表
    this.changeSetFields = [];
    _.each(field_sections, (section) => {
      const { fields } = section;
      _.each(fields, (field) => {
        if (field.onChange) {
          this.changeSetFields.push(field);
        }
      });
    });

    this.setState({ detailLayout });
  };

  componentDidUpdate(prevProps, prevState) {
    const {
      apiName,
      updateData,
      updateError,
      updateLoading,
      navigation,
      updateSuccess,
      actions,
    } = this.props;

    if (apiName === this.objectApiName && !updateError && !updateLoading && updateSuccess) {
      actions.resetUpdateState();
      navigation.goBack();
      this.callback && this.callback({ updateData, apiName });
      needRefreshAttendee(true, apiName);
    }
  }

  navigate = (destination, param) => {
    this.props.navigation.navigate(destination, param);
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

  // TODO: if it's multiple selection
  handleSelectData = ({ apiName, selected, multipleSelect, renderType }, fieldLayout = {}) => {
    if (!apiName) {
      console.warn('====>set empty apiName!!!');
      return;
    }

    if (!multipleSelect) {
      if (apiName === 'geo') {
        const value = _.map(selected, (o) => o.value);
        const temp = _.set({}, apiName, value);

        this.debounceSetState({ ...temp.geo[0] });
      } else {
        const value = _.get(selected, '[0].id', null) || _.get(selected, '[0].value', null);
        const onchangeClearMap = _.get(fieldLayout, 'onChange.clear', []);

        //* 组合 清除列表ref
        this.composeClearRelate(apiName);

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
      }
    } else {
      const value = _.map(selected, (o) => o.value);
      const temp = _.set({}, apiName, value);

      const { record } = this.state;
      if (apiName === 'geo') {
        this.setState({ record: _.assign({}, record, { ...temp.geo }) });
        this.debounceSetState({ ...temp.geo });
      } else {
        this.debounceSetState(temp);
      }
    }
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

  //*  获取需要清空列表的 related_list_name
  composeClearRelate = (apiName) => {
    _.each(this.changeSetFields, (setField) => {
      if (apiName == setField.field && setField.onChange) {
        //去掉当客户变动的时候，相关联的库存等操作，需要增加新的配置支持
        const clearRelates = setField.onChange.clear;
        const clearList = [];
        _.each(clearRelates, (clearR) => {
          _.each(this.components, (comp) => {
            if (comp.related_list_name && comp.related_list_name == clearR) {
              clearList.push(comp.related_list_name);
            }
          });
        });
        this.clearRelateDatas(clearList);
      }
    });
  };

  // * 清空相关列表
  clearRelateDatas = async (onchangeClearMap) => {
    const { cascadeList, dispatch } = this.props;

    // * 新建页面，主数据没有id
    const parentId = undefined;

    _.each(onchangeClearMap, (refObjDescribe) => {
      const cascadeItems = [];

      _.chain(cascadeList)
        .get(refObjDescribe, {})
        .each((item) => {
          if (!_.isEmpty(item)) {
            cascadeItems.push(item);
          }
        })
        .value();

      if (!_.isEmpty(cascadeItems)) {
        handleUpdateCascade({
          data: cascadeItems,
          relatedListName: refObjDescribe,
          status: CASCADE_DELETE,
          parentId,
          dispatch,
        });
      }
    });
  };

  handleRelatedChange = (changedValues: Array<ChangeValue>) => {
    _.each(changedValues, (change) => {
      this.composeClearRelate(change.apiName);
    });

    const getValue = (item) => {
      const { apiName, value } = item;

      if (apiName === 'end_time' && _.isString(value) && value.indexOf(':') == 2) {
        // 处理时间字符串
        const today = moment().format('YYYY-MM-DD');
        const str = today + ' 00:00';
        const time = moment(str).unix() * 1000;
        return time + this.getTimestamp(value);
      }

      if (!_.isObject(value)) {
        return value;
      } else if (_.isObject(value)) {
        return _.get(item, 'value.id') || _.get(item, 'value.value') || _.get(item, 'value');
      }
    };
    // let relateObj = {};
    const temp = {};
    _.each(changedValues, (item) => {
      if (getValue(item) !== undefined) {
        _.set(
          temp,
          `${item.apiName}`,
          item.apiName.indexOf('__r') > -1 ? item.value : getValue(item),
        );
      }
    });

    const newRecord = temp;
    this.debounceSetState(newRecord);
  };

  handlerTimeChange = (time) => {
    this.defaultCalenderTime = time;
  };

  getTimestamp = (value) => {
    let change = value;
    if (typeof value === 'number') {
      change = moment(value).format('HH:mm');
    } else if (typeof value === 'object') {
      change = value.format('HH:mm');
    }
    const index = change.indexOf(':');
    const hour = change.substring(0, index);
    const min = change.substring(index + 1);
    const realValue = hour * 60 * 60 * 1000 + min * 60 * 1000;

    return realValue;
  };

  preFieldsInChildSection = (obj) => {
    this.setState({
      preFields: obj,
    });
  };

  validFormData = async (actionLayout): Promise => {
    const { form, updateLoading } = this.props;
    const { record } = this.state;

    if (updateLoading) {
      console.warn('===>CreateScreen is loading, do not update anything');
      // return;
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

    return new Promise((resolve, reject) => {
      form.validateFields((err, values) => {
        if (err) {
          console.warn('### fields errors, can not update', err, values);
          reject(Error('valid data is fail'));
          return toastError(_.get(Object.values(err), ['0', 'errors', '0', 'message']));
        }
        /**
         * check valid_expression
         */
        const valid_result = checkValidExpression({
          layout: actionLayout,
          thizRecord: Object.assign({}, this.detailData || {}, values, record),
        });

        if (_.isString(valid_result)) {
          reject(Error(valid_result));
          return toastError(valid_result);
        }

        resolve(values);
      });
    });
  };

  handleCreate = (actionLayout) => {
    this.validFormData(actionLayout)
      .then((values) => {
        Util.showConfirm(actionLayout, this.handleSaveData(values), () => {
          console.log('cancel');
        });
      })
      .catch((e) => {
        console.warn(e);
      });
  };

  handleSaveData = (values) => async (actionLayout) => {
    const detailLayout = _.get(this.state, 'detailLayout');
    const { token, objectDescription, cascadeIndexs, cascadeList } = this.props;

    const { record, preFields } = this.state;
    const objectApiName = this.objectApiName;

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

    let processedData = _.cloneDeep(record); // 真正的需要更新的对象，修改了多少，就传参后台多少(可去除dcr变更字段)
    const objDescription = _.find(_.get(objectDescription, 'items'), {
      api_name: objectApiName,
    });
    processedData['object_describe_name'] = objectApiName;
    const component = getFirstComponentFromDetailLayout(detailLayout);
    const { expression } = component;
    const expressionVal = !_.isEmpty(expression)
      ? Util.executeExpression(expression, record)
      : true;

    if (expressionVal !== true) {
      toastError(expressionVal);
      return;
    }

    if (preFields) {
      for (const i in preFields) {
        processedData[i] = preFields[i];
      }
    }

    _.each(processedData, (val, key) => {
      if (_.has(val, '_isAMomentObject')) {
        _.set(processedData, key, val.valueOf());
      }
    });
    if (!processedData['record_type']) {
      _.set(
        processedData,
        'record_type',
        _.get(actionLayout, 'target_data_record_type', _.get(detailLayout, 'record_type')),
      );
    }

    const defaultFieldVals = _.get(actionLayout, 'default_field_val');
    if (!_.isEmpty(defaultFieldVals)) {
      _.each(defaultFieldVals, (defaultFieldLayout) => {
        const defaultVal = _.get(defaultFieldLayout, 'val');
        const defaultField = _.get(defaultFieldLayout, 'field');
        if (_.eq(_.get(defaultFieldLayout, 'field_type'), 'js')) {
          const resultVal = Util.executeExpression(defaultVal, record);
          _.set(processedData, defaultField, resultVal);
        } else {
          _.set(processedData, defaultField, defaultVal);
        }
      });
    }

    if (CreateSideEffect(processedData, cascadeList)) {
      return;
    }

    if (this.initData) {
      for (const i in this.initData) {
        if (!processedData[i]) {
          processedData[i] = this.initData[i];
        }
      }
    }

    processedData = CreateCascadeHelp.getComposeCascadeData(
      processedData,
      cascadeIndexs,
      cascadeList,
      detailLayout,
    );

    this.props.actions.updateDetail(
      token,
      '',
      objectApiName,
      processedData, // 变更的对象属性值，可能包含去除了dcr字段的。有可能会为{}
      {}, // 老的对象，没有任何变化，给model进行比对使用
      processedData, // 新的对象，包含dcr字段，给model进行保存dcr信息用
      detailLayout,
      objDescription,
      this.callback,
      'add',
    );
  };

  subCallback = (processedData) => {
    //* 新建专题片阅读回调处理
    if (!_.isEmpty(processedData.survey_feedback)) {
      return (data) => {
        console.log('result data====>', data);
      };
    }
    return null;
  };

  //* 通过修改create 中record对象来修改表单组件的value，暂时只支持input、select_one(配置options)
  // TODO 后续针对所有表单组件进行设计
  handleUpdateRecord = (waitUpdataData: Object) => {
    this.setState((prevState) => ({ record: { ...prevState.record, ...waitUpdataData } }));
  };

  renderButtonList = (elementOrMeta = 1) => {
    const ACTION_ADD = 'add';
    const detailLayout = _.get(this.state, 'detailLayout');
    if (!detailLayout) {
      return null;
    }

    const {
      permission,
      updateLoading,
      navigation,
      updateSuccess,
      updateError,
      actions,
    } = this.props;
    const relatedParams = _.get(navigation, 'state.params.navParam', {});
    const { parentData = {}, initData = {} } = relatedParams;
    const { record = {} } = this.state;
    const objectItself = Object.assign({}, initData, record);
    const component = getFirstComponentFromDetailLayout(detailLayout);

    if (_.isEmpty(component)) {
      console.warn('component layuout is invalid');
      return;
    }

    const actionList = _.filter(
      _.get(component, 'actions'),
      (action) => _.indexOf(_.get(action, 'show_when'), ACTION_ADD) >= 0,
    );

    const buttonList = [];
    _.each(actionList, (action) => {
      const hiddenDevices = _.get(action, 'hidden_devices', []);

      const hiddenFun = _.get(action, 'hidden_expression', 'return false');
      const isHidden = Util.executeDetailExp(hiddenFun, objectItself, parentData);
      if (isHidden || _.includes(hiddenDevices, 'cellphone')) {
        return;
      }

      const actionCode = _.toUpper(_.get(action, 'action'));
      const isCustom = _.get(action, 'is_custom', false);

      if (Privilege.checkAction(actionCode, permission, this.objectApiName)) {
        buttonList.push(
          Object.assign({}, action, {
            handler: () => {
              this.handleCreate(action);
            },
          }),
        );
      } else if (isCustom) {
        //* 绿谷定级历史
        if (actionCode === 'CHECK_LAST_SEGMENTATION') {
          buttonList.push(
            Object.assign({}, action, {
              handler: () => {
                CreateCustomerAction.checkLastSegmentationHandle({
                  action,
                  initData: this.initData,
                  detailData: this.detailData,
                  record: _.get(this.state, 'record'),
                  callback: this.handleUpdateRecord,
                });
              },
            }),
          );
        } else if (actionCode === 'SAVE_EVENT_ACTION') {
          //* https://jira.forceclouds.com/browse/CSTON-45
          //* 基石定制需求
          //* 新建拜访保存后触发customer action跳转到添加参会人列表
          buttonList.push(
            Object.assign({}, action, {
              handler: () => {
                CreateCustomerAction.saveAndNavtoAttendeePage({
                  action,
                  objectApiName: this.objectApiName,
                  validFormData: this.validFormData,
                  record: _.get(this.state, 'record'),
                  refreshIndex: this.callback,
                  addAttendee: actions.addAttendee,
                  navigation,
                });
              },
            }),
          );
        }
      }
    });

    if (elementOrMeta === 1) {
      return buttonList.map((action: Object) => {
        const disableFun = _.get(action, 'disabled_expression', 'return false');
        const isDisabled = updateLoading || Util.executeExpression(disableFun, objectItself);
        const actionCode = _.toUpper(_.get(action, 'action'));
        const actionOperactionLabel = _.get(action, 'label');
        let actionLabel = I18n.t(_.get(action, 'action.i18n_key'), {
          defaults: [
            { scope: `action.${_.toLower(actionCode)}` },
            { scope: `${_.toLower(actionCode)}` },
            { message: actionOperactionLabel },
          ],
        });

        if (actionOperactionLabel) {
          actionLabel = actionOperactionLabel;
        }

        return (
          <StickButtonView
            key={actionLabel}
            active={!isDisabled}
            disabled={isDisabled}
            style={styles.actionButton}
            onPress={action.handler}
            btnLoading={updateLoading}
            queryError={updateError}
            btnText={actionLabel}
            querySuccess={updateSuccess}
          />
        );
      });
    }

    return buttonList.map((action) =>
      Object.assign({}, action, {
        pressHandler: () => {
          const { handler } = action;
          if (_.isFunction(handler)) {
            handler(action);
          }
        },
      }),
    );
  };

  renderContent = () => {
    const detailLayout = _.get(this.state, 'detailLayout');

    if (_.isEmpty(detailLayout)) {
      return <LoadingScreen />;
    }

    const { token, navigation, permission, objectDescription, form } = this.props;

    // when call template detail weekday and timestamp must have
    const relatedParams = _.get(navigation, 'state.params.navParam', {});
    const { weekDay, timestamp } = relatedParams;
    if (this.detailData && !this.detailData['owner']) {
      this.detailData['owner'] = `${global.FC_CRM_USERID}`;
    }
    return (
      <InnerEditView
        token={token}
        detailData={this.detailData}
        objectApiName={this.objectApiName}
        objectDescription={objectDescription}
        permission={permission}
        detailLayout={detailLayout}
        layoutError={this.props.layoutError}
        pageType="add"
        navigation={navigation}
        navigate={this.navigate}
        form={form}
        handleCreateData={this.handleSelectData}
        handleValueChange={this.handleFieldValueChange}
        handleRelatedChange={this.handleRelatedChange}
        handlerTimeChange={this.handlerTimeChange}
        weekDay={weekDay}
        timestamp={timestamp}
        recordData={this.state.record}
        recordType={this.recordType}
        handleSectionData={this.preFieldsInChildSection}
        initData={this.initData}
        theRelatedParentData={this.parentData}
        defaultCalenderTime={this.defaultCalenderTime}
      />
    );
  };

  setModalPopoverVisible = (visible: boolean, callback: Function = () => void 0) => {
    this.modalRef.setModalVisible(visible, callback);
  };

  renderHeaderRightButtons = () => [
    <Button transparent onPress={() => this.setModalPopoverVisible(true)}>
      <Icon name="ios-more" />
    </Button>,
  ];

  render() {
    const detailLayout = _.get(this.state, 'detailLayout');
    const addActions = this.renderButtonList(2);

    const {
      token,
      navigation,
      permission,
      objectDescription,
      form,
      dispatch,
      screen,
      updateLoading,
    } = this.props;

    return (
      <StyledContainer style={{ backgroundColor: themes.fill_base }}>
        <StyledHeader>
          <HeaderLeft
            style={{ flex: 1 }}
            navigation={navigation}
            dispatch={dispatch}
            screen={screen}
            needConfirm
          />
          <Body style={{ flex: 1, alignItems: 'center' }}>
            <Title
              style={{
                color: themes.title_text_color,
                fontSize: themes.title_size,
              }}
            >
              {' '}
              {I18n.t_layout_headerTitle(detailLayout, '')}
            </Title>
          </Body>
          <Right />
        </StyledHeader>
        <Content
          style={{
            marginBottom: 55,
          }}
          enableResetScrollToCoords={false}
        >
          {this.renderContent()}
        </Content>
        {Util.renderAdjustResizeView(
          <ButtonListContainer>{this.renderButtonList()}</ButtonListContainer>,
          { keyboardVerticalOffset: 0 },
        )}
        <ModalLoadingScreen visibleStatus={updateLoading} />
        <ModalPopoverScreen
          ref={(el) => (this.modalRef = el)}
          addActions={addActions}
          navigation={navigation}
        />
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
    cascadeList: state.cascade.cascadeList,
    cascadeIndexs: state.cascade.cascadeIndexs,
    updateLoading: query.updateLoading,
    updateError: query.updateError,
    updateData: query.updateData,
    updateSuccess: query.updateSuccess,
    crmPowerSetting: state.settings.crmPowerSetting,
    screen,
  };
};

const act = (dispatch, { navigation }) => {
  const key = _.get(navigation, 'state.key');
  return {
    actions: bindActionCreators(
      {
        detailPageLayout: requestLayout,
        updateDetail: updateDetail(key),
        resetUpdateState: resetUpdateState(key),
        clearQuery: clearQuery(key),
        needRefreshAttendee,
        cascadeDeleteAllData,
        addAttendee,
      },
      dispatch,
    ),
    dispatch,
  };
};

export default connect(
  select,
  act,
)(
  createForm({
    fieldNameProp: 'create_screen',
    fieldMetaProp: Constants.FIELD_META_PROP,
    fieldDataProp: Constants.FIELD_DATA_PROP,
  })(CreateScreen),
);
