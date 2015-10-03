var TELEGRAM_TOKEN  = process.env.TELEGRAM_TOKEN;
var MASHAPE_TOKEN   = process.env.MASHAPE_TOKEN;
var HSAPI_ENDPOINT  = 'https://omgvamp-hearthstone-v1.p.mashape.com/';

var TelegramBot   = require('node-telegram-bot-api');
var unirest       = require('unirest');
var request       = require('request');
var bot           = new TelegramBot(TELEGRAM_TOKEN, {polling: true});

var helpText = 'This bot is made for giving you all information about hearthstone cards.' +
'\nUse the following syntax:' +
'\n/help - for viewing this message' +
'\n/card [card name] [(optional) locale] - to get specified card in choosed locale (enUS is default)';
var errorText = 'Oops, something is wrong in your query!';

//presumes locale is correct local name
function formCardQuery(cardName, locale) {
  var res = HSAPI_ENDPOINT + "/cards/" + encodeURIComponent(cardName) + "?collectible=1";
  if (typeof locale != 'undefined') {
    res += "&locale=" + locale;
  }
  return res;
}

bot.on('text', function(msg) {
  console.log(msg);
  var words = msg.text.split(/\b\s\[|\]\s\[|\]$/);
  console.log(words);
  if (words[0] == '/help' && words.length == 1) {
    bot.sendMessage(msg.chat.id, helpText);
  } else if (words[0] == '/card') {
    if (words.length >= 3 && words.length <= 4) {
      var queryString;
      if (words.length == 3) {
        queryString = formCardQuery(words[1]);
      } else {
        queryString = formCardQuery(words[1], words[2]);
      }
      unirest.get(queryString)
      .header("X-Mashape-Key", MASHAPE_TOKEN)
      .header("Accept", "application/json")
      .end(function (result) {
        console.log(result.body);
        if (typeof result.body.error != "undefined") {
          bot.sendMessage(msg.chat.id, result.body.message);
        } else {
          var image = request(result.body[0].img);
          bot.sendPhoto(msg.chat.id, image);
          //bot.sendMessage(msg.chat.id, JSON.stringify(result.body[0]));
        }
      });
    } else {
      bot.sendMessage(msg.chat.id, errorText);
    }
  } else {
    bot.sendMessage(msg.chat.id, errorText);
  }
});
