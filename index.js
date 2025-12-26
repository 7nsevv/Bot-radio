const { TOKEN, CHANNEL, STATUS, LIVE } = require("./config.json");
const discord = require("discord.js");
const client = new discord.Client();
const ytdl = require('ytdl-core');
let broadcast = null;
let interval = null;

if (!TOKEN) {
  console.error("Veuillez me donner un token de bot valide.");
  return process.exit(1);
} else if (!CHANNEL || Number(CHANNEL) == NaN) {
  console.log("Veuillez me donner un ID de salon valide.");
  return process.exit(1);
} else if (!LIVE) {
  console.log("Veuillez me donner un URL youtube valide.");
  return process.exit(1);
}
client.on('ready', async () => {
  client.user.setActivity(STATUS || "Radio 24/7");
  let channel = client.channels.cache.get(CHANNEL) || await client.channels.fetch(CHANNEL)

  if (!channel) {
    console.error("Le salon donner dans le fichier config.json n'existe pas ou je n'y ai pas accès.");
    return process.exit(1);
  } else if (channel.type !== "voice") {
    console.error("Le salon donner dans le fichier config.json n'est pas un salon vocale.");
    return process.exit(1);
  }
  broadcast = client.voice.createBroadcast();
  // Play the radio
  stream = await ytdl(LIVE);
  stream.on('error', console.error);
  broadcast.play(stream);
  // Make interval so radio will automatically reconnect to YT every 30 minute because YT will change the raw url every 30m/1 Hour
  if (!interval) {
    interval = setInterval(async function() {
      try {
       stream = await ytdl(LIVE, { highWaterMark: 100 << 150 });
       stream.on('error', console.error);
       broadcast.play(stream);
      } catch (error) { 
        console.error(error)
      }
    }, 180000)
  }
  try {
    const connection = await channel.join();
    connection.play(broadcast);
  } catch (error) {
    console.error(error);
  }
});

setInterval(async function() {
  if(!client.voice.connections.size) {
    let channel = client.channels.cache.get(CHANNEL) || await client.channels.fetch(CHANNEL);
    if(!channel) return;
    try { 
      const connection = await channel.join();
      connection.play(broadcast);
    } catch (error) {
      console.error(error);
    }
  }
}, 20000);

client.login(TOKEN) //Login

// Anti Crash
process.on('uncaughtException', (error, origin) => {
  console.log('----- Uncaught exception -----');
  console.log(error);
  console.log('----- Exception origin -----');
  console.log(origin);
});

process.on('unhandledRejection', (reason, promise) => {
  console.log('----- Unhandled Rejection at -----');
  console.log(promise);
  console.log('----- Reason -----');
  console.log(reason);
});

process.on('warning', (name, message, stack) => {
  console.log('----- Warning -----');
  console.log(name);
  console.log('----- Message -----');
  console.log(message);
  console.log('----- Stack -----');
  console.log(stack);
});