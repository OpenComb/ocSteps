var Steps = require("../index.js") ;

describe("ocSteps",function(){

	describe("#loop()",function(){
	
		it("using loop()",function(done){
		
			var t = 0 ;
		
			Steps(
				function(){
					this.loop([0],function(i){
					
						i = this.prevReturn || i ;
					
						if(i>=5)
						{
							this.break(i) ;
						}
						
						i.should.be.eql(t++) ;
						
						return i+1 ;
					}) ;
				}
				, function(i){
					i.should.be.eql(5) ;
					t.should.be.eql(5) ;
				}
			)
			.on("done",function(){
				done() ;
			}) () ;
		}) ;
	
	
		it("在 loop step 中调用 hold()",function(done){
		
			var t = 0 ;
			var startTime = new Date() ;
		
			Steps(
				function(){
					this.loop(function(){
						if((++t)>=5)
						{
							this.break() ;
						}
						setTimeout(this.hold(),10) ;
					}) ;
				}
				, function(i){
					t.should.be.eql(5) ;
					(new Date()-startTime).should.be.above(10*4-1) ;
				}
			)
			.on("done",function(){
				done() ;
			}) () ;
		}) ;
		
		
		it("在 loop step 中插入 step",function(done){
		
			var t = 0 ;
			var t2 = 0 ;
		
			Steps(
				function(){
					this.loop(function(i){
					
						i.should.be.eql(t2++) ;
					
						if((t++)>=5)
						{
							this.break(i) ;
						}
						
						this.step(function(i){
							i.should.be.eql(t2++) ;
							return ++ i ;
						}) ;
						
						return ++i ;
					}) ;
					
					return 0 ;
				}
				, function(i){
					t.should.be.eql(6) ;
					t2.should.be.eql(11) ;
					i.should.be.eql(10) ;
				}
			)
			.on("done",function(){
				done() ;
			}) () ;
		}) ;
	}) ;
}) ;
