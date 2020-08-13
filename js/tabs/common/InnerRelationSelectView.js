/**
 * Created by Uncle Charlie, 2018/01/16
 * @flow
 */

import React from 'react';
import { View, FlatList, Text, Image } from 'react-native';
import { Left, Spinner } from 'native-base';
import immutable from 'immutable';
import _ from 'lodash';
import RelationItem from './RelationItem';
import Constants from './Constants';
import HttpRequest from '../../services/httpRequest';
import { processCriterias } from '../../utils/criteriaUtil';
import themes from './theme';
import { NoMoreDataView, NoSearchDataView } from '../../components/hintView/NoDataView';
import * as Util from '../../utils/util';
import RelationService from '../../services/relationService';
import I18n from '../../i18n';

const JOINER_AND: string = 'and';

const RELATION_PAGE_SIZE = 50;

type Prop = {
  token: string,
  objectApiName: string,
  lookupLayout: any,
  criteria: ?Array<any>,
  queryName: ?string, // just like query string in web crm, maybe NOT NECESSARY
  handleSelection: (any) => void,
  selected: Array<any>,
  objectDescription: any,
  related: boolean,
  record: any,
  dataRecordType: any,
  preCriterias: any,
  sortDesc: { sortOrder: string, sortBy: string },
  existData: ?Array, //* 已存在的数据，需要将其排除
  updateRefreshStatus: void, //* 恢复刷新状态为false
  needRefresh: boolean, //* 控制刷新
};

type State = {
  data: ?Array<any>,
  refreshing: boolean,
  loadingMore: boolean,
  queryName: string,
  noMoreDatas: boolean,
  noData: boolean,
};

export default class InnerRelationSelectView extends React.PureComponent<Prop, State> {
  static defaultProps = {
    sortDesc: {
      sortOrder: 'desc',
      sortBy: 'update_time',
    },
  };

  processedCriteria: Array<any>;
  exceptionDataIds: Array<any>;
  allPageCount: number;
  dataCount: number;
  pageNo: number = Constants.FIRST_PAGE;
  resultCount: number;
  state: State = {
    data: [],
    refreshing: false,
    loadingMore: false,
    queryName: '',
    noMoreDatas: false,
    noData: false,
  };

  componentDidMount() {
    this.setState({ queryName: this.props.queryName }, () => {
      this.handleCriteria();
      this.onRefresh();
    });
  }

  componentWillReceiveProps(nextProps) {
    const { queryName, needRefresh: nextNeedRefresh } = nextProps;
    const { needRefresh, updateRefreshStatus = _.noop } = this.props;

    if (nextNeedRefresh && !needRefresh && _.isFunction(updateRefreshStatus)) {
      this.handleCriteria();
      this.onRefresh();
      updateRefreshStatus();
    }
    this.setState({ queryName });

    const preProps = this.props;
    this.props = nextProps;
    const changed = immutable.is(_.omit(preProps, ['selected']), _.omit(nextProps, ['selected']));
    if (changed) {
      this.handleCriteria();
      this.onRefresh();
    } else {
      this.forceUpdate();
    }
  }
  componentDidUpdate(prevProps, prevState) {
    const { queryName: preQueryName } = prevState;
    const { queryName } = this.state;
    if (preQueryName !== queryName) {
      this.handleCriteria();
      this.onRefresh();
    }
  }

  handleCriteria = () => {
    const {
      dataRecordType,
      criteria,
      queryName,
      lookupLayout,
      record,
      preCriterias = [],
    } = this.props;
    let queryCriteria = criteria || [];

    queryCriteria = _.concat(queryCriteria, preCriterias);
    if (!_.isEmpty(dataRecordType)) {
      queryCriteria = _.concat(queryCriteria, {
        field: 'record_type',
        operator: 'in',
        value: _.concat([], dataRecordType),
      });
    }
    if (!_.isEmpty(queryName)) {
      const containers = _.get(lookupLayout, 'containers');
      const components = containers[0];
      if (components) {
        queryCriteria = _.concat(queryCriteria, {
          field: 'name',
          operator: 'contains',
          value: [queryName],
        });
      }
    }
    const finalQueryCondition = [];
    //TODO 优化解析表达式
    //* 有2处使用表达式解析 processCriterias 和 executeDetailExp
    //* 且用于relation的表达式解析此处用的t,不应该是p吗？
    _.each(queryCriteria, (query) => {
      if (query.value && query.value['expression']) {
        const realValue = Util.executeDetailExp(query.value['expression'], record, record);
        finalQueryCondition.push({
          field: query.field,
          operator: query.operator,
          value: [realValue],
        });
      } else {
        finalQueryCondition.push(query);
      }
    });
    this.processedCriteria = processCriterias(finalQueryCondition, record);
  };

