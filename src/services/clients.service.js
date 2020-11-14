import firebase from "../firebase";

const db = firebase.ref("/clients");

class ClientsDataService {
  getAll() {
    return db;
  }

  create(clients) {
    return db.push(clients);
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

export default new ClientsDataService();
