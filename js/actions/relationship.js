/**
 * Create by Uncle Charlie, 29/12/2017
 * @flow
 */

const RELATIONSHIP_QUERY_LAYOUT_START = 'relationship/query_layout_start';
const RELATIONSHIP_QUERY_LAYOUT_SUCCESS = 'relationship/query_layout_success';
const RELATIONSHIP_QUERY_LAYOUT_FAILED = 'relationship/query_layout_failed';

const RELATIONSHIP_QUERY_DATA_START = 'relationship/query_data_start';
const RELATIONSHIP_QUERY_DATA_SUCCESS = 'relationship/query_data_success';
const RELATIONSHIP_QUERY_DATA_FAILED = 'relationship/query_data_failed';

const RELATIONSHIP_QUERY_DATA_LOAD_MORE_START = 'relationship/query_data_load_more_start';
const RELATIONSHIP_QUERY_DATA_LOAD_MORE_SUCCESS = 'relationship/query_data_load_more_success';
const RELATIONSHIP_QUERY_DATA_LOAD_MORE_FAILED = 'relationship/query_data_load_more_failed';

const RELATIONSHIP_SEARCH = 'relationship/search_in_data';
const RELATIONSHIP_SELECT_PARENT = 'relationship/select_parent';

export function layoutAction(
  token: string,
  recordType: string,
  objectApiName: string,
): { type: string, payload: any } {
  return {
    type: RELATIONSHIP_QUERY_LAYOUT_START,
    payload: {
      token,
      recordType,
      objectApiName,
      layoutType: 'relation_lookup_page',
    },
  };
}

export function dataAction(
  token: string,
  objectApiName: string,
  criteria: Array<any>,
  joiner: string,
  pageSize: number,
  pageNo: number,
) {
  return {
    type: RELATIONSHIP_QUERY_DATA_START,
    payload: {
      token,
      objectApiName,
      joiner,
      criteria,
      pageSize,
      pageNo,
    },
  };
}

export function loadMoreAction(
  token: string,
  objectApiName: string,
  criteria: Array<any>,
  joiner: string,
  pageSize: number,
  pageNo: number,
) {
  return {
    type: RELATIONSHIP_QUERY_DATA_LOAD_MORE_START,
    payload: {
      token,
      objectApiName,
      joiner,
      criteria,
      pageSize,
      pageNo,
    },
  };
}

// TODO: deprecated???
export function selectParentAction(selected) {
  return {
    type: RELATIONSHIP_SELECT_PARENT,
    payload: selected,
  };
}

export function searchAction(searchText: string) {
  return {
    type: RELATIONSHIP_SEARCH,
    payload,
    searchText,
  };
}

export {
  RELATIONSHIP_QUERY_LAYOUT_START,
  RELATIONSHIP_QUERY_DATA_START,
  RELATIONSHIP_QUERY_DATA_FAILED,
  RELATIONSHIP_QUERY_DATA_SUCCESS,
  RELATIONSHIP_QUERY_LAYOUT_FAILED,
  RELATIONSHIP_QUERY_LAYOUT_SUCCESS,
  RELATIONSHIP_QUERY_DATA_LOAD_MORE_START,
  RELATIONSHIP_QUERY_DATA_LOAD_MORE_FAILED,
  RELATIONSHIP_QUERY_DATA_LOAD_MORE_SUCCESS,
  RELATIONSHIP_SEARCH,
  RELATIONSHIP_SELECT_PARENT,
};
