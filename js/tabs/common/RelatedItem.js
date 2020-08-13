// // create by yjgao

// import React from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, DeviceEventEmitter } from 'react-native';
// import {
//   Container,
//   Content,
//   List,
//   ListItem,
//   Separator,
//   Left,
//   Body,
//   Icon,
//   Right,
//   Button,
// } from 'native-base';
// import _ from 'lodash';
// import themes from './theme';
// import { StyledSeparator, ListDivider, DetailListItem } from './components';
// import recordService from '../../services/recordService';
// import AStorage from '../../utils/asStorage';

// export default class RelatedItem extends React.Component {
//   state = {
//     rightText: '',
//     rightSuffix: '',
//     headerText: '',
//     dataList: [],
//   };

//   listener: any;

//   async componentDidMount() {
//     const { layout, parentData } = this.props;
//     await this.getDataObject(layout, parentData);
//     this.listener = DeviceEventEmitter.addListener('RelatedItemChange', () => {
//       AStorage.get('RelatedData').then((res) => {
//         this.getDataObject(layout, parentData, res, false);
//       });
//     });
//   }

//   componentWillUnmount() {
//     if (this.listener && _.isFunction(this.listener.remove)) {
//       this.listener.remove();
//     }
//   }

//   async getDataObject(layout, pData, relateChange, checkInventory = true) {
//     const headerText = _.get(layout, 'header', '');
//     const apiName = _.get(layout, 'ref_obj_describe');
//     const parentApiName = _.get(pData, 'object_describe_name');
//     const orderBy = _.get(layout, 'default_sort_by', 'create_time');
//     const order = _.get(layout, 'default_sort_order', 'desc');
//     const { token, pageType } = this.props;
//     if (pageType == 'add') {
//       const objectList = [];
//       _.each(relateChange, (rst) => {
//         if (rst.object_describe_name === apiName) {
//           objectList.push(rst);
//         }
//       });
//       this.setState({
//         rightSuffix: '',
//         rightText: objectList && objectList.length > 0 ? '已填写' : '',
//         dataList: objectList && objectList.length > 0 ? objectList : [],
//         headerText,
//       });
//     } else if (pageType === 'detail') {
//       const criterias = [
//         {
//           field: parentApiName,
//           operator: '==',
//           value: [pData.id],
//         },
//       ];
//       const payload = {
//         head: { token },
//         body: {
//           joiner: 'and',
//           criterias,
//           orderBy,
//           order,
//           objectApiName: apiName,
//           pageSize: 1000,
//           pageNo: 1,
//         },
//       };
//       const data = await recordService.queryRecordListService(payload);
//       const { result, resultCount } = data;

//       const rightText = result.length === 0 ? '' : '已填写';
//       const rightSuffix = '';
//       const dataList = result;
//       this.setState({
//         rightSuffix,
//         rightText,
//         dataList,
//         headerText,
//       });
//     } else {
//       const criterias = [
//         {
//           field: parentApiName,
//           operator: '==',
//           value: [pData.id],
//         },
//       ];
//       const payload = {
//         head: { token },
//         body: {
//           joiner: 'and',
//           criterias,
//           orderBy,
//           order,
//           objectApiName: apiName,
//           pageSize: 1000,
//           pageNo: 1,
//         },
//       };
//       const data = await recordService.queryRecordListService(payload);
//       const { result, resultCount } = data;

//       //* 济明可信检查库存
//       if (result && result.length > 0 && checkInventory) {
//         AStorage.save(`${apiName}_related`, result);
//       }

//       _.each(relateChange, (rst) => {
//         if (rst.object_describe_name === apiName) {
//           result.push(rst);
//         }
//       });

//       //* 在编辑页，删除远程的relate数据做对比
//       let relateDeleteSize = 0;
//       const relateDelete = await AStorage.get('RelatedDeletedData');
//       if (relateDelete && _.isArray(relateDelete) && !_.isEmpty(relateDelete)) {
//         _.each(relateDelete, (rst) => {
//           if (rst.object_describe_name === apiName) {
//             relateDeleteSize += 1;
//           }
//         });
//       }

//       const rightText = result.length - relateDeleteSize <= 0 ? '' : '已填写';
//       const rightSuffix = '';
//       const dataList = result;
//       this.setState({
//         rightSuffix,
//         rightText,
//         dataList,
//         headerText,
//       });
//     }
//   }

//   resetState = () => {
//     //const
//   };

//   gotoRelatedList(dataList) {
//     const {
//       token,
//       layout,
//       parentData,
//       navigation,
//       permission,
//       dispatch,
//       screen,
//       objectDescription,
//       pageType,
//       recordData,
//       parentApiName,
//     } = this.props;
//     const params = {
//       token,
//       component: layout,
//       detailData: parentData,
//       navigation,
//       permission,
//       dispatch,
//       screen,
//       objectDescription,
//       pageType,
//       recordData,
//       parentApiName,
//     };
//     navigation.navigate('RelatedList', params);
//   }

//   render() {
//     const { headerText, rightText, rightSuffix, dataList } = this.state;
//     return (
//       <View>
//         <ListItem>
//           <Left>
//             <Text style={{ flex: 1 }}>{headerText}</Text>
//           </Left>
//           <Body>
//             <TouchableOpacity
//               activeOpacity={0.8}
//               onPress={() => this.gotoRelatedList(dataList)}
//               style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}
//             >
//               <Text style={{ flex: 1, textAlign: 'right', alignItems: 'center' }}>
//                 {rightText}
//                 {rightSuffix}
//               </Text>
//               <Icon
//                 name="ios-arrow-forward"
//                 style={[styles.icon, { textAlign: 'right', paddingLeft: 5 }]}
//               />
//             </TouchableOpacity>
//           </Body>
//         </ListItem>
//       </View>
//     );
//   }
// }

// const styles = StyleSheet.create({
//   item: {},
//   icon: {
//     color: themes.color_header_icon,
//     fontSize: themes.font_header_size,
//   },
// });
