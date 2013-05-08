var steps = require("../index.js") ;

describe("ocSteps",function(){

	it("using this.fork()",function(done){

		var a ;
		
		steps(
		
		    function(){
		       	a = new Date() ;
		        setTimeout(this.fork(),100) ;
		        setTimeout(this.fork(),200) ;
		        setTimeout(this.fork(),300) ;
		    }
		
		    , function(){
		        (new Date()-a).should.not.below(299) ;
		       	done() ;
		    }
		
		) ;
	})
	
	

}) ;
