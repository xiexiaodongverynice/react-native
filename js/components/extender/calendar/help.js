/**
 * @flow
 */

import _ from 'lodash';
import moment from 'moment';

const CALL_PATH = 'call_path';

const composeCustomerData = ({
  data,
  action,
  callDate,
  field_section,
  type,
  callPathRecordType,
}) => {
  const resultData = [];

  const apiName = action.ref_object
    ? action.ref_object
    : field_section['extender_display_object_api_name'];

  if (data && data.length > 0) {
    const offsetTime = moment().utcOffset() * 60 * 1000;
    _.each(data, (dt, index) => {
      const name = _.get(dt, 'name');

      const recordType = getRecordType({
        type,
        action,
        callPathRecordType,
        field_section,
        item: dt,
      });

      resultData.push({
        objectDescribeName: apiName,
        record_type: recordType,
        start_time: callDate + index * 1800000,
        end_time: callDate + index * 1800000 + 1800000,
        call_date: callDate,
        customer__r: {
          id: dt.id,
          name,
        },
        customer: dt.id,
        fakeId: dt.fakeId,
        owner: `${global.FC_CRM_USERID}`,
        zoneOffset: offsetTime,
        customer_type: dt.type,
        status: '无效',
        name: `拜访${name}`,
        temporary_call: false,
      });
    });
  }

  return resultData;
};

const getRecordType = ({ type, action, callPathRecordType, field_section, item }) => {
  //* 区分普通拜访计划和拜访路线
  if (type !== CALL_PATH) {
    return action.ref_record_type
      ? action.ref_record_type
      : field_section['extender_object_record_type'];
  } else {
    const defaultRecordType = _.get(action, 'default_record_type');
    if (_.isEmpty(callPathRecordType)) {
      return defaultRecordType;
    } else {
      return matchRecordType(callPathRecordType, item.type) || defaultRecordType;
    }
  }
};

const matchRecordType = (callPathRecordType, cutType) => {
  const profile = global.fc_getProfile();
  const apiName = _.get(profile, 'api_name');
  if (!apiName) return;

  const recordType = _.chain(callPathRecordType)
    .find({ profile: apiName })
    .get('record_type', [])
    .find({ type: cutType })
    .get('value')
    .value();

  if (!recordType) return;
  return recordType;
};

export { composeCustomerData, CALL_PATH };
