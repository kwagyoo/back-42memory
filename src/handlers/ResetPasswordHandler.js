const nodemailer = require("nodemailer");
const mysql = require("promise-mysql");
const config = require("./config.json");
const bcrypt = require("bcryptjs");

const saltRounds = 10;

exports.ResetPassword = async (event, context) => {
  try {
    const { userEmail } = JSON.parse(event.body);

    const conn = await mysql.createConnection({
      host: config.user.host,
      user: config.user.user,
      password: config.user.password,
      database: config.user.database,
      connectionLimit: 150,
    });

    const userInfo = await conn.query("select userID, userEmail from UserTable where userEmail = ?", [userEmail]);
    console.log(userInfo);
    if (!userInfo.length) throw new Error("MismatchedUserInfo");

    const randomPassword = Math.random().toString(16).slice(2);

    await conn.query("update UserTable set userPassword = ? where userID = ?", [
      bcrypt.hashSync(randomPassword, saltRounds),
      userInfo[0].userID,
    ]);

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com", // gmail server 사용
      port: 587,
      secure: false,
      auth: {
        user: "~@gmail.com", //메일서버 계정
        pass: "~", //메일서버 비번
      },
    });
    let mailOptions = {
      from: "42memory.com", //보내는 사람 주소
      to: userEmail, //받는 사람 주소
      subject: "[42memory] reset your password", //제목
      text:
        "42memory 홈페이지에서 비밀번호 초기화를 요청 받았습니다.\n 아래의 비밀번호로 변경되었으니 로그인해주시기 바랍니다.\n " +
        randomPassword, //본문
    };
    const mailResult = await transporter.sendMail(mailOptions);
    console.log(mailResult);
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
