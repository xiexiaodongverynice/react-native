import { toastError } from '../utils/toast';
import I18n from '../i18n';
import _ from 'lodash';

export const handleResult = (result) => {
  return _.get(handleResponse(result), 'body');
};

export const handleResponse = (result) => {
  if (!result) {
    return null;
  }
  const { head } = result;
  if (head) {
    const { code, msg } = head;
    if ([200, 201].includes(code)) {
      return result;
    }
    if ([400, 500].includes(code)) {
      if (msg) {
        toastError(msg);
      } else {
        toastError(I18n.t('something_unknown_happened'));
      }
      return;
    }
    if ([404].includes(code)) {
      toastError(I18n.t('connect_error'));
      return;
    }
    if ([401].includes(code)) {
      toastError(I18n.t('time_out_re_login_msg'));
      return;
    }
  }
  return result;
};

export const handleSSOResult = (result) => {
  if (!result) return null;

  const { head } = result;
  if (head) {
    const { code, msg } = head;
    if ([200, 201].includes(code)) {
      return _.get(result, 'body');
    } else {
      if (msg) {
        toastError(msg);
      }
    }
  }
};
