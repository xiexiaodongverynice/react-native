/**
 * Created by Uncle Charlie, 2017/12/11
 * @flow
 */

import React from 'react';
import { Text, DeviceEventEmitter } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import _ from 'lodash';
import { Button, Header, Icon, Title } from 'native-base';
import ScrollableTabView, { ScrollableTabBar } from 'react-native-scrollable-tab-view';
import QuerComposer from 'fc-common-lib/query-composer';
import Privilege from 'fc-common-lib/privilege';
import requestLayout from '../../actions/pageLayout';
import userInfoAction from '../../actions/userBasicInfo';
import { updateDetail, resetUpdateState, clearQuery } from '../../actions/query';
import LoadingScreen from '../common/LoadingScreen';
import I18n from '../../i18n';
import DetailCustomerAction from './detailCustomerAction';
import InnerDetailView from '../common/InnerDetailView';
import InnerUserInfoView from '../common/InnerViews/InnerUserInfoView';
import WarningScreen from '../../components/hintView/WarningScreen';
import * as Util from '../../utils/util';
import DetailService from '../../services/detailService';
import { addAttendee, addWalkinAttendeeSuccess, needRefreshAttendee } from '../../actions/event';
import { recordUpdateAction } from '../../actions/recordUpdate';
import {
  getApprovalNodesByRecordId,
  submitApproval,
  cancelApproval,
  nodeOperation,
} from '../../actions/approvalFlow';
import themes from '../common/theme';
import IndexDataParser from '../../services/dataParser';
import {
  Confirm,
  StyledBody,
  HeaderLeft,
  HeaderRight,
  StyledContainer,
  StyledHeader,
} from '../common/components';
import { cascadeDeleteAllData } from '../../actions/cascadeAction';
import { recordDeleteAction } from '../../actions/recordDelete';
import { toastSuccess, toastWaring, toastError, toastDefault } from '../../utils/toast';
import ModalPopoverScreen from '../common/ModalPopoverScreen';
import { deleteNavigationHistory, updateNavigationHistory } from '../../actions/navigation';

import styles from '../common/screenStyle';
import { getQueryInitialState } from '../common/helpers/QueryHelper';
import CustomActionService from '../../services/customActionService';
import {
  checkValidExpression,
  getCustomActionCallbacks,
  getRecordFields,
} from '../common/helpers/recordHelper';
import initState from '../../reducers/state';
import ModalLoadingScreen from '../../components/modal/ModalLoadingScreen';
import { baseURL } from '../../utils/config';
import { getSrc } from '../common/helpers/modalWidget';
import assert from '../../utils/assert0';
import scrollableTabView_styles from '../../styles/scrollableTabView_styles';
import DetailFancyHeader from './DetailFancyHeader';
import { getComponentsWithoutFancyHeader } from '../../utils/layoutUtil';

type Prop = {
  token: string,
  screenInfo: ScreenInfo,
  permission: any,
  objectDescription: any,
  updateData: any,
  updateError: boolean,
  apiName: string,
  dispatch: void,
  fromRecordType?: string,
  screen: any,
  onComponentDidMount: void,
  updateLoading: boolean,
  navigation: {
    goBack: void,
    navigate: void,
    state: {
      params: {
        navParam: {
          updataCallback: void,
          fromRecordType?: string,
        },
      },
    },
  },
  approvalFlowInfo: {
    approval_nodes: ?Array,
    approval_flow: ?object,
  }, //* 审批流信息
  actions: {
    getApprovalNode: void, //* 获取审批流信息
    submitApprovalNode: void, //* 提交审批
    cancelApproval: void, //* 撤回审批
    nodeOperation: void,
    recordUpdateAction: void,
    clearQuery: void,
    deleteNavigationHistory: void,
    cascadeDeleteAllData: void,
    updateDetail: void,
    resetUpdateState: void,
    recordDeleteAction: void,
    needRefreshAttendee: void,
    updateNavigationHistory: void,
    addAttendee: void,
  },
};

type State = {
  detailLayout: Layout,
  detailData: {},
  callExtenderRefresh: boolean, //一个flag，初始值是false，refresh执行完毕后会改为true。似乎应该叫refreshCalled
  modalLoadingVisible: boolean, //* modalloading
};

const ACTION_DETAIL = 'detail';
const STATE_DETAIL_DATA = 'detailData';

/*
 Detail Screen
 TODO: use state for detail data
 */
const top__filename = 'DetailScreen.js';
class DetailScreen extends React.Component<Prop, State> {
  constructor(props) {
    super(props);
    console.logConstructorHash(top__filename, this);
    const { navigation } = props;
    this.navParam = _.get(navigation, 'state.params.navParam', {});
    this.isTopLevel = _.get(this.navParam, 'isTopLevel', true);
    this.fromRecordType = _.get(this.navParam, 'fromRecordType');
    this.state = { callExtenderRefresh: false, modalLoadingVisible: false };
  }
  modalRef: ModalPopoverScreen;

  tabs: Object = {};

  async componentDidMount() {
    const { onComponentDidMount, navigation } = this.props;
    if (_.isFunction(onComponentDidMount)) {
      onComponentDidMount(this.refresh);
    }
    this.getApprovalFlow();

    // onUpdate 为 updateRecord 调用之后的触发函数，注意它的语义不是 onEnter.
    const onUpdate = _.get(navigation, 'state.params.navParam.onUpdate');
    const updateParams = _.get(navigation, 'state.params.navParam.updateParams');

    if (!_.isEmpty(updateParams)) {
      this.updateRecord(updateParams, onUpdate);
    }

    await this.refresh();
  }

