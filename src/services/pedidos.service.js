import firebase from "../firebase";

const db = firebase.ref("/pedidos");

class PedidosDataService {
  getAll() {
    return db;
  }

  create(pedidos) {
    return db.push(pedidos);
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

export default new PedidosDataService();
