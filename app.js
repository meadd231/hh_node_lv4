const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output");

const indexRouter = require("./routes");
const postsRouter = require("./routes/posts");
const commentsRouter = require("./routes/comments");
const authRouter = require("./routes/auth");

const app = express();
const port = 3000;

app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerFile));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(bodyParser.text());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/", [indexRouter, authRouter]);
app.use("/posts", [postsRouter, commentsRouter]);

app.listen(port, () => {
  console.log(port, "포트로 서버가 열렸어요!");
});
