var Steps = require("./index.js") ;
var fs = require("fs") ;



Steps(

    function(){
		console.log("step 1") ;  
        return new Error("As step function's return") ;
    }
    ,  function(){

		console.log("step 2") ;
        function someAsyncOperation(callback)
        {
            setTimeout(function(){
                callback( new Error("As first arg of callback") ) ;
            },0) ;
        }

        someAsyncOperation( this.fork() ) ;
    }
	,  function(){
		console.log("step 3") ;
		throw {error:"As a exception object"} ;
	}

).on("done",function(lastError){
    
    
}).silence = true ;