  /**
   * 优化的空间则是可以放在 InteractionManager 回调中
   * 更新本条记录的状态
   */
  updateRecord = (updateParams, onUpdate = () => null) => {
    const { actions } = this.props;
    const [payload, showAlert] = updateParams;
    actions.recordUpdateAction(payload, showAlert, onUpdate);
  };

  componentWillUnmount() {
    const { actions, navigation } = this.props;
    actions.clearQuery();
    const fromPage = _.get(navigation, 'state.params.navParam.from');
    if (fromPage === 'HomePage') {
      DeviceEventEmitter.emit('BackHomePageEvent');
    } else if (fromPage === 'CalenderPage') {
      DeviceEventEmitter.emit('BackCalenderPageEvent');
    }

    const objectApiName = _.get(navigation, 'state.params.navParam.objectApiName');

    //* 当为顶层详情页时，清除所有级联保存 除开媒体播放
    if (this.isTopLevel && objectApiName !== 'clm_presentation') {
      actions.cascadeDeleteAllData();
    }
  }

  refresh = async (updateData, apiName, callbackType) => {
    const { navigation, actions } = this.props;
    const { callExtenderRefresh } = this.state;
    const key = _.get(navigation, 'state.key');
    const recordType = _.get(this.props, 'screenInfo.recordType');
    const objectApiName = _.get(this.props, 'screenInfo.objectApiName');
    const targetRecordType = _.get(navigation, 'state.params.navParam.record_type') || recordType;
    const targetApiName = _.get(navigation, 'state.params.navParam.objectApiName');

    const userId = _.get(navigation, 'state.params.navParam.id');

    //* 编辑页面保存后，返回record_type
    if (callbackType) {
      const navParam = _.get(navigation, 'state.params.navParam');
      navParam.record_type = callbackType;
    }

    //* 布局请求失败 回调处理
    const _handleforFail = () => {
      toastError(I18n.t('no_layout'));
      actions.deleteNavigationHistory(key);
      navigation.goBack();
    };

    // * 获取布局和数据
    const { detailLayout, detailData } = await DetailService.initDetail({
      objectApiName: targetApiName || objectApiName,
      userId,
      recordType: callbackType || targetRecordType,
      handleforFail: _handleforFail,
    });

    this.setState({ detailLayout, detailData, callExtenderRefresh: !callExtenderRefresh });
  };

  //添加或删除 参与人 后，刷新详情页面
  refreshData = async (startHook, afterHook) => {
    global.tron.log('refreshData enter');
    if (_.isFunction(startHook)) {
      startHook();
    }
    const { navigation } = this.props;

    const objectApiName = _.get(this.props, 'screenInfo.objectApiName');
    const targetApiName = _.get(navigation, 'state.params.navParam.objectApiName');
    const userId = _.get(navigation, 'state.params.navParam.id');

    global.tron.log('refreshData will getDetailData_withoutHeaderLogs ');

    const detailData = await DetailService.getDetailData_withoutHeaderLogs({
      objectApiName: targetApiName || objectApiName,
      userId,
    });
    global.tron.log('refreshData got detailData will setState', detailData);

    this.setState({ detailData });
    if (_.isFunction(afterHook)) {
      afterHook();
    }
    global.tron.log('refreshData will leave');
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    console.logDidUpdateHash(top__filename, this, prevProps, prevState);
    const {
      navigation,
      apiName,
      updateData,
      updateError,
      updateLoading,
      actions: { resetUpdateState, needRefreshAttendee },
    } = this.props;
    const objectApiName = _.get(this.props, 'screenInfo.objectApiName')
      ? _.get(this.props, 'screenInfo.objectApiName')
      : _.get(navigation, 'state.params.navParam.objectApiName');
    const updateCallback = _.get(navigation, 'state.params.updateCallback');

    if (objectApiName === apiName && updateData && !updateError && !updateLoading) {
      needRefreshAttendee(true, apiName);
      updateCallback && updateCallback(updateData);
    }
    // 重置页面内容
    resetUpdateState();
  }

  setModalPopoverVisible = (visible: boolean, callback: Function = () => void 0) => {
    const modalBtnRef = this.modalBtnRef;
    modalBtnRef.wrappedInstance.wrappedInstance.root.measure(
      (x, y, width, height, pageX, pageY) => {
        this.modalRef.setAnchorPosition(
          {
            pageX: pageX + width / 2,
            pageY: pageY + height / 2,
          },
          () => {
            this.modalRef.setModalVisible(visible, callback);
          },
        );
      },
    );
  };

  handleNavigate = (destination: string, param: ?{}, callback: ?() => void) => {
    if (!destination) {
      console.warn('###Navigate destination is invalid');
      return;
    }

    const { navigation } = this.props;

    if (_.isEmpty(param) && _.isEmpty(callback)) {
      navigation.navigate(destination);
      return;
    }

    let navParam = {};
    if (!_.isEmpty(param)) {
      navParam = _.assign({}, navParam, param);
    }

    if (callback && _.isFunction(callback)) {
      _.set(navParam, 'callback', callback);
    }

    navigation.navigate(destination, param);
  };

  handleUpdate = (data) => {
    data && this.setState({ detailData: data });
  };

  createButton = (
    isDisabled: boolean,
    action: any,
    component: any,
    actionCode: string,
    actionLabel: string,
    eventHandler?: (param?: any) => void,
  ) => (
    <Button
      key={actionLabel}
      disabled={isDisabled}
      style={styles.actionButton}
      onPress={() => {
        if (eventHandler) {
          eventHandler(action);
        }
        this.handleAction(actionCode, action, component);
      }}
    >
      <Text
        style={{
          color: themes.primary_button_text_color,
          fontSize: themes.button_font_size,
        }}
      >
        {actionLabel}
      </Text>
    </Button>
  );

