import firebase from "../firebase";

const db = firebase.ref("/libroBanco");

class LibroBancoDataService {
  getAll() {
    return db;
  }

  create(movimiento) {
    return db.push(movimiento);
  }

  update(key, value) {
    return db.child(key).update(value);
  }

  delete(key) {
    return db.child(key).remove();
  }
}

export default new LibroBancoDataService();
