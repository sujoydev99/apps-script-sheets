const mysql = require("mysql");
const config = {
  host: "localhost",
  user: "root",
  password: "",
  database: "sarva",
};

exports.handler = async (req) => {
  try {
    let db = new Database(config);
    let body = null;
    if (req.body) body = JSON.parse(req.body);

    let user = await db.query(
      "SELECT * from user where email like ? or mobile_number like ?",
      [body.email, body.phone]
    );
    if (user.length > 0) {
      let subscription = await db.query(
        "select * from programSubscription where amount = ? and status = 1 limit 1",
        [body.amount]
      );
      if (subscription.length > 0) {
        var d = new Date(body["payment date"]);
        d.setMonth(d.getMonth() + subscription[0].period);
        let userSubscription = await db.query(
          "insert into programUserSubscription(user_token, subscription_id, amount, order_id, device, status, type, start_date_time, end_date_time, razorpay_payment_id, razorpay_order_id, invoice_number, coupon_id, payment_type,subscription_order_id, percentage, total_amount,discount_amount, gst, duration,razorpay_reference,razorpay_signature, lattitude, longitude, state, city, address) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
          [
            user[0].user_token,
            subscription[0].id,
            parseInt(body.amount),
            body["Order ID"],
            "web",
            "success",
            body.amount === 0 ? "free" : "paid",
            new Date(body["payment date"]),
            d,
            body["payment page id"],
            body["Order ID"],
            "",
            0,
            1,
            "",
            0,
            0,
            0,
            0,
            body.period,
            "",
            "",
            "",
            "",
            "",
            "",
            "",
          ]
        );
        return {
          status: "updated",
          id: userSubscription.insertId,
        };
      } else {
        return {
          status: "no plan",
        };
      }
    } else {
      return {
        status: "no login",
      };
    }
  } catch (error) {
    return {
      message: "An error occured!",
    };
  }
};

class Database {
  constructor(config) {
    this.connection = mysql.createConnection(config);
  }
  query(sql, args) {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, args, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }
  close() {
    return new Promise((resolve, reject) => {
      this.connection.end((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
}
