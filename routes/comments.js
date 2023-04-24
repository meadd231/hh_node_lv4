const express = require('express');
const Post = require('../schemas/post');
const Comment = require('../schemas/comment');
const authMiddleware = require("../middlewares/auth-middleware");
const router = express.Router();

router.post('/:postId/comments', authMiddleware, async (req, res) => {
	try {
		const postId = req.params.postId;
		const user = res.locals.user;
		const { comment } = req.body;
		if (!comment) {
			res.status(412).json({ errorMessage: "데이터 형식이 올바르지 않습니다." });
		}
		const new_comment = new Comment({ userId: user._id, nickname: user.nickname, postId, comment });
		const post = await Post.findOne({ _id: postId });

		if (!post) {
			res.status(404).json({ errorMessage: "게시글이 존재하지 않습니다." });
		}

		await new_comment.save();
		res.status(200).json({ message: '댓글을 생성하였습니다.' });
	} catch (error) {
		console.error(error);
		res.status(400).json({ errorMessage: "댓글 작성에 실패하였습니다." });
	}
});

router.get('/:postId/comments', async (req, res) => {
	try {
		const postId = req.params.postId;
		const post = await Post.find({ _id: postId }).sort("-createdAt").exec();

		if (!post) {
			res.status(404).json({ errorMessage: "게시글이 존재하지 않습니다." });
		}

		const comments = await Comment.find({ postId });
		res.status(200).json({ "comments": comments });
	} catch (error) {
		console.error(error);
		res.status(400).json({ errorMessage: "댓글 조회에 실패하였습니다." });
	}
});

router.put('/:postId/comments/:commentId', authMiddleware, async (req, res) => {
	try {
		console.log(req.params);
		const { postId, commentId } = req.params;
		console.log(postId, commentId);
		// const postId = req.params.postId;
		// const commentId = req.params.commentId;
		const user = res.locals.user;
		const { comment } = req.body;
		if (!comment) {
			res.status(412).json({ errorMessage: "데이터 형식이 올바르지 않습니다." });
		}
		const post = await Post.findOne({ _id: postId });

		if (!post) {
			res.status(404).json({ errorMessage: "게시글이 존재하지 않습니다." });
		}

		const target_comment = await Comment.findOne({ _id: commentId });
		if (target_comment.userId == user._id) {
			await Comment.updateOne({ _id: commentId }, { $set: { comment, updatedAt: Date.now() } });
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
		const postId = req.params.postId;
		const commentId = req.params.commentId;
		const user = res.locals.user;
		const post = await Post.findOne({ _id: postId });

		if (!post) {
			res.status(404).json({ errorMessage: "게시글이 존재하지 않습니다." });
		}

		const target_comment = await Comment.findOne({ _id: commentId });
		if (target_comment.userId == user._id) {
			await Comment.deleteOne({ _id: commentId });
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