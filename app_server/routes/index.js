var express = require('express');
var router = express.Router();

const ctrlLocation = require('../controllers/locations');
const ctrlOther = require('../controllers/others');


router.get('/',ctrlLocation.homelist);
router.get('/location/:locationid',ctrlLocation.locationInfo);
router
    .route('/location/:locationid/review/new')
    .get(ctrlLocation.addReview)
    .post(ctrlLocation.doAddReview);
    
router.get('/about',ctrlOther.about);


module.exports = router;
