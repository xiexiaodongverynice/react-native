/**
 * Created by Uncle Charlie, 2017/12/14
 * @flow
 */

import React from 'react';
import { Text } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import _ from 'lodash';
import { ActionSheet, Button, Content, Title } from 'native-base';
import { createForm } from 'rc-form';
import requestLayout from '../../actions/pageLayout';
import { needRefreshAttendee } from '../../actions/event';
import { updateDetail, resetUpdateState, clearQuery } from '../../actions/query';
import LoadingScreen from '../common/LoadingScreen';
import * as Util from '../../utils/util';
import I18n from '../../i18n';
import DetailService from '../../services/detailService';
import ErrorScreen from '../common/ErrorScreen';
import InnerEditView from '../common/InnerViews/InnerEditView';
import Constants from '../common/Constants';
import ModalLoadingScreen from '../../components/modal/ModalLoadingScreen';
import themes from '../common/theme';
import {
  ButtonListContainer,
  HeaderLeft,
  StyledBody,
  HeaderRight,
  StyledContainer,
  StyledHeader,
} from '../common/components';
import { toastError } from '../../utils/toast';
import * as CascadeHelper from './cascadeHelp';
import styles from '../common/screenStyle';
import { getQueryInitialState, getObjectApiNameFromProps } from '../common/helpers/QueryHelper';
import { checkValidExpression } from '../common/helpers/recordHelper';
import { cascadeDeleteAllData } from '../../actions/cascadeAction';
import { getFirstComponentFromDetailLayout } from '../../utils/layoutUtil';

const ACTION_EDIT = 'edit';

type Prop = {
  token: string,
  objectDescription: any,
  form: any,
  onComponentDidMount: void,
  permission: any,
  dataError: any,
  navigation: Navigation<{}>,
  screenInfo: ScreenInfo,
  actions: {
    cascadeDeleteAllData: () => void,
    clearQuery: () => void,
    resetUpdateState: (string) => void,
    needRefreshAttendee: (boolean, string) => void,
    updateDetail: (string, string, string, any, any, any, any) => void,
    detailPageLayout: (string, string, string, string) => void,
  },
  apiName: string,
  updateLoading: boolean,
  dispatch: void,
  screen: any,
  layoutError: any,
  updateError: ?any,
  updateData: ?any,
  crmPowerSetting: any,
  cascadeIndexs: ?Array, //* 级联对象索引
  cascadeList: ?Object, //* 级联对象储存
  onComponentUnMount: void,
};

type State = {
  record: Object,
  oldRecord: any,
  _cascade: ?any,
  detailLayout: ?Layout,
  detailData: ?any,
  targetLayoutRecordType: ?any,
};

type ChangeValue = { apiName: string, value: any };

class EditScreen extends React.PureComponent<Prop, State> {
  state: State = {
    record: {},
    _cascade: null,
    detailLayout: {},
    detailData: {},
    targetLayoutRecordType: undefined,
  };

  static defaultProps = {
    apiName: '',
    updateLoading: false,
    updateError: null,
  };

  from: any;

  componentWillUnmount() {
    const { actions, onComponentUnMount } = this.props;
    actions.clearQuery();
    if (_.isFunction(onComponentUnMount)) {
      onComponentUnMount();
    }

    actions.cascadeDeleteAllData();
  }

  async componentDidMount() {
    const { onComponentDidMount } = this.props;
    if (_.isFunction(onComponentDidMount)) {
      onComponentDidMount(this.refresh);
    }

    this.refresh();
  }

  refresh = async () => {
    const {
      navigation,
      screenInfo: { recordType = 'master' },
    } = this.props;
    let targetRecordType = _.get(navigation, 'state.params.navParam.record_type');
    const userId = _.get(navigation, 'state.params.navParam.id');

    targetRecordType = targetRecordType || recordType || 'master';
    const objectApiName = getObjectApiNameFromProps(this.props);

    //* 布局请求失败 回调处理
    const _handleforFail = () => {
      toastError(I18n.t('no_layout'));
      navigation.goBack();
    };

    const { detailLayout, detailData } = await DetailService.initDetail({
      objectApiName,
      recordType: targetRecordType,
      userId,
      handleforFail: _handleforFail,
    });

    this.setState({
      detailLayout,
      detailData,
      targetLayoutRecordType: targetRecordType,
    });
  };

