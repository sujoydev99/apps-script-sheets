const mysql = require("mysql");
const config = {
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
};

exports.handler = async (event, context, callback) => {
  try {
    let db = new Database(config);
    let body = null;
    if (event.body) body = JSON.parse(event.body);
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
        let startDate = new Date(),
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
          "insert into programUserSubscription(user_token, invoice_number, subscription_id, coupon_id, order_id, payment_type, device, subscription_order_id, percentage, total_amount, discount_amount, amount, gst, duration, status, start_date_time, end_date_time, type, show_status, razorpay_reference, address, razorpay_signature, razorpay_payment_id, razorpay_order_id) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
          [
            user[0].user_token,
            "",
            subscription[0].id,
            0,
            body["Order ID"],
            1,
            "web",
            "",
            0,
            0,
            0,
            parseInt(body.amount),
            0,
            subscription[0].period,
            "success",
            startDate,
            endDate,
            body.amount === 0 ? "free" : "paid",
            1,
            "",
            "",
            "",
            body["payment page id"],
            body["Order ID"],
          ]
        );
        REST_response(
          {
            status: "updated",
            id: userSubscription.insertId,
          },
          callback
        );
      } else {
        REST_response(
          {
            status: "no plan",
          },
          callback
        );
      }
    } else {
      REST_response(
        {
          status: "no login",
        },
        callback
      );
    }
  } catch (error) {
    console.log(error);
    REST_response(
      {
        message: "An error occured!",
      },
      callback
    );
  }
};

function REST_response(res, callback) {
  var response = {
    statusCode: 200,
    headers: {},
    body: JSON.stringify(res),
    isBase64Encoded: false,
  };
  callback(null, response);
}

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
