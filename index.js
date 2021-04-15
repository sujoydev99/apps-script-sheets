const mysql = require("mysql");
const config = {
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
};

exports.handler = async (req) => {
  try {
    let db = new Database(config);
    let body = null;
    if (req.body) body = JSON.parse(req.body);
    // verify if user exists, if not, return status= "no login"
    let user = await db.query(
      "SELECT * from user where email like ? or mobile_number like ?",
      [body.email, body.phone]
    );
    if (user.length > 0) {
      // verify if the program exists, if not, return status= "no plan"
      let subscription = await db.query(
        "select * from programSubscription where amount = ? and status = 1 limit 1",
        [body.amount]
      );
      if (subscription.length > 0) {
        // verify if a user subscription exists, if not, return status= "no login"
        // if curdate => last end date =>> new start_date=curdate & end_date = curdate+months_or_days [1]
        // if curdate < last_end_date =>> new start date= curdate & end_date = last end_date+months_or_days [2]
        let subscribedPrograms = await db.query(
          "select * from programUserSubscription where user_token = ? and end_date_time > CURDATE() order by id desc limit 1",
          [user[0].user_token]
        );
        let startDate,
          endDate = new Date(); // [2]
        // if an ongoing subscription exists then set end_date_time for the new subscription= ongoing_enddate + new_subscription_period
        if (subscribedPrograms.length > 0) {
          endDate = new Date(subscribedPrograms[0].end_date_time); // [1]
        }
        let type = subscription[0].type;
        // add months to the subscription
        if (type === 1)
          endDate.setMonth(endDate.getMonth() + subscription[0].period);
        // add days to the subscription
        else if (type === 2)
          endDate.setDate(endDate.getDate() + subscription[0].period);

        // on successful insertion return status= "updated"
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
            startDate,
            endDate,
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
    console.log(error);
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
