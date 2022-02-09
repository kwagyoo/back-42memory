const mysql = require("promise-mysql");
const config = require("./config.json");
const axios = require("axios");
const client = axios.create();

exports.SendMessage = async (event, context) => {
  try {
    const { userID } = event.pathParameters;
    const { code, senderNickname, messageTitle, messageText } = JSON.parse(event.body);

    const res = await client.post("https://api.intra.42.fr/oauth/token", {
      grant_type: "authorization_code",
      client_id: "~",
      client_secret: "~",
      code: code,
      redirect_uri: "http://localhost:3000/redirect",
    });
    const info42 = await client.get("https://api.intra.42.fr/v2/me", {
      headers: {
        "Authorization": "Bearer " + res.data.access_token,
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
      // 오류를 발생시킨 요청을 설정하는 중에 문제가 발생했습니다.
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
