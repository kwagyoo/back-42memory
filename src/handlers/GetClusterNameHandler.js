const mysql = require("promise-mysql");
const config = require("./config.json");

exports.GetClusterName = async (event, context) => {
  try {
    console.log(event);
    const { userID } = event.pathParameters;

    const conn = await mysql.createConnection({
      host: config.user.host,
      user: config.user.user,
      password: config.user.password,
      database: config.user.database,
      connectionLimit: 150,
    });
    const userClusterName = await conn.query("select userClusterName from UsernameTable where userID = ?", [userID]);

    return {
      statusCode: 200,
      body: JSON.stringify(userClusterName[0]),
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    };
  } catch (error) {
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
        body: JSON.stringify({ errorMessage: error.message }),
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
