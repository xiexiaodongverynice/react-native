/**
 * @flow
 * Created by yjgao
 * Only for New-Home which contains webview and other views.
 * so we need to change height of webview dynamically.
 */

import React from 'react';
import FcWebView from '../../../lib/FcWebView';

type Props = {
  external_page_src: string,
  height: number,
  width: number,
};

export default (props: Props) => {
  const { external_page_src, height, width } = props;

  if (height === 0 || width === 0) {
    return null;
  }

  return (
    <FcWebView
      useWebKit
      key="webView"
      style={{ width, height, padding: 1 }}
      automaticallyAdjustContentInsets={false}
      startInLoadingState
      mixedContentMode="always"
      source={{ uri: external_page_src }}
    />
  );
};
