// /**
//  * Created by Uncle Charlie, 2018/01/08
//  * @flow
//  */

// import React from 'react';
// import { StyleSheet, View, Text } from 'react-native';
// import { connect } from 'react-redux';
// import _ from 'lodash';
// import {
//   Button,
//   Body,
//   Left,
//   Right,
//   Header,
//   List,
//   ListItem,
//   Container,
//   Content,
//   Title,
//   ActionSheet,
// } from 'native-base';
// import UtilConstants from '../utils/constants';
// import FilterRow from './common/FilterRow';
// import IndexDataParser from '../services/dataParser';
// import * as Util from '../utils/util';
// import { StyledContainer, StyledHeader, StyledBody, HeaderLeft } from './common/components';
// import { insertArray } from '../utils/util';
// import themes from './common/theme';
// import I18n from '../i18n/index';
// import moment from 'moment/moment';
// import { toastWaring } from '../utils/toast';

// type NavParam = {
//   apiName: string,
//   layout: any,
//   selectedFilter: ?Array<Filter>,
//   callback: (filters: Array<Filter>) => void,
// };

// type Prop = {
//   permission: any,
//   navigation: Navigation<NavParam>,
//   objectDescription: any,
// };

// type State = {
//   filters: Array<Filter>,
// };

// class FilterScreen extends React.Component<Prop, State> {
//   constructor(props: Prop) {
//     super(props);
//     const { navigation } = this.props;
//     const { selectedFilter } = navigation.state.params;
//     this.state = {
//       filters:
//         selectedFilter ||
//         [
//           // {
//           //   condition: null,
//           //   op: null,
//           //   value: null,
//           // },
//         ],
//     };
//   }

//   // static getDerivedStateFromProps(nextProps: Prop) {
//   //   console.log('===>filter screen will receive prop', nextProps);
//   // }

//   shouldComponentUpdate(nextProps, nextState) {
//     console.log('===>should update props', nextProps);
//     console.log('===>should update state', nextState);

//     return true;
//   }

//   getFilters = () => {
//     const { navigation } = this.props;
//     const { selectedFilter } = navigation.state.params;
//     let filters = _.get(this.state, 'filters');
//     // filters = _.filter(filters, f => !_.isEmpty(f.condition));
//     if (selectedFilter && this.isFilterDefault(filters)) {
//       filters = selectedFilter;
//     }
//     return filters;
//   };

//   handleDecrease = () => {
//     const filters = this.getFilters() || [];
//     if (filters.length > 0) {
//       filters.pop();
//     }

//     // Filters should keep one as placeholder
//     // if (filters.length === 0) {
//     //   filters.push({
//     //     condition: null,
//     //     op: null,
//     //     value: null,
//     //   });
//     // }
//     this.setState({ filters });
//   };

//   handleIncrease = () => {
//     const filters = this.getFilters() || [];
//     // Remove the first placeholder filter.
//     if (!_.isEmpty(filters) && filters.length === 1 && _.isEmpty(_.get(filters, '[0].condition'))) {
//       filters.pop();
//     }

//     // Filters should be not more than 10
//     if (filters.length >= UtilConstants.filterNum) {
//       return;
//     }

//     filters.push({
//       condition: null,
//       op: null,
//       value: null,
//     });

//     this.setState({ filters });
//   };

//   handleNav = (destination: string, param: any) => {
//     const { navigation } = this.props;
//     navigation.navigate(destination, param);
//   };

//   generateFilterOptions = () => {
//     const { objectDescription, permission, navigation } = this.props;
//     const { apiName, layout } = navigation.state.params;
//     const currentDescription = IndexDataParser.getObjectDescByApiName(apiName, objectDescription);
//     const filterFields = [];
//     _.each(_.get(layout, 'filter_fields'), (field) => {
//       if (Util.checkFieldPrevilage(permission, apiName, field, [2, 4])) {
//         filterFields.push(field);
//       }
//     });

//     const filterOptions = [];
//     _.each(_.get(currentDescription, 'fields'), (option) => {
//       const exists = _.filter(filterFields, (field) => field === option.api_name);
//       if (_.isEmpty(exists)) {
//         return;
//       }

//       filterOptions.push(option);
//     });

//     const fieldLayouts = [];
//     _.each(layout.fields, (field) => {
//       const matched = _.find(filterFields, (item) => field.field === item);
//       if (!matched) {
//         return;
//       }

//       fieldLayouts.push(field);
//     });

//     return {
//       fields: filterFields,
//       options: filterOptions,
//       layouts: fieldLayouts,
//     };
//   };

//   handleRowSelect = (filter: any, preFilter: any) => {
//     const { filters = [] } = this.state;
//     // const filters = this.getFilters();
//     let tempFilters = filters;
//     // const isText = _.get(filter, 'isText', false);
//     const apiName = _.get(filter, 'condition.api_name', '');

//     // const rowFilter = _.find(
//     //   tempFilters,
//     //   (item) => apiName && _.get(item, 'condition.api_name') === apiName,
//     // );

//     if (preFilter.condition == null) {
//       // tempFilters = _.concat(tempFilters, filter);
//       if (tempFilters.length === 1 && !tempFilters[0].condition) {
//         tempFilters = _.concat([], filter);
//       } else {
//         insertArray(tempFilters, tempFilters.length - 1, filter);
//       }
//     } else {
//       const preFilterApiName = _.get(preFilter, 'condition.api_name');
//       const currentFilterApiName = _.get(filter, 'condition.api_name');
//       let rowFilter = _.find(
//         tempFilters,
//         (item) => preFilterApiName && _.get(item, 'condition.api_name') === preFilterApiName,
//       );
//       if (preFilterApiName === currentFilterApiName) {
//         rowFilter.op = filter.op;
//         rowFilter.value = filter.value;
//       } else {
//         // rowFilter = preFilter;
//         rowFilter.condition = filter.condition;
//         rowFilter.op = null;
//         rowFilter.value = null;
//       }
//     }