  // TODO: maybe confirm is needed
  handleAction = (actionCode: string, action: any, component: any) => {
    const { navigation, permission } = this.props;
    const { detailData } = this.state;
    const renderMode = _.get(action, 'show_render_mode');
    const refObjectApiName = _.get(action, 'ref_obj_describe');
    const relatedListName = _.get(action, 'related_list_name');
    const targetRecordType = _.get(
      action,
      'target_layout_record_type',
      _.get(navigation, 'state.params.navParam.record_type'),
    );
    const parentId = _.get(detailData, _.get(action, 'target_value_field', 'id'));

    const my_product = _.get(detailData, 'my_product', '');

    const parentName = _.get(detailData, 'name');
    const needReturn = _.get(action, 'need_callback', false);

    if (actionCode === 'EDIT') {
      this.editWithConfirm(action);
    } else if (actionCode === 'ADD' && renderMode === 'modal') {
      navigation.navigate('Relation', {
        apiName: _.get(action, 'target_object_api_name'),
        targetRecordType: _.get(action, 'target_layout_record_type'),
        fieldLayout: action,
        detailData,
        related: true,
        callback: this.handleAddSelect(component, action),
      });
    } else if (Privilege.checkAction(actionCode, permission, refObjectApiName)) {
      navigation.navigate('Create', {
        navParam: {
          refObjectApiName,
          relatedListName,
          targetRecordType,
          parentId,
          my_product,
          parentName,
          parentData: detailData,
          needReturn,
        },
        callback: this.handleRelatedAddSelect,
      });
    } else if (actionCode === 'UPDATE') {
      /**
       * check valid_expression
       */
      const valid_result = checkValidExpression({
        layout: action,
        thizRecord: detailData,
      });
      if (_.isNull(valid_result) || _.isEqual(valid_result, true)) {
        this.updateWithConfirm(action);
      } else {
        toastError(valid_result);
      }
    } else if (actionCode === 'SUBMIT_APPROVAL') {
      /**
       * check valid_expression
       */
      const valid_result = checkValidExpression({
        layout: action,
        thizRecord: detailData,
      });
      if (_.isNull(valid_result) || _.isEqual(valid_result, true)) {
        this.submitApprovalWithConfirm(action);
      } else {
        toastError(valid_result);
      }
    } else if (actionCode === 'MODAL_WIDGET') {
      // 打开webview页面
      const { options: actionOptions = {}, label } = action;
      const { params = {} } = actionOptions;
      let { src } = actionOptions;
      if (!src) {
        toastError('外部链接丢失');
        return;
      }

      src = getSrc(src);
      navigation.navigate('WebView', {
        navParam: {
          label,
          external_page_src: `${src}?${QuerComposer.fromObject(
            Object.assign(
              {},
              Util.mapObject(params, {
                thizRecord: detailData,
              }),
              {
                baseURL,
              },
            ),
          )}`,
          showBack: true,
        },
      });
    } else if (actionCode === 'DELETE') {
      const { needConfirm, confirmMessage } = IndexDataParser.parseActionLayout(action);
      if (!needConfirm) {
        this.deleteAction(action);
        return;
      }

      Confirm({
        title: '',
        message: confirmMessage,
        onOK: () => {
          this.deleteAction(action);
        },
      });
    }
  };

  deleteAction = async (action) => {
    const { navigation, token, actions } = this.props;
    const { detailData } = this.state;
    const objectApiName = _.get(navigation, 'state.params.navParam.objectApiName');
    const callback = _.get(navigation, 'state.params.navParam.callback');
    const refObjectApiName = _.get(action, 'ref_obj_describe');

    if (detailData && detailData.id) {
      const deleteObjectApiName = refObjectApiName || objectApiName;
      actions.recordDeleteAction(token, deleteObjectApiName, _.get(detailData, 'id'), () => {
        navigation.goBack();
        callback();
      });

      if (objectApiName == 'call_template_detail') {
        DeviceEventEmitter.emit('DeleteTemplateDetailEvent', { id: _.get(detailData, 'id') });
      }
    }
  };

  relatedAddWithConfirm = (actionLayout: any) => {
    const { needConfirm, confirmMessage } = IndexDataParser.parseActionLayout(actionLayout);

    if (!needConfirm) {
      this.relatedAdd(actionLayout);
      return;
    }

    Confirm({
      title: '',
      message: confirmMessage,
      onOK: () => {
        this.relatedAdd(actionLayout);
      },
    });
  };

  /**
   * 布局自定义action调用方法，不可修改方法名称及参数规则
   */
  relatedADD = (actionLayout: any) => {
    this.relatedAdd(actionLayout);
  };

  relatedAdd = (actionLayout: any) => {
    const { navigation } = this.props;
    const { detailData } = this.state;

    const refObjectApiName = _.get(actionLayout, 'ref_obj_describe');
    const relatedListName = _.get(actionLayout, 'related_list_name');
    const recordType = _.get(actionLayout, 'target_layout_record_type');
    const targetValueField = _.get(actionLayout, 'target_value_field', 'id');

    navigation.navigate('Create', {
      navParam: {
        refObjectApiName,
        recordType,
        relatedListName,
        parentId: _.get(detailData, targetValueField),
        parentName: _.get(detailData, 'name'),
      },
    });
  };

