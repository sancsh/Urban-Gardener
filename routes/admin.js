var express = require('express');
//var validator = require('express-validator');
var router = express.Router();
var User = require('../models/user.js');
var oracledb = require('oracledb');
var dbConfig = require('./dbConfig.js');
//var Chart = require('chart.js');
//var $ = require('jquery');
//var dt = require('datatables.net')();
//var buttons = require( 'datatables.net-buttons' )();

//router.use(validator());
//home ------------------------------------------------------
router.get('/home', function(req, res, next) {
    if(!(req.mySession.username==undefined)){
        res.render('admin/home', { title: 'Admin Home' });
    }
    else{
        res.render('admin/login', { title: 'Login' });
    }

});
//login get --------------------------------------------------------
router.get('/login', function(req, res, next) {
    if(!(req.mySession.username==undefined)){
        res.redirect('/admin/home');
    }
    else{
        res.render('admin/login', { title: 'Login' });
    }


});

//LOGIN POST--------------------------------------------
router.post('/login', function(req, res,next) {
    if(!(req.mySession.username==undefined)){
        res.redirect('/admin/home');
    }

    var username = req.body.username;
    var password = req.body.password;
    //console.log(name);
    User.userExists(username,function(data){
        console.log("smthin bttr than nthin");
        if(data){
            //console.log("true aaya hai bhai");
            req.mySession.username = username;
            res.redirect('/admin/home');
        }
        else{
            //console.log("false aaya hai bhai");
            res.redirect('/admin/login');
        }
    });

});
//__________________________________________________________
router.get('/gqdef', function(req, res, next) {
    console.log("Reached");
    oracledb.getConnection(
        {
            user: dbConfig.user,
            password: dbConfig.password,
            connectString:dbConfig.connectionstring
        }
        ,
        function(err, connection)
        {
            if (err) {
                console.error(err.message);


                return;
            }
            connection.execute(
                // The statement to execute
                "SELECT DISTINCT A.AREA_ID AS DANGER_AREAS ,A.AREA_NAME ,ROUND(A.GQ,1) AS CURRENT_GQ ,ROUND((ROUND((SI.FUTURE_AQI)*10,2)+ COUNT(T.TREE_ID))/A.POPULATION*500,2) AS FUTURE_GQ FROM SLOPE_INTERCEPT SI INNER JOIN AREAS A ON SI.AREA_ID=A.AREA_ID INNER JOIN TREES T ON A.AREA_ID=T.AREA_ID GROUP BY A.AREA_ID,A.AREA_NAME,A.GQ,SI.FUTURE_AQI,T.TREE_ID,A.POPULATION HAVING ROUND((ROUND((SI.FUTURE_AQI)*10,2)+ COUNT(T.TREE_ID))/A.POPULATION*500,2)<4",
                //"SELECT length,country1 FROM borders WHERE country1 = :id",



                // The callback function handles the SQL execution results
                function(err, results)
                {
                    if (err) {
                        console.error(err.message);
                        doRelease(connection);
                        return;
                    }
                    //added else
                    else
                    {
                        //console.log("Response recieved",results.resultSet.getRows());
                        console.log(results.rows);
                        //just have it inside an object to esily identify it while fetching
                        res.send({tabledata: results.rows});

                        doRelease(connection);
                    }
                    //console.log(results.metaData);
                    //console.log(results.rows);     // [ [ 180, 'Construction' ] ]

                });
        });

// Note: connections should always be released when not needed
    function doRelease(connection)
    {
        connection.close(
            function(err) {
                if (err) {
                    console.error(err.message);
                }
            });
    }
});


