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
			.done(function(){
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
			.done(function(){
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
			.done(function(){
				done() ;
			}) () ;
		}) ;




        it("using each() for array",function(done){

            var array = ['a','b','c','d'] ;
            var flag = 0 ;

            Steps(
                function(){
                    this.each(array,function(i,v){
                        array[i].should.be.eql(v) ;
                        (flag++).should.be.eql( i ) ;
                    }) ;
                }
                , function(){
                    (flag++).should.be.eql(4) ;
                }
            )
                .done(function(){
                    (flag++).should.be.eql(5) ;
                    done() ;
                }) () ;
        }) ;


        it("using each() for object",function(done){

            var obj = { a:0,b:1,c:2,d:3 } ;
            var flag = 0 ;

            Steps(
                function(){
                    this.each(obj,function(k,v){
                        obj[k].should.be.eql(v) ;
                        (flag++).should.be.eql( v ) ;
                    }) ;
                }
                , function(){
                    (flag++).should.be.eql(4) ;
                }
            )
                .done(function(){
                    (flag++).should.be.eql(5) ;
                    done() ;
                }) () ;
        }) ;


	}) ;
}) ;
