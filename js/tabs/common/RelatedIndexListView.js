// /**
//  * Created by Uncle Charlie, 2018/01/23
//  * @flow
//  */
// import React from 'react';
// import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';

// type Prop = {
//   indexData: ?Array<any>,
//   queryLoading: ?boolean,
//   loadingMore: ?boolean,
//   orderBy: string,
//   order: string,
//   token: string,
//   objectApiName: string,
//   objectDescription: any,
//   recordType: string,
//   rowActionsList: Array<any>,
//   actions: any,
//   phoneLayout: PhoneLayout,
//   criteria: Array<any>,
//   handleNav: (destination: string, param: ?{}) => void,
//   navigation: any,
// };

// const FIRST_PAGE = 1;

// /**
//  * TODO: Deprecated!!!
//  */

// export default class RelatedIndexListView extends React.Component {
//   componentWillMount() {
//     const { onRefresh } = this.props;
//     if (onRefresh) {
//       onRefresh();
//     }
//   }
//   render() {
//     return (
//       <FlatList
//         style={{ alignSelf: 'stretch' }}
//         ItemSeparatorComponent={ListDivider}
//         keyExtractor={this.keyExtractor}
//         data={indexData}
//         renderItem={this.renderItem}
//         onRefresh={this.onRefresh}
//         refreshing={this.props.queryLoading}
//         onEndReached={this.onEndReached}
//         onEndReachedThreshold={0.05}
//       />
//     );
//   }
// }
