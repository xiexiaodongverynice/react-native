/**
 * @flow
 */

import React from 'react';
import { Text } from 'native-base';
import { StyledSeparator } from '../../tabs/common/components';
import themes from '../../tabs/common/theme';

const ListSectionSeparatorView = ({ name }: { name: string }) => (
  <StyledSeparator
    key="approvalFlow"
    style={{ backgroundColor: themes.fill_subheader, height: 30 }}
  >
    <Text
      style={{
        fontSize: themes.list_separator_text_size,
        fontWeight: 'bold',
        color: themes.list_subtitle_color,
      }}
    >
      {name}
    </Text>
  </StyledSeparator>
);

export { ListSectionSeparatorView };
