/**
 * Created by Uncle Charlie, 2017/12/11
 * @flow
 */

import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Body, Button, Icon, Left, Right, Title } from 'native-base';
import _ from 'lodash';
import QueryComposer from 'fc-common-lib/query-composer';
import Privilege from 'fc-common-lib/privilege';
import requestLayout, { setCacheLayout } from '../actions/pageLayout';
import { queryRecordListAction, clearQuery } from '../actions/query';
import { needRefreshAttendee } from '../actions/event';
import I18n from '../i18n';
import WarningScreen from '../components/hintView/WarningScreen';
import InnerIndexListView from './common/InnerIndexListView';
import { processCriterias, process_CustomeAction_params } from '../utils/criteriaUtil';
import * as Util from '../utils/util';
import IndexService from '../services/indexService';
import ModalPopoverScreen from '../tabs/common/ModalPopoverScreen';
import ModalViewScreen from '../tabs/common/components/ModalViewScreen';
import themes from './common/theme';
import { StyledContainerIndexScreen, StyledHeader, Confirm } from './common/components';
import FilterEntranceView from '../components/filter/FilterEntranceView';
import { baseURL } from '../utils/config';
import { getSrc } from './common/helpers/modalWidget';
import CustomActionService from '../services/customActionService';
import { getCustomActionCallbacks } from './common/helpers/recordHelper';
import {
  toastSuccess,
  toastWaring,
  toastError,
  toastDefault,
  toastLayoutErrorCode,
} from '../utils/toast';
import ClmPresentationListView from './common/ClmPresentationListView';
import LoadingScreen from './common/LoadingScreen';
import { SelectedFiltersRow } from '../components/filter/SelectedFiltersRow';

type Prop = {
  screenInfo: ScreenInfo,
  actions: {
    clearQuery: any,
    needRefreshAttendee: Function,
  },
  token: string,
  objectDescription: any,
  navigation: any,
  permission: any,
  onComponentDidMount: any,
  onComponentUnMount: any,
};

type State = {
  favChecked: boolean,
  selectedFilter: ?Array<Filter>,
  indexLayout?: Layout | Object,
  userProductList: any,
  viewStatus?: any,
  viewVisible: boolean,
  filterSelectCri: ?Array,
  sortBy: string,
  sortOrder: string,
  isFilter: boolean,
  filterObjs: Array,
};
type IndexComponentLayout = {
  record_type: ?Array<string>,
  views?: any,
};

class IndexScreen extends React.Component<Prop, State> {
  constructor(props) {
    super(props);
    const { navigation, screenInfo } = props;
    const _screenRecordType = _.get(screenInfo, 'recordType', '');
    const _screenObjectApiName = _.get(screenInfo, 'objectApiName', '');
    const _navParams = _.get(navigation, 'state.params.navParam', {});
    const _navRecordType = _.get(_navParams, 'record_type', '');
    const _navObjectApiName = _.get(_navParams, 'objectApiName', '');

    this.recordType = _navRecordType || _screenRecordType || 'master';
    this.objectApiName = _navObjectApiName || _screenObjectApiName;
    // this.androidBackAction = _.get(_navParams, 'androidBackAction');
    // this.summrySearch = _.get(_navParams, 'summrySearch', {});
    // this.showBack = !_.isEmpty(this.summrySearch) || _.get(_navParams, 'showBack', false);
  }

  static defaultProps = {
    screenInfo: {
      objectApiName: '',
      recordType: '',
    },
    actions: null,
    indexData: null,
    queryLoading: true,
    loadingMore: false,
  };

  multipleViews: Array<any> = [];

  pageNo: number = 1;

  state: State = {
    favChecked: false, // Show favorite sutff checked, default false.
    selectedFilter: null,
    userProductList: null,
    indexLayout: {},
    viewStatus: null,
    viewVisible: false,
    from: '',
    filterSelectCri: [], //* 筛选条件集合
    sortBy: 'update_time',
    sortOrder: 'desc',
    isFilter: false,
    filterObjs: [], //已选中的筛选条件，默认为空数组
  };

