var Steps = require("../index.js") ;

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
	
			function asyncFunction(ms,args,callback){
				setTimeout(function(){
					callback.apply(null,args) ;
				},ms) ;
			}
			
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
	
	}) ;
}) ;
