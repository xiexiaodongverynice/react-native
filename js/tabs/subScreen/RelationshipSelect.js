/**
 * Create by Uncle Charlie, 2017/12/28
 * @flow
 */

import React from 'react';
import { Text } from 'react-native';
import { connect } from 'react-redux';
import _ from 'lodash';
import { Body, Button, Title, Right } from 'native-base';
import moment from 'moment';
import I18n from '../../i18n';
import LoadingScreen from '../common/LoadingScreen';
import Constants from '../common/Constants';
import InnerRelationSelectView from '../common/InnerRelationSelectView';
import themes from '../common/theme';
import FilterEntranceView from '../../components/filter/FilterEntranceView';
import { StyledContainer, HeaderLeft, StyledHeader } from '../common/components';
import RelationService from '../../services/relationService';

type Prop = {
  token: string,
  navigation: {
    goBack: () => void,
    state: {
      params: {
        targetRecordType: string,
        fieldLayout: { target_filter_criterias: Array<any> },
        apiName: string,
        related?: boolean,
        radio?: boolean,
        multipleSelect?: boolean,
        callback: (selected: Array<any>) => void,
        hiddenClear?: boolean,
        dataRecordType?: string,
        record: any,
        preCriterias: any,
        existData: any,
      },
    },
  },
  objectDescription: any,
};

type State = {
  selected: Array<any>,
  pageLayout: ?any,
  queryName: ?string,
};

class RelationshipSelect extends React.Component<Prop, State> {
  pageNo: number = Constants.FIRST_PAGE;
  criteria: ?Array<any>;
  state: State = {
    selected: [],
    pageLayout: null,
    queryName: '',
    sortBy: 'update_time',
    sortOrder: 'desc',
    criteria: [],
    needRefresh: false,
  };

  async componentDidMount() {
    const { navigation } = this.props;
    const { targetRecordType, fieldLayout, apiName } = navigation.state.params;
    const targetCriteria = _.get(fieldLayout, 'target_filter_criterias');
    this.objectApiName = apiName;
    this.initCriteria = _.get(targetCriteria, 'criterias', []);

    const pageLayout = await RelationService.getRelationLayout({
      objectApiName: apiName,
      recordType: targetRecordType,
    });

    const component = _.get(pageLayout, 'containers[0].components[0]', null);

    const filterSortMap = _.get(component, 'filter_sort', []);

    //* 初始获取order和orderby优先级
    //* 配置排序筛选 > default_sort_by/default_sort_order > orderBy/order
    //* 不配置则默认为 update_time/desc
    const sortBy = _.get(
      filterSortMap,
      '0.sort_by',
      _.get(component, 'default_sort_by', _.get(component, 'orderBy', 'update_time')),
    );
    const sortOrder = _.get(
      filterSortMap,
      '0.sort_order',
      _.get(component, 'default_sort_order', _.get(component, 'order', 'desc')),
    );

    this.setState({ pageLayout, sortBy, sortOrder, criteria: this.initCriteria });
  }

  componentWillUnmount() {
    const { navigation } = this.props;
    const clearTime = _.get(navigation, 'state.params.clearTime');
    if (_.isFunction(clearTime)) {
      clearTime();
    }
  }

  handleSelection = (item) => {
    const { navigation } = this.props;
    const { params } = navigation.state;
    let { selected = [] } = this.state;
    const { related, radio } = params;
    if (related) {
      let selectArray = selected;
      // item['fakeId'] = moment().valueOf();
      let is_have = false;
      _.each(selectArray, (select) => {
        if (select && select.id === item.id) {
          selectArray.splice(selectArray.indexOf(item), 1);
          is_have = true;
        }
      });
      if (!is_have) {
        //* 如果是radio 只能选一个
        if (radio) {
          selectArray = [item];
        } else {
          selectArray.push(item);
        }
      }
      const callback = _.get(params, 'callback');
      if (!callback) {
        console.warn('### callback method is needed');
        return;
      }
      this.setState({
        selected: selectArray,
      });
    } else {
      console.log('===>handleSelection selected & item & state > ', selected, item, this.state);

      selected = selected && _.isArray(selected) ? selected.push(item) : [item];
      this.setState({
        selected,
      });
      const callback = _.get(params, 'callback');
      if (!callback) {
        console.warn('### callback method is needed');
        return;
      }
      callback({
        selected: [item],
        multipleSelect: params.multipleSelect,
        apiName: params.apiName,
      });
      navigation.goBack();
    }
  };

