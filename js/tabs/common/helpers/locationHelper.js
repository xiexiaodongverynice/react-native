//@flow

import _ from 'lodash';
import { toastWaring } from '../../../utils/toast';
import { baidumap } from '../../../utils/config';
import request from '../../../utils/request';
import httpRequest from '../../../services/httpRequest';
import { checkLocationDistance } from './utils';
import { SIGN_IN_STATE, SIGN_OUT_STATE } from '../../../utils/const';
import { CustomerConfirm } from '../../common/components';
import OutofRangeAlert from '../../../lib/RNMWrapper/OutofRangeAlert';
import { rnm_alert } from '../../../lib/RNMWrapper/RNMWrapper';

const query_customer = (id) => ({
  token: global.FC_CRM_TOKEN,
  objectApiName: 'customer',
  criteria: [
    {
      field: 'id',
      operator: '==',
      value: [id],
    },
  ],
  joiner: 'and',
  orderBy: 'update_time',
  order: 'desc',
  pageSize: 20,
  pageNo: 1,
});

/**
 * *newData为更新数据，cacheData为已保存数据
 * @param {*} { newData, cacheData = {}}
 */
const insertLocationOffsetInfo = async ({
  newData,
  cacheData = {},
  relativeLocationField = 'customer',
}) => {
  let processedData = newData;
  const totalData = _.assign({}, cacheData, newData);

  //* 只会出现一种签到 普通或者自定义签到
  const [signDeviation, abnormalCollect] = await Promise.all([
    _getCommonSignOffsetInfo({ totalData, relativeLocationField }),
    _getCustomeSignOffsetInfo({ newData, totalData, relativeLocationField }),
  ]);

  if (!_.isEmpty(signDeviation)) {
    processedData = _.assign({}, processedData, signDeviation);
  }

  if (!_.isEmpty(abnormalCollect)) {
    processedData = _.assign({}, processedData, abnormalCollect);
  }

  return processedData;
};

//* 普通签到 （获取偏差距离）
const _getCommonSignOffsetInfo = async ({ totalData, relativeLocationField }) => {
  const longitude = _.get(totalData, 'longitude');
  const latitude = _.get(totalData, 'latitude');

  if (!longitude || !latitude) {
    return null;
  }

  const currentLocationInfo = {
    longitude,
    latitude,
  };

  try {
    const relativeLocationInfo = await _getRelativeLocationInfo({
      totalData,
      relativeLocationField,
    });
    if (_.isNull(relativeLocationInfo) || _.isEmpty(relativeLocationInfo)) {
      return null;
    }
    const deviationData = _getCommonOffsetDistance({
      currentLocationInfo,
      relativeLocationInfo,
    });
    return deviationData;
  } catch (err) {
    return null;
  }
};

//* 获取普通签到偏差距离
function _getCommonOffsetDistance({ currentLocationInfo, relativeLocationInfo }) {
  const data = {};
  const deviation = checkLocationDistance(currentLocationInfo, relativeLocationInfo);

  _.set(data, 'sign_in_deviation', deviation);

  return data;
}

//* 自定义签到 （获取是否异常状态和偏差距离）
async function _getCustomeSignOffsetInfo({ newData, totalData, relativeLocationField }) {
  const abnormalDistance = _.get(global.CRM_SETTINGS, 'sign_in_range');
  if (!abnormalDistance) return null;

  try {
    const { signInLocationInfo, signOutLocationInfo } = _getSignInAndSignOutInfo(newData);

    const relativeLocationInfo = await _getRelativeLocationInfo({
      totalData,
      relativeLocationField,
    });
    if (_.isNull(relativeLocationInfo) || _.isEmpty(relativeLocationInfo)) {
      console.warn('[error _getCustomeSignOffsetInfo] customerLocation is null');
      return null;
    }

    const signInCollects = _getCustomeOffsetDistance({
      currentLocationInfo: signInLocationInfo,
      relativeLocationInfo,
      abnormalDistance,
      signStates: SIGN_IN_STATE,
    });

    const signOutCollects = _getCustomeOffsetDistance({
      currentLocationInfo: signOutLocationInfo,
      relativeLocationInfo,
      abnormalDistance,
      signStates: SIGN_OUT_STATE,
    });

    return _.assign({}, signInCollects, signOutCollects);
  } catch (e) {
    console.warn(e);
    return null;
  }
}

