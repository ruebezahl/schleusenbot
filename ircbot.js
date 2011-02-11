var sys = require("sys");
var irc = require("./irc.lib.js");
var ircbot = exports;

var self = null;

var Bot = ircbot.Bot = function(host, port,chn,nickname){
    this.client = new irc.Client(host,port);
    this.channel = chn;
    this.nick = nickname;
    self = this;
}
sys.inherits(Bot, process.EventEmitter);


Bot.prototype.connect = function(){
    this.client.connect(self.nick, self.nick, self.nick);

    this.client.addListener('001', function(){
        this.send("JOIN", self.channel);
        self.client.send("TOPIC",self.channel,"");  // fire a 322 event and resolve the topic 
    });

    this.client.addListener('331', function(server,prefix,to,topic){
        self.currentTopic = topic;
    });
    this.client.addListener('332', function(server,prefix,to,topic){
        self.currentTopic = topic;
    });

    this.client.addListener('TOPIC', function (server, prefix, topic){
        self.currentTopic= topic;
    });

    this.client.addListener('PRIVMSG', function(prefix, to, text) {
    });

    // when the DISCONNECT event is emitted by the client, somehow the
    // connection was dropped (timeout, eof) see client.disconnect
	this.client.addListener('DISCONNECT', function(why){
		console.log('disconnected because of '+ why +', trying reconnect');
		this.client.connect(self.nick, self.nick, self.nick);
	};
}


Bot.prototype.joinChannel = function(channelname){
    this.client.send('JOIN', channelname);
}

Bot.prototype.getTopic = function() {
    return self.currentTopic;
};

Bot.prototype.setTopic = function(newTopic){
    this.client.send("TOPIC",this.channel,":"+newTopic);
}

Bot.prototype.say = function(message){
    this.client.send("PRIVMSG",this.channel,":"+message);
}

Bot.prototype.notice = function(message){
    this.client.send("NOTICE",this.channel,":"+message);
}