  getApprovalFlow = () => {
    const {
      navigation,
      actions: { getApprovalNode },
      objectDescription,
      screenInfo,
    } = this.props;
    this.handleModalLoading(false);

    const objectApiName =
      _.get(screenInfo, 'objectApiName') ||
      _.get(navigation, 'state.params.navParam.objectApiName');

    const currentDescription = IndexDataParser.getObjectDescByApiName(
      objectApiName,
      objectDescription,
    );

    const enable_approval_flow = _.get(currentDescription, 'enable_approval_flow');
    if (!enable_approval_flow) return;

    const userId = _.get(navigation, 'state.params.navParam.id');

    getApprovalNode({ recordId: userId });
  };

  //* actioncode submit_approval

  callbackApproval = (err) => {
    this.handleModalLoading(false);
    //* 增加callback 审批操作后刷新列表页状态
    const { navigation } = this.props;
    const callback = _.get(navigation, 'state.params.navParam.callback');
    if (_.isEmpty(err)) {
      this.getApprovalFlow();
      this.refresh();
      if (callback && _.isFunction(callback)) {
        callback();
      }
      toastSuccess('操作成功');
    } else {
      console.warn(err);
    }
  };

  submitApproval = (actionLayout) => {
    const {
      actions: { submitApprovalNode },
      navigation,
    } = this.props;
    const objectApiName = _.get(this.props, 'screenInfo.objectApiName');
    const record_id = _.get(navigation, 'state.params.navParam.id');
    const flow_api_name = _.get(actionLayout, 'flow_api_name');
    const payload = {
      flow_api_name,
      record_id,
      record_api_name: objectApiName,
    };
    this.handleModalLoading(true);
    submitApprovalNode(payload, this.callbackApproval);
  };

  submitApprovalWithConfirm = (actionLayout: any) => {
    const { needConfirm, confirmMessage } = IndexDataParser.parseActionLayout(actionLayout);

    if (!needConfirm) {
      this.submitApproval(actionLayout);
      return;
    }

    Confirm({
      title: '',
      message: confirmMessage,
      onOK: () => {
        this.submitApproval(actionLayout);
      },
    });
  };

  editWithConfirm = (actionLayout: any) => {
    const { needConfirm, confirmMessage } = IndexDataParser.parseActionLayout(actionLayout);

    if (!needConfirm) {
      this.editAction(actionLayout);
      return;
    }

    Confirm({
      title: '',
      message: confirmMessage,
      onOK: () => {
        this.editAction(actionLayout);
      },
    });
  };

  editAction = (actionLayout: any) => {
    const { navigation } = this.props;
    const { detailLayout, detailData } = this.state;

    const recordType =
      _.get(actionLayout, 'target_layout_record_type') ||
      _.get(actionLayout, 'record_type') ||
      _.get(navigation, 'state.params.navParam.record_type');

    const objectDescName = _.get(detailLayout, 'object_describe_api_name');

    navigation.navigate('Edit', {
      navParam: {
        objectApiName: objectDescName,
        id: _.get(detailData, 'id'),
        record_type: recordType,
      },
      updateCallback: (updateData, ObejectApiName, callbackType) => {
        this.refresh(updateData, ObejectApiName, callbackType);
      },
    });
  };

  updateWithConfirm = (actionLayout: any) => {
    const { needConfirm, confirmMessage } = IndexDataParser.parseActionLayout(actionLayout);

    if (!needConfirm) {
      this.updateAction(actionLayout);
      return;
    }

    Confirm({
      title: '',
      message: confirmMessage,
      onOK: () => {
        this.updateAction(actionLayout);
      },
    });
  };

  updateAction = (actionLayout: any) => {
    const data = {};
    const {
      actions: { updateDetail },
      token,
      navigation,
    } = this.props;
    const { detailData } = this.state;
    const updateCallback = _.get(navigation, 'state.params.navParam.updataCallback', _.noop);
    const objectDescName = _.get(detailData, 'object_describe_name');
    _.set(data, 'version', _.get(detailData, 'version'));
    _.set(data, 'id', _.get(detailData, 'id'));
    if (_.get(detailData, 'status') !== undefined) {
      _.set(data, 'status', _.get(detailData, 'status'));
    }

    const defaultFieldVal = _.get(actionLayout, 'default_field_val');
    let callbackRecordType;
    if (!_.isEmpty(defaultFieldVal)) {
      _.each(defaultFieldVal, (fieldVal) => {
        const defaultVal = _.get(fieldVal, 'val');
        const defaultField = _.get(fieldVal, 'field');

        //#################Attention############
        if (defaultField === 'record_type') {
          callbackRecordType = defaultVal;
        }
        if (_.get(fieldVal, 'field_type') === 'js') {
          const result = Util.executeExpression(defaultVal, detailData);
          _.set(data, defaultField, result);
        } else {
          _.set(data, defaultField, defaultVal);
        }
      });
    }

    updateDetail(
      token,
      _.get(detailData, 'id'),
      objectDescName,
      data,
      null,
      null,
      null,
      null,
      () => {
        this.refresh(data, objectDescName, callbackRecordType);
        updateCallback();
      },
    );
  };

  //* 用于自定义action，布局配置返回操作
  callBackAction = (actionLayout: any) => {
    const { navigation } = this.props;
    const callback = _.get(navigation, 'state.params.navParam.callback', _.noop);
    callback();
    navigation.goBack();
  };

