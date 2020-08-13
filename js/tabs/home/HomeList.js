/**
*Created by Guanghua on 12/25;
@flow
*/

import React from 'react';
import { Container, Content, ListItem, Text, Separator, Badge, Icon, Button } from 'native-base';
import moment from 'moment';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import _ from 'lodash';
import I18n from '../../i18n/index';
import { StyledBadge, StyledSeparator } from '../common/components';
import themes from '../common/theme';
import { TENANT_ID_COLLECT } from '../../utils/const';

type Prop = {
  navigation: any,
  homeData: any,
  objectDescription: any,
  tenantId: string,
};

type State = {};

export default class HomeList extends React.Component<Prop, State> {
  state: State = {};

  viewAll = (apiName, data) => {
    const { navigation } = this.props;
    if (apiName === 'my_schedule') {
      // console.log('my_schedule');
      navigation.navigate('Calender', { navParam: null });
    } else if (apiName === 'notice') {
      navigation.navigate('NoticeList', { navParam: data });
    }
  };

  renderViewAll = (section: any) => {
    const { tenantId } = this.props;
    if (!section.needViewAll && TENANT_ID_COLLECT.MYLAN_TENEMENT.includes(tenantId)) {
      return null;
    }

    return section.apiName === 'my_todo' ? null : (
      <Button
        style={{ alignSelf: 'center' }}
        transparent
        onPress={() => this.viewAll(section.apiName, section.data)}
      >
        <Text
          style={[
            styles.separatorText,
            {
              // textAlignVertical: 'center',
              // height: 35,
            },
          ]}
        >
          {I18n.t('view_all')}
        </Text>
      </Button>
    );
  };

  homeLists = (noticeResult, scheduleList, todoList) => {
    const section = [
      {
        key: I18n.t('my_todo'),
        data: todoList,
        apiName: 'my_todo',
        needViewAll: true,
      },
      {
        key: I18n.t('my_schedule'),
        data: scheduleList,
        apiName: 'my_schedule',
        needViewAll: true,
      },
      {
        key: I18n.t('notice'),
        data: noticeResult,
        apiName: 'notice',
        needViewAll: true,
      },
    ];
    return _.map(section, (sectionItem) => {
      const listData = sectionItem.data;
      return (
        <View key={`${sectionItem.key}_${Math.random(0, 5)}`}>
          <StyledSeparator bordered style={{ backgroundColor: themes.fill_subheader, height: 30 }}>
            <View style={styles.listSpaceBetween}>
              <Text
                style={{
                  fontSize: themes.list_separator_text_size,
                  fontWeight: 'bold',
                }}
              >
                {sectionItem.key}
              </Text>
              {!_.isEmpty(listData) ? this.renderViewAll(sectionItem) : null}
            </View>
          </StyledSeparator>
          {!_.isEmpty(listData)
            ? this.renderList(listData, sectionItem)
            : this.renderNoData(_.get(sectionItem, 'apiName', 'default'))}
        </View>
      );
    });
  };

  listTag = (value: ?string) => {
    if (value === '1') {
      return <StyledBadge danger text={I18n.t('import')} />;
    }
    return <StyledBadge warning text={I18n.t('general')} />;
  };

