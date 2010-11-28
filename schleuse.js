// udp listener

var dgram = require("dgram");
var v4server = dgram.createSocket("udp4");
var ircbot = require("./ircbot");
var bot = new ircbot.Bot("space.blafasel.de",6667,"#ccc","schleuse");
var doorstate = null;
var lastRingDate = null;
var lastSchlaubergerDate = null;

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
        
        if ( (new Date().getTime() - lastRingDate) > 60000){
            lastRingDate = new Date().getTime();
            bot.say("es klingelt an der haustuere (das ist die unten)!");
        }
        return;
    }
    
    
    if (msg == "p") {
        doorstate="hq open  ";
    }else if (msg =="n") {
        doorstate="hq closed";
    }else{
        doorstate="hq undefined";
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

v4server.bind(2080);
bot.connect();


