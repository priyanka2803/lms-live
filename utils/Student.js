const { DynamoDB } = require("aws-sdk");

var dynamodb = new DynamoDB({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: "ap-south-1",
});

exports.studentRegistered = (req, res, next) => {
  let course_id;
  if (req.params.course_id) {
    course_id = req.params.course_id;
  } else if (req.body.course_id) {
    course_id = req.body.course_id;
  }
  console.log("Course_id = ", course_id);
  dynamodb.query(
    {
      KeyConditionExpression: "course_id = :c AND student_id = :s",
      // FilterExpression: "student_id = :s",
      ExpressionAttributeValues: {
        ":c": {
          S: course_id,
        },
        ":s": {
          S: req.user.email,
        },
      },
      TableName: "student_courses",
    },
    (err, data) => {
      console.log(err, " ", data);
      if (err) {
        console.log(err);
        res.send({ success: false, error: err });
      } else {
        if (data.Items.length == 1) next();
        else {
          console.log("Not registered");
          res.render("error", {
            errorMessage: "Not registered in the course",
          });
        }
      }
    }
  );
};
