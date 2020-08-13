# CRM - Mobile

本项目服务于CRM手机端。

## 技术
主要的技术是react native和redux框架。redux中间件使用了redux-saga。

## 首次安装
clone完成后执行命令`npm install`或者是`yarn`。

## pull request
建立你自己的分支。分支的命名遵循如下规则：
1. 需求开发：那么是`feature/your_feature_name`。
2. bugfix: 那么是`bugfix/jira_bug_number`。

## 使用
### link第三方库
新添加第三方库，涉及到原生代码的添加时，需要`link`,命令具体如下：
  ``` 
    react-native link the_package_name
  ```
  比如，i18n的包可以这样link：`react-native link react-native-i18n`。

### 工具版本要求  
为保证协作开发同事和发布同事的环境一致并能够顺利运行，最好保证以下内容：(具体安装或更新方法见搜索引擎)
1. npm 版本: 6.12.0
2. cocopods 版本: 1.8.4
3. node 版本暂未要求

### 热更新
1. 下载code-push
  ```
  npm i -g code-push-cli
  ```

2. 登录code-push(`code-push` 账号找管理员)
  ```
  code-push login http://code-push.forceclouds.com/
  ```

3. 查看应用在stg和prod上的热更新key
  ```
  code-push deployment ls CRMpower-iOS -k
  ```

4. 检查ios和android的热更新key是否和环境一致

5. 发布热更新
  ```
  code-push release-react CRMpower-iOS ios -d Staging  --des "v1.0.44-20190325/1.性能优化,代码冗余/2.增加新的筛选功能/3.一人多岗功能支持上线"
  or
  code-push release-react CRMpower-iOS ios -d Staging  --des "v1.0.44-20190325"
  ```
6. 使用交互式命令脚本发布（Option）
  ```
    npm run code-push-deploy
    or
    ./code-push-deploy.sh
  ```
如果出现文件权限不足的情况，请执行 chmod +x code-push-deploy.sh


### 打包
ios
  
  1. 检查`build`号和`verison`，`version`只能保持相同或增加，如果有生产包发布，则只能增加`version`。`build`号只能增加。
  2. 依次点击`Generic IOS Device` -> `Product` -> `Archive`
  3. 打包完成验证证书上传到app store

android

  1. android studio 进行编译
  2. 需要添加签名到`/andoird/app/`下 (找管理员要签名)
  3. 项目使用了https，安卓请求网络请求需要绕过，[点击下载](http://59.110.159.14:8085/repository/crm-common/crmpower/NetworkingModule.java)，用下载后的文件替换 `/node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/modules/network/NetworkingModule.java`
  2. 项目终端 输入 `cd android && ./gradlew assembleRelease`
  3. 打包完成后，在 `crm/android/app/build/outputs/apk`找到apk文件


### 调试
1. ios cmd + d 显示调试选项列表  ,cmd + r 重载应用
2. android cmd + m 显示调试选项列表
3. Remote JS Debugging 默认调用浏览器控制条进行调试，只能打印console和debugger断点调试，如需更多调试，请安装[react-native-debugger](https://github.com/jhen0409/react-native-debugger)
4. 调试列表 reload 重载应用 Remote JS Debugging 打开调试模式 live reload 修改js代码后自动重载 hot reloading 热重载 toggle inspector 样式，网络等 perf monitor 内存占用帧数检查

### 日常开发注意事项
1. 拉取分支、切换分支后，是否需要重新安装 npm 依赖。如需，请执行 `npm install`（建议一律执行）
2. 添加、删除、更改混合依赖库版本（即包含原生模块的库），必须执行 `cd ios && pod install` 更新所维护的 Pods 文件夹。
（当然，如果选择不维护 Pods 文件夹，一律执行即可）

## 构建过程中可能遇到的坑及避免方式
**Q1: 无法建立 SSL 握手连接(Android)**  
将终端请求代理到 shadowsocks 在本地的 socks5 服务所监听的端口位置，这样再终端中所发出的请求也会被会话层转发到 vps 服务器上。  

A1: 在你终端所运行的 shell 解析器（我的是 zsh）的环境配置文件中（我的是~/.zshrc）添加  
```shell
alias setproxy="export ALL_PROXY=socks5://你的 socks5 监听地址和端口"
alias unsetproxy="unset ALL_PROXY"
```
然后再编译之前执行 `setproxy` 即可。这里只是做了简单的导出变量和配置别名，如需必要，可以直接将核心命令写入。或者也可以在当前 shell 环境下执行而不写入配置文件。  
*[五层 TCP/IP 协议、七层 OSI 网络协议模型](https://blog.csdn.net/huangjin0507/article/details/51613561)*  
*[传输层 socket 协议](http://zhihan.me/network/2017/09/24/socks5-protocol/)*

**Q2: 关于 React-Native 源码编译失败的问题**  
A2: 首次编译的时候不要使用 `./gradlew assembleDebug` 来构建项目，建议使用退回到项目根目录使用 `react-native run-android` 构建，react-native-cli 会做一些对编译 React-Native 源码的预处理，gradlew 则不会。  

**Q3: NDK 相关问题**  
A3: 别犹豫，直接找同事获取可编译通过的 ndk 版本的文件，并复制到 sdk 根目录即可。因为高版本的 ndk 对一些 cpp api 做了 deprecated 处理，导致编译的时候缺东少西，所以不建议修改 ndk 源码。

## CI 注意事项
CI 使用了 npm 官方源安装依赖。所以对我们日常开发要求以下几点：  
1. 在任何情况下对 package.json 的修改都需要同步到 package-ci.json, 并在 package-ci.json 中去掉 ^ 帽子（此时请保证 package-lock.json 中记录安装的版本与 package-ci.json 一致）
2. 如果出现需要自行维护的依赖库，请给 github 仓库同步一份，并以  
`"git+https://github.com/fc-npm/react-native-transformable-image.git#0.0.18"`  
类似的版本声明记录在 package-ci.json 中
