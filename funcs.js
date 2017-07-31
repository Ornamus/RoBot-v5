const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./servers.sqlite');
const fs = require("fs");
const unirest = require("unirest");
var afkJson = fs.readFileSync("./afk.json"),
	afk = JSON.parse(afkJson),
	channel = null,
	stdin = process.openStdin();

module.exports = (bot) => {
	//Work on making this send real guild size
	bot.sendServerCount = function () {
		unirest.post("https://bots.discordlist.net/api")
			.send({ "token": config.dlist, "servers": bot.guilds.size })
			.end(function (response) {
				bot.log(response.body);
			});

		unirest.post("https://bots.discord.pw/api/bots/" + bot.user.id + "/stats")
			.headers({ 'Authorization': config.dbotspw, 'Content-Type': 'application/json' })
			.send({ "server_count": bot.guilds.size })
			.end(function (response) {
				bot.log(response.body);
			});

		unirest.post("https://discordbots.org/api/bots/" + bot.user.id + "/stats")
			.headers({ 'Authorization': config.dbotsorg, 'Content-Type': 'application/json' })
			.send({ "server_count": bot.guilds.size })
			.end(function (response) {
				bot.log(response.body);
			});

		bot.log("All server counts posted successfully!");
	}

	bot.syncServers = function () {
		db.serialize(function () {
			db.run(`CREATE TABLE IF NOT EXISTS servers (
				id VARCHAR(25) PRIMARY KEY, 
				name VARCHAR(100), 
				prefix VARCHAR(10), 
				announcementChannel VARCHAR(25), 
				welcomeMessagesEnabled BOOLEAN, 
				welcomeMessage VARCHAR(200), 
				leaveMessagesEnabled BOOLEAN, 
				leaveMessage VARCHAR(200),
				banMessagesEnabled BOOLEAN,
				banMessage VARCHAR(200),
				joinRole VARCHAR(20),
				joinBotRole VARCHAR(20), 
				noInviteLinks BOOLEAN,
				noMentionSpam BOOLEAN)`
			);
			bot.guilds.forEach(guild => {
				db.run(`INSERT OR IGNORE INTO servers VALUES (
					"${guild.id}", 
					"${guild.name}", 
					"${bot.config.prefix}", 
					"${guild.defaultChannel.id}", 
					0, 
					"Welcome {user} to the server!", 
					0, 
					"{user} left the server :cry:",
					0,
					"{user} was banned from the server :hammer:", 
					"none", 
					"none", 
					0,
					0)`
				);
			});
		});
		bot.log("Servers synced.")
	}

	bot.removeServer = function (guild) {
		db.run(`DELETE FROM servers WHERE id = ${guild.id}`);
		bot.log(guild.name + " successfully removed from the database!");
	}

	bot.addServer = function (guild) {
		db.run(`INSERT OR IGNORE INTO servers VALUES (
			"${guild.id}", 
			"${guild.name}", 
			"${bot.config.prefix}", 
			"${guild.defaultChannel.id}", 
			0, 
			"Welcome {user} to the server!", 
			0, 
			"{user} left the server :cry:",
			0,
			"{user} was banned from the server :hammer:", 
			"none", 
			"none", 
			0,
			0)`
		);
		bot.log(guild.name + " successfully inserted into the database!");
	}

	bot.setPrefix = function (prefix, guild) {
		db.run("UPDATE servers SET prefix = \"" + prefix + "\" WHERE id = " + guild.id);
		return prefix;
	}

	bot.setwelcomeMessageEnabled = function (guild, setting) {
		db.run("UPDATE servers SET welcomeMessagesEnabled = \"" + setting + "\" WHERE id = " + guild.id);
		return setting;
	}

	bot.setWelcomeMessageText = function (id, text) {
		db.run(`UPDATE servers SET welcomeMessage = "${text}" WHERE id = "${id}"`);
		return text;
	}

	bot.getWelcomeMessageStatus = function(id) {  
		return new Promise((resolve, reject) => {
			db.all("SELECT * FROM servers WHERE id = " + id, function(err, rows) {
				if(rows[0].welcomeMessagesEnabled == 1)
					resolve(true);
				else 
					resolve(false);
			});
		})
	}

	bot.setAnnouncementChannel = function (channel) {
		db.run("UPDATE servers SET announcementChannel = \"" + channel.id + "\" WHERE id = " + guild.id);
		return channel.id;
	}

	bot.getPrefix = function (msg) {
		return new Promise(
			function (resolve, reject) {
				db.all(`SELECT * FROM servers WHERE id = "${msg.guild.id}"`, function (err, rows) {
					if (err)
						reject(err);
					else
						resolve(rows[0].prefix)
				});
			}
		)
	}

	/*bot.displayServers = function(msg) {
		db.each("SELECT * FROM servers", function(err, row) {
			if (err)
				msg.channel.send(err);
			else
				msg.channel.send("```\nServer ID: " + row.id + "\nName: " + row.name + "\nPrefix" + row.prefix + "\nWelcome Channel: " + row.welcomeChannel + "\nWelcome Messages Enabled: " + row.welcomeMessagesEnabled + "\nWelcome Message: " + row.welcomeMessage + "\nMod Messages Channel: " + row.modMessagesChannel + "\nMod Messages Enabled: " + row.modMessagesEnabled + "\n```")
		});
	}

	bot.displayServer = function(msg, serverID) {
		db.run(`SELECT * FROM servers WHERE id = ${serverID}`, function(err, row) {
			if (err)
				msg.channel.send(err);
			else
				msg.channel.send("```\nServer ID: " + row.id + "\nName: " + row.name + "\nPrefix" + row.prefix + "\nWelcome Channel: " + row.welcomeChannel + "\nWelcome Messages Enabled: " + row.welcomeMessagesEnabled + "\nWelcome Message: " + row.welcomeMessage + "\nMod Messages Channel: " + row.modMessagesChannel + "\nMod Messages Enabled: " + row.modMessagesEnabled + "\n```")
		});
	}*/

	//Implement categories of commands and check this based on those
	bot.enabled = function (command, guild) {
		return true;
	}

	bot.permLevel = function (msg) {
		if (msg.author.id == bot.config.owner)
			return 6;
		else if (msg.author.id == msg.guild.owner.id)
			return 5;
		else if (msg.member.hasPermission("MANAGE_GUILD"))
			return 4;
		else if (msg.member.hasPermission("MANAGE_ROLES_OR_PERMISSIONS"))
			return 3;
		else if (msg.member.hasPermission("MANAGE_MESSAGES"))
			return 2;
		else if (!bot.blacklist(msg.author.id))
			return 1;
		else
			return 0;
	}

	bot.blacklist = function (id) {
		var blacklistJson = fs.readFileSync("./blacklist.json"),
			blacklist = JSON.parse(blacklistJson);
		for(var i = 0; i < blacklist.length; i++) {
			if(blacklist[i] == id)
				return true;
		}
		return false;
	}

	bot.processMessage = function (msg) {
		if(channel && msg.channel.id == channel) bot.log(msg.guild.name + " | " + msg.channel.name + " | " + msg.member.displayName + " | " + msg.cleanContent);

		if(msg.author.bot) return;

		var afkJson = fs.readFileSync("./afk.json"),
			afk = JSON.parse(afkJson);
		if(afk.length != 0) {
			for (let i = 0; i < afk.length; i++) {
				if (afk[i].id === msg.author.id) {
					afk.splice(i, 1);
					fs.writeFileSync("./afk.json", JSON.stringify(afk, null, 3));
					msg.channel.send(":ok_hand: Welcome back **" + msg.author.username + "**! I've removed your AFK status!");
				}
				if (msg.mentions.users.size > 0 && afk.length != 0) {
					if (msg.content.indexOf(afk[i].id) != -1 && msg.author.id != afk[i].id) {
						var nick = msg.guild.members.get(afk[i].id).displayName
						msg.channel.send(":robot: **" + nick + "** is AFK: **" + afk[i].reason + "**")
						.then(msg => {
							setTimeout(function() {
								msg.delete()
							}, 20000)
						});
					}
				}
			}
		}

		if (msg.isMentioned(bot.user)) {
			if (msg.content.toLowerCase().includes("what's your prefix") || msg.content.toLowerCase().includes("whats your prefix")) {
				bot.getPrefix(msg).then(prefix => {
					msg.reply("my prefix for this server is `" + prefix + "`!")
				})
			}

			if (msg.content.toLowerCase().includes("resetprefix") && msg.member.hasPermission("ADMINISTRATOR")) {
				bot.setPrefix(config.prefix, msg.guild);
				msg.reply('I have reset this server\'s prefix to ``' + config.prefix + '``!')
			}
		}
		
		this.getPrefix(msg).then(prefix => {
			if (msg.content.startsWith(prefix)) {
				try {
					let args = msg.content.split(/\s+/g),
						command = args.shift().slice(prefix.length).toLowerCase(),
						cmd = bot.commands.get(command), //|| bot.commands.get(bot.aliases.get(command)),
						perms = bot.permLevel(msg)
					if (!cmd) return;
					else if (perms == 0) return msg.reply("you are blacklisted from using the bot!");
					else if (perms < cmd.permission) return msg.reply("you do not have permission to do this!")
					else if (bot.enabled(cmd)) {
						msg.content = msg.content.substring(msg.content.indexOf(" ") + 1, msg.content.length) || null;
						msg.args = args;
						bot.log(msg.author.username + " executed " + command + " in #" + msg.channel.name + " in " + msg.guild.name);
						cmd.main(bot, msg);
					}
				} catch (err) {
					msg.channel.send(err.toString());
					bot.error(err);
				}
			}
		})
	}

	bot.error = function (err) {
		if (bot.shard)
			console.log(this.timestamp() + " [SHARD " + bot.shard.id + "] [ERROR] | " + err.stack)
		else
			console.log(this.timestamp() + " [ERROR] | " + err.stack)
	}

	bot.debug = function (txt) {
		if (bot.shard)
			console.log(this.timestamp() + " [SHARD " + bot.shard.id + "] [DEBUG] | " + txt)
		else
			console.log(this.timestamp() + " [DEBUG] | " + txt)
	}

	bot.warn = function (txt) {
		if (bot.shard)
			console.log(this.timestamp() + " [SHARD " + bot.shard.id + "] [WARN]  | " + txt)
		else
			console.log(this.timestamp() + " [WARN]  | " + txt)
	}

	bot.log = function (txt) {
		if (bot.shard)
			console.log(this.timestamp() + " [SHARD " + bot.shard.id + "]  [LOG]  | " + txt)
		else
			console.log(this.timestamp() + "  [LOG]  | " + txt)
	}

	bot.timestamp = function () {
		var currentTime = new Date(),
			hours = currentTime.getHours(),
			minutes = currentTime.getMinutes(),
			seconds = currentTime.getSeconds()
		if (minutes < 10)
			minutes = "0" + minutes;
		if (seconds < 10)
			seconds = "0" + seconds;
		return '[' + hours + ':' + minutes + ':' + seconds + ']';
	}

	bot.startGameCycle = function () {
		bot.user.setGame(bot.config.games[Math.round(Math.random() * (bot.config.games.length - 1))] + ' | @' + bot.user.username + ' What\'s your prefix?');
		setInterval(() => {
			bot.user.setGame(bot.config.games[Math.round(Math.random() * (bot.config.games.length - 1))] + ' | @' + bot.user.username + ' What\'s your prefix?');
		}, 300000);
	}

	bot.awaitConsoleInput = function() {
		stdin.addListener("data", function(d) {
			d = d.toString().trim()
			if(d.startsWith("channels")) {
				bot.channels.forEach(channel => {
					if(channel.type == "text" && channel.permissionsFor(channel.guild.me).has(["READ_MESSAGES", "SEND_MESSAGES"]))
						bot.log(channel.guild.name + " | #" + channel.name + " | (" + channel.id + ")")
				})
			} else if(d.startsWith("bind") && channel) {
				d = d.substring(d.indexOf(" ") + 1, d.length)
				if(bot.channels.get(d)) {
					channel = d;
					bot.log("Console rebound to channel " + bot.channels.get(d).name + " in " + bot.channels.get(d).guild.name + "!");
				}
			} else if(channel) {
				try {
					bot.channels.get(channel).send(d);
				} catch(err) {
					bot.log(err);
				}
			} else {
				if(bot.channels.get(d)) {
					channel = d;
					bot.log("Console bound to channel " + bot.channels.get(d).name + " in " + bot.channels.get(d).guild.name + "!");
				}
			}
		});
	}
}