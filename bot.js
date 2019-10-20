const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const HorseGame = require('./games/horse');
const data = require('./data');
const config = require('./config');

const bot = new Telegraf(config.token);
bot.catch(err => {
    console.log('ERROR', err);
});

bot.command('balance', ctx => {
    ctx.reply(`余额: ${data.balance.get(ctx.from.id)}`, Extra.inReplyTo(ctx.message.message_id));
});
bot.command('py', ctx => {
    let balance = data.balance.get(ctx.from.id);
    if (balance > 0) {
        ctx.reply(`你还有余额 ${balance}，无需 py 交易`, Extra.inReplyTo(ctx.message.message_id));
        return;
    }
    balance = Math.ceil(Math.random() * 100);
    data.balance.set(ctx.from.id, balance);
    ctx.reply(`py 交易: +${balance} (${balance})`, Extra.inReplyTo(ctx.message.message_id));
});

bot.command('horse', async ctx => {
    let game = data.game.get(ctx.chat.id);
    if (game) {
        ctx.reply('游戏仍在进行', Extra.inReplyTo(game.message_id));
        return;
    }
    new HorseGame(ctx.telegram, ctx.chat.id);
});
bot.action(/horse_bet_\d+/, async ctx => {
    const game = data.game.get(ctx.chat.id);
    if (!game || game.message_id !== ctx.update.callback_query.message.message_id) {
        return;
    }
    game.bet(ctx.update.callback_query.from, ctx.update.callback_query.data);
});
bot.action(/horse_select_\d+/, async ctx => {
    const game = data.game.get(ctx.chat.id);
    if (!game || game.message_id !== ctx.update.callback_query.message.message_id) {
        return;
    }
    game.select(ctx.update.callback_query.from, ctx.update.callback_query.data);
});
bot.action(/horse_boost_\d+/, async ctx => {
    const game = data.game.get(ctx.chat.id);
    if (!game || game.message_id !== ctx.update.callback_query.message.message_id) {
        return;
    }
    game.boost(ctx.update.callback_query.from, ctx.update.callback_query.data);
});

bot.launch();
