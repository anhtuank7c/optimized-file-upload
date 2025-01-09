import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "ejs");

app.get('/', (req, res) => {
  res.render('index', {})
});

app.listen(port, () => {
  return console.log(`http://localhost:${port}`);
});
