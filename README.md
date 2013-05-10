# ocSteps

__ocSteps__ 是一个JavaScript异步执行辅助工具，主要用于支持 Node.js 中的大量异步API以及操作，以及前端浏览器里的异步任务（例如Ajax）。如果你听说过“回调地狱”这个词，那么，__ocSteps__ 的用途就很好解释了：它尝试定义“回调天堂”。

__ocSteps__ 维护一个动态的任务链，任务链上的每个节点都是一个可执行函数，这些函数称为 step ，ocSteps 会依次执行任务链上的每个 step 。任务链是动态的，可以在执行过程中向任务链添加 step ，这是 ocSteps 和其他流行的异步操作库的主要区别（例如 async）：不是提供各种规则来定义执行顺序，而是在任务链的执行过程中逐步定义任务链。

根据我最近的Node.js开发经验，静态地定义任务链结构，实际上会制造许多繁琐的编码工作；而动态地“演进”任务链，更吻合我们在思考业务逻辑时的思路，这让开发编码更加流畅，并且明显减少编码工作。

__ocSteps__ 参考了 [Step](https://github.com/creationix/step) 的设计，但是规则还要更简单（ocSteps包括注释和疏散的空行在内也只有200+行代码）；并且 ocSteps 是为复杂、动态的任务链而设计。


___ocSteps的主要特性如下：___

* 在执行一个 step 时向任务链动态地添加新的 step：step(), appendStep()

* 在执行一个 step 时进行 hold() 操作，任务链暂停，直到对应的异步操作完成时 release ，当所有 hold() 都被 release 后，任务链继续

* 异常处理：ocSteps 的任务链上抛出的异常时，执行会跳出相应的step区段，直到被catch，或者任务链结束触发'uncatch'事件。

* 终止任务链：terminate()

* 事件：done, uncatch

* [计划] 分支：fork() 





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
var Steps = require("ocsteps") ;

// 和 Step 的用法很像
Steps(

	// 前一个函数的 return， 作为下一个函数的参数
	function step1(){
		var i = 1 ;
		console.log(i,arguments.callee.name) ;
		return ++i ;
	}

	, function step2(i){
		console.log(i,arguments.callee.name) ;
		
		// 在当前位置，动态地插入一个 step
		this.step(function step4(i){
			console.log(i,"dync ",arguments.callee.name) ;
			return ++ i
		}) ;
		
		return ++i ;
	}

	, function step3(i){
		console.log(i,arguments.callee.name) ;
		return ++i ;
	}

) ;
```

输出的结果是：

```
1 step1
2 step2
3 dync step4
4 step3
```

请留意一下这4个函数的执行顺序：由 step2 动态插入的函数 step4 是在 step2 和 step3 之间执行的。

## 动态任务链：this.step() 和 this.appendStep()

`step()` 和 `appendStep()` 方法用于向任务链动态地添加 step函数。效果分别是：插入到当前执行位置，和添加到任务链的最后。


```javascript
var steps = require("ocsteps") ;

steps(

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

) ;
```

打印出来的是（d在c的前面）：
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

在执行 funcA 的过程中，分别用 `this.step()` 和 `this.appendStep()` 向任务链插入了两个新函数。

`this.step(funcB)`在当前位置插入了 funcB ：

```
[funcA] -> funcB -> funcD
```
(方括号表示正在执行的step函数)


接着，`this.appendStep(funcC)`又在任务链的末尾插入了 funcC，结果就成了这样 ：

```
[funcA] -> funcB -> funcD -> funcC
```


`this.step()` 和 `this.appendStep()` 都支持多个参数，一次性向任务链添加多个step函数。

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
1
2
3
```

一次向`this.step()`传入多个函数，和单独传入，顺序上没有区别。




## 异步操作：hold()

调用 `hold()` 会让任务链的执行暂停，并且返回一个 release函数，直到这个release函数被调用后，任务链才继续执行。

通常将`hold()`返回的release函数 作为某个异步操作的回调函数，例如：

```javascript
var Steps = require("ocsteps") ;

Steps(
	function stepA()
	{
		// this.hold() 暂停任务链，并返回一个release函数，当做参数传给 fs.readFile()
		fs.readFile("/some/file/path",this.hold()) ;
		
		return "stepA" ;
	}
	
	// hold() 被 release 时，由fs.readFile()提供的参数，会传递给下一个 step function ，而不是 stepA 的返回值。
	, function stepB(err,buff)
	{
		if(err)
		{
			throw new Error(err) ;
		}
		
		console.log(buff.toString()) ;
	}
) ;
```


### 暂停计数器

可以连续调用多次 `hold()` ，每调用一次 `hold()` 任务链的暂停计数器 +1，并返回一个 release 函数，暂停计数器>0 时任务链暂停；
每个 release 函数被回调时，暂停计数器 -1，当 暂停计数器<1 时，任务链恢复执行。



```javascript
var Steps = require("ocsteps") ;

Steps(

	function funcA(){
		console.log( new Date() ) ;
		setTimeout(this.hold(),1000) ;
		setTimeout(this.hold(),2000) ;
		setTimeout(this.hold(),3000) ;
	}

	, function funcB(){
		console.log( new Date() ) ;
	}

) ;
```

两次打印的时间会相差 3秒，因为最长一次 setTimeout() 是3秒 。

上面这个例子的执行过程如下：

```
funcA() -> hold() 1 pause! -> 1000ms -> release() 2
           hold() 2        -> 2000ms -> release() 1
           hold() 3        -> 3000ms -> release() 0 resume! -> funcB()
```



`hold()` 接受function类型的参数，效果和 `step()` 相同。多次调用 `hold(step)`，将step function加入到任务链中的顺序和 hold() 的调用顺序一致，和 release()回调顺序无关，请观察下面这个例子：

```javascript
var Steps = require("ocsteps") ;

Steps(		
    function(){
    
    	console.log('a') ;
	        
        setTimeout(this.hold(function(){
    		console.log('b') ;
        }),300) ;
        
        setTimeout(this.hold(
	        function(){
    			console.log('c') ;
	        }
	        , function(){
    			console.log('d') ;
	        }
        ),200) ;
        
        setTimeout(this.hold(function(){
    		console.log('e') ;
        }),100) ;
    }

    , function(){
    	console.log('f') ;
    }

) ;
```

打印的结果是：
```
a
b
c
d
e
f
```

3个 setTimeout() 的时间不同，回调顺序相反，但是所有step函数的执行顺序是依次的，并且在所有 setTimeout 完成后，才从第一个 hold() 插入的 step 开始依次执行。
ocSteps 的任务链模式，保证在调用异步操作时，也能够实现同步效果。


由 `hold(step)` 插入到任务链里的 step function 在执行时将会传入 hold() 被 release 时所收到的参数。这是 `hold()` 和 `step()` 在插入 step function 时的主要区别：`hold(step)` 插入的 step function 是和这次 hold() 相关的，该 hold() 在 release 时收到的参数，会传递给对应的 step function 。


```javascript
var Steps = require("ocsteps") ;
var fs = require("fs") ;

Steps(		
    function stepA(){
    
    	fs.readFile("/some/file/path",this.hold(function stepB(err,buff){
    		console.log(buff.toString()) ;
    	})) ;
    
    	return "return by stepA" ;
    }


) ;
```

stepB 是由 hold() 插入到任务链上的，它会收到来自 fs.readFile() 的结果，而不是前一个 step函数 stepA 的返回值。


### recv

所有 hold() 在 release 时 接收到的参数，都会保存在 recv 属性中。它是一个二维数组，第一维下标表示对应第几次 hold() ，第二维下标表示第几个参数。

每执行完一个 step ，recv 就被清空，也就是说，只能访问前一次 step function 里的 hold() 结果。

用数字下标到 recv 里取数据，不是一个很好的方式，这给程序加入了“神秘数字”的“坏味道”。

更好的方法是：

```
hold(argName1,argName2,argName3 ...) ;
```

然后就可以用 `recv.argName1` 来反问release时传来的参数了。


```javascript
var Steps = require("ocsteps") ;
var fs = require("fs") ;

Steps(		
    function stepA(){
    	fs.readFile("/some/file/a.txt",this.hold('errA','buffA')) ;
    	fs.readFile("/some/file/b.txt",this.hold('errB','buffB')) ;
    	fs.readFile("/some/file/c.txt",this.hold()) ;
    }
    
    , function stepB(errC,buffC){
    	if( this.recv.errA || this.recv.errB || errC )
    	{
    		throw new Error( this.recv.errA||this.recv.errB || errC ) ;
    	}
    	
    	console.log('file a.txt:',this.recv.buffA.toString()) ;
    	console.log('file b.txt:',this.recv.buffB.toString()) ;
    	console.log('file c.txt:',this.recv.buffC.toString()) ;
    }

) ;
```

最后一个 hold() 在 release 时收到的参数传给了 stepB ，前面两次可以通过 recv 取到。


如果不需要某个参数，可以用 `null` 占位：

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
    }
    
    , function stepB(){
    	console.log(this.recv.a) ;
    	console.log(this.recv.b) ;
    }

) ;
```

打印：
```
1
3
```

`hold()` 可以同时接收function类型和字符串类型的参数：所有传入的function做为step插入到任务链里，其余的参数作为release 接收参数的名称。

```
var Steps = require("ocsteps") ;

