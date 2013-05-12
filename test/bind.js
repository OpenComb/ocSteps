var Steps = require("../index.js") ;

describe("ocSteps",function(){

	describe("#bind()",function(){
	
		it("using bind()",function(done){
	
			object = {
				a: 123
				, b: 456
			}
	
			Steps(
				function(){
					this.a.should.be.eql(123) ;
					return '789' ;
				}
				, function(c){
					this.b.should.be.eql(456) ;
					this.b = '098' ;			// 绑定是只读的
					c.should.be.eql('789') ;
				}			)
			.on("done",function(){
				// 绑定是只读的
				object.b.should.be.eql(456) ;
				done() ;
			})
			.bind(object) () ;
		})
	
	}) ;
}) ;
