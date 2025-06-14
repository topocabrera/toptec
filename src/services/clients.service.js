import firebase from "../firebase";

const db = firebase.ref("/clients");
const dbSeguros = firebase.ref("/clients_seguros");

class ClientsDataService {
  getAll() {
    return db;
  }

  getSeguros() {
    return dbSeguros;
  }

  createClientSeguro(clients) {
    return dbSeguros.push(clients);
  }

  updateClientSeguro(key, value) {
    return dbSeguros.child(key).update(value);
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
