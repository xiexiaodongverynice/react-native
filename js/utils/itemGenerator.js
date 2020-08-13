// // add by yjgao

// import React from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   TouchableOpacity,
//   Switch,
//   DeviceEventEmitter,
//   Image,
// } from 'react-native';
// import Swipeout from 'react-native-swipeout';
// import { Badge, Left, Right, Icon, Spinner } from 'native-base';
// import _ from 'lodash';
// import themes from '../tabs/common/theme';
// import * as Util from './util';
// import RecordService from '../services/recordService';
// import AStorage from './asStorage';

// export default function generatorItemTemplate(
//   layout,
//   describe,
//   data,
//   pdata,
//   navigation,
//   permission,
//   token,
//   pageType,
// ) {
//   const header = _.get(layout, 'header', '');
//   const mobileLayout = _.get(layout, 'mobilelayout', undefined);
//   const padlayout = _.get(layout, 'padlayout', undefined);
//   const rowActions = _.get(layout, 'row_actions', []);
//   const fields = _.get(layout, 'fields', []);
//   const actions = _.get(layout, 'actions', []);
//   let detailAction;
//   _.each(rowActions, (action) => {
//     const expression = _.get(action, 'show_expression', ' return true;');
//     const isShow = Util.executeDetailExp(expression, data, pdata);
//     if (action.action === 'DETAIL' && isShow) {
//       detailAction = action;
//     }
//   });

//   const swipeList = _.filter(rowActions, (row) => row.mobile_show);
//   const rightSwipe = _.filter(swipeList, { mobile_show: 'SWIPE_RIGHT' });
//   const leftSwipe = _.filter(swipeList, { mobile_show: 'SWIPE_LEFT' });
//   const rightSwipeButtons = [];
//   const leftSwipeButtons = [];

//   if (rightSwipe) {
//     _.forEach(rightSwipe, (action) => {
//       const showWhen = _.get(action, 'show_when', ['add', 'detail', 'edit']);
//       if (!showWhen.includes(pageType)) {
//         return;
//       }
//       const expression = _.get(action, 'show_expression', ' return true;');
//       const showExpression = Util.executeDetailExp(expression, data, pdata);
//       const { is_custom = false } = action;
//       if ((data && !data.id) || showExpression) {
//         if (is_custom) {
//           rightSwipeButtons.push({
//             key: `${action.action}_${action.label}`,
//             text: action.label,
//             onPress: () => {
//               onCallCustomAction.bind(this, action, data, navigation, permission, token, pageType);
//             },
//             backgroundColor: _.get(action, 'mobile_swipe_color', '#3682D5'),
//           });
//         } else {
//           if ((data && !data.id) || this.checkPrevilage(action, data, permission)) {
//             rightSwipeButtons.push({
//               key: `${action.action}_${action.label}`,
//               text: action.label,
//               onPress: this.swipeAction.bind(
//                 this,
//                 action,
//                 data,
//                 navigation,
//                 permission,
//                 token,
//                 pageType,
//               ),
//               backgroundColor: _.get(action, 'mobile_swipe_color', '#3682D5'),
//             });
//           }
//         }
//       }
//     });
//   }
//   if (leftSwipe) {
//     _.forEach(leftSwipe, (action) => {
//       const showWhen = _.get(action, 'show_when', ['add', 'detail', 'edit']);
//       if (!showWhen.includes(pageType)) {
//         return;
//       }
//       const expression = _.get(action, 'show_expression', 'return true;');
//       const showExpression = Util.executeDetailExp(expression, data, pdata);
//       const { is_custom = false } = action;
//       if ((data && !data.id) || showExpression) {
//         if (is_custom) {
//           leftSwipeButtons.push({
//             key: `${action.action}_${action.label}`,
//             text: action.label,
//             onPress: () => {
//               onCallCustomAction.bind(this, action, data, navigation, permission, token, pageType);
//             },
//             backgroundColor: _.get(action, 'mobile_swipe_color', '#3682D5'),
//           });
//         } else {
//           if ((data && !data.id) || this.checkPrevilage(action, data, permission)) {
//             leftSwipeButtons.push({
//               key: `${action.action}_${action.label}`,
//               text: action.label,
//               onPress: this.swipeAction.bind(
//                 this,
//                 action,
//                 data,
//                 navigation,
//                 permission,
//                 token,
//                 pageType,
//               ),
//               backgroundColor: _.get(action, 'mobile_swipe_color', '#3682D5'),
//             });
//           }
//         }
//       }
//     });
//   }

