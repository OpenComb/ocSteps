var steps = require("../index.js") ;

describe("ocSteps",function(){

	it("run simple sync steps",function(done){

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

			, function(i)
			{
				i.should.equal(4) ;
				arr.should.have.length(3) ;
				arr.should.eql([1,2,3]) ;
				done() ;
			}
		) ;
	})

}) ;
