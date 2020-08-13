# reactotron介绍
+ 它是调试工具，类似于console，console只能打印文字。而reactotron可以打印结构化的object。
+ 它还提供了很多plugin，可以查看redux、redux-saga、asyncstoreage、fetch的调用情况
+ 官网 https://github.com/infinitered/reactotron
+ Reactotron.app直接在github的releases中下载

# 项目中reactotron使用说明
+ app请求的网址是这样的格式`http://localhost:8081/index.bundle?platform=ios&dev=false&minify=false`
+ 是否dev由app确定
+ 如果是dev，这时会配置global.tron=Reactotron
+ 如果not dev，会配置 global.tron=fakeTron
+ 开发时直接使用`global.tron.log("text",object)`，这样并不会在生产环境引入垃圾代码

# 修改ip
+ 在ReactotronConfig.js中有个hostIP变量，需要修改为自己电脑的ip
+ 如果app在模拟器上，hostIP可以是'127.0.0.1'，也可以是局域网ip（192）
+ 如果app在真机上，配置局域网ip（192）
+ 可见，配置为局域网ip适用范围更广
