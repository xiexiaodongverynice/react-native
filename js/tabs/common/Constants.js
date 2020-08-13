/**
 * Created by Uncle Charlie, 2017/12/10
 * @flow
 */
import { NavigationActions } from 'react-navigation';

export default {
  loginNavAction: NavigationActions.reset({
    index: 0,
    actions: [NavigationActions.navigate({ routeName: 'Login' })],
  }),

  tabsNavAction: NavigationActions.reset({
    index: 0,
    actions: [NavigationActions.navigate({ routeName: 'Screens' })],
  }),

  splashNavAction: NavigationActions.reset({
    index: 0,
    actions: [NavigationActions.navigate({ routeName: 'Splash' })],
  }),

  FIRST_PAGE: 1,
  FIELD_META_PROP: 'data-__meta',
  FIELD_DATA_PROP: 'data-__field',
};
