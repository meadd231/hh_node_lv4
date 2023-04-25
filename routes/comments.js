const express = require("express");
const { Posts, Comments } = require("../models");
const { Op } = require("sequelize");
const Sequelize = require("sequelize");
const authMiddleware = require("../middlewares/auth-middleware");
const router = express.Router();

router.post("/:postId/comments", authMiddleware, async (req, res) => {
  console.log("\u001b[1;34m POST /:postId/comments\u001b[0m");

  const { userId, nickname } = res.locals.user;
  const { postId } = req.params;

  const post = await Posts.findOne({ where: { postId } }).catch((err) => {
    return res.status(400).json({ errorMessage: "댓글 작성에 실패했습니다." });
  });

  // 댓글을 작성할 게시글이 존재하지 않는 경우
  if (!post) {
    return res
      .status(404)
      .json({ errorMessage: "게시글이 존재하지 않습니다." });
  }

  const { comment } = req.body;

  // 데이터가 정상적으로 전달되지 않는 경우
  if (Object.keys(req.body).length !== 1 || comment === undefined) {
    return res
      .status(412)
      .json({ errorMessage: "데이터 형식이 올바르지 않습니다." });
  }

  // 댓글이 비어있는 경우
  if (comment === "") {
    return res.status(400).json({ errorMessage: "댓글 내용을 입력해주세요." });
  }

  await Comments.create({
    userId,
    nickname,
    postId,
    comment,
  }).catch((err) => {
    return res.status(400).json({ errorMessage: "댓글 작성에 실패했습니다." });
  });

  res.status(201).json({ message: "댓글 작성에 성공했습니다." });
});

router.get("/:postId/comments", async (req, res) => {
  console.log("\u001b[1;32m GET /:postId/comments\u001b[0m");

  const { postId } = req.params;

  const comments = await Comments.findAll({
    attributes: {
      exclude: ["postId"],
      order: [["createdAt", "DESC"]],
    },
    where: { postId },
  }).catch((err) => {
    return res.status(400).json({ errorMessage: "댓글 조회에 실패했습니다." });
  });

  if (!comments.length) {
    return res.status(404).json({ errorMessage: "댓글이 존재하지 않습니다." });
  }

  res.status(200).json({ comments });
});

router.put("/:postId/comments/:commentId", authMiddleware, async (req, res) => {
  console.log("\u001b[1;33m PUT /:postId/comments/:commentId\u001b[0m");

  const { userId } = res.locals.user;
  const { postId } = req.params;

  // 예외 케이스에서 처리하지 못한 에러
  const post = await Posts.findOne({ where: { postId } }).catch((err) => {
    return res.status(400).json({ errorMessage: "댓글 수정에 실패했습니다." });
  });

  // 댓글을 수정할 게시글이 존재하지 않는 경우
  if (!post) {
    return res
      .status(404)
      .json({ errorMessage: "게시글이 존재하지 않습니다." });
  }

  const { commentId } = req.params;

  // 예외 케이스에서 처리하지 못한 에러
  const targetComment = await Comments.findOne({
    where: { commentId },
  }).catch((err) => {
    return res.status(400).json({ errorMessage: "댓글 수정에 실패했습니다." });
  });

  // 댓글이 존재하지 않는 경우
  if (!targetComment) {
    return res.status(404).json({ errorMessage: "댓글이 존재하지 않습니다." });
  }

  // 댓글의 수정 권한이 존재하지 않는 경우
  if (userId !== targetComment.userId) {
    return res
      .status(403)
      .json({ errorMessage: "댓글의 수정 권한이 존재하지 않습니다." });
  }

  const { comment } = req.body;

  // 데이터가 정상적으로 전달되지 않는 경우
  if (Object.keys(req.body).length !== 1 || comment === undefined) {
    return res
      .status(412)
      .json({ errorMessage: "데이터 형식이 올바르지 않습니다." });
  }

  // 댓글이 비어있는 경우
  if (comment === "") {
    return res.status(400).json({ errorMessage: "댓글 내용을 입력해주세요." });
  }

  // 댓글 수정에 실패한 경우
  await Comments.update(
    { comment, updatedAt: new Date() },
    { where: { commentId } }
  ).catch((err) => {
    return res
      .status(401)
      .json({ errorMessage: "댓글이 정상적으로 수정되지 않았습니다." });
  });

  res.status(200).json({ message: "댓글을 수정했습니다." });
});

router.delete(
  "/:postId/comments/:commentId",
  authMiddleware,
  async (req, res) => {
    console.log("\u001b[1;31m DELETE /:postId/comments/:commentId\u001b[0m");

    const { userId } = res.locals.user;
    const { postId } = req.params;

    // 예외 케이스에서 처리하지 못한 에러
    const post = await Posts.findOne({ where: { postId } }).catch((err) => {
      return res
        .status(400)
        .json({ errorMessage: "댓글 삭제에 실패했습니다." });
    });

    // 댓글을 삭제할 게시글이 존재하지 않는 경우
    if (!post) {
      return res
        .status(404)
        .json({ errorMessage: "게시글이 존재하지 않습니다." });
    }

    const { commentId } = req.params;

    // 예외 케이스에서 처리하지 못한 에러
    const targetComment = await Comments.findOne({
      where: { commentId },
    }).catch((err) => {
      return res
        .status(400)
        .json({ errorMessage: "댓글 삭제에 실패했습니다." });
    });

    // 댓글이 존재하지 않는 경우
    if (!targetComment) {
      return res
        .status(404)
        .json({ errorMessage: "댓글이 존재하지 않습니다." });
    }

    // 댓글의 삭제 권한이 존재하지 않는 경우
    if (userId !== targetComment.userId) {
      return res
        .status(403)
        .json({ errorMessage: "댓글의 삭제 권한이 존재하지 않습니다." });
    }

    // 댓글 삭제에 실패한 경우
    await Comments.destroy({ where: { commentId } }).catch((err) => {
      return res
        .status(401)
        .json({ errorMessage: "댓글이 정상적으로 삭제되지 않았습니다." });
    });

    res.status(200).json({ message: "댓글을 삭제했습니다." });
  }
);

module.exports = router;
