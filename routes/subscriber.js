module.exports = function(subscriberService,app) {

    // routes
    app.post('/subscribe', function(req,res,next) {
        var data = req.body || {};

        if(!data || !data.email){
          return res.send(204,'No content'); // no content.
        }


        subscriberService.subscribe(data.email).then(function(subscriber){
            if (!subscriber) {
               return res.send(500,'Server Error');
            }else{
              return res.json(200,subscriber);
            }
        }, function(error){
          if(error === 'Already Subscribed'){
            return res.json(406 , 'Already subscribed');
          }
        });

    });

    
};
