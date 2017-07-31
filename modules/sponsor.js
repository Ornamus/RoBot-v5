var unirest = require('unirest');
var Discord = require('discord.js');
var config = require('../config.json');
var csv = require("jquery-csv");

module.exports = {
	name: 'sponsor',
	type: 'utility',
	usage: 'sponsor <sponsor>',
	permission: 1,
	help: 'Gets all FRC teams sponsored by a certain sponsor.',
	main: function(bot, msg) {
		if(msg.content == null || msg.content.trim().substring(1, msg.content.trim().length).toLowerCase() == "sponsor") 
			return msg.channel.send("Please specify a sponsor! Command syntax: `sponsor <sponsor>`");
		if(msg.content.trim().toLowerCase() == "first"){
			return msg.channel.send("We're *all* sponsored by FIRST! :smiley:")
		} else {
			var sponsor = msg.content.trim();
			unirest.get("https://raw.githubusercontent.com/the-blue-alliance/the-blue-alliance-data/master/teams/teams.csv")
			.end(function (result) {
				var res = result.body;
				if(!res) return msg.channel.send("Unable to connect to TBA team data dump.");
				
				String.prototype.replaceAll = function(search, replacement) {
					var target = this;
					return target.replace(new RegExp(search, 'g'), replacement);
				};		
		
				var data = csv.toArrays(res)

				var sponsoredTeams = "None";				
				for (var i=0; i<data.length; i++) {
					string = data[i][2];
					string = string.replaceAll("/", " ")
					string = string.replaceAll("and", " ")
					string = string.replaceAll("&", " ")
					string = " " + string + " ";
					//console.log(string)
					if (string.toLowerCase().includes(" " + sponsor.toLowerCase() + " ")) {
						var team = data[i][0].replace("frc", "")
						if (sponsoredTeams == "None") {
							sponsoredTeams = team
						} else {
						sponsoredTeams += ", " + team
						}
					}
					
				}
				if (sponsoredTeams.length > 1024) {
					sponsoredTeams = sponsoredTeams.substring(0, 1024-3)
					sponsoredTeams += "..."
				}
				
				var response = new Discord.RichEmbed();
				response.addField('Teams Sponsored by "' + sponsor + '"', sponsoredTeams)
				.setFooter('Triggered by ' + msg.author.username, msg.author.avatarURL)
				.setTimestamp()
				return msg.channel.send({"embed": response});				
			});
		}
	}
};