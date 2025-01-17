const express = require("express");
const app = express();
const port = 3300;

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: __dirname });
});

app.get("/log", (req, res) => {
  res.send("Hello from the server!");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
