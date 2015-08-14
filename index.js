module.exports = require('./lib/proxy');

//
//var request = require('request');
//
//
//function get(url) {    
//    var r = request({url : url});
//
//    r.on('response',function( response) {
//        it.next(response.statusCode);
//        //console.log(response.statusCode);
//        //r.pipe(process.stdout);
//    });
//
//    //r.on('error', onResponse.bind(null));
//
//    r.on('end', function() {
//        console.log('end');
//    });
//}
//
//function *main() {
//    var code = yield get('https://raw.githubusercontent.com/getify/asynquence/master/.gitignore');
//    console.log("===" + code);
//    
//    
//}
//
//var it = main();
//it.next();
