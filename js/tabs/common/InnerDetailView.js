/**
 * Create by Uncle Charlie, 2/1/2018
 * @flow
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Container } from 'native-base';
import _ from 'lodash';
import { connect } from 'react-redux';
import Privilege from 'fc-common-lib/privilege';
import IndexDataParser from '../../services/dataParser';
import LoadingScreen from './LoadingScreen';
import ErrorScreen from './ErrorScreen';
import HttpRequest from '../../services/httpRequest';
import Common from '../../utils/constants';
import Constants from './Constants';
import * as Util from '../../utils/util';
import { processCriterias } from '../../utils/criteriaUtil';
import WarningScreen from '../../components/hintView/WarningScreen';
import I18n from '../../i18n';
import InnerIndexListView from './InnerIndexListView';
import { addAttendee } from '../../actions/event';

const REF_OBJ_DESC = 'ref_obj_describe';

type Prop = {
  layout: any,
  navigation: any,
  apiName: string,
  recordType: string,
  param: any,
  desc: any,
  objectDescription: any,
  permission: any,
  pageTypeLevel: 'main' | 'sub',
  handleNav: (destination: string, param: ?{}, callback: ?() => void) => void,
  objectDescribeApiName: string,
  addAttendeeResult: ?any,
  renderButtonList: (component: any) => void,
  parentData: any,
  onComponentDidMount: void,
};

type State = {
  selectedFilter: ?Array<Filter>,
};

/**
 * Related Detail
 * TODO: 1. total number of records
 * TODO: 2. filter integration
 */
class InnerDetailView extends React.Component<Prop, State> {
  state = {
    // selectedFilter: null,
  };

  pageNo: number = Constants.FIRST_PAGE;
  phoneLayout: any = null;

  constructor(props: Prop) {
    super(props);

    const { layout } = this.props;
    const { target_value_field } = layout;

    this.targetValueField = target_value_field || 'id';

    const { ref_obj_describe, related_list_name } = layout;
    const currentDesc = this.getCurrentDesc(ref_obj_describe);
    this.relationFieldDesc = _.find(
      _.get(currentDesc, 'fields'),
      (desc) => desc.type === 'relation' && desc.related_list_api_name === related_list_name,
    );
  }

  getCurrentDesc = (objectDescName: string) => {
    if (!objectDescName) {
      return null;
    }

    const { objectDescription } = this.props;
    const objectDesc = IndexDataParser.getObjectDescByApiName(objectDescName, objectDescription);
    return objectDesc;
  };

  getRefObjectApiName = (layout) => {
    const desc = this.getCurrentDesc(_.get(layout, 'ref_obj_describe'));
    return _.get(desc, 'api_name');
  };

  relationCriteria = () => {
    const { parentData, pageTypeLevel } = this.props;
    let relationValue = _.get(parentData, this.targetValueField);

    //* 新建modal时，没有id，使用_id代替
    if (pageTypeLevel === 'sub' && !relationValue) {
      relationValue = _.get(parentData, '_id');
    }

    if (relationValue && !_.isEmpty(this.relationFieldDesc)) {
      return {
        field: _.get(this.relationFieldDesc, 'api_name'),
        operator: '==',
        value: [relationValue],
      };
    }
    return {};
  };

  recordTypeCriteria = () => {
    const { layout } = this.props;
    if (!layout || !layout.record_type) {
      return {};
    }

    const recordType = layout.record_type;

    if (Array.isArray(recordType) && recordType.length > 0) {
      return {
        field: 'record_type',
        operator: 'in',
        value: recordType,
      };
    }
    return {
      field: 'record_type',
      operator: '==',
      value: [recordType],
    };
  };

  // TODO: filter search criteria
  getSearchCriteria() {
    const { layout, parentData } = this.props;
    let searchCriteria = [];
    const recordTypeCriteria = this.recordTypeCriteria();
    if (!_.isEmpty(recordTypeCriteria)) {
      searchCriteria = _.concat(searchCriteria, recordTypeCriteria);
    }

    const relationCriteria = this.relationCriteria();
    console.log('relationCriteria===>', relationCriteria);
    if (!_.isEmpty(relationCriteria)) {
      searchCriteria = _.concat(searchCriteria, relationCriteria);
    }

    const defaultCriterias = _.get(layout, 'default_filter_criterias.criterias', []);
    console.log('defaultCriterias===>', defaultCriterias);
    if (!_.isEmpty(defaultCriterias)) {
      searchCriteria = _.concat(searchCriteria, defaultCriterias);
    }

    searchCriteria = processCriterias(searchCriteria, {}, parentData);
    console.log('searchCriteria===>', searchCriteria);
    return searchCriteria;
  }

