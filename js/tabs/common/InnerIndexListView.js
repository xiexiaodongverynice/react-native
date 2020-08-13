/**
 * Created by Uncle Charlie, 2018/01/11
 * @flow
 */

import * as React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Switch,
  DeviceEventEmitter,
  Image,
} from 'react-native';
import { Badge, Left, Right, Icon, Spinner } from 'native-base';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import _ from 'lodash';
import Swipeout from 'react-native-swipeout';
import QueryComposer from 'fc-common-lib/query-composer';
import Privilege from 'fc-common-lib/privilege';
import { ListDivider, Confirm } from './components';

import { recordUpdateAction } from '../../actions/recordUpdate';
import { recordDeleteAction } from '../../actions/recordDelete';
import { nodeOperation } from '../../actions/approvalFlow';
import { needRefreshAttendee } from '../../actions/event';
import Common from '../../utils/constants';
import IndexDataParser from '../../services/dataParser';
import * as Util from '../../utils/util';
import HttpRequest from '../../services/httpRequest';
import I18n from '../../i18n';
import themes from './theme';
import {
  toastWaring,
  toastSuccess,
  toastDefault,
  toastError,
  toastLayoutErrorCode,
} from '../../utils/toast';
import preventDuplicate from '../common/helpers/preventDuplicate';
import recordService from '../../services/recordService';
import Formatter from '../../services/formatterParser';
import { NoMoreDataViewStylable } from '../../components/hintView/NoDataView';
import CustomActionService from '../../services/customActionService';
import FilterSubHelper from './helpers/FilterSubHelper';
import { checkValidExpression, getCustomActionCallbacks } from './helpers/recordHelper';
import HtmlComponent from './components/HtmlComponent';
import IndexService from '../../services/indexService';
import { getSrc } from '../common/helpers/modalWidget';
import VerticalSpacer from '../../components/common/VerticalSpacer';
import NoDataPlaceholder from '../../components/common/NoDataPlaceholder';

type Action = {
  recordUpdateAction: (any) => void,
  recordDeleteAction: (any) => void,
  nodeOperation: (key) => (payload, cb) => void,
  needRefreshAttendee: () => void,
};

type Prop = {
  orderBy: string,
  order: string,
  token: string,
  objectApiName: string,
  objectDescription: any,
  recordType: string,
  rowActionsList: Array<any>,
  actions: Action,
  phoneLayout: ?PhoneLayout,
  mobileLayout: ?any,
  criteria: Array<any>,
  territoryCriterias: Array<any>,
  navigation: any,
  recordUpdateStatus: number,
  refreshApiName: ?string,
  parentData: any,
  objectDescribeApiName: string,
  component: any,
  onComponentDidMount: void, //* 用于注册路由
  permission: any,
  approvalCriterias: any, //* 用于approval条件筛选
  needRefresh: void,
  screenInfo: any,
};

type State = {
  rowId: ?string,
  data: Array<any>,
  refreshing: boolean,
  loadingMore: boolean,
  favChecked: boolean,
  noReadCounts: number,
  noReadAlert: any,
  resultCount?: number,
  needRefresh?: boolean,
  pageCount: number,
  noData: boolean,
  stashSubOptions: Array<any>,
  stashSubFilter: Array, //* 筛选下属条件
};

const FIRST_PAGE = 1;
const FAV_CRITERIA = { field: 'is_favorite', operator: '==', value: [true] };

// const ICON_TYPE = ['hco', 'hcp', 'pharmacy'];
// const ICON_TYPE_DATA = {
//   hco: {
//     iconName: 'medkit',
//   },
//   hcp: {
//     iconName: 'people',
//   },
//   pharmacy: {
//     iconName: 'ios-flask',
//   },
// };

class InnerIndexListView extends React.Component<Prop, State> {
  pageNo: number = FIRST_PAGE;
  territoryCriterias: Array<any>;

  state = {
    rowId: '',
    data: [],
    refreshing: true,
    loadingMore: false,
    favChecked: false,
    noReadCounts: 0,
    pageCount: 1,
    noData: false,
    noReadAlert: [],
    stashSubOptions: [],
    stashSubFilter: [],
    flatListHeight: null, //为了让NoDataPlaceholder占满屏幕
  };
  eventListener;

  componentDidMount() {
    const { onComponentDidMount, objectApiName, territoryCriterias = [] } = this.props;
    // if (_.isFunction(onComponentDidMount)) {
    //   onComponentDidMount(this.onRefresh);
    // }
    this.territoryCriterias = territoryCriterias;
    DeviceEventEmitter.addListener('RefreshIndexList', async (obj) => {
      this.onRefresh();
    });

    this.onRefresh();

    objectApiName === 'alert' && this.requestNoReadMsgNums();
  }