  handleAddSelect = (component, actionLayout) => (selected) => {
    const { actions } = this.props;

    const { detailData } = this.state;

    const composeSelected = _.map(selected, (item) => {
      const recordFields = {};
      const record_fields = _.get(actionLayout, 'record_fields', []);
      if (!_.isEmpty(record_fields)) {
        const Fields = getRecordFields(record_fields, {}, detailData, item);
        // * 获取action中的record_field并赋值
        _.each(Fields, ({ field, default_value }) => {
          //* __r存在一起带过来
          if (!_.isEmpty(_.get(item, `${field}__r`, {}))) {
            recordFields[`${field}__r`] = _.get(item, `${field}__r`);
          }

          recordFields[field] = default_value;
        });
      }

      const actionRecordType = _.get(actionLayout, 'target_layout_record_type', 'master');

      const selectedRecord = {
        ...recordFields,
        name: item.name,
        customer: item.id,
        record_type: actionRecordType,
        event: detailData && detailData.id,
        is_walkin_attendee: false,
        object_describe_name: _.get(component, 'ref_obj_describe'),
      };

      if (_.get(item, 'parent_id__r.name', false)) {
        _.set(selectedRecord, 'attendee_organization', item.parent_id__r.name);
      }
      if (_.get(item, 'department', false)) {
        _.set(selectedRecord, 'attendee_department', item.department);
      }
      if (_.get(item, 'admin_title', false)) {
        _.set(selectedRecord, 'attendee_title', item.admin_title);
      }
      return selectedRecord;
    });

    const actionParam = {
      objectApiName: _.get(component, 'ref_obj_describe'),
      token: global.FC_CRM_TOKEN,
      data: composeSelected,
      eventId: _.get(this.props.navigation, 'state.params.navParam.id'),
    };
    assert(actionParam.objectApiName);
    assert(actionParam.token);
    assert(actionParam.eventId);
    actions.addAttendee(actionParam);
  };

  handleRelatedAddSelect = ({ selected, apiName }: { selected: any, apiName: string }) => {
    this.props.actions.needRefreshAttendee(true, apiName);
  };

  /**
   * 调用自定义action接口
   */
  onCallCustomAction = (actionLayout) => {
    const { detailData } = this.state;
    const { objectDescription, screenInfo, navigation } = this.props;
    const needConfirm = _.get(actionLayout, 'need_confirm', false);
    const confirmMessage = _.get(actionLayout, 'confirm_message');

    if (needConfirm) {
      Confirm({
        title: confirmMessage || '确定执行?',
        onOK() {
          DetailCustomerAction.callCustomerAction({
            actionLayout,
            // objectDescription,
            screenInfo,
            navigation,
            detailData,
            callBackAction: this.callBackAction,
            deleteAction: this.deleteAction,
            editAction: this.editAction,
            refreshDetail: this.refresh,
          });
        },
        onCancel() {},
      });
    } else {
      DetailCustomerAction.callCustomerAction({
        actionLayout,
        // objectDescription,
        screenInfo,
        navigation,
        detailData,
        callBackAction: this.callBackAction,
        deleteAction: this.deleteAction,
        editAction: this.editAction,
        refreshDetail: this.refresh,
      });
    }
  };

  checkDetailScrollTabs = (components) =>
    _.filter(components, (com) => !_.get(com, 'show_in_phone_detail', false));

  renderFancyHeader = () => {
    global.tron.log('renderFancyHeader', this.props, this.state);
    const { navigation, objectDescription, screenInfo } = this.props;
    const objectApiName =
      _.get(screenInfo, 'objectApiName') ||
      _.get(navigation, 'state.params.navParam.objectApiName');
    const currentObjDes = IndexDataParser.getObjectDescByApiName(objectApiName, objectDescription);

    const layout = _.get(this.state, 'detailLayout');

    const components = _.filter(_.get(layout, 'containers[0].components'), (o) =>
      o.hidden_devices ? !o.hidden_devices.includes('cellphone') : o,
    );

    if (_.get(components, '[0].type') === 'phone_detail_header') {
      const componentLayout = components.shift();
      return (
        <DetailFancyHeader
          detailData={this.state.detailData}
          componentLayout={componentLayout}
          objectDescription={objectDescription}
          objectApiName={objectApiName}
          currentObjDes={currentObjDes}
        />
      );
    }
    return null;
  };

