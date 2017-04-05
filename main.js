var routes = require('./routes/messenger');

function process(message) {

    console.log('Twitter received message %s', JSON.stringify(message));
    routes.sendDirectMessage(message._to.uniqueName, message._message);
}

function processTimeline(message) {

    console.log('Twitter timeline received message %s', JSON.stringify(message));
    routes.postTimeline(message._to.uniqueName, message._message);
}


module.exports.process = process;
module.exports.processTimeline = processTimeline;
