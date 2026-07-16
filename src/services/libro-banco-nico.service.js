import firebase from "../firebase";

const db = firebase.ref("/libroBanco-nico");

class LibroBancoNicoDataService {
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

export default new LibroBancoNicoDataService();
