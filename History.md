0.2.3 / 2013-05-12
==================

	* 修改了绑定参数的方式，调用时代码更简洁
	* 彻底取消了 fork() 接收 function 类型参数
	

0.2.2 / 2013-05-12
==================

	* 取消了自动执行
	* Steps() 返回的任务链对象，同时也是一个可执行函数，执行该函数启动任务链
	
	
0.2.1 / 2013-05-11
==================

	* 增加了新的 `fork()`


0.2 / 2013-05-10
==================

	* 重构实现方式
	* 将 `fork()` 改名为 `hold()`
	* 增加异常处理机制
	* 浏览器环境兼容
	* 取消了旧的错误自动搜集（改为更好的异常处理支持）
	* 增加事件：`uncatch`
	* 取消事件函数 `done` 的参数 error
	* 增加绑定对象
	* 增加 `recv` 和 `prevReturn` 属性


0.1 / 2013-05-8
==================

	* 第一个版本