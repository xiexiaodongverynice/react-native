/*
 Created by Uncle Charlie, 2017/11/23
 @flow
 */

export default function requestReportData(url) {
  return fetch(url, {
    method: 'GET',
  }).then(
    (res) => {
      console.log('====response', res);
      return res.json();
    },
    (err) => console.log('===> error', err),
  );
}
