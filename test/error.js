var steps = require("../index.js") ;

describe("ocSteps",function(){

	it("auto collecting error and exception",function(done){

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
		    
		    lastError.should.be.a("object") ;
		    lastError.should.have.property("error","As a exception object") ;
		    lastError.should.have.property("prev") ;
		    
		    lastError.prev.should.be.an.instanceOf(Error) ;
		    lastError.prev.should.have.property("message","As first arg of callback") ;
		    lastError.prev.should.have.property("prev") ;
		    
		    lastError.prev.prev.should.be.an.instanceOf(Error) ;
		    lastError.prev.prev.should.have.property("message","As step function's return") ;
		    lastError.prev.prev.should.not.have.property("prev") ;
		    
		    done() ;
		    
		}).silence = true ;
		
		
	})
	
	

}) ;
