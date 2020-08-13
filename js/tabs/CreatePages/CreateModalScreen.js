/**
 * Create by Uncle Charlie, 4/1/2018
 * @flow
 */

import React from 'react';
import { Text } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Body, Button, Content, Icon, Right, Title } from 'native-base';
import { createForm } from 'rc-form';
import moment from 'moment';
import _ from 'lodash';
import Privilege from 'fc-common-lib/privilege';
import { updateDetail, resetUpdateState, clearQuery } from '../../actions/query';
import requestLayout from '../../actions/pageLayout';
import LoadingScreen from '../common/LoadingScreen';
import * as Util from '../../utils/util';
import InnerEditView from '../common/InnerViews/InnerEditView';
import Constants from '../common/Constants';
import themes from '../common/theme';
import {
  ButtonListContainer,
  HeaderLeft,
  StyledContainer,
  StyledHeader,
} from '../common/components';
import { needRefreshAttendee } from '../../actions/event';
import ModalPopoverScreen from '../common/ModalPopoverScreen';
import styles from '../common/screenStyle';
import { getQueryInitialState } from '../common/helpers/QueryHelper';
import I18n from '../../i18n/index';
import { toastError } from '../../utils/toast';
import StickButton from '../common/StickButton';
import { SETTING_FIELD, getForgeData } from '../../utils/const';
import {
  cascadeUpdateData,
  cascadeDeleteAllData,
  cascadeUpdateStatus,
  cascadeDeleteData,
  cascadeRetrace,
} from '../../actions/cascadeAction';
import handleUpdateCascade, { CASCADE_CREATE } from '../../utils/helpers/handleUpdateCascade';
import * as locationHelper from '../common/helpers/locationHelper';
import { checkValidExpression } from '../common/helpers/recordHelper';
import DetailService from '../../services/detailService';

//* 无需验证
const ARRARY_NO_VALIDAT = ['sign_in_photo', 'sign_out_photo', 'survey_feedback', 'image', 'photo'];

