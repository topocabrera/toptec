import firebase from "../firebase";

const db = firebase.ref("/users");

class UsersDataService {
  getAll() {
    return db;
  }

  getUser(email) {
    db.orderByChild("email")
    .equalTo(email)
    .once("child_added")
    .then((snapshot) => {
      const data = snapshot.val();
      return data;
    })
  }

  create(user) {
    return db.push(user);
  }

  update(key, value) {
    return db.child(key).update(value);
  }

  delete(key) {
    return db.child(key).remove();
  }

  deleteAll() {
    return db.remove();
  }
}

export default new UsersDataService();
