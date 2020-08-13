*官方文档地址：*  
https://zhenyong.github.io/flowtype/docs/declarations.html#_  
https://flow.org/en/docs/types/generics/

## interface
定义一种接口规范，类似于 Java 的 interface
**用法一：**  
```
 interface Serializable {
  serialize(): string;
 }
 class Foo implements Serializable {
  serialize() { return '[Foo]'; } // Works!
 }

 class Bar implements Serializable {
 // $ExpectError
 serialize() { return 42; } // Error!
 }
```

**用法二：接口泛型**
 以泛型的形式动态指定接口内部使用的类型，从而生成一个 interface 或者 Type

**用法三：设置属性的读写权限**
 （interface 和 Type 可以混用）
 */

## .flowconfig
**设置接口文件**
[libs]（该选项在 flow 服务启动的时候会被加载）
1. 可以用来导入第三方库的 flow 接口文件  
2. 通过 declare 声明一些全局变量和类型  
***接口文件为 flow 运行预加载项，类似于配置文件。***  
***官方建议：Declarations should be distinct from regular code***

## 模块
1. type 和 interface 也可以以 es7 的形式在模块之间使用 import export
使用。注意不要和接口文件混淆。
2. 也可以使用 typeof 来获取类型

## declare
最好用在接口文件中，也可以用在任何地方。
1. 定义全局变量的类型，可以是函数，变量也可以是类。类同与 GLOBAL 的写法，在声明之后，在 global 上声明的内容会以 flow 全局变量类型得到正确的检查而不会报错。  
`declare function isLeapYear(year: string): bool;`  
或者  
`declare var isLeapYear: (year: string) => bool; // 变量的写法`

2. type interface 也可以

3. 也可以通过 declare module 'module name' {...} 为依赖库做类型检测

**注意**  
对于 flow 而言，declare 关键词并不是必须要有的，不声明并不会引起 flow 报错。
反倒有可能导致 eslint 报错。（尴尬），为了语法一致性，在接口文件中写的内容都要加 declare。