  recordType: string;
  objectApiName: string;
  componentLayout: IndexComponentLayout;
  modalRef: ?ModalPopoverScreen = null;

  listRef: InnerIndexListView = null;

  modalBtnRef: Button = null;

  componentWillUnmount() {
    const { onComponentUnMount } = this.props;
    // if (_.isFunction(this.androidBackAction)) {
    //   this.androidBackAction();
    // }
    if (_.isFunction(onComponentUnMount)) {
      onComponentUnMount();
    }
    const { actions } = this.props;
    actions.clearQuery();
  }

  async componentDidMount() {
    const { onComponentDidMount } = this.props;
    if (_.isFunction(onComponentDidMount)) {
      onComponentDidMount();
    }

    await this.refreshListData();
  }

  refreshListData = async () => {
    const { objectDescription } = this.props;

    const indexLayout = await IndexService.getIndexLayout({
      objectApiName: this.objectApiName,
      recordType: this.recordType,
    });

    this.componentLayout = _.get(indexLayout, 'containers[0].components[0]', null);
    if (_.isNull(this.componentLayout)) {
      toastLayoutErrorCode(1001);
      return;
    }

    //* 初始获取order和orderby优先级
    //* 配置排序筛选 > default_sort_by/default_sort_order > orderBy/order
    //* 不配置则默认为 update_time/desc

    const sortBy =
      _.get(this.componentLayout, 'filter_sort.0.sort_by') ||
      _.get(this.componentLayout, 'default_sort_by') ||
      _.get(this.componentLayout, 'orderBy') ||
      'update_time';

    const sortOrder =
      _.get(this.componentLayout, 'filter_sort.0.sort_order') ||
      _.get(this.componentLayout, 'default_sort_order') ||
      _.get(this.componentLayout, 'order') ||
      'desc';

    this.setState({ indexLayout, sortBy, sortOrder });

    this.getLayoutViews(indexLayout);

    //* record_type 除master外，都走正常的列表查询逻辑
    if (this.objectApiName === 'clm_presentation' && this.recordType === 'master') {
      //! 媒体信息列表的产品查询默认读取user_product对象
      const productList = await IndexService.getClmProducts(objectDescription);
      this.setState({ userProductList: productList });
    }
  };

  //* 组装视图
  getLayoutViews = (indexLayout) => {
    const views = _.get(this.componentLayout, 'views', []);
    if (!_.isArray(views)) {
      toastLayoutErrorCode(1002);
      return;
    }

    if (_.isEmpty(views)) {
      this.multipleViews.push({
        name: I18n.t_layout_headerTitle(indexLayout, ''),
        criterias: [],
        approval_criterias: [],
      });
    } else if (views.length === 1) {
      this.multipleViews.push({
        name: _.get(views, '[0].name') || '',
        criterias: _.get(views, '[0].criterias') || [],
        approval_criterias: _.get(views, '[0]approval_criterias') || [],
        ...views[0],
      });
    } else {
      _.forEach(views, (item) => {
        this.multipleViews.push({
          name: _.get(item, 'name') || '',
          criterias: _.get(item, 'criterias') || [],
          approval_criterias: _.get(item, 'approval_criterias') || [],
          ...item,
        });
      });
    }
    this.setState({ viewStatus: this.multipleViews[0] });
  };

  canRender = () => {
    const indexLayout = _.get(this.state, 'indexLayout');
    const viewStatus = _.get(this.state, 'viewStatus');

    if (this.objectApiName === 'clm_presentation' && this.recordType === 'master') {
      const userProductList = _.get(this.state, 'userProductList');
      return !_.isEmpty(indexLayout) && !_.isEmpty(viewStatus) && userProductList;
    }
    return !_.isEmpty(indexLayout) && !_.isEmpty(viewStatus);
  };

  //* 触发筛选
  handleFilter = (filters) => {
    const { actions } = this.props;
    if (!_.isEmpty(filters)) {
      this.setState({ isFilter: true });
    } else {
      this.setState({ isFilter: false });
    }

    this.setState({ filterSelectCri: filters }, () => {
      actions.needRefreshAttendee(true, this.objectApiName);
    });
  };

