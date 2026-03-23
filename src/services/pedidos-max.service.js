import firebase from "../firebase";

const db = firebase.ref("/pedidos-max");

class PedidosMaxDataService {
  getAll() {
    return db;
  }

  create(pedido) {
    return db.push(pedido);
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

export default new PedidosMaxDataService(); 