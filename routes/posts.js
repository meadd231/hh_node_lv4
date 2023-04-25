const express = require('express');
const Post = require('../schemas/post');
const { Posts, Users, Likes } = require('../models');
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
    await Posts.create({ userId, nickname, title, content });
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
    const posts = await Posts.findAll({
      order : [
        ['createdAt', 'desc']
      ],
      include: [
        {
          model: Users,
          attributes: ['nickname'],
          // where: { userId: Sequelize.col('Posts.userId') }
        },
        {
          model: Likes,
          attributes: [],
          where: { postId: Sequelize.col('Posts.postId') },
          require: false,
        }
      ],
      attributes: [
        'postId', 'userId', 'title', 'content', 'createdAt', 'updatedAt',
        [Sequelize.fn('COUNT', Sequelize.col('Likes.likeId')), 'likes']
      ],
      group: ['Posts.postId'],
      raw: true,
    });
    posts.map((post) => {
      post.nickname = post['User.nickname'];
      delete post['User.nickname'];
    });
    return res.status(200).json({ "posts": posts });
  } catch (error) {
    console.error(error);
    res.status(400).json({ errorMessage: '게시글 조회에 실패하였습니다.' });
  }
});

// posts/:postId <- 여기로 들어가는 문제가 있었음.
router.get('/like', authMiddleware, async (req, res) => {
  try {
    console.log('좋아요 게시글 보기');
    const { userId } = res.locals.user;
    const posts = await Likes.findAll({
      where: {userId},
      order : [
        ['likes', 'desc'], ['createdAt', 'desc']
      ],
      include: [
        {
          model: Users,
          attributes: ['nickname'],
        },
        {
          model: Posts,
          where: { postId: Sequelize.col('Likes.postId') },
          attributes: [],
          require: true,
        }
      ],
      attributes: [
        'postId', 'userId', 'title', 'content', 'createdAt', 'updatedAt',
        [Sequelize.fn('COUNT', Sequelize.col('Likes.likeId')), 'likes'],
      ],
      group: ['Posts.postId'],
      raw: true,
    });
    posts.map((post) => {
      post.nickname = post['User.nickname'];
      delete post['User.nickname'];
    });
    return res.status(200).json({ "posts": posts });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ errorMessage: "좋아요 게시글 조회에 실패하였습니다." });
  }
});

router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    // const post = await Post.findOne({ _id: req.params.postId });
    const post = await Posts.findOne({
      include: [
        {
          model: Users,
          attributes: ['nickname'],
          // where: { userId: Sequelize.col('Posts.userId') }
        },{
          model: Likes,
          attributes: [],
          where: { postId: Sequelize.col('Posts.postId') },
          require: false,
        },
      ],
      where: { postId },
      attributes: [
        'postId', 'userId', 'title', 'content', 'createdAt', 'updatedAt',
        [Sequelize.fn('COUNT', Sequelize.col('Likes.likeId')), 'likes'],
      ],
      raw: true,
    });
    if (!post) {
      return res.status(404).json({ errorMessage: '게시글이 존재하지 않습니다.'});
    }
    post.nickname = post['User.nickname'];
    delete post['User.nickname'];
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
      res.json({ message: '게시글을 삭제하였습니다.' });
    } else {
      res.status(403).json({ errorMessage: "게시글의 삭제 권한 존재하지 않습니다." });
    }
  } catch (error) {
    console.error(error);
    return res.status(400).json({ errorMessage: "게시글 삭제에 실패하였습니다." });
  }
});

// 좋아요 등록, 취소
router.put('/:postId/like', authMiddleware, async (req, res) => {
  try {
    console.log('좋아요 등록하기');
    const { postId } = req.params;
    const { userId } = res.locals.user;

    const post = await Posts.findOne({
      where: { postId },
    });

    if (!post) {
      return res.status(404).json({ errorMessage: "게시글이 존재하지 않습니다." });
    }

    // Likes에 row가 있는지 판별
    const like = await Likes.findOne({
      where: { userId, postId },
      attributes: ['likeId'],
    });

    if (like) {
      await Likes.destroy({
        where: {
          [Op.and]: [{ userId, postId }] // 게시글의 비밀번호와, postId가 일치할 때, 수정한다.
        },
      });
      return res.status(200).json({ message: '게시글에 좋아요를 취소하였습니다.' });
    } else {
      await Likes.create({ userId, postId });
      return res.status(200).json({ message: '게시글에 좋아요를 등록하였습니다.' });
    }

  } catch (error) {
    console.error(error);
    return res.status(400).json({ errorMessage: "게시글 좋아요에 실패하였습니다." });
  }
});

module.exports = router;