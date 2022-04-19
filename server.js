const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
app.set("view engine", "ejs");
var path = require("path");

var cookieParser = require("cookie-parser");
const cors = require("cors");

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

// const { isUserLoggedIn, isUserInstructor } = require("./utils/Auth");
// const { studentRegistered } = require("./utils/Student");
// const loginRouter = require("./routes/login");
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
// app.use("/", loginRouter);
app.use("/peerjs", peerServer);

app.get("/", (req, res) => {
  res.send({ success: true });
});
app.get("/start/:course_id", (req, res) => {
  const meetingId = uuidv4();
  const course_id = req.params.course_id;
  const start = new Date();
  res.send({
    meetingId: meetingId,
    success: true,
    course_id: course_id,
    start_time: start.toISOString(),
  });
});

app.get("/course/:course_id/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName);
    });
  });
});

server.listen(process.env.PORT || 3030);
