# assert
+ assert是编程中非常常用的函数，c语言中就有assert.h，node中也有assert module
+ assert完全可以通过自己实现，并且非常简单，参考 nanoassert 和 assert0.js
+ 使用assert的好处是：它可以让程序更易于理解、更健壮、fail-fast

# assert使用示例
+ 假设一个登录页面，有一个login方法，代码如下
```
//bad code1
function login1(name,passwd){
	if(typeof name === 'string' && typeof passwd === 'string') {
		// do login
	} else {
		alert("name、passwd should be string");
		return;
	}
}
```
+ 上面的代码对类型进行了检测，但实际这样代码有一个**暗示**：name、passwd可能是其他类型。
+ 正常的登录界面是有实时提示的，如果没有输入完毕，按钮是禁用的，所以在**设计上**就已经保证了不会进入else
+ 这时开发者可能会将代码如下代码
```
//bad code2
function login2(name,passwd){
	// do login
}
```
+ login2没有做任何检查，这个方法中仍然有**暗示**：name、passwd可能是任意类型。团队开发中，另一个人对**设计**不了解的情况下，阅读此代码就会被**暗示**所害，导致写出这样的代码：
```
try{
	login2(name,passwd);
} catch (e){
	alert('login error'+e);
}
```
+ assert可以**消除暗示**，让程序更易于理解、更健壮、fail-fast：
```
// good code
function login3()(name,passwd){
	assert(typeof name === 'string');
	assert(typeof passwd === 'string');
	// do login
}
```



