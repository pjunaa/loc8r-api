const { response } = require('express');
const request = require('request');

const apiOptions = {
  server: 'http://localhost:3000'
};
if(process.env.NODE_ENV === 'production'){
  apiOptions.server = 'https://loc8rv2.herokuapp.com';
}

const requestOptions = {
  url: 'http://yourapi.com/api/path',
  method: 'GET',
  json: {},
  qs: {
    offset: 20
  }
};
request(requestOptions, (err, response, body) => {
  if(err){
    console.log(err);
  } else if(response.statusCode === 200){
    console.log(body);
  } else{
    console.log(response.statusCode);
  }
});

const homelist = (req, res) => {
  const path = '/api/locations';
  const requestOptions = {
    url: `${apiOptions.server}${path}`,
    method: 'GET',
    json: {},
    qs: {
      lng: 127.2724,
      lat: 37.00324,
      maxDistance: 20000
    }
  };
  request(
    requestOptions,
    (err, {statusCode}, body) => {
      let data = [];
      if (statusCode === 200 && body.length){
        data = body.map( (item) => {
          item.distance = formatDistance(item.distance);
          return item;
        });
      };
      renderHomepage(req, res, body);
    }
  );
};

const formatDistance = (distance) => {
  let thisDistance = 0;
  let unit = 'm';
  if (distance > 1000) {
    thisDistance = parseFloat(distance/1000).toFixed(1);
    unit = 'km';
  } else {
    thisDistance = Math.floor(distance);
  }
  return thisDistance + unit;
};

const renderHomepage = function(req, res, responseBody){
  let message = null;
  if (!(responseBody instanceof Array)) {
    message = "API lookup error";
    responseBody = [];
  } else {
    if (!responseBody.length){
      message = "No places found nearby";
    }
  }

  res.render('locations-list', {
    title: 'Loc8r - 2019250022_박준수',
    pageHeader: {
      title: 'Loc8r',
      starpline: 'Find places!'
    },
    sidebar: "Looking for wifi? Loc8r helps you find places. Perhaps with coffee, drinks?",
    locations: responseBody,
    message
  });
};

const renderDetailPage = function(req, res, location){
  res.render('location-info', {
    title: location.name,
    pageHeader: {
      title: location.name
    },
    sidebar: {
      context: 'is on Loc8r beacuse it has ... work done.',
      callToAction: 'If you have been and you like it ... 20192500022_Junsu Park.'
    },
    location
  });
};

/*GET 'Location info' page */
const getLocationInfo = (req, res, callback) => {
  const path = `/api/locations/${req.params.locationid}`;
  const requestOptions = {
    url : `${apiOptions.server}${path}`,
    method : 'GET',
    json : {}
  };
  request(
    requestOptions,
    (err, {statusCode}, body) => {
      let data = body;
      if (statusCode === 200){
        data.coords = {
          lng : body.coords[0],
          lat : body.coords[1]
        };
        callback(req, res, data);
      } else {
        showError(req, res, statusCode);
      }
    }
  );
};

const locationInfo = (req, res) => {
  getLocationInfo(req, res,
    (req, res, responseData) => renderDetailPage(req, res, responseData)
  );
};

const addReview = (req, res) => {
  getLocationInfo(req, res,
    (req, res, responseData) => renderReviewForm(req, res, responseData)
  );
};

const showError = (req, res, status) => {
  let title = '';
  let content = '';
  if (status === 404){
    title = '404, page not found _2019250022_박준수';
    content = 'Looks like you cannot find this page. Sry.';
  } else {
    title = `${status}, something is gone wrong.`;
    content = 'Something, somewhere, little bit wrong.';
  }
  res.status(status);
  res.render('generic-text', {
    title,
    content
  });
};

const renderReviewForm = function (req, res, {name}) {
  res.render('location-review-form', {
    title: `Review ${name} on Loc8r`,
    pageHeader: { title: `Review ${name}` },
    error: req.query.err
  });
};

const doAddReview = (req, res) => {
  const locationid = req.params.locationid;
  const path = `/api/locations/${locationid}/reviews`;
  const postdata = {
    author: req.body.name,
    rating: parseInt(req.body.rating, 10),
    reviewText: req.body.review
  };
  const requestOptions = {
    url: `${apiOptions.server}${path}`,
    method: 'POST',
    json: postdata
  };
  if (!postdata.author || !postdata.rating || !postdata.reviewText) {
    res.redirect(`/locations/${locationid}/review/new?err=val`);
  } else {
    request(
      requestOptions,
      (err, {statusCode}, {name}) => {
        if(statusCode === 201){
          res.redirect(`/location/${locationid}`);
        } else if(statusCode === 400 && name && name === 'ValidationError'){
          res.redirect(`/location/${locationid}/review/new?err=val`);
        } else{
          showError(req, res, statusCode);
        }
      }
    );
  }
};

module.exports = {
  homelist,
  locationInfo,
  addReview,
  doAddReview
};
