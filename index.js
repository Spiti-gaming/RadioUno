const Discord = require("discord.js");
const config = require("./config.json");
var fs = require('fs')
const client = new Discord.Client();

const queue = new Map();
const broadcast = client.voice.createBroadcast();

client.dispatcher = broadcast.play('https://listen.radioking.com/radio/169255/stream/210568');
broadcast.on('subscribe', dispatcher => {
    console.log('New broadcast subscriber!');
});
  
broadcast.on('unsubscribe', dispatcher => {
    console.log('Channel unsubscribed from broadcast :(');
});


client.once("ready", () => {
  console.log("Ready!");
  titre()
});

client.once("reconnecting", () => {
  console.log("Reconnecting!");
});

client.once("disconnect", () => {
  console.log("Disconnect!");
});

client.on("message", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(config.PREFIX)) return;


  const serverQueue = queue.get(message.guild.id);
  //console.log(serverQueue)

  if (message.content.startsWith(`${config.PREFIX}play`)) {
    execute(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${config.PREFIX}stop`)) {
    stop(message, serverQueue);
    return;
  } else {
    message.channel.send("You need to enter a valid command!");
  }
});

async function execute(message, serverQueue) {
  const args = message.content.split(" ");

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "You need to be in a voice channel to play music!"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "I need the permissions to join and speak in your voice channel!"
    );
  }

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      volume: 5,
      playing: true
    };

    queue.set(message.guild.id, queueContruct);


    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    return message.channel.send(`RadioUno Arrive`);
  }
}

function stop(message, serverQueue) {    
  serverQueue.voiceChannel.leave();
  queue.delete(message.guild.id)
}

function play(guild) {
  const serverQueue = queue.get(guild.id);

  const dispatcher = serverQueue.connection
    .play(broadcast)
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
}

function titre(){
    var timeou = 10
    download('https://www.radioking.com/widgets/api/v1/radio/169255/track/current','radiouno.json',(err)=>{
    if(err){
        console.error(err);
        return;
    }
    //console.log("telechargement du fichier json terminer");
    fs.readFile('radiouno.json', (err, data) => {
        if (err) throw err;
        let radio = JSON.parse(data);
    
    var ladate=new Date()
    client.user.setActivity(`${radio.title}`);
    timesup = radio.next_track.split('T')[1].split("+")[0].split(":");
    times = [parseInt(timesup[0])+1,ladate.getHours()];
    timesup = (((parseInt(timesup[0])+1)*3600)+(timesup[1]*60))+parseInt(timesup[2]);
    Heure = ((ladate.getHours()*3600)+(ladate.getMinutes()*60)+parseInt(ladate.getSeconds()));
    if(times[0] >= times[1]){
        timeou = timesup - Heure;
        if(timeou<=0){
            timeou = 20;
        }
    }else{ 
        timeou = timesup + (86400 - Heure);
    }
    setTimeout(function(){
        titre();
    },timeou*1000)
    });
    })
    
    
}

client.login(config.TOKEN);





var http = require('http')
var https = require('https');

function download(url,dest,cb){
    const file = fs.createWriteStream(dest);
    let httpMethod;
    if (url.indexOf(('https://')) !== -1) httpMethod = https;
    else httpMethod = http;
    const request = httpMethod.get(url, (response) =>{
        if(response.statusCode !== 200){
            return cb("Response status was "+response.statusCode);
        }
        response.pipe(file);
        file.on('finish',()=>{
            file.close(cb);
        });
    });
    request.on("error",(err)=>{
        fs.unlink(dest);
        cb(err.message);
    });
    file.on('error',(err)=>{
        fs.unlink(dest);
        cb(err.message);
    });

    
}