const express = require("express");
const crypto = require("crypto");
const app = express();

app.use(express.urlencoded({ extended: false }));

const PASSWORD = process.env.SITE_PASSWORD;

app.get("/", (req, res) => {
  res.send(`
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>DARK MODS SKiNZ</title>
      <style>
        body {
          background:#080808;
          color:white;
          font-family:Arial;
          text-align:center;
          padding-top:100px;
        }
        h1 {color:red;}
        input,button {
          padding:14px;
          margin:10px;
          border-radius:8px;
          border:none;
        }
        button {background:red;color:white;}
      </style>
    </head>
    <body>
      <h1>DARK MODS SKiNZ</h1>
      <h3>Enter Your Password</h3>
      <form method="POST" action="/login">
        <input type="password" name="password" placeholder="Enter password" required>
        <br>
        <button type="submit">LOGIN</button>
      </form>
    </body>
    </html>
  `);
});

app.post("/login", (req, res) => {
  const password = req.body.password || "";
  const expected = PASSWORD || "";

  const a = Buffer.from(password);
  const b = Buffer.from(expected);

  if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
    res.send("<h1>Welcome to DARK MODS SKiNZ!</h1>");
  } else {
    res.send("<h2>Wrong password! Try again.</h2><a href='/'>Back</a>");
  }
});

app.listen(process.env.PORT || 3000);
