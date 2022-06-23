import firebase from "../firebase";

const db = firebase.ref("/turnos");

class TurnosDataService {
  getAll() {
    return db;
  }

  create(turnos) {
    return db.push(turnos);
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

export default new TurnosDataService();
