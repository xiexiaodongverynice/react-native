/**
 * @flow
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ListItem, Icon } from 'native-base';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import _ from 'lodash';
import moment from 'moment';
import { checkExpression, getRecordFields } from '../helpers/recordHelper';
import IndexDataParser from '../../../services/dataParser';
import HttpRequest from '../../../services/httpRequest';
import { processCriterias } from '../../../utils/criteriaUtil';
import { toastError } from '../../../utils/toast';
import thems from '../theme';
import { SectionSeparator } from '../../../components/formComponents/common';
import {
  cascadeUpdateData,
  cascadeDeleteAllData,
  cascadeUpdateStatus,
  cascadeDeleteData,
} from '../../../actions/cascadeAction';
import handleUpdateCascade, {
  CASCADE_INIT,
  CASCADE_CREATE,
} from '../../../utils/helpers/handleUpdateCascade';
import IndexSwiperRecord from '../components/indexComponents/IndexSwiperRecord';
import { getForgeData } from '../../../utils/const';
import RecordService from '../../../services/recordService';
import { DetailScreenSectionHeader } from '../components';
import detailScreen_styles from '../../../styles/detailScreen_styles';
import I18n from '../../../i18n';

type Props = {
  modalActions: any,
  parentData: any,
  navigation: any,
  relateComponent: any,
  objectDescription: any,
  pageType: string,
  dispatch: void,
  pageTypeLevel: 'main' | 'sub',
  cascadeData: any,
  isTopLevel: boolean,
  component: any,
  actions: {
    cascadeUpdateData: void,
    cascadeDeleteAllData: void,
    cascadeUpdateStatus: void,
    cascadeDeleteData: void,
  },
};

type State = {
  dataListIndex: Array,
};

class ModalActionView extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    const { relateComponent = {} } = props;

    this.state = {
      dataListIndex: [],
    };

    this.loading = false;
    this.headername = _.get(relateComponent, 'header', '列表');
    this.rowActions = _.get(relateComponent, 'row_actions', []);

    const { ref_obj_describe, related_list_name } = relateComponent;
    this.related_list_name = related_list_name;
    this.objectApiName = ref_obj_describe;
    const currentDesc = this.getCurrentDesc(ref_obj_describe);
    this.relationFieldDesc = _.find(
      _.get(currentDesc, 'fields'),
      (desc) => desc.type === 'relation' && desc.related_list_api_name === related_list_name,
    );
  }

  componentDidMount() {
    const { pageType } = this.props;
    if (pageType !== 'add') {
      this.getInitData();
    }
  }

  getCurrentDesc = (objectDescName: string) => {
    if (!objectDescName) {
      return null;
    }

    const { objectDescription } = this.props;
    const objectDesc = IndexDataParser.getObjectDescByApiName(objectDescName, objectDescription);
    return objectDesc;
  };

  getInitData = async () => {
    this.loading = true;
    const { relateComponent, parentData, dispatch } = this.props;
    const parentId = _.get(parentData, 'id');
    const { ref_obj_describe, default_sort_order = 'desc' } = relateComponent;
    const result = await HttpRequest.query({
      token: global.FC_CRM_TOKEN,
      objectApiName: ref_obj_describe,
      criteria: this.getSearchCriteria(),
      joiner: 'and',
      orderBy: 'create_time',
      order: default_sort_order,
      pageSize: 100,
      pageNo: 1,
    });
    const resultData = _.get(result, 'result', []);

    this.loading = false;
    if (!_.isEmpty(resultData)) {
      handleUpdateCascade({
        data: resultData,
        relatedListName: this.related_list_name,
        status: CASCADE_INIT,
        parentId,
        dispatch,
      });
    }
    this.setState({ dataListIndex: _.map(resultData, (e) => e.id) }, () => {
      this.loading = false;
    });
  };

  componentWillReceiveProps(nextProps) {
    const { pageType, isTopLevel, cascadeData } = this.props;

    //* 回到顶层 详情页进行刷新
    if (
      pageType === 'detail' &&
      isTopLevel &&
      !this.loading &&
      !_.isEqual(cascadeData, nextProps.cascadeData)
    ) {
      this.getInitData();
    }
  }

  recordTypeCriteria = () => {
    const { relateComponent } = this.props;
    if (!relateComponent || !relateComponent.record_type) {
      return {};
    }

    const recordType = relateComponent.record_type;

    if (Array.isArray(recordType) && recordType.length > 0) {
      return {
        field: 'record_type',
        operator: 'in',
        value: recordType,
      };
    }
    return {
      field: 'record_type',
      operator: '==',
      value: [recordType],
    };
  };

  relationCriteria = () => {
    const { parentData, relateComponent } = this.props;
    const targetValueField = _.get(relateComponent, 'target_value_field', 'id');
    const relationValue = _.get(parentData, targetValueField);
    if (relationValue && !_.isEmpty(this.relationFieldDesc)) {
      return {
        field: _.get(this.relationFieldDesc, 'api_name'),
        operator: '==',
        value: [relationValue],
      };
    }
    return {};
  };

  getSearchCriteria = () => {
    const { relateComponent, parentData } = this.props;
    let searchCriteria = [];
    const recordTypeCriteria = this.recordTypeCriteria();
    if (!_.isEmpty(recordTypeCriteria)) {
      searchCriteria = _.concat(searchCriteria, recordTypeCriteria);
    }

    const relationCriteria = this.relationCriteria();
    if (!_.isEmpty(relationCriteria)) {
      searchCriteria = _.concat(searchCriteria, relationCriteria);
    }

    const defaultCriterias = _.get(relateComponent, 'default_filter_criterias.criterias', []);
    if (!_.isEmpty(defaultCriterias)) {
      searchCriteria = _.concat(searchCriteria, defaultCriterias);
    }

    searchCriteria = processCriterias(searchCriteria, {}, parentData);

    return searchCriteria;
  };

  //* 用于数据删除 删除级联 reducer中的数据和索引，以及本地的state的索引
  deleteModalData = (params, data) => {
    const { actions, pageType, pageTypeLevel } = this.props;
    const { dataListIndex } = this.state;

    const isTemporary = _.get(params, '_id', false);

    _.remove(dataListIndex, (e) => e == params.id);
    this.setState({ dataListIndex });

    //* 主页面进行删除
    if (pageTypeLevel === 'main' && pageType === 'detail' && !isTemporary) {
      const data = RecordService.deleteRecord({
        token: global.FC_CRM_TOKEN,
        objectApiName: this.objectApiName,
        id: _.get(params, 'id'),
      });
    } else {
      //* 只删除缓存数据，库里数据不删除，作为级联保存时delete
      if (isTemporary) {
        actions.cascadeDeleteData([
          {
            id: params.id,
            object_describe_name: this.objectApiName,
          },
        ]);
      }

      actions.cascadeUpdateStatus([params]);
    }
  };

  updateAction = (data) => {
    const { navigation, parentData, pageTypeLevel, pageType } = this.props;

    let params = {
      objectApiName: this.objectApiName,
      ...data,
    };

    if (pageTypeLevel === 'main' && pageType === 'detail') {
      navigation.navigate('Edit', { navParam: params });
    } else if (pageType === 'edit' || pageType === 'add') {
      params = _.assign({}, params, {
        parentData,
        _parentId: _.get(parentData, 'id'),
        related_list_name: this.related_list_name,
      });
      navigation.navigate('EditModal', { navParam: params });
    }
  };

  //* 滑动action 操作
  swipeAction = (action, data) => {
    const { parentData } = this.props;
    const actionType = _.toUpper(_.get(action, 'action'));

    if (actionType === 'DELETE') {
      const isTemporary = _.get(data, '_id');
      const id = _.get(data, 'id', _.get(data, '_id'));
      const params = {
        id,
        status: 'delete',
        objectApiName: this.objectApiName,
        _parentId: _.get(parentData, 'id'),
        related_list_name: this.related_list_name,
      };
      if (isTemporary) {
        _.set(params, '_id', isTemporary);
      }
      this.deleteModalData(params);
    } else if (actionType === 'EDIT') {
      this.updateAction(data);
    }
  };

  cbAddItem = (selected, actionLayout) => {
    const { parentData, dispatch } = this.props;
    const { dataListIndex } = this.state;
    const record_fields = _.get(actionLayout, 'record_fields', []);

    const _idMap = [];

    _.each(selected, (item, index) => {
      const _id = `${moment().valueOf()}-${index}`;
      const parentId = _.get(parentData, 'id');
      const recordFields = getRecordFields(record_fields, {}, parentData, item);
      const FORGE_DATA = getForgeData();
      const relateApiName = _.get(item, 'object_describe_name');
      const itemData = {
        ...FORGE_DATA,
        object_describe_name: this.objectApiName,
        [`${relateApiName}__r`]: item,
        _target_api_name: `${relateApiName}__r`,
      };

      // * 获取action中的record_field并赋值
      _.each(recordFields, ({ field, default_value }) => {
        //* __r存在一起带过来
        if (!_.isEmpty(_.get(item, `${field}__r`, {}))) {
          itemData[`${field}__r`] = _.get(item, `${field}__r`);
        }

        itemData[field] = default_value;
      });

      // * 维护本地显示的state
      _idMap.push(_id);
      handleUpdateCascade({
        data: itemData,
        relatedListName: this.related_list_name,
        status: CASCADE_CREATE,
        parentId,
        dispatch,
        fakeId: _id,
      });
    });

    this.setState({ dataListIndex: _.concat([], dataListIndex, _idMap) });
  };

  navgateRelateModal = (actionLayout) => {
    const { navigation, parentData, cascadeData } = this.props;
    const { dataListIndex } = this.state;
    let repeatList = [];

    const refObjDescribe = _.get(actionLayout, 'ref_obj_describe', '');

    if (refObjDescribe) {
      repeatList = _.map(dataListIndex, (item) =>
        _.get(cascadeData, `${item}.${refObjDescribe}`, ''),
      );
    }

    const params = {
      actionLayout,
      headername: this.headername,
      parentData,
      callback: this.cbAddItem,
      repeatList,
    };
    navigation.navigate('RelateModal', params);
  };

  navagateDetail = (item) => {
    const { pageType, parentData, pageTypeLevel, navigation } = this.props;

    const commomDetail = _.find(this.rowActions, (action) => _.get(action, 'action') === 'DETAIL');
    const relatedDetail = _.find(
      this.rowActions,
      (action) => _.get(action, 'action') === 'RELATEDDETAIL',
    );

    const actionDetail =
      (!_.isEmpty(commomDetail) && commomDetail) || (!_.isEmpty(relatedDetail) && relatedDetail);

    if (!actionDetail) return;

    const disabled_expression = _.get(actionDetail, 'disabled_expression', 'return false');
    const is_disable = checkExpression(disabled_expression, item, parentData);
    if (is_disable) return;

    let params = { objectApiName: this.objectApiName, ...item };

    if (actionDetail.action === 'RELATEDDETAIL') {
      const relatedDetailParams = this.getRelatedDetailParams(actionDetail, item);
      params = { ...params, ...relatedDetailParams };
      navigation.navigate('Detail', { navParam: { ...params, parentData, isTopLevel: false } });
    } else {
      if (pageType === 'edit' || pageType === 'add') {
        navigation.navigate('DetailModal', {
          navParam: {
            ...params,
            parentData,
            _parentId: _.get(parentData, 'id'),
            related_list_name: this.related_list_name,
          },
        });
      } else if (pageType === 'detail' && pageTypeLevel === 'main') {
        //* 从top层详情也进入下层详情页，只有top层详情页会清楚reducer级联数据

        navigation.navigate('Detail', {
          navParam: { ...params, parentData, isTopLevel: false, updataCallback: this.getInitData },
        });
      }
    }
  };

  getRelatedDetailParams = (detailAction, item) => {
    let targetApiName;
    let recordType;
    const actionRefObjectApiName = _.get(detailAction, 'ref_obj_describe', this.objectApiName);
    let recordId = _.get(detailAction, 'target_data_record_Id');
    let targetRecordType = _.get(
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
      targetRecordType = _.get(item, _.replace(recordType, /[$]/g, ''), 'master1');
    }
    return {
      objectApiName: targetApiName,
      record_type: targetRecordType,
      id: recordId,
    };
  };

  renderLine() {
    const lineStyle = {
      backgroundColor: '#c9c9c9',
      height: StyleSheet.hairlineWidth,
      width: '100%',
    };
    return <View style={lineStyle} />;
  }

  renderItem = (item, index, padlayout) => {
    const { parentData, component, relateComponent, pageType } = this.props;
    const key = `indexrecord-${_.get(item, 'id', _.get(item, '_id', Math.random()))}-${
      this.objectApiName
    }`;

    const paddingLeft = this.props.pageType === 'detail' ? 0 : 10;
    return (
      <View
        key={key}
        style={{
          paddingVertical: 10,
          paddingLeft,
        }}
      >
        <IndexSwiperRecord
          index={index}
          padlayout={padlayout}
          data={item}
          pageType={pageType}
          objectApiName={this.objectApiName}
          rowActions={this.rowActions}
          parentData={parentData}
          swipeAction={this.swipeAction}
          component={relateComponent}
          onPress={() => {
            this.navagateDetail(item);
          }}
        />
      </View>
    );
  };

  renderAddAction = (action, disabled) => (
    <ListItem noBoarder>
      <TouchableOpacity
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
        onPress={() => {
          if (disabled) return;
          this.navgateRelateModal(action);
        }}
      >
        <Icon name="ios-add-circle-outline" style={{ color: '#4990EC' }} />
        <Text style={{ marginLeft: 5, color: disabled ? '#c9c9c9' : '#333' }}>
          {_.get(action, 'label', '添加')}
        </Text>
      </TouchableOpacity>
    </ListItem>
  );

  renderAddActions = () => {
    const { modalActions, parentData, pageType, pageTypeLevel } = this.props;
    if (pageType === 'detail') return null;

    const addItem = [];
    _.each(modalActions, (action) => {
      //* 检查hidden_expression
      const hiddenExpression = _.get(action, 'hidden_expression', false);
      if (hiddenExpression && checkExpression(hiddenExpression, {}, parentData)) return null;
      const disabledExpression = _.get(action, 'disabled_expression', 'return false');
      const disabled = checkExpression(disabledExpression, {}, parentData);

      addItem.push(this.renderAddAction(action, disabled));
    });

    return !_.isEmpty(addItem) ? addItem : null;
  };

  rendercomponent = (dataMap) => {
    const { relateComponent } = this.props;
    const padlayout = _.get(relateComponent, 'padlayout');

    if (_.isEmpty(dataMap)) return null;
    if (!padlayout) {
      toastError(`${this.headername}需配置padlayout`);
      return;
    }

    return _.map(dataMap, (item, index) => this.renderItem(item, index, padlayout));
  };

  renderHeader = (dataMap) => {
    if (this.props.pageType === 'detail') {
      return this.renderHeader_detail(dataMap);
    } else {
      return this.renderHeader_edit(dataMap);
    }
  };

  renderHeader_detail = (dataMap) => {
    const { relateComponent } = this.props;
    const header = _.get(relateComponent, 'header', '');
    const rightNumText = I18n.t('List.TotalNItems').replace('%d', dataMap.length);
    return <DetailScreenSectionHeader text={header} rightNumText={rightNumText} />;
  };

  renderHeader_edit = (dataMap) => {
    const { relateComponent } = this.props;
    const header = _.get(relateComponent, 'header', '');

    return <SectionSeparator header={header} nums={dataMap.length} />;
  };

  render() {
    const { cascadeData } = this.props;
    const { dataListIndex } = this.state;
    const dataMap = [];

    _.each(dataListIndex, (itemKey) => {
      const key = _.isString(itemKey) ? itemKey : `${itemKey}`;
      const item = _.get(cascadeData, key, {});
      if (item && !_.isEmpty(item)) {
        dataMap.push(item);
      }
    });

    const componentElements = this.rendercomponent(dataMap);
    const actionsElements = this.renderAddActions();
    const allElements = _.compact(_.concat([], componentElements, actionsElements));

    const withSeparatorElements = [];
    for (let i = 0; i < allElements.length; i++) {
      if (i === 0) {
        // 第0条数据，顶部没有line
      } else {
        withSeparatorElements.push(this.renderLine());
      }
      withSeparatorElements.push(allElements[i]);
    }
    return (
      <View style={detailScreen_styles.sectionWrapperStyle}>
        {this.renderHeader(dataMap)}
        <View>{withSeparatorElements}</View>
      </View>
    );
  }
}

const select = (state, screen) => {
  const pageType = _.get(screen, 'pageType');

  const related_list_name = _.get(screen, 'relateComponent.related_list_name');

  //* 暂时用来处理编辑和新建状态下的刷新
  const cascadeData =
    pageType === 'add' || pageType === 'edit'
      ? _.cloneDeep(_.get(state, `cascade.cascadeList.${related_list_name}`, {}))
      : _.get(state, `cascade.cascadeList.${related_list_name}`, {});

  return {
    objectDescription: state.settings.objectDescription,
    cascadeData,
  };
};

const act = (dispatch, props) => ({
  actions: bindActionCreators(
    { cascadeUpdateData, cascadeDeleteAllData, cascadeUpdateStatus, cascadeDeleteData },
    dispatch,
  ),
  dispatch,
});

export default connect(select, act)(ModalActionView);
