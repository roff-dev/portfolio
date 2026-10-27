---
title: "Checking who's signed in before a route runs"
project: dissertation
language: js
skill: "Authentication middleware"
order: 1
---

```js
// Signed JSON Web Tokens decide who can reach each route
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;

exports.adminAuth = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, jwtSecret, (err, decodedToken) => {
      if (err) {
        return res.status(401).json({ message: "Not authorized" });
      } else {
        if (decodedToken.role !== "admin") {
          return res.status(401).json({ message: "Not authorized" });
        } else {
          next();
        }
      }
    });
  } else {
    return res
      .status(401)
      .json({ message: "Not authorized, token not available" });
  }
};

// exports.userAuth is the same check for the "Basic" (customer) role
```

**The problem:** NFC Savers has two kinds of user. Customers see their points and deals, and admins manage the shop, so every route has to know who's asking before it does anything.

**Why this approach:** When someone signs in, the server signs a token holding their role and keeps it in a cookie. Each protected route has a small piece of Express middleware in front of it that checks the signature and the role, so the check doesn't need a database lookup on every request.

**What to notice:** It fails closed. A missing token, a bad signature and the wrong role all end in a 401 before the route itself runs, and `next()` is only reached when everything checks out.
