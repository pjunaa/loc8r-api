const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const User = mongoose.model('User');

passport.use(new LocalStrategy({
        usernameField: 'email'
    },
    (username, password, done) => {
        //제공된 email 주소로 user 를 찾기 위해 MongoDB 탐색
        User.findOne({email: username}, (err,user) =>{
            
            if (err) { return done(err);}
            
            //user를 발견하지 못하면 false/message 를 반환
            if (!user) {
                return done(null, false, {
                    message: 'Incorrect username.'
                });
            }
            // validPassword를 호출하여 password 를 전달
            if(!user.valiPassword(password)){
                return done(null, false, {
                    message: 'Incorrect password.'
                });
            }
            //끝에 도달하면 user 객체를 반환
            return done(null, user);
        });
    }
));