  /**
   * layout: detailLayout object.
   */
  renderComponents = (layout: any) => {
    const { callExtenderRefresh } = this.state;
    const {
      token,
      objectDescription,
      permission,
      navigation,
      dispatch,
      screen,
      approvalFlowInfo,
    } = this.props;
    const recordType = _.get(layout, 'record_type') || _.get(this.props, 'screenInfo.recordType');
    const objectApiName = _.get(this.props, 'screenInfo.objectApiName');
    const detailData = _.get(this.state, STATE_DETAIL_DATA);

    if (_.isEmpty(detailData)) {
      return <LoadingScreen />;
    }

    let components = _.filter(_.get(layout, 'containers[0].components'), (o) =>
      o.hidden_devices ? !o.hidden_devices.includes('cellphone') : o,
    );

    components = getComponentsWithoutFancyHeader(components);

    const objectDescribeApiName = _.get(layout, 'object_describe_api_name');

    if (this.checkDetailScrollTabs(components).length > 1) {
      const detailTabs = [];
      _.each(components, (com) => {
        if (com.type && com.type === 'detail_form') {
          const sections = _.get(com, 'field_sections', []);
          if (sections.length > 0) {
            _.each(sections, (section) => {
              const refs = _.get(section, 'related_refs', []);
              if (refs.length > 0) {
                _.each(refs, (ref) => {
                  detailTabs.push(ref);
                });
              }
            });
          }
        }
      });

      return (
        <ScrollableTabView
          removeClippedSubviews
          initialPage={0}
          {...scrollableTabView_styles}
          renderTabBar={() => <ScrollableTabBar />}
          locked
          onChangeTab={(changed, refElement, fromTab) => {
            const index = changed.i;
            if (this.tabs[index]) {
              this.props.actions.updateNavigationHistory({
                tab: {
                  index,
                  onRefresh: this.tabs[index].onRefresh,
                },
              });
            }
          }}
        >
          {_.map(components, (com, index) => {
            const defaultTitle: string = com.header || com.component_name;
            const title = I18n.t(_.get(com, ['header.i18n_key']), { defaultValue: defaultTitle });

            if (com.type && com.type === 'detail_form') {
              return (
                <InnerUserInfoView
                  key={title}
                  navigation={navigation}
                  tabLabel={title}
                  token={token}
                  fromRecordType={this.fromRecordType}
                  layout={com}
                  detailData={detailData}
                  recordData={detailData}
                  apiName={objectApiName}
                  recordType={recordType}
                  param={navigation.state.params.navParam}
                  desc={objectDescription}
                  permission={permission}
                  pageType="detail"
                  pageTypeLevel="main"
                  isTopLevel={this.isTopLevel}
                  objectDescribeApiName={objectDescribeApiName}
                  handleAddMedia={this.handleAddMedia}
                  components={components}
                  detailLayout={layout}
                  dispatch={dispatch}
                  screen={screen}
                  callExtenderRefresh={callExtenderRefresh}
                  approvalFlowInfo={approvalFlowInfo}
                  refreshData={this.refreshData}
                />
              );
            }
            const relatedListName = _.get(com, 'related_list_name');
            let is_show = true;
            if (detailTabs.length > 0 && relatedListName) {
              detailTabs.forEach((ref) => {
                if (ref.ref == relatedListName) {
                  is_show = false;
                }
              });
            }

            if (is_show) {
              return (
                <InnerDetailView
                  key={title}
                  navigation={navigation}
                  tabLabel={title}
                  layout={com}
                  apiName={objectApiName}
                  recordType={recordType}
                  parentData={detailData}
                  recordData={detailData}
                  param={navigation.state.params.navParam}
                  desc={objectDescription}
                  permission={permission}
                  pageType="detail"
                  pageTypeLevel="main"
                  isTopLevel={this.isTopLevel}
                  handleNav={this.handleNavigate}
                  objectDescribeApiName={objectDescribeApiName}
                  handleAddMedia={this.handleAddMedia}
                  onComponentDidMount={(onRefresh) => {
                    this.tabs[index] = {
                      onRefresh,
                    };
                  }}
                />
              );
            }
          })}
        </ScrollableTabView>
      );
    } else {
      if (components[0].type && components[0].type === 'detail_form') {
        return (
          <InnerUserInfoView
            layout={components[0]}
            navigation={navigation}
            apiName={objectApiName}
            detailData={detailData}
            recordType={recordType}
            param={navigation.state.params.navParam}
            desc={objectDescription}
            fromRecordType={this.fromRecordType}
            pageType="detail"
            pageTypeLevel="main"
            isTopLevel={this.isTopLevel}
            permission={permission}
            recordData={detailData}
            objectDescribeApiName={objectDescribeApiName}
            handleAddMedia={this.handleAddMedia}
            components={components}
            detailLayout={layout}
            approvalFlowInfo={approvalFlowInfo}
            callExtenderRefresh={callExtenderRefresh}
            refreshData={this.refreshData}
          />
        );
      }
      return (
        <InnerDetailView
          layout={components[0]}
          navigation={navigation}
          apiName={objectApiName}
          recordData={detailData}
          recordType={recordType}
          parentData={detailData}
          pageType="detail"
          pageTypeLevel="main"
          isTopLevel={this.isTopLevel}
          param={navigation.state.params.navParam}
          desc={objectDescription}
          permission={permission}
          handleNav={this.handleNavigate}
          objectDescribeApiName={objectDescribeApiName}
          handleAddMedia={this.handleAddMedia}
        />
      );
    }
  };

  handleCancleApproval = (flow_id) => (comments) => {
    const {
      actions: { cancelApproval },
    } = this.props;
    const payload = {
      flow_id,
      comments,
    };
    this.handleModalLoading(true);
    cancelApproval(payload, this.callbackApproval);
  };

  //* 处理提交结果
  handleNodeOperationApproval = (node_id, operation) => (comments) => {
    const {
      actions: { nodeOperation },
      navigation,
    } = this.props;
    const callback = _.get(navigation, 'state.params.navParam.callback');
    const payload = {
      node_id,
      ...comments,
      operation,
    };
    this.handleModalLoading(true);
    nodeOperation(payload, (err) => {
      this.handleModalLoading(false);
      if (_.isEmpty(err)) {
        this.getApprovalFlow();
        this.refresh();
        if (callback && _.isFunction(callback)) {
          callback();
        }
        toastSuccess('操作成功');
      }
    });
  };

  createApprovalBtn = (status, label, node_id) => {
    const { approvalFlowInfo } = this.props;
    const approval_flow = _.get(approvalFlowInfo, 'approval_flow');
    const flow_id = _.get(approval_flow, 'id');

    let pressHandler;
    let buttonMeta = {
      isDisabled: false,
      action: status,
      label,
    };
    const approvalComments = this.approvalComments(_.get(this.getOperationNode(), 'key', ''));

    if (status === 'cancel_approval') {
      pressHandler = () => {
        this.handleApprovalCancelBtn('撤回', this.handleCancleApproval(flow_id));
      };
    } else if (status === 'agree_approval') {
      pressHandler = () => {
        this.handleApprovalCancelBtn(
          '同意',
          this.handleNodeOperationApproval(node_id, 'agree'),
          _.get(approvalComments, 'agree'),
        );
      };
    } else if (status === 'reject_approval') {
      pressHandler = () => {
        this.handleApprovalCancelBtn(
          '拒绝',
          this.handleNodeOperationApproval(node_id, 'reject'),
          _.get(approvalComments, 'reject'),
        );
      };
    }

    buttonMeta = Object.assign({}, buttonMeta, {
      pressHandler,
    });

    return buttonMeta;
  };

