const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    nickname: {
        type: String,
        required: true,
    },
    postId: {
        type: String,
        required: true,
    },
    comment: {
        type: String,
        required: true,
    },
    createdAt : {
        type: Date,
        default: Date.now
    },
    updatedAt : {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: {
        transform: function (doc, ret) {
            // `_id` 필드를 `userId` 필드로 복사
            ret.commentId = ret._id;
            // `_id` 필드 삭제
            delete ret._id;
            delete ret.postId;
        }
    },
    versionKey: false,
});

module.exports = mongoose.model('comment', commentSchema, 'comment');