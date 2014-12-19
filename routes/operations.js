var router = require('express').Router();

      router.post('/project/create', function (req, res) {
            var data = req.body || {};
            return res.json(data);
      });
    
module.exports = router;
