# About

apps script for G-sheets proccess automation

## how to deploy

- `zip -r code.zip .`
- setup aws cli and login
- `aws lambda update-function-code --function-name db-subscriber-insert --zip-file fileb://code.zip`

## db event scheduling

- `SET GLOBAL event_scheduler = ON;`
- `CREATE EVENT ON SCHEDULE EVERY 1 DAY STARTS '2014-01-18 00:01:00' DO UPDATE programUserSubscription set show_status = 2 WHERE end_date_time < CURDATE() and show_status = 1;`