function someAsyncFunction(callback){
	setTimeout(function(){
		callback(1,2,3) ;
	},0) ;
}
	    
Steps(
    function stepA(){
    
    	someAsyncFunction( this.hold('a','b',function (a,b,c){
    	
			console.log(this.prevReturn) ;
			console.log(a) ;
			console.log(b) ;
			console.log(c) ;
			console.log(this.recv.a) ;
			console.log(this.recv.b) ;
			console.log(this.recv.c) ;
			
		},'c') ) ; // 我是故意把 'c' 放在最后的
		
    	
    	return "hello!" ;
    }

) ;
```
打印：
```
hello!
1
2
3
1
2
3
```

`prevReturn` 和 `recv`作用类似，它提供的是前一个 step function 的返回值。


## 预置参数

```javascript
var steps = require("ocsteps") ;

steps(

	function(){
		return "foo" ;
	}

	, [
		function(arg){
			console.log( this.prevStep.return ) ;
			console.log( arg ) ;
		}
		, ["bar"]
	]

) ;
```

打印：
```
foo
bar
```

这个程序会打印预先设定的参数 `bar` 而不是从前一个 step函数传来的 `foo` 。

向任务链插入step时，可以提供一个数组，第一个元素是step function，第二个元素是传给 step function 的参数列表(数组类型)。

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

	, function(){

		console.log("Better way: the value of variable i in each loop has saved, and then pass to step functions: ") ;

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

) ;
```

