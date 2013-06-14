var Steps = require("../index.js") ;
var should = require("should") ;

function asyncFunction(ms,args,callback){
	setTimeout(function(){
		callback.apply(null,args) ;
	},ms) ;
}

describe("ocSteps",function(){

	describe("#exception",function(){
		it("try and catch",function(done){
	
			var flag = 0 ;
	
			Steps(
				function(){
	
					(flag++).should.be.eql(0) ;
	
					this
					.step(function(){
						(flag++).should.be.eql(1) ;
					})
					.try(function(){
						(flag++).should.be.eql(2) ;
					})
					.step(
						function(){
							(flag++).should.be.eql(3) ;
							throw new Error("some error occured") ;
						}
						, function(){
							should.fail('unreached!') ;
						}
					)
					.catch(
						// catch body
						function(error){
							(flag++).should.be.eql(5) ;
							error.message.should.be.eql("some error occured") ;
	
						}
						// final body
						, function(){
							(flag++).should.be.eql(4) ;
						}
					) ;
				}
	
				, function(){
					(flag++).should.be.eql(6) ;
				}
			).uncatch(function(){
				should.fail('unreached!') ;
			}).done(function(){
				(flag++).should.be.eql(7) ;
				done() ;
			}) () ;
	
		}) ;
		
	
		// ----
	
	
		it("throw in try step",function(done){
	
			var flag = 0 ;
	
			Steps(
				function(){
	
					(flag++).should.be.eql(0) ;
	
					this
					.step(function(){
						(flag++).should.be.eql(1) ;
					})
					.try(function(){
						(flag++).should.be.eql(2) ;
						throw new Error("some error occured") ;
					})
					.step(
						function(){
							should.fail('unreached!') ;
						}
						, function(){
							should.fail('unreached!') ;
						}
					)
					.catch(
						// catch body
						function(error){
							(flag++).should.be.eql(4) ;
							error.message.should.be.eql("some error occured") ;
						}
						// final body
						, function(){
							(flag++).should.be.eql(3) ;
						}
					) ;
				}
	
				, function(){
					(flag++).should.be.eql(5) ;
				}
			).uncatch(function(){
				(flag++).should.be.eql(6) ;
				should.fail('unreached!') ;
			}).done(function(){
				(flag++).should.be.eql(6) ;
				done() ;
			}) () ;
		}) ;


		it("throw in hold step",function(done){

			var flag = 0 ;

			Steps(
				function(){
					(flag++).should.be.eql(0) ;
				}
				, function(){

					(flag++).should.be.eql(1) ;

					asyncFunction(100,[],this.hold(function(){
						throw new Error("hi") ;
					})) ;
				}

				, function(){
					(flag++).should.be.eql(2) ;
				}
			).uncatch(function(err){
					(flag++).should.be.eql(2) ;
					err.message.should.be.eql("hi") ;
			}).done(function(err){
				(flag++).should.be.eql(3) ;
				err.message.should.be.eql("hi") ;
				done() ;
			}) () ;
		}) ;
	
		// ----
		it("uncatch",function(done){
	
			var flag = 0 ;
	
			Steps(
				function(){
					(flag++).should.be.eql(0) ;
					throw new Error("some error occured") ;
				}
				, function(){
					should.fail('unreached!') ;				
				}
			).uncatch(function(error){
				(flag++).should.be.eql(1) ;
				error.message.should.be.eql("some error occured") ;
			}).done(function(){
				(flag++).should.be.eql(2) ;			
				done() ;
			}) () ;
		}) ;
		
		
	
		// ----
		it("catch到异常时执行final",function(done){
	
			var flag = 0 ;

			Steps(function(){
				this.try(function(){
					(flag++).should.be.eql(0) ;
					throw new Error("some error occured") ;
				})
				.catch(
					function(error){
						(flag++).should.be.eql(2) ;
						this.terminate() ;
					}
					, function(){
						(flag++).should.be.eql(1) ;				
					}
				) ;
			}).done(function(){
				(flag++).should.be.eql(3) ;
				done() ;
			}) () ;
		}) ;
		
		it("未catch到异常时执行final",function(done){
	
			var flag = 0 ;
	
			Steps(function(){
				this.try(function(){
					(flag++).should.be.eql(0) ;
				})
				.catch(
					function(error){
						should.fail('unreached!') ;					
					}
					, function(){
						(flag++).should.be.eql(1) ;				
					}
				) ;
			}).done(function(){
				(flag++).should.be.eql(2) ;
				done() ;
			}) () ;
		}) ;
		
		it("在catch中抛出异常",function(done){
	
			var flag = 0 ;
	
			Steps(function(){
			
				this.try() ;
			
					this.try(function(){
						(flag++).should.be.eql(0) ;
						throw new Error("some error occured") ;
					})
					.catch(
						function(error){
							throw error ;				
						}
						, function(){
							(flag++).should.be.eql(1) ;				
						}
					) ;
				
				this.catch(
					function(error){
						(flag++).should.be.eql(3) ;		
					}
					, function(){
						(flag++).should.be.eql(2) ;				
					}
				) ;
				
			}).done(function(){
				(flag++).should.be.eql(4) ;
				done() ;
			}) () ;
		}) ;
		
		
		it("两个catch区段之间抛出异常引发uncatch",function(done){
	
			var flag = 0 ;
	
			Steps(function(){
			
				this.try(function(){
					(flag++).should.be.eql(0) ;				
				}) ;
				this.catch(
					function(error){
						should.fail('unreached!') ;			
					}
					, function(){
						(flag++).should.be.eql(1) ;				
					}
				) ;
			
				
				this.step(function(){
					throw new Error("some error occured") ;
				}) ;
				
				
				this.try(function(){
					should.fail('unreached!') ;			
				}) ;
				this.catch(
					function(error){
						should.fail('unreached!') ;			
					}
					, function(){
						should.fail('unreached!') ;			
					}
				) ;
				
			}).uncatch(function(){
				(flag++).should.be.eql(2) ;
				done() ;
			}) () ;
		}) ;
		
		it("throw() 抛出异常",function(done){


			var flag = 0 ;
			Steps(function(){
			
				this.step(
					function(error){	
						(flag++).should.be.eql(0) ;
					}
					, function(){
						(flag++).should.be.eql(1) ;
						this.throw( new Error(flag) ) ;
					}
					, function(error){
						should.fail('unreached!') ;
						(flag++).should.be.eql(2) ;	
					}
					, function(error){
						should.fail('unreached!') ;	
						(flag++).should.be.eql(3) ;
					}
				) ;
			
				this.catch(
					function(error){
						(flag++).should.be.eql(2) ;
					}
				) ;
				
			}).uncatch(function(){
				done() ;
			}) () ;


		}) ;
	}) ;
}) ;