  // navToOptions = (destination: string, param: {}) => {
  //   const { navigation } = this.props;

  //   if (!param) {
  //     navigation.navigate(destination, param);
  //     return;
  //   }

  //   const navParam = { ...param };
  //   //* 太吓人了，this.filterSelectCallback 怎么就被干掉了
  //   navParam.callback = this.filterSelectCallback;

  //   navigation.navigate(destination, param);
  // };

  generateCriteria = (filterCriteria = [], extenderCriteria = {}, viewCriteria = []) => {
    // const component = this.getComponentLayout();
    const defaultFilterCriteria = _.get(
      _.get(this.componentLayout, 'default_filter_criterias'),
      'criterias',
    );

    //* component 中的recordType 是一个数组，可以直接赋值给value
    const recordType = this.componentLayout.record_type;
    let criteria = recordType ? [{ field: 'record_type', operator: 'in', value: recordType }] : [];

    if (!_.isEmpty(defaultFilterCriteria)) {
      criteria = _.concat(criteria, defaultFilterCriteria);
    }
    if (!_.isEmpty(filterCriteria)) {
      criteria = _.concat(criteria, filterCriteria);
    }
    if (!_.isEmpty(viewCriteria)) {
      criteria = _.concat(criteria, viewCriteria);
    }

    const selectorFilterCriteriaData = _.values(extenderCriteria);
    if (!_.isEmpty(selectorFilterCriteriaData)) {
      _.each(selectorFilterCriteriaData, (criteriaData) => {
        criteria = _.concat(criteria, criteriaData);
      });
    }

    return criteria;
  };

  // getComponentLayout = () => {
  //   const { indexLayout } = this.state;
  //   const component = _.get(indexLayout, 'containers[0].components[0]', null);
  //   return component;
  // };

  processApiName = (apiName: string = '', fieldType: string = '') => {
    if (fieldType === 'relation' || _.indexOf(['create_by', 'update_by', 'owner'], apiName) >= 0) {
      return `${apiName}__r.name`;
    }
    return apiName;
  };

  generateFilterCriteria = (selectedFilter) => {
    const criteria = [];
    _.each(selectedFilter, (filter) => {
      const apiName = _.get(filter, 'condition.api_name');
      const fieldType = _.get(filter, 'condition.type');

      criteria.push({
        field: this.processApiName(apiName, fieldType),
        operator: _.get(filter, 'op.value'),
        value:
          typeof filter.value === 'string' || typeof filter.value === 'number'
            ? [filter.value]
            : _.map(filter.value, (v) => v.value),
      });
    });

    return criteria;
  };

  // 自定义action调用方法;
  createAction = (actionLayout: any) => {
    const { navigation } = this.props;
    const targetLayoutRecordType =
      _.get(actionLayout, 'target_layout_record_type') || _.get(actionLayout, 'record_type');
    navigation.navigate('Create', {
      navParam: {
        targetRecordType: targetLayoutRecordType,
        refObjectApiName: actionLayout.object_describe_api_name,
      },
      callback: _.get(actionLayout, 'completeActionCallback', () => {}),
    });
  };

  onBatchAddCustomerTerritory = (actionLayout) => {
    const { navigation } = this.props;
    const targetFilterCriterias = _.get(actionLayout, 'target_filter_criterias', { criterias: [] });
    // * 选择医生页布局查询条件
    const changeDoctorLayout = {
      multiple_select: true,
      ref_obj_describe: 'customer',
      target_data_record_type: 'hcp',
      target_filter_criterias: targetFilterCriterias,
      target_layout_record_type: 'hcp',
      orderBy: 'name',
      order: 'desc',
    };

    const params = {
      actionLayout: changeDoctorLayout,
      callback: this.batchAddCustomerTerritoryCallback,
    };
    navigation.navigate('RelateModal', params);
  };
  batchAddCustomerTerritoryCallback = async (data) => {
    const objectApiName = _.get(this.props, 'screenInfo.objectApiName');
    const ids = [];
    if (!_.isEmpty(data)) {
      _.map(data, (it, index) => {
        ids.push(_.get(it, 'id'));
      });
    }

    // * 调用自定义action接口
    const response = await CustomActionService.executeAction({
      objectApiName,
      action: 'batch_add_customer_territory',
      ids,
      token: global.FC_CRM_TOKEN,
    });
    const responseCode = _.get(response, 'head.code');
    if (responseCode !== 200) {
      toastError(_.get(response, 'head.msg', '未知错误'));
    }
    // * 刷新列表
    const com = this.listRef.getWrappedInstance();
    com.onRefresh();
  };