  async componentDidUpdate(prevProps, prevState) {
    const {
      navigation,
      apiName,
      updateData,
      updateError,
      updateLoading,
      actions: { resetUpdateState, needRefreshAttendee },
    } = this.props;

    const updateCallback = _.get(navigation, 'state.params.updateCallback');

    const objectApiName = getObjectApiNameFromProps(this.props);
    if (objectApiName === apiName && updateData && !updateError && !updateLoading) {
      navigation.goBack();
      needRefreshAttendee(true, apiName);
      updateCallback && updateCallback(updateData, null, this.actionRecordType);
      apiName && resetUpdateState(apiName);
    }

    // apiName && resetUpdateState(apiName);
  }

  getActionLabel: (actionLayout: any) => string = (actionLayout) => _.get(actionLayout, 'label');
  getConfirmMessage = (actionlayout) => I18n.t('action_confirm');

  navigate = (destination, param) => {
    this.props.navigation.navigate(destination, param);
  };

  debounceSetState = (data = {}, removeData = []) => {
    const _callback = (composeData, removeComposeData) => {
      const { record } = this.state;
      const resultData = _.assign({}, record, composeData);
      if (!_.isEmpty(removeComposeData)) {
        _.each(removeComposeData, (e) => {
          //* edit清除处理，在新建的record则直接delete，如果数据在库则简易赋值null
          resultData[e] = null;
        });
      }
      this.setState({ record: resultData }, () => {});
    };
    Util.debounceStateUpdate(data, removeData, _callback);
  };

  handleSelectData = ({ apiName, selected, multipleSelect, renderType }, fieldLayout = {}) => {
    if (!multipleSelect) {
      //* 清空select_one和relation，和其__r以及 onLookupChange
      const onchangeClearMap = _.get(fieldLayout, 'onChange.clear', []);
      if (_.isEmpty(selected)) {
        const _resultRemoveMap = [];
        const setFieldMap = _.get(fieldLayout, 'onLookupChange.setFields', []);
        const removeFieldMap = !_.isEmpty(setFieldMap) ? _.map(setFieldMap, (e) => e.target) : [];
        _.each([...removeFieldMap, ...onchangeClearMap], (_fieldName) => {
          _resultRemoveMap.push(_fieldName);
          _resultRemoveMap.push(`${_fieldName}__r`);
        });
        this.debounceSetState({}, [apiName, `${apiName}__r`].concat(_resultRemoveMap));
        return;
      }

      let value = _.get(selected, '[0].id') || _.get(selected, '[0].value');
      let temp__r = {
        [`${apiName}__r`]: _.get(selected, '[0]', {}),
      };
      if (!value && !_.isBoolean(value)) {
        value = _.get(selected, `[0].${apiName}`);
        temp__r = _.set({}, `${apiName}__r`, _.get(selected, `[0].${apiName}__r`));
        if (apiName === 'product') {
          temp__r['name'] = _.get(selected, `[0].name`);
        }
      }

      let temp = _.set({}, apiName, value);
      if (renderType && renderType === 'select_multiple') {
        temp = _.set({}, `${apiName}[0]`, value);
      }
      const { record } = this.state;

      if (apiName === 'geo') {
        this.debounceSetState({ ...temp.geo });
      } else {
        const _resultRemoveMap = [];
        _.each(onchangeClearMap, (_fieldName) => {
          _resultRemoveMap.push(_fieldName);
          _resultRemoveMap.push(`${_fieldName}__r`);
        });
        const data = _.assign({}, temp__r, temp);
        this.debounceSetState(data, _resultRemoveMap);
      }
      // }
    } else {
      const value = _.map(selected, (o) => o.value);
      const temp = _.set({}, apiName, value);
      const { record } = this.state;
      if (apiName === 'geo') {
        this.setState({ record: _.assign({}, record, { ...temp.geo }) });
      } else {
        this.setState({ record: _.assign({}, record, temp) });
      }
    }
  };

