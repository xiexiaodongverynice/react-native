/**
 * @flow
 */
import _ from 'lodash';
import {
  CASCADE_UPDATE_DATA,
  CASCADE_UPDATE_STATUS,
  CASECADE_DELETE_DATA,
  CASECADE_DELETE_ALL_DATA,
  CASECADE_RETRACE_DATA,
  CASECADE_ADD_EMPTY,
} from '../actions/cascadeAction';

type TypeItem = {
  object_describe_name: string, //对应哪个数据库表？实际叫tableName更易于立即
  id: number | string | undefined,
  _id?: string,
  _target_api_name: string,
};
type State = {
  terminationTime: number,
  cascadeList: {
    [objectApiName /*list内的元素，以apiname作为key*/]: {
      [id /*以id作为key*/]: TypeItem,
    },
  },
  cascadeIndexs: [
    //cascadeIndexs是数组
    {
      id: string | number,
      status: 'delete' | 'create' | 'update', //* 判断在cascade所处的位置
      objectApiName: 'string',
      _parentdId: string | number, //*查找父对象
      related_list_name: string, //* 传递cascade的属性
    },
  ],
};

//* cascade
const initState: State = {
  terminationTime: 0, //什么时候清空的？CASECADE_DELETE_ALL_DATA时记录此值
  cascadeList: {},
  cascadeIndexs: [],
};

export default function cascadeReducer(state = initState, action = {}) {
  // * 暂时方案 解决数据异步加载较慢，在clear cascadeData后再传递参数，造成数据错误
  // * clear后存清除时间，小于改时间数据不接收
  // TODO 后续研究使用页面navigation key进行储存的方案
  const terminationTime = _.get(state, 'terminationTime', 0);

  if (action.type === CASCADE_UPDATE_DATA) {
    const payload = _.get(action, 'payload', []);
    if (_.isEmpty(payload)) {
      return { ...state };
    }
    return composeUpdate(state, payload, terminationTime);
  } else if (action.type === CASECADE_DELETE_DATA) {
    const payload = _.get(action, 'payload', []);
    return composeDelete(state, payload, terminationTime);
  } else if (action.type === CASCADE_UPDATE_STATUS) {
    const payload = _.get(action, 'payload', []);

    return updateStatus(state, payload, terminationTime);
  } else if (action.type === CASECADE_DELETE_ALL_DATA) {
    return {
      terminationTime: Date.now(),
      cascadeList: {},
      cascadeIndexs: [],
    };
  } else if (action.type === CASECADE_RETRACE_DATA) {
    const { preCascadeList, preCascadeIndexs } = _.get(action, 'payload', {});
    return { cascadeList: preCascadeList, cascadeIndexs: preCascadeIndexs, terminationTime };
  } else if (action.type === CASECADE_ADD_EMPTY) {
    const relationListName = _.get(action, 'payload.relationListName', '');
    if (!relationListName) return state;

    const cascadeList = _.get(state, 'cascadeList', {});
    if (_.has(cascadeList, relationListName)) return state;
    cascadeList[relationListName] = {};
    return { ...state };
  }

  return state;
}

//action.type === CASCADE_UPDATE_DATA，payload是action.payload，terminationTime是state.terminationTime
function composeUpdate(state: any, payload: Array, terminationTime: number) {
  const cascadeList = _.get(state, 'cascadeList', {});
  const cascadeIndexs = _.get(state, 'cascadeIndexs', []).slice();

  _.each(payload, (item) => {
    const cascadeLimitTime = _.get(item, 'cascadeLimitTime');
    if (cascadeLimitTime && terminationTime > cascadeLimitTime) {
      return;
    }
    const objectApiName = _.get(item, 'object_describe_name');

    if (!objectApiName) return;

    const key = _.get(item, '_id', _.get(item, 'id'));
    const objApiName = _.get(cascadeList, objectApiName, {});

    if (_.isEmpty(objApiName)) {
      cascadeList[objectApiName] = {};
    }

    const oldData = _.get(cascadeList, `${objectApiName}.${key}`, {});
    const newData = { ...oldData, ...item };

    _.set(cascadeList, `${objectApiName}.${key}`, newData);
  });

  return { cascadeList, cascadeIndexs, terminationTime };
}

//action.type === CASCADE_UPDATE_STATUS，payload是action.payload，terminationTime是state.terminationTime
function updateStatus(state: any, payload: Array, terminationTime: number) {
  //不会修改state.cascadeList! 只会修改state.cascadeIndexs
  const cascadeList = _.get(state, 'cascadeList', {});
  const cascadeIndexs = _.get(state, 'cascadeIndexs', []).slice();

  _.each(payload, (item) => {
    //要求item在比DELETE_ALL_DATA之后（DELETE_ALL_DATA 时会记录terminationTime）
    const cascadeLimitTime = _.get(item, 'cascadeLimitTime');
    if (cascadeLimitTime && terminationTime > cascadeLimitTime) {
      return;
    }

    const status = _.get(item, 'status');
    const isTemporary = _.get(item, '_id', false); //default permanent
    _.remove(cascadeIndexs, (e) => e.id == item.id); //移除之前的同id元素

    if (!isTemporary /*permanent*/ || (isTemporary && status === 'create')) {
      cascadeIndexs.push(item);
    }
  });

  return { cascadeList, cascadeIndexs, terminationTime };
}

//action.type === CASECADE_DELETE_DATA，payload是action.payload，terminationTime是state.terminationTime
function composeDelete(state: any, payload: Array, terminationTime: number) {
  //terminationTime未用到，会修改state.cascadeList state.cascadeIndexs
  const cascadeList = _.get(state, 'cascadeList', {});
  const cascadeIndexs = _.get(state, 'cascadeIndexs', []).slice();

  _.each(payload, (item: TypeItem) => {
    const objectApiName = item.object_describe_name;
    const id = _.get(item, 'id', _.get(item, '_id'));
    if (!objectApiName) return;

    //如果此item存在于cascadeList，则从cascadeList中删除
    const itemInCascade = _.get(cascadeList, `${objectApiName}.${id}`, {});
    if (!_.isEmpty(itemInCascade)) {
      delete cascadeList[objectApiName][id];
    }

    //* 删除数据为假数据时，删除index中数据状态
    //遍历cascadeIndexs，寻找下标。要求：寻找status===create、且 id与当前item相同
    //如果找到，将此元素删除
    const matchIndex = _.findIndex(
      cascadeIndexs,
      (e) => _.get(e, 'status') === 'create' && _.get(e, 'id') === id,
    );
    if (matchIndex >= 0) {
      cascadeIndexs.splice(matchIndex, 1); //将此元素删除
    }
  });

  return { cascadeList, cascadeIndexs, terminationTime };
}
