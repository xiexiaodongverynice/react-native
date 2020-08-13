/**
 * Created by Uncle Charlie, 2017/12/11
 * @flow
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableWithoutFeedback,
  DeviceEventEmitter,
} from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Privilege from 'fc-common-lib/privilege';
/*  eslint-disable */
import prompt from 'react-native-prompt-android';
/*  eslint-disable */
import _ from 'lodash';
import { Body, Button, Container, Header, Icon, Right, Title } from 'native-base';
import ScrollableTabView, { ScrollableTabBar } from 'react-native-scrollable-tab-view';
import QueryComposer from 'fc-common-lib/query-composer';
import DetailService from '../../services/detailService';
import requestLayout from '../../actions/pageLayout';
import userInfoAction from '../../actions/userBasicInfo';
import { updateDetail, resetUpdateState, clearQuery } from '../../actions/query';
import LoadingScreen from '../common/LoadingScreen';
import I18n from '../../i18n';
import InnerDetailView from '../common/InnerDetailView';
import InnerUserInfoView from '../common/InnerViews/InnerUserInfoView';
import WarningScreen from '../../components/hintView/WarningScreen';
import * as Util from '../../utils/util';
import Common from '../../utils/constants';
import LayoutService from '../../services/layoutService';
import HttpRequest from '../../services/httpRequest';
import { addAttendee, addWalkinAttendeeSuccess, needRefreshAttendee } from '../../actions/event';
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
import { toastSuccess, toastWaring, toastError, toastDefault } from '../../utils/toast';
import RecordService from '../../services/recordService';
import ModalPopoverScreen from '../../tabs/common/ModalPopoverScreen';

import styles from '../common/screenStyle';
import { getQueryInitialState } from '../common/helpers/QueryHelper';
import { updateNavigationHistory } from '../../actions/navigation';
import CustomActionService from '../../services/customActionService';
import AStorage from '../../utils/asStorage';
import { checkValidExpression, getCustomActionCallbacks } from '../common/helpers/recordHelper';
import initState from '../../reducers/state';
import ModalLoadingScreen from '../../components/modal/ModalLoadingScreen';
import { baseURL } from '../../utils/config';
import { getSrc } from '../common/helpers/modalWidget';

type Prop = {
  token: string,
  screenInfo: ScreenInfo,
  permission: any,
  apiName: string,
  cascadeData: any,
  objectDescription: any,
  navigation: any,
  detailLayout: any,
  dispatch: void,
  screen: any,
  detailData: object,
  approvalFlowInfo: {
    approval_nodes: ?Array,
    approval_flow: ?object,
  }, //* 审批流信息
  actions: {
    getApprovalNode: void, //* 获取审批流信息
    submitApprovalNode: void, //* 提交审批
    cancelApproval: void, //* 撤回审批
    nodeOperation: void,
  },
};

type State = {
  detailLayout: Layout,
  callExtenderRefresh: boolean,
  modalLoadingVisible: boolean, //* modalloading
};

const ACTION_DETAIL = 'detail';

/*
 Detail Screen
 TODO: use state for detail data
 */
class DetailModalScreen extends React.Component<Prop, State> {
  constructor(props) {
    super(props);
    this.state = { callExtenderRefresh: false, modalLoadingVisible: false };
  }
  modalRef: ModalPopoverScreen;

  tabs: Object = {};

  async componentDidMount() {
    // const { onComponentDidMount } = this.props;
    // if (_.isFunction(onComponentDidMount)) {
    //   onComponentDidMount(this.refresh);
    // }
    // this.getApprovalFlow();

    await this.refresh();
  }

  refresh = async (updateData, apiName, callbackType) => {
    const { navigation, cascadeData } = this.props;
    const { callExtenderRefresh } = this.state;
    const navigateParams = _.get(navigation, 'state.params.navParam', {});

    const recordType = _.get(navigateParams, 'record_type', 'master');
    const objectApiName = _.get(navigateParams, 'objectApiName');

    const layoutResult = await DetailService.getDetailLayout({ objectApiName, recordType });

    //* 布局请求失败 回调处理
    if (!layoutResult) {
      toastError(I18n.t('no_layout'));
      navigation.goBack();
      return;
    }

    this.setState({
      detailLayout: layoutResult,
      callExtenderRefresh: !callExtenderRefresh,
    });
  };

