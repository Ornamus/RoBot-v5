var myGoogleNews = require('my-google-news');
var Discord = require('discord.js');

module.exports = {
	name: 'news',
	usage: 'news <query>',
	permission: 1,
	help: 'Gets news from Google News.',
	main: function(bot, msg, args) {
		var e = new Discord.RichEmbed();
		myGoogleNews.resultsPerPage = 10;
		myGoogleNews(msg.content, function (err, res){
			if (err) console.error(err)
			res.links.forEach(function(item){
				e.addField(item.title, item.href)
				console.log(item.description + "\n")
			});
			msg.channel.send({embed: e});
		});
	}
};