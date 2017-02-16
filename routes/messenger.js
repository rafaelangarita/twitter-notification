var conf = require('../conf/conf');
var Twit = require('twit')

var twit = null;

twit = new Twit({
    consumer_key: conf.consumer_key,
    consumer_secret: conf.consumer_secret,
    access_token: conf.access_token,
    access_token_secret: conf.access_token_secret
})


/*Messages look like this:

    {
        "user":"Twitter username",
        "message": "Hi, how are you?"
    }
*/

exports.sendMessage = function(req, res) {

    var dmParams = {
        screen_name: req.body.username,
        text: req.body.message
    }
    var reply = sendDirectMessage(dmParams);

    res.send(reply);
}

exports.sendDirectMessage = function(twitterUsername, message) {
    var dmParams = {
        screen_name: twitterUsername,
        text: message
    }
    sendDirectMessage(dmParams);
}

function sendDirectMessage(dmParams) {
    // post a direct message from the sender's account
    twit.post('direct_messages/new', dmParams, function(err, reply) {
        if (err) {
            console.log(err);
            return err;
        } else {
            console.log(reply.id_str);
            console.log(reply.text);

            return reply.id_str;
        }
    });
}
