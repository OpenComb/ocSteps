(function(){
	var Steps = function(){ this.ctor() } ;
	Steps.prototype.ctor = function()
	{
		this._steps = [] ;
		this._pauseCounter = 0 ;
		this._trylevel = 0 ;
		this.uncatchException = undefined ;
		this._bindo = this.do.bind(this) ;
		this._insertPos = 0 ;
		this.prevReturn = undefined ;
		this._lastHoldRecv = undefined ;
		this.recv = [] ;
		this._events = { 'uncatch': [], 'done': [] }
	} ;
	Steps.prototype.on = Steps.prototype.once = function(eventName,func)
	{
		func && this._events[eventName] && this._events[eventName].push(func) ;
		return this ;
	}
	Steps.prototype.emit = function(eventName)
	{
		var args = [] ;
		for( var i=1;i<arguments.length;i++ ) args.push(arguments[i]) ;
		if( this._events[eventName] && this._events[eventName].length )
			for(var handle;handle=this._events[eventName].shift();) handle.apply(this,args) ;
		return this ;
	}
	Steps.prototype.bind = function(object){ this.__proto__ = object ; return this ; }

	Steps.prototype.try = function()
	{
		this._trylevel ++ ;
		return this.step.apply(this,arguments) ;
	}
	Steps.prototype.catch = function(body,final)
	{
		this._steps.splice(this._insertPos++,0,{
			func: body
			, finalBody: final
			, isCatchBody: true
			, trylevel: this._trylevel --
		}) ;
		return this ;
	}
	Steps.prototype.step = function()
	{
		for(var i=0;i<arguments.length;i++)
		{
			if(arguments[i] && arguments[i].constructor==Array)
			{
				var presetArgs = arguments[i++] ;
			}
			this._steps.splice(this._insertPos++,0,{
				func: arguments[i]
				, presetArgs: presetArgs
				, trylevel: this._trylevel
			}) ;
		}
		return this ;
	}
	Steps.prototype.appendStep = function()
	{
		for(var i=0;i<arguments.length;i++)
		{
			if(arguments[i] && arguments[i].constructor==Array)
			{
				var presetArgs = arguments[i++] ;
			}
			this._steps.push({
				func: arguments[i]
				, presetArgs: presetArgs
				, trylevel: this._trylevel
			}) ;
		}
		return this ;
	}
	Steps.prototype.hold = function()
	{
		var names=arguments ;
		var holdIndex = this._lastHoldIndex = this._pauseCounter ++ ;
		
		var callbacked = false ;
		return (function(){
			// 只调用一次有效
			if(callbacked) return ;
			callbacked = true ;

			// 搜集到 recv 里
			this.recv[holdIndex] = arguments ;
			for(var i=0;i<names.length;i++)
			{
				names[i] && (this.recv[names[i].toString()] = arguments[i]) ;
			}
			
			// 最后一次 hold() 被 release
			if(this._lastHoldIndex==holdIndex)
			{
				this._lastHoldRecv = arguments ;
			}

			(--this._pauseCounter)<1 && this._doOnNextTick() ;

		}).bind(this) ;
	}
	Steps.prototype.terminate = function(){ throw {signal:'terminate'} ; }
	Steps.prototype._makesureStepArgs = function(presetArgs){ return presetArgs || this._lastHoldRecv || [this.prevReturn] ; }
	Steps.prototype.do = function()
	{
		if(this._pauseCounter) return this ;

		// 整个任务链结束
		if(!this._steps.length)
		{
			// 处理 uncatch 异常
			if( this.uncatchException )
			{
				if( this._events['uncatch'].length )
				{
					this.emit("uncatch",this.uncatchException) ;
				}
				else
				{
					throw this.uncatchException ;
				}
			}
			// done 事件
			this.emit("done",this.uncatchException||null) ;
			// 停止
			return this ;
		}

		var step = this._steps.shift() ;

		// 重置状态
		this._insertPos = 0 ;
		this._trylevel = step.trylevel ;
		try{
			if( step.isCatchBody )
			{
				if(step.finalBody)
				{
					step.finalBody.call( this ) ;
				}

				if(this.uncatchException)
				{
					var uncatchException = this.uncatchException ;
					this.uncatchException = undefined ;
	
					step.func.call( this, uncatchException ) ;
				}
			}
			else
			{			
				this.prevReturn = step.func.apply( this, this._makesureStepArgs(step.presetArgs) ) ;
			}
		}catch(err){

			this.prevReturn = undefined ;

			if(err.signal&&err.signal=='terminate')
			{
				this._steps = [] ;
			}
			else
			{
				this.uncatchException = err ;
				this._skipUntilCatchBody(step.trylevel) ;	// this._trylevel 可能已经在 step 执行时被改变了，所以用 step.trylevel 比较
			}
		}

		// 清空，等待异步操作回调时填充
		this.recv = [] ;
		this._lastHoldRecv = undefined ;

		return this._doOnNextTick() ;
	}
	Steps.prototype._doOnNextTick = function()
	{
		if( this._pauseCounter ) return ;

		process&&process.nextTick?
			process.nextTick(this._bindo) :
			setTimeout(this._bindo,0) ;

		return this ;
	}
	Steps.prototype._skipUntilCatchBody = function(steplevel)
	{
		// 跳过同 trylevel 下的后续 step
		while( this._steps.length )
		{
			if( this._steps[0].isCatchBody && this._steps[0].trylevel<=steplevel )
				break ;
			this._steps.shift() ;
		}
	}

	Steps.prototype.fork = function()
	{
		var fork=new Steps(), master=this ;
		fork.step.apply(fork,arguments) ;

		this.step(function(){
			// 传递参数
			fork._steps[0] && (!fork._steps[0].presetArgs) && (fork._steps[0].presetArgs=arguments) ;
			var forkreturn ;
			fork.appendStep( function(){
				forkreturn = arguments ;
			} ) ;
			// 执行
			var release = this.hold() ;
			fork.once("done",function(){
					release.apply(this,forkreturn) ;
				})
				.once("uncatch",function(error){
					// 在 master 上继续抛出异常
					master.uncatchException = error ;
					master._skipUntilCatchBody(master._trylevel) ;
				})
				._doOnNextTick() ;
		}) ;

		return fork ;
	}
	
	// 导出 ---
	function steps(){
		var steps = function(){
			steps._doOnNextTick() ;
		} ;
		for(var name in Steps.prototype)
			steps[name] = Steps.prototype[name] ;
		steps.ctor() ;
		steps.step.apply(steps,arguments) ;
		return steps ;
	}
	// node.js
	if(typeof module!='undefined' && typeof exports!='undefined' && module.exports)
	{
		module.exports = steps ;
	}
	// browser
	else if(typeof window!='undefined')
	{
		return window.Steps = steps ;
	}
}) () ;