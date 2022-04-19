// global.fetch = require("node-fetch");
// global.navigator = () => null;
const { DynamoDB, CognitoIdentityServiceProvider } = require("aws-sdk");

const AmazonCognitoIdentity = require("amazon-cognito-identity-js");
const poolData = {
  UserPoolId: "ap-south-1_LyUIQOXNX",
  ClientId: "75qg2vfa2bcvel9ijim1ugk8li",
};
const pool_region = "ap-south-1";
const clientId = "75qg2vfa2bcvel9ijim1ugk8li";
var dynamodb = new DynamoDB({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: "ap-south-1",
});

var cognitoidentityserviceprovider = new CognitoIdentityServiceProvider({
  region: "ap-south-1",
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

// --------------------- REGISTER --------------------------------------
exports.Register = (req, res) => {
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;
  var attributeList = [];
  let userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
  attributeList.push(
    new AmazonCognitoIdentity.CognitoUserAttribute({
      Name: "name",
      Value: name,
    })
  );

  attributeList.push(
    new AmazonCognitoIdentity.CognitoUserAttribute({
      Name: "birthdate",
      Value: req.body.birthdate,
    })
  );
  // let success;
  // let user;
  // let error;
  // let completed = false;
  userPool.signUp(email, password, attributeList, null, function (err, result) {
    console.log("error = ", err, "\ndata = ", result);
    if (err) {
      // error = err;
      if (err.name == "InvalidPasswordException")
        res.render("register", { error: err, success: false, user: undefined });
      // return { invalid: "password" };
      // error=err
    } else {
      var cognitoUser = result.user;
      // console.log(cognitoUser);
      // console.log(typeof cognitoUser);
      // cognitoUser.authenticateUser(
      //   { Username: email, Pool: userPool, Password: password },
      //   (err, data) => {
      //     completed = true;
      //     console.log("error = ", err, "\ndata = ", result);
      //     if (err)
      //       res.render("register", {
      //         error: err,
      //         success: false,
      //         user: undefined,
      //       });
      //     if (data)
      res.render("verify", {
        user: cognitoUser,
        success: true,
        error: undefined,
        email: req.body.email,
      });
      // callback(null, cognitoUser);
    }
    // );
    // }
  });
  // if(completed)
  // return { error: err, success: false, user:user }
};
//------------------------ VERIFY ---------------------

exports.Verify = (req, res) => {
  console.log("In Verify....");
  let userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

  // console.log(req.cookies);
  var cognitoUser = new AmazonCognitoIdentity.CognitoUser({
    Username: req.body.email,
    Pool: userPool,
  });
  // var cognitoUser = res.cookie;
  // console.log(userPool.AdvancedSecurityDataCollectionFlag);
  // console.log(
  //   cognitoUser.getUserAttributes((err) => {
  //     console.log(err);
  //   })
  // );
  // let success;
  // let user;
  // let error;
  // let completed = false;
  cognitoUser.confirmRegistration(
    req.body.verification_code,
    true,
    function (err, result) {
      // completed = true;
      console.log("error = ", err, "\ndata = ", result);
      if (err) {
        res.render("verify", {
          error: err,
          success: false,
          user: undefined,
          email: req.body.email,
        });
        // error = err;
        // success = false;
      }
      // console.log("call result: " + result);
      // cognitoUser.authenticateUser();
      // success = true;
      // user = result;
      // return { user: result, success: true };
      else {
        // cognitoUser.getUserData((err, data) => {
        // console.log(data);
        res.redirect("/login");
        // });
      }
    }
  );
  // if (completed && success) {
  //   return { user: user, success: success };
  // } else {
  //   return { error: error, success: success };
  // }
};

// ------------------ LOGIN ----------------------------

exports.Login = (req, res) => {
  let userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

  var userName = req.body.email;
  var password = req.body.password;
  var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
    Username: userName,
    Password: password,
  });
  var userData = {
    Username: userName,
    Pool: userPool,
  };
  var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: function (result) {
      console.log("Logged In...");
      cognitoUser.getSession((err, data) => {
        if (err) console.log(err);
        else {
          cognitoUser.getUserAttributes((err, userData) => {
            if (err) console.log(err);
            else {
              console.log("user data....");
              // console.log("Req = ", req);
              console.log("Query = ", req.query);
              console.log("Body = ", req.body);
              console.log(userData);
              if (req.query.callback) res.redirect(req.query.callback);
              else res.redirect("/student/dashboard");
            }
          });
        }
      });
    },
    // res.send();
    // res.send(result);,
    onFailure: function (err) {
      console.log(err);
      console.log(typeof err);
      console.log(Object.keys(err));
      if (err.code == "UserNotConfirmedException") {
        console.log("In if");
        cognitoidentityserviceprovider.resendConfirmationCode(
          {
            ClientId: "75qg2vfa2bcvel9ijim1ugk8li" /* required */,
            Username: req.body.email /* required */,
          },
          (err1, data) => {
            if (err1) {
              console.log(err1);
            } else {
              res.render("verify", {
                error: err,
                success: false,
                user: cognitoUser,
                email: req.body.email,
                errorMessage: err.message,
                redirect: false,
              });
            }
          }
        );
      } else
        res.render("login", {
          error: err,
          success: false,
          user: cognitoUser,
          email: req.body.email,
          errorMessage: err.message,
          redirect: false,
        });
    },
  });
};

