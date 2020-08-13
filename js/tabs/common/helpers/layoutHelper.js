import _ from 'lodash';

import LayoutService from '../../../services/layoutService';
import { toastError } from '../../../utils/toast';

export default class LayoutHelper {
  static async getLayout({ objectApiName = '', recordType = '', layoutType = '', navigation }) {
    const layoutResult = await LayoutService.getSepcificLayout({
      objectApiName,
      layoutType,
      recordType,
      token: global.FC_CRM_TOKEN,
    });

    if (!_.isEmpty(layoutResult)) {
      return layoutResult;
    }

    console.error('LayoutHelper getLayout error');
    toastError('请配置布局');
    if (navigation) {
      navigation.goBack();
    }
  }
}
