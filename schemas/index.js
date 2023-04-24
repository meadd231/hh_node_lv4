const mongoose = require('mongoose');

// const url = `mongodb+srv://sparta:test@cluster0.ia8rqcv.mongodb.net/?retryWrites=true&w=majority`;
const url = "mongodb://127.0.0.1/27017"

const connect = () => {
    // 이게 뭐지?
    // debug - true?
    if (process.env.NODE_ENV !== 'production') {
        mongoose.set('debug', true);
    }

    mongoose.connect(url, {
        dbName: 'hh_node'
    });
};

// on() 메소드는 어떤 의미일까?
mongoose.connection.on('error', (error) => {
    console.error('몽고디비 연결 에러', error);
});

mongoose.connection.on('disconnected', () => {
    console.error('몽고디비 연결이 끊겼습니다. 연결을 재시도합니다.');
    connect();
});

module.exports = connect;