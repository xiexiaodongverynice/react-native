//第一个component 描述的是 当前对象
import _ from 'lodash';

//刨除fancyHeader后的第一个（第0个）组件
export function getFirstComponentFromDetailLayout(detailLayout) {
  if (!detailLayout) {
    return null;
  }

  const components = _.get(detailLayout, 'containers[0].components');

  const component = _.find(components, (comp) => {
    return _.get(comp, 'type') !== 'phone_detail_header';
  });
  return component;
}

export function getComponentsWithoutFancyHeader(components) {
  const cloned = _.clone(components); //为了不修改原始对象
  //把fancyHeader移出
  if (_.get(components, '[0].type') === 'phone_detail_header') {
    cloned.shift();
  }
  return cloned;
}
