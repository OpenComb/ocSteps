var Steps = require("../index.js") ;

describe("ocSteps",function(){

	describe("#goto()",function(){

		it("using this.goto()",function(done){

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
						this.goto("here") ;
						(flag++).should.be.eql(3) ;
					}) ;
					this.step(function(){
						(flag++).should.be.eql(4) ;
					}) ;
				}

				, function (i){
					(flag++).should.be.eql(5) ;
				}

				, function here(i){
					(flag++).should.be.eql(3) ;
				}

			).done(function(err){
					(flag++).should.be.eql(4) ;
					done() ;
			}) () ;
		}) ;



		it("传入不存在的step function名称",function(done){

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
						this.goto("unknowStepFuncName") ;
					}) ;
					this.step(function(){
						(flag++).should.be.eql(3) ;
					}) ;
				}

				, function (i){
					(flag++).should.be.eql(2) ;
				}

			).done(function(err){
					(flag++).should.be.eql(3) ;
					err.message.should.be.eql("not found step function named unknowStepFuncName") ;
					done() ;
			}) () ;
		})
	}) ;

}) ;
