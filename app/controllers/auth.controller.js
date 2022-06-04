const config = require("../config/auth.config");
const db = require("../models");
const { user: User, role: Role, refreshToken: RefreshToken } = db;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// exports.signup = (req, res) => {
//   // Save User to Database
//   User.create({
//     fullname: req.body.fullname,
//     email: req.body.email,
//     role: req.body.role,
//     image: req.body.image,
//     password: bcrypt.hashSync(req.body.password, 8)
//   })
//     .then(user => {
//       if (req.body.roles) {
//         Role.findAll({
//           where: {
//             name: {
//               [Op.or]: req.body.roles
//             }
//           }
//         }).then(roles => {
//           user.setRoles(roles).then(() => {
//             res.send({ message: "User was registered successfully! 😎" });
//           });
//         });
//       } else {
//         // user role = 1
//         user.setRoles([1]).then(() => {
//           res.send({ message: "User was registered successfully! 😘" });
//         });
//       }
//     })
//     .catch(err => {
//       res.status(500).send({ message: err.message });
//     });
// };
// exports.signin = (req, res) => {
//   User.findOne({
//     where: {
//       email: req.body.email
//     }
//   })
//     .then(async (user) => {
//       if (!user) {
//         return res.status(404).send({ message: "User Not found 😑😑."});
//       }
//       const passwordIsValid = bcrypt.compareSync(
//         req.body.password,
//         user.password
//       );
      
//       if (!passwordIsValid) {
//         return res.status(401).send({
//           accessToken: null,
//           message: "Invalid Password! 😯"
//         });
//       }
      
//       const token = jwt.sign({ id: user.id }, config.secret, {
//         expiresIn: 86400 // 24 hours
//         // expiresIn: config.jwtExpiration
//       });
      
//       let refreshToken = await RefreshToken.createToken(user);
//       let authorities = [];
      
//       user.getRoles().then(roles => {
//         for (let i = 0; i < roles.length; i++) {
//           authorities.push("ROLE_" + roles[i].name.toUpperCase());
//         }
//         res.status(200).send({
//           id: user.id,
//           fullname: user.fullname,
//           email: user.email,
//           image: user.image,
//           role: authorities,
//           accessToken: token,
//           refreshToken: refreshToken,
//         });
//       });
//     })
//     .catch(err => {
//       res.status(500).send({ message: err.message });
//     });
// };

exports.signin = (req, res) => {
   User.findOne({
     username: req.body.username,
   })
     .populate("roles", "-__v")
     .exec(async (err, user) => {
       if (err) {
         res.status(500).send({ message: err });
         return;
       }
       if (!user) {
         return res.status(404).send({ message: "User Not found." });
       }
       let passwordIsValid = bcrypt.compareSync(
         req.body.password,
         user.password
       );
       if (!passwordIsValid) {
         return res.status(401).send({
           accessToken: null,
           message: "Invalid Password!",
         });
       }
       let token = jwt.sign({ id: user.id }, config.secret, {
         expiresIn: config.jwtExpiration,
       });
       let refreshToken = await RefreshToken.createToken(user);
       let authorities = [];
       for (let i = 0; i < user.roles.length; i++) {
         authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
       }
       res.status(200).send({
         id: user._id,
         username: user.username,
         email: user.email,
         roles: authorities,
         accessToken: token,
         refreshToken: refreshToken,
       });
     });
 };   

exports.signup = async (req, res) => {
  // Save User to Database
  try {
    const user = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
    });
    if (req.body.roles) {
      Role.find(
        {
          name: { $in: req.body.roles }
        },
        (err, roles) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }
          user.roles = roles.map(role => role._id);
          user.save(err => {
            if (err) {
              res.status(500).send({ message: err });
              return;
            }
            res.send({ message: "User was registered successfully!" });
          });
        }
      );
    } else {
      Role.findOne({ name: "user" }, (err, role) => {
         if (err) {
           res.status(500).send({ message: err });
           return;
         }
         user.roles = [role._id];
         user.save(err => {
           if (err) {
             res.status(500).send({ message: err });
             return;
           }
           res.send({ message: "User was registered successfully!" });
         });
       });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.signout = async (req, res) => {
  try {
    req.session = null;
    return res.status(200).send({
      message: "You've been signed out!"
    });
  } catch (err) {
    this.next(err);
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken: requestToken } = req.body;
     if (requestToken == null) {
       return res.status(403).json({ message: "Refresh Token is required!" });
     }
     try {
       let refreshToken = await RefreshToken.findOne({ where: { token: requestToken } });
       console.log(refreshToken)
       if (!refreshToken) {
         res.status(403).json({ message: "Refresh token is not in database!" });
         return;
       }
       if (RefreshToken.verifyExpiration(refreshToken)) {
         RefreshToken.destroy({ where: { id: refreshToken.id } });
         
         res.status(403).json({
           message: "Refresh token was expired. Please make a new signin request",
         });
         return;
       }
       const user = await refreshToken.getUser();
       let newAccessToken = jwt.sign({ id: user.id }, config.secret, {
         expiresIn: config.jwtExpiration,
       });
       return res.status(200).json({
         accessToken: newAccessToken,
         refreshToken: refreshToken.token,
       });
     } catch (err) {
       return res.status(500).send({ message: err });
  }
};