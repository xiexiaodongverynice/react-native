import _ from 'lodash';
import { validPreProduct } from '../customized/jmkx/validPreProduct';

//* 储存新数据到对应的cascadeData
export function saveCascadeList(list, children, allData, detailLayout) {
  try {
    const cascadeData = list;
    const relate_list_name = _.get(children, 'related_list_name');
    const id = _.get(children, 'id');
    const objectApiName = _.get(children, 'objectApiName');
    const relateList = _.get(list, relate_list_name, []);

    if (_.isEmpty(relateList)) {
      cascadeData[relate_list_name] = [];
    }

    const omitIdData = _.chain(allData[objectApiName][id])
      .cloneDeep()
      .omit('id')
      .value();

    //* 产品预加载定制兼容方案
    if (!validPreProduct(omitIdData, objectApiName, detailLayout)) {
      cascadeData[relate_list_name].push(omitIdData);
    }

    return cascadeData;
  } catch (e) {
    console.error('saveRelateList error', e);
    return list;
  }
}

export function getComposeCascadeData(
  processedData = {},
  cascadeIndexs = [],
  cascadeList = {},
  detailLayout,
) {
  const majorId = _.get(processedData, 'id');

  let createList = _.cloneDeep(_.get(processedData, '_cascade.create', {}));

  _.each(cascadeIndexs, (children) => {
    if (_.get(children, '_parentId') == majorId || _.get(children, '_parentId') === undefined) {
      //* 本地缓存数据处理
      createList = saveCascadeList(createList, children, cascadeList, detailLayout);
    }
  });

  processedData._cascade = {
    create: createList,
    update: {},
    delete: {},
  };

  return processedData;
}