  renderTage = (object_describe_name: string, status: string, type) => {
    if (object_describe_name === 'event') {
      switch (status) {
        case '1':
          return (
            <StyledBadge
              badgeStyles={{ badge: { backgroundColor: '#F7957A' } }}
              text={I18n.t('event')}
            />
          );
        case '2':
          return (
            <StyledBadge
              badgeStyles={{ badge: { backgroundColor: '#F36168' } }}
              text={I18n.t('event')}
            />
          );
        default:
          return (
            <StyledBadge
              badgeStyles={{ badge: { backgroundColor: '#d0cd5f' } }}
              text={I18n.t('event')}
            />
          );
      }
    } else if (object_describe_name === 'call') {
      if (type === 'plan' || type.indexOf('plan') > -1) {
        switch (status) {
          case '1':
            return (
              <StyledBadge
                badgeStyles={{ badge: { backgroundColor: '#5AD2A8' } }}
                text={I18n.t('call_plan')}
              />
            );
          default:
            return (
              <StyledBadge
                badgeStyles={{ badge: { backgroundColor: '#108ee9' } }}
                text={I18n.t('call_plan')}
              />
            );
        }
      } else if (type === 'report' || type.indexOf('report') > -1) {
        switch (status) {
          case '2':
            return (
              <StyledBadge
                badgeStyles={{ badge: { backgroundColor: '#ffcc00' } }}
                text={I18n.t('call_report')}
              />
            );
          case '3':
            return (
              <StyledBadge
                badgeStyles={{ badge: { backgroundColor: '#4990EC' } }}
                text={I18n.t('call_report')}
              />
            );
          default:
            return (
              <StyledBadge
                badgeStyles={{ badge: { backgroundColor: '#108ee9' } }}
                text={I18n.t('call_report')}
              />
            );
        }
      } else if (type === 'coach') {
        return (
          <StyledBadge
            badgeStyles={{ badge: { backgroundColor: '#108ee9' } }}
            text={I18n.t('call_coach')}
          />
        );
      }
    } else if (object_describe_name === 'my_event') {
      return <StyledBadge badgeStyles={{ badge: { backgroundColor: '#5AD2A8' } }} text={'活动'} />;
    } else if (object_describe_name === 'approval_node') {
      return <StyledBadge badgeStyles={{ badge: { backgroundColor: '#5AD2A8' } }} text={'审批'} />;
    } else if (object_describe_name === 'my_vendor_approval') {
      return (
        <StyledBadge badgeStyles={{ badge: { backgroundColor: '#5AD2A8' } }} text={'供应商服务'} />
      );
    } else if (object_describe_name === 'my_promo_materials') {
      return (
        <StyledBadge badgeStyles={{ badge: { backgroundColor: '#5AD2A8' } }} text={'推广资料'} />
      );
    } else if (object_describe_name === 'customer') {
      return <StyledBadge badgeStyles={{ badge: { backgroundColor: '#5AD2A8' } }} text={'讲者'} />;
    } else if (object_describe_name === 'call_pan') {
      return (
        <StyledBadge badgeStyles={{ badge: { backgroundColor: '#5AD2A8' } }} text={'拜访计划'} />
      );
    } else if (object_describe_name === 'dcr') {
      return <StyledBadge badgeStyles={{ badge: { backgroundColor: '#5AD2A8' } }} text={'DCR'} />;
    }
  };

  renderNoData = (api_name) => {
    if (api_name === 'my_todo') {
      return (
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <Image
            style={{ height: 0.432 * themes.deviceWidth, width: themes.deviceWidth }}
            resizeMode="contain"
            source={require('../img/unbacklog.png')}
          />
          <Text style={{ color: '#7C8397', fontSize: 15 }}> {I18n.t('no_data_todo')}</Text>
        </View>
      );
    } else if (api_name === 'notice') {
      return (
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <Image
            style={{ height: 0.402 * themes.deviceWidth, width: themes.deviceWidth }}
            resizeMode="contain"
            source={require('../img/unnotice.png')}
          />
          <Text style={{ color: '#7C8397', fontSize: 15 }}> {I18n.t('no_data_notice')}</Text>
        </View>
      );
    } else if (api_name === 'my_schedule') {
      return (
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <Image
            style={{ height: 0.37 * themes.deviceWidth, width: themes.deviceWidth }}
            resizeMode="contain"
            source={require('../img/unschedule.png')}
          />
          <Text style={{ color: '#7C8397', fontSize: 15 }}> {I18n.t('no_data_schedule')}</Text>
        </View>
      );
    } else {
      return (
        <View style={{ height: 30, justifyContent: 'center' }}>
          <Text
            style={{
              marginLeft: 15,
              fontSize: themes.font_size_base,
              color: themes.input_placeholder,
            }}
          >
            {I18n.t('common_no_data')}
          </Text>
        </View>
      );
    }
  };

