// /**
//  * Created by Uncle Charlie, 2018/04/24
//  * @flow
//  */

// import React from 'react';
// import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
// import { RNCamera } from 'react-native-camera';
// import { Header, Title, Icon } from 'native-base';
// import { HeaderLeft, StyledBody, HeaderRight } from './common/components';
// import themes from './common/theme';
// import { toastError } from '../utils/toast';
// import preventDuplicate from './common/helpers/preventDuplicate';

// type Prop = { navigation: any, dispatch: any, screen: string };
// type State = { photo: string };

// export default class CameraScreen extends React.PureComponent<Prop, State> {
//   state = { photo: '' };

//   takePicture = async () => {
//     const { navigation } = this.props;
//     try {
//       if (this.camera) {
//         const callback = _.get(navigation, 'state.params.callback');

//         const options = { quality: 0.5, base64: true };
//         const data = await this.camera.takePictureAsync(options);
//         console.log('####>>camera photo data: ', data);

//         callback(data.uri);
//         navigation.goBack();

//         // this.setState({ photo: data.uri });
//       }
//     } catch (e) {
//       console.warn('camera error', e);
//       toastError('拍照遇到错误，请稍后再试。');
//     }
//   };

//   // TODO: provide photo thumbnail
//   renderThumbnail = () => {
//     const { photo } = this.state;
//     if (photo) {
//       return <Image source={{ uri: photo }} />;
//     }
//   };

//   render() {
//     const { navigation, dispatch, screen } = this.props;

//     return (
//       <View style={styles.container}>
//         <Header style={{ backgroundColor: themes.title_background }}>
//           <HeaderLeft
//             style={{ flex: 1 }}
//             navigation={navigation}
//             dispatch={dispatch}
//             screen={screen}
//           />
//           <StyledBody>
//             <Title
//               style={{
//                 color: themes.title_text_color,
//                 fontSize: themes.title_size,
//               }}
//             >
//               {'拍照'}
//             </Title>
//           </StyledBody>
//           <HeaderRight />
//         </Header>
//         <RNCamera
//           ref={(ref) => {
//             this.camera = ref;
//           }}
//           style={styles.preview}
//           type={RNCamera.Constants.Type.back}
//           flashMode={RNCamera.Constants.FlashMode.auto}
//           permissionDialogTitle={'开启摄像'}
//           permissionDialogMessage={'开启镜头才能拍照上传'}
//         />
//         <View
//           style={{ flex: 0, flexDirection: 'row', justifyContent: 'center' }}
//         >
//           <View style={{ flex: 1 }}>{this.renderThumbnail()}</View>
//           <TouchableOpacity onPress={preventDuplicate(this.takePicture, 3000)}>
//             <Icon name="ios-radio-button-on-outline" style={styles.capture} />
//           </TouchableOpacity>
//           <View style={{ flex: 1 }} />
//         </View>
//       </View>
//     );
//   }
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     flexDirection: 'column',
//     backgroundColor: 'black',
//   },
//   preview: {
//     flex: 1,
//     justifyContent: 'flex-end',
//     alignItems: 'center',
//   },
//   capture: {
//     flex: 0,
//     fontSize: 70,
//     color: '#fff',
//     alignSelf: 'center',
//     margin: 5,
//   },
// });