  handleFieldValueChange = (fieldName: string, fieldValue: any) => {
    console.log('===>edit screen handleFieldValueChange, param', {
      fieldName,
      fieldValue,
    });
    const { record } = this.state;
    const temp = {};
    _.set(temp, fieldName, fieldValue === '' ? null : fieldValue);
    const newRecord = _.assign({}, record, temp);
    this.setState({ record: newRecord });
  };

  handleRelatedChange = (changedValues: Array<ChangeValue>) => {
    //* 如何按如下处理 __r会被赋值为单一的id或value
    const temp = {};
    _.each(changedValues, (item) => {
      _.set(temp, `${item.apiName}`, _.get(item, 'value'));
    });

    this.debounceSetState(temp);
  };

  handleUpdate = async (actionLayout: any) => {
    const {
      token,
      actions: { updateDetail },
      objectDescription,
      navigation,
      crmPowerSetting,
      cascadeIndexs,
      cascadeList,
    } = this.props;

    const objectApiName = getObjectApiNameFromProps(this.props);

    const { detailData, _cascade } = this.state;
    const detailLayout = _.get(this.state, 'detailLayout');
    const { record, oldRecord } = this.state;

    // TODO: validates fields

    this.props.form.validateFields(async (err, values) => {
      if (err) {
        // console.warn('###fields errors, can not update', err);
        return toastError(_.get(Object.values(err), ['0', 'errors', '0', 'message']));
      }
      /**
       * check valid_expression
       */
      const valid_result = checkValidExpression({
        layout: actionLayout,
        thizRecord: Object.assign({}, detailData, values, record),
      });
      if (_.isString(valid_result)) return toastError(valid_result);

      let processedData = _.cloneDeep(record); // 真正的需要更新的对象，修改了多少，就传参后台多少(可去除dcr变更字段)
      const component = getFirstComponentFromDetailLayout(detailLayout);
      const mergedRecord = _.assign({}, detailData, values, record);
      const expression = _.get(component, 'expression');
      if (expression) {
        const value = Util.executeDetailExp(expression, mergedRecord);
        if (value !== true) {
          toastError(value);
          console.warn(`### expression ${expression} value not right`);
          return;
        }
      }

      _.each(processedData, (value, key) => {
        if (_.has(value, '_isAMomentObject')) {
          _.set(processedData, key, value.valueOf());
        }
      });

      // Set version and id
      _.set(processedData, 'version', _.get(detailData, 'version'));
      const updateUserId = _.get(detailData, 'id');
      _.set(processedData, 'id', updateUserId);

      // Set default values
      const defaultValues = _.get(actionLayout, 'default_field_val');
      if (!_.isEmpty(defaultValues)) {
        _.each(defaultValues, (valLayout) => {
          const defaultVal = _.get(valLayout, 'val');
          const defaultField = _.get(valLayout, 'field');

          let result = defaultField;
          if (_.eq(_.get(valLayout, 'field_type'), 'js')) {
            result = Util.executeDetailExp(defaultVal, mergedRecord);
            _.set(processedData, defaultField, result);
            if (defaultField === 'record_type') {
              this.actionRecordType = result;
            }
          } else {
            if (defaultField === 'record_type') {
              this.actionRecordType = defaultVal;
            }
            _.set(processedData, defaultField, defaultVal);
          }
        });
      }

      const objDescription = _.find(_.get(objectDescription, 'items'), {
        api_name: objectApiName,
      });
      const fieldList = _.get(objDescription, 'fields');
      //处理dcr部分内容，分两种情况：1、直接可以入库的dcr变更；2、不可以直接入库的dcr变更，需要对即将保存的values进行omit
      const fieldSections = _.get(component, 'field_sections');
      const dcrFieldApiNames = [];
      const newRecord = _.cloneDeep(processedData); // 因为processedData可能需要去除dcr字段
      _.forEach(fieldSections, (fieldSection) => {
        const fields = _.get(fieldSection, 'fields');
        const dcrFields = _.filter(fields, 'is_dcr');

        _.forEach(dcrFields, (dcrField) => {
          const fieldApiName = _.get(dcrField, 'field');
          const fieldDescribe = _.find(fieldList, { api_name: fieldApiName });
          const fielType = _.get(fieldDescribe, 'type');
          const isDcr = _.get(dcrField, 'is_dcr', false);

          if (fielType === 'relation') {
            const fieldInstance = this.props.form.getFieldInstance(fieldApiName);
            // 下方是处理：因为relation永远为一个值，所以可以放心的用selected[0]，
            // id\name，这样的方式是因为父对象作为关联对象的时候，永远取id和name
            const targetName = _.get(fieldInstance, 'state.selected[0].name');
            const targetValue = _.get(fieldInstance, 'state.selected[0].id');
            _.set(newRecord, `${fieldApiName}__r.name`, targetName);
            _.set(newRecord, `${fieldApiName}__r.id`, targetValue);
          }

          if (isDcr && _.eq(global.DCR_EDIT_CUSTOMER_RULE, '0')) {
            // 是dcr字段  &&  DCR验证后可用
            dcrFieldApiNames.push(fieldApiName);
          }
        });
      });

      processedData = CascadeHelper.getComposeCascadeData(
        processedData,
        cascadeIndexs,
        cascadeList,
        detailLayout,
      );

      updateDetail(
        token,
        updateUserId,
        objectApiName,
        processedData, // 变更的对象属性值，可能包含去除了dcr字段的。有可能会为{}
        detailData, // 老的对象，没有任何变化，给model进行比对使用
        newRecord, // 新的对象，包含dcr字段，给model进行保存dcr信息用
        detailLayout,
        objDescription,
        null,
      );
      // }
    });
  };

