/*
 Created by Uncle Charlie, 2017/12/22
 @flow
 */

const SELECT_PHONE_ACTION = 'options/SELECT_PHONE_ACTION';

export default function optionAction(selected: any): { type: string, payload: any } {
  return {
    type: SELECT_PHONE_ACTION,
    payload: selected,
  };
}

export { SELECT_PHONE_ACTION };