  handleNavigate = (dest: string, param: ?{}, callback: ?() => void) => {
    const { permission, layout, handleNav } = this.props;
    const rowActions = _.get(layout, 'row_actions');
    if (_.isEmpty(rowActions)) {
      return;
    }

    const objectApiName = this.getRefObjectApiName(layout);
    const canEdit = Privilege.checkObject(permission, objectApiName, 2);
    const canRead = Privilege.checkObject(permission, objectApiName, 3);

    console.log(`navigate ${canEdit ? 'Edit ' : ' NO Edit '}${canRead ? ' READ' : ' NO READ'}`);

    if (canEdit || canRead) {
      handleNav(dest, param, callback);
    }
  };

  /**
   * Generate search criteria according to filters
   */
  // handleFilter = filters => {
  //   const validFilters = _.filter(filters, f => f.condition);
  //   this.setState({ selectedFilter: validFilters });
  //   const filterCriteria = this.generateFilterCriteria(validFilters);
  //   this.requestList(filterCriteria);
  // };

  // showFilter = () => {
  //   const { indexLayout, screenInfo: { objectApiName } } = this.props;
  //   const component = _.get(indexLayout, 'containers[0].components[0]', null);
  //   const { navigation } = this.props;

  //   navigation.navigate('Filter', {
  //     apiName: objectApiName,
  //     layout: component,
  //     selectedFilter: this.state.selectedFilter,
  //     callback: this.handleFilter
  //   });
  // };

  render() {
    const {
      layout,
      apiName,
      recordType,
      desc,
      permission,
      handleNav,
      objectDescribeApiName,
      renderButtonList,
      addAttendeeResult,
      navigation,
      parentData,
      onComponentDidMount,
    } = this.props;
    if (_.isEmpty(layout)) {
      return (
        <WarningScreen
          content={I18n.t('something_unknown_happened')}
          callback={() => console.log('layout for related detail is invalid')}
        />
      );
    }

    this.phoneLayout = layout.padlayout;
    const phoneLayout = _.get(layout, 'padlayout', null);
    const orderBy = _.get(layout, 'default_sort_by', 'update_time');
    const order = _.get(layout, 'default_sort_order', 'desc');
    const rowActionsList = _.get(layout, 'row_actions');
    const searchCriteria = this.getSearchCriteria();
    const objectApiName = _.get(layout, 'ref_obj_describe');
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'stretch',
          alignSelf: 'stretch',
        }}
      >
        <InnerIndexListView
          orderBy={orderBy}
          order={order}
          objectApiName={objectApiName}
          recordType={recordType}
          phoneLayout={phoneLayout}
          component={layout}
          objectDescription={desc}
          permission={permission}
          criteria={searchCriteria}
          handleNav={this.handleNavigate}
          rowActionsList={rowActionsList}
          param={this.props.param}
          navigation={navigation}
          parentData={parentData}
          objectDescribeApiName={objectDescribeApiName}
          onComponentDidMount={onComponentDidMount}
        />
        {renderButtonList ? renderButtonList(layout, objectDescribeApiName) : null}
      </View>
    );
  }
}

const select = (state) => ({
  token: state.settings.token,
  objectDescription: state.settings.objectDescription,
  profile: state.settings.profile,
  addAttendeeResult: state.event.addAttendeeResult,
  addAttendeeResultSuccess: !state.event.addAttendeeLoading && !state.event.addAttendeeError,
  addWalkinAttendeeSuccess: state.event.addWalkinAttendeeSuccess,
});

export default connect(select)(InnerDetailView);

const styles = StyleSheet.create({
  rowItem: {
    alignSelf: 'stretch',
    height: 80,
    backgroundColor: 'white',
  },
  switchContainer: {
    height: 38,
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
  },
});
