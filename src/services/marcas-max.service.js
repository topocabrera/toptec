import firebase from "../firebase";

const db = firebase.ref("/marcas_max");

class MarcasDataService {
  getAll() {
    return db;
  }

  create(marca) {
    return db.push(marca);
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

export default new MarcasDataService();
