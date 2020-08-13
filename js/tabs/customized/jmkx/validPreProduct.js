/**
 * * 济明可信定制化需求，验证预加载产品是否填写
 */
import _ from 'lodash';
import { crmTenant_isjmkx } from '../../../utils/const';

const OMIT_FEILD = [
  'product',
  'product__r',
  '_id',
  'id',
  'object_describe_name',
  'cascadeLimitTime',
];

const validPreProduct = (data, related_list_name, detailLayout) => {
  // if (!crmTenant_isjmkx()) return false;
  const components = _.cloneDeep(_.get(detailLayout, 'containers[0].components'));
  if (!components) return false;
  components.shift();
  if (_.isEmpty(components)) return false;
  const relatedLayout = _.filter(
    components,
    (related) => related.related_list_name === related_list_name,
  );
  if (_.isEmpty(relatedLayout, 'product_setting')) return false;

  return checktIsFillout(data);
};

const checktIsFillout = (data) => {
  const remainData = _.omit(data, OMIT_FEILD);
  return _.isEmpty(remainData);
};

export { validPreProduct, checktIsFillout };