  handleRelatedAddConfirm = (actionLayout) => {
    // console.log('===>related add', actionLayout);
    // TODO: deal with related add
  };

  handleOkConfirm = (actionLayout) => {
    const { detailData, record } = this.state;
    const mergeData = _.assign({}, detailData, record);
    /**
     * check valid_expression
     */
    const valid_result = checkValidExpression({
      layout: actionLayout,
      thizRecord: mergeData,
    });

    if (_.isNull(valid_result) || _.isEqual(valid_result, true)) {
      const needConfirm = _.get(actionLayout, 'need_confirm', false);
      const actionLabel = this.getActionLabel(actionLayout);

      if (!needConfirm) {
        this.handleUpdate(actionLayout);
        return;
      }

      const confirmButtons = ['确认', '取消'];

      const confirmMessage = this.getConfirmMessage(actionLayout);
      ActionSheet.show(
        {
          options: confirmButtons,
          cancelButtonIndex: confirmButtons.length - 1,
          destructiveButtonIndex: confirmButtons.length - 1,
          title: `${confirmMessage}${actionLabel}?`,
        },
        (buttonIndex) => {
          console.log('===>confirm button index', buttonIndex);
          if (buttonIndex === 0) {
            this.handleUpdate(actionLayout);
          }
        },
      );
    } else {
      toastError(valid_result);
    }
  };

  renderButtonList = () => {
    const detailLayout = _.get(this.state, 'detailLayout');
    const detailData = _.get(this.state, 'detailData', {});
    if (!detailLayout) {
      return null;
    }

    const component = getFirstComponentFromDetailLayout(detailLayout);

    if (_.isEmpty(component)) {
      console.warn('component layuout is invalid');
      return;
    }
    const actionList = _.filter(
      _.get(component, 'actions'),
      (action) => _.indexOf(_.get(action, 'show_when'), ACTION_EDIT) >= 0,
    );

    const buttonList = [];
    _.each(actionList, (action, index) => {
      const hiddenDevices = _.get(action, 'hidden_devices', []);
      const disableFun = _.get(action, 'disabled_expression', 'return false');
      const isDisabled = Util.executeDetailExp(disableFun, detailData);
      const hiddenFun = _.get(action, 'hidden_expression', 'return false');
      const isHidden = Util.executeDetailExp(hiddenFun, detailData);

      if (isHidden || _.includes(hiddenDevices, 'cellphone')) {
        return;
      }

      const actionCode = _.toUpper(_.get(action, 'action'));
      // const actionLabel = _.get(action, 'label');
      // const actionOperactionCode = _.toUpper(_.get(action,'action'));
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

      if (actionCode === 'RELATEDADD') {
        buttonList.push(
          <Button
            key={`relatedadd_${actionCode}_${index}`}
            disabled={isDisabled}
            style={styles.actionButton}
            onPress={() => this.handleRelatedAddConfirm(action)}
          >
            <Text style={{ color: themes.primary_button_text_color }}>{actionLabel}</Text>
          </Button>,
        );
      } else if (actionCode === 'UPDATE') {
        buttonList.push(
          <Button
            key={`update_${index}`}
            disabled={isDisabled}
            style={styles.actionButton}
            onPress={() => {
              if (_.get(action, 'action_code') === 'COMPLETE_CALL') {
                this.handleOkConfirm(action);
                return;
              }
              this.handleOkConfirm(action);
            }}
          >
            <Text style={{ color: themes.primary_button_text_color }}>{actionLabel}</Text>
          </Button>,
        );
      } else if (actionCode === 'SAVE') {
        buttonList.push(
          <Button
            key={`save_${index}`}
            disabled={isDisabled}
            style={styles.actionButton}
            onPress={() => Util.showConfirm(action, this.handleUpdate)}
          >
            <Text style={{ color: themes.primary_button_text_color }}>{actionLabel}</Text>
          </Button>,
        );
      } else if (actionCode === 'CALLBACK') {
        // TODO: no need to deal with this in phone
      }
    });

    return buttonList;
  };

