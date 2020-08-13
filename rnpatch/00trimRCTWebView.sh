#!/bin/bash
set -x
cd $INIT_CWD

#不需要RCTWebView，删除掉
rm -rf node_modules/react-native/React/Views/RCTWebView*h
rm -rf node_modules/react-native/React/Views/RCTWebView*m