//* 获取自定义签到中的签到和签出经纬度
function _getSignInAndSignOutInfo(newData) {
  let signInLocationInfo = {};
  let signOutLocationInfo = {};

  const signInLongitude = _.get(newData, SIGN_IN_STATE['longitude']);
  const signInLatitude = _.get(newData, SIGN_IN_STATE['latitude']);
  const signOutLongitude = _.get(newData, SIGN_OUT_STATE['longitude']);
  const signOutLatitude = _.get(newData, SIGN_OUT_STATE['latitude']);

  if (signInLongitude && signInLatitude) {
    signInLocationInfo = {
      latitude: signInLatitude,
      longitude: signInLongitude,
    };
  }

  if (signOutLongitude && signOutLatitude) {
    signOutLocationInfo = {
      latitude: signOutLatitude,
      longitude: signOutLongitude,
    };
  }

  //* 没有签出和签到的经纬度
  if (_.isEmpty(signInLocationInfo) && _.isEmpty(signOutLocationInfo)) {
    throw Error('not found signInLocation and signOutLocation');
  }

  return {
    signInLocationInfo,
    signOutLocationInfo,
  };
}

/**
 * *获取签到异常和偏差距离
 * @param
 */
function _getCustomeOffsetDistance({
  currentLocationInfo,
  relativeLocationInfo,
  abnormalDistance,
  signStates,
}) {
  if (_.isEmpty(currentLocationInfo)) {
    return {};
  }

  const data = {};
  const deviation = checkLocationDistance(currentLocationInfo, relativeLocationInfo);
  _.set(data, signStates['deviation'], deviation);

  if (abnormalDistance) {
    _.set(data, signStates['abnormal'], deviation > abnormalDistance);
  }

  return data;
}

//* 获取和当前位置比较的经纬度
async function _getRelativeLocationInfo({ totalData, relativeLocationField }) {
  const relativeLocationFieldValue = _.get(totalData, relativeLocationField);
  if (!relativeLocationFieldValue) {
    throw Error('not found relative field data');
  }

  const { result } = await httpRequest.query(query_customer(relativeLocationFieldValue));
  if (_.get(result, '[0].longitude') && _.get(result, '[0].latitude')) {
    return {
      longitude: _.get(result, '[0].longitude'),
      latitude: _.get(result, '[0].latitude'),
    };
  }
  const relativeFieldDataParentId = _.get(result, '[0].parent_id');
  if (!relativeFieldDataParentId) {
    throw Error(
      '[error _getRelativeLocationInfo] error message is not found relative location info',
    );
  }

  const { result: parent_result } = await httpRequest.query(
    query_customer(relativeFieldDataParentId),
  );
  const { longitude = '', latitude = '' } = parent_result[0];
  if (longitude && latitude) {
    return {
      longitude,
      latitude,
    };
  } else {
    throw Error(
      '[error _getRelativeLocationInfo] error message is not found relative location info',
    );
  }
}

type Typef_getOutRangeAlertElem = (deviation: number, sign_in_range: number) => React.Element;
//* 判断是否设置超出范围不能签到
function checkOutOfSignScope(
  navigation,
  latitude,
  longitude,
  signInJump: () => void,
  selectedRecord,
  f_getOutRangeAlertElem: Typef_getOutRangeAlertElem,
) {
  const parentData = _.get(navigation, 'state.params.parentData', {});
  //* 如果没有配置签到范围或超出异常是否允许签到，则不继续校验
  const { sign_in_range = null, out_of_range = null } = global.CRM_SETTINGS;
  if (_.isNull(sign_in_range) || _.isNull(out_of_range)) {
    signInJump(navigation, selectedRecord);
    return false;
  }

  const customerLatitude = _.get(parentData, 'customer__r.latitude');
  const customerLongitude = _.get(parentData, 'customer__r.longitude');
  if (!customerLatitude || !customerLongitude) {
    signInJump(navigation, selectedRecord);
    return false;
  }

  const signLocation = {
    longitude,
    latitude,
  };

  const customerLocation = {
    longitude: customerLongitude,
    latitude: customerLatitude,
  };

  // *签到位置 到 目的地 的实际距离?
  const deviation = checkLocationDistance(signLocation, customerLocation);

  if (out_of_range === 'true') {
    // *不用判断签到范围直接允许签到
    signInJump(navigation, selectedRecord);
  } else if (out_of_range === 'false') {
    // *需要判断签出范围如果超出不允许签到
    if (deviation > sign_in_range) {
      toastWaring('当前定位超出有效签到范围');
    } else {
      signInJump(navigation, selectedRecord);
    }
  } else if (out_of_range === 'other') {
    // *需要判断签出范围如果超出弹出提示框，点击取消不跳转，点击确定继续签到
    if (deviation > sign_in_range) {
      const alertElem = f_getOutRangeAlertElem(deviation, sign_in_range);
      rnm_alert(alertElem);
    } else {
      signInJump(navigation, selectedRecord);
    }
  }
}

//? 没有使用，待删除
const getBestRouteForPoints = async (start, end, waypoints) => {
  const url = baidumap.calcRoute
    .replace('{origin}', start)
    .replace('{destination}', end)
    .replace('{waypoints}', waypoints);
  const data = await request(url, 'GET');
  return data;
};

export { getBestRouteForPoints, checkOutOfSignScope, insertLocationOffsetInfo };
