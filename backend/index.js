require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

const userRouter = require("./routes/user");
const storeRouter = require("./routes/store");

app.use(express.json());

app.use("/api/users", userRouter);
app.use("/api/stores", storeRouter);

app.listen(PORT, () => {
  console.log(`Server started on ${PORT}`);
});
