const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

app.use(cookieParser());

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

function generateRandomString() {
  return Math.random().toString(36).replace('0.', '').slice(5);
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//Add URL
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const reqLongURL = req.body.longURL;
  urlDatabase[shortURL] = reqLongURL;
  res.redirect("/urls/" + shortURL);     
});

app.get("/urls/new", (req, res) => {
  const templateVars = {urls: urlDatabase, username: req.cookies.username};
  res.render("urls_new", templateVars);
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies.username};
  res.render("urls_index", templateVars);
});

app.get("/", (req, res) => {
  const templateVars = {username: req.cookies.username};
  console.log(`first incoming request for ${req.method} ${req.url}`);
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  const templateVars = {username: req.cookies.username};
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  const templateVars = {username: req.cookies.username};
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/set", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
 });
 
 app.get("/fetch", (req, res) => {
  res.send(`a = ${a}`);
 });

 app.post("/login", (req,res) => {
   res.cookie("username", req.body.username);
   res.render("urls_index", {urls: urlDatabase, username: req.body.username});
   //const cookie = req.cookie = req.us
 });

 app.post("/logout", (req,res) => {
  res.clearCookie("username");
  res.render("urls_index", {urls: urlDatabase, username: req.body.username});
 });

 app.get("/urls/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL]; 
  const templateVars = { shortURL: req.params.shortURL, longURL: longURL,  username: req.cookies.username};
  res.render("urls_show", templateVars);
});

//Delete URL
app.post("/urls/:shortURL/delete", (req,res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");   
});

//Edit URL
app.post("/urls/:shortURL", (req,res) => {
  const longURL = req.body.longURL;
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = longURL;
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});


app.listen(PORT, () => {
  //App listening on port 8080
  console.log(`Example app listening on port ${PORT}!`);
});