const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const data = require('../data');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class HorseGame {
    constructor(telegram, chat_id) {
        this.telegram = telegram;
        this.chat_id = chat_id;
        data.game.set(chat_id, this);
        this.run().then(r => {
            data.game.delete(chat_id);
        }).catch(e => {
            console.log(e);
        });
    }
    bet(user, choice) {
        const balance = data.balance.get(user.id);
        const value = Math.min(Number(choice.slice(10)), balance);
        if (!value) {
            return;
        }
        data.balance.set(user.id, balance - value);
        let bet = this.bets.find(i => i.id===user.id);
        if (bet) {
            bet.name = user.first_name;
            bet.value += value;
        } else {
            this.bets.push({id: user.id, name: user.first_name, value});
        }
        this.expire = new Date();
        this.expire.setSeconds(this.expire.getSeconds() + 10);
    }
    select(user, choice) {
        const horse = Number(choice.slice(13));
        let bet = this.bets.find(i => i.id===user.id);
        if (!bet) {
            return;
        }
        bet.name = user.first_name;
        bet.horse = horse;
        this.expire = new Date();
        this.expire.setSeconds(this.expire.getSeconds() + 10);
    }
    boost(user, choice) {
        const bet = this.bets.find(i => i.id===user.id);
        if (!bet) {
            return;
        }
        const horse = this.horses.find(i => i.id===bet.horse);
        if (!horse || horse.state === 'fell' || horse.state === 'dead') {
            return;
        }
        switch (Number(choice.slice(12))) {
            case 1:
                horse.value -= Math.floor(Math.random() * 7);
                horse.value = Math.max(horse.value, 0);
                if (Math.random() < .4) {
                    horse.state = 'fell';
                }
                break;
            case 2:
                horse.value -= Math.floor(Math.random() * 7 + 3);
                horse.value = Math.max(horse.value, 0);
                if (Math.random() < .4) {
                    horse.state = 'dead';
                }
        }
    }
    async run() {
        {
            // 初始化
            const message = await this.telegram.sendMessage(this.chat_id, '<b>赛马</b>\n启动中……', Extra.HTML(true));
            this.message_id = message.message_id;
        }
        {
            // 下注
            this.bets = [];
            const extra = Extra.HTML(true).markup(Markup.inlineKeyboard([[
                Markup.callbackButton('1', 'horse_bet_1'),
                Markup.callbackButton('10', 'horse_bet_10'),
                Markup.callbackButton('100', 'horse_bet_100'),
                Markup.callbackButton('1000', 'horse_bet_1000'),
                Markup.callbackButton('10000', 'horse_bet_10000'),
            ], [
                Markup.callbackButton('2', 'horse_bet_2'),
                Markup.callbackButton('20', 'horse_bet_20'),
                Markup.callbackButton('200', 'horse_bet_200'),
                Markup.callbackButton('2000', 'horse_bet_2000'),
                Markup.callbackButton('20000', 'horse_bet_20000'),
            ], [
                Markup.callbackButton('5', 'horse_bet_5'),
                Markup.callbackButton('50', 'horse_bet_50'),
                Markup.callbackButton('500', 'horse_bet_500'),
                Markup.callbackButton('5000', 'horse_bet_5000'),
                Markup.callbackButton('50000', 'horse_bet_50000'),
            ]]));
            this.expire = new Date();
            this.expire.setSeconds(this.expire.getSeconds() + 10);
            let now = new Date();
            while (now < this.expire) {
                const seconds = Math.ceil((this.expire - now) / 1000);
                const text = ['<b>赛马</b>', `请下注…… ${seconds}`].concat(this.bets.map(i => `${i.name}: ${i.value} (${data.balance.get(i.id)})`)).join('\n');
                await this.telegram.editMessageText(this.chat_id, await this.message_id, null, text, extra);
                await sleep(1000);
                now = new Date();
            }
        }
        if (this.bets.length) {
            // 选马
            const extra = Extra.HTML(true).markup(Markup.inlineKeyboard([[
                Markup.callbackButton('1', 'horse_select_1'),
                Markup.callbackButton('2', 'horse_select_2'),
                Markup.callbackButton('3', 'horse_select_3'),
                Markup.callbackButton('4', 'horse_select_4'),
                Markup.callbackButton('5', 'horse_select_5'),
                Markup.callbackButton('6', 'horse_select_6'),
            ]]));
            this.expire = new Date();
            this.expire.setSeconds(this.expire.getSeconds() + 10);
            let now = new Date();
            while (now < this.expire) {
                const seconds = Math.ceil((this.expire - now) / 1000);
                const text = ['<b>赛马</b>', `请选马…… ${seconds}`].concat(this.bets.map(i => `${i.name}: ${i.horse||''}`)).join('\n');
                await this.telegram.editMessageText(this.chat_id, await this.message_id, null, text, extra);
                await sleep(1000);
                now = new Date();
            }
        }
        if (this.bets.length && this.bets.every(i => i.horse!==undefined)) {
            // 比赛
            const extra = Extra.HTML(true).markup(Markup.inlineKeyboard([[
                Markup.callbackButton('快马加鞭', 'horse_boost_1'),
                Markup.callbackButton('火箭加速', 'horse_boost_2'),
            ]]));
            this.horses = [{
                id: 1,
                value: 50,
                state: 'normal',
            }, {
                id: 2,
                value: 50,
                state: 'normal',
            }, {
                id: 3,
                value: 50,
                state: 'normal',
            }, {
                id: 4,
                value: 50,
                state: 'normal',
            }, {
                id: 5,
                value: 50,
                state: 'normal',
            }, {
                id: 6,
                value: 50,
                state: 'normal',
            }];
            while (true) {
                const text = ['<b>赛马</b>'].concat(this.horses.map(i => (
                    ' '.repeat(i.value) + {normal: '🏇', fell: '🐎', dead: '☠️'}[i.state] + i.id
                ))).join('\n');
                await this.telegram.editMessageText(this.chat_id, await this.message_id, null, text, extra);
                if (this.horses.some(i => !i.value) || this.horses.every(i => i.state==='dead')) {
                    break;
                }
                for (let horse of this.horses) {
                    switch (horse.state) {
                        case 'normal':
                            horse.value -= Math.floor(Math.random() * 3) + 1;
                            horse.value = Math.max(horse.value, 0);
                            break;
                        case 'fell':
                            if (Math.random() < .4) {
                                horse.state = 'normal';
                            }
                    }
                }
                await sleep(500);
            }
        }
        {
            // 结束
            const extra = Extra.HTML(true);
            this.horses = this.horses || [];
            let text = ['<b>赛马</b>（已结束）'].concat(this.horses.map(i => (
                ' '.repeat(i.value) + {normal: '🏇', fell: '🐎', dead: '☠️'}[i.state] + i.id
            ))).join('\n');
            for (let bet of this.bets) {
                const horse = this.horses.find(i => i.id===bet.horse);
                if (!horse) {
                    const balance = data.balance.get(bet.id);
                    data.balance.set(bet.id, balance + bet.value);
                    text += `\n${bet.name}: 0 (${data.balance.get(bet.id)})`;
                } else if (horse.value) {
                    text += `\n${bet.name}: -${bet.value} (${data.balance.get(bet.id)})`;
                } else {
                    const balance = data.balance.get(bet.id);
                    data.balance.set(bet.id, balance + bet.value + bet.value);
                    text += `\n${bet.name}: +${bet.value} (${data.balance.get(bet.id)})`;
                }
            }
            await this.telegram.editMessageText(this.chat_id, await this.message_id, null, text, extra);
        }
    }
}

module.exports = HorseGame;
