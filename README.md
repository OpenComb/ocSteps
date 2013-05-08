# ocSteps

__ocSteps__ 参考了 [Step](https://github.com/creationix/step) 的设计，但是规则更简单。ocSteps 是为复杂、动态的任务链而设计。

[Step](https://github.com/creationix/step), [Async.js](https://github.com/caolan/async) 等库对静态的任务链结构支持得非常好，尤其是 Step 简单而优雅。

相比起 Step ，ocSteps 有以下特点：

___简化了：___

* 取消了 group(),parallel()，仅使用用 this.fork() 来处理异步情况

* 不通过判断step函数的返回值来决定是否立即执行下一个step函数，只要调用过 this.fork() 任务链就会等待回调



___增强了：___

* 可以在任务执行过程中插入step

* 可以为step预设参数，这对循环非常有用

* 自动搜集错误，并且用 prev 属性将所有错误串联起来

* 任务链的终止操作：this.terminate()

* 事件：done

* 支持并入另外一个任务链作为一个step


## 安装

```
$ npm i ocsteps
```

## 测试

```
$ npm i -d
$ make test
```


## 简单的例子

```javascript
var steps = require("ocsteps") ;

// 和 Step 的用法很像
steps(

	function(){
		var i = 1 ;
		console.log("step ",i) ;
		return ++i ;
	}

	, function(i){
		console.log("step ",i) ;
		return ++i ;
	}

	, function(i){
		console.log("step ",i) ;
		return ++i ;
	}

) ;
```

输出的结果是：

```
step 1
step 2
step 3
```

## 异步操作：this.fork()

在一个step函数中，用 `this.fork()` 作为异步操作的回调函数，任务链会一直等待这个step函数里所有的异步操作回调后，继续下一个step。
最后一次回调传入的参数，会作为下一个 step 函数的参数；

```javascript
var steps = require("ocsteps") ;

steps(

	function(){
		console.log( new Date() ) ;
		setTimeout(this.fork(),1000) ;
		setTimeout(this.fork(),2000) ;
		setTimeout(this.fork(),3000) ;
	}

	, function(){
		console.log( new Date() ) ;
	}

) ;
```

两次打印的时间会相差 3秒，因为最长一次 setTimeout() 是3秒 。


```javascript
var steps = require("ocsteps") ;
var fs = require("fs") ;

steps(

	function(){
		fs.exists("/some/file/path",this.fork()) ;
	}

	, function(exists){
		console.log("fs.exists() return: "+exists) ;
	}

) ;
```

## 动态任务链：this.step() 和 this.appendStep()

可以在一个 step 函数中，通过 `this.step()` 和 `this.appendStep()` 动态地向任务链添加 step函数。效果分别是：插入到当前执行位置，和添加到任务链的最后。


```javascript
var steps = require("ocsteps") ;

steps(

	function(){

		console.log("a") ;

		this.step(function(){
			console.log("b") ;
		}) ;

		this.appendStep(function(){
			console.log("c") ;
		}) ;
	}

	, function(exists){
		console.log("d") ;
	}

) ;
```

打印出来的是：
```
a
b
d
c
```

`this.step()` 和 `this.appendStep()` 都支持多个参数，一次性向任务链添加多个step函数。

但是，对 `this.step()` 来说，一个一个传入 step函数，和一次传入多个 step函数，添加到任务链上的顺序是不同的：

```javascript
var steps = require("ocsteps") ;

steps(

	function(){

		console.log("insert 3 step functions one time: ") ;

		// 一次向任务链插入多个step函数
		this.step(
			function(){
				console.log("a") ;
			}
			, function(){
				console.log("b") ;
			}
			, function(){
				console.log("c") ;
			}
		) ;
	}

	, function(){

		console.log("insert 3 step functions one by one: ") ;

		// 陆续向任务链插入函数
		this.step(function(){
			console.log("1") ;
		}) ;
		this.step(function(){
			console.log("2") ;
		}) ;
		this.step(function(){
			console.log("3") ;
		}) ;
	}

) ;
```

打印的结果是：

```
insert 3 step functions one time:
a
b
c
insert step function one by one:
3
2
1
```

`this.step()` 是栈的操作方式，这很像洗一堆脏盘子：每次从最上面取一个盘子来清洗，`this.step()`则是往上面放一些盘子，
如果每个盘子一个一个地单独放上去，最后放上去的在最上面，会被最先清洗，最先放的反而最后被清洗，和放入的顺序相反；
但如果这几个盘子是摞一起放上去，则会按照这几个盘子本来的顺序清洗。

`this.appendStep()` 是向栈的底部增加step函数，所以没有顺序问题。


## 预置参数

```javascript
var steps = require("ocsteps") ;

steps(

	function(){
		return "foo" ;
	}

	, [
		function(arg){
			console.log( arg ) ;
		}
		, ["bar"]
	]

) ;
```

这个程序会打印预先设定的参数 `bar` 而不是从前一个 step函数传来的 `foo` 。

`this.step()` 和 `this.appendStep()` 也都支持将 step函数放在数组里，数组的第二个元素是数组。

这个机制主要应用于循环当中：

```javascript
var steps = require("ocsteps") ;

steps(

	function(){

		console.log("Always prints the last time value of the variable i in the for loop: ") ;

		for(var i=1;i<=3;i++)
		{
			this.step(function(){
				console.log(i) ;
			})
		}
	}

	, function(){

		console.log("The value of variable i in each loop has saved, and then pass to step functions: ") ;

        for(var i=1;i<=3;i++)
        {
            this.step([
	            function(arg){
	                console.log(arg) ;
	            }
	            , [ i ]
            ]) ;
        }
    }

	, function(){

		console.log("Another way: ") ;

        for(var i=1;i<=3;i++)
        {
            (function(arg){

	            this.step( function(){
		            console.log(arg) ;
		        } ) ;

	        }) (i) ;
        }
    }

) ;
```

打印的结果是：
```
Always prints the last time value of the variable i in the for loop:
3
3
3
The value of variable i in each loop has saved, and then pass to step functions:
1
2
3
Another way:
1
2
3
```

如果在循环中简单地使用 `this.step()` ，并在 step函数 中访问闭包变量，可能不是你想要的结果。

例子里的三种方式，第一种方式是有问题的：执行 step函数 打印闭包变量i时，循环已经结束了，所以i总是等于最后一次循环过程中的值：3；

第三种方式可以避免这个问题，这是闭包编程中常见的模式；不过第二种方式显然更简单。



## 终止任务链：this.terminate()

`this.terminate()` 能够立即终止整个任务链的执行，包括当前 step函数。通过 `this.terminate()` 终止的任务链，仍然会触发`done`事件。


```javascript
var steps = require("ocsteps") ;

steps(

	function(){
		return new Error("some error occured") ;
	}

	,  function(err){
		err && this.terminate() ;   // 遇错终止
		console.log("You dont see this sentence forever .") ;
	}

) ;
```




## 事件

ocSteps 是一个 nodejs EventEmitter 对象，支持事件：done

```javascript
var steps = require("ocsteps") ;

steps(

	function(){
		console.log("step 1") ;
	}

	,  function(){
		console.log("step 2") ;
	}

	,  function(){

		// 终止任务链
		this.terminate() ;

		console.log("step 3") ;
	}

).on("done",function(){
	console.log("over.") ;
})
```

打印：

```
step 1
step 2
over .
```

`this.terminate()` 不会影响"done"事件的触发


## 错误和异常处理

ocSteps 会自动搜集任务链执行过程中遇到的错误和异常对象，并将这些对象通过 `prev` 属性串联成一个错误链，将最后一个错误作为`done`事件的参数。


```javascript
var steps = require("ocsteps") ;

steps(

	function(){
		return new Error("As step function's return") ;
	}

	,  function(){

		function someAsyncOperation(callback)
		{
			setTimeout(function(){
				callback( new Error("As first arg of callback") ) ;
			},0) ;
		}

		someAsyncOperation( this.fork() ) ;
	}

	,  function(){
		throw {error:"As a exception object"} ;
	}

).on("done",function(lastError){
	// 将所有错误打印出来
	for( var error=lastError; error; error=error.prev )
	{
		console.log(lastError) ;
	}
})
```

如果step函数之间不存在依赖关系，那么不需要在每个step函数里处理前一个step的错误，可以集中起来一起处理。

以下情况发生的错误会被自动搜集起来，自动串连成一个错误链：

* 传给step函数的第一个参数为 Error对象：arguments[0].constructor===Error

* `this.fork()` 收到的回调参数中的第一个参数如果是字符串，则将这个字符串做为错误消息转换成Error对象，加以搜集
	node.js api 里很多异步函数，其回调的第一个参数是一个字符串格式的错误消息，例如：`fs.readFile()`；但这个约定也有例外，例如：`fs.exits()`。
	ocSteps 只自动搜集字符串类型的第一个回调参数，并且，可以通过 `this.fork(false)` 来禁用自动搜集错误。

* step函数执行堆栈上未处理的异常


## silence

ocSteps 会在遇到错误时自动将错误打印到控制台，以免在调试时漏过错误。用 `silence` 属性可以关闭。


```javascript
var steps = require("ocsteps") ;

steps(

	function(){
		throw {error:"some error occured"} ;
	}

).on("done",function(lastError){
	// 将所有错误打印出来
	for( var error=lastError; error; error=error.prev )
	{
		console.log(lastError) ;
	}
}).silence = true ;  // silence=true 禁止自动打印错误
```

也可以在 step函数里设置：

```javascript
var steps = require("ocsteps") ;

steps(

	function(){
	
		// silence=true 禁止自动打印错误
		this.silence = true ;
		
		throw {error:"some error occured"} ;
	}

).on("done",function(lastError){
	// 将所有错误打印出来
	for( var error=lastError; error; error=error.prev )
	{
		console.log(lastError) ;
	}
})
```



## 尚未实现

* 支持浏览器环境

* 可以合并另一个任务链对象作为当前任务链的一个step

* 判断Error对象时，遍历整个 __proto__ 链


---

### Have fun !



## License

(The MIT License)

Copyright (c) 2013 Alee Chou &lt;aleechou@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.