/**
 * @flow
 */

import React from 'react';
import { Image } from 'react-native';
import { Icon } from 'native-base';
import _ from 'lodash';

type ModalIconType = {
  label: string,
  action: string,
  actionCode: string,
  icon?: string,
};

const AddIconView = () => (
  <Image
    source={require('../../img/ModalPopover/add.png')}
    style={{ width: 14, height: 14 }}
    resizeMode="contain"
  />
);

const CancelIconView = () => (
  <Image
    source={require('../../img/ModalPopover/cancel.png')}
    style={{ width: 14, height: 14 }}
    resizeMode="contain"
  />
);

const EditIconView = () => (
  <Image
    source={require('../../img/ModalPopover/edit.png')}
    style={{ width: 14, height: 14 }}
    resizeMode="contain"
  />
);

const AddCallIconView = () => (
  <Image
    source={require('../../img/ModalPopover/add_call.png')}
    style={{ width: 14, height: 14 }}
    resizeMode="contain"
  />
);

const UpdateOkIconView = () => (
  <Image
    source={require('../../img/ModalPopover/update_ok.png')}
    style={{ width: 14, height: 14 }}
    resizeMode="contain"
  />
);

const AddPersonIconView = () => (
  <Image
    source={require('../../img/ModalPopover/add_person.png')}
    style={{ width: 14, height: 14 }}
    resizeMode="contain"
  />
);

const TimeIconView = () => (
  <Image
    source={require('../../img/ModalPopover/time.png')}
    style={{ width: 14, height: 14 }}
    resizeMode="contain"
  />
);

const NoticeIconView = () => (
  <Image
    source={require('../../img/ModalPopover/notice.png')}
    style={{ width: 14, height: 14 }}
    resizeMode="contain"
  />
);

const ActiveIconView = () => (
  <Image
    source={require('../../img/ModalPopover/active.png')}
    style={{ width: 14, height: 14 }}
    resizeMode="contain"
  />
);

const FC_ICON_CONFIG = {
  fc_add: AddIconView,
  fc_cancel: CancelIconView,
  fc_edit: EditIconView,
  fc_addCall: AddCallIconView,
  fc_updateOk: UpdateOkIconView,
  fc_addPerson: AddPersonIconView,
  fc_time: TimeIconView,
  fc_notice: NoticeIconView,
  fc_active: ActiveIconView,
};

function outputCutomerIcon(icon) {
  if (_.has(FC_ICON_CONFIG, icon)) {
    const IconView = _.get(FC_ICON_CONFIG, icon);
    return <IconView />;
  }
  return <Icon name={icon} style={{ fontSize: 16, color: '#0000008a' }} />;
}

const ModalPopoverIcon = ({ label = '', action = '', actionCode = '', icon }: ModalIconType) => {
  if (!_.isUndefined(icon)) {
    return outputCutomerIcon(icon);
  }

  if (_.toUpper(actionCode) === 'DELETE') {
    return <CancelIconView />;
  }
  if (action === 'EDIT') {
    return <EditIconView />;
  }

  if (label) {
    if (label === '编辑') {
      return <EditIconView />;
    } else if (label === '新建拜访计划' || label === '新建拜访记录') {
      return <AddCallIconView />;
    } else if (/完成|提交/.test(label) || label === '收藏') {
      return <UpdateOkIconView />;
    } else if (/取消/.test(label)) {
      return <CancelIconView />;
    } else if (label === '添加参会人') {
      return <AddPersonIconView />;
    } else if (label === '添加临时参会人') {
      return <TimeIconView />;
    } else if (/添加|新建|开展|新增/.test(label)) {
      return <AddIconView icon="add" />;
    } else if (/通知/.test(label)) {
      return <NoticeIconView />;
    } else if (/执行/.test(label)) {
      return <ActiveIconView />;
    } else if (label === '应用模板') {
      return <UpdateOkIconView />;
    } else if (label === '复制拜访') {
      return <AddCallIconView />;
    }
  }

  if (action === 'ADD') {
    return <AddIconView icon="add" />;
  }

  return null;
};

export default ModalPopoverIcon;
