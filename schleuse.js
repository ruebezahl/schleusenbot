/* This program is free software. It comes without any warranty, to
 * the extent permitted by applicable law. You can redistribute it
 * and/or modify it under the terms of the Do What The Fuck You Want
 * To Public License, Version 2, as published by Sam Hocevar. See
 * http://sam.zoy.org/wtfpl/COPYING for more details. */

var dgram = require("dgram");
var net = require("net");
var http = require("http");
var udplistener = dgram.createSocket("udp4");

// load and instanciate the ircbot
var ircbot = require("./ircbot");
var bot = new ircbot.Bot("space.blafasel.de",6667,"#ccc","schleuse");

// some ugly globals
var doorstate = null;
var ringCounter = 0;
var lastSchlaubergerDate = null;
var lastRingDate = null;
var doorstate_open   = "hq auf";
var doorstate_closed = "hq zu ";


// schleusen eventlistener
//
// the schleuse emits its current status via UDP Broadcasts
// protocol: p == open ; n == closed ; b == door ringing; D == door unlock?
udplistener.on("message",function(msg, rinfo) {
  
    // check remote ip 
    // yes, this is vulnerable to ip spoofing, but a) better than nothing and b) it's fun
    // compromising the guy on the net, who doesn't even manage to spoof an ip, publicly :-)
    if (rinfo.address != "83.133.178.68" || rinfo.port != "2080"){
        if ( (new Date().getTime() - lastSchlaubergerDate) > 600000){
            lastSchlaubergerDate = new Date().getTime();
            bot.say("irgendein schlauberger (von "+rinfo.address + ":" + rinfo.port +
                    ") versucht gerade den tuerstatus zu manipulieren...");
        }
        return;
    }

    // doorbell event
    if (msg == "b" || msg == "B"){
        ringCounter++;

        if ( ((new Date().getTime() - lastRingDate) > 60000) && (doorstate == doorstate_closed)  ){
            lastRingDate = new Date().getTime();
            bot.notice("jemand klingelt an der haustuer.");
		}
        return;
    }
     
    // doorstate events
    if (msg == "p") {
        doorstate=doorstate_open;
    }else if (msg =="n") {
        doorstate=doorstate_closed;
    }else{
        console.log("received undefined doorstate: "+msg);
    }

    // check current topic and adjust if it doesn't fit to the current doorstate
    channelstate = bot.getTopic().match(/(hq\s.*?)\s*\|/g);
    if (channelstate != null && channelstate[0] != doorstate + " |"){
        bot.setTopic(bot.getTopic().replace(/hq.*?\|/g, doorstate + " |"));
    }

});

// start up the udp-listener for schleusen-events on port 
// and log some startup information
udplistener.on("listening",function(){
    var address = udplistener.address();
    console.log("udp listener running on "+ address.address + ":" + address.port);
});
udplistener.bind(2080);

// connect ircbot to channel
bot.connect();

// http-server
// access via http GET
http.createServer(function (req, res){
	res.writeHead(200, {
		'Content-Type': 'text/plain',
		'Cache-Control' : 'max-age=0, no-cache, no-store, must-revalidate',
                'Pragma' : 'no-cache'
	});

	res.end(doorstate + "\n");
}).listen(8080)

// tcp server
// most simple acces, just connect a tcp socket. 
// Status will be written to it and the connection closed
//
// Example usage:
// nc6 $HOST 8001
net.createServer( function(c){
	c.end(doorstate + "\n")
} ).listen(8001)

