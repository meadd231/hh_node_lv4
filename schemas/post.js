const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  nickname: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: {
    transform: function (doc, ret) {
      // `_id` 필드를 `userId` 필드로 복사
      ret.postId = ret._id;
      // `_id` 필드 삭제
      delete ret._id;
    }
  },
  versionKey: false,
});

module.exports = mongoose.model('posting', userSchema, 'posting');