const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  nickname: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
}, {
  toJSON: {
    transform: function (doc, ret) {
      // `_id` 필드를 `userId` 필드로 복사
      ret.userId = ret._id;
      // `_id` 필드 삭제
      delete ret._id;
    }
  },
  versionKey: false,
});

module.exports = mongoose.model("User", UserSchema);