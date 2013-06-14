(function(){
	function Steps(){
		var steps = function(){
			arguments.length && ( steps._startupArgs = arguments ) ;
			steps._doOnNextTick() ;
			return steps ;
		} ;
		// 构造对象
		steps._steps = [] ;
		steps._trylevel = 0 ;
		steps.uncatchException = undefined ;
		steps.prevReturn = undefined ;
		steps.recv = [] ;
		steps._events = { 'start':[], 'uncatch': [], 'done': [] }
		steps._seek = 0 ;
		steps._insertPos = 0 ;
		steps.current = undefined ;
		steps.prev = undefined ;
		steps._tickid = 0 ;
		steps._startupArgs ;
		steps.object = undefined ;

		steps.__once = function(eventName,func){
			func &&  steps._events[eventName] &&  steps._events[eventName].push(func) ;
			return steps ;
		}
		steps.done = function(func){ steps.__once("done",func) ; return steps ;}
		steps.uncatch = function(func){ steps.__once("uncatch",func) ; return steps ;}
		steps.__emit = function(eventName){
			var args = [] ;
			for( var i=1;i<arguments.length;i++ ) args.push(arguments[i]) ;
			if(  steps._events[eventName] &&  steps._events[eventName].length )
				for(var handle;handle=steps._events[eventName].shift();)
                    handle.apply(steps.object||steps,args) ;
			return steps ;
		}
		steps.bind = function(object){
			steps.__proto__ = object.__proto__ ;
			object.__proto__ = steps ;
			steps.object = object ;
			return steps ;
		}

		steps.try = function(){
			steps._trylevel ++ ;
			return steps.step.apply(steps,arguments) ;
		}
		steps.catch = function(body,final){
			steps._steps.splice(steps._insertPos++,0,{
				func: body
				, finalBody: final
				, isCatchBody: true
				, trylevel:  steps._trylevel --
				, name: body.name
			}) ;
			return steps ;
		}
		steps._eachSteps = function(args,func){
			for(var i=0;i<args.length;i++){
				if(args[i] && args[i].constructor==Array)
					var presetArgs = args[i++] ;
                
				func.call(steps,i,{
					func: args[i]
					, presetArgs: presetArgs
					, trylevel:  steps._trylevel
					, name: args[i].name
				}) ;
			}
			return steps ;
		}
		steps.step = function(){
			return steps._eachSteps(arguments,function(i,step){
				steps._steps.splice(steps._insertPos++,0,step) ;
			}) ;
		}
		steps.appendStep = function(){
			return steps._eachSteps(arguments,function(i,step){
				steps._steps.push(step) ;
			}) ;
		}
		steps.hold = function(){
			var step = steps.current ;

			step.recv || (step.recv=[]) ;
			var holdIndex = step.recv.length ;

			var names = [], arrsteps = [] ;
			for(var i=0;i<arguments.length;i++)
				(typeof arguments[i]=='function'? arrsteps: names).push(arguments[i]) ;

			steps._eachSteps(arrsteps,function(i,_step){
				steps._steps.splice(steps._insertPos++,0,_step) ;
                arrsteps[i] = _step ;
			}) ;

			step._holdsCounter || (step._holdsCounter=0) ;
			step._holdsCounter ++ ;

			var callbacked = false ;
			return (function(){
				// 只调用一次有效
				if(callbacked) return ;
				callbacked = true ;

				// 搜集到 recv 里
				step.recv[holdIndex] = arguments ;
				for(var i=0;i<names.length;i++){
					names[i] && (step.recv[names[i].toString()] = arguments[i]) ;
				}

				// 设置 step 的 presetArgs 参数
				for(var i=0;i<arrsteps.length;i++)
                    arrsteps[i].presetArgs = step.recv[holdIndex] ;

				(--step._holdsCounter)<1 && steps._doOnNextTick() ;

			}).bind(steps) ;
		}
		steps.holdButThrowError = function(){
			return this.hold(function(err){
				if(err) throw err ;
				return arguments ;
			}) ;
		}

		steps.rewind = function(){  steps._seek = 0 ; steps._doOnNextTick() }
		steps.terminate = function(){ throw {signal:'terminate'} ; }
		steps.break = function(){
			steps.current.return = arguments ;
			throw { signal: 'break' } ;
		}
		steps._makesureStepArgs = function(presetArgs){
			if(presetArgs) return presetArgs ;
			if(steps._startupArgs){
				var startupArgs =  steps._startupArgs ;
				steps._startupArgs = undefined ;
				return startupArgs ;
			}
			if(!steps.prev) return ;
			return ( steps.prev.recv && steps.prev.recv[steps.prev.recv.length-1] )
					|| ( (steps.prev.return&&steps.prev.return.callee)? steps.prev.return: [steps.prev.return] ) ;
		}
		steps.do = function(tickid){
			// 暂停
			if(!steps.uncatchException && steps.current && steps.current._holdsCounter)
				return steps ;

			if(tickid!=steps._tickid)
				return ;
			if( (steps._tickid++) == 0 )
				steps.__emit('start') ;

			// 设置 prev 状态
			if(steps.current && !steps.current.isCatchBody){
				steps.prev = steps.current ;
				steps.prevReturn = steps.prev.return ;
				steps.recv = steps.prev.recv ;
			}

			// 整个任务链结束
			if(steps._seek>=steps._steps.length){
				// 处理 uncatch 异常
				if( steps.uncatchException ){
					if(  steps._events['uncatch'].length )
						steps.__emit("uncatch",steps.uncatchException) ;
				}
				// done 事件
				steps.__emit("done",steps.uncatchException||null) ;
				// 停止
				return steps ;
			}

			// 重置状态
			steps.current =  steps._steps[steps._seek] ;
			steps._insertPos =  steps._seek + (steps.current.block? 0: 1) ;
			steps._trylevel = steps.current.trylevel ;

            if(!steps.current.func.apply)
            {
                console.log( steps.current.func)
            }
			try{
				if( steps.current.isCatchBody ){
					if(steps.current.finalBody)
						steps.current.finalBody.call( steps ) ;

					if(steps.uncatchException){
						var uncatchException = steps.uncatchException ;
						steps.uncatchException = undefined ;

						steps.current.func.call( steps.object||steps, uncatchException ) ;
					}
				}
				else
					steps.current.return = steps.current.func.apply( steps.object||steps, steps._makesureStepArgs(steps.current.presetArgs) ) ;

				if( !steps.current.block )
					steps._seek ++ ;

			}catch(err){

				if(err.signal){
					if(err.signal=='break')
						steps._seek ++ ;
					else if(err.signal=='terminate')
						steps._seek =  steps._steps.length ;
				}
				else
					steps.throw(err) ;
			}

			return steps._doOnNextTick() ;
		}
		steps.throw = function(err){
			// 跳过同 trylevel 下的后续 step
			for(  steps._seek ++;  steps._seek<steps._steps.length;  steps._seek ++ )
				if(  steps._steps[steps._seek].isCatchBody &&  steps._steps[steps._seek].trylevel<=steps.current.trylevel )
					break ;
			steps.uncatchException = steps.current.exception = err ;
		}
		steps._doOnNextTick = function(){
			var tickid =  steps._tickid ;
			process&&process.nextTick?
				process.nextTick(function(){ steps.do(tickid) }) :
				setTimeout(function(){ steps.do(tickid) },0) ;

			return steps ;
		}
		steps.fork = function(){
			var fork = Steps.apply(null,arguments), master=steps ;

            master.step(function(){
				// 传递参数
				fork._steps[0] && (!fork._steps[0].presetArgs) && (fork._steps[0].presetArgs=arguments) ;
				var forkreturn ;
				fork.appendStep( function __forktail__(){
					forkreturn = arguments ;
				} ) ;
				// 执行
				var release = master.hold() ;
				fork.__once("done",function(){
					release.apply(master,forkreturn) ;
				}).__once("uncatch",function(error){
					master.uncatchException = error ;
				}) () ;
			}) ;

			return fork ;
		}
		steps.loop = function(){
			return steps._eachSteps(arguments,function(i,step){
				step.block = true ;
				 steps._steps.splice(steps._insertPos++,0,step) ;
			}) ;
		}
		steps.each = function(arr,step){
			if(arr.constructor==Array)
				for(var i=0;i<arr.length;i++)
					steps.step([i,arr[i]],step) ;
			else
				for(var key in arr)
					steps.step([key,arr[key]],step) ;
            return this ;
		}

		steps.step.apply(steps,arguments) ;
		return steps ;
	}

    // 导出 -------------------
	//  node.js
	if(typeof module!='undefined' && typeof exports!='undefined' && module.exports)
		module.exports = Steps ;
	//  browser
	else if(typeof window!='undefined')
		return window.Steps = Steps ;
}) () ;