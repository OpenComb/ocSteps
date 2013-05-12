(function(){
	var Steps = function(){ this.ctor() } ;
	Steps.prototype.ctor = function()
	{
		this._steps = [] ;
		this._trylevel = 0 ;
		this.uncatchException = undefined ;
		this._bindo = this.do.bind(this) ;
		this.prevReturn = undefined ;
		this.recv = [] ;
		this._events = { 'uncatch': [], 'done': [] }
		this._seek = 0 ;
		this._insertPos = 0 ;
		this.current = undefined ;
		this.prev = undefined ;
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
			, name: body.name
		}) ;
		return this ;
	}
	Steps.prototype._eachSteps = function(args,func){
		for(var i=0;i<args.length;i++){
			if(args[i] && args[i].constructor==Array)
			{
				var presetArgs = args[i++] ;
			}
			func.call(this,{
				func: args[i]
				, presetArgs: presetArgs
				, trylevel: this._trylevel
				, name: args[i].name
			}) ;
		}
		return this ;
	}
	Steps.prototype.step = function()
	{
		return this._eachSteps(arguments,function(step){
			this._steps.splice(this._insertPos++,0,step) ;
		}) ;
	}
	Steps.prototype.appendStep = function()
	{
		return this._eachSteps(arguments,function(step){
			this._steps.push(step) ;
		}) ;
	}
	Steps.prototype.loop = function()
	{
		return this._eachSteps(arguments,function(step){
			step.block = true ;
			this._steps.splice(this._insertPos++,0,step) ;
		}) ;
		
	}
	Steps.prototype.hold = function()
	{
		var step = this.current ;
		
		step.recv || (step.recv=[]) ;
		var holdIndex = step.recv.length ;
		
		var names=arguments ;
		
		step._holdsCounter || (step._holdsCounter=0) ;
		step._holdsCounter ++ ;
		
		var callbacked = false ;
		return (function(){
			// 只调用一次有效
			if(callbacked) return ;
			callbacked = true ;

			// 搜集到 recv 里
			step.recv[holdIndex] = arguments ;
			for(var i=0;i<names.length;i++)
			{
				names[i] && (step.recv[names[i].toString()] = arguments[i]) ;
			}
			
			(--step._holdsCounter)<1 && this._doOnNextTick() ;

		}).bind(this) ;
	}
	Steps.prototype.terminate = function(){ throw {signal:'terminate'} ; }
	Steps.prototype.break = function(){
		this.current.return = arguments ;
		throw { signal: 'break' } ;
	}
	Steps.prototype._makesureStepArgs = function(presetArgs){
		if(presetArgs) return presetArgs ;
		if(!this.prev) return ;
		return ( this.prev.recv && this.prev.recv[this.prev.recv.length-1] )
				|| ( (this.prev.return&&this.prev.return.callee)? this.prev.return: [this.prev.return] ) ;
	}
	Steps.prototype.do = function()
	{
		if(this.current && this.current._holdsCounter) return this ;

		// 整个任务链结束
		if(this._seek>=this._steps.length)
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

		// 重置状态
		if(this.current && !this.current.isCatchBody)
		{
			this.prev = this.current ;
			this.prevReturn = this.prev.return ;
			this.recv = this.prev.recv ;
		}
		this.current = this._steps[this._seek] ;

		this._insertPos = this._seek + (this.current.block? 0: 1) ;
		this._trylevel = this.current.trylevel ;
		
		try{
			if( this.current.isCatchBody )
			{
				if(this.current.finalBody)
				{
					this.current.finalBody.call( this ) ;
				}

				if(this.uncatchException)
				{
					var uncatchException = this.uncatchException ;
					this.uncatchException = undefined ;

					this.current.func.call( this, uncatchException ) ;
				}
			}
			else
			{
				this.current.return = this.current.func.apply( this, this._makesureStepArgs(this.current.presetArgs) ) ;
			}

			if( !this.current.block )
			{
				this._seek ++ ;
			}

		}catch(err){

			if(err.signal)
			{
				if(err.signal=='break')
				{
					this._seek ++ ;
				}
				else if(err.signal=='terminate')
				{
					this._seek = this._steps.length ;
				}
			}
			else
			{
				// 跳过同 trylevel 下的后续 step
				for( this._seek ++; this._seek<this._steps.length; this._seek ++ )
				{
					if( this._steps[this._seek].isCatchBody && this._steps[this._seek].trylevel<=this.current.trylevel )
						break ;
				}
			
				this.uncatchException = this.current.exception = err ;
			}
		}

		return this._doOnNextTick() ;
	}
	Steps.prototype._doOnNextTick = function()
	{
		if( this.current && this.current._holdsCounter ) return ;

		process&&process.nextTick?
			process.nextTick(this._bindo) :
			setTimeout(this._bindo,0) ;

		return this ;
	}
	Steps.prototype.fork = function()
	{
		var fork = steps.apply(null,arguments), master=this ;

		this.step(function(){
			// 传递参数
			fork._steps[0] && (!fork._steps[0].presetArgs) && (fork._steps[0].presetArgs=arguments) ;
			var forkreturn ;
			fork.appendStep( function __forktail__(){
				forkreturn = arguments ;
			} ) ;
			// 执行
			var release = this.hold() ;
			fork.once("done",function(){
				release.apply(this,forkreturn) ;
			}).once("uncatch",function(error){
				master.uncatchException = error ;
			}) () ;
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