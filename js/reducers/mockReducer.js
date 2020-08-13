/**
 * Created by Uncle Charlie, 2017/12/06
 */
import _ from 'lodash';
import { MOCK_DELETE, MOCK_DELETE_ALL, MOCK_UPDATE } from '../actions/mock';

const initState = {};

export default function mockReducer(state = initState, action = {}) {
  if (action.type === MOCK_UPDATE) {
    const product = _.get(action, 'payload', {});
    if (_.isEmpty(product)) {
      return state;
    }

    const id = _.get(action, 'id');
    const oldMcok = _.get(state, id, {});
    const resultProduct = composeProduct(product, oldMcok);
    return {
      ...state,
      [id]: resultProduct,
    };
  } else if (action.type === MOCK_DELETE_ALL) {
    return {};
  }
  return state;
}

function composeProduct(product, oldMcok) {
  let call_call_product_list = {
    create: _.get(product, 'create.call_call_product_list', []),
    delete: _.get(product, 'delete.call_call_product_list', []),
    update: _.get(product, 'update.call_call_product_list', []),
  };

  let call_call_key_message_list = {
    create: _.get(product, 'create.call_call_key_message_list', []),
    delete: _.get(product, 'delete.call_call_key_message_list', []),
    update: _.get(product, 'update.call_call_key_message_list', []),
  };

  let call_survey_feedback_list = {
    create: _.get(product, 'create.call_survey_feedback_list', []),
    delete: _.get(product, 'delete.call_survey_feedback_list', []),
    update: _.get(product, 'update.call_survey_feedback_list', []),
  };

  call_call_product_list = updateMockData(
    call_call_product_list,
    oldMcok,
    'call_call_product_list',
    'product',
  );

  call_call_key_message_list = updateMockData(
    call_call_key_message_list,
    oldMcok,
    'call_call_key_message_list',
    'key_message',
  );

  call_survey_feedback_list = updateMockData(
    call_survey_feedback_list,
    oldMcok,
    'call_survey_feedback_list',
    'clm_presentation',
  );

  return { call_call_key_message_list, call_call_product_list, call_survey_feedback_list };
}

function updateMockData(updateData, oldMcok, relateListName, comparison) {
  const oldSurveyFeedback = _.get(oldMcok, relateListName, {});

  const old_createList = _.get(oldSurveyFeedback, 'create', []);
  const old_updateList = _.get(oldSurveyFeedback, 'update', []);
  const old_deleteList = _.get(oldSurveyFeedback, 'delete', []);

  if (_.isEmpty(old_createList) && _.isEmpty(old_updateList) && _.isEmpty(old_deleteList)) {
    return updateData;
  }
  const resultData = {
    create: old_createList,
    update: old_updateList,
    delete: old_deleteList,
  };

  const update_createList = _.get(updateData, 'create', []);
  const update_updateList = _.get(updateData, 'update', []);
  const update_deleteList = _.get(updateData, 'delete', []);

  if (!_.isEmpty(update_deleteList)) {
    //* 删除操作 old create中有值，则删除create中对应的值
    _.each(update_deleteList, (item) => {
      let removeClm;
      _.each(resultData.create, (e) => {
        if (e[comparison] == item[comparison]) {
          removeClm = item;
          return false;
        }
      });
      if (!_.isEmpty(removeClm)) {
        _.remove(resultData.create, (e) => e[comparison] == removeClm[comparison]);
      }
    });

    //* 删除操作 old update中有值，则删除update中对应的值
    _.each(update_deleteList, (item) => {
      let removeClm;
      _.each(resultData.update, (e) => {
        if (e[comparison] == item[comparison]) {
          removeClm = item;
          return false;
        }
      });
      if (!_.isEmpty(removeClm)) {
        _.remove(resultData.update, (e) => e[comparison] == removeClm[comparison]);
        resultData.delete.push(removeClm);
      }
    });
  }

  if (!_.isEmpty(update_createList)) {
    _.each(update_createList, (item) => {
      resultData.create.push(item);
    });
  }

  if (!_.isEmpty(update_updateList)) {
    //* 更新操作 old create中有值，则更新create
    _.each(update_updateList, (item) => {
      resultData.create = _.map(resultData.create, (e) => {
        if (e[comparison] == item[comparison]) {
          return _.assign({}, e, item);
        } else {
          return e;
        }
      });
    });

    //* 更新操作 old update中有值，则更新update
    _.each(update_updateList, (item) => {
      resultData.update = _.map(resultData.update, (e) => {
        if (e[comparison] == item[comparison]) {
          return _.assign({}, e, item);
        } else {
          return e;
        }
      });
    });
  }

  return resultData;
}
