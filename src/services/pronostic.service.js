import firebase from "../firebase";

const db = firebase.ref("/pronosticos");
const equipos = firebase.ref("/equipos");
const fechas = firebase.ref("/fechas");

class PronosticDataService {
  getPronos() {
    return db;
  }

  getEquipos() {
    return equipos;
  }

  getFechas() {
    return fechas;
  }

  create(pronos) {
    return db.push(pronos);
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

export default new PronosticDataService();
