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
		})
		
		
		it("using this.hold() and pass args",function(done){
		
			var flag = 0 ;
		
			Steps(		
			    function(){
			    
					(flag++).should.be.eql(0) ;
					
			        setTimeout(this.hold(function(){
						(flag++).should.be.eql(1) ;
			        }),300) ;
			        
			        setTimeout(this.hold(
				        function(){
					        (flag++).should.be.eql(2) ;
				        }
				        , function(){
					        (flag++).should.be.eql(3) ;
				        }
			        ),200) ;
			        
			        setTimeout(this.hold(function(){
						(flag++).should.be.eql(4) ;
			        }),100) ;
			    }
			
			    , function(){
					(flag++).should.be.eql(5) ;
			    }
			
			).on('done',function(){
	
				(flag++).should.be.eql(6) ;
				
		       	done() ;
			}) () ;
		}) ;
	
	
	
	
		it("using this.hold() callback function and receive args",function(done){
	
			Steps(
				function(){
	
	
					function asyncFunction(ms,data,callback){
						setTimeout(function(){
							callback(data) ;
						},ms) ;
					}
	
					asyncFunction(100,'a',this.hold(function(data){
						data.should.be.eql('a') ;
						this.prevReturn.should.be.eql("*") ;
						
						this.recv.should.be.an.instanceOf(Array).eql([['a'],['b'],['c']]) ;
						this.recv[0].should.be.eql(['a']) ;
						this.recv[1].should.be.eql(['b']) ;
						this.recv[2].should.be.eql(['c']) ;
						this.recv[0][0].should.be.eql("a") ;
						this.recv[1][0].should.be.eql("b") ;
						this.recv[2][0].should.be.eql("c") ;
					
						return "aa" ;
					})) ;
					asyncFunction(200,'b',this.hold(function(data){
						data.should.be.eql('b') ;
						this.prevReturn.should.be.eql("aa") ;
						this.recv.should.be.an.instanceOf(Array).eql([]) ;
						return "bb" ;
					})) ;
					asyncFunction(300,'c',this.hold(function(data){
						data.should.be.eql('c') ;
						this.prevReturn.should.be.eql("bb") ;
						this.recv.should.be.an.instanceOf(Array).eql([]) ;
	
							asyncFunction(0,'d',this.hold(function(data){
								data.should.be.eql('d') ;
								this.prevReturn.should.be.eql("cc") ;
								this.recv.should.be.an.instanceOf(Array).eql([['d']]) ;
								
								return 'dd' ;
							})) ;
	
						return 'cc' ;
					})) ;
	
					return '*' ;
				}
	
				, function(arg){
					arg.should.be.eql('dd') ;
					this.prevReturn.should.be.eql("dd") ;
				}
	
			).on('done',function(){
				done() ;
			}) () ;
		}) ;
	
	
	
	
	
		it("using this.hold() callback function and receive named args",function(done){
	
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
					asyncFunction(0,["1","2","3"],this.hold("a",function(a,b,c){
						
						this.recv.a.should.be.eql('1') ;
						this.recv.b.should.be.eql('2') ;
						a.should.be.eql('1') ;
						b.should.be.eql('2') ;
						c.should.be.eql('3') ;
						
					},"b")) ;
				}
				
				, function(){
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
