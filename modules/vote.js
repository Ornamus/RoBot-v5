module.exports = {
	name: 'vote',
	usage: 'vote <question>',
	permission: 1,
	help: 'Creates a poll with two responses, yes or no.',
	main: function(bot, msg, args) {
        var yes = 0,
            no = 0,
            t = 60,
            responded = [];
		msg.channel.send("A poll has been created! Question: ```" + msg.content + "```" + "Answer with **yes** or **no.**\n")
        .then(msg => {
            msg.channel.send("Time Remaining: **" + t + "**")
            .then(timer => {
                setInterval(function() {
                    if(t >= 0) {
                        t = t - 5;
                        timer.edit("Time Remaining: **" + t + "**")
                    }
                }, 5000)
            })
            
            const collector = msg.channel.createCollector(
                m => m.content.toLowerCase() == 'yes' || m.content.toLowerCase() == 'no',
                { time: t*1000 });
            collector.on('message', m => {
                if(m.content.toLowerCase() == 'yes' && responded.indexOf(m.author.id) < 0) {
                    responded.push(m.author.id);
                    yes++;
                }
                if(m.content.toLowerCase() == 'no' && responded.indexOf(m.author.id) < 0) {
                    responded.push(m.author.id);
                    no++;
                }
            });
            collector.on('end', collected => {
                msg.channel.send("Voting is over! Tallying results...");
                setTimeout(function() {
                    if(yes > no)
                        msg.channel.send("**Yes** won with " + yes + " votes! No got " + no + " vote(s).");
                    else if(yes < no)
                        msg.channel.send("**No** won with " + no + " votes! Yes got " + yes + " vote(s).");
                    else if(yes == no)
                        msg.channel.send("**Yes** and **No** tied! Both got " + yes + " votes!");
                }, 2000)
            });
        })
	}
};