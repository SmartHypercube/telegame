const fs = require('fs');

const data = JSON.parse(fs.readFileSync('data.json'));
function save() {
    fs.writeFileSync('data.json', JSON.stringify(data));
}

balance = {
    data: data.balance,
    get(user_id) {
        return this.data[user_id] || 0;
    },
    set(user_id, value) {
        this.data[user_id] = value;
        save();
    },
};

game = {
    data: new Map(),
    get(chat_id) {
        return this.data.get(chat_id);
    },
    set(chat_id, game) {
        this.data.set(chat_id, game);
    },
    delete(chat_id) {
        this.data.delete(chat_id);
    },
};

module.exports = {
    balance,
    game,
};
