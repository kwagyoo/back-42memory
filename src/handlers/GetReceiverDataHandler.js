const mysql = require("promise-mysql");
const config = require("./config.json");

exports.GetReceiverData = async (event, context) => {
  try {
    const { userID } = event.pathParameters;

    const conn = await mysql.createConnection({
      host: config.user.host,
      user: config.user.user,
      password: config.user.password,
      database: config.user.database,
      connectionLimit: 150,
    });
    const userData = await conn.query(
      "select unT.userClusterName, uT.userDeadline from UsernameTable as unT join UserTable as uT on unT.userID = uT.userID where unT.userID = ?",
      [userID]
    );
    conn.end();

    if (userData[0].userDeadline < new Date(Date.now())) throw new Error("ExpiredLinkDate");

    return {
      statusCode: 200,
      body: JSON.stringify({ userClusterName: userData[0].userClusterName }),
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    };
  } catch (error) {
    console.error(error);
    if (error.response) {
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
      return {
        statusCode: 400,
        body: JSON.stringify({ errorMessage: error.request }),
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      };
    } else if (error.message) {
      // 오류를 발생시킨 요청을 설정하는 중에 문제가 발생했습니다.
      return {
        statusCode: 500,
        body: JSON.stringify({ errorMessage: error }),
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      };
    } else {
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
