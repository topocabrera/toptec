import firebase from "../firebase";

const db = firebase.ref("/cuentasBancarias-max");

class CuentasBancoMaxDataService {
  getAll() {
    return db;
  }

  get(key) {
    return db.child(key);
  }

  create(value) {
    return db.push(value);
  }

  update(key, value) {
    return db.child(key).update(value);
  }

  delete(key) {
    return db.child(key).remove();
  }
}

export default new CuentasBancoMaxDataService();