  customOnsuccessHandler = ({ actionLayout }) => ({ response }) => {
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

  showModalCustomAction = async (actionLayout) => {
    const { navigation } = this.props;
    const showModalLayout = _.get(actionLayout, 'show_modal', {});
    const layoutRecordType = _.get(actionLayout, 'target_layout_record_type', 'master');
    const objectApiName = _.get(actionLayout, 'object_describe_api_name');

    const parseParams = process_CustomeAction_params(_.get(actionLayout, 'params', {}));

    //* 是否支持多选
    const multiple_select = _.get(showModalLayout, 'multiple_select', true);
    const multipleSelectParams = multiple_select
      ? { related: true }
      : { hiddenClear: true, multipleSelect: false };

    const customOnsuccessCallback = navigation.navigate('Relation', {
      targetRecordType: layoutRecordType,
      fieldLayout: showModalLayout,
      ...multipleSelectParams,
      record: {},
      apiName: objectApiName,
      callback: (selecteds) => {
        CustomActionService.postCustomeShowModal({
          selecteds,
          actionLayout,
          customOnsuccessCallback,
          parseParams,
        });
      },
    });
  };

  standardCustomAction = async (actionLayout) => {
    const { screenInfo, navigation } = this.props;
    const _navParams = _.get(navigation, 'state.params.navParam', {});
    const objectApiName =
      _.get(_navParams, 'objectApiName') ||
      _.get(_navParams, 'object_describe_api_name') ||
      _.get(screenInfo, 'objectApiName');

    const parseParams = process_CustomeAction_params(_.get(actionLayout, 'params', {}));

    const response = await CustomActionService.post({
      objectApiName,
      actionLayout,
      ids: [global.FC_CRM_USERID],
      parseParams,
    });
    this.customOnsuccessHandler({ actionLayout })({ response });
  };

  onCallCustomAction = (actionLayout) => {
    const needConfirm = _.get(actionLayout, 'need_confirm', false);
    const confirmMessage = _.get(actionLayout, 'confirm_message');

    let customHandle = _.noop;

    if (!_.isEmpty(actionLayout.show_modal)) {
      customHandle = this.showModalCustomAction;
    } else {
      customHandle = this.standardCustomAction;
    }

    if (needConfirm) {
      Confirm({
        title: confirmMessage || '确定执行?',
        onOK() {
          customHandle(actionLayout);
        },
        onCancel() {
          // console.log('Cancel');
        },
      });
    } else {
      customHandle(actionLayout);
    }
  };

  getPopoverActions = () => {
    const { navigation } = this.props;
    const { indexLayout } = this.state;
    if (!indexLayout) {
      return null;
    }

    const addActions = _.get(indexLayout, 'containers[0].components[0].actions', []);

    if (_.isEmpty(addActions)) {
      return null;
    }

    let actionList = _.filter(addActions, (action) => {
      const showInIndex = _.indexOf(_.get(action, 'show_when'), 'index') >= 0;
      if (!showInIndex) {
        return false;
      }

      if (
        _.get(action, 'hidden_devices') &&
        (_.get(action, 'hidden_devices').indexOf('cellphone') >= 0 ||
          _.get(action, 'hidden_devices').indexOf('phone') >= 0)
      ) {
        return false;
      }

      const disableField = Util.executeExpression(
        _.get(action, 'disabled_expression', 'return false'),
        {},
      );
      const hiddenField = Util.executeExpression(
        _.get(action, 'hidden_expression', 'return false'),
        {},
      );

      if (disableField || hiddenField) {
        return false;
      }

      const actionRefObjectApiName = _.get(
        action,
        'ref_obj_describe',
        _.get(indexLayout, 'object_describe_api_name'),
      );

      const { permission } = this.props;

      return (
        Privilege.checkObject(permission, actionRefObjectApiName, 1) ||
        Privilege.checkObject(permission, actionRefObjectApiName, 2)
      );
    });

    actionList = actionList.map((action) => {
      let type = _.get(action, 'action', '');
      type = type.toString().toUpperCase();
      const is_custom = _.get(action, 'is_custom');
      if (type == 'ADD') {
        action = Object.assign(
          {},
          action,
          {
            completeActionCallback: ({ updateData, apiName }) => {
              const com = this.listRef.getWrappedInstance();
              com.onRefresh();
            },
          },
          { object_describe_api_name: this.objectApiName },
        );
      } else if (type == 'MODAL_WIDGET') {
        // 打开webview页面
        const { options: actionOptions, label } = action;
        const { params = {} } = actionOptions;
        let { src } = actionOptions;
        src = getSrc(src);
        action = Object.assign({}, action, {
          pressHandler: () => {
            navigation.navigate('WebView', {
              navParam: {
                label,
                external_page_src: `${src}?${QueryComposer.fromObject(
                  Object.assign(
                    {},
                    Util.mapObject(params, {
                      thizRecord: {},
                    }),
                    {
                      baseURL,
                    },
                  ),
                )}`,
                showBack: true,
                callback: this.refreshListData,
              },
            });
          },
        });
      } else if (is_custom) {
        if (type == 'BATCH_ADD_CUSTOMER_TERRITORY') {
          // *批量创建目标医生
          action = Object.assign({}, action, {
            pressHandler: () => {
              this.onBatchAddCustomerTerritory(action);
            },
          });
        } else {
          action = Object.assign({}, action, {
            pressHandler: () => {
              this.onCallCustomAction(action);
            },
            completeActionCallback: ({ updateData, apiName }) => {
              const com = this.listRef.getWrappedInstance();
              com.onRefresh();
            },
          });
        }
      }
      return action;
    });

    return actionList;
  };

  headerRightAddButton = () => {
    const actionList = this.getPopoverActions();
    const addAction = _.find(actionList, (actionItem) => {
      const is_custom = _.get(actionItem, 'is_custom');
      const action = _.get(actionItem, 'action');
      if (is_custom) {
        return true;
      } else {
        return _.includes(['ADD', 'MODAL_WIDGET'], action);
      }
    });
    if (!addAction) {
      return null;
    }

    const showCreate = _.get(addAction, 'show_when');
    if (_.isEmpty(showCreate) || _.get(showCreate, '[0]') !== 'index') {
      return null;
    }

    return (
      <Button
        transparent
        onPress={() => {
          this.setModalPopoverVisible(true);
        }}
      >
        <Icon
          name="ios-add-circle-outline"
          ref={(el) => (this.modalBtnRef = el)}
          style={styles.icon}
        />
      </Button>
    );
  };

  setModalPopoverVisible = (visible: boolean) => {
    const modalBtnRef = this.modalBtnRef;
    modalBtnRef.wrappedInstance.wrappedInstance.root.measure(
      (x, y, width, height, pageX, pageY) => {
        this.modalRef.setAnchorPosition(
          {
            pageX: pageX + width / 2,
            pageY: pageY + height / 2,
          },
          () => {
            this.modalRef.setModalVisible(true);
          },
        );
      },
    );
  };

  setModalView = (visible: boolean, data: Object) => {
    const { actions } = this.props;
    let refreshList = false;
    this.setState(
      ({ viewVisible, viewStatus }) => {
        const viewVisibleState = viewVisible !== visible ? { viewVisible: visible } : {};
        const ViewStatusState =
          !_.isEmpty(data) && !_.isEqual(viewStatus, data) ? { viewStatus: data } : {};
        refreshList = !_.isEmpty(ViewStatusState);
        const result = _.assign({}, viewVisibleState, ViewStatusState);
        if (!_.isEmpty(result)) {
          return result;
        }
      },
      () => {
        if (refreshList) {
          actions.needRefreshAttendee(true, this.objectApiName);
        }
      },
    );
  };

  getSearchCriteria() {
    const { viewStatus, filterSelectCri } = this.state;
    const validFilters = _.filter(this.state.selectedFilter, (f) => f.condition);
    const filterCriteria = this.generateFilterCriteria(validFilters);
    const viewCriterias = processCriterias(_.get(viewStatus, 'criterias', []));
    const searchCriteria = this.generateCriteria(filterCriteria || [], {}, viewCriterias);

    //* 组合筛选条件
    return _.isEmpty(filterSelectCri) ? searchCriteria : _.concat(searchCriteria, filterSelectCri);
  }

  getApprovalCriterias() {
    const { viewStatus } = this.state;
    const layoutApprovalCriterias = _.get(viewStatus, 'approval_criterias');
    if (!layoutApprovalCriterias || _.isEmpty(layoutApprovalCriterias)) return {};
    const approvalCriterias = processCriterias(layoutApprovalCriterias);
    return approvalCriterias;
  }

  changeContainsString = (searchCriteria) =>
    _.map(searchCriteria, (criteria) => {
      if (criteria.operator === 'contains') {
        const newValue = _.map(criteria.value, (val) => {
          if (_.isNumber(val)) {
            return `${val}`;
          } else {
            return val;
          }
        });
        return {
          ...criteria,
          value: newValue,
        };
      } else {
        return criteria;
      }
    });

  handleOrder = ({ sortBy, sortOrder }) => {
    const { actions } = this.props;
    this.setState({ sortBy, sortOrder }, () => {
      actions.needRefreshAttendee(true, this.objectApiName);
    });
  };

  handleOrder = ({ sortBy, sortOrder }) => {
    const { actions } = this.props;
    this.setState({ sortBy, sortOrder }, () => {
      actions.needRefreshAttendee(true, this.objectApiName);
    });
  };

  renderInnerList = () => {
    const { indexLayout, sortBy, sortOrder, isFilter } = this.state;
    const { permission, navigation, objectDescription } = this.props;
    const showClmFolder = _.get(global.CRM_SETTINGS, 'show_clm_folder', false);

    // * 用于传递 screenInfo
    const _screenInfo = {
      objectApiName: this.objectApiName,
      recordType: this.recordType,
    };

    const component = _.get(indexLayout, 'containers[0].components[0]', null);
    const apiName = _.get(indexLayout, 'object_describe_api_name');
    if (!Privilege.checkObject(permission, apiName, 5)) {
      return (
        <WarningScreen
          content={I18n.t('object_previlage_no')}
          callback={() => navigation.goBack()}
        />
      );
    }

    const phoneLayout = _.get(component, 'padlayout', null);
    const mobileLayout = _.get(component, 'mobile_layout', null);
    const rowActionsList = _.get(indexLayout, 'containers[0].components[0].row_actions');
    const objectDescribeApiName = _.get(indexLayout, 'object_describe_api_name');
    let searchCriteria = this.getSearchCriteria();
    //* 查询条件中 含contains 转化为字符串
    searchCriteria = this.changeContainsString(searchCriteria);
    const approvalCriterias = this.getApprovalCriterias();
    if (this.objectApiName === 'clm_presentation' && this.recordType === 'master') {
      const userProductList = _.get(this.state, 'userProductList');
      const productIdList = _.map(userProductList, (product) => _.get(product, 'product'));
      const clmCriteria = [
        {
          field: 'product',
          operator: 'in',
          value: productIdList,
        },
        {
          field: 'status',
          operator: '<>',
          value: [0],
        },
      ];
      searchCriteria = searchCriteria.concat(clmCriteria);
    }

    //根据省份和销售区，业务线（otc or rx）进行数据条件查询
    const territoryCriterias = [];
    // if (!_.isEmpty(this.summrySearch)) {
    //   const {
    //     belonged_first_level_territory = '', //销售区
    //     belonged_product_line = '', //业务线字符串or数组
    //     belonged_second_level_territory = '', //省份
    //   } = this.summrySearch;
    //   const belonged_product_lines = _.isArray(belonged_product_line)
    //     ? belonged_product_line
    //     : [belonged_product_line];
    //   territoryCriterias = belonged_second_level_territory
    //     ? [
    //         {
    //           field: 'belonged_first_level_territory',
    //           operator: '==',
    //           value: [belonged_first_level_territory],
    //         },
    //         {
    //           field: 'belonged_second_level_territory',
    //           operator: '==',
    //           value: [belonged_second_level_territory],
    //         },
    //         {
    //           field: 'belonged_product_line',
    //           operator: 'in',
    //           value: belonged_product_lines,
    //         },
    //       ]
    //     : [
    //         {
    //           field: 'belonged_first_level_territory',
    //           operator: '==',
    //           value: [belonged_first_level_territory],
    //         },
    //         {
    //           field: 'belonged_product_line',
    //           operator: 'in',
    //           value: belonged_product_lines,
    //         },
    //       ];
    // }
    if (this.objectApiName === 'clm_presentation' && showClmFolder) {
      // 是媒体列表且crmSting设置显示文件夹
      return (
        <ClmPresentationListView
          orderBy={sortBy}
          order={sortOrder}
          objectApiName={this.objectApiName}
          recordType={this.recordType}
          objectDescribeApiName={objectDescribeApiName}
          phoneLayout={phoneLayout}
          mobileLayout={mobileLayout}
          objectDescription={objectDescription}
          permission={permission}
          criteria={searchCriteria}
          territoryCriterias={territoryCriterias}
          approvalCriterias={approvalCriterias}
          component={component}
          rowActionsList={rowActionsList}
          navigation={navigation}
          screenInfo={_screenInfo}
          isFilter={isFilter}
          ref={(el) => {
            this.listRef = el;
          }}
        />
      );
    } else {
      return (
        <InnerIndexListView
          orderBy={sortBy}
          order={sortOrder}
          objectApiName={this.objectApiName}
          recordType={this.recordType}
          objectDescribeApiName={objectDescribeApiName}
          phoneLayout={phoneLayout}
          mobileLayout={mobileLayout}
          objectDescription={objectDescription}
          permission={permission}
          criteria={searchCriteria}
          territoryCriterias={territoryCriterias}
          approvalCriterias={approvalCriterias}
          component={component}
          rowActionsList={rowActionsList}
          navigation={navigation}
          screenInfo={_screenInfo}
          ref={(el) => {
            this.listRef = el;
          }}
        />
      );
    }
  };

  renderContent = () => {
    const indexLayout = _.get(this.state, 'indexLayout');
    const phoneLayout = _.get(this.componentLayout, 'padlayout');

    if (this.canRender() && this.componentLayout && phoneLayout) {
      return this.renderInnerList();
    } else if (!phoneLayout && _.isObject(indexLayout) && !_.isEmpty(indexLayout)) {
      toastLayoutErrorCode(1003);
      return <LoadingScreen />;
    } else {
      return <LoadingScreen />;
    }
  };

  renderHeader() {
    const { navigation } = this.props;
    const { viewStatus, sortBy, sortOrder, indexLayout } = this.state;

    return (
      <StyledHeader>
        <Left style={{ flex: 1 }}>
          <Button transparent onPress={() => navigation.navigate('DrawerOpen')}>
            <Icon name="menu" style={styles.icon} />
          </Button>
        </Left>
        <Body style={{ flex: 1, alignItems: 'center' }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={() => {
              if (this.multipleViews.length > 1) {
                this.setModalView(true);
              }
            }}
          >
            <Title
              style={{
                color: themes.title_text_color,
                fontSize: themes.title_size,
              }}
            >
              {/* {_.get(viewStatus, 'name') || ''} */}
              {I18n.t(
                // 因为 . 是 JavaScript 以及很多语言取对象值的操作符。如果 key 中出现了该字符，那么应当使用 [] 来取值
                // 与 Lodash 对应的逻辑则是：
                // 1. 与 . 操作符对应的取值方式：_.get(data, 'a.b.c'), 表示的是取出 data = {a: {b: {c: 9}}} 中 9 的值
                // 2. 与 [] 操作符相对应的取值方式：_.get(data, ['a', 'b', 'c'])
                // 如果 data = {a: {'b.c' 9}}}, 那么应当是 _.get(data, [a, 'b.c']), 按照数组长度等于对象的深度，常规取法应当是：
                // data.a['b.c'], 或者 data['a']['b.c'], lodash 应当是对第二种方式的第二个参数使用了递进式的取值来解析表达式的。
                _.get(viewStatus, ['view.i18n_key']),
                { defaultValue: _.get(viewStatus, 'name') || '' },
              )}
            </Title>
            {this.multipleViews.length > 1 ? (
              <Icon name="ios-arrow-down" style={{ color: '#fff', paddingTop: 3 }} />
            ) : null}
          </TouchableOpacity>
        </Body>
        <Right>
          {indexLayout && !_.isEmpty(indexLayout) && (
            <FilterEntranceView
              setFilterObjs={this.setFilterObjs}
              layout={this.componentLayout}
              objectApiName={this.objectApiName}
              handleFilter={this.handleFilter}
              handleOrder={this.handleOrder}
              sortDes={{ sortBy, sortOrder }}
              location="right"
            />
          )}
          {this.headerRightAddButton()}
        </Right>
      </StyledHeader>
    );
  }

  setFilterObjs = (filterObjs) => {
    this.setState({ filterObjs });
  };

  renderFilterEntranceView() {
    const { sortBy, sortOrder, indexLayout } = this.state;
    if (indexLayout && !_.isEmpty(indexLayout)) {
      return (
        <FilterEntranceView
          setFilterObjs={this.setFilterObjs}
          layout={this.componentLayout}
          objectApiName={this.objectApiName}
          handleFilter={this.handleFilter}
          handleOrder={this.handleOrder}
          sortDes={{ sortBy, sortOrder }}
          location="bottom"
        />
      );
    } else {
      return null;
    }
  }

  renderModalViewScreen() {
    const { viewVisible } = this.state;

    return (
      <ModalViewScreen
        visible={viewVisible}
        setModalView={this.setModalView}
        multipleViews={this.multipleViews}
      />
    );
  }

  renderModalPopoverScreen() {
    const addActions = this.getPopoverActions();
    const { navigation } = this.props;

    return (
      <ModalPopoverScreen
        ref={(el) => (this.modalRef = el)}
        addActions={addActions}
        navigation={navigation}
      />
    );
  }
  //已选择的条件
  renderSelectedFiltersRows() {
    const filterObjs = this.state.filterObjs;
    if (filterObjs.length > 0) {
      return <SelectedFiltersRow filterObjs={filterObjs} style={styles.marginTop1} />;
    }
    return null;
  }

  render() {
    //  StyledContainer实际就相当于 View
    return (
      <StyledContainerIndexScreen>
        {this.renderHeader()}
        {this.renderFilterEntranceView()}
        {this.renderSelectedFiltersRows()}
        {this.renderContent()}
        {this.renderModalViewScreen()}
        {this.renderModalPopoverScreen()}
      </StyledContainerIndexScreen>
    );
  }
}

const select = (state) => ({
  token: state.settings.token,
  objectDescription: state.settings.objectDescription,
  permission: state.settings.permission,
});

const act = (dispatch, { navigation }) => {
  const key = _.get(navigation, 'state.key');
  return {
    actions: bindActionCreators(
      {
        layoutAction: requestLayout,
        queryRecordListAction,
        setCacheLayout,
        needRefreshAttendee,
        clearQuery: clearQuery(key),
      },
      dispatch,
    ),
  };
};

export default connect(select, act)(IndexScreen);

const styles = StyleSheet.create({
  switchContainer: {
    height: 38,
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  icon: {
    color: themes.title_icon_color,
    fontSize: themes.font_header_size,
  },
  marginTop1: {
    marginTop: 1,
  },
});
