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

function isRussianUnicodeSymbol(letterCode) {
    // А and Я are correspondingly first and last letter of russian alphabet
    return ((letterCode >= "а".charCodeAt(0) && letterCode <= "я".charCodeAt(0)) ||
            (letterCode >= "А".charCodeAt(0) && letterCode <= "Я".charCodeAt(0)));
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

//presumes locale is correct locale name
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

function extractOptionAndArgument(word) {
    var answer = {};
    answer.key = (word.split(" "))[0];
    answer.val = (word.split(" ")).slice(1).join(" ");
    return answer;
}

bot.on('text', function(msg) {
    console.log(msg);
    var optionStrings = msg.text.split(/\s-/);
    console.log(optionStrings);
    var command = extractOptionAndArgument(optionStrings[0]);
    var options = optionStrings.slice(1).map(extractOptionAndArgument);
    console.log(command);
    console.log(options);
    if ((command.key == '/help' || command.key == '/start') && options.length === 0 && command.val === '') {
      bot.sendMessage(msg.chat.id, helpText);
  } else if (command.key == '/card') {
        var queryString;

        if (options.length === 0) {
            queryString = formCardQuery(command.val);
        } else if (options.length == 1 && ((options[0].key == "l") || (options[0].key == "-locale"))) {
            queryString = formCardQuery(command.val, options[0].val);
        } else {
            bot.sendMessage(msg.chat.id, errorText);
            return;
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
});