type Prop = {
  token: string,
  objectDescription: any,
  form: any,
  permission: any,
  layoutError: any,
  navigation: Navigation<{}>,
  updateLoading: boolean,
  dispatch: void,
  cascadeIndexs: any,
  cascadeList: any,
  screen: any,
  crmPowerSetting: any,
  actions: {
    updateDetail: (string, string, string, any, any, any, any) => void,
    requestLayout: (string, string, string, string) => void,
    cascadeRetrace: (Object) => void,
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
class CreateModalScreen extends React.PureComponent<Prop, State> {
  buttonPreventTime = 0;
  cacheCascadeIndexs = [];
  cacheCascadeList = {};
  isRetrace = true;

  state: State = {
    record: {},
    _cascade: {},
    detailLayout: null,
    needReturn: false,
    preFields: {},
  };

  //拜访模板相关特殊数据
  callTemplateData = {
    week: [],
    day: [],
  };
  from: any;
  preFields: any;

  constructor(props: Prop) {
    super(props);

    const { navigation } = this.props;
    const relatedParams = _.get(navigation, 'state.params.navParam', {});
    const {
      refObjectApiName,
      relatedListName,
      targetRecordType,
      parentId,
      needReturn,
      parentData,
      from,
      fromType,
      initData,
    } = relatedParams;

    this.from = from;
    this.fromType = fromType;
    this.parentId = parentId;
    this.initData = initData;
    this.parentData = parentData;
    this.relatedListName = relatedListName;

    const callback = _.get(navigation, 'state.params.callback');

    const targetLayoutType: string =
      targetRecordType || _.get(navigation, 'state.params.navParam.recordType');

    const layoutRecordType = targetLayoutType;
    this.recordType = layoutRecordType || 'master';
    this.objectApiName = refObjectApiName;
    this.needReturn = needReturn;
    this.callback = callback;
    this.detailData = this.initData;

    this.state = {
      needReturn: this.needReturn, //?
      btnInitTime: 0,
    };
  }

  componentWillUnmount() {
    const { actions } = this.props;
    if (this.isRetrace) {
      const payload = {
        preCascadeList: this.cacheCascadeList,
        preCascadeIndexs: this.cacheCascadeIndexs,
      };

      actions.cascadeRetrace(payload);
    }
    // this.props.actions.clearQuery();
  }

  async componentDidMount() {
    // const { onComponentDidMount } = this.props;
    // if (_.isFunction(onComponentDidMount)) {
    //   onComponentDidMount(this.refresh);
    // }

    const { cascadeIndexs, cascadeList } = this.props;
    this.cacheCascadeIndexs = _.cloneDeep(cascadeIndexs);
    this.cacheCascadeList = _.cloneDeep(cascadeList);
    this.refresh();
  }

  refresh = async () => {
    const detailLayout = await DetailService.getDetailLayout({
      objectApiName: this.objectApiName,
      recordType: this.recordType,
    });

    this.components = _.get(detailLayout, 'containers[0].components');
    const detailForm = this.components[0];
    const { field_sections } = detailForm;
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
        let temp = _.set({}, apiName, value);
        if (renderType && renderType === 'select_multiple') {
          temp = _.set({}, `${apiName}[0]`, value);
        }

        const { record } = this.state;
        this.setState({ record: _.assign({}, record, { ...temp.geo[0] }) });
      } else {
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
      console.log(this.defaultCalenderTime, 'this.defaultCalenderTime1');
      newRecord['defaultCalenderTime'] = this.defaultCalenderTime;
    }
    this.setState({ record: newRecord });
  };

  handleRelatedChange = (changedValues: Array<ChangeValue>) => {
    console.log('===>create screen related change', changedValues);
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
    // let relateObj = {};
    const temp = {};
    _.each(changedValues, (item) => {
      if (getValue(item) && item.apiName.indexOf('__r') < 0) {
        _.set(temp, `${item.apiName}`, getValue(item));
      } else if (item.apiName.indexOf('__r') > -1) {
        _.set(temp, `${item.apiName}`, item.value);
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

  handleCreate = (actionLayout) => {
    const detailLayout = _.get(this.state, 'detailLayout');
    const { form, crmPowerSetting, navigation, updateLoading } = this.props;
    const relatedParams = _.get(navigation, 'state.params.navParam', {});

    const { record, preFields } = this.state;
    const objectApiName = this.objectApiName;

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

    console.log('record====>', record);

    form.validateFields(async (err, values) => {
      if (err) {
        // console.warn('### fields errors, can not update', err);
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

      // const { parentData } = relatedParams;

      let processedData = _.cloneDeep(record); // 真正的需要更新的对象，修改了多少，就传参后台多少(可去除dcr变更字段)

      processedData['object_describe_name'] = objectApiName;
      const component = _.get(detailLayout, 'containers[0].components[0]');
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

      processedData = await locationHelper.insertLocationOffsetInfo({
        newData: processedData,
        relativeLocationField: _.get(
          detailLayout,
          SETTING_FIELD.RELATIVE_LOCATION_FIELD,
          'customer',
        ),
      });

      console.log('===>create screen handle create state', processedData);

      if (this.initData) {
        for (const i in this.initData) {
          if (!processedData[i]) {
            processedData[i] = this.initData[i];
          }
        }
      }

      //* 用于和初始化的cascade数据做区别
      _.set(processedData, '_status', 'create');

      this.isRetrace = false;
      this.composeUpdateData(processedData);
    });
  };

  composeUpdateData = (processedData) => {
    const { navigation, dispatch } = this.props;

    const _id = `${moment().valueOf()}`;

    const FORGE_DATA = getForgeData();
    const _parentId = _.get(this.parentData, 'id', _.get(this.parentData, '_id'));

    const resultData = {
      ...FORGE_DATA,

      ...processedData,
    };

    handleUpdateCascade({
      data: resultData,
      relatedListName: this.relatedListName,
      status: CASCADE_CREATE,
      parentId: _parentId,
      dispatch,
      fakeId: _id,
    });

    if (_.isFunction(this.callback)) {
      this.callback(_id);
    }
    navigation.goBack();
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

  renderButtonList = (elementOrMeta = 1) => {
    const ACTION_ADD = 'add';
    const detailLayout = _.get(this.state, 'detailLayout');
    if (!detailLayout) {
      return null;
    }

    const { permission, updateLoading, navigation } = this.props;
    const relatedParams = _.get(navigation, 'state.params.navParam', {});
    const { parentData = {}, initData = {} } = relatedParams;
    const { record = {} } = this.state;
    const objectItself = Object.assign({}, initData, record);
    const component = _.get(detailLayout, 'containers[0].components[0]');

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
      const hiddenFun = _.get(action, 'hidden_expression', 'return false');
      const isHidden = Util.executeDetailExp(hiddenFun, objectItself, parentData);
      if (isHidden) {
        return;
      }

      const actionCode = _.toUpper(_.get(action, 'action'));

      if (Privilege.checkAction(actionCode, permission, this.objectApiName)) {
        buttonList.push(
          Object.assign({}, action, {
            handler: this.handleCreate.bind(this, action),
          }),
        );
      } else if (actionCode === 'CALLBACK') {
        // buttonList.push(<Button
        //   disabled={isDisabled}
        //   style={{ margin: 8 }}
        //   onPress={() => console.log('button click 2')}
        // >
        //   <Text>{actionLabel} </Text>
        // </Button>);
      }
    });

    if (elementOrMeta === 1) {
      return buttonList.map((action: Object) => {
        const disableFun = _.get(action, 'disabled_expression', 'return false');
        const isDisabled = updateLoading || Util.executeExpression(disableFun, objectItself);
        const actionOperactionCode = _.toUpper(_.get(action, 'action'));
        const actionOperactionLabel = _.get(action, 'label');
        const actionLabel = I18n.t(_.get(action, 'action.i18n_key'), {
          defaults: [
            { scope: `action.${_.toLower(actionOperactionCode)}` },
            { scope: `${_.toLower(actionOperactionCode)}` },
            { message: actionOperactionLabel },
          ],
        });
        return (
          <StickButton
            key={actionLabel}
            active={!isDisabled}
            disabled={isDisabled}
            style={styles.actionButton}
            onPress={action.handler}
            waitTime={3000}
            btnInitTime={this.state.btnInitTime}
            changeBtnTime={(time) => {
              this.setState({ btnInitTime: time });
            }}
          >
            <Text style={{ color: themes.primary_button_text_color }}>{actionLabel}</Text>
          </StickButton>
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

    const { token, navigation, permission, objectDescription, form, dispatch, screen } = this.props;

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
        cascadeRetrace,
        cascadeUpdateData,
        cascadeDeleteAllData,
        cascadeUpdateStatus,
        cascadeDeleteData,
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
  })(CreateModalScreen),
);
