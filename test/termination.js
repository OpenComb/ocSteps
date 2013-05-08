var steps = require("../index.js") ;

describe("ocSteps",function(){

	it("using this.terminate()",function(done){

		var arr = [] ;

		steps(

			function(){
				arr.push(1) ;
			}

			, function(){
			
				this.terminate() ;
			
				arr.push(2) ;
			}

			
		).on("done",function(){
			arr.should.have.length(1) ;
			arr.should.eql([1]) ;
			arr.should.not.include(2) ;
			done() ;
		}) ;
	})

}) ;