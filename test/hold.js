var Steps = require("../index.js") ;
var should = require("should") ;

function asyncFunction(ms,args,callback){
	setTimeout(function(){
		callback.apply(null,args) ;
	},ms) ;
}

describe("ocSteps",function(){

	describe("#hold()",function(){
	
		it("using this.hold()",function(done){
	
			var a ;
			
			Steps(
			
			    function(){
			       	a = new Date() ;
			        setTimeout(this.hold(),100) ;
			        setTimeout(this.hold(),200) ;
			        setTimeout(this.hold(),300) ;
			    }
			
			    , function(){
			        (new Date()-a).should.not.below(299) ;
			       	done() ;
			    }
			
			) () ;
		}) ;	
	
	
		it("using this.hold() receive named args",function(done){
				
			Steps(
				function(){
					asyncFunction(0,["1","2","3"],this.hold("a",null,"b")) ;
				}
				, function(){
					this.recv.a.should.be.eql('1') ;
					this.recv.b.should.be.eql('3') ;
				}
				
				, function(){
					asyncFunction(0,["1","2","3"],this.hold("a","b","c")) ;
				}
				
				, function(a,b,c){
						
					this.recv.a.should.be.eql('1') ;
					this.recv.b.should.be.eql('2') ;
					this.recv.c.should.be.eql('3') ;
					a.should.be.eql('1') ;
					b.should.be.eql('2') ;
					c.should.be.eql('3') ;
					
					done() ;
				}
			) () ;
			
		}) ;
		
		
		it("没有 hold() step传递数据",function(done){
		
			Steps(
			
				function(){
					return 1 ;
				}
				
				, function(data){
					data.should.be.eql(1) ;
					return 2 ;
				}
				, function(data){
					data.should.be.eql(2) ;
					return 3 ;
				}
				, function(data){
					data.should.be.eql(3) ;
					done() ;
				}
			
			) () ;
		
		}) ;
		
		it("有 hold() step传递数据",function(done){
		
			Steps(
			
				function(){
					return 1 ;
				}
				
				, function(data){
					data.should.be.eql(1) ;
					
					var release = this.hold() ;
					setTimeout(function(){
						release(1,2,3) ;
					},0) ;
					
					return 2 ;
				}
				, function(a,b,c){
					a.should.be.eql(1) ;
					b.should.be.eql(2) ;
					c.should.be.eql(3) ;
					
					var release = this.hold() ;
					setTimeout(function(){
						release(1,2,3) ;
					},0) ;
					
					var release2 = this.hold() ;
					setTimeout(function(){
						release2(4,5,6) ;
					},0) ;
					
					return 3 ;
				}
				, function(a,b,c){
					a.should.be.eql(4) ;
					b.should.be.eql(5) ;
					c.should.be.eql(6) ;
					done() ;
				}
			
			) () ;
		
		}) ;
		
		
		
		it("this.hold() 被同步release",function(done){
	
			var flag = 0 ;
			
			Steps(
			
			    function(){
			    
			    	// hold
			       	var release = this.hold() ;
			       	
			       	// 释放
			       	release(1,2,3) ;
			       	
			       	(flag++).should.be.eql(0) ;
			       	
			       	return '456' ;
			    }
			
			    , function(a,b,c){
			       	(flag++).should.be.eql(1) ;
			       	a.should.be.eql(1) ;
			       	b.should.be.eql(2) ;
			       	c.should.be.eql(3) ;
			       	this.prevReturn.should.be.eql('456') ;
			       	done() ;
			    }
			
			) () ;
		}) ;
	
		it("向 this.hold() 传入step function",function(done){

			var flag = 0 ;
			
			Steps(
			
			    function(){
			       	(flag++).should.be.eql(0) ;

			    	// hold
					asyncFunction(0,[1,2,3],this.hold(function(a,b,c){
			       		a.should.be.eql(1) ;
			       		b.should.be.eql(2) ;
			       		c.should.be.eql(3) ;
			       		(flag++).should.be.eql(2) ;
			       		return "abc" ;
			       	})) ;
			       	
			       	(flag++).should.be.eql(1) ;
			    }
			
			    , function(data){
			       	(flag++).should.be.eql(3) ;
			       	data.should.be.eql("abc") ;
			       	done() ;
			    }
			
			) () ;

		}) ;


		it("在循环中向 this.hold() 传入step function",function(done){

			var flag = 0 ;

			Steps(
			
			    function(){
			       	(flag++).should.be.eql(0) ;
			    
			    	// hold
			    	for(var i=0;i<5;i++)
			    	{
			    		(function(i){

							asyncFunction(0,[i],this.hold(function(data){
								data.should.be.eql(i) ;
			       				(flag++).should.be.eql(i+1) ;
							})) ;

			    		}).bind(this) (i) ;
			        }
			    }
			
			    , function(){
			       	(flag++).should.be.eql(6) ;
			       	done() ;
			    }
			
			) () ;

		}) ;


		it("在递归中向 this.hold() 传入step function",function(done){

			var flag = 0 ;

			Steps(
			
			    function(){
			       	(flag++).should.be.eql(0) ;
			    
			    	// hold
			    	for(var i=0;i<5;i++)
			    	{
			    		(function(i){

							asyncFunction(0,[i],this.hold(function(data){
								data.should.be.eql(i) ;
			       				(flag++).should.be.eql(1+i*2) ;

									asyncFunction(0,[1,2,3],this.hold(function(a,b,c){
										a.should.be.eql(1) ;
										b.should.be.eql(2) ;
										c.should.be.eql(3) ;
			       						(flag++).should.be.eql(1+i*2+1) ;
									})) ;

							})) ;

			    		}).bind(this) (i) ;
			        }
			    }
			
			    , function(){
			       	(flag++).should.be.eql(11) ;
			       	done() ;
			    }
			
			) () ;

		}) ;



		it("using this.holdButThrowError()",function(done){

			var flag = 0 ;
			Steps(
				function(){
					(flag++).should.be.eql(0) ;
					asyncFunction(0,[],this.holdButThrowError()) ;
				}
				, function(){
					(flag++).should.be.eql(1) ;
					asyncFunction(0,[null,1,2,3],this.holdButThrowError()) ;
				}
				, function(err,a,b,c){
					(flag++).should.be.eql(2) ;
					should.not.exist(err) ;
					a.should.be.eql(1) ;
					b.should.be.eql(2) ;
					c.should.be.eql(3) ;

					asyncFunction(0,[new Error("some error words")],this.holdButThrowError()) ;
				}

				// unreach
				, function(){
					(flag++).should.be.eql(3) ;
				}

			).done(function(err){
				err.message.should.be.eql("some error words") ;
				(flag++).should.be.eql(3) ;
				done() ;
			})
			() ;

		}) ;



		it("using this.holdButThrowError() receive named args",function(done){

			var flag = 0 ;
			Steps(
				function(){
					(flag++).should.be.eql(0) ;
					asyncFunction(0,[],this.holdButThrowError()) ;
				}
				, function(){
					asyncFunction(0,[null,1,2,3],this.hold('err1','a','b','c')) ;
					(flag++).should.be.eql(1) ;
				}
				, function(){
					asyncFunction(0,[null,4],this.holdButThrowError('err2','d')) ;
					(flag++).should.be.eql(2) ;
				}
				, function(err,d){
					should.not.exist(err) ;
					console.log(this.recv) ;
					this.recv.d.should.be.eql(4) ;
					this.recv.a.should.be.eql(1) ;
					this.recv.b.should.be.eql(2) ;
					this.recv.c.should.be.eql(3) ;

					d.should.be.eql(4) ;
					(flag++).should.be.eql(3) ;

					asyncFunction(0,[new Error("some error words")],this.holdButThrowError()) ;
				}

				// unreach
				, function(){
					(flag++).should.be.eql(4) ;
				}

			).done(function(err){
					console.log(err) ;
					console.log(err.stack) ;
					err.message.should.be.eql("some error words") ;
					(flag++).should.be.eql(4) ;
					done() ;
				})
				() ;

		}) ;

	}) ;
}) ;
