/*
 * 用于datasource 查询
 * @flow
 */

import React from 'react';
import { Text, View } from 'react-native';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import _ from 'lodash';
import { Body, Button, Container, Content, Right } from 'native-base';
import { HeaderLeft, StyledHeader } from '../common/components';
import { refrshList, REFRESH_STATUS } from '../../actions/lists';
import I18n from '../../i18n';
import ListDataView from '../../components/list/ListDataView';
import OptionItem from '../common/OptionItem';
import themes from '../common/theme';
import FilterEntranceView from '../../components/filter/FilterEntranceView';
import { executeDetailExp } from '../../utils/util';
import { processCriterias } from '../../utils/criteriaUtil';

const STATUS_CLEAR = 'clear';

type Prop = {
  navigation: {
    goBack: () => void,
    state: {
      params: {
        apiName: string,
        fieldDesc: any,
        fieldLayout: any,
        targetRecordType: Array,
        dataRecordType: Array,
        multipleSelect: any,
        callback: () => void,
        selected: Array,
        record: any,
      },
    },
  },
  actions: {
    optionAction: (selected: ?Array<any>) => { type: string, payload: any },
    refrshListAction: () => void,
  },
};

type State = {
  selected: Array<any>,
};

class DataSourceListScreen extends React.Component<Prop, State> {
  state = {
    selected: [],
    initEnd: false,
    sortBy: '',
    sortOrder: '',
  };

  componentDidMount = () => {
    const { navigation } = this.props;
    const { params } = navigation.state;
    this.multipleSelect = _.get(params, 'multipleSelect');
    this.apiName = _.get(params, 'apiName');
    this.parentData = _.get(params, 'record', {});
    this.fieldLayout = _.get(params, 'fieldLayout', {});
    this.dataSource = _.get(this.fieldLayout, 'data_source', {});
    this.criterias = processCriterias(_.get(this.dataSource, 'criterias', []), this.parentData);

    //* 当selected为null进行如下处理
    const selected = _.get(params, 'selected') ? _.cloneDeep(_.get(params, 'selected')) : [];

    const sortBy =
      _.get(this.dataSource, 'filter_sort.0.sort_by') ||
      _.get(this.dataSource, 'default_sort_by', 'update_time');
    const sortOrder =
      _.get(this.dataSource, 'filter_sort.0.sort_order') ||
      _.get(this.dataSource, 'default_sort_order', 'desc');

    this.setState({
      selected,
      sortBy,
      sortOrder,
      criterias: this.criterias,
      initEnd: true,
    });
  };

  getRenderName = (targetFieldObj) => {
    const labelExp = _.get(this.fieldLayout, 'render_label_expression', '');
    return labelExp ? executeDetailExp(labelExp, targetFieldObj) : targetFieldObj.name;
  };

  handleSelection = (item) => {
    const { selected } = this.state;

    if (!this.multipleSelect) {
      this.setState(
        {
          selected: [item],
        },
        this.selectDone,
      );
    } else {
      const newSelected = selected.slice();
      const exists = _.findIndex(newSelected, item);
      if (exists >= 0) {
        newSelected.splice(exists, 1);
      } else {
        newSelected.push(item);
      }

      this.setState({
        selected: newSelected,
      });
    }
  };

  selectDone = (status) => {
    const { navigation } = this.props;
    const { params } = navigation.state;
    const resultSelected = status === STATUS_CLEAR ? [] : this.state.selected;
    params.callback({
      selected: resultSelected,
      multipleSelect: this.multipleSelect,
      apiName: this.apiName,
    });

    navigation.goBack();
  };

  refrshList = () => {
    const { actions } = this.props;
    const { criterias, sortBy, sortOrder } = this.state;

    const payload = {
      token: global.FC_CRM_TOKEN,
      objectApiName: _.get(this.dataSource, 'object_api_name'),
      criteria: criterias,
      joiner: 'and',
      orderBy: sortBy,
      order: sortOrder,
      pageSize: 20,
      pageNo: 0,
    };

    actions.refrshListAction({ payload, status: REFRESH_STATUS, pageCount: 1 });
  };

