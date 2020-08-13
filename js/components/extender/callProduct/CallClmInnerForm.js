/**
 * @flow
 */

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import _ from 'lodash';
import { ListItem, Text, Icon } from 'native-base';
import CallClmRowItem from './CallClmRowItem';
import { toastDefault } from '../../../utils/toast';
import { intlValue } from '../../../utils/crmIntlUtil';
import { CALL_CLM_KEY } from './const';
import handleUpdateCascade, { CASCADE_CREATE } from '../../../utils/helpers/handleUpdateCascade';
import I18n from '../../../i18n';

type Prop = {
  KeyMessageReaction: any,
  pageType: string,
  navigation: any,
  clmData: Array,
  totalSelectedMedia: Array,
  totalSelectedMedia: Array<any>,
  dispatch: void,
  parentCallId: any,
  keyMessageReaction: any,
  clmFolderData: any,
  allFolderRelationList: any,
};

export default class CallClmInnerForm extends React.Component<Prop, {}> {
  clmCallback = (callbackSelected: any) => {
    const { parentCallId, dispatch } = this.props;

    const clm_presentation = _.get(callbackSelected, 'selected[0].value');
    const addClmData = {
      clm_presentation,
      reaction: '',
    };
    handleUpdateCascade({
      data: addClmData,
      relatedListName: CALL_CLM_KEY,
      status: CASCADE_CREATE,
      parentId: parentCallId,
      dispatch,
    });
  };

  addClm = () => {
    const {
      totalSelectedMedia,
      clmData,
      navigation,
      clmFolderData,
      allFolderRelationList,
    } = this.props;
    const clmSelectedListId = _.map(totalSelectedMedia, (media) =>
      _.get(media, 'clm_presentation'),
    );
    const clmListOptions = _.map(clmData, (o) => {
      const opItem = _.assign({}, { label: _.get(o, 'name'), value: _.get(o, 'id') });
      return opItem;
    });

    const newClmOptions = _.filter(
      clmListOptions,
      (y) => _.indexOf(clmSelectedListId, y.value) === -1,
    );

    const newclmData = _.filter(clmData, (y) => _.indexOf(clmSelectedListId, y.id) === -1);

    if (_.isEmpty(newClmOptions) || _.isEmpty(newclmData)) {
      toastDefault(I18n.t('CallClmInnerForm.NoOptions'));
      return;
    }

    const param = {
      apiName: 'clm_presentation',
      targetRecordType: 'master',
      multipleSelect: false,
      options: newClmOptions,
      callback: this.clmCallback,
      clmData: newclmData,
      clmFolderData,
      allFolderRelationList,
      isFromClm: true,
    };
    navigation.navigate('Option', param);
  };

  renderCLMList = () => {
    const {
      keyMessageReaction,
      totalSelectedMedia,
      clmData,
      pageType,
      navigation,
      dispatch,
      parentCallId,
    } = this.props;
    return _.map(totalSelectedMedia, (selected, index) => (
      <CallClmRowItem
        key={`${_.get(selected, 'name', '')}_key${Math.random(0, 5)}`}
        navigation={navigation}
        pageType={pageType}
        selected={selected}
        clmData={clmData}
        keyMessageReaction={keyMessageReaction}
        clmSelectedList={totalSelectedMedia}
        parentCallId={parentCallId}
        dispatch={dispatch}
      />
    ));
  };

  render() {
    const { totalSelectedMedia, pageType } = this.props;

    return (
      <View>
        {!_.isEmpty(totalSelectedMedia) && this.renderCLMList()}
        {pageType !== 'detail' && (
          <ListItem style={{ backgroundColor: 'white', height: 40, marginBottom: 20 }}>
            <TouchableOpacity
              onPress={() => {
                this.addClm();
              }}
              style={{ flex: 1 }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 40,
                }}
              >
                <Icon name="ios-add-circle-outline" style={{ color: 'green' }} />
                <Text style={{ marginLeft: 5 }}>{intlValue('label.add_clm')}</Text>
              </View>
            </TouchableOpacity>
          </ListItem>
        )}
      </View>
    );
  }
}