//   return (
//     <View style={styles.rowItem}>
//       <Swipeout
//         right={rightSwipeButtons}
//         left={leftSwipeButtons}
//         autoClose
//         style={{
//           flex: 1,
//           alignSelf: 'stretch',
//         }}
//       >
//         <TouchableOpacity
//           style={{
//             flexDirection: 'row',
//             backgroundColor: '#fff',
//             paddingHorizontal: 10,
//             paddingVertical: 10,
//           }}
//           onPress={detailAction && openDetail.bind(this, data, navigation)}
//         >
//           {getIcon(padlayout, describe, data, pdata)}
//           <View
//             style={{
//               flex: 4,
//               flexDirection: 'column',
//             }}
//           >
//             <View
//               style={{
//                 flexDirection: 'row',
//                 alignItems: 'center',
//               }}
//             >
//               {getTitle(padlayout, describe, data, pdata)}
//               {getSubTitle(padlayout, describe, data, pdata)}
//             </View>
//             <View style={{ justifyContent: 'flex-start' }}>
//               {getContent(padlayout, describe, data, pdata)}
//             </View>
//           </View>
//           <View
//             style={{
//               flexDirection: 'row',
//               alignItems: 'center',
//               justifyContent: 'flex-end',
//             }}
//           >
//             {getLabels(padlayout, describe, data, pdata)}
//           </View>
//         </TouchableOpacity>
//       </Swipeout>
//     </View>
//   );
// }

// swipeAction = async (action, item, navigation, permission, token, pageType) => {
//   const actionType = _.toUpper(_.get(action, 'action'));
//   const tarRecordType = _.get(action, 'target_layout_record_type');
//   if (actionType === 'ADD') {
//   } else if (actionType === 'EDIT') {
//     if (item.id && !item.is_fake_change) {
//       navigation.navigate('Edit', {
//         navParam: {
//           ...item,
//           record_type: tarRecordType,
//           from: 'RelatedScreen',
//           fromType: pageType,
//         },
//         screenInfo: {
//           objectApiName: _.get(item, 'object_describe_name'),
//           recordType: tarRecordType || item.record_type,
//         },
//       });
//     } else {
//       navigation.navigate('Edit', {
//         navParam: {
//           fakeData: item,
//           record_type: tarRecordType,
//           from: 'RelatedScreen',
//           fromType: pageType,
//         },
//         screenInfo: {
//           objectApiName: _.get(item, 'object_describe_name'),
//           recordType: tarRecordType || item.record_type,
//         },
//       });
//     }
//   } else if (actionType === 'DELETE') {
//     if (item.id && pageType === 'detail') {
//       const data = await RecordService.deleteRecord({
//         token,
//         objectApiName: _.get(item, 'object_describe_name'),
//         id: _.get(item, 'id'),
//       });
//       DeviceEventEmitter.emit('RefreshRelatedDataEvent');
//     } else if (item.id && pageType !== 'detail') {
//       AStorage.get('RelatedDeletedData').then((res) => {
//         const deletedList = res || [];
//         deletedList.push(item);
//         AStorage.save('RelatedDeletedData', deletedList).then((res) => {
//           DeviceEventEmitter.emit('RefreshRelatedDataEvent');
//         });
//       });
//     } else {
//       AStorage.get('RelatedData').then((res) => {
//         const itemList = res;
//         _.each(itemList, (data) => {
//           if (data && item && data.fakeId == item.fakeId) {
//             itemList.splice(itemList.indexOf(data), 1);
//           }
//         });
//         AStorage.save('RelatedData', itemList).then((res) => {
//           DeviceEventEmitter.emit('RefreshRelatedDataEvent');
//         });
//       });
//     }
//   }
// };

// onCallCustomAction = (action, item, navigation, permission, token, pageType) => {
//   const actionType = _.toUpper(_.get(action, 'action'));
//   const tarRecordType = _.get(action, 'target_layout_record_type');
//   if (actionType === 'ADD') {
//   } else if (actionType === 'EDIT') {
//     navigation.navigate('Edit', {
//       navParam: {
//         ...item,
//         record_type: tarRecordType,
//       },
//       screenInfo: {
//         objectApiName: _.get(item, 'object_describe_name'),
//         recordType: tarRecordType || item.record_type,
//       },
//     });
//   } else if (actionType === 'DELETE') {
//     const data = RecordService.deleteRecord({
//       token,
//       objectApiName: _.get(item, 'object_describe_name'),
//       id: _.get(item, 'id'),
//     });
//   }
// };

// checkPrevilage = (action, data, permission) => {
//   const objectDescribeApiName = _.get(data, 'object_describe_name');
//   const actionRefObjectApiName = _.get(action, 'ref_obj_describe', objectDescribeApiName);
//   const actionCode = _.get(action, 'action');

//   if (actionCode === 'ADD' && Util.checkObjectPrevilage(permission, actionRefObjectApiName, 1)) {
//     return true;
//   } else if (
//     actionCode === 'EDIT' &&
//     Util.checkObjectPrevilage(permission, actionRefObjectApiName, 2)
//   ) {
//     return true;
//   } else if (
//     actionCode === 'DELETE' &&
//     Util.checkObjectPrevilage(permission, actionRefObjectApiName, 4)
//   ) {
//     return true;
//   } else if (
//     actionCode === 'UPDATE' &&
//     Util.checkObjectPrevilage(permission, actionRefObjectApiName, 2)
//   ) {
//     return true;
//   } else {
//     return false;
//   }
// };

