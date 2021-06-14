// REQUIRES ***************************************************************************//

const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const getUserByEmail = require("./helpers.js");
const app = express();
const PORT = 8080; // default port 8080

//initialize the server object *********************************************************//

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

//generate random string for ids *******************************************************//
function generateRandomString() {
  return Math.random().toString(36).replace('0.', '').slice(5);
}

//Filter the URL Database based on user_id cookie **************************************//
function currentUserURLS(id) {
  let userURLSArray = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userURLSArray[url] = { longURL: urlDatabase[url].longURL, userID: urlDatabase[url].userID };
    }
  }
  return userURLSArray;
}

//USER OBJECT DATABASE ******************************************************************//
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2a$10$ED8DvcoWW91XyKg9lKs3.u6atsrJ8B4vVrn15lc.ItFQ3clnWPhT2"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2a$10$Y6VZyQJGPGbHduWuwKNcUOw2D2g3On/Rx1utOzK..1NBFZa7FtjLq"
  }
};

//URL DATABASE ****************************************************************************//
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
};

// URL End Routes***************************************************************************/

// End Route for creating a new URL and adding it to urlDatabase **************************//
app.post("/urls", (req, res) => {

  if (req.session.user_id) {
    const shortURL = generateRandomString();
    const reqLongURL = req.body.longURL;
    const newURL = { longURL: reqLongURL, userID: req.session.user_id };
    urlDatabase[shortURL] = newURL;
    res.redirect("/urls/" + shortURL);
  } else {
    res.redirect("/login");
  }
});

// End Route for displaying the new URL page and adding it to urlDatabase *****************//
app.get("/urls/new", (req, res) => {

  if (req.session.user_id) {
    const currentUser = users[req.session.user_id];
    const templateVars = {urls: urlDatabase, user: currentUser};
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }

});

// End Route for displaying the URLs belonging the current logged in user= ****************//
app.get("/urls", (req, res) => {
  const currentUser = users[req.session.user_id];
  let filteredURLS = {};
  if (req.session.user_id) {
    filteredURLS = currentUserURLS(req.session.user_id);
    const templateVars = { urls: filteredURLS, user: currentUser};
    res.render("urls_index", templateVars);
  } else {
    const templateVars = { urls: urlDatabase, user: currentUser};
    res.render("urls_index", templateVars);
  }
});

// ******** Registration end routes ********************************************************//

app.get("/register", (req,res) => {
  const templateVars = {user: users};
  res.render("register", templateVars);
});

// Register a new User **********************************************************************//
app.post("/register", (req,res) => {

  //Get the email and password from the user and generate a random user id
  const email = req.body.email;
  const password = req.body.password;
  const id = generateRandomString();

  //If the email or password fields are blank, return an error message **********************//
  if (email === "" || password === "") {
    return res.status(400).send('Email or Password cannot be blank');
  }

  //Get the current user by the email entered ************************************************//
  if (getUserByEmail(email, users)) {
    return res.status(400).send('Email already exists');
  }
  
  //Register a new user **********************************************************************//
  if (!getUserByEmail(email, users) && (email !== "" && password !== "")) {
    let user = {};
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, (err, hash) => {
        user = {id, email, password: hash};
        users[id] = user;
        req.session.user_id = user.id;
        res.redirect("/urls");
      });
    });
  }
});

// ******** login / logout end routes *********************************************************//
app.get("/login", (req,res) => {
  const currentUser = users[req.session.user_id];
  const templateVars = {user: currentUser};
  res.render("login", templateVars);
});

app.post("/login", (req,res) => {
  const currentUser = getUserByEmail(req.body.email, users);
  if (!currentUser) {
    return res.status(403).send("User Not Found");
  }
  bcrypt.compare(req.body.password, users[currentUser].password, (err, result) => {
    if (!result) {
      return res.status(403).send('password is not correct');
    }
    if (currentUser) {
      req.session.user_id = users[currentUser].id;
      res.redirect("/urls/");
    }
  });
});
app.post("/logout", (req,res) => {
  req.session = null;
  res.redirect("/urls");
});

// ******** Short URL end routes****************************************************************//

app.get("/urls/:shortURL", (req, res) => {
  if (req.session.user_id) {
    let longURL = urlDatabase[req.params.shortURL];
    const currentUser = users[req.session.user_id];
    const templateVars = { shortURL: req.params.shortURL, longURL: longURL, user: currentUser };
    res.render("urls_show", templateVars);
  } else {
    return res.redirect("/login");
  }

});

//Delete URL ***********************************************************************************//
app.post("/urls/:shortURL/delete", (req,res) => {

  const urlKeys = Object.keys(currentUserURLS(req.session.user_id));
  if (urlKeys.includes(req.params.shortURL) === false) {
    return res.status(400).send('You are not authorized to delete URLs');
  }

  if (req.session.user_id) {
    const shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  }
});

//Edit URL **************************************************************************************//
app.post("/urls/:shortURL", (req,res) => {

  const urlKeys = Object.keys(currentUserURLS(req.session.user_id));
  if (urlKeys.includes(req.params.shortURL) === false) {
    return res.status(400).send('You are not authorized to edit URLs');
  }

  if (req.session.user_id) {
    const reqLongURL = req.body.longURL;
    const shortURL = req.params.shortURL;
    const editedURL = { longURL: reqLongURL, userID: req.session.user_id };
    urlDatabase[shortURL] = editedURL;
    res.redirect("/urls");
  } else {
    res.redirect("/login");
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

// TEST End Routes *******************************************************************************//

/*
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/", (req, res) => {
  const templateVars = {user: users};
  console.log(`first incoming request for ${req.method} ${req.url}`);
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  const templateVars = {username: req.session.username};
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/set", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
 });
 
 app.get("/fetch", (req, res) => {
  res.send(`a = ${a}`);
 }); */
