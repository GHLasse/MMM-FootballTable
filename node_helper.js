/* Magic Mirror
 * Module: football
 *
 * By Lasse Wollatz https://github.com/GHLasse
 * MIT Licensed.
 */
var NodeHelper = require('node_helper');
var request = require('request');

module.exports = NodeHelper.create({
  start: function () {
    console.log(this.name + ' helper started ...');
  },
  socketNotificationReceived: function(notification, payload) {
    //console.log(notification);
    if (notification === 'FOOTBALL_REQUEST') {
      var that = this;
      request({
          url: payload.url,
          method: 'GET'
        }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          that.sendSocketNotification('FOOTBALL_RESPONSE', {
            id: payload.id,
            data: JSON.parse(body),
            status: response.statusCode.toString(),
            header: response
          });
        }else{
          that.sendSocketNotification('FOOTBALL_RESPONSE', {
            id: payload.id,
            data: response.statusCode.toString(),
            status: response.statusCode.toString(),
            header: response
          });
        }
      });
    }
  }
});
