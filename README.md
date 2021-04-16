# About

apps script for G-sheets proccess automation

## how to deploy

- `zip -r code.zip .`
- setup aws cli and login
- `aws lambda update-function-code --function-name db-subscriber-insert --zip-file fileb://code.zip`

## db event scheduling

- `SET GLOBAL event_scheduler = ON;`
- `CREATE EVENT ON SCHEDULE EVERY 1 DAY STARTS '2014-01-18 00:01:00' DO UPDATE programUserSubscription set show_status = 2 WHERE end_date_time < CURDATE() and show_status = 1;`

### test api [POST]

- body

```
{
"payment page id": "pl_FTmyy3DqI9jEOp",
"Order ID": "order_GtkdQF88mTry8I",
"Plan Name": "Work out live with SARVA - Monthly Plan",
"payment date": "Fri Apr 02 2021 05:14:00 GMT+0530 (India Standard Time)",
"amount": 2021,
"first_name": "",
"last_name": "",
"email": "",
"phone": 3698521472,
"age": "",
"country": "Delhi",
"Membership Period": "15 Months",
"Availed 4 Workshops": "",
"Backend Acces": "",
"MacApp Comment": "",
"programUserSubscription - ID": "ID",
"Correct Status": "",
"rowNum": 2
}
```

- url
  `https://atrc57cheh.execute-api.ap-south-1.amazonaws.com/staging/db-subscriber-user`
