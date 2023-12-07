const mongoose = require("mongoose");
const Loc = mongoose.model('Location');
const User = mongoose.model('User');

//요청 객체, 응답객체, 콜백함수
const getAuthor =(req,res,callback) =>{
    //payload, email확인
    if(req.auth && req.auth.email){
        User
            //email을 가져온다.
            .findOne({email: req.auth.email})
            //사용자가 찾아지면 user변수에 들어가 있습니다.
            .exec((err, user) =>{
                if(!user){
                    return res.status(404).json({"message": "User not found"});
                } else if(err){
                    console.log(err);
                    return res.status(404).json(err);
                }
                callback(req, res, user.name);
            });
    }else{
        return res.status(404).json({"message": "User not found"});
    }
}

const doSetAveratgeRating = (location) => {
    if (location.reviews && location.reviews.length > 0) {
        const count = location.reviews.length;
        const total = location.reviews.reduce((acc, { rating }) => {
            return acc + rating;
        }, 0);
        location.rating = parseInt(total / count, 10);
        location.save(err => {
            if (err) {
                console.log(err);
            } else {
                console.log(`Average rating updated to ${location.rating}`);
            }
        });
    }
};

const updateAverageRating = (locationId) => {
    Loc.findById(locationId)
        .select("rating reviews")
        .exec((err, location) => {
            if (!err) {
                doSetAveratgeRating(location);
            }
        });
};
const doAddReview = (req, res, location, author) => {
    if (!location) {
        res
            .status(404)
            .json({ "message": "Location not found" });
    } else {
        const { rating, reviewText } = req.body;
        location.reviews.push({
            author,
            rating,
            reviewText
        });
        location.save((err, location) => {
            if (err) {
                res
                    .status(400)
                    .json(err);
            } else {
                updateAverageRating(location._id);
                const thisReview = location.reviews.slice(-1).pop();
                res
                    .status(201)
                    .json(thisReview);
            }
        });
    }
};
const reviewCreate = (req, res) => {
    //getAuthor로 db에서 userName을 가져온다.
    getAuthor(req, res,
        (req, res, userName) => {
            const locationId = req.params.locationid;
            if (locationId) {
                Loc
                    .findById(locationId)
                    .select('reviews')
                    .exec((err, location) => {
                        if (err) {
                            res
                                .status(400)
                                .json(err)
                        } else {
                            //review추가 함수에 userName까지 넣어서 준다.
                            doAddReview(req, res, location, userName);
                        }
                    });
            } else {
                console.log(locationId);
                res
                    .status(404)
                    .json({ "message": "Location not found" })
            }
        })

};
const reviewsReadOne = (req, res) => {
    Loc
        .findById(req.parmas.locationid)
        .select('name reviews')

        .exec((err, location) => {
            if (!location) {
                return res
                    .status(404)
                    .json({
                        "message": "lcoation not found"
                    });
            } else if (err) {
                return res
                    .status(404)
                    .json(err);
            }
            if (location.reviews && location.reviews.length > 0) {
                const review = location.reviews.id(req.parmas.reviewid);

                if (!review) {
                    return res
                        .status(404)
                        .json({ "message": "review not found" });
                } else {
                    const response = {
                        location: {
                            name: location.name,
                            id: req.parmas.locationid
                        },
                        review
                    };

                    return res
                        .status(200)
                        .json(response)
                }
            } else {
                return res
                    .status(404)
                    .json({ "message": "No reviews found" });
            }
        });
};
const reviewsUpdateOne = (req, res) => {
    if (!req.params.locationid || !req.params.reviewid) {
        return res
            .status(404)
            .json({ "message": "Not found, locationid and reviewsid are both required" });
    }
    Loc
        .findById(req.params.locationid)
        .select('reviews')
        .exec((err, location) => {
            if (!location) {
                return res
                    .status(404)
                    .json({ "message": "location not found" });
            } else if (err) {
                return res
                    .status(400)
                    .json(err);
            }
            if (location.reviews && location.reviews.length > 0) {
                const thisReview = location.reviews.id(req.params.reviewid);
                if (!thisReview) {
                    return res
                        .status(404)
                        .json({ "message": "Review not found" });
                } else {
                    thisReview.author = req.body.author;
                    thisReview.rating = req.body.rating;
                    thisReview.reviewText = req.body.reviewText;
                    location.save((err, loc) => {
                        if (err) {
                            res
                                .status(404)
                                .json(err);
                        } else {
                            updateAverageRating(location._id);
                            res
                                .status(200)
                                .json(loc);
                        }
                    });
                }
            } else {
                res
                    .status(404)
                    .json({ "message": "No review to update" });
            }

        });
};
const reviewsDeleteOne = (req, res) => {
    const { locationid, reviewid } = req.params;
    if (!locationid || !reviewid) {
        return res
            .status(404)
            .json({
                "message": "Not found, lcoationid and reviewid are both required"
            });
    }
    Loc
        .findById(locationid)
        .select('reviews')
        .exec((err, location) => {
            if (!location) {
                return res.status(404).json({ "message": "location not found" });
            } else if (err) {
                return res.status(400).json(err);
            }

            if (location.reviews && location.reviews.length > 0) {
                if (!location.reviews.id(reviewid)) {
                    return res.status(404).json({ "message": "Review not found" });
                } else {
                    location.reviews.id(reviewid).remove();
                    location.save(err => {
                        if (err) {
                            return res.status(404).json(err);
                        } else {
                            updateAverageRating(location._id);
                            res.status(204).json(null);
                        }
                    });
                }
            } else {
                res.status(404).json({ "message": "No Review to delete" });
            }
        });
};

module.exports = {
    reviewCreate,
    reviewsReadOne,
    reviewsUpdateOne,
    reviewsDeleteOne,
}