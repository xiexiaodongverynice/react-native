import _ from 'lodash';
import Globals from '../Globals';
import UserService from '../../services/userService';

export default {
  async setGlobalHelper(data) {
    const currentUserId = _.get(data, 'userInfo.id', '');
    await Globals.setGlobalCRMSettings(
      _.get(data, 'active_territory'),
      _.get(data, 'crmPowerSetting', {}),
      currentUserId,
      _.get(data, 'token', ''),
      _.get(data, 'userInfo', {}),
      _.get(data, 'profile', {}),
      _.get(data, 'permission', {}),
      _.get(data, 'objectDescription', {}),
      data,
    );
  },
};
