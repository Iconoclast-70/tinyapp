const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

//initialize the server object
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

//generate random string for ids *************************
function generateRandomString() {
  return Math.random().toString(36).replace('0.', '').slice(5);
}

//USER OBJECT DATABASE ***********************************************
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

//return user object based upon user email ***************************
function getUserByEmail(email){
  const userKeys = Object.keys(users);
  for (user of userKeys){
    if (users[user].email === email){
      return user;
    }
  }
  return null;
};

//URL DATABASE ************************************************************
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// URL End Routes**************************************************************************** */
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const reqLongURL = req.body.longURL;
  urlDatabase[shortURL] = reqLongURL;
  res.redirect("/urls/" + shortURL);     
});

app.get("/urls/new", (req, res) => {
  const currentUser = users[req.cookies.user_id];
  const templateVars = {urls: urlDatabase, user: currentUser};
  res.render("urls_new", templateVars);
});

app.get("/urls", (req, res) => {
  const currentUser = users[req.cookies.user_id];
  const templateVars = { urls: urlDatabase, user: currentUser};
  res.render("urls_index", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//TEST End Routes *********************************************************************
/*
app.get("/", (req, res) => {
  const templateVars = {user: users};
  console.log(`first incoming request for ${req.method} ${req.url}`);
  res.send("Hello!");
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

 */

// ******** Registration end routes *************************************************

app.get("/register", (req,res) => {
  const templateVars = {user: users};
  res.render("register", templateVars)
});

app.post("/register", (req,res) => {

  const email = req.body.email;
  const password = req.body.password;
  const id = generateRandomString();

  if (email === "" || password === "") {
    console.log("empty");
    res.status(400).send('Email or Password cannot be blank');
  }

  if (getUserByEmail(email)) {
    res.status(400).send('Email already exists');
  }
  
  if ( !getUserByEmail(email) && (email !== "" && password !== "") ) {
      console.log("all clear");
      const user = {id, email, password};
      users[id] = user;
      res.cookie('user_id', user.id);
      res.redirect("/urls");
  }
  
});

// ******** login / logout end routes ********************************************************

app.get("/login", (req,res) => {
  const currentUser = users[req.cookies.user_id];
  const templateVars = {user: currentUser};
  res.render("login", templateVars);
});

app.post("/login", (req,res) => {

  const currentUser = getUserByEmail(req.body.email);

  if (!currentUser) {
    return res.status(403).send("User Not Found");
  }

  if ((users[currentUser].password !== req.body.password)) {
    return res.status(403).send("Password does not match");
  } 
  
  if (currentUser) {
    res.cookie("user_id",users[currentUser].id);
    res.redirect("/urls/"); 
  }

});

app.post("/logout", (req,res) => {
 res.clearCookie("user_id");
 res.redirect("/urls");
});

  // ******** Short URL end routes**************************************************** //

 app.get("/urls/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL]; 
  const currentUser = users[req.cookies.user_id];
  const templateVars = { shortURL: req.params.shortURL, longURL: longURL, user: currentUser };
  res.render("urls_show", templateVars);
});

//Delete URL
app.post("/urls/:shortURL/delete", (req,res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");   
});
//*********************************************************************************** //

//Edit URL
app.post("/urls/:shortURL", (req,res) => {
  const longURL = req.body.longURL;
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = longURL;
  res.redirect("/urls");
});

// ******** Redirection to longURL from the show page
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// ******** logging to console for the server listening on port 8080
app.listen(PORT, () => {
  //App listening on port 8080
  console.log(`Example app listening on port ${PORT}!`);
});