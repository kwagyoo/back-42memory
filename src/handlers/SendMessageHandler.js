const mysql = require("promise-mysql");
const config = require("./config.json");
const axios = require("axios");
const client = axios.create();

function getCurrentDate() {
  const date_ob = new Date();
  const day = ("0" + date_ob.getDate()).slice(-2);
  const month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  const year = date_ob.getFullYear();

  const date = year + "-" + month + "-" + day;
  console.log(date);
  return date;
}

exports.SendMessage = async (event, context) => {
  try {
    const { userID } = event.pathParameters;
    const { accessToken, senderNickname, messageTitle, messageText } = JSON.parse(event.body);

    const info42 = await client.get("https://api.intra.42.fr/v2/me", {
      headers: {
        "Authorization": "Bearer " + accessToken,
      },
    });
    console.log(info42);
    const senderClusterName = info42.data.login;

    const conn = await mysql.createConnection({
      host: config.user.host,
      user: config.user.user,
      password: config.user.password,
      database: config.user.database,
      connectionLimit: 150,
    });
    const sendCount = await conn.query(
      "select count(*) from MessageTable as mT where senderClusterName = ? and userID = ?",
      [senderClusterName, userID]
    );
    if (sendCount[0]["count(*)"] == 3) throw new Error("ExceededMessageCount");

    const checkExpired = await conn.query("select userDeadline from UserTable where userID = ?", [userID]);
    if (checkExpired[0].userDeadline < new Date(Date.now())) throw new Error("ExpiredLinkDate");

    await conn.query(
      "insert into MessageTable(userID, senderNickname, senderClusterName, messageTitle, messageText) values (?, ?, ?, ?, ?)",
      [userID, senderNickname, senderClusterName, messageTitle, messageText]
    );
    return {
      statusCode: 200,
      body: JSON.stringify({ sendMessageCount: sendCount[0]["count(*)"] + 1 }),
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    };
  } catch (error) {
    if (error.response) {
      console.error("error", error.response);
      return {
        statusCode: error.response.status,
        body: JSON.stringify({
          errorMessage: error.response.data.message,
        }),
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      };
    } else if (error.request) {
      console.error("error", error.request);
      return {
        statusCode: 400,
        body: JSON.stringify({ errorMessage: error.request }),
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      };
    } else if (error.message) {
      console.error("error", error.message);
      // ????????? ???????????? ????????? ???????????? ?????? ????????? ??????????????????.
      return {
        statusCode: 500,
        body: JSON.stringify({ errorMessage: error.message }),
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      };
    } else {
      console.error("error", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ errorMessage: error }),
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      };
    }
  }
};
