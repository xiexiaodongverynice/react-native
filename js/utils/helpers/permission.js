import _ from 'lodash';

const TAB_PERMISSION_PREFIX = 'tab.';

//* 判断菜单的是否有权限
export function hasPermissionMenu(menu, permission) {
  return menu.filter((item) => {
    const permissionKey = TAB_PERMISSION_PREFIX + item.api_name;
    const tabPermission = _.get(permission, permissionKey);
    const hiddenDevices = _.get(item, 'hidden_devices', []);
    // If permission is not allowed, Go on.
    if (tabPermission && tabPermission === 2 && _.indexOf(hiddenDevices, 'cellphone') === -1) {
      return item;
    }
  });
}
