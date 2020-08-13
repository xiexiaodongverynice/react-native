/**
 * @flow
 * * 用于相关列表relation选择
 */

import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { Body, Button, Icon, Left, Right, Title, Spinner } from 'native-base';
import _ from 'lodash';

import themes from '../common/theme';

import LayoutHelper from '../common/helpers/layoutHelper';
import Common from '../../utils/constants';
import { toastWaring } from '../../utils/toast';
import HttpRequest from '../../services/httpRequest';
import { processCriterias } from '../../utils/criteriaUtil';
import { StyledContainer, StyledHeader } from '../common/components';
import IndexRecord from '../common/components/indexComponents/IndexRecord';
import LoadingScreen from '../common/LoadingScreen';
import { NoSearchDataView, NoMoreDataView } from '../../components/hintView/NoDataView';
import CheckBox from '../common/components/CheckBox';
import FilterEntranceView from '../../components/filter/FilterEntranceView';
import I18n from '../../i18n';

type Props = {
  navigation: {
    goBack: void,
    state: {
      params: {
        headername: string,
        actionLayout: any,
        parentData: any,
        repeatList: Array, //多选最大数量
        callback: ?void,
      },
    },
  },
};

type State = {
  dataList: Array,
  selected: Array,
  layout: object,
};

export default class RelateModalScreen extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    const { navigation } = props;
    this.actionLayout = _.get(navigation, 'state.params.actionLayout', {});
    this.parentData = _.get(navigation, 'state.params.parentData', {});
    this.repeatList = _.get(navigation, 'state.params.repeatList', []);
    this.objectApiName = _.get(this.actionLayout, 'ref_obj_describe', '');
    this.baseCriteria = _.get(this.actionLayout, 'target_filter_criterias.criterias', []).slice();
    this.composedCriteria = this.baseCriteria;
    this.queryParams = {
      token: global.FC_CRM_TOKEN,
      joiner: 'and',
      orderBy: 'create_time',
      order: 'desc',
      objectApiName: this.objectApiName,
      pageSize: 50,
    };

    this.padLayout = {};

    this.pageNo = 1;
    this.pageCount = 0;

    this.state = {
      layout: {},
      dataList: '',
      selected: [],
      refreshing: false,
      loadingMoreing: false,
    };
  }

  componentDidMount() {
    this.init();
  }

  /**
   * 将两个 async 函数组合起来，但是 refresh 需要的是
   * setLayout 中的 layout
   */
  init() {
    this.setLayout().then(this.refrsh);
  }

  refrsh = async () => {
    this.setState({ refreshing: true });

    this.pageNo = 1;

    const res = await this.fetchData();
    const resultData = _.get(res, 'result', []);
    this.pageCount = _.get(res, 'pageCount', 1);

    this.setState({ dataList: resultData, refreshing: false });
  };

  onEndReached = async () => {
    const { dataList, refreshing, loadingMoreing } = this.state;
    if (refreshing || loadingMoreing || this.pageNo >= this.pageCount) return;

    this.pageNo += 1;
    this.setState({ loadingMoreing: true });

    const res = await this.fetchData();
    const resData = _.get(res, 'result', []);
    const resultData = _.concat(dataList, resData);
    this.setState({ dataList: resultData, loadingMoreing: false });
  };

  fetchData = (rest: Object = {}) =>
    HttpRequest.query({
      ...this.queryParams,
      criteria: processCriterias(this.composedCriteria, {}, this.parentData),
      pageNo: this.pageNo,
      ...rest,
    });

  setLayout = async () => {
    const { navigation } = this.props;
    const layoutResult = await LayoutHelper.getLayout({
      objectApiName: _.get(this.actionLayout, 'ref_obj_describe', ''),
      layoutType: Common.layoutTypeRelationLookup,
      recordType: _.get(this.actionLayout, 'target_data_record_type', ''),
      navigation,
    });
    if (!_.isEmpty(layoutResult)) {
      this.setState({ layout: layoutResult });
      const component = _.get(layoutResult, 'containers[0].components[0]');
      this.sortOrder = _.get(
        component,
        'sort_order',
        _.get(component, 'default_sort_order', 'desc'),
      );
      this.sortBy = _.get(component, 'sort_by', _.get(component, 'default_sort_by', 'create_time'));

      this.queryParams = { ...this.queryParams, orderBy: this.sortBy, order: this.sortOrder };
    }
    return layoutResult;
  };

  changeCheck = (id) => {
    let { selected } = this.state;
    const multiple_select = _.get(this.actionLayout, 'multiple_select', false);
    if (!id) return;

    if (_.includes(selected, id)) {
      _.remove(selected, (e) => e === id);
    } else {
      if (multiple_select) {
        selected.push(id);
      } else {
        selected = [id];
      }
    }

    this.setState({ selected });
  };

  //* 触发筛选
  handleFilter = (filters) => {
    this.composedCriteria = this.composeArr(this.baseCriteria, filters);
    this.refrsh();
  };

  /**
   * 合并条件(将 arr2 合并进 arr1，对于指定的字段如果存在，则覆盖)
   * [{a: 1}, {a: 3}, {a: 0}], [{a: 1}, {a: 9}, {a: 7}]
   * 合并结果：[{a: 1}, {a: 3}, {a: 0}, {a: 9}, {a: 7}]
   */
  composeArr = (arr1, arr2) => {
    const tmpObj = {};
    _.each(arr1, (e) => {
      tmpObj[e.field] = e;
    });
    _.each(arr2, (e) => {
      tmpObj[e.field] = e;
    });
    return _.values(tmpObj);
  };

  selectDone = () => {
    const { selected, dataList } = this.state;
    const { navigation } = this.props;
    const callback = _.get(navigation, 'state.params.callback');

    const goback = (data = []) => {
      if (_.isFunction(callback)) {
        callback(data, this.actionLayout);
        navigation.goBack();
      } else {
        navigation.goBack();
      }
    };

    if (_.isEmpty(selected)) {
      goback();
      return;
    }
    const selectedData = _.map(selected, (item) => _.find(dataList, (e) => e.id === item));
    goback(selectedData);
  };

  renderItem = ({ item, index }) => {
    const { selected } = this.state;
    const checked = _.includes(selected, _.get(item, 'id'));
    const repetition = _.includes(this.repeatList, _.get(item, 'id'), false);
    const repeat_record_alert = _.get(this.actionLayout, 'repeat_record_alert', '请勿重复选择');
    const maxSelectedMark = _.get(global.CRM_SETTINGS, 'batch_plan_limit', 0);
    // 如果有最大选择属性
    // 防重复禁用 _.includes(this.repeatList, _.get(item, 'id'), false)
    // 超过最大限制禁用 selected.length > max
    // 已选择的不禁用 _.includes(selected, _.get(item, 'id'))
    // 不超过最大限制 重新解禁
    // * 目前业务需求每次可选选择的最大条件没有减去repeatList（重复的数据）
    let selectedMark = false;
    if (repetition) {
      selectedMark = true;
    } else {
      if (maxSelectedMark) {
        selectedMark = selected.length > maxSelectedMark - 1 && !checked;
      } else {
        selectedMark = false;
      }
    }

    return (
      <View
        key={`${this.objectApiName}-${index}`}
        style={{
          borderBottomColor: '#333',
          borderBottomWidth: 0.5,
          paddingVertical: 10,
          paddingLeft: 10,
        }}
      >
        <CheckBox
          handleCheck={() => {
            if (repetition) {
              toastWaring(repeat_record_alert);
            } else if (selectedMark) {
              toastWaring(`一次最多可选择${maxSelectedMark}个医生`);
            } else {
              this.changeCheck(_.get(item, 'id'));
            }
          }}
          repetition={selectedMark}
          checked={checked}
          style={{
            flex: 3,
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexDirection: 'row',
          }}
          iconStyle={{
            marginRight: 10,
          }}
        >
          <IndexRecord
            index={index}
            padlayout={this.padLayout}
            data={item}
            objectApiName={this.objectApiName}
          />
        </CheckBox>
      </View>
    );
  };

  renderComponent = () => {
    const { dataList, layout, loadingMoreing } = this.state;
    this.padLayout = _.get(layout, 'containers[0].components[0].padlayout');
    if (_.isEmpty(this.padLayout)) {
      this.padLayout = { title: { type: 'text', value: 'name' } };
      toastWaring('请配置该查询布局,如无配置默认只显示name');
    }

    if (_.isEmpty(dataList)) {
      return <NoSearchDataView />;
    }

    return (
      <FlatList
        style={{ alignSelf: 'stretch', flex: 1 }}
        data={dataList}
        renderItem={this.renderItem}
        onRefresh={this.refrsh}
        refreshing={this.state.refreshing}
        onEndReached={this.onEndReached}
        onEndReachedThreshold={0.01}
        ListFooterComponent={
          loadingMoreing ? (
            <Spinner color="blue" />
          ) : this.pageNo === this.pageCount ? (
            <NoMoreDataView
              NoMoreDataView
              fromeDataView
              style={{ backgroundColor: '#fff' }}
              isNormalSized
            />
          ) : null
        }
      />
    );
  };

  render() {
    const { navigation } = this.props;
    const { layout, dataList } = this.state;
    const headerName = _.get(layout, 'containers[0].components[0].header', '');
    const component = _.get(layout, 'containers[0].components[0]', {});

    return (
      <StyledContainer style={{ backgroundColor: themes.fill_base }}>
        <StyledHeader>
          <Left style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <Button
              transparent
              onPress={() => {
                navigation.goBack();
              }}
            >
              <Icon
                name="ios-arrow-back"
                style={{
                  color: themes.title_icon_color,
                  fontSize: themes.font_header_size,
                }}
              />
            </Button>
          </Left>
          <Body style={{ alignItems: 'center', flex: 1 }}>
            <Title style={{ color: '#fff' }}>{headerName}</Title>
          </Body>
          <Right style={{ flex: 1 }}>
            {layout && !_.isEmpty(layout) && (
              <FilterEntranceView
                layout={component}
                objectApiName={this.objectApiName}
                handleFilter={this.handleFilter}
                sortDes={{ sortBy: this.sortBy, sortOrder: this.sortOrder }}
                location="right"
              />
            )}
            <Button transparent onPress={this.selectDone}>
              <Text style={{ color: themes.title_text_color }}>{I18n.t('common_sure')}</Text>
            </Button>
          </Right>
        </StyledHeader>
        <View style={{ flex: 1 }}>
          {_.isEmpty(layout) || !dataList ? <LoadingScreen /> : this.renderComponent()}
        </View>
      </StyledContainer>
    );
  }
}