  handleClear = () => {
    const { navigation } = this.props;
    const { params } = navigation.state;
    const callback = _.get(params, 'callback');
    if (!callback) {
      console.warn('### callback method is needed');
      return;
    }

    callback({
      selected: [],
      multipleSelect: params.multipleSelect,
      apiName: params.apiName,
    });
    navigation.goBack();
  };

  controlListRefresh = () => {
    this.setState({ needRefresh: true });
  };

  renderContent = () => {
    if (!this.state.pageLayout) {
      return <LoadingScreen />;
    }

    const { token, navigation } = this.props;
    const {
      targetRecordType,
      apiName,
      dataRecordType,
      record,
      related,
      preCriterias,
      existData,
    } = navigation.state.params;

    const { queryName, needRefresh, sortOrder, sortBy, criteria } = this.state;

    return (
      <InnerRelationSelectView
        objectApiName={apiName}
        lookupLayout={this.state.pageLayout}
        token={token}
        objectDescription={this.props.objectDescription}
        targetRecordType={targetRecordType}
        dataRecordType={dataRecordType}
        criteria={criteria}
        queryName={queryName}
        selected={this.state.selected}
        handleSelection={this.handleSelection}
        record={record}
        related={related}
        preCriterias={preCriterias}
        existData={existData}
        sortDesc={{ sortOrder, sortBy }}
        needRefresh={needRefresh}
        updateRefreshStatus={() => {
          this.setState({ needRefresh: false });
        }}
      />
    );
  };

  confirmPress = _.debounce(
    () => {
      const { navigation } = this.props;
      const { callback } = navigation.state.params;
      const { params } = navigation.state;
      const otherGoBack = _.get(params, 'otherGoBack', false);
      if (otherGoBack) {
        callback(this.state.selected, navigation);
      } else {
        callback(this.state.selected);
        navigation.goBack();
      }
    },
    2000,
    { leading: true },
  );

  handleFilter = (filterFiledData) => {
    const composeCriteria = _.concat(this.initCriteria, filterFiledData);
    this.setState({ criteria: composeCriteria }, () => {
      this.controlListRefresh();
    });
  };

  handleOrder = (filterSortData) => {
    const { sortOrder, sortBy } = filterSortData;
    this.setState({ sortOrder, sortBy }, () => {
      this.controlListRefresh();
    });
  };

  renderClearOrEnsureBtnView = () => {
    const { navigation } = this.props;
    const { related, hiddenClear = false } = navigation.state.params;
    let handler = _.noop;
    let btnMessage = '';
    if (related) {
      handler = this.confirmPress;
      btnMessage = I18n.t('common_sure');
    } else {
      btnMessage = !hiddenClear ? I18n.t('Header.Clear') : '';
      handler = this.handleClear;
    }
    return (
      <Button style={{ paddingLeft: 0 }} transparent onPress={handler}>
        <Text style={{ color: themes.title_text_color }}>{btnMessage}</Text>
      </Button>
    );
  };

  render() {
    const { pageLayout, sortBy, sortOrder } = this.state;
    const { navigation } = this.props;

    const component = _.get(pageLayout, 'containers[0].components[0]', {});
    const header = _.get(pageLayout, 'containers[0].components[0].header', '选择列表');

    return (
      <StyledContainer style={{ backgroundColor: themes.fill_base }}>
        <StyledHeader>
          <HeaderLeft navigation={navigation} />
          <Body style={{ flex: 1 }}>
            <Title
              style={{
                color: themes.title_text_color,
                fontSize: themes.title_size,
              }}
            >
              {header}
            </Title>
          </Body>
          <Right
            style={{
              flex: 1,
            }}
          >
            {pageLayout && !_.isEmpty(pageLayout) && (
              <FilterEntranceView
                layout={component}
                objectApiName={this.objectApiName}
                handleFilter={this.handleFilter}
                handleOrder={this.handleOrder}
                sortDes={{ sortBy, sortOrder }}
                location="right"
              />
            )}
            {this.renderClearOrEnsureBtnView()}
          </Right>
        </StyledHeader>
        {pageLayout && !_.isEmpty(pageLayout) && (
          <FilterEntranceView
            layout={component}
            objectApiName={this.objectApiName}
            handleFilter={this.handleFilter}
            handleOrder={this.handleOrder}
            sortDes={{ sortBy, sortOrder }}
            location="bottom"
          />
        )}
        {this.renderContent()}
      </StyledContainer>
    );
  }
}

const select = (state) => ({
  token: state.settings.token,
  objectDescription: state.settings.objectDescription,
});

export default connect(select)(RelationshipSelect);
