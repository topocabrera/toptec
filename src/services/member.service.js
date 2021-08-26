import firebase from "../firebase";

const db = firebase.ref("/member");

class MemberDataService {
  getAll() {
    return db;
  }

  create(member) {
    return db.push(member);
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

export default new MemberDataService();
