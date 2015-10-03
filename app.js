var TELEGRAM_TOKEN  = process.env.TELEGRAM_TOKEN;
var MASHAPE_TOKEN   = process.env.MASHAPE_TOKEN;
var HSAPI_ENDPOINT  = 'https://omgvamp-hearthstone-v1.p.mashape.com/';

var TelegramBot   = require('node-telegram-bot-api');
var unirest       = require('unirest');
var request       = require('request');
var bot           = new TelegramBot(TELEGRAM_TOKEN, {polling: true});

var helpText = 'Hi, I\'m HearthformerBot. I was made to give you all information about hearthstone cards.' +
'\nUse the following syntax to use me:' +
'\n/help - view this message' +
'\n/card [card name] [(optional) locale] - get specified card in choosed locale (enUS is default)' +
'\n Notice, that you must use brackets to emphasize query parameters.';
var errorText = 'Oops, something is wrong in your query!';

// 1040-1103
function isRussianUnicodeSymbol(letterCode) {
  return (letterCode >= 1040 && letterCode <= 1103);
}

// consider it's russian if it has at least one russian symbol
function isRussianString(text) {
  for (var i = 0; i < text.length; i++) {
    if (isRussianUnicodeSymbol(text.charCodeAt(i))) {
      return true;
    }
  }
  return false;
}

//presumes locale is correct local name
function formCardQuery(cardName, locale) {
  var res = HSAPI_ENDPOINT + "/cards/" + encodeURIComponent(cardName) + "?collectible=1";
  if (typeof locale == 'undefined' && isRussianString(cardName)) {
    locale = "ruRU";
  }
  if (typeof locale != 'undefined') {
    res += "&locale=" + locale;
  }
  return res;
}

bot.on('text', function(msg) {
  console.log(msg);
  var words = msg.text.split(/\b\s\[|\]\s\[|\]$/);
  console.log(words);
  if ((words[0] == '/help' || words[0] == '/start') && words.length == 1) {
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
