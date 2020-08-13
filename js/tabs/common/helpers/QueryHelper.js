import { initScreenState } from '../../../reducers/query';
import _ from 'lodash';

export const getQueryInitialState = ({ state, screen }) => {
  const key = _.get(screen, 'navigation.state.key');
  let query;
  if (_.has(state.query, key)) {
    query = state.query[key];
  } else {
    query = initScreenState;
  }
  return query;
};

export const getObjectApiNameFromProps = (props) => {
  const {
    navigation,
    screenInfo: { objectApiName },
  } = props;
  const navParam = _.get(navigation, 'state.params.navParam', {});
  const targetApiName = navParam.objectApiName || navParam.object_describe_name;
  return targetApiName || objectApiName;
};
