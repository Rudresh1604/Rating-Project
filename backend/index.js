require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 30000;

const userRouter = require("../backend/routes/user");

app.use(express.json());

app.use("/api/users", userRouter);

app.listen(PORT, () => {
  console.log(`Server started on ${PORT}`);
});
