var Steps = require("../index.js") ;
var should = require("should") ;

describe("ocSteps",function(){

	describe("#fork()",function(){
	
		it("using fork()",function(done){
			var flag = 0 ;
			Steps(
	
				function(){
					(flag++).should.be.eql(0) ;
					var i = 0 ;
					return i+1 ;
				}
	
				, function(i){
					(flag++).should.be.eql(1) ;
					i.should.be.eql(1) ;
					
					this.fork(
						function(i){
							(flag++).should.be.eql(2) ;
							i.should.be.eql(2) ;
							return i+1 ;
						}
						, function(i){
							(flag++).should.be.eql(3) ;
							i.should.be.eql(3) ;
							return i+1 ;
						}
					).catch(function(){
						should.fail('unreached!') ;
					}) ;
					
					return i+1 ;
				}
	
				, function(i){
					(flag++).should.be.eql(4) ;
					i.should.be.eql(4) ;
				}
				
			).on("done",function(){
				(flag++).should.be.eql(5) ;
				done() ;
			}) ;
		})



		it("catch fork 中的异常",function(done){
			var flag = 0 ;
			Steps(

				function(i){

					var i = 0 ;
					(flag++).should.be.eql(0) ;


					this.try(function(i){
						(flag++).should.be.eql(1) ;
						i.should.be.eql(1) ;
						return i+1 ;
					}) ;

					this.fork(
						function(i){
							(flag++).should.be.eql(2) ;
							i.should.be.eql(2) ;
							throw new Error(i) ;
							return i+1 ;
						}
					) ;

					this.catch(function(err){
						(flag++).should.be.eql(3) ;
						err.message.should.be.eql('2') ;
					}) ;

					return i+1 ;
				}

				, function(i){
					(flag++).should.be.eql(4) ;
					should.strictEqual(undefined,i) ;
				}

			).on("done",function(){
					(flag++).should.be.eql(5) ;
					done() ;
				}) ;
		})
	}) ;
}) ;