  setModalPopoverVisible = (visible: boolean, callback: Function = () => void 0) => {
    const { apiName, screenInfo = {}, navigation } = this.props;
    const theApi = _.get(navigation, 'state.params.navParam.objectApiName');

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
  handleAction = async (actionCode: string, action: any, component: any) => {
    const { navigation, token, objectDescription, permission } = this.props;
    const { detailData } = this.props;
    const objectApiName = _.get(navigation, 'state.params.navParam.objectApiName');
    const { parentData = _.get(navigation, 'state.params.navParam.parentData') } = detailData;
    const renderMode = _.get(action, 'show_render_mode');
    const refObjectApiName = _.get(action, 'ref_obj_describe');
    const relatedListName = _.get(action, 'related_list_name');
    const targetRecordType = _.get(
      action,
      'target_layout_record_type',
      _.get(navigation, 'state.params.navParam.record_type'),
    );
    const parentId = _.get(detailData, _.get(action, 'target_value_field', 'id'));
    const buttonShowWhere = _.get(action, 'show_where', ['head', 'bottom']);
    const disabledFun = _.get(action, 'disabled_expression', 'return false');
    const disabledValidResult = Util.executeDetailExp(disabledFun, detailData, parentData);
    const hiddenFun = _.get(action, 'hidden_expression', 'return false');
    const hiddenValidResult = Util.executeDetailExp(hiddenFun, detailData, parentData);
    const my_product = _.get(detailData, 'my_product', '');

    const parentName = _.get(detailData, 'name');
    const needReturn = _.get(action, 'need_callback', false);

    if (actionCode === 'EDIT') {
      this.editWithConfirm(action);
    } else if (Privilege.checkAction(actionCode, permission, refObjectApiName, 1)) {
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
      const { options: actionOptions } = action;
      const { params = {} } = actionOptions;
      let { src } = actionOptions;
      src = getSrc(src);
      navigation.navigate('WebView', {
        navParam: {
          external_page_src: `${src}?${QueryComposer.fromObject(
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

  // deleteAction = async (action) => {
  //   const { navigation, token, detailData } = this.props;
  //   const objectApiName = _.get(navigation, 'state.params.navParam.objectApiName');
  //   const refObjectApiName = _.get(action, 'ref_obj_describe');
  //   const actionCode = _.get(action, 'action');
  //   const fromPage = _.get(navigation, 'state.params.navParam.from');
  //   const fromPageType = _.get(navigation, 'state.params.navParam.fromPageType');
  //   let isOnlineHandler = true;
  //   // if (fromPage === 'RelatedCalender' && fromPageType === 'edit') {
  //   //   isOnlineHandler = false;
  //   // }
  //   if (detailData && detailData.id && isOnlineHandler) {
  //     const data = await RecordService.deleteRecord({
  //       token,
  //       objectApiName: refObjectApiName || objectApiName,
  //       id: _.get(detailData, 'id'),
  //     });

  //     if (objectApiName == 'call_template_detail') {
  //       DeviceEventEmitter.emit('DeleteTemplateDetailEvent', { id: _.get(detailData, 'id') });
  //       navigation.goBack();
  //     } else {
  //       DeviceEventEmitter.emit('RefreshIndexList', { id: _.get(detailData, 'id') });
  //       navigation.goBack();
  //     }
  //   } else {
  //     if (objectApiName == 'call_template_detail') {
  //       DeviceEventEmitter.emit('DeleteTemplateDetailEvent', { id: _.get(detailData, 'id') });
  //       navigation.goBack();
  //     } else {
  //       DeviceEventEmitter.emit('RefreshIndexList', { id: _.get(detailData, 'id') });
  //       // AStorage.get('CalenderFakeDataDeleteList').then((res) => {
  //       //   let deleteList = res;
  //       //   if (!res) {
  //       //     deleteList = [];
  //       //   }
  //       //   deleteList.push(detailData);
  //       // });
  //       // AStorage.get('CalenderFakeData').then((res) => {
  //       //   if (res) {
  //       //     _.each(res, (rst, index) => {
  //       //       if (rst && detailData && rst.fakeId === detailData.fakeId) {
  //       //         res.splice(index, 1);
  //       //       }
  //       //     });
  //       //   }
  //       //   AStorage.save('CalenderFakeData', res).then(() => {
  //       //     navigation.goBack();
  //       //   });
  //       // });
  //     }
  //   }
  // };

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
    const { navigation, detailData } = this.props;
    const { detailLayout } = this.state;
    const actionCode = _.get(actionLayout, 'action_code');
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
    // const fakeData = _.get(navigation, 'state.params.navParam.fakeData');
    const userId = _.get(navigation, 'state.params.navParam.id');
    // ? _.get(navigation, 'state.params.navParam.id')
    // : fakeData && fakeData.id;

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
    const { navigation, apiName, detailData } = this.props;
    const { detailLayout } = this.state;
    const navigateParams = _.get(navigation, 'state.params.navParam', {});

    const key = _.get(navigation, 'state.key');
    const recordType =
      _.get(actionLayout, 'target_layout_record_type') ||
      _.get(actionLayout, 'record_type') ||
      _.get(navigation, 'state.params.navParam.record_type');
    const from = _.get(navigation, 'state.params.navParam.from');
    const objectDescName = _.get(navigateParams, 'objectApiName');

    navigation.navigate('EditModal', {
      navParam: navigateParams,
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
    } = this.props;
    const { detailData } = this.props;

    const objectDescName = _.get(detailData, 'object_describe_name');
    _.set(data, 'version', _.get(detailData, 'version'));
    _.set(data, 'id', _.get(detailData, 'id'));
    if (_.get(detailData, 'status') !== undefined) {
      _.set(data, 'status', _.get(detailData, 'status'));
    }

    const defaultFieldVal = _.get(actionLayout, 'default_field_val');
    let callbackRecordType = undefined;
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

    const callback = updateDetail(
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
      },
    );
  };

  callBackAction = (actionLayout: any) => {
    const { detailLayout, detailData, navigation, actions } = this.props;
    const recordType =
      _.get(actionLayout, 'target_layout_record_type') || _.get(actionLayout, 'record_type');
    const objectDescApiName = _.get(detailLayout, 'object_describe_api_name');
    navigation.goBack();
  };

  handleAddSelect = async ({ selected, apiName }: { selected: any }) => {
    const { token, actions } = this.props;

    actions.addAttendee({
      objectApiName: apiName,
      token,
      data: selected,
    });
  };

  handleRelatedAddSelect = ({ selected, apiName }: { selected: any, apiName: string }) => {
    const { actions } = this.props;
    actions.needRefreshAttendee(true, apiName);
  };

  /**
   * 调用自定义action接口
   */
  onCallCustomAction = (actionLayout) => {
    const needConfirm = _.get(actionLayout, 'need_confirm', false);
    const confirmMessage = _.get(actionLayout, 'confirm_message');
    const { detailData } = this.props;

    const _callCustomAction = async () => {
      const { objectDescription, screenInfo, token, navigation } = this.props;
      const {
        state: {
          params: { navParam },
        },
      } = navigation;

      const objectApiName =
        _.get(navParam, 'objectApiName') ||
        _.get(navParam, 'object_describe_api_name') ||
        _.get(screenInfo, 'objectApiName');

      // const objectDescribe = _.chain(objectDescription)
      //   .get('items')
      //   .find({
      //     api_name: objectApiName,
      //   })
      //   .value();

      const response = await CustomActionService.post({
        objectApiName,
        actionLayout,
        ids: [_.get(detailData, 'id')],
        // describe: objectDescribe,
        token,
      });
      /**
       * 接口回调
       */
      const { onSuccess } = getCustomActionCallbacks({
        action: actionLayout,
      });
      if (response) {
        new Function('__web__', '__phone__', '__pad__', onSuccess)(
          null,
          {
            thiz: this,
            actionLayout,
            message: {
              success: toastSuccess,
              error: toastError,
              warning: toastWaring,
              default: toastDefault,
            },
          },
          null,
        );
      }
    };
    if (needConfirm) {
      Confirm({
        title: confirmMessage || '确定执行?',
        onOk() {
          _callCustomAction();
        },
        onCancel() {
          // console.log('Cancel');
        },
      });
    } else {
      _callCustomAction();
    }
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
      actions,
      approvalFlowInfo,
    } = this.props;
    const recordType = _.get(layout, 'record_type') || _.get(this.props, 'screenInfo.recordType');
    const objectApiName = _.get(this.props, 'screenInfo.objectApiName');
    const detailData = _.get(this.props, 'detailData');

    if (_.isEmpty(detailData)) {
      return <LoadingScreen />;
    }

    const components = _.get(layout, 'containers[0].components');
    const objectDescribeApiName = _.get(layout, 'object_describe_api_name');

    if (components.length > 1) {
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
          tabBarActiveTextColor={themes.fill_base_color}
          tabBarUnderlineStyle={{ backgroundColor: themes.fill_base_color }}
          renderTabBar={() => <ScrollableTabBar />}
          locked
          onChangeTab={(changed, refElement, fromTab) => {
            const index = changed.i;
            if (this.tabs[index]) {
              actions.updateNavigationHistory({
                tab: {
                  index,
                  onRefresh: this.tabs[index].onRefresh,
                },
              });
            }
          }}
        >
          {_.map(components, (com, index) => {
            const title: string = com.header || com.component_name;

            if (
              _.get(com, 'hidden_devices') &&
              _.get(com, 'hidden_devices').indexOf('cellphone') > 0
            ) {
              return null;
            }

            if (com.type && com.type === 'detail_form') {
              return (
                <InnerUserInfoView
                  key={title}
                  navigation={navigation}
                  tabLabel={title}
                  token={token}
                  layout={com}
                  detailData={detailData}
                  recordData={detailData}
                  apiName={objectApiName}
                  recordType={recordType}
                  param={navigation.state.params.navParam}
                  desc={objectDescription}
                  permission={permission}
                  pageType="detail"
                  pageTypeLevel="sub"
                  objectDescribeApiName={objectDescribeApiName}
                  handleAddMedia={this.handleAddMedia}
                  components={components}
                  dispatch={dispatch}
                  screen={screen}
                  callExtenderRefresh={callExtenderRefresh}
                  approvalFlowInfo={approvalFlowInfo}
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
                  pageTypeLevel="sub"
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
            permission={permission}
            pageType="detail"
            pageTypeLevel="sub"
            recordData={detailData}
            objectDescribeApiName={objectDescribeApiName}
            handleAddMedia={this.handleAddMedia}
            components={components}
            approvalFlowInfo={approvalFlowInfo}
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
          pageTypeLevel="sub"
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

  handleNodeOperationApproval = (node_id, operation) => (comments) => {
    const {
      actions: { nodeOperation },
      navigation,
    } = this.props;
    const callback = _.get(navigation, 'state.params.navParam.callback');
    const payload = {
      node_id,
      comments,
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
    if (status === 'cancel_approval') {
      pressHandler = () => {
        this.handleApprovalCancelBtn('撤回原因', this.handleCancleApproval(flow_id));
      };
    } else if (status === 'agree_approval') {
      pressHandler = () => {
        this.handleApprovalCancelBtn(
          '审批意见',
          this.handleNodeOperationApproval(node_id, 'agree'),
        );
      };
    } else if (status === 'reject_approval') {
      pressHandler = () => {
        this.handleApprovalCancelBtn(
          '审批意见',
          this.handleNodeOperationApproval(node_id, 'reject'),
        );
      };
    }

    buttonMeta = Object.assign({}, buttonMeta, {
      pressHandler,
    });

    return buttonMeta;
  };

  handleApprovalCancelBtn = (title, callback) => {
    prompt(
      title,
      '',
      [
        { text: '取消', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
        {
          text: '确定',
          onPress: (password) => {
            callback(password);
          },
        },
      ],
      {
        cancelable: false,
        placeholder: I18n.t('Input.Enter'),
      },
    );
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
    const operationNode = approval_nodes.find(
      (x) =>
        x.type === 'user_task' &&
        (x.status === 'waiting' || x.status === 'accepted') &&
        // 当前用户是operator或candidate_operators之一
        (x.operator === _.toNumber(global.FC_CRM_USERID) ||
          (x.candidate_operators || []).indexOf(_.toNumber(global.FC_CRM_USERID)) >= 0),
    );
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
    const { detailData = {} } = this.props;

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
    const detailData = _.get(this.props, 'detailData');

    if (_.isEmpty(detailLayout) || _.isEmpty(detailData)) {
      return <LoadingScreen />;
    }
    const { permission, navigation } = this.props;
    const navParam = _.get(navigation, 'state.params.navParam');
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
    const { navigation } = this.props;
    const { detailLayout } = this.state;

    if (detailLayout) {
      const { object_describe_api_name } = detailLayout;
      const components = _.get(detailLayout, 'containers[0].components');
      const layout = _.get(detailLayout, 'containers[0].components[0]');
      const field_sections = _.get(layout, 'field_sections');
      const expactComp = [];

      const buttonList = [];

      const buttons = this.craftButtonList(layout, object_describe_api_name, 2);
      if (buttons) {
        buttonList.push(...buttons);
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

  render() {
    const detailLayout = _.get(this.state, 'detailLayout');
    const { navigation, dispatch, screen } = this.props;
    const { modalLoadingVisible } = this.state;
    const addActions = this.getPopoverActions();

    return (
      <StyledContainer style={{ backgroundColor: themes.fill_base }}>
        <StyledHeader>
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

  const navParam = _.get(screen, 'navigation.state.params.navParam');
  const objectApiName = _.get(navParam, 'objectApiName');
  const related_list_name = _.get(navParam, 'related_list_name');
  const id = _.get(navParam, 'id', _.get(navParam, '_id'));
  const detailData = _.get(state, `cascade.cascadeList.${related_list_name}.${id}`, {});

  return {
    token: state.settings.token,
    permission: state.settings.permission,
    objectDescription: state.settings.objectDescription,
    profile: state.settings.profile,

    approvalFlowInfo,

    detailData,

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
        updateDetail: updateDetail(key),
        resetUpdateState: resetUpdateState(key),
        clearQuery: clearQuery(key),
        getApprovalNode: getApprovalNodesByRecordId(key),
        submitApprovalNode: submitApproval(key),
        cancelApproval: cancelApproval(key),
        nodeOperation: nodeOperation(key),
        updateNavigationHistory,
      },
      dispatch,
    ),
    dispatch,
  };
};

export default connect(select, act)(DetailModalScreen);
