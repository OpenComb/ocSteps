(function(){

	var Steps = function()
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

		this._events = {
			'uncatch': []
			, 'done': []
		}

	} ;
	Steps.prototype.on = function(eventName,func)
	{
		this._events[eventName] && this._events[eventName].push(func) ;
		return this ;
	}
	Steps.prototype.emit = function(eventName)
	{
		var args = [] ;
		for( var i=1;i<arguments.length;i++ )
		{
			args.push(arguments[i]) ;
		}
		if( this._events[eventName] && this._events[eventName].length )
		{
			for(var handle;handle=this._events[eventName].shift();)
			{
				handle.apply(this,args) ;
			}
		}
		return this ;
	}
	Steps.prototype.bind = function(object)
	{
		this.__proto__ = object ;
		return this ;
	}
	
	Steps.prototype._buildStep = function(func)
	{
		var step =  {
			func: func
			, presetArgs: undefined
			, trylevel: this._trylevel
		} ;
		if(func.constructor===Array)
		{
			step.presetArgs = func[1] ;
			step.func = func[0]
		}
		return step ;
	}
	Steps.prototype.try = function()
	{
		this._trylevel ++ ;
		this.step.apply(this,arguments) ;
		return this ;
	}
	Steps.prototype.catch = function(body,final)
	{
		var stepBody = this._buildStep(body) ;
		stepBody.isCatchBody = true ;
		stepBody.finalBody = final ;

		this._steps.splice(this._insertPos++,0,stepBody) ;

		this._trylevel -- ;
		return this ;
	}
	Steps.prototype._step = function()
	{
		var newsteps = [this._insertPos,0] ;
		this._insertPos+= arguments.length ;
		
		for(var i=0;i<arguments.length;i++)
		{
			newsteps.push( this._buildStep(arguments[i]) ) ;
		}
		this._steps.splice.apply(this._steps,newsteps) ;

		newsteps.splice(0,2) ;
		return newsteps ;
	}
	Steps.prototype.step = function()
	{
		this._step.apply(this,arguments) ;
		return this ;
	}
	Steps.prototype.appendStep = function()
	{
		for(var i=0;i<arguments.length;i++)
		{
			this._steps.push(this._buildStep(arguments[i])) ;
		}
		return this ;
	}
	Steps.prototype.hold = function()
	{
		var newsteps=[], names=[] ;
		for(var i=0;i<arguments.length;i++)
		{
			((typeof arguments[i]=='function'||(arguments[i]&&arguments[i].constructor===Array))? newsteps: names) .push(arguments[i]) ;
		}
		var newsteps = this._step.apply(this,newsteps) ;

		var holdIndex = this._lastHoldIndex = this._pauseCounter ++ ;
		
		var callbacked = false ;

		return (function(){
			// 只调用一次有效
			if(callbacked) return ;
			callbacked = true ;

			this.recv[holdIndex] = arguments ;
			
			for(var i=0;i<names.length;i++)
			{
				names[i] && (this.recv[names[i].toString()] = arguments[i]) ;
			}
			
			for(var i=0;i<newsteps.length;newsteps++)
			{
				newsteps[i].presetArgs = arguments ;
			}
			
			// 最后一次 hold() 被 release
			if(this._lastHoldIndex==holdIndex)
			{
				this._lastHoldRecv = arguments ;
			}

			(--this._pauseCounter)<1 && this._doOnNextTick() ;

		}).bind(this) ;
	}
	Steps.prototype.terminate = function()
	{
		throw {signal:'terminate'} ;
	}
	
	Steps.prototype.do = function()
	{
		if(this._pauseCounter) return this ;

		// 整个任务链结束
		if(!this._steps.length)
		{
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

			//
			this.emit("done",this.prevReturn) ;

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
				this.prevReturn = step.func.apply( this, step.presetArgs || this._lastHoldRecv || [this.prevReturn] ) ;
			}
		}catch(err){

			this.prevReturn = undefined ;

			if(err.signal&&err.signal=='terminate')
			{
				// 跳过所有同分支的 step
				while( this._steps.length && this._steps[0].branchlevel>=step.branchlevel )
				{
					this._steps.shift() ;
				}
			}
			else
			{
				this.uncatchException = err ;

				// 跳过同 trylevel 下的后续 step
				while( this._steps.length )
				{
					if( this._steps[0].isCatchBody && this._steps[0].trylevel<=step.trylevel )
					{
						break ;
					}

					this._steps.shift() ;
				}
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

	function steps()
	{
		var steps = new Steps ;
		return steps.step.apply(steps,arguments)._doOnNextTick() ;
	}

	// node.js
	if(typeof module!='undefined' && typeof exports!='undefined' && module.exports)
	{
		module.exports = steps ;
		module.exports.Steps = Steps ;
	}

	// browser
	else if(typeof window!='undefined')
	{
		return window.Steps = steps ;
	}

}) () ;