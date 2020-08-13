/**
 * @flow
 * * 用list加载远程数据
 */

import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { Spinner, Left } from 'native-base';
import _ from 'lodash';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { NoSearchDataView, NoMoreDataView } from '../hintView/NoDataView';
import LoadingView from '../hintView/LoadingView';
import themes from '../../tabs/common/theme';
import { refrshList, clearList, ONENDREACHED_STATUS, REFRESH_STATUS } from '../../actions/lists';
import I18n from '../../i18n';

type Props = {
  objectApiName: string,
  criterias: Array,
  order: ?string,
  orderBy: ?string,
  renderItem: ({ item: any, index: number }) => Component,
  loading: boolean,
  loadingMore: boolean,
  dataList: any,
  resultCount: number,
  pageNo: number,
  style: any,
  pageCount: number,
  extraData: any,
  ignoreNumHeader: boolean,
  actions: {
    clearListAction: void,
    refrshListAction: ({ payload: any, status: string, pageCount: number }) => void,
  },
};

type State = {
  selected: Array,
  layout: object,
};

class ListDataView extends React.Component<Props, State> {
  componentDidMount() {
    this.refrsh(REFRESH_STATUS)();
  }

  componentWillUnmount() {
    const { actions } = this.props;
    actions.clearListAction();
  }

  componentDidUpdate(preProps) {
    const preCri = _.get(preProps, 'criterias');
    const currentCri = _.get(this.props, 'criterias');

    if (!_.isEqual(preCri, currentCri)) {
      this.refrsh(REFRESH_STATUS)();
    }
  }

  refrsh = (status) => () => {
    const {
      objectApiName,
      criterias,
      order = 'desc',
      orderBy = 'create_time',
      actions,
      pageNo,
      loading,
      loadingMore,
      pageCount,
    } = this.props;

    if (loading || loadingMore) return;

    const payload = {
      token: global.FC_CRM_TOKEN,
      objectApiName,
      criteria: criterias,
      joiner: 'and',
      orderBy,
      order,
      pageSize: 20,
      pageNo,
    };

    actions.refrshListAction({ payload, status, pageCount });
  };

  renderComponent = () => {
    const {
      renderItem,
      resultCount,
      dataList,
      loadingMore,
      pageCount,
      loading,
      pageNo,
      style = {},
      ignoreNumHeader = false,
      extraData = {},
    } = this.props;

    if (_.isEmpty(dataList)) {
      return <NoSearchDataView />;
    }

    return (
      <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'stretch', ...style }}>
        {!ignoreNumHeader && (
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
              <Text>{I18n.t('List.TotalNItems').replace('%d', resultCount || 0)}</Text>
            </Left>
          </View>
        )}
        <FlatList
          style={{ alignSelf: 'stretch' }}
          data={dataList}
          extraData={extraData}
          renderItem={renderItem}
          onRefresh={this.refrsh(REFRESH_STATUS)}
          refreshing={loading}
          onEndReached={this.refrsh(ONENDREACHED_STATUS)}
          onEndReachedThreshold={0.01}
          ListFooterComponent={
            loadingMore ? (
              <Spinner color="blue" />
            ) : pageNo === pageCount ? (
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
      </View>
    );
  };

  render() {
    const { dataList } = this.props;
    return dataList === '' ? <LoadingView /> : this.renderComponent();
  }
}

const select = (state, screen) => {
  const key = _.get(screen, 'navigation.state.key');
  return {
    loading: _.get(state, `list.${key}.loading`, false),
    loadingMore: _.get(state, `list.${key}.loadingMore`, false),
    dataList: _.get(state, `list.${key}.result`, ''),
    resultCount: _.get(state, `list.${key}.resultCount`, 0),
    pageCount: _.get(state, `list.${key}.pageCount`, 1),
    pageNo: _.get(state, `list.${key}.pageNo`, 0),
    objectDescription: state.settings.objectDescription,
    permission: state.settings.permission,
  };
};

const act = (dispatch, { navigation }) => {
  const key = _.get(navigation, 'state.key');
  return {
    actions: bindActionCreators(
      {
        refrshListAction: refrshList(key),
        clearListAction: clearList(key),
      },
      dispatch,
    ),
  };
};

export default connect(select, act)(ListDataView);