打印的结果是：
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

如果在循环中简单地使用 `this.step()` ，并在 step function 中访问闭包变量，可能完全不是你想要的结果。

例子里的三种方式，第一种方式是有问题的：执行 step函数 打印闭包变量i时，循环已经结束了，所以i总是等于最后一次循环过程中的值：3；

第二种方式可以避免这个问题，这是闭包编程中避免此类问题的常见模式；而第三种方式更简单。



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
		console.log("You dont see this text forever.") ;	// 此行不会执行
	}
	
	// 后面的step都不会执行
	, function()
	{
		console.log("You dont see this text too.") ;
	}

) ;
```


## 异常处理


可以用 `try()` 和 `catch(body)` 在任务链上标记一个区段，body是一个function，插入到这两者之间的 step 如果抛出异常，会由跳过区段内的所有后续 step ，然后由 body 处理该异常，举个栗子：

```javascript
var Steps = require("ocsteps") ;

steps = Steps() ;

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


steps.catch(function(error){
	console.log(error.message) ;	
	console.log("and then,there is no THEN ...") ;  // 然后，就没有然后了。
}) ;
```

打印:
```
step 1
step 2
oops
and then,there is no THEN ...
```


* `try(step1,step2,...)` 也可以像 `step()` 一样插入 step function ，这样可以让代码再简洁一点

* try-catch 可以嵌套，异常会被所属区段的 catch body 抓到。

* 只有插入到 `try()` 和 `catch()` 之间的step function所抛出的异常，会被 catch() 抓到，所以 `appendStep()` 插入的 step function 的异常可能抓不到，因外它插到任务链的末尾，而不在`try()` 和 `catch()` 之间。

* `try()` 和 `catch()` 不必成对出现，只有 `catch()` 是必须的，`try()` 可以省略

* 没有被抓到的异常，最后会触发 'uncatch' 事件

* `catch(body,finalBody)` 的第一个参数 body,只有在抓到异常时执行，finalBody无论如何都会执行

* `catch()` 如果抓到的异常对象不是预期的，可以在 body function 继续抛出，由更外层处理该异常对象


## 事件

### 事件：done

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
}) ;
```

打印：

```
step 1
step 2
over .
```

`this.terminate()` 终止任务链后，仍然会触发"done"事件


### 事件：uncatch

任务链上抛出异常没有被任何 catch(body) 截获，最后会触发 uncatch 事件。 uncatch 事件不会取消 done 事件

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
}) ;
```

## 错误和异常处理

ocSteps 会自动搜集任务链执行过程中遇到的错误和异常对象，并将这些对象通过 `prev` 属性串联成一个错误链，将最后一个错误作为`done`事件的参数。


```javascript
var steps = require("ocsteps") ;

steps(

	function(){
		fs.readFile(this.hold('error','buff')) ;
	}
	
	, function(){
		if( this.recv.error )
		{
			throw new Error(this.recv.error) ;
		}
		
		console.log(this.recv.buff.toString()) ;
	}
	
	, function(){
	
		// other works
		// ... ...
	
	}

).on("catch",function(error){
	console.log(error) ;
})
```

## 绑定对象

可以用 `bind()` 将任务链绑定到一个对象上（这样就可以少用一个闭包变量了……），然后在 step function 内，this 能够继承该对象的所有属性和方法。


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
	

).bind(object) ;
```

> 由于 ie 不支持 __proto__，`bind()` 在全系列 ie 下无效（但不会报错）。


`bind()`是一个为框架作者提供的方法，他们可以将 ocSteps 整合到他们的框架中。例如将任务链绑定给控制器，就得到了一个支持异步操作的控制器，那些 step function 实际上就成了控制器的方法。


## 在浏览器中使用 ocSteps

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

) ;

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