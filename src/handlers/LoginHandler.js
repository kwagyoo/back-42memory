const mysql = require("promise-mysql");
const config = require("./config.json");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.Login = async (event, context) => {
  try {
    console.log(event);
    const { userClusterName, userPassword } = event.queryStringParameters;
    console.log(userClusterName, userPassword);

    const mysqlPool = await mysql.createConnection({
      host: config.user.host,
      user: config.user.user,
      password: config.user.password,
      database: config.user.database,
      connectionLimit: 150,
    });

    let userResponse;
    try {
      userResponse = await mysqlPool.query(
        "select unT.userID, unT.userClusterName, uT.userPassword from  UserTable as uT Join UsernameTable as unT on uT.userID = unT.userID where unT.userClusterName = ?",
        [userClusterName]
      );
      mysqlPool.end();
    } catch (error) {
      mysqlPool.end();
      console.log(error);
      throw new Error(error);
    }

    console.log(userResponse);
    if (!userResponse.length) throw new Error("MismatchedUserInfo");

    const match = await bcrypt.compare(userPassword, userResponse[0].userPassword);
    if (!match) throw new Error("MismatchedUserInfo");

    const accessToken = jwt.sign(
      {
        userClusterName: userClusterName,
        exp: Math.floor(Date.now() / 1000) + 60 * 30,
      },
      "42memory-secret"
    );
    return {
      statusCode: 200,
      body: JSON.stringify({
        userID: userResponse[0].userID,
        userClusterName: userResponse[0].userClusterName,
        accessToken: accessToken,
      }),
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    };
  } catch (error) {
    if (error.response) {
      console.error(error.response);
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
      console.error(error.request);
      return {
        statusCode: 400,
        body: JSON.stringify({ errorMessage: error.request }),
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      };
    } else if (error.message) {
      console.error(error.message);
      // 오류를 발생시킨 요청을 설정하는 중에 문제가 발생했습니다.
      return {
        statusCode: 500,
        body: JSON.stringify({ errorMessage: error.message }),
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      };
    } else {
      console.error(error);
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
