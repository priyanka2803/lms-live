const AmazonCognitoIdentity = require("amazon-cognito-identity-js");
const poolData = {
  UserPoolId: "ap-south-1_LyUIQOXNX",
  ClientId: "75qg2vfa2bcvel9ijim1ugk8li",
};
const { DynamoDB } = require("aws-sdk");
require("dotenv").config();
var dynamodb = new DynamoDB({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: "ap-south-1",
});
const pool_region = "ap-south-1";
const clientId = "75qg2vfa2bcvel9ijim1ugk8li";

var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

function getUserData() {
  return new Promise((resolve, reject) => {
    console.log("In getUserData...");
    let user = userPool.getCurrentUser();
    console.log("User...\n", user);
    if (user != undefined || user != null) {
      user.getSession((err, session) => {
        if (err) {
          console.log("Rejecting in getUserData after getSession\nerr = ", err);
          reject({ success: false, error: err, loggedIn: true });
        } else {
          user.getUserData((err, data) => {
            // if (err != {}) res.send({ error: err });
            let email = "";
            let first_name = "";
            let last_name = "";
            let username = "";
            console.log(data);
            for (let i = 0; i < data.UserAttributes.length; i++) {
              if (data.UserAttributes[i].Name == "sub")
                username = data.UserAttributes[i].Value;
              else if (data.UserAttributes[i].Name == "name") {
                let name = data.UserAttributes[i].Value.split();
                if (name.length == 1) {
                  first_name = name[0];
                  last_name = " ";
                } else {
                  first_name = name[0];
                  last_name = name[1];
                }
              } else if (data.UserAttributes[i].Name == "email")
                email = data.UserAttributes[i].Value;
            }

            let user = {
              first_name: first_name,
              last_name: last_name,
              email: email,
              username: username,
            };
            resolve({ success: true, user: user });
          });
        }
      });
    } else {
      reject({ loggedIn: false, success: false, error: undefined });
    }
  });
}

exports.isUserLoggedIn = (req, res, callback) => {
  console.log("In isUserLoggedIn...");
  console.log("getUserData...", getUserData);
  getUserData()
    .then(
      (data) => {
        if (data.success) {
          console.log("User in isUserLoggedIn = ", data.user);
          console.log("Callback....\n", callback);
          req.user = data.user;
          console.log("req.user = ", req.user);
          callback();
          // callback(req, res, data.user);
        } else {
          res.redirect("/login?callback=" + req.url);
        }
      },
      (error) => {
        if (!error.success) {
          console.log("Error in isUserLoggedIn = ", error.error);
          console.log("Logged in = ", error.loggedIn);
          res.redirect("/login?callback=" + req.url);
        }
      }
    )
    .catch((error) => {
      console.log("In catch of isUserLoggedIn");
      res.send({ success: false, error: error });
    });
};

exports.isUserInstructor = (req, res, callback) => {
  console.log("In isUserInstructor...");
  console.log("getUserData...", getUserData);
  getUserData()
    .then(
      (data) => {
        if (data.success) {
          console.log("User in isUserInstructor = ", data.user);
          console.log("Callback....\n", callback);
          req.user = data.user;
          console.log("req.user = ", req.user);
          console.log("Getting Instructor...");
          dynamodb.getItem(
            {
              Key: {
                course_creator_id: {
                  S: req.user.email,
                },
              },
              TableName: "coursecreator",
            },
            (err, instructor) => {
              if (err) {
                res.send({ error: err, success: false });
              } else {
                console.log("Instructor...\n", instructor);
                if (
                  instructor.Item &&
                  Object.keys(instructor.Item).length > 0 &&
                  instructor.Item.instructor.BOOL
                ) {
                  req.instructor = instructor.Item;
                  callback();
                } else {
                  res.redirect("/instructor/onboard");
                }
              }
            }
          );
          // callback();
          // callback(req, res, data.user);
        } else {
          res.redirect("/login?callback=" + req.url);
        }
      },
      (error) => {
        if (!error.success) {
          console.log("Error in isUserLoggedIn = ", error.error);
          console.log("Logged in = ", error.loggedIn);
          res.redirect("/login?callback=" + req.url);
        }
      }
    )
    .catch((error) => {
      console.log("In catch of isUserInstructor");
      res.send({ success: false, error: error });
    });
};
