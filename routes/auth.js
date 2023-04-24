const express = require('express');
const jwt = require("jsonwebtoken");
const User = require("../schemas/user");
const { Users } = require('../models');
const router = express.Router();

// 회원가입
router.post("/signup", async (req, res) => {
	try {
        console.log(req.body);
		const { nickname, password, confirm } = req.body;
        console.log(nickname, password, confirm);
		// 닉네임 형식 검사
		const nicknameRegex = /^[a-zA-Z0-9]{3,}$/;
		if (!nicknameRegex.test(nickname)) {
			return res.status(412).json({ errorMessage: '닉네임의 형식이 일치하지 않습니다.' });
		}

		// 비밀번호 형식 검사
		const passwordRegex = /^[a-zA-Z0-9!@#$%^&*()_+]{4,}$/;
		if (!passwordRegex.test(password)) {
			return res.status(412).json({ errorMessage: '패스워드 형식이 일치하지 않습니다.' });
		}

		// 비밀번호에 닉네임이 포함되어 있는지 검사
		if (password.includes(nickname)) {
			return res.status(412).json({ errorMessage: '패스워드에 닉네임이 포함되어 있습니다.' });
		}

		// 비밀번호와 비밀번호 확인 일치 여부 검사
		if (password !== confirm) {
			return res.status(412).json({ errorMessage: '패스워드가 일치하지 않습니다.' });
		}

		const userTest = await Users.findOne({
			where: { nickname },
			attributes: ['userId', 'nickname']
		});
		// 중복된 닉네임인지 검사
		if (userTest) {
			return res.status(412).json({ errorMessage: '중복된 닉네임입니다.' });
		}

		// 회원 정보 저장
		// await new User({ nickname, password }).save();
		await Users.create({ nickname, password });

		// 회원가입 완료 응답
		return res.status(201).json({ message: '회원 가입에 성공하였습니다.' });
	} catch (error) {
		console.error(error);
	}
});

// 로그인
router.post("/login", async (req, res) => {
	try {
		const { nickname, password } = req.body;
		const user = await Users.findOne({
			where: { nickname, password },
			attributes: ['userId']
		});
		if (!user) {
			res.status(412).json({ errorMessage: "닉네임 또는 패스워드를 확인해주세요." });
		}
		const token = jwt.sign({ userId: user.userId }, "secret_key_hh_node_js");
		console.log(token);
		res.cookie("Authorization", `Bearer ${token}`);
		res.status(200).json({ token: token });

		// 로그인 성공한 경우
	} catch (error) {
		res.status(400).json({ errorMessage: "로그인에 실패하였습니다." });
	}
});

module.exports = router;