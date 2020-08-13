/**
 * Create by Uncle Charlie, 2/1/2018
 * @flow
 */

const INNER_QUERY_START = 'inner/query_start';
const INNER_QUERY_SUCCESS = 'inner/query_success';
const INNER_QUERY_FAILED = 'inner/query_failed';

export default function innerQueryAction(
  innerType: string,
  token: string,
  userId: string,
  criteria: Array<{ field: string, operator: string, value: string[] }>,
  objectApiName: string,
  order: string,
  orderBy: string,
) {
  return {
    type: INNER_QUERY_START,
    payload: {
      innerType,
      token,
      userId,
      criteria,
      objectApiName,
      order,
      orderBy,
    },
  };
}

export { INNER_QUERY_START, INNER_QUERY_SUCCESS, INNER_QUERY_FAILED };
