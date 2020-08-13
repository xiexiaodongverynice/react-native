/*
  Created by Uncle Charlie, 2017/11/22
 */

const MOCK_UPDATE = 'MOCK_UPDATE';
const MOCK_DELETE = 'MOCK_DELETE';
const MOCK_DELETE_ALL = 'MOCK_DELETE_ALL';

export function mockUpdate(payload, id) {
  return {
    type: MOCK_UPDATE,
    payload,
    id,
  };
}

export function mockDelete(payload) {
  return {
    type: MOCK_DELETE,
    payload,
  };
}

export function mockDeleteAll(payload) {
  return {
    type: MOCK_DELETE_ALL,
    payload,
  };
}

export { MOCK_UPDATE, MOCK_DELETE, MOCK_DELETE_ALL };
