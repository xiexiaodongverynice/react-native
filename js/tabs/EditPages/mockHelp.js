import _ from 'lodash';

export function transformCascade(mockData) {
  const createList = {
    call_survey_feedback_list: _.get(mockData, 'call_survey_feedback_list.create', []),
    call_call_product_list: _.get(mockData, 'call_call_product_list.create', []),
    call_call_key_message_list: _.get(mockData, 'call_call_key_message_list.create', []),
  };
  const updateList = {
    call_survey_feedback_list: _.get(mockData, 'call_survey_feedback_list.update', []),
    call_call_product_list: _.get(mockData, 'call_call_product_list.update', []),
    call_call_key_message_list: _.get(mockData, 'call_call_key_message_list.update', []),
  };
  const deleteList = {
    call_survey_feedback_list: _.get(mockData, 'call_survey_feedback_list.delete', []),
    call_call_product_list: _.get(mockData, 'call_call_product_list.delete', []),
    call_call_key_message_list: _.get(mockData, 'call_call_key_message_list.delete', []),
  };
  return {
    create: createList,
    update: updateList,
    delete: deleteList,
  };
}

export function fn() {}
