const express = require("express");
require("./db/config");
const User = require("./db/Users");
const Product = require('./db/Product')
const jwt = require('jsonwebtoken');
const jwtKey = 'e-com';
const app = express();
const cors = require("cors");
app.use(express.json());
app.use(cors());
app.post("/register", async (req, res) => {
  try {
    console.log("Received POST request with data:", req.body);

    const auser = new User(req.body);
    let result = await auser.save();

    console.log("Saved user data:", result);
    result = result.toObject();
    delete result.password;
    jwt.sign({result}, jwtKey,  (err, token) =>{
      if(err){
        res.send({result:"something went wrong"})
      }else{
        res.send({result, auth:token})
      }
    })
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/login", async (req, res) => {
  if (req.body.email && req.body.password) {
    let user = await User.findOne(req.body).select("-password");
    if (user) {
      jwt.sign({user}, jwtKey,  (err, token) =>{
        if(err){
          res.send({result:"something went wrong"})
        }else{
          res.send({user, auth:token})
        }
      })
    } else {
      res.send("no user found");
    }
  } else {
    res.send("no user found");
  }
});

app.post("/add-product", verifyToken,  async (req, res) =>{
  let product = new Product(req.body);
  let result = await product.save();
  res.send(result);

})

app.get("/products", verifyToken, async (req, res) =>{
  let products = await Product.find();
  if(products.length > 0){
    res.send(products)
  }else{
    res.send({result : "No products found"})
  }

})

app.delete("/product/:id", verifyToken, async (req, res) =>{
  let result = await Product.deleteOne({_id: req.params.id});
  res.send(result)
})

app.get("/product/:id", verifyToken, async(req,res) =>{
  let result = await Product.findOne({_id: req.params.id})
  if(result){
    res.send(result)
  }else{
    res.send({result:"No record found"})
  }
})

app.put("/product/:id", verifyToken,  async (req,res) =>{
  let result = await Product.updateOne({
    _id: req.params.id
  },
  {
    $set : req.body
  })
  res.send(result)
})

app.get("/search/:key", verifyToken, async (req, res) => {
  let result = await Product.find({
    "$or": [
      { name: { $regex: new RegExp(req.params.key, "i") } },
      { company: { $regex: new RegExp(req.params.key, "i") } },
    ],
  });
  res.send(result);
});

function verifyToken (req, res, next){
  let token = req.headers['authorization'];
  if(token){
    token = token.split(' ')[1];
    jwt.verify(token, jwtKey, (err, valid) =>{
      if(err){
        res.status(401).send({result : "Please provide valid token"})

      }else{
        next();
      }
    })
  }else{
    res.status(403).send({result : "Please add token with header"})
  }
console.log("middleware called", token)


}


const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