  renderEditView = () => {
    const {
      token,
      navigation,
      dataError,
      objectDescription,
      permission,
      form,
      layoutError,
    } = this.props;
    const { detailData, record } = this.state;
    const detailLayout = _.get(this.state, 'detailLayout');

    if (!_.isEmpty(dataError)) {
      return <ErrorScreen />;
    } else if (_.isEmpty(detailData)) {
      return <LoadingScreen />;
    }
    const theRelatedParentData = _.assign({}, detailData, record);
    const objectApiName = getObjectApiNameFromProps(this.props);
    // TODO: deal with the layout error
    return (
      <InnerEditView
        token={token}
        detailData={detailData}
        objectApiName={objectApiName}
        objectDescription={objectDescription}
        permission={permission}
        detailLayout={detailLayout}
        layoutError={layoutError}
        pageType="edit"
        pageTypeLevel="main"
        navigation={navigation}
        navigate={this.navigate}
        form={form}
        handleCreateData={this.handleSelectData}
        handleValueChange={this.handleFieldValueChange}
        handleRelatedChange={this.handleRelatedChange}
        handleSectionData={() => {}}
        recordData={record}
        targetLayoutRecordType={this.state.targetLayoutRecordType}
        recordType={this.state.targetLayoutRecordType}
        theRelatedParentData={theRelatedParentData}
      />
    );
  };

  renderContent = () => {
    const detailLayout = _.get(this.state, 'detailLayout');
    const { navigation } = this.props;

    if (_.isEmpty(detailLayout) || _.isEmpty(_.get(detailLayout, 'containers'))) {
      return <LoadingScreen />;
    }

    return this.renderEditView();
  };

  render() {
    const detailLayout = _.get(this.state, 'detailLayout');
    const { navigation, dispatch, screen, updateLoading } = this.props;
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
          <StyledBody>
            <Title
              style={{
                color: themes.title_text_color,
                fontSize: themes.title_size,
              }}
            >
              {I18n.t_layout_headerTitle(detailLayout, '')}
            </Title>
          </StyledBody>
          <HeaderRight />
        </StyledHeader>
        <Content
          style={[{ marginBottom: 44 }, themes.isIphoneX && { marginBottom: 55 }]}
          enableResetScrollToCoords={false}
        >
          {this.renderContent()}
        </Content>
        {Util.renderAdjustResizeView(
          <ButtonListContainer>{this.renderButtonList()}</ButtonListContainer>,
          { keyboardVerticalOffset: 0 },
        )}
        <ModalLoadingScreen visibleStatus={updateLoading} />
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
    crmPowerSetting: state.settings.crmPowerSetting,
    cascadeList: state.cascade.cascadeList,
    cascadeIndexs: state.cascade.cascadeIndexs,
    apiName: query.apiName,
    updateLoading: query.updateLoading,
    updateError: query.updateError,
    updateData: query.updateData,
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
    fieldNameProp: 'edit_screen',
    fieldMetaProp: Constants.FIELD_META_PROP,
    fieldDataProp: Constants.FIELD_DATA_PROP,
  })(EditScreen),
);
