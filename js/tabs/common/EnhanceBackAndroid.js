// /**
//  * Created by Uncle Charlie, 2018/01/18
//  */

// import React from 'react';
// import { BackAndroid, Platform } from 'react-native';

// export default function EnhancedBackAndroid() {
//   return WrappedComponent =>
//     class NewComponent extends React.Component {
//       componentWillMount() {
//         if (Platform.OS === 'android') {
//           BackAndroid.addEventListener('hardwareBackPress', () => {
//             if (this.wrappedComponent) {
//               return this.wrappedComponent.handleHardwareBackPress();
//             }
//             return false;
//           });
//         }
//       }

//       componentWillUnmount() {
//         if (Platform.OS === 'android') {
//           console.log('removeEventListener......');
//           BackAndroid.removeEventListener('hardwareBackPress', () => {});
//         }
//       }

//       render() {
//         // return createElement(WrappedComponent, { ...this.props, ref: 'wrapcomponent' });
//         return (
//           <WrappedComponent
//             {...this.props}
//             ref={wrapped => {
//               this.wrappedComponent = wrapped;
//             }}
//           />
//         );
//       }
//     };
// }
