/**
 * * 用于修改cascade
 * @flow
 */

import _ from 'lodash';
import {
  cascadeDeleteData,
  cascadeUpdateData,
  cascadeUpdateStatus,
} from '../../actions/cascadeAction';

const CASCADE_INIT = 'init';
const CASCADE_CREATE = 'create';
const CASCADE_UPDATE = 'update';
const CASCADE_DELETE = 'delete';

export { CASCADE_INIT, CASCADE_CREATE, CASCADE_UPDATE, CASCADE_DELETE };

type cascadeUpdateType = {
  data: Object | Array,
  relatedListName: string,
  status: 'create' | 'delete' | 'update',
  parentId: number,
  dispatch: void,
  fakeId: number | string,
  cascadeLimitTime: number,
};

const handleUpdateCascade = ({
  data,
  relatedListName,
  status,
  parentId,
  dispatch,
  fakeId,
  cascadeLimitTime,
}: cascadeUpdateType) => {
  if (_.isEmpty(data)) return;

  if (_.isArray(data)) {
    _.each(data, (item) =>
      changeCascade(item, relatedListName, status, parentId, dispatch, fakeId, cascadeLimitTime),
    );
  } else if (_.isObject(data)) {
    changeCascade(data, relatedListName, status, parentId, dispatch, fakeId, cascadeLimitTime);
  }
};

const changeCascade = (
  item,
  relatedListName,
  status,
  parentId,
  dispatch,
  fakeId,
  cascadeLimitTime = 0,
) => {
  if (status === CASCADE_INIT) {
    const resultData = {
      ...item,
      object_describe_name: relatedListName,
      cascadeLimitTime,
    };
    dispatch(cascadeUpdateData([resultData]));
  } else if (status === CASCADE_CREATE) {
    //* 如果传入了fakeId，则以fakeId为_id,否则使用时间戳
    const _id = fakeId || Date.now();
    const resultData = {
      ...item,
      object_describe_name: relatedListName,
      _id,
      cascadeLimitTime,
    };
    dispatch(cascadeUpdateData([resultData]));

    const updateStatus = {
      id: _id,
      _id,
      status: CASCADE_CREATE,
      objectApiName: relatedListName,
      _parentId: parentId,
      related_list_name: relatedListName,
      cascadeLimitTime,
    };
    dispatch(cascadeUpdateStatus([updateStatus]));
  } else if (status === CASCADE_DELETE) {
    const id = _.get(item, 'id', _.get(item, '_id'));
    const resultData = {
      object_describe_name: relatedListName,
      id,
      cascadeLimitTime,
    };
    dispatch(cascadeDeleteData([resultData]));

    // * 当删除数据库数据,保留delete status
    if (!_.has(item, '_id')) {
      const deleteParams = {
        id,
        status: CASCADE_DELETE,
        objectApiName: relatedListName,
        _parentId: parentId,
        related_list_name: relatedListName,
        cascadeLimitTime,
      };

      dispatch(cascadeUpdateStatus([deleteParams]));
    }
  } else if (status === CASCADE_UPDATE) {
    const id = _.get(item, 'id', _.get(item, '_id'));

    const resultData = {
      ...item,
      object_describe_name: relatedListName,
      cascadeLimitTime,
    };
    dispatch(cascadeUpdateData([resultData]));

    if (!_.has(item, '_id')) {
      const updateStatus = {
        id,
        status: CASCADE_UPDATE,
        objectApiName: relatedListName,
        _parentId: parentId,
        related_list_name: relatedListName,
        cascadeLimitTime,
      };
      dispatch(cascadeUpdateStatus([updateStatus]));
    }
  }
};

export default handleUpdateCascade;
