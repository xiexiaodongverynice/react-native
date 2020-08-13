// *自定义Action处理方法
// *未完待续。。。
// import _ from 'lodash';
// import CustomActionService from '../../services/customActionService';
// import { getCustomActionCallbacks } from '../../tabs/common/helpers/recordHelper';
// import { toastSuccess, toastWaring, toastError, toastDefault } from '../toast';
// import { Confirm } from '../../tabs/common/components';

// export function onCustomAction(actionLayout) {
//   const needConfirm = _.get(actionLayout, 'need_confirm', false);
//   const confirmMessage = _.get(actionLayout, 'confirm_message');
//   const _callCustomAction = async () => {
//     console.log(this, 'this====>');
//     const { objectDescription, screenInfo, token, navigation } = this.props;
//     const _navParams = _.get(navigation, 'state.params.navParam', {});
//     const objectApiName =
//       _.get(_navParams, 'objectApiName') ||
//       _.get(_navParams, 'object_describe_api_name') ||
//       _.get(screenInfo, 'objectApiName');

//     const objectDescribe = _.chain(objectDescription)
//       .get('items')
//       .find({
//         api_name: objectApiName,
//       })
//       .value();
//     const response = await CustomActionService.post({
//       objectApiName,
//       actionLayout,
//       ids: [global.FC_CRM_USERID],
//       describe: objectDescribe,
//       token,
//     });
//     /**
//      * 接口回调
//      */
//     const { onSuccess } = getCustomActionCallbacks({
//       action: actionLayout,
//     });
//     console.log(onSuccess, response, 'onSuccess===>');
//     if (response) {
//       console.log(this, 'onSuccess===>');
//       new Function('__web__', '__phone__', '__pad__', onSuccess)(
//         null,
//         {
//           thiz: this,
//           actionLayout,
//           message: {
//             success: toastSuccess,
//             error: toastError,
//             warning: toastWaring,
//             default: toastDefault,
//           },
//         },
//         null,
//       );
//     }
//   };
//   if (needConfirm) {
//     Confirm({
//       title: confirmMessage || '确定执行?',
//       onOk() {
//         _callCustomAction();
//       },
//       onCancel() {
//         // console.log('Cancel');
//       },
//     });
//   } else {
//     _callCustomAction();
//   }
// }
