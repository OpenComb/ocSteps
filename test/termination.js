var Steps = require("../index.js") ;

describe("ocSteps",function(){

	describe("#terminate()",function(){
	
		it("using this.terminate()",function(done){
	
			var flag = 0 ;
	
			Steps(
	
				function(){
					(flag++).should.be.eql(0) ;
				}
	
				, function(){
				
					this.terminate() ;
				
					(flag++).should.be.eql(1) ;	
				}
	
				
			).on("done",function(){
				(flag++).should.be.eql(1) ;
				done() ;
			}) () ;
		})
	
	}) ;
}) ;
