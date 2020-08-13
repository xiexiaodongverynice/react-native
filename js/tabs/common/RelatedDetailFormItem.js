/**
 * Created by Uncle Charlie, 2018/03/14
 * @flow
 */

import React from 'react';
import _ from 'lodash';
import { View, Text } from 'react-native';
import Privilege from 'fc-common-lib/privilege';
import I18n from '../../i18n';
import HttpRequest from '../../services/httpRequest';
import IndexDataParser from '../../services/dataParser';
import LoadingScreen from './LoadingScreen';
import * as Util from '../../utils/util';
import WarningScreen from '../../components/hintView/WarningScreen';
import DetailFormItem from '../common/DetailFormItem';

type Prop = {
  token: string,
  field_section: any,
  parentRecord: any,
  permission: any,
  objectDescription: any,
};

type State = {
  relatedData: any,
};

export default class RelatedDetailFormItem extends React.PureComponent<Prop, State> {
  constructor(props: Prop) {
    super(props);

    const { field_section, objectDescription } = this.props;

    const filterLayout = _.get(field_section, 'form_item_extender_filter');

    this.refObjectDescApiName = _.get(filterLayout, 'ref_obj_describe');
    this.filterLayout = filterLayout;
    this.relatedListName = _.get(filterLayout, 'related_list_name');
    this.relatedFieldDesc = IndexDataParser.getObjectDescByApiName(
      this.refObjectDescApiName,
      objectDescription,
    );
  }

  async componentDidMount() {
    const { token, parentRecord, field_section } = this.props;
    const parentId = _.get(parentRecord, 'id');
    if (!parentId) {
      return;
    }

    try {
      const defaultFilterCriteria = _.get(this.filterLayout, 'default_filter_criterias', []);

      const relatedField = _.find(
        this.relatedFieldDesc.fields,
        {
          related_list_api_name: this.relatedListName,
        },
        {},
      );

      const relatedFieldApiName = _.get(relatedField, 'api_name', '');

      const baseCriteria = _.concat(defaultFilterCriteria, {
        field: relatedFieldApiName,
        value: [parentId],
        operator: '==',
      });

      const result = await HttpRequest.query({
        token,
        objectApiName: this.refObjectDescApiName,
        joiner: 'and',
        criteria: baseCriteria,
        orderBy: _.get(field_section, 'default_sort_by', 'update_time'),
        order: _.get(field_section, 'default_sort_order', 'asc'),
        pageSize: 100,
        pageNo: 1,
      });

      this.setState({ relatedData: _.get(result, 'result') });
    } catch (e) {
      console.warn('[warn] related data form item error', e);
    }
  }

  renderItems = () => {
    const { permission, field_section, parentRecord } = this.props;
    const relatedData = _.get(this.state, 'relatedData');
    if (!relatedData) {
      return <LoadingScreen isNormalSized />;
    }

    if (!Privilege.checkObject(permission, this.refObjectDescApiName, 3)) {
      return <WarningScreen content={I18n.t('object_previlage_no')} />;
    }

    const sectionFieldList = _.get(field_section, 'fields', []);
    const objectFieldList = _.get(this.relatedFieldDesc, 'fields');

    const renderItems = [];
    _.map(relatedData, (record) => {
      const renderFieldItems = _.map(sectionFieldList, (fieldLayout) => {
        if (!objectFieldList) {
          return;
        }

        const fieldDesc = _.find(objectFieldList, {
          api_name: _.get(fieldLayout, 'field'),
        });
        const fieldApiName = _.get(fieldDesc, 'api_name');

        const fieldData =
          _.get(fieldDesc, 'type') === 'relation' || _.get(record, `${fieldLayout.field}__r`)
            ? _.get(record, `${fieldLayout.field}__r.name`, '')
            : _.get(record, fieldLayout.field, '');

        if (!fieldDesc) {
          console.warn('Configuration error', this.refObjectDescApiName, fieldApiName);
          return;
        }

        if (
          !Privilege.checkFieldInOkArr(permission, this.refObjectDescApiName, fieldApiName, [2, 4])
        ) {
          console.warn('Privilege error', this.refObjectDescApiName, fieldApiName, fieldLayout);
          return;
        }

        renderItems.push(
          <DetailFormItem
            fromExtender="RelatedDetailFormItem"
            fieldData={fieldData}
            parentRecord={parentData}
            objectApiName={this.refObjectDescApiName}
            fieldApiName={fieldApiName}
            fieldDesc={fieldDesc}
            fieldLayout={fieldLayout}
          />,
        );
      });
    });

    return renderItems;
  };

  render() {
    return this.renderItems();
  }
}
