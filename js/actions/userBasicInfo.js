/**
 * Create by Uncle Charlie, 2/1/2018
 * @flow
 */

const USER_INFO_QUERY_START = 'userInfo/query_start';
const USER_INFO_QUERY_SUCCESS = 'userInfo/query_success';
const USER_INFO_QUERY_FAILED = 'userInfo/query_failed';

export default function queryUserInfo(objectApiName: string, userId: string, token: string) {
  return {
    type: USER_INFO_QUERY_START,
    payload: {
      objectApiName,
      userId,
      token,
    },
  };
}

export { USER_INFO_QUERY_START, USER_INFO_QUERY_SUCCESS, USER_INFO_QUERY_FAILED };
