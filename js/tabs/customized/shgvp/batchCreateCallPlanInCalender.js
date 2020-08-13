import moment from 'moment';
import { DeviceEventEmitter } from 'react-native';
import _ from 'lodash';
import CustomActionService from '../../../services/customActionService';
import { toastError, toastWaring } from '../../../utils/toast';
import { getServerTime } from '../../../services/settings';

export default async function batchCreateCallPlanInCalender(thisProps) {
  const { navigation } = thisProps;
  const { selectIds } = thisProps.params;
  // * 绿谷日历批量创建拜访计划 CRM-3991
  let serverTime = moment.valueOf();
  try {
    const serverTimeData = await getServerTime();
    if (!_.isEmpty(serverTimeData) && _.get(serverTimeData, 'result')) {
      serverTime = _.get(serverTimeData, 'result');
    }
  } catch (e) {
    console.log('[error] get server time error');
  }

  // * 选择医生页布局查询条件
  const changeDoctorLayout = {
    multiple_select: true,
    // record_fields
    ref_obj_describe: 'customer',
    target_data_record_type: 'hcp',
    target_filter_criterias: {
      criterias: [
        {
          field: 'id',
          value: ['$$AreaCustomerIds$$'],
          operator: 'in',
        },
        {
          field: 'is_active',
          value: [true],
          operator: '==',
        },
        {
          field: 'record_type',
          value: ['hcp'],
          operator: '==',
        },
      ],
    },
    target_layout_record_type: 'hcp',
  };
  const batchCreateCallPlan = async (data) => {
    const ids = [];
    if (!_.isEmpty(data)) {
      _.map(data, (it, index) => {
        ids.push(_.get(it, 'id'));
      });
    }
    // * 调用自定义action接口
    const response = await CustomActionService.executeAction({
      objectApiName: 'customer',
      action: 'batch_create_call_plan',
      ids,
      token: global.FC_CRM_TOKEN,
      params: {
        selectDay: moment(_.get(thisProps, 'params.selectDay', moment())).valueOf(),
      },
    });
    const responseCode = _.get(response, 'head.code');
    if (responseCode !== 200) {
      toastError(_.get(response, 'head.msg', '未知错误'));
    }
    // * 刷新日历请求
    DeviceEventEmitter.emit('BackCalenderPageEvent');
  };
  const params = {
    actionLayout: changeDoctorLayout,
    repeatList: selectIds,
    callback: batchCreateCallPlan,
  };
  if (moment(_.get(thisProps, 'params.selectDay', moment())).valueOf() > serverTime) {
    // *业务需求只能选择未来时间创建拜访计划
    // *出于安全考虑获取了系统时间作为校验serverTime
    navigation.navigate('RelateModal', params);
  } else {
    toastWaring('只能创建未来日期的拜访计划');
  }
}
