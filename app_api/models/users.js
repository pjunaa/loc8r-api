require('dotenv').config()
const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

//로그인시 db에 만들어지는 스키마
const userSchema = new mongoose.Schema({
    email:{
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    hash: String,
    salt: String
});

//페스워드를 가져온다.
userSchema.methods.setPassword = function(password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto
        .pbkdf2Sync(password, this.salt, 1000, 64, 'sha512')
        .toString('hex');
};

//페스워드 유효성 검사
userSchema.methods.validPassword = function(password){
    const hash = crypto
        .pbkdf2Sync(password, this.salt, 1000, 64, 'sha512')
        .toString('hex');
    return this.hash === hash;
}

//Jwt 생성 후 전송
userSchema.methods.generateJwt = function(){
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    return jwt.sign({
        _id: this._id,
        email: this.email,
        name: this.name,
        exp: parseInt(expiry.getTime() / 1000, 10),
    }, 'thisIsSecret');
};

mongoose.model('User', userSchema);