  renderItemTime = (item) => {
    if (item.record_type === 'plan' && !item.real_start_time) {
      return moment.unix(item.start_time / 1000).format('HH:mm');
    } else if (item.real_start_time) {
      return moment.unix(item.real_start_time / 1000).format('HH:mm');
    }
  };

  renderList = (list, sectionItem) => {
    const { objectDescription } = this.props;
    const profile = fc_getProfile();
    // console.log('需要显示关联对象的名称，所以应该需要获取审核节点对象的对象描述', this.props);
    if (!_.isEmpty(list)) {
      return _.map(list, (item) => {
        const objApiName = _.get(item, 'object_describe_name');
        // console.log('objApiName====>', objApiName);
        if (objApiName === 'notice') {
          return (
            <ListItem key={`${item.id}`}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.listItem}
                onPress={() =>
                  this.props.navigation.navigate('NoticeDetail', {
                    navParam: item,
                  })
                }
              >
                <View>{this.listTag(item.priority)}</View>
                <Text style={styles.listItemText} numberOfLines={1}>
                  {_.get(item, 'name', '')}
                </Text>
              </TouchableOpacity>
              <Icon name="ios-arrow-forward" style={[styles.icon, { marginRight: 5 }]} />
            </ListItem>
          );
        }
        if (objApiName === 'coach_feedback') {
          const coachFields = _.get(
            _.find(_.get(objectDescription, 'items'), {
              api_name: 'coach_feedback',
            }),
            'fields',
          );
          const coachStatus = _.get(_.find(coachFields, { api_name: 'status' }), 'options');
          const coachType = _.get(_.find(coachFields, { api_name: 'record_type' }), 'options');
          return (
            <ListItem key={`${item.id}`}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.listRow}
                onPress={() =>
                  this.props.navigation.navigate('Detail', {
                    navParam: this.createNavParam(item),
                  })
                }
              >
                <View style={styles.listItemLeft}>
                  <StyledBadge
                    badgeStyles={{ badge: { backgroundColor: '#87d068' } }}
                    text={I18n.t('coach_feedback')}
                  />
                  <Text style={styles.listItemText}>
                    {_.result(_.find(coachType, { value: item.record_type }), 'label')}
                  </Text>
                </View>
                <View style={styles.listItemTextExtra}>
                  <Text
                    style={{ fontSize: themes.font_size_base, marginRight: 5 }}
                    numberOfLines={1}
                  >
                    {_.result(_.find(coachStatus, { value: item.status }), 'label')}
                  </Text>
                  <Icon name="ios-arrow-forward" style={styles.icon} />
                </View>
              </TouchableOpacity>
            </ListItem>
          );
        }
        if (objApiName === 'segmentation_history') {
          const segmentationFields = _.get(
            _.find(_.get(objectDescription, 'items'), {
              api_name: 'segmentation_history',
            }),
            'fields',
          );
          const segmentationStatus = _.get(
            _.find(segmentationFields, { api_name: 'status' }),
            'options',
          );
          return (
            <ListItem key={`${item.id}`}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.listRow}
                onPress={() =>
                  this.props.navigation.navigate('Detail', {
                    navParam: this.createNavParam(item),
                  })
                }
              >
                <View style={styles.listItemLeft}>
                  <StyledBadge
                    badgeStyles={{ badge: { backgroundColor: '#2db7f5' } }}
                    text={I18n.t('segmentation_history')}
                  />
                  <Text
                    style={[
                      styles.listItemText,
                      { width: themes.deviceWidth * 0.6, marginRight: 0 },
                    ]}
                    numberOfLines={1}
                  >
                    {_.get(item, 'owner__r.name')} {I18n.t('submit')}{' '}
                    {_.get(item, 'customer__r.name')} {I18n.t('segmentation_history')}
                  </Text>
                </View>
                <View style={[styles.listItemTextExtra, { margin: 0 }]}>
                  <Text style={{ fontSize: themes.font_size_base, marginRight: 5 }}>
                    {_.result(_.find(segmentationStatus, { value: item.status }), 'label')}
                  </Text>
                  <Icon name="ios-arrow-forward" style={styles.icon} />
                </View>
              </TouchableOpacity>
            </ListItem>
          );
        }
        if (objApiName === 'event') {
          const eventStatus = _.get(
            _.find(
              _.get(
                _.find(_.get(objectDescription, 'items'), {
                  api_name: 'event',
                }),
                'fields',
              ),
              { api_name: 'status' },
            ),
            'options',
          );
          return (
            <ListItem key={`${item.id}`}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.listRow}
                onPress={() =>
                  this.props.navigation.navigate('Detail', {
                    navParam: this.createNavParam(item),
                  })
                }
              >
                <View style={styles.listItemLeft}>
                  {this.renderTage(objApiName, item.status)}
                  <Text style={styles.listItemText}>
                    {moment.unix(item.start_time / 1000).format('HH:mm')} {_.get(item, 'name', '')}
                  </Text>
                </View>
                <View style={styles.listItemTextExtra}>
                  <Text
                    style={{ fontSize: themes.font_size_base, marginRight: 5 }}
                    numberOfLines={1}
                  >
                    {_.result(_.find(eventStatus, { value: item.status }), 'label')}
                  </Text>
                  <Icon name="ios-arrow-forward" style={styles.icon} />
                </View>
              </TouchableOpacity>
            </ListItem>
          );
        }
        if (objApiName === 'my_event' && item.create_by === `${FC_CRM_USERID}`) {
          const eventStatus = _.get(
            _.find(
              _.get(
                _.find(_.get(objectDescription, 'items'), {
                  api_name: 'my_event',
                }),
                'fields',
              ),
              { api_name: 'status' },
            ),
            'options',
          );
          return (
            <ListItem key={`${item.id}`}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.listRow}
                onPress={() =>
                  this.props.navigation.navigate('Detail', {
                    navParam: this.createNavParam(item),
                  })
                }
              >
                <View style={styles.listItemLeft}>
                  {this.renderTage(objApiName, item.status)}
                  <Text style={styles.listItemText}>{_.get(item, 'name', '')}</Text>
                </View>
                <View style={styles.listItemTextExtra}>
                  <Text
                    style={{ fontSize: themes.font_size_base, marginRight: 5 }}
                    numberOfLines={1}
                  >
                    {sectionItem.apiName === 'my_todo' ? '合同上传' : ''}
                  </Text>
                  <Icon name="ios-arrow-forward" style={styles.icon} />
                </View>
              </TouchableOpacity>
            </ListItem>
          );
        }
        if (objApiName === 'approval_node') {
          const eventStatus = _.get(
            _.find(
              _.get(
                _.find(_.get(objectDescription, 'items'), {
                  api_name: 'approval_node',
                }),
                'fields',
              ),
              { api_name: 'status' },
            ),
            'options',
          );
          const refApiNames = _.get(
            _.find(
              _.get(
                _.find(_.get(objectDescription, 'items'), {
                  api_name: 'approval_node',
                }),
                'fields',
              ),
              { api_name: 'ref_record_api_name' },
            ),
            'options',
          );
          return (
            <ListItem key={`${item.id}`}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.listRow}
                onPress={() =>
                  this.props.navigation.navigate('Detail', {
                    navParam: this.createNavParam(item),
                  })
                }
              >
                <View style={styles.listItemLeft}>
                  {this.renderTage(objApiName, item.status)}
                  <Text style={styles.listItemText}>
                    {_.result(_.find(refApiNames, { value: item.ref_record_api_name }), 'label')}
                  </Text>
                </View>
                <View style={styles.listItemTextExtra}>
                  <Text
                    style={{ fontSize: themes.font_size_base, marginRight: 5 }}
                    numberOfLines={1}
                  >
                    {'待审批'}
                  </Text>
                  <Icon name="ios-arrow-forward" style={styles.icon} />
                </View>
              </TouchableOpacity>
            </ListItem>
          );
        }
        if (objApiName === 'call') {
          const callStatus = _.get(
            _.find(
              _.get(_.find(_.get(objectDescription, 'items'), { api_name: 'call' }), 'fields'),
              { api_name: 'status' },
            ),
            'options',
          );
          // console.log('navparam====>', this.createNavParam(item));
          // console.log('item====>', item);
          return (
            <ListItem key={`${item.id}`}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.listRow}
                onPress={() =>
                  this.props.navigation.navigate('Detail', {
                    navParam: this.createNavParam(item),
                  })
                }
              >
                <View style={styles.listItemLeft}>
                  {this.renderTage(objApiName, item.status, item.record_type)}
                  <Text style={styles.listItemText}>
                    {TENANT_ID_COLLECT.LUOZHEN_TENEMENT.includes(item.tenant_id)
                      ? this.renderItemTime(item)
                      : moment.unix(item.start_time / 1000).format('HH:mm')}{' '}
                    {_.get(item, 'customer__r.name', '')}
                  </Text>
                </View>
                <View style={styles.listItemTextExtra}>
                  <Text
                    style={{ fontSize: themes.font_size_base, marginRight: 5 }}
                    numberOfLines={1}
                  >
                    {_.result(_.find(callStatus, { value: item.status }), 'label')}
                  </Text>
                  <Icon name="ios-arrow-forward" style={styles.icon} />
                </View>
              </TouchableOpacity>
            </ListItem>
          );
        }
        if (objApiName === 'time_off_territory' && item.create_by == `${FC_CRM_USERID}`) {
          const totType = _.get(
            _.find(
              _.get(
                _.find(_.get(objectDescription, 'items'), {
                  api_name: 'time_off_territory',
                }),
                'fields',
              ),
              { api_name: 'type' },
            ),
            'options',
          );
          const totStatus = _.get(
            _.find(
              _.get(
                _.find(_.get(objectDescription, 'items'), {
                  api_name: 'time_off_territory',
                }),
                'fields',
              ),
              { api_name: 'status' },
            ),
            'options',
          );
          return (
            <ListItem key={`${item.id}`}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.listRow}
                onPress={() =>
                  this.props.navigation.navigate('Detail', {
                    navParam: this.createNavParam(item),
                  })
                }
              >
                <View style={styles.listItemLeft}>
                  <StyledBadge
                    badgeStyles={{ badge: { backgroundColor: '#CDD7DE' } }}
                    text={I18n.t('time_off_territory')}
                  />
                  <Text style={styles.listItemText} numberOfLines={1}>
                    {moment.unix(item.start_date / 1000).format('HH:mm')}{' '}
                    {_.result(_.find(totType, { value: item.type }), 'label')}
                    {_.result(_.find(totStatus, { value: item.status }), 'label')}
                  </Text>
                </View>
                <Icon name="ios-arrow-forward" style={styles.icon} />
              </TouchableOpacity>
            </ListItem>
          );
        }
        if (objApiName === 'my_event' && item.create_by !== `${FC_CRM_USERID}`) {
          const eventStatus = _.get(
            _.find(
              _.get(
                _.find(_.get(objectDescription, 'items'), {
                  api_name: 'my_event',
                }),
                'fields',
              ),
              { api_name: 'status' },
            ),
            'options',
          );
          return (
            <ListItem key={`${item.id}`}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.listRow}
                onPress={() =>
                  this.props.navigation.navigate('Detail', {
                    navParam: this.createNavParam(item),
                  })
                }
              >
                <View style={styles.listItemLeft}>
                  {this.renderTage(objApiName, item.status)}
                  <Text style={styles.listItemText}>{_.get(item, 'name', '')}</Text>
                </View>
                <View style={styles.listItemTextExtra}>
                  <Text
                    style={{ fontSize: themes.font_size_base, marginRight: 5 }}
                    numberOfLines={1}
                  >
                    {sectionItem.apiName === 'my_todo'
                      ? profile.api_name === 'my_procurement_01_profile' ||
                        profile.api_name === 'my_procurement_02_profile'
                        ? '待处理'
                        : '待审批'
                      : ''}
                  </Text>
                  <Icon name="ios-arrow-forward" style={styles.icon} />
                </View>
              </TouchableOpacity>
            </ListItem>
          );
        }
        if (objApiName === 'my_vendor_approval') {
          const eventStatus = _.get(
            _.find(
              _.get(
                _.find(_.get(objectDescription, 'items'), {
                  api_name: 'my_vendor_approval',
                }),
                'fields',
              ),
              { api_name: 'status' },
            ),
            'options',
          );
          return (
            <ListItem key={`${item.id}`}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.listRow}
                onPress={() =>
                  this.props.navigation.navigate('Detail', {
                    navParam: this.createNavParam(item),
                  })
                }
              >
                <View style={styles.listItemLeft}>
                  {this.renderTage(objApiName, item.status)}
                  <Text style={styles.listItemText}>{_.get(item, 'name', '')}</Text>
                </View>
                <View style={styles.listItemTextExtra}>
                  <Text
                    style={{ fontSize: themes.font_size_base, marginRight: 5 }}
                    numberOfLines={1}
                  >
                    {item.status === 'proc_vendor_chosen'
                      ? '合同上传'
                      : profile.api_name === 'my_procurement_01_profile' ||
                        profile.api_name === 'my_procurement_02_profile'
                      ? '待处理'
                      : '待审批'}
                  </Text>
                  <Icon name="ios-arrow-forward" style={styles.icon} />
                </View>
              </TouchableOpacity>
            </ListItem>
          );
        }
        if (objApiName === 'my_promo_materials') {
          const eventStatus = _.get(
            _.find(
              _.get(
                _.find(_.get(objectDescription, 'items'), {
                  api_name: 'my_promo_materials',
                }),
                'fields',
              ),
              { api_name: 'status' },
            ),
            'options',
          );
          return (
            <ListItem key={`${item.id}`}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.listRow}
                onPress={() =>
                  this.props.navigation.navigate('Detail', {
                    navParam: this.createNavParam(item),
                  })
                }
              >
                <View style={styles.listItemLeft}>
                  {this.renderTage(objApiName, item.status)}
                  <Text style={styles.listItemText}>{_.get(item, 'name', '')}</Text>
                </View>
                <View style={styles.listItemTextExtra}>
                  <Text
                    style={{ fontSize: themes.font_size_base, marginRight: 5 }}
                    numberOfLines={1}
                  >
                    {'待审批'}
                  </Text>
                  <Icon name="ios-arrow-forward" style={styles.icon} />
                </View>
              </TouchableOpacity>
            </ListItem>
          );
        }
        if (objApiName === 'customer') {
          const eventStatus = _.get(
            _.find(
              _.get(
                _.find(_.get(objectDescription, 'items'), {
                  api_name: 'customer',
                }),
                'fields',
              ),
              { api_name: 'status' },
            ),
            'options',
          );
          return (
            <ListItem key={`${item.id}`}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.listRow}
                onPress={() =>
                  this.props.navigation.navigate('Detail', {
                    navParam: this.createNavParam(item),
                  })
                }
              >
                <View style={styles.listItemLeft}>
                  {this.renderTage(objApiName, item.status)}
                  <Text style={styles.listItemText}>{_.get(item, 'name', '')}</Text>
                </View>
                <View style={styles.listItemTextExtra}>
                  <Text
                    style={{ fontSize: themes.font_size_base, marginRight: 5 }}
                    numberOfLines={1}
                  >
                    {'待审批'}
                  </Text>
                  <Icon name="ios-arrow-forward" style={styles.icon} />
                </View>
              </TouchableOpacity>
            </ListItem>
          );
        }
        if (objApiName === 'time_off_territory' && item.create_by !== `${FC_CRM_USERID}`) {
          const totType = _.get(
            _.find(
              _.get(
                _.find(_.get(objectDescription, 'items'), {
                  api_name: 'time_off_territory',
                }),
                'fields',
              ),
              { api_name: 'type' },
            ),
            'options',
          );
          const totStatus = _.get(
            _.find(
              _.get(
                _.find(_.get(objectDescription, 'items'), {
                  api_name: 'time_off_territory',
                }),
                'fields',
              ),
              { api_name: 'status' },
            ),
            'options',
          );
          return (
            <ListItem key={`${item.id}`}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.listRow}
                onPress={() =>
                  this.props.navigation.navigate('Detail', {
                    navParam: this.createNavParam(item),
                  })
                }
              >
                <View style={styles.listItemLeft}>
                  <StyledBadge
                    badgeStyles={{ badge: { backgroundColor: '#CDD7DE' } }}
                    text={I18n.t('time_off_territory')}
                  />
                  <Text style={styles.listItemText} numberOfLines={1}>
                    {moment.unix(item.start_date / 1000).format('HH:mm')}{' '}
                    {_.result(_.find(totType, { value: item.type }), 'label')}
                    {_.result(_.find(totStatus, { value: item.status }), 'label')}
                  </Text>
                </View>
                <View style={styles.listItemTextExtra}>
                  <Text
                    style={{ fontSize: themes.font_size_base, marginRight: 5 }}
                    numberOfLines={1}
                  >
                    {sectionItem.apiName === 'my_todo' ? '待审批' : ''}
                  </Text>
                  <Icon name="ios-arrow-forward" style={styles.icon} />
                </View>
              </TouchableOpacity>
            </ListItem>
          );
        }
        if (objApiName === 'call_plan' && item.create_by !== `${FC_CRM_USERID}`) {
          const callStatus = _.get(
            _.find(
              _.get(_.find(_.get(objectDescription, 'items'), { api_name: 'call_plan' }), 'fields'),
              { api_name: 'status' },
            ),
            'options',
          );
          return (
            <ListItem key={`${item.id}`}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.listRow}
                onPress={() =>
                  this.props.navigation.navigate('Detail', {
                    navParam: this.createNavParam(item),
                  })
                }
              >
                <View style={styles.listItemLeft}>
                  <StyledBadge
                    badgeStyles={{ badge: { backgroundColor: '#5AD2A8' } }}
                    text={'拜访计划'}
                  />
                  <Text style={styles.listItemText}>{_.get(item, 'name', '')}</Text>
                </View>
                <View style={styles.listItemTextExtra}>
                  <Text
                    style={{ fontSize: themes.font_size_base, marginRight: 5 }}
                    numberOfLines={1}
                  >
                    {sectionItem.apiName === 'my_todo' ? '待审批' : ''}
                  </Text>
                  <Icon name="ios-arrow-forward" style={styles.icon} />
                </View>
              </TouchableOpacity>
            </ListItem>
          );
        }
        if (objApiName === 'dcr' && item.create_by !== `${FC_CRM_USERID}`) {
          const callStatus = _.get(
            _.find(
              _.get(_.find(_.get(objectDescription, 'items'), { api_name: 'dcr' }), 'fields'),
              { api_name: 'status' },
            ),
            'options',
          );

          // const status = _.get(_.find(callStatus, (e) => e.value === item.status), 'label', '');
          return (
            <ListItem key={`${item.id}`}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.listRow}
                onPress={() =>
                  this.props.navigation.navigate('Detail', {
                    navParam: this.createNavParam(item),
                  })
                }
              >
                <View style={styles.listItemLeft}>
                  {this.renderTage(objApiName, item.status, item.record_type)}
                  <Text style={styles.listItemText}>{_.get(item, 'customer__r.name', '')}</Text>
                </View>
                <View style={styles.listItemTextExtra}>
                  <Text
                    style={{ fontSize: themes.font_size_base, marginRight: 5 }}
                    numberOfLines={1}
                  >
                    {sectionItem.apiName === 'my_todo' ? '待审批' : ''}
                  </Text>
                  <Icon name="ios-arrow-forward" style={styles.icon} />
                </View>
              </TouchableOpacity>
            </ListItem>
          );
        }
      });
    }
    console.error('renderList is Empty');
  };

  createNavParam = (item: any) => {
    return {
      id: _.get(item, 'id'),
      objectApiName: _.get(item, 'object_describe_name'),
      record_type: _.get(item, 'record_type'),
      from: 'HomePage',
    };
  };

  render() {
    let noticeResult = [];
    let scheduleList = [];
    let todoList = [];
    const { homeData, tenantId } = this.props;
    const subordinates = fc_getSubordinates() || [];
    const directSubordinates = [];
    _.each(subordinates, (subor) => {
      const parent_id = _.get(subor, 'parent_id', undefined);
      if (parent_id && parent_id == `${FC_CRM_USERID}`) {
        directSubordinates.push(subor.id);
      }
    });
    if (TENANT_ID_COLLECT.JMKX_TENEMENT.includes(tenantId) && directSubordinates.length > 0) {
      // 合并组合首页要显示的数据，先要构造首页查询条件。
      const coachResult = _.get(homeData, '[0].result');
      const segmentationResult = _.get(homeData, '[1].result');
      const eventResult = _.get(homeData, '[2].result');
      const callResult = _.get(homeData, '[3].result');
      const totResult = _.get(homeData, '[4].result');
      const callPlans = _.get(homeData, '[6].result', []);
      const tots = _.get(homeData, '[7].result', []);
      const dcrs = _.get(homeData, '[8].result', []);
      noticeResult = _.get(homeData, '[5].result');
      scheduleList = _.concat(eventResult, callResult, totResult);
      todoList = _.concat(callPlans, tots, dcrs);
    } else if (TENANT_ID_COLLECT.MYLAN_TENEMENT.includes(tenantId)) {
      const eventTodays = _.get(homeData, '[0].result');
      noticeResult = _.get(homeData, '[1].result');
      const profile = fc_getProfile();
      if (
        profile.api_name === 'my_procurement_01_profile' ||
        profile.api_name === 'my_procurement_02_profile' ||
        profile.api_name === 'my_procurement_03_profile'
      ) {
        todoList = _.concat(_.get(homeData, '[2].result'), _.get(homeData, '[3].result'));
      } else {
        todoList = _.concat(
          _.get(homeData, '[2].result'),
          _.get(homeData, '[3].result'),
          _.get(homeData, '[4].result'),
          _.get(homeData, '[5].result'),
          _.get(homeData, '[6].result'),
          _.get(homeData, '[7].result'),
        );
      }
      scheduleList = eventTodays;
    } else if (TENANT_ID_COLLECT.LUOZHEN_TENEMENT.includes(tenantId)) {
      const coachResult = _.get(homeData, '[0].result');
      const segmentationResult = _.get(homeData, '[1].result');
      const eventResult = _.get(homeData, '[2].result');
      const callResult = _.get(homeData, '[3].result');
      const totResult = _.get(homeData, '[4].result');
      const callPlanResult = _.get(homeData, '[6].result', []);
      const callReportResult = _.get(homeData, '[7].result', []);
      const callCoachResult = _.get(homeData, '[8].result', []);
      noticeResult = _.get(homeData, '[5].result');
      scheduleList = _.concat(
        eventResult,
        totResult,
        callPlanResult,
        callReportResult,
        callCoachResult,
      );
      todoList = _.concat(coachResult, segmentationResult);
    } else {
      const coachResult = _.get(homeData, '[0].result');
      const segmentationResult = _.get(homeData, '[1].result');
      const eventResult = _.get(homeData, '[2].result');
      const callResult = _.get(homeData, '[3].result');
      const totResult = _.get(homeData, '[4].result');
      noticeResult = _.get(homeData, '[5].result');
      scheduleList = _.concat(eventResult, callResult, totResult);
      todoList = _.concat(coachResult, segmentationResult);
    }
    return (
      <Container>
        <Content>{this.homeLists(noticeResult, scheduleList, todoList)}</Content>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  listSpaceBetween: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
  },
  listRow: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  separatorText: {
    fontSize: themes.list_separator_text_size,
    fontWeight: 'bold',
    textAlignVertical: 'center',
  },
  listItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    // width: '100%',
    // height: '100%',
  },
  listItemText: {
    marginLeft: 5,
    marginRight: 5,
    fontSize: themes.font_size_base,
  },
  listItemTextExtra: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
    justifyContent: 'flex-end',
    flex: 1,
  },
  listItemRightText: {
    marginRight: 5,
  },
  listItemLeft: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
  },
  badgeText: { fontSize: themes.list_subtitle_size },
  icon: {
    color: themes.color_header_icon,
    fontSize: themes.font_header_size,
    alignSelf: 'center',
  },
});
