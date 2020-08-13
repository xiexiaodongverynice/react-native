#!/bin/bash
set -x
cd `dirname "${BASH_SOURCE[0]}"`
bash 00trimRCTWebView.sh
bash 01replaceFiles.sh
bash 02replaceImagePickerManager.m.sh
