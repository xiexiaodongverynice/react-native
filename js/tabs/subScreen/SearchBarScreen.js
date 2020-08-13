// /**
//  * Created by Uncle Charlie, 2018/01/08
//  * @flow
//  */

// import React from 'react';
// import { StyleSheet, View, Text } from 'react-native';
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
//   Item,
//   Icon,
//   Input,
// } from 'native-base';
// import themes from '../common/theme';
// import { StyledBody, StyledHeader } from '../common/components';
// import { intlValue } from '../../utils/crmIntlUtil';

// type NavParam = {
//   apiName: string,
//   layout: any,
//   selectedFilter: ?Array<Filter>,
//   callback: (filters: Array<Filter>) => void,
// };

// type Prop = {
//   navigation: Navigation<NavParam>,
// };

// type State = {
//   defaultSearchValue: string,
// };

// class SearchBarScreen extends React.Component<Prop, State> {
//   constructor(props) {
//     super(props);
//     const { navigation } = props;
//     const _selectFilter = _.get(navigation, 'state.params.selectedFilter', []);
//     const _nameCompose = _.find(_selectFilter, (e) => _.get(e, 'condition.api_name') === 'name');

//     this.state = {
//       defaultSearchValue: _.get(_nameCompose, 'value[0].value') || '',
//     };

//     this.searchValue = _.get(_nameCompose, 'value[0].value') || '';
//     this.filterMap = _.isEmpty(_selectFilter) ? [] : _selectFilter;
//   }

//   handleOk = () => {
//     const { navigation } = this.props;
//     const { defaultSearchValue } = this.state;
//     const { callback } = navigation.state.params;
//     let _searchFilter = [];
//     if (!callback) {
//       console.log('handleFilterChange is invalid');
//       return;
//     }

//     if (defaultSearchValue == this.searchValue) {
//       navigation.goBack();
//       return;
//     }

//     if (this.searchValue) {
//       _searchFilter = {
//         condition: { api_name: 'name', type: 'text' },
//         op: { label: '包含', value: 'contains' },
//         value: [{ value: this.searchValue }],
//       };
//     }

//     _.remove(this.filterMap, (e) => e.condition.api_name === 'name');
//     const _resultFilter = [...this.filterMap, _searchFilter];

//     callback(_resultFilter);
//     navigation.goBack();
//   };

//   render() {
//     const { navigation } = this.props;
//     const { defaultSearchValue } = this.state;
//     return (
//       <Container>
//         <StyledHeader>
//           <Left>
//             <Button
//               transparent
//               style={{ paddingLeft: 0 }}
//               onPress={() => {
//                 navigation.goBack();
//               }}
//             >
//               <Icon
//                 name="ios-arrow-back"
//                 style={{
//                   color: '#fff',
//                   fontSize: themes.font_header_size,
//                 }}
//               />
//             </Button>
//           </Left>
//           <Body
//             style={{
//               flexDirection: 'row',
//               alignItems: 'center',
//             }}
//           >
//             <Icon name="ios-search" />
//             <Input
//               placeholder={intlValue('placeholder.please_enter_the_query_value')}
//               defaultValue={defaultSearchValue}
//               onChangeText={(text) => {
//                 this.searchValue = text;
//               }}
//             />
//           </Body>
//           <Right>
//             <Button transparent onPress={this.handleOk}>
//               <Text style={{ color: '#fff' }}>{`${intlValue('action.ok')}`}</Text>
//             </Button>
//           </Right>
//         </StyledHeader>
//         <Content />
//       </Container>
//     );
//   }
// }

// export default SearchBarScreen;
