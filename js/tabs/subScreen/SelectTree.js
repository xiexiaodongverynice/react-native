/*
 * @flow
 * 筛选下属页面
 */

import React from 'react';
import _ from 'lodash';
import { Body, Container, Right, Title } from 'native-base';
import { HeaderLeft, StyledHeader } from '../common/components';
import SelectTreeView from '../../components/selectTree';
import I18n from '../../i18n';
import { getTerritoryId, getParentTerritoryId } from '../../components/selectTree/help';
import themes from '../common/theme';

type Prop = {
  navigation: any,
};

const _composeStash = (stashSubOptions) => {
  const result = {};
  _.each(stashSubOptions, (option) => {
    const territoryId = getTerritoryId(option);
    result[territoryId] = option;
  });
  return result;
};

const SelectTreeScreen = (props: Prop) => {
  const { navigation } = props;
  const params = _.get(navigation, 'state.params', {});

  const _composeOptions = () => {
    const options = params.options;
    const optionsParams = {};

    _.each(options, (option) => {
      const parentTerritoryId = getParentTerritoryId(option);

      if (!parentTerritoryId) return;

      if (_.has(optionsParams, parentTerritoryId)) {
        optionsParams[parentTerritoryId].push(option);
      } else {
        optionsParams[parentTerritoryId] = [option];
      }
    });
    return optionsParams;
  };

  //* 获取当前人的信息
  const currentUserInfo = _.find(
    params.options,
    (option) => getTerritoryId(option) == global.CURRENT_ACTIVE_TERRITORY,
  );

  //* 将下属数据组改为对象 key为territory_id,value为parent_territory_id为key所有数据
  const composeOptions = _composeOptions();

  const stashSubOptions = _composeStash(params.stashSubOptions);

  return (
    <Container style={{ backgroundColor: themes.fill_base }}>
      <StyledHeader>
        <HeaderLeft navigation={navigation} />
        <Body style={{ alignItems: 'center', flex: 1 }}>
          <Title
            style={{
              color: themes.title_text_color,
              fontSize: themes.title_size,
            }}
          >
            {I18n.t('common_options')}
          </Title>
        </Body>
        <Right />
      </StyledHeader>
      <SelectTreeView
        navigation={navigation}
        stashSubOptions={stashSubOptions}
        composeOptions={composeOptions}
        currentUserInfo={currentUserInfo}
        params={params}
      />
    </Container>
  );
};

export default SelectTreeScreen;