//_______
router.get('/treesuggest', function(req, res, next) {
    //console.log("Reached tree suggest");
    //console.log(JSON.stringify(req.query.data.query ));
    oracledb.getConnection(
        {
            user: dbConfig.user,
            password: dbConfig.password,
            connectString:dbConfig.connectionstring
        }
        ,
        function(err, connection)
        {
            if (err) {
                console.error(err.message);

                return;
            }

            var area =  (req.query.data.areaName) ;

            var check = parseInt(req.query.data.val);
            console.log("check is" + check);
            var query1="SELECT TS.SPECIES_ID ,TS.SPECIES_NAME ,TS.PRUNING_DURATION ,TS.TEMP_REQUIRED ,TS.WATER_REQUIRED ,S.SUPPLIER_ID ,S.SUPPLIER_NAME ,ROUND(S.TREE_COST,2) ,S.RATING ,ROUND(10/(select A.GQ * 100 FROM AREAS A WHERE A.AREA_NAME= '" +area + "'  ))AS QUANTITY_TO_BE_PLANTED ,ROUND(10/(select A.GQ * 100 FROM AREAS A WHERE A.AREA_NAME= '" +area + "' )) AS TOTAL_COST From TREE_SPECIES TS INNER JOIN SUPPLIERS S ON TS.SPECIES_ID=S.SPECIES_ID WHERE TS.TEMP_REQUIRED between (SELECT A.TEMPERATURE FROM AREAS A WHERE A.AREA_NAME= '" +area + "') AND (SELECT A.TEMPERATURE+100 FROM AREAS A WHERE A.AREA_NAME= '" +area +"' ) AND TS.WATER_REQUIRED BETWEEN (SELECT A.RAINFALL-80 FROM AREAS A WHERE A.AREA_NAME= '" +area + "' ) AND (SELECT A.RAINFALL+10 FROM AREAS A WHERE A.AREA_NAME= '"+area +"' ) GROUP BY TS.SPECIES_ID,TS.SPECIES_NAME,TS.PRUNING_DURATION,TS.TEMP_REQUIRED,TS.WATER_REQUIRED,S.SUPPLIER_ID,S.SUPPLIER_NAME,S.TREE_COST,S.RATING ";

            switch(check)
            {
                case 0:

                query2 = " ORDER BY S.TREE_COST ASC, S.RATING ASC";
                    finalquery = query1 + query2;
                // The statement to execute

                console.log("case 0");

                connection.execute(
                    finalquery,

                    //"SELECT length,country1 FROM borders WHERE country1 = :id",


                    // The callback function handles the SQL execution results
                    function (err, results) {
                        if (err) {
                            console.error(err.message);
                            doRelease(connection);
                            return;
                        }
                        //added else
                        else {

                            res.send({tabledata: results.rows});

                            doRelease(connection);
                        }
                    });

            break;
            case 1:
                query2 = " ORDER BY S.TREE_COST DESC, S.RATING ASC";
                finalquery = query1 + query2;
                console.log(finalquery);
                console.log("case 1");


                connection.execute(
                    finalquery,
                    function (err, results) {
                        if (err) {
                            console.error(err.message);
                            doRelease(connection);
                            return;
                        }
                        //added else
                        else {

                            res.send({tabledata: results.rows});
                            console.log(results.rows);

                            doRelease(connection);
                        }
                    }
                );

            break;
            case 2:
                query2 = " ORDER BY S.TREE_COST DESC, S.RATING DESC";
                finalquery = query1 + query2;
            connection.execute(
                finalquery,
                function (err, results) {
                    if (err) {
                        console.error(err.message);
                        doRelease(connection);
                        return;
                    }
                    //added else
                    else {

                        res.send({tabledata: results.rows});

                        doRelease(connection);
                    }
                }
            );
            break;
                case 3:
                    query2 = " ORDER BY S.TREE_COST ASC, S.RATING DESC";
                    finalquery = query1 + query2;
                    connection.execute(
                        finalquery,
                        function (err, results) {
                            if (err) {
                                console.error(err.message);
                                doRelease(connection);
                                return;
                            }
                            //added else
                            else {

                                res.send({tabledata: results.rows});

                                doRelease(connection);
                            }
                        }
                    );
                    break;

                default:

                    connection.execute(

                        query1,
                        function (err, results) {
                            if (err) {
                                console.error(err.message);
                                doRelease(connection);
                                return;
                            }
                            //added else
                            else {

                                res.send({tabledata: results.rows});

                                doRelease(connection);
                            }



                        }
                    );
                    console.log("in default");

            }
});

// Note: connections should always be released when not needed
    function doRelease(connection)
    {
        connection.close(
            function(err) {
                if (err) {
                    console.error(err.message);
                }
            });
    }

});
//___________


module.exports = router;
