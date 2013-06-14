var Steps = require("../index.js") ;

describe("ocSteps",function(){

	describe("#step()",function(){
	
		it("using this.step() one by one",function(done){

			var flag = 0 ;

			Steps(
	
				function(){
					(flag++).should.be.eql(0) ;
				}
	
				, function(i){
					this.step(function(){
						(flag++).should.be.eql(1) ;
					}) ;
					this.step(function(){
						(flag++).should.be.eql(2) ;
					}) ;
					this.step(function(){
						(flag++).should.be.eql(3) ;
					}) ;
				}
	
				, function(i){
					(flag++).should.be.eql(4) ;
				}
				
			).done(function(){
				(flag++).should.be.eql(5) ;
				done() ;
			}) () ;
		}) ;
		
		
		
		it("passing step functions call this.step() one time",function(done){

			var flag = 0 ;
	
			Steps(
	
				function(){
					(flag++).should.be.eql(0) ;
					return flag ;
				}
	
				, function(data){
				
					data.should.be.eql(1) ;
					this.prevReturn.should.be.eql(1) ;
					(flag++).should.be.eql(1) ;
							
					this.step(
						function(data){
							data.should.be.eql(2) ;
							this.prevReturn.should.be.eql(2) ;
							(flag++).should.be.eql(2) ;
							return flag
						}
						, function(data){
							data.should.be.eql(3) ;
							this.prevReturn.should.be.eql(3) ;
							(flag++).should.be.eql(3) ;
							return flag
						}
						, function(data){
							data.should.be.eql(4) ;
							this.prevReturn.should.be.eql(4) ;
							(flag++).should.be.eql(4) ;
							return flag
						}
					) ;
					
					
					return flag
				}
	
				, function(data){
					data.should.be.eql(5) ;
					this.prevReturn.should.be.eql(5) ;
					(flag++).should.be.eql(5) ;
					return flag
				}
				
			).done(function(){
				(flag++).should.be.eql(6) ;
				done() ;
			}) () ;
		})
	}) ;
	
	
	
	
	
	describe("#appendStep()",function(){
		it("using this.appendStep() one by one",function(done){
	
			var flag = 0 ;
	
			Steps(
	
				function(){
					(flag++).should.be.eql(0) ;
				}
	
				, function(i){
					this.appendStep(function(){
						(flag++).should.be.eql(2) ;
					}) ;
					this.appendStep(function(){
						(flag++).should.be.eql(3) ;
					}) ;
					this.appendStep(function(){
						(flag++).should.be.eql(4) ;
					}) ;
				}
	
				, function(i){
					(flag++).should.be.eql(1) ;
				}
				
			).done(function(){
					(flag++).should.be.eql(5) ;
				done() ;
			}) () ;
		})
		
		
		
		it("passing step functions call this.appendStep() one time",function(done){
	
			var flag = 0 ;
	
			Steps(
	
				function(){
					(flag++).should.be.eql(0) ;
				}
	
				, function(i){
					this.appendStep(
						function(){
							(flag++).should.be.eql(2) ;
						}
						, function(){
							(flag++).should.be.eql(3) ;
						}
						, function(){
							(flag++).should.be.eql(4) ;
						}
					) ;
				}
	
				, function(i){
					(flag++).should.be.eql(1) ;
				}
				
			).done(function(){
				(flag++).should.be.eql(5) ;
				done() ;
			}) () ;
		}) ;
		
		
		
		it("绑定参数",function(done){

			var flag = 0 ;

			Steps(
	
				[1,2,3], function(a,b,c){
					
					a.should.be.eql(1) ;
					b.should.be.eql(2) ;
					c.should.be.eql(3) ;
					
					(flag++).should.be.eql(0) ;
				}
	
				, function(){
					this.step(function(){
						(flag++).should.be.eql(1) ;
					}) ;
					this.step(function(){
						(flag++).should.be.eql(2) ;
					}) ;
					this.step(function(){
						(flag++).should.be.eql(3) ;
						
						return 789 ;
					}) ;
				}
	
				, [4,5,6], function(a,b,c){
				
					a.should.be.eql(4) ;
					b.should.be.eql(5) ;
					c.should.be.eql(6) ;
					
					this.prevReturn.should.be.eql(789) ;
					
					(flag++).should.be.eql(4) ;
				}
				
			).done(function(){
				(flag++).should.be.eql(5) ;
				done() ;
			}) () ;
		}) ;
		
		
		it("启动参数",function(done){
		
			Steps(
	
				function(i){
					i.should.be.eql(0) ;
					return i + 1 ;
				}
	
				, function(i){
					i.should.be.eql(1) ;
					return i + 1 ;
				}
	
				, function(i){
					i.should.be.eql(2) ;
					return i+1 ;
				}
				
			).done(function(){
				this.prev.return.should.be.eql(3) ;
				done() ;
			}) (0) ;
		}) ;
		
	}) ;
}) ;
