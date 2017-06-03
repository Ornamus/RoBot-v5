module.exports = {
	name: 'ping',
	usage: 'ping',
	permission: 1,
	help: 'Tests the bot\'s ping time.',
	main: function (bot, msg, args) {
		var start = new Date(msg.createdAt).getTime();
		msg.channel.send("Pong!")
			.then(msg => msg.edit("Hello, pong! You're on the " + msg.channel.guild.name + " server.\nTook " + (msg.createdAt.getTime() - start) + " ms to respond."))
			.catch(console.error);
	}
}