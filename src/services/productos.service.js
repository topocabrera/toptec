import firebase from "../firebase";

const db = firebase.ref("/productos");

class ProductosDataService {
  getAll() {
    return db;
  }

  create(producto) {
    return db.push(producto);
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

export default new ProductosDataService();
