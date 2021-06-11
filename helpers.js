//return user id based upon user email ***************************
function getUserByEmail(email, database) {
  const userKeys = Object.keys(database);
  for (const user of userKeys) {
    if (database[user].email === email) {
      return user;
    }
  }
  return null;
}
module.exports = getUserByEmail;
