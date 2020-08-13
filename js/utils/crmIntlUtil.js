import _ from 'lodash';

const intlValue = (key, default_text = '') => {
  return _.get(global.INTL_UTIL_DATA, key, default_text);
};

const intlValueMessage = (key) => {
  if (!key) {
    return '';
  }
  return _.get(global.INTL_UTIL_DATA, key, key);
};

export { intlValue, intlValueMessage };
