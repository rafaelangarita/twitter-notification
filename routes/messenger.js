var conf = require('../conf/conf');
var Twit = require('twit');
const sender = require('../amqp-sender');
const scbNodeParser = require('scb-node-parser');
var Message = require('scb-node-parser/message');
var confDM = require('./../conf/amqp-endpoint.conf');
var confTL = require('./../conf/amqp-endpoint-timeline.conf');

var winston = require('winston');

var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.File)({
            filename: 'application.log'
        })
    ]
});

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
            logger.log('error', 'send_error', err);
            return err;
        } else {
            logger.log('info', 'sent_dmmessage', {
                dmParams,
                reply_id: reply.id_str,
                reply_text: reply.text
            });

            return reply.id_str;
        }
    });
}

exports.postTimeline = function(twitterUsername, message) {

    //modify the message to mention the receiver user

    message = '@' + twitterUsername + '\n' + message;



    twit.post('statuses/update', {
        status: message
    }, function(err, reply) {
        if (err) {
            logger.log('error', 'send_error', err);
            return err;
        } else {
            logger.log('info', 'sent_tlmessage', {
                dmParams,
                reply_id: reply.id_str,
                reply_text: reply.text
            });
            return reply.id_str;
        }
    });

}

exports.listenDirectMessage = function() {
    console.log('listening for direct messages');

    var stream = twit.stream('user');

    console.log('twit.stream(\'user\') :' + JSON.stringify(stream));

    /*  stream.on('direct_message', function(directMsg) {
          console.log('dm' + directMsg);
      })*/

    var stream = twit.stream('user')

    /*stream.on('tweet', function(tweet) {
        console.log(tweet)
    })*/

    stream.on('direct_message', function(directMsg) {

        if (directMsg.direct_message.sender.screen_name != conf.screen_name) { //it's not my own message

            logger.log('info', 'received_dmmessage', directMsg);

            var parsedMessage = scbNodeParser.getMessage(directMsg.direct_message.text);
            parsedMessage.setFrom(directMsg.direct_message.sender.name, directMsg.direct_message.sender.screen_name);
            parsedMessage._persona = confDM.exchange.name;
            sender.post(parsedMessage);
        }
    })

    stream.on('statuses/mentions_timeline', function(mention) {

        console.log(mention)
    })

    stream.on('statuses/filter', function(status) {

        console.log(status)
    })

    stream.on('tweet', function(tweet) {
        //check if tweet is actually for the OSNB
        var found = false;
        tweet.entities.user_mentions.forEach(function(mention) {
            if (mention.screen_name === conf.screen_name)
                found = true;
        });
        if (found) {
            logger.log('info', 'received_tlmessage', tweet);
            var text = tweet.text.replace('@' + conf.screen_name);
            var parsedMessage = scbNodeParser.getMessage(text);
            parsedMessage.setFrom(tweet.user.name, tweet.user.screen_name);
            parsedMessage._persona = confTL.exchange.name;
            sender.post(parsedMessage);
        }
    })

    stream.on('disconnect', function(disconn) {
        console.log('disconnect')
    })

    stream.on('connect', function(conn) {
        console.log('connecting ')
    })

    stream.on('reconnect', function(reconn, res, interval) {
        logger.log('info', 'reconnecting', {
            statusCode: res.statusCode
        });
    })
}
