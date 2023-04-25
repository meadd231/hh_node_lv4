const express = require('express');
const Post = require('../schemas/post');
const Comment = require('../schemas/comment');
const { Posts, Users, Comments } = require('../models');
const { Op } = require('sequelize');
const Sequelize = require('sequelize');
const authMiddleware = require("../middlewares/auth-middleware");
const router = express.Router();

router.post('/:postId/comments', authMiddleware, async (req, res) => {
	try {
		const { postId } = req.params;
		const { userId } = res.locals.user;
		const { comment } = req.body;
		if (!comment) {
			res.status(412).json({ errorMessage: "데이터 형식이 올바르지 않습니다." });
		}
		const post = await Posts.findOne({
			where: { postId }
		});

		if (!post) {
			res.status(404).json({ errorMessage: "게시글이 존재하지 않습니다." });
		}

		await Comments.create({ userId, postId, comment });
		res.status(200).json({ message: '댓글을 생성하였습니다.' });
	} catch (error) {
		console.error(error);
		res.status(400).json({ errorMessage: "댓글 작성에 실패하였습니다." });
	}
});

router.get('/:postId/comments', async (req, res) => {
	try {
		const { postId } = req.params;
		// const post = await Post.find({ _id: postId }).sort("-createdAt").exec();
		const post = await Posts.findOne({
			where: { postId }
		});

		if (!post) {
			res.status(404).json({ errorMessage: "게시글이 존재하지 않습니다." });
		}

		// const comments = await Comment.find({ postId });
		const comments = await Comments.findAll({
			order: [
				['createdAt', 'desc']
			],
			include: {
				model: Users,
				attributes: ['nickname'],
				// where: { userId: Sequelize.col('Posts.userId') }
			},
			attributes: ['commentId, userId, postId, comment, createdAt, updatedAt'],
		});
		res.status(200).json({ "comments": comments });
	} catch (error) {
		console.error(error);
		res.status(400).json({ errorMessage: "댓글 조회에 실패하였습니다." });
	}
});

router.put('/:postId/comments/:commentId', authMiddleware, async (req, res) => {
	try {
		const { postId, commentId } = req.params;
		const { userId } = res.locals;
		const { comment } = req.body;
		if (!comment) {
			res.status(412).json({ errorMessage: "데이터 형식이 올바르지 않습니다." });
		}
		const post = await Posts.findOne({
			where: { postId }
		});

		if (!post) {
			res.status(404).json({ errorMessage: "게시글이 존재하지 않습니다." });
		}

		const target_comment = await Comments.findOne({
			where: { commentId }
		});
		if (target_comment.userId == userId) {
			// await Comment.updateOne({ _id: commentId }, { $set: { comment, updatedAt: Date.now() } });
			await Comments.update(
				{ comment, updatedAt: Date.now() },
				{
					where: { commentId }
				}
			);
			res.status(200).json({ message: '댓글을 수정하였습니다.' });
		} else {
			res.status(403).json({ errorMessage: "댓글의 수정 권한이 존재하지 않습니다." });
		}
	} catch (error) {
		console.error(error);
		res.status(400).json({ errorMessage: "댓글 수정에 실패하였습니다." });
	}
});

router.delete('/:postId/comments/:commentId', authMiddleware, async (req, res) => {
	try {
		const { postId, commentId } = req.params;
		const { userId } = res.locals;
		const post = await Posts.findOne({
			where: { postId }
		});

		if (!post) {
			res.status(404).json({ errorMessage: "게시글이 존재하지 않습니다." });
		}

		const target_comment = await Comment.findOne({ _id: commentId });
		if (target_comment.userId == userId) {
			await Comments.destroy({
				where: { commentId }
			});
			res.status(200).json({ message: '댓글을 삭제하였습니다.' });
		} else {
			res.status(403).json({ errorMessage: "댓글의 삭제 권한이 존재하지 않습니다." });
		}
	} catch (error) {
		console.error(error);
		res.status(400).json({ errorMessage: "댓글 삭제에 실패하였습니다." });
	}
});


module.exports = router;