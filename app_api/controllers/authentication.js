const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');

const register = (req, res) => {
    //각 필드들이 재대로 입력이 됬는지
    if (!req.body.name || !req.body.email || !req.body.password) {
        return res.status(400).json({ message: 'All fields required' });
    }

    //user 인스턴스 만들고 필드에서 들어온 것으로 넣기
    const user = new User();
    user.name = req.body.name;
    user.email = req.body.email;
    user.setPassword(req.body.password);
    //db에 저장하기
    user.save((err) => {
        if (err) {
            res.status(404).json(err);
            
        }else{
            //Schema 메소드를 사용하여 JWT 생성하고 그것을 브라우저에 보낸다
            //현제 유저에 대한 JWT생성 토큰에 두고 json포맷으로 보낸다.
            const token = user.generateJwt();
            res.status(200).json({ token })
        }
    });
};

const login = (res,req)=>{
    if(!req.body.email || !req.body.password){
        return res
            .status(400)
            .json({"message": "All fields required"});
    }
    passport.authenticate('local', (err, user, info) =>{
        let token;
        if(err){
            return res
                .status(404)
                .json(err);
        }
        if(user){
            token = user.generatJwt();
            res.status(200).json({token});
        }else{
            res.status(401).json(info);
        }
    })(req,res);
};

module.exports={
    register,
    login
};