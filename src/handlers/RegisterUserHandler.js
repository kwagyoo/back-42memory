const mysql = require("promise-mysql");
const config = require("./config.json");
const bcrypt = require("bcryptjs");
const axios = require("axios");
const client = axios.create();

const saltRounds = 10;

exports.RegisterUser = async (event, context) => {
  try {
    console.log(event);
    const { userClusterName, userPassword, userDeadline, userEmail, accessToken } = JSON.parse(event.body);
    const userID = Math.random().toString(20).slice(2);

    await client.get("https://api.intra.42.fr/v2/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const conn = await mysql.createConnection({
      host: config.user.host,
      user: config.user.user,
      password: config.user.password,
      database: config.user.database,
      connectionLimit: 150,
    });

    try {
      const searchUser = await conn.query(
        "select * from UserTable join UsernameTable on UserTable.userID = UsernameTable.userID WHERE userClusterName=?",
        userClusterName
      );
      if (searchUser.length) throw new Error("Duplicated User");

      const encryptedPassword = bcrypt.hashSync(userPassword, saltRounds);

      await conn.beginTransaction(); // 트랜잭션 적용 시작
      await conn.query("insert into UserTable values (?,?,?,?)", [userID, encryptedPassword, userDeadline, userEmail]);
      await conn.query("insert into UsernameTable values (?,?)", [userID, userClusterName]);

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      console.error(err);
      throw new Error(err.message);
    }
    return {
      statusCode: 200,
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