// function openDetail(data, navigation) {
//   const objectApiName = _.get(data, 'object_describe_name');
//   const record_type = _.get(data, 'record_type');
//   if (data.id && !data.is_fake_change) {
//     navigation.navigate('Detail', {
//       navParam: {
//         objectApiName,
//         record_type,
//         id: _.get(data, 'id'),
//       },
//     });
//   } else {
//     navigation.navigate('Detail', {
//       navParam: {
//         objectApiName,
//         record_type,
//         fakeData: data,
//       },
//     });
//   }
// }

// function getIcon(padlayout, describe, data, pdata) {
//   if (padlayout && padlayout.avatar !== undefined) {
//     const avatar = padlayout.avatar;
//     return null;
//   }
//   return null;
// }

// function getTitle(padlayout, describe, data, pdata) {
//   if (padlayout && padlayout.title) {
//     const title = padlayout.title;
//     const value = getValue(title, describe, data, pdata);
//     return (
//       <View>
//         <Text
//           style={{
//             fontWeight: 'bold',
//             color: themes.list_title_color,
//             fontSize: themes.list_title_size,
//             flexWrap: 'wrap',
//           }}
//         >
//           {value}
//         </Text>
//       </View>
//     );
//   }
//   return null;
// }

// function getSubTitle(padlayout, describe, data, pdata) {
//   if (padlayout && padlayout.subTitle) {
//     const title = padlayout.subTitle;
//     const value = getValue(title, describe, data, pdata);
//     return (
//       <View
//         style={{
//           marginHorizontal: 25,
//         }}
//       >
//         <Text
//           style={{
//             color: themes.list_title_color,
//             fontSize: themes.list_subtitle_size,
//           }}
//         >
//           {value}
//         </Text>
//       </View>
//     );
//   }
//   return null;
// }

// function getContent(padlayout, describe, data, pdata) {
//   if (padlayout && padlayout.contents) {
//     const contents = _.get(padlayout, 'contents', []);
//     return (
//       <View style={{ marginTop: 5 }}>
//         {contents.map((content, index) => {
//           const value = getValue(content, describe, data, pdata);
//           return (
//             <Text
//               style={{
//                 marginTop: 5,
//                 fontSize: themes.list_subtitle_size,
//                 color: themes.list_subtitle_color,
//               }}
//             >
//               {value}
//             </Text>
//           );
//         })}
//       </View>
//     );
//   }
//   return null;
// }

// function getLabels(padlayout, describe, data, pdata) {
//   if (padlayout && padlayout.lables) {
//     const labels = _.get(padlayout, 'labels', []);
//     return (
//       <View
//         style={{
//           width: 50,
//           justifyContent: 'center',
//           alignItems: 'center',
//           paddingVertical: 5,
//           borderRadius: 2,
//         }}
//       >
//         {_.map(labels, (label, index) => {
//           const value = getValue(label, describe, data, pdata);
//           return (
//             <View key={label + index}>
//               <Text>{value}</Text>
//             </View>
//           );
//         })}
//       </View>
//     );
//   }
//   return null;
// }

// function getValue(title, describe, data, pdata) {
//   if (title.type == 'text') {
//     const value = _.get(title, 'value');
//     const desFileds = _.get(describe, 'fields', []);
//     let handlerValue = _.get(data, value);
//     _.each(desFileds, (des) => {
//       const apiName = _.get(des, 'api_name');
//       if (apiName == value) {
//         handlerValue = transValueToLabel(handlerValue, des);
//         if (data[`${title.value}__r`] && data[`${title.value}__r`].name) {
//           handlerValue = data[`${title.value}__r`].name;
//         }
//       }
//     });
//     return handlerValue;
//   } else if (title.type == 'expression') {
//     // expression需要解析一下
//     return null;
//   }
//   return null;
// }

// function transValueToLabel(value, des) {
//   const type = _.get(des, 'type');
//   if (type == 'boolean') {
//     if (value == 'true') {
//       return '是';
//     } else {
//       return '否';
//     }
//   } else if (des.options) {
//     const options = des.options;
//     let label = '';
//     _.each(options, (option) => {
//       if (option.value == value) {
//         label = option.label;
//       }
//     });
//     return label;
//   }
//   return value;
// }

// const styles = StyleSheet.create({
//   rowItem: {
//     flex: 1,
//     alignSelf: 'stretch',
//     backgroundColor: 'blue',
//     alignItems: 'stretch',
//     borderBottomWidth: themes.regular_border_width,
//     borderBottomColor: themes.border_color_base,
//   },
//   icon: {
//     fontSize: themes.icon_size_index,
//     color: '#BEC2C9',
//     marginRight: 10,
//   },
//   arrowIcon: {
//     color: themes.color_header_icon,
//     fontSize: themes.font_header_size,
//     marginLeft: 10,
//   },
//   favorite: {
//     fontSize: themes.icon_size_index,
//     color: '#FACC2D',
//   },
//   nodata: {
//     fontSize: 100,
//     color: 'lightgray',
//   },
// });
