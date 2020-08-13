/**
 * Created by YangJianWei on 04/12;
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Text, StyleSheet, DeviceEventEmitter } from 'react-native';
import { Body, Button, Header, Icon, Left, Right, Title } from 'native-base';
import * as _ from 'lodash';
import * as moment from 'moment';
import LayoutService from '../../services/layoutService';
import RecordService from '../../services/recordService';
import { StyledContainer, StyledHeader } from '../common/components';
import { queryMultipleRecordList } from '../../actions/query';
import themes from '../common/theme';
import FilterSubHelper from '../common/helpers/FilterSubHelper';
import CalenderAgenda from './CalenderAgenda';
import ModalPopoverScreen from '../common/ModalPopoverScreen';
import ModalLoadingScreen from '../../components/modal/ModalLoadingScreen';
import * as Util from '../../utils/util';
import I18n from '../../i18n';

type Prop = {
  navigation: any,
  objectDescription: any,
  token: any,
};

type State = {};

class CalenderScreen extends React.Component<Prop, State> {
  constructor(props) {
    super(props);
    this.state = {
      items: {},
      filter: undefined,
      selectDay: '',
      optionSelected: [],
      isAllSelected: true,
      stashSubOptions: [],
      isLoading: true,
    };
  }

  calendarActions = [];
  calendarLegends = [];
  territoryCriterias = [];
  modalBtnRef: Button = null;
  modalRef: ModalPopoverScreen;
  selectDay: string = '';
  layout: any;
  param: any;

  navToOptions = (destination: string, param: {}) => {
    const { navigation } = this.props;
    if (!param) {
      navigation.navigate(destination, param);
      return;
    }

    const navParam = { ...param };
    navParam.callback = this.filterSelectCallback;
    navigation.navigate(destination, param);
  };

  async componentDidMount() {
    this.layout = await LayoutService.getCalenderLayout(global.FC_CRM_TOKEN);
    this.getDataItems(this.layout);
    this.eventListener = DeviceEventEmitter.addListener('BackCalenderPageEvent', (a) => {
      this.getDataItems(this.layout, _.get(this.param, 'selected'), this.filters);
    });
  }

  componentWillUnmount() {
    if (_.isFunction(_.get(this, 'eventListener.remove'))) {
      this.eventListener.remove();
    }
  }

  addExtenders(extenders) {
    const show_filter = _.get(extenders, '[0].show_filter');
    if (!show_filter) return;

    const hidden_expression = _.get(extenders, '[0].hidden_expression', 'return false');
    const is_hidden = Util.executeDetailExp(hidden_expression);
    if (is_hidden) return;
    this.setState({ filter: extenders });
  }

  selectSubord(extender_all) {
    const { navigation } = this.props;

    const { stashSubOptions } = this.state;

    const filterSubCallBack = (cri, selectItems, otherSubFilter) => {
      const subFilterCondition = [...otherSubFilter, cri];
      this.filters = subFilterCondition;
      this.getDataItems(this.layout, this.param, subFilterCondition);
      this.setState({ stashSubOptions: selectItems });
    };

    const params = FilterSubHelper.composeParams(
      extender_all,
      filterSubCallBack,
      stashSubOptions,
      this.territoryCriterias,
    );

    navigation.navigate('SelectTree', params);

    // const options = [];
    // if (!_.isEmpty(extender_option) && _.get(extender_option, 'sub_type')) {
    //   const subType = _.get(extender_option, 'sub_type');
    //   const subtypeList = global.fc_getSubordinates(subType);
    //   _.each(subtypeList, (subitem) => {
    //     options.push({
    //       label: subitem.name,
    //       value: subitem.id,
    //       item: subitem,
    //     });
    //   });
    // } else {
    //   const userId = global.FC_CRM_USERID;
    //   const subList = global.FC_CRM_SUBORDINATES;
    //   const allList = global.FC_CRM_ALL_SUBORDINATES;
    //   _.each(allList, (listItem) => {
    //     if (listItem && listItem.id === global.FC_CRM_USERID) {
    //       options.push({
    //         label: listItem.name,
    //         value: listItem.id,
    //         item: listItem,
    //       });
    //     }
    //   });
    //   if (subList && subList.length > 0) {
    //     _.each(subList, (sub) => {
    //       if (sub && sub.id !== global.FC_CRM_USERID) {
    //         options.push({
    //           label: sub.name,
    //           value: sub.id,
    //           item: sub,
    //         });
    //       }
    //     });
    //   }
    // }
    // const param = {
    //   multipleSelect: true,
    //   options,
    //   stashSubOptions: this.state.stashSubOptions,
    //   callback: (item) => {
    //     const selectItems = item.selected;
    //     const createBys = [];
    //     this.setState({
    //       stashSubOptions: selectItems,
    //     });
    //     _.each(selectItems, (select) => {
    //       if (select.value) {
    //         createBys.push(select.value);
    //       }
    //     });
    //     const queryCri = {
    //       field: 'create_by',
    //       operator: 'in',
    //       value: createBys,
    //     };
    //     this.getDataItems(this.layout, this.param, queryCri);
    //   },
    // };
    // navigation.navigate('SelectTree', param);
  }

  getDataItems = (layout, selectItem, subFilterCondition) => {
    if (layout !== undefined) {
      const itemLayout = JSON.parse(layout.value);
      const legends = [];
      const dispayNames = [];
      let queryBodys = [];

      this.calendarActions = itemLayout.calendar_actions;
      const calendarItems = itemLayout.calendar_items;
      const selectorFilterExtender = itemLayout.selector_filter_extender;
      this.addExtenders(selectorFilterExtender);

      const calenderViews = itemLayout.views;
      if (calenderViews && calenderViews.length > 0) {
        calenderViews.forEach((view) => {
          if (view.calendar_actions) {
            view.calendar_actions.forEach((action) => {
              this.calendarActions.push(action);
            });
          }
        });
      }

      _.each(calendarItems, (item) => {
        const { hidden_expression = 'return false' } = item;
        if (Util.executeDetailExp(hidden_expression)) return;

        _.each(item.legend, (legend) => {
          legends.push({
            legend,
            apiName: item.ref_object,
            end_field: item.end_field,
            start_field: item.start_field,
          });

          let criterias = [];

          if (legend.record_type && item.ref_object !== 'coach_feedback') {
            criterias.push({
              field: 'record_type',
              operator: 'in',
              value: [legend.record_type],
            });
          }

          if (legend.critiria) {
            _.each(legend.critiria, (cri) => {
              if (cri.default_value) {
                criterias.push({
                  field: cri.field,
                  operator: cri.operator,
                  value: cri.default_value,
                });
              } else {
                criterias.push({
                  field: cri.field,
                  operator: cri.operator,
                  value: cri.value,
                });
              }
            });
          }

          if (!_.isEmpty(subFilterCondition)) {
            _.each(criterias, (cri) => {
              if (cri && cri.field === 'create_by') {
                const isExitCreateBy = _.find(
                  subFilterCondition,
                  (subFilter) => _.get(subFilter, 'field') === 'create_by',
                );

                !_.isEmpty(isExitCreateBy) && criterias.splice(criterias.indexOf(cri), 1);
              }
            });

            criterias = _.concat([], criterias, subFilterCondition);
          }

          const queryBody = {
            joiner: legend.joiner,
            objectApiName: item.ref_object,
            order: legend.order === undefined ? '' : legend.order,
            orderBy: legend.orderBy === undefined ? '' : legend.orderBy,
            pageNo: 1,
            pageSize: 10000,
            criterias,
            label: _.get(legend, 'label', ''),
          };

          if (!_.isEmpty(this.territoryCriterias)) {
            _.set(queryBody, 'territoryCriterias', this.territoryCriterias);
          }

          if (selectItem && selectItem.length > 0) {
            selectItem.forEach((select) => {
              if (select.id == legend.id) {
                queryBodys.push(queryBody);
              }
            });
          } else if (selectItem && selectItem.length == 0) {
            //筛选条件全部选时
            queryBodys = [];
          } else {
            queryBodys.push(queryBody);
          }
        });

        const itemContent: string = item.item_content;

        if (
          itemContent.indexOf('{{') > -1 &&
          _.isEmpty(
            _.find(
              dispayNames,
              (display) =>
                _.get(display, 'displayName') === itemContent &&
                _.get(display, 'objectApiName') === item.ref_object,
            ),
          )
        ) {
          dispayNames.push({
            objectApiName: item.ref_object,
            displayName: itemContent,
          });
        }
      });

      const payload = {
        head: { token: global.FC_CRM_TOKEN },
        body: queryBodys,
      };

      RecordService.queryMultipleRecordList(payload)
        .then((res: any) => {
          const dataList = res;
          this.combineDataWithConfig(dataList['batch_result'], dispayNames, legends, queryBodys);
        })
        .finally(() => {
          this.setState({
            isLoading: false,
          });
        });
    }
  };

  getDefaultDisplayName = (displayName, discribe, data) => {
    let name = data[displayName];
    _.each(discribe, (des) => {
      if (des.api_name === displayName) {
        if (des.type === 'select_one') {
          _.each(des.options, (option) => {
            if (option.value == data[displayName]) {
              name = option.label;
            }
          });
        } else if (des.type === 'date_time') {
          name = moment.unix(data[displayName] / 1000).format('YYYY-MM-DD HH:mm');
        }
      }
    });
    return name;
  };

  getItemPushObj = (displayName, data, _legend, hour, label, time, discribe) => {
    const statusDesc = _.get(data, 'status'); // 类型：已完成，已执行.....
    const signInTime = _.get(data, 'sign_in_time');
    const signInTimeFormat = moment.unix(signInTime / 1000).format('YYYY-MM-DD HH:mm');
    const displayNameArr = displayName ? displayName.match(/\{\{(.+?)\}\}/g) : [];
    let relDisplayName = '';
    let titleHour = '';
    if (
      data.object_describe_name === 'coach_feedback' ||
      _legend.start_field === _legend.end_field
    ) {
      titleHour =
        statusDesc == I18n.t('CalenderScreen.Finished')
          ? signInTimeFormat
          : I18n.t('CalenderScreen.FullDay');
    } else {
      titleHour = hour;
    }
    if (displayNameArr.length) {
      // item_content 做了字段拼接
      // 有__r的表达式，直接从data里面取；
      // 没有__r的表达式，走getDefaultDisplayName(从默认对象里面取值，为了确保可以取到值？？？)

      const itemsStrArr = [];
      _.each(displayNameArr, (item) => {
        const itemFormat = item.replace('{{', '').replace('}}', '');
        let itemStr = '';
        if (itemFormat.indexOf('__r') > -1) {
          itemStr = _.get(data, itemFormat);
        } else {
          itemStr = this.getDefaultDisplayName(itemFormat, discribe, data);
        }
        if (itemStr) {
          itemsStrArr.push(itemStr);
        }
      });
      relDisplayName = itemsStrArr.join('-');
    }
    return {
      hour: titleHour,
      data,
      label,
      height: 100,
      time,
      name: relDisplayName,
      // name 处理name
    };
  };

  combineDataWithConfig(dataLists, dispayNames, legends, queryBodys) {
    this.calendarLegends = legends;
    const { objectDescription } = this.props;
    const itemContents = {};
    _.each(dataLists, (dataList, index) => {
      _.each(dispayNames, (display) => {
        const displayName: string = display.displayName.replace('{{', '').replace('}}', '');
        const dataResult = _.get(dataList, 'result', undefined);
        if (!dataResult) return;

        _.each(dataResult, (data) => {
          if (data.object_describe_name === display.objectApiName) {
            const label = {};
            //* 找到object_describe_name、record_type一致的布局，找到符合的布局后先给lable赋值(有些没有配置status等别的条件，所以先做兼容处理)，然后继续遍历status，有符合的status则覆盖之前的label。
            _.each(legends, (legend) => {
              if (legend.apiName === data.object_describe_name) {
                const obj = legend.legend;
                const crts = obj.critiria;
                let dataRecordType = obj.record_type;
                if (!dataRecordType) {
                  _.each(crts, (cri) => {
                    if (cri && cri.field === 'record_type') {
                      dataRecordType = cri.value;
                    }
                  });
                }
                if (dataRecordType && dataRecordType.indexOf(data['record_type']) > -1) {
                  if (_.isEmpty(label)) {
                    label.name = obj.label;
                    label.bgColor = obj.bg_color;
                    label.borderColor = obj.border_color;
                    label.textColor = obj.text_color;
                    label.i18n = obj['label.i18n_key'];
                    label.recordType = data.record_type;
                  }
                  crts.forEach((cri) => {
                    if (cri.field === 'status') {
                      const values = cri.value;
                      _.each(values, (value) => {
                        if (data['status'] == value) {
                          label.name = obj.label;
                          label.bgColor = obj.bg_color;
                          label.borderColor = obj.border_color;
                          label.textColor = obj.text_color;
                          label.i18n = obj['label.i18n_key'];
                          label.recordType = data.record_type;
                        }
                      });
                    }
                  });
                }
              }
            });
            const _legend = _.find(legends, (e) => e.apiName === data.object_describe_name);
            // *根据筛选条件的label查找legends里面对应的配置
            // *上面的_legend可以被替换成findLegend ？？？待验证
            const findLegend = _.find(
              legends,
              (e) => e.legend.label === _.get(queryBodys[index], 'label'),
            );
            let time = data['start_time'];
            time = _.get(data, findLegend.start_field);
            const startTime = moment.unix(time / 1000).format('YYYY-MM-DD');
            if (!itemContents[startTime]) {
              itemContents[startTime] = [];
            }
            const itemsDescription = objectDescription.items;
            let discribe = [];
            _.each(itemsDescription, (discribes) => {
              if (display.objectApiName === discribes.api_name) {
                discribe = discribes.fields;
              }
            });

            const hour = moment.unix(time / 1000).format('HH:mm');

            //获取item的push值
            const itemPushObj = this.getItemPushObj(
              display.displayName,
              data,
              _legend,
              hour,
              label,
              time,
              discribe,
            );
            itemContents[startTime].push(itemPushObj);
          }
        });
      });
    });
    _.each(itemContents, (items, index) => {
      const sortResult = _.sortBy(items, (item) => item.time);
      itemContents[index] = sortResult;
    });

    this.setState({ items: itemContents, itemContents });
  }

  setModalPopoverVisible = (visible: boolean, callback: Function = () => void 0) => {
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

  selectCallback = (param) => {
    if (param.selected && param.selected.length) {
      //筛选条件不是全选时或者全选
      this.setState({
        optionSelected: param.selected,
        isAllSelected: false,
      });
    } else if (param.selected && param.selected.length == 0) {
      //筛选条件为全不选时
      this.setState({
        optionSelected: [],
        isAllSelected: false,
      });
    }

    this.param = param;

    this.getDataItems(this.layout, param.selected, this.filters);
  };

  selectTheDay(e) {
    const selectDay = e.dateString;
    const timstamp = e.timestamp;
    this.setState({ selectDay });
  }

  openSelect(selectList) {
    const options = [];
    _.each(selectList, (select) => {
      const legend = select.legend;
      legend['apiName'] = select.apiName;
      options.push(legend);
    });
    const { navigation } = this.props;
    const { optionSelected, isAllSelected } = this.state;
    const param = {
      multipleSelect: true,
      options,
      callback: this.selectCallback,
      isAllSelected,
      selected: optionSelected,
    };
    navigation.navigate('Option', param);
  }

  render() {
    const today = _.now();
    const timeStr = moment.unix(today / 1000).format('YYYY-MM-DD');
    this.selectDay = timeStr;
    const { items, itemContents, selectDay, filter, isLoading } = this.state;
    const { token, objectDescription } = this.props;
    let calenderLayout = _.get(this.layout, 'value', {});
    if (!_.isEmpty(calenderLayout)) {
      calenderLayout = JSON.parse(calenderLayout);
    }
    let extender_all = {};
    const selector_filter_extender = _.get(calenderLayout, 'selector_filter_extender', {});
    _.each(selector_filter_extender, (e) => {
      const extender_item = _.get(e, 'extender_item', {});
      if (!_.isEmpty(extender_item)) {
        extender_all = e;
      }
    });
    const addActions = [];
    const callTemplateActions = [
      {
        actionCode: 'APPLY_TEMPLATE',
        actionLabel: I18n.t('CalenderScreen.Label.APPLY_TEMPLATE'),
        isDisabled: false,
        label: I18n.t('CalenderScreen.Label.APPLY_TEMPLATE'),
        hidden_expression: "return !fc_hasFunctionPrivilege('add_call_template')",
        data: selectDay === '' ? this.selectDay : selectDay,
        apiName: 'call_template',
        token,
        objectDescription,
      },
      {
        actionCode: 'COPY_TEMPLATE',
        actionLabel: I18n.t('CalenderScreen.Label.COPY_TEMPLATE'),
        isDisabled: false,
        label: I18n.t('CalenderScreen.Label.COPY_TEMPLATE'),
        hidden_expression: "return !fc_hasFunctionPrivilege('add_call_template')",
        data: selectDay === '' ? this.selectDay : selectDay,
        apiName: 'call_template',
        token,
        objectDescription,
      },
    ];

    if (this.calendarActions.length > 0) {
      this.calendarActions.forEach((action) => {
        const is_hidden = Util.executeDetailExp(action.hidden_expression);
        if (!is_hidden) {
          action['from'] = 'calender';
          addActions.push(action);
        }
      });
    }

    callTemplateActions.forEach((action) => {
      const is_hidden = Util.executeDetailExp(action.hidden_expression);
      if (!is_hidden) {
        action['from'] = 'calender';
        addActions.push(action);
      }
    });
    // *批量创建拜访计划时，该天已经创建过拜访计划且状态是1，2，3的医生不能再该天重复选择创建
    const itemsForSelectDayArr = _.get(items, `${selectDay || this.selectDay}`, []);
    const selectIds = [];
    const statusArr = ['1', '2', '3'];
    _.map(itemsForSelectDayArr, (item, i) => {
      const itemType = _.get(item, 'data.object_describe_name', '');
      const itemStatus = _.get(item, 'data.status', '');
      if (itemType == 'call' && _.includes(statusArr, itemStatus, false)) {
        selectIds.push(_.get(item, 'data.customer'));
      }
    });
    return (
      <StyledContainer>
        <StyledHeader>
          <Left style={{ flex: 1 }}>
            <Button transparent onPress={() => this.props.navigation.navigate('DrawerOpen')}>
              <Icon name="menu" style={styles.icon} />
            </Button>
          </Left>
          <Body style={{ flex: 1, alignItems: 'center' }}>
            <Title
              style={{
                color: themes.title_text_color,
                fontSize: themes.title_size,
              }}
            >
              <Text>{I18n.t('CalenderScreen.Calender')}</Text>
            </Title>
          </Body>
          <Right style={{ flex: 1 }}>
            {filter && (
              <Button transparent onPress={() => this.selectSubord(extender_all)}>
                <Icon name="ios-funnel-outline" style={styles.icon} />
              </Button>
            )}
            <Button transparent onPress={() => this.openSelect(this.calendarLegends)}>
              <Icon name="ios-list" type="Ionicons" style={{ color: 'white' }} />
            </Button>
            {addActions.length > 0 && (
              <Button transparent onPress={() => this.setModalPopoverVisible(true)}>
                <Icon
                  name="ios-more"
                  style={{ color: 'white' }}
                  ref={(el) => (this.modalBtnRef = el)}
                />
              </Button>
            )}
          </Right>
        </StyledHeader>
        <CalenderAgenda
          items={items}
          selected={timeStr}
          handleNav={this.navToOptions}
          itemContens={itemContents}
          onDaySelected={(e) => this.selectTheDay(e)}
        />
        {addActions.length > 0 && (
          <ModalPopoverScreen
            ref={(el) => (this.modalRef = el)}
            addActions={addActions}
            navigation={this.props.navigation}
            params={{ selectDay: selectDay || this.selectDay, selectIds }}
          />
        )}
        <ModalLoadingScreen visibleStatus={isLoading} tip={I18n.t('query_loading')} />
      </StyledContainer>
    );
  }
}

const select = (state) => ({
  token: state.settings.token,
  objectDescription: state.settings.objectDescription,
  permission: state.settings.permission,
});

const act = (dispatch) => ({
  actions: bindActionCreators({ queryMultipleRecordList }, dispatch),
  dispatch,
});

export default connect(select, act)(CalenderScreen);

const styles = StyleSheet.create({
  icon: {
    color: themes.title_icon_color,
    fontSize: themes.font_header_size,
  },
});