  handleApprovalCancelBtn = (title, callback, approvalContent) => {
    const { navigation, token } = this.props;
    if (!approvalContent) {
      approvalContent = [
        {
          field: 'comments',
          render_type: 'long_text',
        },
      ];
    }
    navigation.navigate('Approval', {
      title,
      approvalContent,
      token,
      handleSubmit: callback,
    });
  };

  getOperationNode = () => {
    const { approvalFlowInfo } = this.props;
    const approval_nodes = _.get(approvalFlowInfo, 'approval_nodes');
    const operationNode = approval_nodes.find(
      (x) =>
        x.type === 'user_task' &&
        (x.status === 'waiting' || x.status === 'accepted') &&
        // 当前用户是operator或candidate_operators之一
        (x.operator === _.toNumber(global.FC_CRM_USERID) ||
          (x.candidate_operators || []).indexOf(_.toNumber(global.FC_CRM_USERID)) >= 0),
    );
    return operationNode;
  };

  approvalComments = (key) => {
    const { approvalFlowInfo = {} } = this.props;
    const { approval_flow } = approvalFlowInfo;
    const flow_definition = JSON.parse(_.get(approval_flow, 'flow_definition', '{}'));
    const approvalComments = _.get(flow_definition, `nodes.${key}.approval_comments_contents`);
    return approvalComments;
  };

  //* 增加审批流按钮
  setApprovalButton = () => {
    const approvalButtonList = [];
    const { approvalFlowInfo } = this.props;
    const approval_flow = _.get(approvalFlowInfo, 'approval_flow');
    const approval_nodes = _.get(approvalFlowInfo, 'approval_nodes');
    if (_.isEmpty(approval_flow)) return approvalButtonList;
    const showCancelBtn =
      _.get(approval_flow, 'status') === 'in_progress' &&
      _.get(approval_flow, 'submitter') === _.toNumber(global.FC_CRM_USERID);
    if (showCancelBtn) {
      approvalButtonList.push(this.createApprovalBtn('cancel_approval', '撤回'));
    }
    //* 同意按钮
    const operationNode = this.getOperationNode();
    if (operationNode) {
      approvalButtonList.push(
        this.createApprovalBtn('agree_approval', '同意', _.get(operationNode, 'id')),
      );
      approvalButtonList.push(
        this.createApprovalBtn('reject_approval', '拒绝', _.get(operationNode, 'id')),
      );
    }
    return approvalButtonList;
  };

  craftButtonList = (component: any, objectDescribeApiName: string, elementOrMeta = 1) => {
    if (_.isEmpty(component)) {
      console.warn('component layout is invalid');
      return;
    }

    const { navigation } = this.props;
    const componentType = _.get(component, 'type');
    const actionList = _.filter(
      _.get(component, 'actions'),
      (action) =>
        componentType === 'related_list' ||
        _.indexOf(_.get(action, 'show_when'), ACTION_DETAIL) >= 0,
    );
    const { permission } = this.props;
    const { detailData = {} } = this.state;

    const buttonList = [];

    _.each(actionList, (action) => {
      const disableFun = _.get(action, 'disabled_expression', 'return false');
      const parentData =
        componentType === 'related_list'
          ? detailData
          : detailData.parentData
          ? detailData.parentData
          : _.get(navigation, 'state.params.navParam.parentData');

      const isDisabled = Util.executeDetailExp(disableFun, detailData, parentData);
      const hiddenFun = _.get(action, 'hidden_expression', 'return false');
      let isHidden = Util.executeDetailExp(hiddenFun, detailData, parentData);

      const hidden_devices = _.get(action, 'hidden_devices', []);
      _.each(hidden_devices, (hidden) => {
        if (hidden === 'cellphone') {
          isHidden = true;
        }
      });
      if (isHidden) {
        return;
      }

      const actionCode = _.toUpper(_.get(action, 'action'));
      const actionLabel = _.get(action, 'label');
      const actionRefObjectApiName = _.get(action, 'ref_obj_describe', objectDescribeApiName);

      const buttonMeta = {
        isDisabled,
        action,
        actionCode,
        icon: _.get(action, 'icon'),
        actionLabel,
        label: actionLabel,
      };

      if (
        Privilege.checkAction(actionCode, permission, actionRefObjectApiName) ||
        ['RELATEDCOLLECT', 'RESURVEY', 'SUBMIT_APPROVAL', 'MODAL_WIDGET'].includes(actionCode)
      ) {
        buttonList.push({
          ...buttonMeta,
          eventHandler: () => console.warn(`### ${actionCode} clicked`),
        });
      } else if (actionCode === 'CALLBACK') {
        // TODO: Does this needed? Return to last page?
      } else {
        /**
         * 自定义action
         */
        const { is_custom = false } = action;
        if (is_custom) {
          buttonList.push(
            Object.assign({}, buttonMeta, {
              eventHandler: () => {
                console.warn('### custom action button clicked');
                this.onCallCustomAction(action);
              },
            }),
          );
        }
      }
    });

    if (_.isEmpty(buttonList)) {
      return null;
    }
    if (elementOrMeta === 1) {
      return buttonList.map((item: Object) => {
        const { isDisabled, action, actionCode, actionLabel, eventHandler = () => {} } = item;
        return this.createButton(
          isDisabled,
          action,
          component,
          actionCode,
          actionLabel,
          eventHandler,
        );
      });
    }

    return buttonList.map((item: Object) =>
      Object.assign({}, item, {
        pressHandler: () => {
          const { eventHandler, action, actionCode } = item;
          if (_.isFunction(eventHandler)) {
            eventHandler(action);
          }
          this.handleAction(actionCode, action, component);
        },
      }),
    );
  };

