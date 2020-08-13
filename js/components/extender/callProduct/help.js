import _ from 'lodash';

const composeCallCascade = ({ checkList, cascadeList, cascadeIndex, key, parentCallId }) => {
  const resultData = _.cloneDeep(checkList);

  const cascadeClmMap = _.filter(cascadeIndex, (e) => {
    if (parentCallId) {
      return _.get(e, '_parentId') == parentCallId && _.get(e, 'objectApiName') === key;
    } else {
      return !_.get(e, '_parentId') && _.get(e, 'objectApiName') === key;
    }
  }).sort((e) => (_.get(e, 'status') === 'delete' ? -1 : 1));

  _.each(cascadeClmMap, (item) => {
    const status = _.get(item, 'status');
    const id = _.get(item, 'id');
    if (status === 'create') {
      resultData.push(cascadeList[id]);
    } else if (status === 'delete') {
      _.remove(resultData, (e) => _.get(e, 'id') === _.get(item, 'id'));
    } else if (status === 'update') {
      _.remove(resultData, (e) => _.get(e, 'id') === _.get(item, 'id'));
      resultData.push(cascadeList[id]);
    }
  });

  return resultData;
};

export { composeCallCascade };
