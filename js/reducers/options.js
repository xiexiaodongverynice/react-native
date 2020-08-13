/*
 Created by Uncle Charlie, 2017/12/22
 */

import { SELECT_PHONE_ACTION } from '../actions/options';

export default function optionsReducer(state = { option: [] }, action = {}) {
  if (action.type === SELECT_PHONE_ACTION) {
    return { option: action.payload };
  }
  return state;
}
