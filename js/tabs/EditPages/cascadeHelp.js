import _ from 'lodash';
import { validPreProduct } from '../customized/jmkx/validPreProduct';

//* 储存新数据到对应的cascadeData
export function saveCascadeList(list, children, allData, status, detailLayout = {}) {
  try {
    const cascadeData = list;
    const relate_list_name = _.get(children, 'related_list_name');
    const id = _.get(children, 'id');
    const objectApiName = _.get(children, 'objectApiName');
    const relateList = _.get(list, relate_list_name, []);

    if (_.isEmpty(relateList)) {
      cascadeData[relate_list_name] = [];
    }

    if (status === 'delete') {
      cascadeData[relate_list_name].push(children);
    } else if (status === 'create') {
      const omitIdData = _.chain(allData[objectApiName][id])
        .cloneDeep()
        .omit('id')
        .value();

      //* 产品预加载定制兼容方案
      if (!validPreProduct(omitIdData, objectApiName, detailLayout)) {
        cascadeData[relate_list_name].push(omitIdData);
      }
    } else {
      cascadeData[relate_list_name].push(allData[objectApiName][id]);
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
  detailLayout = {},
  isModal = false,
) {
  const majorId = _.get(processedData, 'id', _.get(processedData, '_id'));

  // TODO 在modal层每次赋值都不需要保留上次cascade数据，评估是否能干掉
  let createList = isModal ? {} : _.cloneDeep(_.get(processedData, '_cascade.create', {}));
  let updateList = isModal ? {} : _.cloneDeep(_.get(processedData, '_cascade.update', {}));
  let deleteList = isModal ? {} : _.cloneDeep(_.get(processedData, '_cascade.delete', {}));

  _.each(cascadeIndexs, (children) => {
    const { status } = children;

    if (_.get(children, '_parentId') == majorId) {
      //* 本地缓存数据处理
      if (_.get(children, '_id')) {
        createList = saveCascadeList(createList, children, cascadeList, 'create', detailLayout);
      } else {
        // * 库里数据处理
        if (status === 'delete') {
          deleteList = saveCascadeList(deleteList, children, cascadeList, 'delete');
        } else if (status === 'update') {
          updateList = saveCascadeList(updateList, children, cascadeList);
        }
      }
    }
  });

  processedData._cascade = {
    create: createList,
    update: updateList,
    delete: deleteList,
  };

  return processedData;
}
