var get = require('simple-get')
var concat = require('concat-stream')
var fs = require('fs')

exports.getIce = function (cb) {
  var accountSid = process.env.TWILLIO_SID
  var twillioUrl = 'https://api.twilio.com/2010-04-01/Accounts/' +
    accountSid + '/Tokens.json'
  var username = `${accountSid}:${process.env.TWILLIO_AUTH_TOKEN}`
  get(
    {
      url: twillioUrl,
      auth: username,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    },
    function (err, res) {
      if (err) {
        cb(err, null)
      }
      res.pipe(concat(function (data) {
        var dataObj = JSON.parse(data)
        var ice = dataObj.ice_servers
        fs.writeFile('test/ice_servers.json', JSON.stringify(ice), function (err) {
          if (err) throw err
          console.log('Ice servers saved')
        })
      }))
    })
}

exports.getIce()