  renderContent = () => {
    const detailLayout = _.get(this.state, 'detailLayout');
    const detailData = _.get(this.state, STATE_DETAIL_DATA);
    if (_.isEmpty(detailLayout) || _.isEmpty(detailData)) {
      return <LoadingScreen />;
    }
    const { permission, navigation } = this.props;

    if (!Privilege.checkObject(permission, _.get(detailLayout, 'object_describe_api_name'), 3)) {
      return (
        <WarningScreen
          callback={() => navigation.goBack('Index')}
          content={I18n.t('object_previlage_no')}
        />
      );
    }

    return this.renderComponents(detailLayout);
  };

  renderHeaderRightButtons = () => [
    <Button
      transparent
      key="rightbtn"
      onPress={() => {
        this.setModalPopoverVisible(true);
      }}
    >
      <Icon
        style={{ color: themes.title_icon_color }}
        name="ios-more"
        ref={(el) => (this.modalBtnRef = el)}
      />
    </Button>,
  ];

  getPopoverActions = () => {
    const { detailLayout } = this.state;

    if (detailLayout) {
      const { object_describe_api_name } = detailLayout;
      const components = _.get(detailLayout, 'containers[0].components');
      const layout = _.get(detailLayout, 'containers[0].components[0]');

      if (_.isEmpty(components)) return;

      const field_sections = _.get(layout, 'field_sections');
      const expactComp = [];
      _.each(field_sections, (section) => {
        if (section.related_refs) {
          _.each(section.related_refs, (refObj) => {
            expactComp.push(refObj.ref);
          });
        }
      });
      let buttonList = [];
      components.forEach((component) => {
        let canUse = false;

        //* 相关列表内容和操作显示在详情页，则隐藏按钮
        if (_.get(component, 'show_in_phone_detail', false)) {
          canUse = true;
        }

        if (component.related_list_name) {
          _.each(expactComp, (exp) => {
            if (exp == component.related_list_name) {
              canUse = true;
            }
          });
        }

        if (!canUse) {
          const buttons = this.craftButtonList(component, object_describe_api_name, 2);
          if (buttons) {
            buttonList.push(...buttons);
          }
        }
      });
      //* 增加审批流按钮
      const approvalFlowButtonList = this.setApprovalButton();
      if (!_.isEmpty(approvalFlowButtonList)) {
        buttonList = _.concat([], approvalFlowButtonList, buttonList);
      }
      return buttonList;
    }
    return null;
  };

  handleModalLoading = (visible: boolean) => {
    const { modalLoadingVisible } = this.state;
    if (modalLoadingVisible !== visible) {
      this.setState({ modalLoadingVisible: visible });
    }
  };

  renderHeader() {
    const detailLayout = _.get(this.state, 'detailLayout');
    const { navigation, dispatch, screen } = this.props;
    const addActions = this.getPopoverActions();
    const noBorderStyle = {
      borderBottomWidth: 0,
      borderWidth: 0,
    };
    return (
      <StyledHeader style={noBorderStyle}>
        <HeaderLeft navigation={navigation} dispatch={dispatch} screen={screen} />
        <StyledBody>
          <Title
            style={{
              color: themes.title_text_color,
              fontSize: themes.title_size,
            }}
          >
            {I18n.t_layout_headerTitle(detailLayout, I18n.t('detail'))}
          </Title>
        </StyledBody>
        <HeaderRight>
          {addActions && addActions.length > 0 ? this.renderHeaderRightButtons() : null}
        </HeaderRight>
      </StyledHeader>
    );
  }

  render() {
    console.logRenderHash(top__filename, this);
    const { navigation } = this.props;
    const { modalLoadingVisible } = this.state;
    const addActions = this.getPopoverActions();

    return (
      <StyledContainer style={{ backgroundColor: themes.fill_base }}>
        {this.renderHeader()}
        {this.renderFancyHeader()}
        {this.renderContent()}
        <ModalPopoverScreen
          ref={(el) => (this.modalRef = el)}
          addActions={addActions}
          navigation={navigation}
        />
        <ModalLoadingScreen
          visibleStatus={modalLoadingVisible}
          handleModalLoading={this.handleModalLoading}
        />
      </StyledContainer>
    );
  }
}

const select = (state, screen) => {
  const query = getQueryInitialState({ state, screen });
  const key = _.get(screen, 'navigation.state.key');
  const approvalFlowInfo = _.get(state, `approvalFlow[${key}]`, initState.approvalFlow);
  return {
    token: state.settings.token,
    permission: state.settings.permission,
    objectDescription: state.settings.objectDescription,
    profile: state.settings.profile,

    approvalFlowInfo,

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
        userInfoAction,
        addAttendee,
        addWalkinAttendeeSuccess,
        needRefreshAttendee,
        cascadeDeleteAllData,
        recordDeleteAction,
        deleteNavigationHistory,
        updateDetail: updateDetail(key),
        resetUpdateState: resetUpdateState(key),
        clearQuery: clearQuery(key),
        getApprovalNode: getApprovalNodesByRecordId(key),
        submitApprovalNode: submitApproval(key),
        cancelApproval: cancelApproval(key),
        nodeOperation: nodeOperation(key),
        updateNavigationHistory,
        recordUpdateAction,
      },
      dispatch,
    ),
    dispatch,
  };
};

export default connect(select, act)(DetailScreen);
