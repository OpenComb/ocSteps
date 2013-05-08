var events = require("events") ;


exports = module.exports = function()
{
	var steps = new exports.Steps ;
	return steps.step.apply(steps,arguments)._next() ;
}


exports.Steps = function()
{
	this._steps = [] ;
	this._stepReturn = undefined ;
	this._hold = 0 ;
	this.error = undefined ;
	this._bindo = this.do.bind(this) ;
	this.silence = false ;

	events.EventEmitter.apply(this) ;
} ;

exports.Steps.prototype = new events.EventEmitter ;

exports.Steps.prototype.step = function()
{
	for(var i=arguments.length-1;i>=0;i--)
	{
		this._steps.unshift(arguments[i]) ;
	}
	return this ;
}
exports.Steps.prototype.appendStep = function()
{
	for(var i=0;i<arguments.length;i++)
	{
		this._steps.push(arguments[i]) ;
	}
	return this ;
}

exports.Steps.prototype.fork = function(dontAutoCollectErr)
{
	this.hold() ;
	return (function(){
		this.setStepReturn(arguments,dontAutoCollectErr) ;
		this.release() ;
	}).bind(this) ;
}

exports.Steps.prototype.hold = function()
{
	this._hold ++ ;
	return this ;
}
exports.Steps.prototype.release = function()
{
	this._hold -- ;
	return this._next() ;
}

exports.Steps.prototype.setError = function(err)
{
	if( !this.silence )
	{
		console.log(err) ;
		err.stack && console.log(err.stack) ;
	}

	err.prev = this.error ;
	this.error = err ;
	return this ;
}

exports.Steps.prototype.setStepReturn = function(stepReturn,dontAutoCollectErr)
{
	if(!dontAutoCollectErr)
	{
		if( stepReturn&&stepReturn.constructor===Error )
		{
			this.setError(stepReturn) ;
		}
		else if( stepReturn && stepReturn[0] && stepReturn[0].constructor===Error )
		{
			this.setError(stepReturn[0]) ;
		}
	}
	this._stepReturn = stepReturn ;
	return this ;
}

exports.Steps.prototype.getStepReturnAsArgs = function()
{
	return (this._stepReturn===undefined||this._stepReturn.callee)?
			this._stepReturn:
			[this._stepReturn] ;
}

exports.Steps.prototype.terminate = function()
{
	throw {signal:'terminate'} ;
}

exports.Steps.prototype.do = function()
{
	if(this._hold)
	{
		return this ;
	}

	if(!this._steps.length)
	{
		this.emit("done",this.error) ;
		return this ;
	}
	
	var func = this._steps.shift() ;

	try{
		if(func.constructor===Array)
		{
			this.setStepReturn( func[0].apply(this,func[1]) ) ;
		}
		else
		{
			this.setStepReturn(
				func.apply( this, this.getStepReturnAsArgs() )
			) ;
		}
	}catch(err){
		if(err.signal&&err.signal=='terminate')
		{
			// clear steps queue
			this._steps = [] ;
		}
		else
		{
			// as step function's return
			this.setError(err) ;
			this.setStepReturn(err,true) ;
		}
	}
	
	return this._next() ;
}

exports.Steps.prototype._next = function()
{
	if( this._hold )
	{
		return ;
	}

	if( process&&process.nextTick )
	{
		process.nextTick(this._bindo) ;
	}
	else
	{
		setTimeout(this._bindo,0) ;
	}

	return this ;
}
