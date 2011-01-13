// udp listener

var dgram = require("dgram");
var http = require("http");
var v4server = dgram.createSocket("udp4");
var ircbot = require("./ircbot");
var bot = new ircbot.Bot("space.blafasel.de",6667,"#ccc","schleuse");
var doorstate = null;
var lastRingDate = null;
var lastSchlaubergerDate = null;

var doorstate_open   = "hq open   ";
var doorstate_closed = "hq closed ";

// listen for schleusen-events
v4server.on("message",function(msg, rinfo) {
  
    // check remote ip 
    if (rinfo.address != "83.133.178.68" || rinfo.port != "2080"){
        if ( (new Date().getTime() - lastSchlaubergerDate) > 600000){
            lastSchlaubergerDate = new Date().getTime();
            bot.say("irgendein schlauberger (von "+rinfo.address + ":" + rinfo.port +") versucht gerade den tuerstatus zu manipulieren...");
        }
        return;
    }

    if (msg == "b" || msg == "B"){
        
        if ( ((new Date().getTime() - lastRingDate) > 60000) && (doorstate == doorstate_closed)  ){
            lastRingDate = new Date().getTime();
            bot.notice("jemand klingelt an der haustuer.");
        }
        return;
    }
    
    
    if (msg == "p") {
        doorstate=doorstate_open;
    }else if (msg =="n") {
        doorstate=doorstate_closed;
    }else{
        console.log("received undefined doorstate: "+msg);
    }

    channelstate = bot.getTopic().match(/(hq\s.*?)\s*\|/g);
    if (channelstate != null && channelstate[0] != doorstate + " |"){
        bot.setTopic(bot.getTopic().replace(/hq.*?\|/g, doorstate + " |"));
    }

});

v4server.on("listening",function(){
    var address = v4server.address();
    console.log("server listening "+ address.address + ":" + address.port);
});

// listen for schleusen events
v4server.bind(2080);

// connect to channel
bot.connect();

// http-server
http.createServer(function (req, res){
	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.end(doorstate + "\n");
}).listen(80,"127.0.0.1")





