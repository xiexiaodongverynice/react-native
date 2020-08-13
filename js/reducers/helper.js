/**
 *
 * @param {state} state
 * @param {key} key 命名空间，一般通过navigation获取key，唯一
 * @param {newState} newState
 */
import _ from 'lodash';

const reAssignTargetStateByKey = (state, key, newState, initScreenState = {}) => {
  const targetState = _.result(state, key, {});
  return {
    [key]: Object.assign({}, initScreenState, targetState, newState),
  };
};

export { reAssignTargetStateByKey };
