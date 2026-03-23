import firebase from "../firebase";

const db = firebase.ref("/compras-max");

class ComprasMaxDataService {
  getAll() {
    return db;
  }

  create(compra) {
    return db.push(compra);
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

export default new ComprasMaxDataService(); 