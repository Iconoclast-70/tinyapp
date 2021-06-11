//return user object based upon user email ***************************
function getUserByEmail(email, database){
  const userKeys = Object.keys(database);
  for (user of userKeys){
    if (database[user].email === email){
      return user;
    }
  }
  return null;
};

module.exports = { getUserByEmail };