  onRefresh = async () => {
    if (this.state.loadingMore) {
      return;
    }

    this.setState({ refreshing: true, loadingMore: false });

    const {
      token,
      objectApiName,
      existData = [],
      sortDesc: { sortOrder = 'desc', sortBy = 'update_time' },
    } = this.props;

    this.pageNo = Constants.FIRST_PAGE;

    let exceptionDataIds = [];

    //* 已选中，需去除的id
    exceptionDataIds = _.concat(exceptionDataIds, existData);

    this.exceptionDataIds = exceptionDataIds;

    try {
      const data = await RelationService.getRelationData({
        token,
        objectApiName,
        criteria: this.processedCriteria,
        joiner: JOINER_AND,
        order: sortOrder,
        orderBy: sortBy,
        pageSize: RELATION_PAGE_SIZE,
        pageNo: this.pageNo,
      });

      const allData = _.get(data, 'result', []);
      this.dataCount = _.get(data, 'resultCount');
      this.allPageCount = _.get(data, 'pageCount');

      this.setState({
        data: allData,
        refreshing: false,
        loadingMore: false,
        noData: !allData.length,
      });
    } catch (e) {
      console.warn('### inner relation refresh ERROR', e);
    }
  };

  /**
   * TODO: 列表重构
   * 分页逻辑貌似有问题：
   * 目前的逻辑是：
   *   通过 pageSize 和 pageNo 来做分页控制，只要可以请求就自增
   * 问题分析：
   *   1. pageNo 的更改应当放在请求成功之后而不是可以请求时，这样可以避免发生异常（如 timeout）时 pageNo 的自增依然有效。
   *   2. 因为移动端交互的方式有限，所以我们可以采用不做条件判断，然后使用 res 为空数组来判断是否加载结束。
   *   3. 2 中的逻辑也可以封装出一个最 Base 的 FlatList.
   */
  onEndReached = async () => {
    if (this.state.refreshing) {
      return;
    }

    //* 超出最大页数不再请求
    if (this.pageNo && this.allPageCount && this.pageNo >= this.allPageCount) {
      this.setState({ noMoreDatas: true });
      return;
    }

    if (this.state.loadingMore) return;

    try {
      this.setState({ refreshing: false, loadingMore: true });
      this.pageNo += 1;
      const {
        token,
        objectApiName,
        sortDesc: { sortOrder = 'desc', sortBy = 'update_time' },
      } = this.props;
      const result = await RelationService.getRelationData({
        token,
        objectApiName,
        criteria: this.processedCriteria,
        joiner: JOINER_AND,
        order: sortOrder,
        orderBy: sortBy,
        pageSize: RELATION_PAGE_SIZE,
        pageNo: this.pageNo,
      });

      const requestData = _.get(result, 'result', []);

      const data = this.state.data ? _.concat(this.state.data, requestData) : requestData;

      this.setState({ data, loadingMore: false });

      if (data.length === this.resultCount) {
        this.noEndReached = true;
      }
    } catch (e) {
      console.warn('### inner relation refresh ERROR', e);
    }
  };

  keyExtractor = (item) => `${item.id}`;

  renderItem = ({ item }) => {
    const {
      selected = [],
      handleSelection,
      objectApiName,
      objectDescription,
      related,
    } = this.props;
    let isHave = false;
    _.each(selected, (sel) => {
      if (sel.id === item.id) {
        isHave = true;
      }
    });

    const repetition = _.includes(this.exceptionDataIds, _.get(item, 'id'), false);

    return (
      <RelationItem
        item={item}
        marked={!!isHave}
        repetition={repetition}
        handleSelection={handleSelection}
        phoneLayout={this.phoneLayout}
        objectApiName={objectApiName}
        objectDescription={objectDescription}
        related={related}
      />
    );
  };

  render() {
    const { data, refreshing, loadingMore, noMoreDatas, noData } = this.state;
    const { lookupLayout } = this.props;
    const component = _.get(lookupLayout, 'containers[0].components[0]', null);
    const phoneLayout = _.get(component, 'padlayout', null);
    this.component = component;
    this.phoneLayout = phoneLayout;
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'stretch' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: 30,
            backgroundColor: themes.fill_subheader,
            paddingHorizontal: 10,
          }}
        >
          <Left>
            <Text>{I18n.t('List.TotalNItems').replace('%d', this.dataCount || 0)}</Text>
          </Left>
        </View>
        {!noData ? (
          <FlatList
            style={{ alignSelf: 'stretch', flex: 1 }}
            keyExtractor={this.keyExtractor}
            data={data}
            extraData={this.state}
            renderItem={this.renderItem}
            onRefresh={this.onRefresh}
            refreshing={refreshing}
            onEndReached={this.onEndReached}
            onEndReachedThreshold={0.1}
            ListFooterComponent={
              loadingMore ? (
                <Spinner color="blue" />
              ) : noMoreDatas ? (
                <NoMoreDataView
                  NoMoreDataView
                  fromeDataView
                  style={{ backgroundColor: '#fff' }}
                  tip="没有更多数据"
                  isNormalSized
                />
              ) : null
            }
          />
        ) : (
          <NoSearchDataView />
        )}
      </View>
    );
  }
}
