import _ from 'lodash';

export function mapDeleteDuplicating(arr, delectMark) {
  const mapObj = new Map();
  _.map(arr, (item, index) => {
    if (!mapObj.has(item[delectMark])) {
      mapObj.set(item[delectMark], item);
    }
  });
  return [...mapObj.values()];
}

export function unique0(arr) {
  return Array.from(new Set(arr));
}

export function unique1(arr) {
  return [...new Set(arr)];
}