//     // if (rowFilter) {
//     //   rowFilter.op = filter.op;
//     //   rowFilter.value = filter.value;
//     // } else {
//     //   if (tempFilters.length === 1 && !tempFilters[0].condition) {
//     //     tempFilters = _.concat([], filter);
//     //   } else {
//     //     insertArray(tempFilters, tempFilters.length - 1, filter);
//     //   }
//     // }
//     console.log('tempFilters>>>>', tempFilters);
//     this.setState({ filters: tempFilters });
//   };

//   isFilterDefault = (filters) => _.isEmpty(filters) || _.isEmpty(_.get(filters, '[0].condition'));
//   isFilterEqual = (sourceFilter, destFilter) => {
//     if (!sourceFilter || !destFilter) {
//       return false;
//     }

//     return !(
//       _.get(sourceFilter, 'condition.api_name') !== _.get(destFilter, 'condition.api_name') ||
//       _.get(sourceFilter, 'op.value') !== _.get(destFilter, 'op.value') ||
//       _.get(sourceFilter, 'value[0].value') !== _.get(destFilter, 'value[0].value')
//     );
//   };

//   renderFilterList = () => {
//     const { navigation } = this.props;
//     const { apiName, selectedFilter } = navigation.state.params;
//     const { fields, options, layouts } = this.generateFilterOptions();

//     const filters = this.getFilters();
//     const filterRows = _.map(filters, (filter, index) => {
//       const selected = _.find(selectedFilter, (s) => {
//         console.log('=== find selected', filter);
//         return this.isFilterEqual(s, filter);
//       });
//       console.log('===>filter screen selected', selected);
//       return (
//         <FilterRow
//           key={`${index}`}
//           currentFilter={filter}
//           selected={selected}
//           options={options}
//           layouts={layouts}
//           fields={fields}
//           apiName={apiName}
//           handleRowSelect={this.handleRowSelect}
//           handleNav={this.handleNav}
//         />
//       );
//     });

//     return filterRows;
//   };

//   handleOk = () => {
//     const { navigation } = this.props;
//     const { callback, selectedFilter } = navigation.state.params;

//     if (!callback) {
//       console.log('handleFilterChange is invalid');
//       return;
//     }

//     let filters = _.get(this.state, 'filters');

//     // 传给后台[]的时候，会引发后台报错，需要对value进行过滤。
//     //两种方案，
//     // 1、默认去除空的value，包括[],null,undefined。缺点：无法再次默认选中上次不全的选项
//     // 2、打开下方注解，isWarnFilter，阻塞回调，让用户补全条件。缺点：无法随意删除一行数据，也就是说如果三条条件，不需要第二条的时候，无法特定删除。

//     // let isWarnFilter = false;
//     filters = _.filter(filters, (f) => {
//       let isFilter =
//         f.condition && f.op && !_.isEmpty(f.condition) && f.value !== null && f.value !== undefined;
//       if (_.isArray(f.value) || _.isObject(f.value)) {
//         // 因为日期等number类型的value，所以不能直接用isEmpty进行判断
//         isFilter = isFilter && !_.isEmpty(f.value);
//       }
//       // if(!isFilter){
//       //   isWarnFilter = true;
//       // }
//       return isFilter;
//     });
//     // 阻塞回调
//     // if(isWarnFilter){
//     //   toastWaring(I18n.t('illegal_conditions'));
//     //   return;
//     // }

//     console.log('==>filter screen state filters', filters);
//     if (_.isEmpty(filters)) {
//       filters = selectedFilter;
//       console.log('===>filter screen props filters', filters);
//     }
//     callback(filters);
//     navigation.goBack();
//   };

//   render() {
//     const { navigation } = this.props;
//     const { callback, selectedFilter } = navigation.state.params;

//     return (
//       <StyledContainer>
//         <StyledHeader>
//           <HeaderLeft navigation={navigation} />
//           <Body style={{ flex: 1, alignItems: 'center' }}>
//             <Title
//               style={{
//                 color: themes.title_text_color,
//                 fontSize: themes.title_size,
//               }}
//             >
//               {I18n.t('title_filter')}
//             </Title>
//           </Body>
//           <Right>
//             <Button transparent onPress={this.handleOk}>
//               <Text
//                 style={{
//                   color: themes.title_text_color,
//                   fontSize: themes.title_size,
//                 }}
//               >
//                 {I18n.t('common_sure')}
//               </Text>
//             </Button>
//           </Right>
//         </StyledHeader>
//         <Content>
//           <List>
//             {this.renderFilterList()}
//             <ListItem>
//               <View style={styles.actionContainer}>
//                 <Button style={styles.button} transparent onPress={this.handleIncrease}>
//                   <Text>+</Text>
//                 </Button>
//                 <Button style={styles.button} transparent onPress={this.handleDecrease}>
//                   <Text>-</Text>
//                 </Button>
//               </View>
//             </ListItem>
//           </List>
//         </Content>
//       </StyledContainer>
//     );
//   }
// }

// const select = (state) => ({
//   permission: state.settings.permission,
//   objectDescription: state.settings.objectDescription,
// });

// export default connect(select)(FilterScreen);

// const styles = StyleSheet.create({
//   button: {
//     width: 40,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1,
//     borderColor: 'gray',
//     marginRight: 5,
//   },
//   actionContainer: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//     alignItems: 'center',
//     flex: 1,
//   },
// });
