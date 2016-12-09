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
        // post a direct message from the sender's account
    twit.post('direct_messages/new', dmParams, function(err, reply) {
        if (err) {
            console.log(err);
            res.send(err);
        } else {
            console.log(reply.id_str);
            console.log(reply.text);
            res.send(reply.id_str);

        }
    })
}
