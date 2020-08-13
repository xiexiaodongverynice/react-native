/**
 * * 拜访计划模板
 * @flow
 */

import React from 'react';
import moment from 'moment';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import ScrollableTabView from 'react-native-scrollable-tab-view';
import themes from '../../../tabs/common/theme';
import TabHaeader from './TabHaeader';
import InnerView from './InnerView';
import LoadingView from '../../hintView/LoadingView';
import CallPlanService from '../../../services/callPlanService';
import handleUpdateCascade, { CASCADE_INIT } from '../../../utils/helpers/handleUpdateCascade';
import recordService from '../../../services/recordService';

type Props = {
  components: any,
  parentRecord: any,
  pageType: string,
  defaultCalenderTime: any,
  field_section: any,
  dispatch: void,
  cascadeList: any,
  terminationTime: number,
  handleSectionData: ({}) => void,
};

type States = {
  loadStatus: boolean,
  dateStart: string,
  monthNum: Array,
  refreshList: boolean, // * 用于detail 下删除数据后刷新页面
  callPathRecordType: {
    profile: string,
    record_type: [
      {
        key: string,
        value: string,
      },
    ],
  },
};

class DayCalenderScreen extends React.Component<Props, States> {
  //* 兼容之前老旧版本日历排序，从周日改为从周一开始
  oldWeekDays = ['日', '一', '二', '三', '四', '五', '六'];
  newWeekDays = ['一', '二', '三', '四', '五', '六', '日'];
  monthNum = [];

  state = {
    loadStatus: this.props.pageType !== 'add',
    monthNum: [],
    dateStart: '',
    refreshList: false,
    callPathRecordType: {},
  };

  componentDidMount = () => {
    const { field_section, components } = this.props;
    this.setDate();
    this.refreshData();
    this.getCallPathRecordType();

    this.relatedListName = _.get(field_section, 'related_list_name');
    this.relatedLayoutComponent = _.filter(
      components,
      (com) => _.get(com, 'related_list_name') === this.relatedListName,
    );
  };

  componentWillReceiveProps(nextProps) {
    const { terminationTime, pageType } = this.props;
    const { terminationTime: nextTerminationTime } = nextProps;

    if (pageType === 'detail' && nextTerminationTime > terminationTime) {
      this.refreshData();
    }
  }

  //* 获取在全局配置的拜访路线 简档对应的 record_type
  getCallPathRecordType = async () => {
    const { pageType } = this.props;

    if (pageType === 'detail') return;
    const recordTypeMap = await CallPlanService.getCallPathRecordType();
    this.setState({ callPathRecordType: _.get(recordTypeMap, 'mapping_list', {}) });
  };

  handleRefreshView = () => {
    this.setState((prevState) => ({ refreshList: !prevState.refreshList }));
  };

  setDate = () => {
    const { parentRecord = {}, pageType, handleSectionData } = this.props;

    let date;
    if (pageType === 'add') {
      const offset = moment().day() || 7;
      date = moment()
        .add(8 - offset, 'days')
        .valueOf();
    } else {
      date = parentRecord['start_date'];
    }

    const dateStart = moment(date).format('YYYY-MM-DD');
    const endDate = moment(date)
      .add(7, 'days')
      .format('YYYY-MM-DD');

    handleSectionData({
      start_date: moment(`${dateStart} 00:00:00`).valueOf(),
      end_date: moment(`${endDate} 00:00:00`).valueOf() - 1,
    });

    const monthNum = [];
    for (let i = 0; i < 7; i += 1) {
      const nextDay = moment(date)
        .add(i, 'days')
        .date();
      monthNum.push(nextDay);
    }

    this.setState({
      dateStart,
      monthNum,
    });
  };

  refreshData = async () => {
    const { parentRecord = {}, field_section, pageType, dispatch } = this.props;
    this.setState({ loadStatus: true });
    const cascadeTerminationTime = Date.now();
    const dataResults = [];
    if (pageType !== 'add') {
      if (parentRecord.object_describe_name === 'call_plan') {
        const payload = {
          head: { token: global.FC_CRM_TOKEN },
          body: {
            joiner: 'and',
            criterias: [
              {
                field: 'otc_call_plan',
                operator: '==',
                value: [parentRecord.id],
              },
              {
                field: 'call_date',
                operator: '>=',
                value: [parentRecord.start_date],
              },
              {
                field: 'call_date',
                operator: '<=',
                value: [parentRecord.end_date],
              },
            ],
            orderBy: 'create_time',
            order: 'desc',
            objectApiName: field_section.extender_display_object_api_name,
            pageSize: 10000,
            pageNo: 1,
          },
        };
        const data = await recordService.queryRecordListService(payload);

        _.each(data.result, (dt) => {
          dt['parentData'] = parentRecord;
          dataResults.push(dt);
        });
      }
    }

    handleUpdateCascade({
      data: dataResults,
      status: CASCADE_INIT,
      dispatch,
      parentId: _.get(parentRecord, 'id'),
      relatedListName: _.get(field_section, 'related_list_name'),
      cascadeLimitTime: cascadeTerminationTime,
    });

    this.setState({ loadStatus: false });
  };

  render() {
    const { cascadeList, dispatch } = this.props;
    const { loadStatus, monthNum, dateStart, callPathRecordType } = this.state;
    let weekMap;
    // *拜访周计划模板起始日期从周一开始，同时兼容以前周日开始的数据
    if (dateStart) {
      const weekday = moment(dateStart).day();
      weekMap = weekday === 0 ? this.oldWeekDays : this.newWeekDays;
    }

    if (loadStatus || _.isEmpty(monthNum)) {
      return <LoadingView />;
    }

    const totalData = _.values(cascadeList);

    return (
      <ScrollableTabView
        removeClippedSubviews
        initialPage={0}
        tabBarActiveTextColor={themes.fill_base_color}
        tabBarUnderlineStyle={{ backgroundColor: themes.fill_base_color }}
        locked
        renderTabBar={() => <TabHaeader tabNames={weekMap} tabDayNames={monthNum} navDisabled />}
      >
        {_.map(weekMap, (page, index) => {
          const dayStart = moment(`${dateStart} 00:00:00`)
            .add(index, 'days')
            .valueOf();
          const dayEnd =
            moment(`${dateStart} 23:59:59`)
              .add(index, 'days')
              .valueOf() + 1000;

          const dayItems = [];
          if (dayStart && !_.isNaN(dayStart) && !_.isNaN(dayEnd)) {
            _.each(totalData, (item) => {
              const call_date = _.get(item, 'call_date');

              if (call_date == dayStart) {
                dayItems.push(item);
              }
            });
          }

          return (
            <InnerView
              key={index}
              page={page}
              index={index}
              date={dateStart}
              {...this.props}
              items={dayItems}
              dispatch={dispatch}
              callPathRecordType={callPathRecordType}
              handleRefreshView={this.handleRefreshView}
              relatedLayoutComponent={this.relatedLayoutComponent}
            />
          );
        })}
      </ScrollableTabView>
    );
  }
}

const select = (state, screen) => {
  const relatedListName = _.get(screen, 'field_section.related_list_name', '');
  const cascadeList = _.get(state, `cascade.cascadeList.${relatedListName}`, {});
  const terminationTime = _.get(state, 'cascade.terminationTime', 0);
  return { cascadeList: _.cloneDeep(cascadeList), terminationTime };
};

export default connect(select)(DayCalenderScreen);
