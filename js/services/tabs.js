/**
 * Created by Uncle Charlie, 2017/12/10
 * @flow
 */
import request from '../utils/request';
import Config from '../utils/config';

const TABS_URL = `${Config.baseURL}/${Config.api.tab}`;

export default async function fetchTabs(token) {
  const url = `${TABS_URL}?token=${token}`;
  console.log('==>tabs url', url);
  const data = await request(url);
  return data;
}
