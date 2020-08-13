/*  eslint-disable */
import React from 'react';
import moment from 'moment';
import _ from 'lodash';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import themes from '../../common/theme';
import RXIndexScreen from './RX_IndexScreen';
import OTCIndexScreen from './OTC_IndexScreen';
import LoadingScreen from '../../common/LoadingScreen';
import IndexScreen from '../../IndexScreen';
import { JMKX_PROFILE, JMKX_DUTY, JMKX_CUSTOMIZE_MENUS, WHITE_PARAMS } from './utils';
import { TENANT_ID_COLLECT } from '../../../utils/const';

import {
  JMKX_LIST_SUMMURY_START,
  jmkxListSummury,
  jmkxListSummuryClean,
} from '../../../actions/customized';
import requestLayout, { setCacheLayout } from '../../../actions/pageLayout';
import { queryRecordListAction, clearQuery } from '../../../actions/query';
import { needRefreshAttendee } from '../../../actions/event';
import { of } from 'rxjs/observable/of';

class JMKXIndexScreen extends React.Component {
  state = {
    profile_name: '',
    isPass: false,
    title: '',
  };
  componentDidMount() {
    const {
      token,
      objectDescription,
      permission,
      profile,
      navigation: { dispatch },
      actions,
      screenInfo = {},
      userInfo,
    } = this.props;
    const { objectApiName, recordType } = screenInfo;
    const { api_name } = profile;
    //从首页进入功能获取objectApiName和recordType
    let queryApiName = objectApiName;
    let homeRecordType = recordType;
    if (!objectApiName) {
      queryApiName = _.get(this.props.navigation, 'state.params.navParam.objectApiName', '');
    }
    if (!recordType) {
      homeRecordType = _.get(this.props.navigation, 'state.params.navParam.record_type');
      //从首页进入功能拿到的record_type会是个数组？？？
    }
    //判断允许定制菜单进入界面
    let menuData = {};
    const passPage = (jmkxCustomizeMenus) => {
      menuData = _.find(jmkxCustomizeMenus, (item) => {
        let recordTypeMark;
        if (_.isArray(homeRecordType)) {
          recordTypeMark = _.includes(homeRecordType, item.recordType);
        } else if (homeRecordType) {
          recordTypeMark = item.recordType == homeRecordType;
        }
        let objectApiNameMark = item.objectApiName === queryApiName;
        if (recordTypeMark && objectApiNameMark) {
          return true;
        }
      });
    };
    if (JMKX_PROFILE.OTC.includes(api_name)) {
      passPage(JMKX_CUSTOMIZE_MENUS.OTC);
    } else if (JMKX_PROFILE.RX.includes(api_name)) {
      passPage(JMKX_CUSTOMIZE_MENUS.RX);
    }
    let isPassMark = false;
    if (!_.isEmpty(menuData)) {
      isPassMark = true;
      this.setState({
        isPass: true,
        title: menuData.menu,
      });
    }
    const { duty__r = {} } = userInfo;
    //// otc_gm 第一层全国总 otc_rsd 第二层大区总
    //// rx_gm、rx_ka_rsd、rx_medical_rsd 第一层全国总、副总，  rx_ka_rsm、rx_medical_rsm 第二层 省区经理、大区经理
    // console.log('otc_gm 第一层全国总 otc_rsd 第二===>', this.props);
    const body = {};
    const { isPass } = this.state;
    if ((JMKX_PROFILE.OTC.includes(api_name) || JMKX_PROFILE.RX.includes(api_name)) && isPassMark) {
      const dutyName = _.get(duty__r, 'name', '');
      // console.log('otc_gm 第一层全国总 otc_rsd 第二===>', dutyName, this.props);
      let productLine = '';
      if (JMKX_PROFILE.OTC.includes(api_name)) {
        body['belonged_product_line'] = 'otc';
        if (JMKX_DUTY.OTC.includes(dutyName) && dutyName.indexOf('销售一部') > -1) {
          body['belonged_first_level_territory'] = '销售一部';
        } else if (JMKX_DUTY.OTC.includes(dutyName) && dutyName.indexOf('销售二部') > -1) {
          body['belonged_first_level_territory'] = '销售二部';
        }
        productLine = 'otc';
      } else if (JMKX_PROFILE.RX.includes(api_name)) {
        const record_type = _.get(menuData, 'record_type', '');
        if (api_name == 'rx_gm') {
          body['belonged_product_line'] = ['rx', 'rx_ka', 'rx_me', 'rx_mkt'];
        } else if (api_name == 'rx_medical_rsd') {
          body['belonged_product_line'] = ['rx_me'];
        } else if (api_name == 'rx_ka_rsd') {
          body['belonged_product_line'] = ['rx_ka', 'rx_mkt'];
        }
        body['record_type'] = record_type;
        productLine = 'rx';
      }
      /**
       * menuData中的参数白名单
       */
      WHITE_PARAMS.forEach((param_name) => {
        const param_value = _.get(menuData, param_name);
        if (!_.isNull(param_value)) {
          body[param_name] = param_value;
        }
      });
      const payload = {
        head: { token },
        body: body,
      };
      const params = {
        objectApiName: queryApiName,
        recordType: _.get(menuData, 'recordType'),
        productLine,
        payload,
      };
      actions.jmkxListSummuryClean();
      actions.jmkxListSummury(params);
    }
    this.setState({
      profile_name: api_name,
      menuData,
      dutyName: body['belonged_first_level_territory']
        ? body['belonged_first_level_territory']
        : '全国',
    });
  }
  static getDerivedStateFromProps(props, state) {
    const { indexData = {}, profile } = props;
    const { result = [] } = indexData;
    // if (result.length > 0) {
    return {
      ...indexData,
      profile_name: _.get(profile, 'api_name', ''),
    };
    // }
    // return null;
  }
  render() {
    const { profile_name = '', result = [], isPass } = this.state;
    const { profile } = this.props;
    const { tenant_id } = profile;
    if (profile_name) {
      if (
        TENANT_ID_COLLECT.JMKX_TENEMENT.includes(tenant_id) &&
        JMKX_PROFILE.OTC.includes(profile_name) &&
        isPass
      ) {
        return <OTCIndexScreen {...this.props} indexData={this.state} />;
      } else if (
        TENANT_ID_COLLECT.JMKX_TENEMENT.includes(tenant_id) &&
        JMKX_PROFILE.RX.includes(profile_name) &&
        isPass
      ) {
        return <RXIndexScreen {...this.props} indexData={this.state} />;
      } else {
        return <IndexScreen {...this.props} />;
      }
    }
    return <LoadingScreen />;
  }
}

const select = (state) => ({
  token: state.settings.token,
  objectDescription: state.settings.objectDescription,
  permission: state.settings.permission,
  profile: state.settings.profile,
  userInfo: state.settings.userInfo,
  indexData: state.jmkxIndex,
});
const act = (dispatch, { navigation }) => {
  const key = _.get(navigation, 'state.key');
  return {
    actions: bindActionCreators(
      {
        layoutAction: requestLayout,
        queryRecordListAction,
        setCacheLayout,
        needRefreshAttendee,
        clearQuery: clearQuery(key),
        jmkxListSummury,
        jmkxListSummuryClean,
      },
      dispatch,
    ),
  };
};


export default connect(select, act)(JMKXIndexScreen);
