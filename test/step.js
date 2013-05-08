var steps = require("../index.js") ;

describe("ocSteps",function(){

	describe("#step()",function(){
		it("using this.step() one by one",function(done){
	
			var arr = [] ;
	
			steps(
	
				function(){
					arr.push(1) ;
				}
	
				, function(i){
					this.step(function(){
						arr.push(2) ;
					}) ;
					this.step(function(){
						arr.push(3) ;
					}) ;
					this.step(function(){
						arr.push(4) ;
					}) ;
				}
	
				, function(i){
					arr.push(5) ;
				}
				
			).on("done",function(){
				arr.should.have.length(5) ;
				arr.should.eql([1,4,3,2,5]) ;
				done() ;
			}) ;
		})
		
		
		
		it("passing step functions call this.step() one time",function(done){
	
			var arr = [] ;
	
			steps(
	
				function(){
					arr.push(1) ;
				}
	
				, function(i){
					this.step(
						function(){
							arr.push(2) ;
						}
						, function(){
							arr.push(3) ;
						}
						, function(){
							arr.push(4) ;
						}
					) ;
				}
	
				, function(i){
					arr.push(5) ;
				}
				
			).on("done",function(){
				arr.should.have.length(5) ;
				arr.should.eql([1,2,3,4,5]) ;
				done() ;
			}) ;
		})
	}) ;
	
	
	
	
	
	describe("#appendStep()",function(){
		it("using this.appendStep() one by one",function(done){
	
			var arr = [] ;
	
			steps(
	
				function(){
					arr.push(1) ;
				}
	
				, function(i){
					this.appendStep(function(){
						arr.push(2) ;
					}) ;
					this.appendStep(function(){
						arr.push(3) ;
					}) ;
					this.appendStep(function(){
						arr.push(4) ;
					}) ;
				}
	
				, function(i){
					arr.push(5) ;
				}
				
			).on("done",function(){
				arr.should.have.length(5) ;
				arr.should.eql([1,5,2,3,4]) ;
				done() ;
			}) ;
		})
		
		
		
		it("passing step functions call this.appendStep() one time",function(done){
	
			var arr = [] ;
	
			steps(
	
				function(){
					arr.push(1) ;
				}
	
				, function(i){
					this.appendStep(
						function(){
							arr.push(2) ;
						}
						, function(){
							arr.push(3) ;
						}
						, function(){
							arr.push(4) ;
						}
					) ;
				}
	
				, function(i){
					arr.push(5) ;
				}
				
			).on("done",function(){
				arr.should.have.length(5) ;
				arr.should.eql([1,5,2,3,4]) ;
				done() ;
			}) ;
		})
	}) ;
}) ;