  handleFilter = (filterFileds) => {
    if (_.isEmpty(filterFileds)) {
      this.setState({ criterias: this.criterias }, this.refrshList);
    } else {
      this.setState({ criterias: _.concat([], this.criterias, filterFileds) }, this.refrshList);
    }
  };

  handleOrder = (sortMap) => {
    if (_.isEmpty(sortMap)) return;

    const sortBy = _.get(sortMap, 'sortBy', 'update_time');
    const sortOrder = _.get(sortMap, 'sortOrder', 'desc');
    this.setState({ sortBy, sortOrder }, this.refrshList);
  };

  renderItem = ({ item, index }) => {
    const { selected } = this.state;

    const key = item.value ? `${item.value}` : `${item.id}`;

    let targetFieldObj = item;

    const target_field = _.get(this.dataSource, 'target_field', '');
    if (target_field) {
      targetFieldObj = _.get(item, target_field);
    }

    const params = {
      label: this.getRenderName(targetFieldObj),
      value: targetFieldObj.id.toString(),
    };

    let exists;
    if (params.value) {
      exists = _.find(selected, (sl) => sl.value === params.value);
    } else if (params.id) {
      exists = _.find(selected, (sl) => sl.id === params.id);
    }

    return (
      <OptionItem
        key={`${key}`}
        item={params}
        multipleSelect={this.multipleSelect}
        marked={!!exists}
        handleSelection={this.handleSelection}
      />
    );
  };

  render() {
    const { criterias, sortOrder, sortBy, initEnd, selected } = this.state;
    const { navigation } = this.props;
    const { params } = navigation.state;
    const pageTitle = _.get(params, 'fieldDesc.label', '选择');

    return (
      <Container style={{ backgroundColor: themes.fill_base }}>
        <StyledHeader>
          <HeaderLeft navigation={navigation} />
          <Body style={{ alignItems: 'center', flex: 1 }}>
            <Text
              style={{
                color: themes.title_text_color,
                fontSize: 16,
              }}
            >
              {pageTitle}
            </Text>
          </Body>
          <Right>
            {initEnd && (
              <FilterEntranceView
                layout={this.dataSource}
                objectApiName={_.get(this.dataSource, 'object_api_name')}
                handleFilter={this.handleFilter}
                handleOrder={this.handleOrder}
                sortDes={{ sortBy, sortOrder }}
                location="right"
              />
            )}
            {this.multipleSelect ? (
              <Button transparent onPress={() => this.selectDone()}>
                <Text style={{ color: themes.title_text_color }}>{I18n.t('common_sure')}</Text>
              </Button>
            ) : (
              <Button transparent onPress={() => this.selectDone(STATUS_CLEAR)}>
                <Text style={{ color: themes.title_text_color }}>{I18n.t('Header.Clear')}</Text>
              </Button>
            )}
          </Right>
        </StyledHeader>
        <View style={{ flex: 1 }}>
          {initEnd && (
            <FilterEntranceView
              layout={this.dataSource}
              objectApiName={_.get(this.dataSource, 'object_api_name')}
              handleFilter={this.handleFilter}
              handleOrder={this.handleOrder}
              sortDes={{ sortBy, sortOrder }}
              location="bottom"
            />
          )}
          {initEnd && (
            <ListDataView
              objectApiName={_.get(this.dataSource, 'object_api_name')}
              criterias={criterias}
              extraData={selected}
              order={sortOrder}
              orderBy={sortBy}
              navigation={navigation}
              renderItem={this.renderItem}
            />
          )}
        </View>
      </Container>
    );
  }
}

const act = (dispatch, { navigation }) => {
  const key = _.get(navigation, 'state.key');
  return {
    actions: bindActionCreators(
      {
        refrshListAction: refrshList(key),
      },
      dispatch,
    ),
  };
};

export default connect(null, act)(DataSourceListScreen);
