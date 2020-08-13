/* eslint class-methods-use-this:0 */
/**
 * Created by Uncle Charlie, 2018/01/26
 * @flow
 */

import _ from 'lodash';
import type { AllLayout } from './httpRequest';
import HttpRequest from './httpRequest';
import CacheService from '../services/cache';

export interface LayoutCondition {
  objectApiName: string;
  layoutType: string;
  recordType: string;
  token: string;
}

export default class LayoutService {
  static directLayouts: any = [];
  token: ?string = null;
  layoutItems: ?Array<Layout> = null;

  constructor(token: string) {
    this.token = token;
  }

  static async _cacheLayout(layout: Layout, cacheKey: string): Promise<boolean> {
    const result: boolean = await CacheService.cacheLayout(cacheKey, layout);
    return result;
  }

  static async _getLayoutCache(apiName: string): Promise<?Layout> {
    try {
      const layouts: Layout = await CacheService.loadLayoutCache(apiName);
      return layouts;
    } catch (e) {
      console.warn('[error] _getLayoutCache', e);
      return null;
    }
  }

  static async getSepcificLayout({
    objectApiName,
    layoutType,
    recordType,
    token,
    headerLogs = {},
  }: LayoutCondition): ?Layout {
    try {
      const layoutApiName = getLayoutApiName(objectApiName, recordType, layoutType);

      //* 获取布局version
      const { version: requestVersion } = await HttpRequest.requestPageLayoutVersion({
        recordType,
        objectApiName,
        layoutType,
        token,
        headerLogs,
      });

      const layout = _.get(LayoutService.directLayouts, layoutApiName);

      if (!_.isEmpty(layout) && layout.version === requestVersion) {
        return layout;
      }

      const cachedLayout: ?Layout = await LayoutService._getLayoutCache(layoutApiName);

      if (
        !_.isEmpty(cachedLayout) &&
        !_.isNull(cachedLayout) &&
        cachedLayout.version === requestVersion
      ) {
        LayoutService.directLayouts[layoutApiName] = cachedLayout;
        return cachedLayout;
      }

      // If still no cached layout, request it from server
      const resultLayout = await HttpRequest.requestPageLayout({
        recordType,
        objectApiName,
        layoutType,
        token,
        headerLogs,
      });

      if (_.isEmpty(resultLayout)) {
        return null;
      }

      await LayoutService._cacheLayout(
        resultLayout,
        getLayoutApiName(objectApiName, recordType, layoutType),
      );
      LayoutService.directLayouts[layoutApiName] = resultLayout;

      return resultLayout;
    } catch (e) {
      console.warn('[error] getSepcificLayout', e);
      return null;
    }
  }

  static async getCalenderLayout(token: string) {
    const calenderLayout = await HttpRequest.requestCalenderLayout({ token });
    return calenderLayout;
  }
}

function getLayoutApiName(objectApiName: string, recordType: string, layoutType: string): string {
  return `layout_${objectApiName}_${recordType}_${layoutType}_${global.FC_CRM_USERID}`;
}
