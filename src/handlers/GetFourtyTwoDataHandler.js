const axios = require("axios");
const client = axios.create();

exports.GetFourtyTwoData = async (event, context) => {
  try {
    const { code, type } = event.queryStringParameters;
    let res;

    if (type === "register") {
      res = await client.post("https://api.intra.42.fr/oauth/token", {
        grant_type: "authorization_code",
        client_id: "~",
        client_secret: "~",
        code: code,
        redirect_uri: "https://42memory.com/register",
      });
    } else if (type === "redirect") {
      res = await client.post("https://api.intra.42.fr/oauth/token", {
        grant_type: "authorization_code",
        client_id: "~",
        client_secret: "~",
        code: code,
        redirect_uri: "https://42memory.com/redirect",
      });
    } else throw new Error("Wrong Parameter");

    console.log(res);
    const info42 = await client.get("https://api.intra.42.fr/v2/me", {
      headers: {
        Authorization: `Bearer ${res.data.access_token}`,
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ data: info42.data, accessToken: res.data.access_token }),
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
