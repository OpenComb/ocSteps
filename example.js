var steps = require("./index.js") ;

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
