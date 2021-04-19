let app = SpreadsheetApp;
let ss = app.getActiveSpreadsheet();
let sheet = ss.getActiveSheet();
let header = sheet.getRange("A1:Q1");
header = header.getValues()[0];
let range = sheet.getDataRange();
table = range.getValues();
let jsonData = arrayToJSONObject(table.slice(1, table.length));
let numRows = 20;
const url =
  "https://kq8ot2bvth.execute-api.ap-south-1.amazonaws.com/test-stage";

// main logic
function main(rowCount) {
  let newData = getFilteredRows(rowCount);
  for (let i = 0; i < newData.length; i++) {
    if ((newData[i].email != "") & (newData[i].phone != "")) {
      let res = post(newData[i]);
      console.log(res);
      if (res.body.status) {
        setData(newData[i].rowNum, "Correct Status", res.body.status);
        setData(newData[i].rowNum, "MacApp Comment", res.body.status);
        if (res.body.id)
          setData(
            newData[i].rowNum,
            "programUserSubscription - ID",
            res.body.id
          );
      }
    }
  }
}

// invoke lambda
function post(body) {
  let res = UrlFetchApp.fetch(url, {
    method: "post",
    payload: JSON.stringify(body),
    contentType: "application/json",
  });
  return JSON.parse(res.getContentText());
}

// get a subset of rows
function getFilteredRows(numOfRows) {
  let count = 0;
  let newArr = [];
  for (var i = 0; i < jsonData.length; i++) {
    if (count === numOfRows) break;
    if (getByName("MacApp Comment", i + 1) == "") {
      if (getByName("amount", i + 1) === 0) {
        setData(i + 1, "Correct Status", "data incorrect");
        continue;
      }
      jsonData[i].rowNum = i + 1;
      newArr.push(jsonData[i]);
      count++;
    }
  }
  return newArr;
}

// set new data in cells by row number and column name
function setData(rowNum, colName, status) {
  table[rowNum][header.indexOf(colName)] = status;
  range.setValues(table);
}

// returns the selected rows in JSON format
function arrayToJSONObject(arr) {
  //header
  var keys = header;
  //vacate keys from main array
  var newArr = arr;
  var formatted = [],
    data = newArr,
    cols = keys,
    l = cols.length;
  for (var i = 0; i < data.length; i++) {
    var d = data[i],
      o = {};
    for (var j = 0; j < l; j++) o[cols[j]] = d[j];
    formatted.push(o);
  }
  return formatted;
}

// returns column value by col name
function getByName(colName, row) {
  var col = header.indexOf(colName);
  if (col != -1) {
    return table[row][col];
  }
}

// display prompt
function displayPrompt() {
  var ui = app.getUi();
  var result = ui.prompt(
    "Please enter the number of rows to be processed",
    ui.ButtonSet.OK
  );
  //Get the button that the user pressed.
  var button = result.getSelectedButton();
  if (button === ui.Button.OK) {
    let rowCount = parseInt(result.getResponseText());
    if (!rowCount) rowCount = numRows;
    let prompt = ui.alert("Please confirm", `${rowCount}`, ui.ButtonSet.YES_NO);
    if (prompt == ui.Button.YES) {
      main(rowCount);
    } else {
      ui.alert("Aborted.");
    }
  } else if (button === ui.Button.CLOSE) {
  }
}
