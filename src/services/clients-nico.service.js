import firebase from "../firebase";

const db = firebase.ref("/clientes-nico");

class ClientsNicoDataService {
  getAll() {
    return db;
  }

  create(client) {
    return db.push(client);
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

export default new ClientsNicoDataService();
