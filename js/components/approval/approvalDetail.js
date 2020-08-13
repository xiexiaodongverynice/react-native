/* eslint-disable */
/**
 *
 * ! 老版审批流
 * @flow
 */

import React from 'react';
import { View, Text } from 'react-native';
import _ from 'lodash';
import moment from 'moment';
import I18n from '../../i18n';

const ApprovalDetail = ({ data }) => {
  try {
    const { approval_node: node, status } = data;

    if (status === 'start') {
      return (
        <View>
          <View>
            <Text>{_.get(node, 'submitter__r.name', '')}</Text>
          </View>
          <View>
            <Text>
              {_.get(node, 'create_time')
                ? moment(node.create_time).format('YYYY-MM-DD HH:mm')
                : ''}{' '}
              {I18n.t('ApprovalDetail.StartApproval')}
            </Text>
          </View>
          <View>
            <Text>
              ${I18n.t('ApprovalDetail.Position')}：{_.get(node, 'operator_duty')}
            </Text>
          </View>
        </View>
      );
    } else if (node.status === 'agreed') {
      const start = moment(node.create_time);
      const end = moment(node.update_time);
      const duration = moment.duration(end.diff(start));
      const duration_days = duration.days();
      const duration_hrs = duration.hours();
      const duration_mins = duration.minutes();
      return (
        <View>
          <View>
            <Text>{`${_.get(node, 'operator__r.name')} `}</Text>
          </View>
          <View>
            <Text>{`${moment(node.create_time).format('YYYY-MM-DD HH:mm')} ${I18n.t(
              'ApprovalDetail.Approved',
            )}`}</Text>
          </View>
          <View>
            <Text>{`${I18n.t('ApprovalDetail.Position')}: ${_.get(
              node,
              'operator_duty',
              '',
            )}`}</Text>
          </View>
          <View>
            <Text>{`${I18n.t('ApprovalDetail.Text.SpendTime')} ${duration_days}${I18n.t(
              'ApprovalDetail.Text.Day',
            )}${duration_hrs}${I18n.t('ApprovalDetail.Text.Hour')}${duration_mins}${I18n.t(
              'ApprovalDetail.Text.Minute',
            )}`}</Text>
          </View>
          <View>
            <Text>{`${_.get(node, 'comments', '')}`}</Text>
          </View>
        </View>
      );
    } else if (node.status === 'rejected') {
      const start = moment(node.create_time);
      const end = moment();
      const duration = moment.duration(end.diff(start));
      const duration_days = duration.days();
      const duration_hrs = duration.hours();
      const duration_mins = duration.minutes();
      return (
        <View>
          <View>
            <Text>
              {`${_.get(node, 'operator__r.name')} ${moment(node.create_time).format(
                'YYYY-MM-DD HH:mm',
              )} ${I18n.t('ApprovalDetail.Rejected')}`}
            </Text>
          </View>
          <View>
            <Text>{`${I18n.t('ApprovalDetail.Position')}: ${_.get(
              node,
              'operator_duty',
              '',
            )}`}</Text>
          </View>
          <View>
            <Text>{`${I18n.t('ApprovalDetail.Text.SpendTime')} ${duration_days}${I18n.t(
              'ApprovalDetail.Text.Day',
            )}${duration_hrs}${I18n.t('ApprovalDetail.Text.Hour')}${duration_mins}${I18n.t(
              'ApprovalDetail.Text.Minute',
            )}`}</Text>
          </View>
          <View>
            <Text>{`${_.get(node, 'comments', '')}`}</Text>
          </View>
        </View>
      );
    } else if (node.status === 'waiting') {
      const start = moment(node.create_time);
      const end = moment();
      const duration = moment.duration(end.diff(start));
      const duration_days = duration.days();
      const duration_hrs = duration.hours();
      const duration_mins = duration.minutes();
      return (
        <View>
          <View>
            <Text>{_.get(node, 'name')}</Text>
          </View>
          <View>
            <Text>{I18n.t('ApprovalDetail.WaitingProcess')}</Text>
          </View>
          <View>
            <Text>{`${I18n.t('ApprovalDetail.Text.Waiting')} ${duration_days}${I18n.t(
              'ApprovalDetail.Text.Day',
            )}${duration_hrs}${I18n.t('ApprovalDetail.Text.Hour')}${duration_mins}${I18n.t(
              'ApprovalDetail.Text.Minute',
            )}`}</Text>
          </View>
        </View>
      );
    } else if (node.status === 'accepted') {
      const start = moment(node.create_time);
      const end = moment();
      const duration = moment.duration(end.diff(start));
      const duration_days = duration.days();
      const duration_hrs = duration.hours();
      const duration_mins = duration.minutes();
      return (
        <View>
          <View>
            <Text>
              {_.get(node, 'operator__r.name')}{' '}
              {moment(node.create_time).format('YYYY-MM-DD HH:mm')}{' '}
              {I18n.t('ApprovalDetail.Accepted')}
            </Text>
          </View>
          <View>
            <Text>
              {I18n.t('ApprovalDetail.Position')}: {_.get(node, 'operator_duty')}
            </Text>
          </View>
          <View>
            <Text>
              {`${I18n.t('ApprovalDetail.Text.SpendTime')} ${duration_days}${I18n.t(
                'ApprovalDetail.Text.Day',
              )}${duration_hrs}${I18n.t('ApprovalDetail.Text.Hour')}${duration_mins}${I18n.t(
                'ApprovalDetail.Text.Minute',
              )}`}
            </Text>
          </View>
          <View>
            <Text>{_.get(node, 'comments', '')}</Text>
          </View>
        </View>
      );
    }
  } catch (e) {
    return null;
  }
};

export default ApprovalDetail;
