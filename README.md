[![Build Status](https://travis-ci.org/OpenComb/ocSteps.png)](https://travis-ci.org/OpenComb/ocSteps)

# ocSteps

__ocSteps__ 是一个JavaScript异步执行辅助工具，主要用于支持 Node.js 中的大量异步API以及操作，以及前端浏览器里的异步任务（例如Ajax）。如果你听说过“回调地狱”这个词，那么，__ocSteps__ 的用途就很好解释了：它尝试定义“回调天堂”。

__ocSteps__ 维护一个动态的任务链，任务链上的每个节点都是一个可执行函数，这些函数称为 step ，ocSteps 会依次执行任务链上的每个 step 。任务链是动态的，可以在执行过程中向任务链添加 step ，这是 ocSteps 和其他流行的异步操作库的主要区别（例如 [Step](https://github.com/creationix/step), [Async.js](https://github.com/caolan/async)）：不是提供各种规则来定义执行顺序，而是在任务链的执行过程中逐步定义任务链。

> 根据我最近的Node.js开发经验，静态地定义任务链结构，实际上会制造许多繁琐的编码工作；而动态地“演进”任务链，更吻合我们在思考业务逻辑时的思路，能让开发编码更加流畅，并且明显减少编码工作。

__ocSteps__ 参考了 [Step](https://github.com/creationix/step) 的设计，但是规则还要更简单（ocSteps包括注释和疏散的空行在内也只有200+行代码）；并且 ocSteps 是为复杂、动态的任务链而设计。


* [快速开始] (#-3)
* [异步操作] (#-4)
	* [暂停计数器] (#-5)
	* [并发任务] (#-6)
	* [recv 和 prevReturn] (#recv--prevreturn)
* [动态任务链] (#-7)
* [终止任务链] (#-8)
* [异常处理] (#-9)
* [事件] (#-10)
	* [done] (#done)
	* [uncatch] (#uncatch)
* [绑定参数] (#-11)
* [绑定对象] (#-12)
* [循环] (#-13)
    * [loop] (#loop)
    * [each] (#each)
* [分支] (#-14)
* [在浏览器中使用] (#-15)




## 安装

```
$ npm i ocsteps
```

## 测试

```
$ npm i -d
$ make test
```

## 升级日志

[History.md] (History.md)


## 快速开始

```javascript
var Steps = require("ocsteps") ;

// 和 Step 的用法很像
Steps(

	// 前一个函数的 return， 作为下一个函数的参数
	function(){
		var i = 1 ;
		console.log('step ',i) ;
		return ++i ;
	}

	, function(i){
		console.log('step ',i) ;		
		return ++i ;
	}

	, function(i){
		console.log('step ',i) ;
		return ++i ;
	}

) () ; // 连续调用，开始执行任务链
```

输出的结果是：

```
step 1
step 2
step 3
```

也可以将任务链的定义和执行分开，先定义好，晚一点再执行它

```javascript
var Steps = require("ocsteps") ;

var steps = Steps(

	function(){
		var i = 1 ;
		console.log('step ',i) ;
		return ++i ;
	}

	, function(i){
		console.log('step ',i) ;		
		return ++i ;
	}
) ;


steps.step(function(i){
	console.log('step ',i) ;
	return ++i ;
}) ;


// 执行任务链
steps() ;

```

## 异步操作


```javascript
var Steps = require("ocsteps") ;

Steps(
	function ()
	{
		fs.readFile("/some/file/path",this.hold()) ;
	}
	
	, function (err,buff)
	{
		if(err)
		{
			throw new Error(err) ;
		}
		
		console.log(buff.toString()) ;
	}
) () ;
```

调用 `hold()` 会让任务链的执行暂停，并且返回一个 release函数，直到这个release函数被调用后，任务链才继续执行。release接受到的参数，会传递给下一个 step function 。

通常将`hold()`返回的release函数 作为某个异步操作的回调函数。


在访问 mongodb 时使用 hold/release
```javascript
var mongodb = require('mongodb');

var steps = Steps(

	function()
	{
		// 连接到 mongodb 服务器
		var server = new mongodb.Server('127.0.0.1',27017) ;
		new mongodb.Db("your-db-name",server,{w:1})).open(this.hold()) ;

		this.step(function(err,client)
		{
			if(err) throw err ;
			return new mongodb.Collection(client,"your-collection-name") ;
		}) ;
	}

	, function(collection)
	{
		var release = this.hold() ;
		var count = 0 ;

		collection.find().each(function(err,doc){
			if(err)
			{
				steps.throw(err) ;
				return ;
			}

			if(doc)
			{
				console.log(doc) ;
				count ++ ;
			}
			else
			{
				release(count) ;
			}
		})
	}

	, function(count)
	{
		console.log("total:"+count) ;
	}

) () ;

```




### 暂停计数器

> 可以连续调用多次 `hold()` ，每调用一次 `hold()` 任务链的暂停计数器 +1，并返回一个 release 函数，暂停计数器>0 时任务链暂停；
> 每个 release 函数被回调时，暂停计数器 -1，当 暂停计数器<1 时，任务链恢复执行。


### 并发任务


```javascript
var Steps = require("ocsteps") ;

Steps(

	function stepA(){
		console.log( new Date() ) ;
		setTimeout(this.hold(),1000) ;
		setTimeout(this.hold(),2000) ;
		setTimeout(this.hold(),3000) ;
	}

	, function stepB(){
		console.log( new Date() ) ;
	}

) () ;
```

两次输出的时间会相差 3秒，因为最长一次 setTimeout() 是3秒 。

上面这个例子的执行过程如下：

```
stepA() -> hold() 1 pause! -> 1000ms -> release() 2
           hold() 2        -> 2000ms -> release() 1
           hold() 3        -> 3000ms -> release() 0 resume! -> stepB()
```


### recv 和 prevReturn

所有 hold() 在 release 时 接收到的参数，都会保存在 recv 属性中。它是一个二维数组，第一维下标表示对应第几次 hold() ，第二维下标表示第几个参数。

用数字下标到 recv 里取数据，不是一个很好的方式，这给程序加入了“神秘数字”的“坏味道”，更好的方法是：

```
hold(argName1,argName2,argName3 ...) ;
```

这是一个文件操作的例子

```javascript
var Steps = require("ocsteps") ;
var fs = require("fs") ;


Steps(

	// 检查文件是否存在
	function(){
		fs.exists("/some/folder/a.txt",this.hold('existsA')) ;
		fs.exists("/some/folder/b.txt",this.hold('existsB')) ;
		fs.exists("/some/folder/c.txt",this.hold()) ;
	}

	// 读取文件
	, function(existsC){
	
		this.recv.existsA
			&& fs.readFile("/some/folder/a.txt",this.hold('errA','buffA')) ;
		
		this.recv.existsA
			&& fs.readFile("/some/folder/a.txt",this.hold('errA','buffA')) ;
		
		existsC
			&& fs.readFile("/some/folder/c.txt",this.hold()) ;
	}

	// 输出文件
	, function(buffC){
	
		// 读文件遇到错误，抛出异常
		if(this.recv.errA||this.recv.errB||this.recv.errC)
		{
			throw new Error( this.recv.errA||this.recv.errB||this.recv.errC ) ;
		}
	
		this.recv.buffA
			&& console.log( this.recv.buffA.toString() ) ;
			
		this.recv.buffB
			&& console.log( this.recv.buffB.toString() ) ;
			
		buffC
			&& console.log( buffC.toString() ) ;
	}
	
) () ;
```



如果不需要中间的某个参数，可以用 `null` 占位：

```javascript
var Steps = require("ocsteps") ;

function someAsyncFunction(callback){
	setTimeout(function(){
		callback(1,2,3) ;
	},0) ;
}
	    
Steps(
    function stepA(){
    	someAsyncFunction( this.hold('a',null,'b') ) ;
    	
    	return "hello!" ;
    }
    
    , function stepB(){
    	console.log(this.recv.a) ;
    	console.log(this.recv.b) ;
    	console.log(this.prevReturn) ;
    }

) () ;
```

输出：
```
1
3
hello!
```


`prevReturn` 和 `recv`作用类似，它提供的是前一个 step function 的返回值。






## 动态任务链

`step()` 和 `appendStep()` 方法分别用于向任务链的当前位置和末尾动态地添加 step function。


```javascript
var Steps = require("ocsteps") ;

Steps(

	function funcA(){

		console.log("funcA") ;

		// 插入 step函数
		this.step(function funcB(){
			console.log("funcB") ;
		}) ;

		// 将 step函数 添加到任务链的末尾
		this.appendStep(function funcC(){
			console.log("funcC") ;
		}) ;
	}

	, function funcD(exists){
		console.log("funcD") ;
	}

) () ;
```

输出出来的是（d在c的前面）：
```
funcA
funcB
funcD
funcC
```

任务链最开始的状态是：

```
funcA -> funcD
```

然后在执行 funcA 的时候，`this.step(funcB)`在当前位置插入了 funcB ：

```
[funcA] -> funcB -> funcD
```
(方括号是正在执行的step function)


接着，`this.appendStep(funcC)`又在任务链的末尾插入了 funcC，结果就成了这样 ：

```
[funcA] -> funcB -> funcD -> funcC
```


`this.step()` 和 `this.appendStep()` 都支持多个参数，一次性向任务链添加多个step函数。

```javascript
var Steps = require("ocsteps") ;

Steps(

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

) () ;
```

输出的结果是：

```
insert 3 step functions one time:
a
b
c
insert step function one by one:
1
2
3
```

一次向`this.step()`传入多个函数，和单独传入，顺序上没有区别。



## 终止任务链

`terminate()` 能够立即终止整个任务链的执行，包括当前正在执行的 step function。


```javascript
var Steps = require("ocsteps") ;

Steps(

	function(){
		return new Error("some error occured") ;
	}

	,  function(err){
		err && this.terminate() ;   // 遇错终止
		console.log("You dont see this text forever.") ;	// 此行不会执行
	}
	
	// 后面的step都不会执行
	, function()
	{
		console.log("You dont see this text too.") ;
	}

) () ;
```

> 通过 `this.terminate()` 终止的任务链，仍然会触发`done`事件。



## 异常处理


可以用 `try()` 和 `catch(body[,finalBody])` 在任务链上标记一个区段，插入到这两者之间的 step 如果抛出异常，会跳过区段内的所有后续 step ，然后由 body 处理该异常(body是一个function)。而无论改区段内是否抛出了异常，最后 finalBody 都会被执行(finalBody也是一个function，可以省略的)。

举个栗子：

```javascript
var Steps = require("ocsteps") ;

var steps = Steps() ;

steps.try()

	.step(function(){
		console.log('step 1') ;
	})
	.step(function(){
	
		setTimeout(this.hold(function(){	
			throw new Error("oops") ;
		}),100)
	
		console.log('step 2') ;
	})
	.step(function(){
		console.log('step 3') ;
	})


steps.catch(

	// catch body
	function(error){
		console.log(error.message) ;	
		console.log("and then,there is no THEN ...") ;  // 然后，就没有然后了。
	}
	
	// final body
	,  function(){
		console.log("final") ;	
	}
) ;


// 定义完毕，开始执行任务链
steps() ;
```

输出:
```
step 1
step 2
oops
final
and then,there is no THEN ...
```

关于异常处理，有以下要点：

* 它们跟经典的 try/catch/final 差不多一个意思。

* `try(step1,step2,...)` 也可以像 `step()` 一样插入 step function ，这样可以让代码再简洁一点

* try-catch 可以嵌套，异常会被所在区段的 catch body 抓到。

* 只有插入到 `try()` 和 `catch()` 之间的step function所抛出的异常，才会被 catch，所以由 `appendStep()` 插入的 step function 的异常可能抓不到，因外它是插到任务链的末尾，而不是当前位置。

* `try()` 和 `catch()` 不必成对出现，只有 `catch()` 是必须的，`try()` 可以省略。

* 没有被抓到的异常，最后会触发 'uncatch' 事件

* `catch(body,finalBody)` 的第一个参数 body,只有在抓到异常时执行，finalBody无论如何都会执行

* `catch()` 如果抓到的异常对象不是预期的，可以在 body function 继续抛出，由更外层处理该异常对象。


## 事件

### 事件：done

```javascript
var Steps = require("ocsteps") ;

Steps(

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

).done(function(err){
	console.log("over.") ;
}) () ;
```

输出：

```
step 1
step 2
over .
```

* `this.terminate()` 终止任务链后，仍然会触发"done"事件

* `done` 事件触发时会将 uncatch exception 传递给事件函数，否则传入 null

* 可以在 `done` 的事件函数里使用 `prevReturn` 和 `recv` 访问最后一个 step function 的执行结果。

* 可以用 `done(function)` 替代 `on("done",func)`

### 事件：uncatch

任务链上抛出异常没有被任何 catch(body) 截获，最后就会触发 uncatch 事件。 uncatch 事件不会取消 done 事件

```javascript
var Steps = require("ocsteps") ;

Steps(

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

).done(function(err){
	console.log("over.") ;
}) () ;
```

可以用 `uncatch(function)` 替代 `on("done",func)`

## 绑定参数

```javascript
var Steps = require("ocsteps") ;

Steps(

	function(){
		return "foo" ;
	} ,

	["bar"], function(arg){
		console.log( this.prevStep.return ) ;
		console.log( arg ) ;
	}

) () ;
```

输出：
```
foo
bar
```

这个程序会输出预先传入的参数 `bar` 而不是从前一个 step函数传来的 `foo` 。

`step()` 除了接收 function 类型参数，还可以接收 Array 类型。Array参数会和后一个 function 绑定，作为 function 执行时的参数列表。	

这个机制主要应用于循环当中：

```javascript
var Steps = require("ocsteps") ;

Steps(

	// 有问题的方式
	function(){

		console.log("Always prints the last time value of the variable i in the for loop: ") ;

		for(var i=1;i<=3;i++)
		{
			this.step(function(){
				console.log(i) ;
			})
		}
	}

	// 常用的方式
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

    // 更好的方式
	, function(){

		console.log("Better way: the value of variable i in each loop has saved, and then pass to step functions: ") ;

        for(var i=1;i<=3;i++)
        {
            this.step([i], function(arg){
                console.log(arg) ;
            }) ;
        }
    }

) () ;
```

输出的结果是：
```
Always prints the last time value of the variable i in the for loop:
3
3
3
correct way:
1
2
3
Better way: the value of variable i in each loop has saved, and then pass to step functions:
1
2
3
```

如果在循环中使用 `this.step()` ，并在 step function 里访问闭包变量，可能完全不是你想要的结果。

例子里的三种方式，第一种方式是有问题的：执行 step function 输出闭包变量i时，循环已经结束了，所以i总是等于最后一次循环过程中的值：3；

第二种方式可以避免这个问题，这是闭包编程中避免此类问题的常见模式；而第三种方式更简单。




## 绑定对象

可以用 `bind()` 将任务链绑定到一个对象上（这样就可以少用一个闭包变量了），然后在 step function 内，this 能够继承该对象的所有属性和方法。


```javascript
var Steps = require("ocsteps") ;

var object = {

	foo: 'bar'
	
	, toString: function(){
		return this.foo ;
	}

}

Steps(

	function(){
		console.log(this.foo) ;
		console.log(this) ;
	}
	

).bind(object) () ;
```

> 调用 `bind()` 后，this.object 指向被绑定的对象

> 由于 ie 不支持 __proto__，`bind()` 在全系列 ie 下无效（但不会报错）。


`bind()`是一个为框架作者提供的方法，他们可以将 ocSteps 整合到他们的框架中。例如将任务链绑定给控制器，就得到了一个支持异步操作的控制器，那些 step function 实际上就成了控制器的方法。



## 循环

### loop

```javascript

var Steps = require("ocsteps") ;

Steps(

	function ()
	{
		this.loop(function(i){
		
			if(i>3)
			{
				// 结束循环
				this.break(i) ;
			}
			
			console.log('loop ',i) ;
			
			return ++i ;
		}) ;
		
		// 传个 loop step 的参数
		return 0 ;
	}
	
	// break() 会将收到的参数传递给循环结束后的下一个step
	, function(i)
	{
		console.log('break ',i) ;
	}

) () ;


```

输出：

```
loop 0
loop 1
loop 2
loop 3
break 4
```

在循环中同样可以调用 `hold()` 和 `step()` 等方法

```javascript

var Steps = require("ocsteps") ;


Steps(

	function ()
	{
		this.loop(function(i){
		
			if(i>3)
			{
				// 结束循环
				this.break(i) ;
			}
			
			console.log('loop ',i) ;
			
			// 异步操作
			var release = this.hold() ;
			setTimeout(function(){
				// 1秒钟后，将 i 传递给 step 
				release(i) ;
			},1000) ;
			
			this.step(function(i){
			
				console.log('step in loop ',i) ;
				
				// 传递给下一次 loop
				return ++i ;
			}) ;
		}) ;
		
		// 传个 loop step 的参数
		return 0 ;
	}
	
	// break() 会将收到的参数传递给循环结束后的下一个step
	, function(i)
	{
		console.log('break ',i) ;
	}

) () ;


```


```
loop 0
step in loop 0
loop 1
step in loop 1
loop 2
step in loop 2
loop 3
step in loop 3
break 4
```

> `loop()` 实际上和 `while(1)` 等效 。

### each

`each()` 是更有用的循环方式，它支持`对象成员`和`数组元素`的遍历。

```javascript
var fs = require("fs") ;

function printDir(folder,callback){

	Steps(

		function ()
		{
			fs.readdir(folder,this.hold()) ;
		}
		, function (err,files)
		{
			if(err) throw new Error(err) ;
			
			// 遍历所有目录成员
			this.each(files,function(i,filename){
			
				var path = folder+'/'+filename ;
					
				fs.stat(path,function(err,stat)
				{
					if(err) throw new Error(err) ;
					
					if(stat.isDirectory())
					{
						console.log('folder:',path) ;
						
						// 递归子目录
						printDir(path,this.hold()) ;
					}
					else
					{
						console.log('file:',path) ;
					}
				
				}) ;
			}) ;
		}
		
	).done(function(err){
		callback && callback(err) ;
	}) () ;

}


// 深度优先遍历目录
printDir("/some/folder") ;

```

## 分支


```javascript
var Steps = require("ocsteps") ;


Steps(

	function(){
		console.log("master step 1") ;
		return 'a' ;
	}

	, function(arg){

		console.log("master step 2, ","input:",arg) ;

		// 创建一个分支
		this.fork(
			function(arg){
				console.log("branch step 1, ","input: ",arg) ;
				return 'c' ;
			}

			, function(arg){
				console.log("branch step 2, ","input: ",arg) ;
				return 'd' ;
			}
		) ;

		return 'b'
	}

	, function(arg){
		console.log("master step 3, ","input: ",arg) ;
	}
) () ;
```

输出：
```
master step 1
master step 2, input: a
branch step 1, input: b
branch step 2, input: c
master step 3, input: d
```

* 分支和主干会自动衔接上的

* 执行分支时，主干暂停，分支执行完毕后，接着执行主干

* 主干能够 catch 分支抛出的异常

* 分支和主干之间，事件是独立的

* 对分支调用 terminate() 不会影响主干

* 分支和主干可以绑定不同的对象

* `fork()` 和 绑定对象，可以使 ocSteps 更好地集成到框架里




## 在浏览器中使用

```html

<script src="/some/folder/ocsteps/index.js" ></script>
<script>

Step(

	function(){
		$.ajax({
			type: "POST",
			url: "some.php",
			data: "name=John&location=Boston",
			success: this.hold("msg")
		});
	}
	
	, function(){
	
		console.log(this.recv.msg) ;
	
		$.ajax({
			type: "POST",
			url: "some.php",
			data: "name=John&location=Boston" ,
			success: this.hold("data")
		});
	}
	
	, function(){
		console.log(this.recv.data) ;
	}

) () ;

</script>


```


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