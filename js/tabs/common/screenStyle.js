import { StyleSheet } from 'react-native';
import themes from './theme';

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
    marginHorizontal: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themes.primary_button_fill,
  },
});

export default styles;
