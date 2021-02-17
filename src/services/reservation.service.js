import firebase from "../firebase";

const db = firebase.ref("/reservation");
const a = firebase.ref("/clients")
const totalPeople = firebase.ref("/totalPersonas")

class ReservationDataService {
  getAll() {
    return db;
  }

  getLast() {
    a.orderByChild("id")
    .limitToLast(1).once("value", function(snapshot) {
      console.log('snaps', snapshot.val());
    }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
    });
    // return a.orderByChild("id").limitToLast(1);
  }

  create(reservation) {
    return db.push(reservation);
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

  createTotal(value) {
    return totalPeople.push(value);
  }

  getTotal() {
    return totalPeople;
  }

  updateTotal(key, value) {
    return totalPeople.child(key).update(value);
  }
}

export default new ReservationDataService();
