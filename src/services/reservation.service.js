import firebase from "../firebase";

const db = firebase.ref("/reservation");
const a = firebase.ref("/clients")

class ReservationDataService {
  getAll() {
    // console.log(a.orderByChild("id").limitToLast(1));
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
}

export default new ReservationDataService();
