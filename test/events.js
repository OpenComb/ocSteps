var steps = require("../index.js") ;

describe("ocSteps",function(){

	it("using event: \"done\"",function(done){

		var arr = [] ;

		steps(

			function(){
				var i = 1 ;
				arr.push(i) ;
				return ++i ;
			}

			, function(i){
				arr.push(i) ;
				return ++i ;
			}

			, function(i){
				arr.push(i) ;
				return ++i ;
			}
			
		).on("done",function(){
			arr.should.have.length(3) ;
			arr.should.eql([1,2,3]) ;
			done() ;
		}) ;
	})

}) ;
