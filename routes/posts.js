const express = require('express');
const Post = require('../schemas/post');
const { Posts, Users } = require('../models');
const { Op } = require('sequelize');
const Sequelize = require('sequelize');
const authMiddleware = require("../middlewares/auth-middleware");
const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      res.status(412).json({ errorMessage: '데이터의 형식이 올바르지 않습니다.' });
    }
    const { userId, nickname } = res.locals.user;
    // const posting = new Post({ userId: user._id, nickname: user.nickname, title, content });
    // await posting.save();
    const post = await Posts.create({ userId, nickname, title, content });
    res.status(201).json({ message: '게시글 작성에 성공하였습니다.' });
  } catch (error) {
    console.error(error);

    if (error.name === 'ValidationError') {
      if (error.errors.title) {
        res.status(412).json({ errorMessage: '게시글 제목의 형식이 일치하지 않습니다.' });
        return;
      }
      if (error.errors.content) {
        res.status(412).json({ errorMessage: '게시글 내용의 형식이 일치하지 않습니다.' });
        return;
      }
      res.status(412).json({ errorMessage: '데이터 형식이 올바르지 않습니다.' });
      return;
    }

    res.status(400).json({ errorMessage: '게시글 작성에 실패하였습니다.' });
    return;
  }
});

router.get('/', async (req, res) => {
  try {
    // const posts = await Post.find().sort("-createdAt").exec();
    const posts = await Posts.findAll({
      attributes: ['postId', 'userId', 'nickname', 'title', 'content', 'createdAt', 'updatedAt']
    });
    res.status(200).json({ "posts": posts });
  } catch (error) {
    console.error(error);
    res.status(400).json({ errorMessage: '게시글 조회에 실패하였습니다.' });
  }
});

router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    // const post = await Post.findOne({ _id: req.params.postId });
    const post = await Posts.findOne({
      where: { postId },
      attributes: ['postId', 'userId', 'title', 'content', 'createdAt', 'updatedAt'],
      include: {
        model: Users,
        attributes: ['nickname'],
        where: { userId: Sequelize.col('Posts.userId') }
      }
    });
    console.log(post);
    res.status(200).json({ "post": post });
  } catch (error) {
    console.error(error);
    res.status(400).json({ errorMessage: '게시글 조회에 실패하였습니다.' });
  }
});

router.put('/:postId', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, content } = req.body;
    if (!title || !content) {
      res.status(412).json({ errorMessage: '데이터 형식이 올바르지 않습니다.' });
    }
    const user = res.locals.user;
    // const post = await Post.findOne({ _id: postId });
    const post = await Posts.findOne({
      where: { postId },
    });

    if (!post) {
      res.status(404).json({ errorMessage: "게시글이 존재하지 않습니다." });
    }

    // userId는 String이고 user._id는 ObjectId라서 === 이러면 false라고 나오는 것 같음.
    if (post.userId == user.userId) {
      await Posts.update(
        { title, content, updatedAt: Date.now() }, // 수정할 컬럼 및 데이터
        {
          where: {
            [Op.and]: [{ postId }] // 게시글의 비밀번호와, postId가 일치할 때, 수정한다.
          },
        }
      );
      return res.status(200).json({ message: '게시글을 수정하였습니다.' });
    } else {
      res.status(403).json({ errorMessage: "게시글의 수정 권한이 존재하지 않습니다." });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ errorMessage: '게시글 수정에 실패하였습니다.' });
  }
});

router.delete('/:postId', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const user = res.locals.user;
    // const post = await Post.findOne({ _id: postId });
    const post = await Posts.findOne({
      where: { postId },
    });

    if (!post) {
      res.status(404).json({ errorMessage: "게시글이 존재하지 않습니다." });
    }

    if (post.userId == user.userId) {
      // await Post.deleteOne({ _id: postId });
      await Posts.destroy({
        where: {
          [Op.and]: [{ postId }] // 게시글의 비밀번호와, postId가 일치할 때, 수정한다.
        },
      });
      res.json({ 'msg': '게시글을 삭제하였습니다.' });
    } else {
      res.status(403).json({ errorMessage: "게시글의 삭제 권한 존재하지 않습니다." });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ errorMessage: "게시글 삭제에 실패하였습니다." });
  }
});

module.exports = router;