import firebase from "../firebase";

const db = firebase.ref("/gastos-max");

class GastosMaxDataService {
    getAll() {
        return db;
    }

    create(gasto) {
        return db.push(gasto);
    }

    update(key, value) {
        return db.child(key).update(value);
    }

    delete(key) {
        return db.child(key).remove();
    }
}

export default new GastosMaxDataService();
