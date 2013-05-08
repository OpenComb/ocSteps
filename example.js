var steps = require("./index.js") ;
var fs = require("fs") ;



//steps(
//
//	function(){
//		fs.exists("/some/file/path",this.fork()) ;
//	}
//
//	, function(exists){
//		console.log("fs.exists() return: "+exists) ;
//	}
//
//) ;




steps(

	function(){

		console.log("insert 3 step functions one time: ") ;

		// 一次向任务链插入多个step函数
		this.step(
			function(){
				console.log("a") ;
			}
			, function(){
				console.log("b") ;
			}
			, function(){
				console.log("c") ;
			}
		) ;
	}

	, function(){

		console.log("insert 3 step functions one by one: ") ;

		// 陆续向任务链插入函数
		this.step(function(){
			console.log("1") ;
		}) ;
		this.step(function(){
			console.log("2") ;
		}) ;
		this.step(function(){
			console.log("3") ;
		}) ;
	}

) ;



//
//steps(
//
//	function(){
//		console.log( new Date() ) ;
//		setTimeout(this.fork(),1000) ;
//		setTimeout(this.fork(),2000) ;
//		setTimeout(this.fork(),3000) ;
//	}
//
//	, function(){
//		console.log( new Date() ) ;
//	}
//
//) ;