//--------------------- LOGOUT ---------------------
exports.Logout = (req, res) => {
  let userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
  // if(userPool.getCurrentUser()){
  // var userName = userPool.getCurrentUser().getUserData();
  // var userData = {
  //   Username: userName,
  //   Pool: userPool,
  // };
  var cognitoUser = userPool.getCurrentUser();
  console.log(cognitoUser);
  // var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
  if (cognitoUser) {
    cognitoUser.signOut((err, data) => {
      console.log(err, " ", data);
      if (err) res.redirect("/");
      else {
        res.redirect("/");
      }
    });
  }
};

//------------------------ isLoggedIn ---------------------
exports.isUserLoggedIn = (req, res) => {
  let userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

  // var userName = req.cookies["cognitoUser"];
  // var userData = {
  //   Username: userName,
  //   Pool: userPool,
  // };
  var cognitoUser = userPool.getCurrentUser();
  // var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
  // console.log(userPool.getCurrentUser());
  console.log("Current User ...........");
  console.log(cognitoUser);
  cognitoUser.getSession((err, data) => {
    if (err) res.send({ loggedIn: false });
    else res.send({ user: cognitoUser, loggedIn: true });
  });
  // cognitoUser.getUserAttributes((err, data) => {
  //   if (err) console.log(err);
  //   else console.log(data);
  // });
  // cognitoUser.getUserData((err, data) => {
  //   if (err) console.log(err);
  //   else console.log(data);
  // });
  //cognitoUser.username
  // if (cognitoUser) res.send({ user: cognitoUser, loggedIn: true });
  // else res.send({ loggedIn: false });
  // let session = cognitoUser.getSession((data) => {
  //   console.log(data);
  // });
  // console.log(session);
};

//--------------- isAuthCreator ----------------

exports.requireAuthenticatedCreator = (req, res, next) => {
  let userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
  let cognitoUser = userPool.getCurrentUser();
  if (cognitoUser) {
    let params = {
      Key: {
        course_creator_id: {
          S: cognitoUser,
        },
      },
      TableName: "coursecreator",
    };
    //   console.log(req.params.id);
    dynamodb.getItem(params, function (err, data) {
      if (err) {
        console.log(err);
        // return -1;
      } else {
        console.log(data);
        let a = Array.from(data.course_ids);
        if (a.find(req.params.course_id) != -1) next();
        else
          res.render("courseupload", {
            error: "Not Authorized",
            success: false,
            user: cognitoUser,
          });
        //   res.send(data);
        // return data;
      }
    });
    // console.log(cognitoUser.getUserAttributes());
    // let result = getCourses(userPool.getCurrentUser());
    // res.send(result);
    // if (Object.keys(result) == 0) {
    //Doesn't have any courses
    // } else {
    //check for specific course_id
    // }
  } else {
    console.log("No user");
    //ask to authenticate
    // this.Login(ml);
    // res.sendFile(path.join(__dirname, "../", "test.html"));
  }
};

//----------------------- isStudent ------------------------------------------
//
const getAttribute = (userData, attr) => {
  for (let i = 0; i < userData.length; i++) {
    if (userData[i].Name == attr) return userData[i].Value;
  }
  return "";
};

exports.getCurrentUser = async () => {
  console.log("in get current user...");
  let student = userPool.getCurrentUser();
  console.log(student);
  //let username = student.username;
  student.getSession((err, data) => {
    if (err) console.log(err);
    else {
      student.getUserData((err, data) => {
        // if (err != {}) res.send({ error: err });
        let email = "";
        let first_name = "";
        let last_name = "";
        let password = "aplms@123!";
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

        return {
          first_name: first_name,
          last_name: last_name,
          email: email,
          password: password,
          username: username,
          password: password,
        };
      });
    }
  });

  //   res.send({ username: username, email: email });
};
