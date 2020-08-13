/**
 * @flow
 */

import _ from 'lodash';
import { composeOptionType, subOption } from './type';

export default class SubordinateHelp {
  static getSelectSubordinate({
    composeOptions,
    territoryId,
    selectData,
  }: {
    composeOptions: composeOptionType,
    territoryId: number | string,
    selectData: subOption,
  }) {
    const assignData = getUserId(selectData) ? { [territoryId]: selectData } : {};

    SubordinateHelp.recursionSubordinate({
      ParentTerritoryId: territoryId,
      assignData,
      composeOptions,
    });
    return assignData;
  }

  static recursionSubordinate({ ParentTerritoryId, assignData, composeOptions }) {
    const existSub = _.get(composeOptions, ParentTerritoryId);
    if (!existSub) return;

    _.each(existSub, (option) => {
      const subTerritoryId = getTerritoryId(option);
      const subId = getUserId(option);
      if (subId) {
        assignData[subTerritoryId] = option;
      }
      SubordinateHelp.recursionSubordinate({
        ParentTerritoryId: subTerritoryId,
        assignData,
        composeOptions,
      });
    });
  }

  static removeAllSubordinate({ assignState, subordinateSet }) {
    _.each(subordinateSet, (option, key) => {
      _.has(assignState, key) && delete assignState[key];
    });
  }

  static addAllSubordinate({ assignState, subordinateSet }) {
    _.each(subordinateSet, (option, key) => {
      !_.has(assignState, key) && (assignState[key] = option);
    });
  }
}

export const getTerritoryId = (data) => _.get(data, 'item.territory_id');

export const getParentTerritoryId = (data) => _.get(data, 'item.parent_territory_id');

export const getUserId = (data) => _.get(data, 'item.id');
