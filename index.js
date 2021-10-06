const express = require("express");
const cors = require("cors");
const path = require("path");

const routes = require("./src/routes");
const cache = require("./src/middlewares/cache");
const errorHandler = require("./src/middlewares/errorHandler");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(cache());
app.use("/api/v1", routes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log("Listening at", PORT);
});