  componentWillUnmount() {
    if (_.isFunction(_.get(this, 'eventListener.remove'))) {
      this.eventListener.remove();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { needRefresh, objectApiName, refreshApiName, actions } = this.props;

    if (needRefresh && objectApiName === refreshApiName) {
      this.setState({ refreshing: true });
      this.onRefresh();
      actions.needRefreshAttendee(false);
    }
  }
  /**
   * 自定义action
   */
  onCallCustomAction = (actionLayout, detailData) => {
    const needConfirm = _.get(actionLayout, 'need_confirm', false);
    const confirmMessage = _.get(actionLayout, 'confirm_message');

    const _callCustomAction = async () => {
      const { objectDescription, screenInfo, token } = this.props;

      const objectApiName = _.get(screenInfo, 'objectApiName');

      const response = await CustomActionService.post({
        objectApiName,
        actionLayout,
        ids: [_.get(detailData, 'id')],
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
        onOK() {
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

  async requestNoReadMsgNums() {
    const { result, resultCount } = await HttpRequest.query({
      token: this.props.token,
      objectApiName: 'alert',
      criteria: [
        {
          field: 'owner',
          operator: '==',
          value: [global.FC_CRM_USERID],
        },
        { field: 'status', operator: '==', value: [0] },
      ],
      joiner: 'and',
      orderBy: 'create_time',
      order: 'desc',
      pageSize: 10000,
      pageNo: 1,
    });

    this.setState({
      noReadCounts: resultCount,
      noReadAlert: result,
    });
  }

  // 选择状态后刷新的函数
  onRefresh = async () => {
    this.setState({ refreshing: true });
    const { approvalCriterias } = this.props;
    if (this.state.loadingMore) {
      return;
    }
    this.pageNo = FIRST_PAGE;
    const { token, orderBy, order, criteria, objectApiName } = this.props;
    const { favChecked, stashSubFilter } = this.state;
    const composeCriteria = criteria.concat(stashSubFilter);

    let params = {
      token: global.FC_CRM_TOKEN,
      objectApiName,
      criteria: favChecked ? _.concat(composeCriteria, FAV_CRITERIA) : composeCriteria,
      territoryCriterias: this.territoryCriterias,
      joiner: '',
      orderBy,
      order,
      pageSize: Common.pageSize,
      pageNo: this.pageNo,
    };

    if (!_.isEmpty(approvalCriterias)) {
      params = _.assign({}, params, { approvalCriterias });
    }

    const data = await IndexService.getData(params);

    this.setState({
      data: _.get(data, 'result'),
      refreshing: false,
      loadingMore: false,
      noData:
        _.chain(data)
          .get('result')
          .value().length === 0,
      resultCount: _.get(data, 'resultCount', 0),
      pageCount: _.get(data, 'pageCount', 1),
    });
  };

  onEndReached = async () => {
    const { refreshing, loadingMore, pageCount, stashSubFilter } = this.state;
    const { approvalCriterias } = this.props;
    if (_.isEqual(pageCount, this.pageNo)) {
      this.setState({ noMoreDatas: true });
      return;
    }

    if (refreshing || loadingMore) {
      return;
    }

    this.setState({ loadingMore: true });

    this.pageNo += 1;
    const { token, orderBy, order, criteria, objectApiName, recordType } = this.props;
    const { favChecked } = this.state;
    const composeCriteria = criteria.concat(stashSubFilter);

    let params = {
      token,
      objectApiName,
      criteria: favChecked ? _.concat(composeCriteria, FAV_CRITERIA) : composeCriteria,
      territoryCriterias: this.territoryCriterias,
      joiner: '',
      orderBy,
      order,
      pageSize: Common.pageSize,
      pageNo: this.pageNo,
    };

    if (!_.isEmpty(approvalCriterias)) {
      params = _.assign({}, params, { approvalCriterias });
    }

    const data = await IndexService.getData(params);

    const results = _.concat(
      _.isEmpty(this.state.data) ? [] : this.state.data,
      _.get(data, 'result'),
    );
    this.setState({ data: results, refreshing: false, loadingMore: false });
  };

  recordUpdate = (action, record) => {
    /**
     * check valid_expressopn
     */
    const valid_result = checkValidExpression({
      layout: action,
      thizRecord: record,
    });

    if (_.isNull(valid_result) || _.isEqual(valid_result, true)) {
      const { actions, token, recordUpdateStatus } = this.props;
      const data = {};
      _.set(data, 'version', _.get(record, 'version'));
      _.set(data, 'id', _.get(record, 'id'));
      const defaultFieldVals = _.get(action, 'default_field_val');
      const objectApiName = _.get(record, 'object_describe_name');

      if (!_.isEmpty(defaultFieldVals)) {
        Util.setDefaultFieldVals(defaultFieldVals, record, data);
      }

      const dealData = {
        head: { token },
        body: data,
      };
      const payload = {
        dealData,
        object_api_name: objectApiName,
        id: _.get(record, 'id'),
      };
      actions.recordUpdateAction(payload, null, this.onRefresh);
    } else {
      toastError(valid_result);
    }
  };

  recordDelete = (action, item) => {
    const { actions, token } = this.props;
    const objectApiName = _.get(item, 'object_describe_name');
    const id = _.get(item, 'id');

    //如果当前是event页面，需要将eventId添加到action中
    const nav_objectApiName = _.get(
      this.props.navigation,
      'state.params.navParam.objectApiName',
      '',
    );

    let extra = {};
    if (nav_objectApiName === 'event') {
      const eventId = _.get(this.props.navigation, 'state.params.navParam.id');
      extra = { eventId };
    }

    actions.recordDeleteAction(token, objectApiName, id, this.onRefresh, extra);
  };

  /**
   * 外部调用方法，不可变更名称
   */
  relatedADD = (actionLayout: any) => {
    const { rowId, data } = this.state;
    const item = _.find(data, { id: rowId });
    if (!_.isUndefined(item)) {
      this.relatedAdd(actionLayout, item);
    } else {
      console.log('当前行数据未找到，rowId:', rowId);
    }
  };

  /**
   * 添加相关列表数据
   */
  relatedAdd = (actionLayout: any, item: object) => {
    const { permission, navigation } = this.props;
    const refObjectApiName = _.get(actionLayout, 'ref_obj_describe');
    if (!refObjectApiName) {
      toastLayoutErrorCode(1004);
      return;
    }
    if (Privilege.checkObject(permission, refObjectApiName, 1)) {
      const relatedListName = _.get(actionLayout, 'related_list_name');
      const targetRecordType = _.get(actionLayout, 'target_layout_record_type');
      const needReturn = _.get(actionLayout, 'need_callback', false);
      const parentId = _.get(item, _.get(actionLayout, 'target_value_field', 'id'));
      navigation.navigate('Create', {
        navParam: {
          refObjectApiName,
          relatedListName,
          targetRecordType,
          parentId,
          parentName: item.name,
          needReturn,
        },
      });
    }
  };

  swipeAction = (action, item) => {
    const {
      navigation,
      actions: { nodeOperation },
    } = this.props;
    const actionType = _.toUpper(_.get(action, 'action'));
    const tarRecordType = _.get(action, 'target_layout_record_type');
    const needConfirm = _.get(action, 'need_confirm', false);
    const confirmMessage = _.get(action, 'confirm_message', '确定');

    if (actionType === 'ADD') {
    } else if (actionType === 'EDIT') {
      navigation.navigate('Edit', {
        navParam: {
          ...item,
          record_type: tarRecordType || item.record_type,
        },
        screenInfo: {
          objectApiName: _.get(item, 'object_describe_name'),
          recordType: tarRecordType || item.record_type,
        },
      });
    } else if (actionType === 'UPDATE') {
      if (needConfirm) {
        Confirm({
          title: confirmMessage,
          onOK: () => {
            this.recordUpdate(action, item);
          },
          onCancel() {
            // console.log('Cancel');
          },
        });
      } else {
        this.recordUpdate(action, item);
      }
    } else if (actionType === 'DELETE') {
      if (needConfirm) {
        Confirm({
          title: confirmMessage,
          onOK: () => {
            this.recordDelete(action, item);
          },
          onCancel() {
            // console.log('Cancel');
          },
        });
      } else {
        this.recordDelete(action, item);
      }
    } else if (actionType === 'RELATEDADD') {
      this.relatedAdd(action, item);
    } else if (actionType === 'APPROVAL_ACCEPT') {
      const payload = {
        comments: '',
        node_id: _.get(item, 'id'),
        operation: 'accept',
      };
      if (needConfirm) {
        Confirm({
          title: '确定受理?',
          onOK: () => {
            nodeOperation(item.id)(payload, () => {});
          },
          onCancel() {
            // console.log('Cancel');
          },
        });
      } else {
        nodeOperation(item.id)(payload, () => {});
      }
    }
  };

  isNavigateToDetail = (item, detailAction) => {
    if (_.isEmpty(detailAction)) {
      return false;
    }

    const expression = _.get(detailAction, 'show_expression', ' return true;');
    return Util.executeExpression(expression, item);
  };

  onPressTouchableOpacity = (item, detailAction, canNavigateToDetail) => {
    const { token, objectApiName, navigation } = this.props;
    const actionCode = _.get(detailAction, 'action');

    //? 拜访模板功能，不确定该功能是否能正常使用
    if (objectApiName == 'call_template') {
      if (item.record_type == 'week') {
        navigation.navigate('WeekTemplate', {
          navParam: {
            objectApiName,
            recordType: item.record_type,
            record: item,
            token,
          },
        });
      } else if (item.record_type == 'day') {
        navigation.navigate('DayTemplate', {
          navParam: {
            objectApiName,
            recordType: item.record_type,
            record: item,
            token,
          },
        });
      }
    }

    if (canNavigateToDetail === false || _.isEmpty(detailAction)) {
      return;
    }

    if (actionCode === 'MODAL_WIDGET') {
      // 打开webview页面
      const { options: actionOptions = {} } = detailAction;
      const { params = {}, src } = actionOptions;
      if (!src) {
        toastLayoutErrorCode(1005);
        return;
      }

      navigation.navigate('WebView', {
        navParam: {
          external_page_src: `${getSrc(src)}?${QueryComposer.fromObject(
            Util.mapObject(params, { thizRecord: item }),
          )}`,
          showBack: true,
        },
      });
      return;
    }

    const defaultFieldVal = _.get(detailAction, 'default_field_val', []);
    const showAlert = _.get(detailAction, 'show_alert', true);
    const recordType = _.get(detailAction, 'target_layout_record_type');

    let recordId = '';
    let targetRecordType = '';
    let targetApiName = objectApiName;

    if (actionCode === 'DETAIL') {
      recordId = _.get(item, 'id');
      targetRecordType = _.get(
        detailAction,
        'target_layout_record_type',
        _.get(item, 'record_type'),
      );
    } else if (actionCode === 'PARENTDETAIL') {
      recordId = _.get(item, _.get(detailAction, 'target_value_field'));
      targetRecordType = _.get(detailAction, 'target_layout_record_type');
      targetApiName = _.get(detailAction, 'ref_obj_describe', objectApiName);
    } else if (actionCode === 'RELATEDDETAIL') {
      const actionRefObjectApiName = _.get(detailAction, 'ref_obj_describe', objectApiName);
      recordId = _.get(detailAction, 'target_data_record_Id');
      targetRecordType = _.get(
        detailAction,
        'target_layout_record_type',
        _.get(item, 'record_type'),
      );

      if (_.startsWith(actionRefObjectApiName, '$$') && _.endsWith(actionRefObjectApiName, '$$')) {
        targetApiName = _.get(item, _.replace(actionRefObjectApiName, /[$]/g, ''));
      }
      if (_.startsWith(recordId, '$$') && _.endsWith(recordId, '$$')) {
        recordId = _.get(item, _.replace(recordId, /[$]/g, ''));
      }
      if (_.startsWith(recordType, '$$') && _.endsWith(recordType, '$$')) {
        targetRecordType = _.get(item, _.replace(recordType, /[$]/g, ''), 'master');
      }
    }

    let payload;
    if (!_.isEmpty(defaultFieldVal)) {
      const data = {};
      _.set(data, 'version', _.get(item, 'version'));
      _.set(data, 'id', _.get(item, 'id'));
      Util.setDefaultFieldVals(defaultFieldVal, item, data);
      const dealData = {
        head: { token },
        body: data,
      };
      payload = {
        dealData,
        object_api_name: targetApiName,
        id: _.get(item, 'id'), // 应该传递 recordId
      };
    }

    navigation.navigate('Detail', {
      navParam: {
        objectApiName: targetApiName,
        record_type: targetRecordType,
        id: recordId,
        fromRecordType: _.get(this.props, 'recordType'),
        callback: this.onRefresh,
        onUpdate: this.onRefresh,
        updateParams: payload ? [payload, showAlert] : null,
      },
    });
  };

  getSubTitle = (item) => {
    const { objectDescription, objectApiName, phoneLayout, mobileLayout } = this.props;
    //! 手机端对 mobile_layout(mobileLayout) 支持不完善，租户端最好配置 padLayout(phoneLayout)
    //* 移动端列表起初只有 padLayout(phoneLayout)，ipad和手机端都解析该布局
    //* 后来需要区分ipad和手机布局，所以添加了mobileLayout
    if (!_.isEmpty(mobileLayout)) {
      const subTitleLayout = _.get(mobileLayout, 'sub_title');
      if (_.isEmpty(subTitleLayout)) {
        return null;
      }

      const parsedVal = Formatter.parse(subTitleLayout, item, objectDescription, objectApiName);

      return (
        <View
          style={{
            marginHorizontal: 25,
          }}
        >
          <Text
            style={{
              color: themes.list_title_color,
              fontSize: themes.list_subtitle_size,
            }}
          >
            {Util.cutString(parsedVal || '')}
          </Text>
        </View>
      );
    } else if (_.get(phoneLayout, 'sub_title')) {
      const { needLabels } = phoneLayout;
      const subtitleVal = IndexDataParser.parseListValue(
        phoneLayout.sub_title,
        item,
        objectDescription,
        objectApiName,
        needLabels,
      );
      return (
        <View
          style={{
            marginHorizontal: 25,
          }}
        >
          <Text
            style={{
              color: themes.list_title_color,
              fontSize: themes.list_subtitle_size,
            }}
          >
            {Util.cutString(subtitleVal || '')}
          </Text>
        </View>
      );
    }
    return null;
  };

  getTitle = (item) => {
    const { objectDescription, objectApiName, phoneLayout, mobileLayout } = this.props;
    const textStyle = {
      color: '#333333',
      fontSize: 16,
      flexWrap: 'wrap',
    };

    //! 手机端对 mobile_layout(mobileLayout) 支持不完善，租户端最好配置 padLayout(phoneLayout)
    //* 移动端列表起初只有 padLayout(phoneLayout)，ipad和手机端都解析该布局
    //* 后来需要区分ipad和手机布局，所以添加了mobileLayout
    if (!_.isEmpty(mobileLayout)) {
      const titleLayout = _.get(mobileLayout, 'title');
      if (_.isEmpty(titleLayout)) {
        return null;
      }

      const parsedVal = Formatter.parse(titleLayout, item, objectDescription, objectApiName);

      return (
        <View style={{ flex: 1, marginRight: 5 }}>
          <Text style={textStyle}>{parsedVal || ''}</Text>
        </View>
      );
    } else if (!_.isEmpty(phoneLayout)) {
      const { needLabels } = phoneLayout;
      if (_.get(phoneLayout, 'title', '')) {
        const title = IndexDataParser.parseListValue(
          phoneLayout.title,
          item,
          objectDescription,
          objectApiName,
          needLabels,
        );
        return (
          <View style={{ flex: 1, marginRight: 5 }}>
            <Text style={textStyle}>{title || ''}</Text>
          </View>
        );
      }
    } else {
      return null;
    }
  };

  getContents = (item) => {
    const { phoneLayout, mobileLayout, objectDescription, objectApiName, navigation } = this.props;
    //! 手机端对 mobile_layout(mobileLayout) 支持不完善，租户端最好配置 padLayout(phoneLayout)
    //* 移动端列表起初只有 padLayout(phoneLayout)，ipad和手机端都解析该布局
    //* 后来需要区分ipad和手机布局，所以添加了mobileLayout
    if (!_.isEmpty(mobileLayout)) {
      return (
        <View style={{ marginTop: 5 }}>
          {mobileLayout.contents &&
            mobileLayout.contents.map((content, index) => {
              if (content.hidden_expression) {
                const is_hidden = Util.executeExpression(content.hidden_expression, item);
                if (is_hidden) {
                  return undefined;
                }
              }
              if (_.get(content, 'type') === 'inner_html') {
                <HtmlComponent
                  html={Formatter.parse(content, item, objectDescription, objectApiName)}
                />;
              } else {
                return (
                  <Text
                    key={`row_content_${item.id}_${Math.random()}`}
                    style={{
                      marginTop: 5,
                      fontSize: themes.list_subtitle_size,
                      color: themes.list_subtitle_color,
                    }}
                  >
                    {Formatter.parse(content, item, objectDescription, objectApiName)}
                  </Text>
                );
              }
            })}
        </View>
      );
    } else if (!_.isEmpty(phoneLayout)) {
      const { needLabels } = phoneLayout;
      return (
        <View style={{ marginTop: 5 }}>
          {phoneLayout.contents &&
            phoneLayout.contents.map((content, index) => {
              let parsedValue = IndexDataParser.parseListValue(
                content,
                item,
                objectDescription,
                objectApiName,
                needLabels,
              );

              if (_.isArray(parsedValue) && !_.isEmpty(parsedValue)) {
                let label = '';
                _.each(parsedValue, (value, index) => {
                  label += (index == 0 ? '' : ',') + value;
                });
                parsedValue = label;
              }

              if (_.get(content, 'type') === 'inner_html') {
                return <HtmlComponent navigation={navigation} html={parsedValue} />;
              } else {
                return (
                  <Text
                    key={`row_content_${item.id}_${Math.random()}`}
                    style={{
                      marginTop: 5,
                      fontSize: themes.list_subtitle_size,
                      color: themes.list_subtitle_color,
                    }}
                  >
                    {parsedValue}
                  </Text>
                );
              }
            })}
        </View>
      );
    } else {
      return null;
    }
  };

  labelBadge = (label, color) => {
    if (!label) return null;
    return (
      <View
        style={{
          width: 48,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: color,
          paddingVertical: 5,
          borderRadius: 2,
        }}
      >
        {label && label.indexOf('-') > 0
          ? _.map(label.split('-'), this.renderLabel)
          : this.renderLabel(label)}
      </View>
    );
  };

  renderLabel = (label, index) => (
    <View key={label + index}>
      <Text
        style={
          _.isUndefined(index)
            ? {
                color: '#fff',
                fontSize: 11,
              }
            : {
                color: '#fff',
                fontSize: 10,
              }
        }
      >
        {label}
      </Text>
    </View>
  );

  getLabels = (item, rightLabels) => {
    const { objectDescription, objectApiName, component } = this.props;
    const labelValue = _.get(rightLabels, 'value');
    const fields = _.get(component, 'fields');

    let colorField;
    let fieldColor;

    //* 右边状态标记，标记的颜色优先取field中获取，没有再取rightLabels中的color
    //* field:[                                |  "labels" : [
    //*   {                                    |     {
    //*     "field" : "status",                |        "color":"red",
    //*     "tag_color" : {                    |        "position":"top",
    //*         "0" : "#fab91b",               |        "type":"label",
    //*         "1" : "#ec6a00",               |        "value":"status"
    //*         "2" : "#711e00"                |    }
    //*     },                                 |  ]
    //*     "tag_icon" : "circle",             |
    //*     "render_type" : "tag"              |
    //*   }                                    |
    //*  ]                                     |
    //! 在列表布局中，手机端解析的是padLayout(mobile_layout),web端解析的是field
    if (fields.length > 0) {
      fields.forEach((field) => {
        if (field.field === labelValue) {
          colorField = field;
        }
      });
    }

    if (colorField) {
      const type = _.get(item, `[${labelValue}]`);
      fieldColor = _.get(colorField, `tag_color[${type}]`);
    }

    const color = fieldColor || _.get(rightLabels, 'color');
    const label = IndexDataParser.parseListLabels(
      labelValue,
      _.get(item, labelValue),
      objectDescription,
      objectApiName,
    );

    return this.labelBadge(label, color);
  };

  checkPrevilage = (action) => {
    const { permission, objectDescribeApiName } = this.props;
    const actionRefObjectApiName = _.get(action, 'ref_obj_describe', objectDescribeApiName);
    const actionCode = _.get(action, 'action');

    return Privilege.checkAction(actionCode, permission, actionRefObjectApiName);
  };

  renderItem = ({ item }) => {
    const { rowId } = this.state;
    const rightSwipeButtons = [];
    const leftSwipeButtons = [];
    const parentRecord = this.props.parentData || {};
    const { rowActionsList, phoneLayout, mobileLayout } = this.props;
    const swipeList = _.filter(rowActionsList, (row) => row.mobile_show);
    const rightSwipe = _.filter(swipeList, { mobile_show: 'SWIPE_RIGHT' });
    const leftSwipe = _.filter(swipeList, { mobile_show: 'SWIPE_LEFT' });
    const rightLabels = _.get(phoneLayout, 'labels[0]', false);
    if (rowActionsList) {
      if (rightSwipe) {
        _.forEach(rightSwipe, (action) => {
          const expression = _.get(action, 'show_expression', ' return true;');
          const showExpression = Util.executeDetailExp(expression, item, parentRecord);
          const { is_custom = false } = action;
          if (showExpression) {
            if (is_custom) {
              rightSwipeButtons.push({
                key: `${action.action}_${action.label}`,
                text: I18n.t(_.get(action, ['action.i18n_key']), { defaultValue: action.label }),
                onPress: () => {
                  console.warn('### custom action button clicked');
                  this.onCallCustomAction(action, item);
                },
                backgroundColor: _.get(action, 'mobile_swipe_color', '#3682D5'),
              });
            } else {
              if (this.checkPrevilage(action)) {
                rightSwipeButtons.push({
                  key: `${action.action}_${action.label}`,
                  text: I18n.t(_.get(action, ['action.i18n_key']), { defaultValue: action.label }),
                  onPress: this.swipeAction.bind(this, action, item),
                  backgroundColor: _.get(action, 'mobile_swipe_color', '#3682D5'),
                });
              }
            }
          }
        });
      }
      if (leftSwipe) {
        _.forEach(leftSwipe, (action) => {
          const expression = _.get(action, 'show_expression', ' return true;');
          const showExpression = Util.executeDetailExp(expression, item, parentRecord);
          const { is_custom = false } = action;
          if (showExpression) {
            if (is_custom) {
              leftSwipeButtons.push({
                key: `${action.action}_${action.label}`,
                text: I18n.t(_.get(action, ['action.i18n_key']), { defaultValue: action.label }),
                onPress: () => {
                  console.warn('### custom action button clicked');
                  this.onCallCustomAction(action, item);
                },
                backgroundColor: _.get(action, 'mobile_swipe_color', '#3682D5'),
              });
            } else {
              if (this.checkPrevilage(action)) {
                leftSwipeButtons.push({
                  key: `${action.action}_${action.label}`,
                  text: I18n.t(_.get(action, ['action.i18n_key']), { defaultValue: action.label }),
                  onPress: this.swipeAction.bind(this, action, item),
                  backgroundColor: _.get(action, 'mobile_swipe_color', '#3682D5'),
                });
              }
            }
          }
        });
      }
    }

    const detailAction = _.find(rowActionsList, (action: any) => {
      const actionCode = _.get(action, 'action');
      return (
        actionCode === 'DETAIL' || actionCode === 'PARENTDETAIL' || actionCode === 'RELATEDDETAIL'
      );
    });

    const canNavigateToDetail = this.isNavigateToDetail(item, detailAction);
    return (
      <View style={styles.rowItem} key={`${_.get(item, 'id')}`}>
        <Swipeout
          right={rightSwipeButtons}
          left={leftSwipeButtons}
          autoClose
          close={this.state.rowId !== item.id}
          buttonWidth={100}
          backgroundColor="#fff"
          rowIndex={item.id}
          onOpen={_.debounce(() => {
            this.setState({ rowId: item.id });
          }, 200)}
          style={{
            flex: 1,
            alignSelf: 'stretch',
          }}
        >
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              backgroundColor: '#fff',
              paddingHorizontal: 12,
              paddingVertical: 12,
            }}
            onPress={preventDuplicate(() => {
              this.onPressTouchableOpacity(item, detailAction, canNavigateToDetail);
            })}
          >
            <View
              style={{
                flex: 4,
                flexDirection: 'column',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                {this.getTitle(item)}
                {this.getSubTitle(item)}
              </View>
              <View style={{ justifyContent: 'flex-start' }}>{this.getContents(item)}</View>
            </View>
            <View
              style={{
                flex: 1,
                justifyContent: 'flex-start',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                }}
              >
                {rightLabels && this.getLabels(item, rightLabels)}
                {_.get(item, 'is_favorite') && (
                  <Icon name="star" active type="Foundation" style={styles.favorite} />
                )}
                {canNavigateToDetail ? (
                  <Icon name="ios-arrow-forward" style={styles.arrowIcon} />
                ) : (
                  <View style={{ width: 20 }} />
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Swipeout>
      </View>
    );
  };

  handleSwitchChange = () => {
    this.setState(
      {
        favChecked: !this.state.favChecked,
        refreshing: true,
        loadingMore: false,
      },
      () => this.onRefresh(),
    );
  };

  //* 标记全部已读
  onMarkAllRead = async () => {
    const { token } = this.props;
    const { noReadAlert } = this.state;

    const data = noReadAlert.map((x) => ({
      id: x.id,
      version: x.version,
      status: '1',
    }));

    const dealData = {
      head: {
        token,
      },
      body: { data },
    };

    const {
      head: { code },
    } = await recordService.batchUpdateRecords({
      object_api_name: 'alert',
      dealData,
    });

    if ([200, 201].includes(code)) {
      toastSuccess(I18n.t('operation_success'));
      this.setState({ noReadCounts: 0, noReadAlert: [] });
      this.onRefresh();
    }
  };
  subHeaderRightExtender = (component) => {
    const filterExtnders = _.get(component, 'selector_filter_extender');
    const { noReadCounts } = this.state;
    const renderFields = [];
    if (noReadCounts > 0) {
      renderFields.push(
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
          onPress={this.onMarkAllRead}
        >
          <Text style={{ marginHorizontal: 6, color: themes.fill_base_color }}>
            {I18n.t('InnerIndexListView.MarkAllAsRead')}
          </Text>
        </TouchableOpacity>,
      );
    }

    if (!filterExtnders) {
      return;
    }

    let showFavFilter = false;
    let hiddenSubor = true;
    let extender_option = {};
    let extender_all = {};
    _.each(filterExtnders, (extender) => {
      const extenderItem = _.get(extender, 'extender_item');
      if (extenderItem === 'FavoriteSelectorFilter') {
        showFavFilter = true;
      }
      if (extenderItem === 'SubordinateSelectorFilter') {
        extender_option = _.get(extender, 'extender_option', {});
        extender_all = extender;
        const hidden_expression = _.get(extender, 'hidden_expression', 'return false');
        hiddenSubor = Util.executeDetailExp(hidden_expression);
      }
    });

    if (!hiddenSubor) {
      renderFields.push(
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <TouchableOpacity onPress={() => this.selectSubord(extender_option, extender_all)}>
            <Text style={{ marginHorizontal: 6 }}>
              {I18n.t('InnerIndexListView.ChooseSubordinate')}
            </Text>
          </TouchableOpacity>
        </View>,
      );
    }

    if (showFavFilter) {
      renderFields.push(
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <Text style={{ marginHorizontal: 6 }}>{I18n.t('index_show_favorite')}</Text>
          <Switch
            value={this.state.favChecked}
            disabled={false}
            activeText="On"
            inActiveText="Off"
            backgroundActive="blue"
            backgroundInactive="gray"
            circleActiveColor="#30a566"
            circleInActiveColor="#000000"
            onValueChange={this.handleSwitchChange}
          />
        </View>,
      );
    }

    if (_.isEmpty(renderFields)) return null;

    return <View style={{ flexWrap: 'wrap', justifyContent: 'center' }}>{renderFields}</View>;
  };
  // 选择下属
  selectSubord = (extender_option, extender_all) => {
    const { navigation } = this.props;

    const { stashSubOptions } = this.state;

    const filterSubCallBack = (cri, selectItems, otherSubFilter) => {
      //* 选择筛选下属后，将筛选条件储存为stashSubFilter
      const stashSubFilter = [];
      if (_.isObject(cri) && !_.isEmpty(cri) && _.has(cri, 'value')) {
        stashSubFilter.push(cri);
      }
      if (_.isArray(otherSubFilter) && !_.isEmpty(otherSubFilter)) {
        stashSubFilter.concat(otherSubFilter);
      }

      this.setState({ stashSubOptions: selectItems, stashSubFilter }, this.onRefresh);
    };

    const param = FilterSubHelper.composeParams(
      extender_all,
      filterSubCallBack,
      stashSubOptions,
      this.territoryCriterias,
    );

    navigation.navigate('SelectTree', param);
  };

  onFlatListLayout = (e) => {
    this.setState({ flatListHeight: e.nativeEvent.layout.height });
  };

  renderListEmptyComponent = () => {
    //CRM-6091 1、列表页数据加载时，不要显示数据为空状态的icon
    const { refreshing, loadingMore } = this.state;
    if (refreshing || loadingMore) {
      return null;
    } else {
      return (
        <NoDataPlaceholder
          text={I18n.t('InnerIndexListView.NoDataTip')}
          height={this.state.flatListHeight}
        />
      );
    }
  };

  render() {
    const { component, phoneLayout } = this.props;
    const { resultCount, loadingMore, noMoreDatas, noData, data } = this.state;

    return (
      <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'stretch' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: 30,
            paddingHorizontal: 12,
          }}
        >
          <Left>
            <Text style={styles.color999fontSize12}>
              {I18n.t('List.TotalNItems').replace('%d', resultCount || 0)}
            </Text>
          </Left>
          <Right>{this.subHeaderRightExtender(component)}</Right>
        </View>
        <FlatList
          style={{ alignSelf: 'stretch', flex: 1 }}
          onLayout={this.onFlatListLayout}
          data={this.state.data}
          keyExtractor={(item, index) => `${_.get(item, 'id', index)}`}
          renderItem={this.renderItem}
          onRefresh={this.onRefresh}
          refreshing={this.state.refreshing}
          onEndReached={this.onEndReached}
          onEndReachedThreshold={0.01}
          ItemSeparatorComponent={ItemSeparatorComponent0}
          ListEmptyComponent={this.renderListEmptyComponent()}
          ListFooterComponent={
            loadingMore ? (
              <Spinner color="blue" />
            ) : noMoreDatas ? (
              <NoMoreDataViewStylable style={styles.backgroundColorTransparent} isNormalSized />
            ) : null
          }
        />
      </View>
    );
  }
}

function ItemSeparatorComponent0(props) {
  return <VerticalSpacer height={10} />;
}

const select = (state) => ({
  token: state.settings.token,
  resultCount: state.query.resultCount,
  recordUpdateStatus: state.recordUpdate.status,
  needRefresh: state.event.needRefresh,
  refreshApiName: state.event.refreshApiName,
});

const act = (dispatch) => ({
  actions: bindActionCreators(
    {
      recordUpdateAction,
      recordDeleteAction,
      needRefreshAttendee,
      nodeOperation,
    },
    dispatch,
  ),
});

export default connect(select, act, null, {
  withRef: true,
})(InnerIndexListView);

const styles = StyleSheet.create({
  rowItem: {
    flex: 1,
    alignSelf: 'stretch',
    backgroundColor: 'blue',
    alignItems: 'stretch',
  },
  icon: {
    fontSize: themes.icon_size_index,
    color: '#BEC2C9',
    marginRight: 10,
  },
  arrowIcon: {
    color: themes.color_header_icon,
    fontSize: themes.font_header_size,
    marginLeft: 10,
  },
  favorite: {
    fontSize: themes.icon_size_index,
    color: '#FACC2D',
  },
  nodata: {
    fontSize: 100,
    color: 'lightgray',
  },
  color999fontSize12: {
    color: '#999999',
    fontSize: 12,
  },
  backgroundColorWhite: {
    backgroundColor: 'white',
  },
  backgroundColorTransparent: {
    backgroundColor: 'transparent',
  },
});
