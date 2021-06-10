const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
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

function currentUserURLS(id) {
  let userURLSArray = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userURLSArray[url] = { longURL: urlDatabase[url].longURL, userID: urlDatabase[url].userID };
    }
  }
  return userURLSArray;
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
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
};

// URL End Routes**************************************************************************** */
app.post("/urls", (req, res) => {
  if (req.cookies.user_id !== "" || req.cookies.user_id !== undefined) {
    const shortURL = generateRandomString();
    const reqLongURL = req.body.longURL;
    const newURL = { longURL: reqLongURL, userID: req.cookies.user_id };
    urlDatabase[shortURL] = newURL;
    res.redirect("/urls/" + shortURL);  
  }  
});

app.get("/urls/new", (req, res) => { 
  if (req.cookies.user_id === "" || req.cookies.user_id === undefined) {
    res.redirect("/login"); 
  } else {
    const currentUser = users[req.cookies.user_id];
    const templateVars = {urls: urlDatabase, user: currentUser};
    res.render("urls_new", templateVars);
  }
});

app.get("/urls", (req, res) => {
  const currentUser = users[req.cookies.user_id];
  let filteredURLS = {};
  if (req.cookies.user_id !== "" || req.cookies.user_id !== undefined) {
    filteredURLS = currentUserURLS(req.cookies.user_id);
    const templateVars = { urls: filteredURLS, user: currentUser};
    res.render("urls_index", templateVars);
  } else {
    const templateVars = { urls: urlDatabase, user: currentUser};
    res.render("urls_index", templateVars);
  }
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
      let user = {};
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, (err, hash) => {
          user = {id, email, password: hash};
          users[id] = user;
          console.log(users);
          res.cookie('user_id', user.id);
          res.redirect("/urls");
        });
      });
  }
  console.log(users);
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
    return res.status(403).send("User Not Found");ƒ
  }

  console.log(req.body.password,currentUser);
  bcrypt.compare(req.body.password, users[currentUser].password, (err, result) => {
    if (!result) {
      // if the passwords don't match, send back an error response
      return res.status(403).send('password is not correct');
    }

    if (currentUser) {
      res.cookie("user_id",users[currentUser].id);
      res.redirect("/urls/"); 
    }

  });

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
  if (req.cookies.user_id !== "" || req.cookies.user_id !== undefined) {
    const shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];
    res.redirect("/urls");   
  }
});
//*********************************************************************************** //

//Edit URL
app.post("/urls/:shortURL", (req,res) => {
  if (req.cookies.user_id !== "" || req.cookies.user_id !== undefined) {
    const currentURLS = currentUserURLS(req.cookies.userid);
    const keys = Object.keys(currentURLS);
    if (keys.includes(req.params.shortURL)) {
      const reqLongURL = req.body.longURL;
      const shortURL = req.params.shortURL;
      const editedURL = { longURL: reqLongURL, userID: req.cookies.user_id };
      urlDatabase[shortURL] = editedURL;
      res.redirect("/urls");
    }
  }
});

// ******** Redirection to longURL from the show page
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// ******** logging to console for the server listening on port 8080
app.listen(PORT, () => {
  //App listening on port 8080
  console.log(`Example app listening on port ${PORT}!`);
});