# About

apps script for G-sheets proccess automation

## how to deploy

- zip -r code.zip .
- setup aws cli and login
- aws lambda update-function-code --function-name db-subscriber-insert --zip-file fileb://code.zip
