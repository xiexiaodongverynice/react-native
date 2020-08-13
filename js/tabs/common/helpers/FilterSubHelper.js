/**
 * @flow
 * * 筛选下属公共方法
 */

import _ from 'lodash';

export default class FilterSubHelper {
  /**
   *
   *
   * @static
   * @param {Object} extender_all
   * * filterSubCriterias 筛选基础条件 selectItems 选中下属items， otherSubFilter附带筛选下属条件(现仅用于一人多岗belong_territory)
   * @param {(filterSubCriterias, selectItems, otherSubFilter) => void}
   * @param {Array} [stashSubOptions=[]]
   * @param {?Array} [territoryCriterias=[]]
   * @returns
   * @memberof FilterSubHelper
   */
  static composeParams(
    extender_all: Object,
    callback: (filterSubCriterias, selectItems, otherSubFilter) => void = () => {},
    stashSubOptions: Array = [],
    territoryCriterias: ?Array = [],
  ) {
    const options = [];

    const extender_option = _.get(extender_all, 'extender_option', null);

    // * 普通过滤条件
    let filterSubCriterias = _.cloneDeep(_.get(extender_all, 'filter_criterias', null));

    // * 针对一人多岗，belong_territory
    const otherSubFilter = [];
    const needBelongTerritory = _.get(extender_all, 'need_belong_territory', false);
    const belongTerritoryCri = {
      field: 'belong_territory',
      operator: 'in',
    };

    // * 岗位过滤条件
    const filterSubTerritoryCriterias = _.cloneDeep(
      _.get(extender_all, 'filter_territory_criterias', ''),
    );

    if (!_.isEmpty(extender_option)) {
      // * sub_type 默认 by_territory
      const subType = _.get(extender_option, 'sub_type', 'by_territory');
      const subtypeList = global.fc_getSubordinates(subType);
      _.each(subtypeList, (subitem) => {
        options.push({
          label: subitem.name,
          value: subitem.id,
          item: subitem,
        });
      });
    } else {
      //? 是否有条件会以下情况
      // const userId = global.FC_CRM_USERID;
      const subList = global.FC_CRM_SUBORDINATES;
      const allList = global.FC_CRM_ALL_SUBORDINATES;
      _.each(allList, (listItem) => {
        if (listItem && listItem.id === global.FC_CRM_USERID) {
          options.push({
            label: listItem.name,
            value: listItem.id,
            item: listItem,
          });
        }
      });
      if (subList && subList.length > 0) {
        _.each(subList, (sub) => {
          if (sub && sub.id !== global.FC_CRM_USERID) {
            options.push({
              label: sub.name,
              value: sub.id,
              item: sub,
            });
          }
        });
      }
    }

    const param = {
      multipleSelect: true,
      options,
      stashSubOptions,
      callback: (item) => {
        const selectItems = item.selected;
        const createBys = [];
        const territoryIdMap = [];
        _.each(selectItems, (select) => {
          const territoryId = _.get(select, 'item.territory_id');
          if (territoryId) {
            territoryIdMap.push(`${territoryId}`);
          }
          if (select.value) {
            createBys.push(`${select.value}`);
          }
        });

        // * filter_criterias 用于 criterias, filter_territory_criterias 用于 territoryCriterias
        // * 都未配置则 criterias 添加 create_by 查询条件
        if (!_.isEmpty(filterSubCriterias) && !_.isEmpty(createBys)) {
          filterSubCriterias.value = createBys;
        } else if (!_.isEmpty(filterSubTerritoryCriterias)) {
          const matchSubTerritoryIndex = _.findIndex(territoryCriterias, (cri) => {
            if (
              _.get(cri, 'field', null) === _.get(filterSubTerritoryCriterias, 'field', null) &&
              _.get(cri, 'operator', null) === _.get(filterSubTerritoryCriterias, 'operator', null)
            ) {
              return true;
            }
          });

          const territoryIdMaps = _.chain(selectItems)
            .filter((e) => _.has(e, 'item.territory_id'))
            .map((i) => `${_.get(i, 'item.territory_id')}`)
            .valueOf();

          if (matchSubTerritoryIndex > -1) {
            if (_.isEmpty(territoryIdMaps)) {
              territoryCriterias.splice(matchSubTerritoryIndex, matchSubTerritoryIndex + 1);
            } else {
              territoryCriterias[matchSubTerritoryIndex].value = territoryIdMaps;
            }
          } else if (!_.isEmpty(territoryIdMaps)) {
            filterSubTerritoryCriterias.value = territoryIdMaps;
            territoryCriterias.push(filterSubTerritoryCriterias);
          }
        } else if (!_.isEmpty(createBys)) {
          filterSubCriterias = {
            field: 'create_by',
            operator: 'in',
            value: createBys,
          };
        }

        //* 一人多岗，一个人有多个岗位，用来区分不同岗位数据
        if (needBelongTerritory && !_.isEmpty(territoryIdMap)) {
          belongTerritoryCri.value = territoryIdMap;
          otherSubFilter.push(belongTerritoryCri);
        }

        callback(filterSubCriterias, selectItems, otherSubFilter);
      },
    };

    return param;
  }
}
