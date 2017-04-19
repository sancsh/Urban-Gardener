var express = require('express');
var router = express.Router();
var jQuery = require('jquery');
var oracledb = require('oracledb');
var dbConfig = require('./dbConfig.js');
var Decimal = require('js-decimal').Decimal;
/* GET home page. */
router.post('/', function(req, res, next) {

    res.render('index', { title: 'Express' });
});
//__________________________________________________________
router.get('/aqi', function(req, res, next) {
    res.render('aqi', { title: 'Express' });
});
router.get('/gq', function(req, res, next) {
    res.render('gq', { title: 'Express' });
});
router.get('/vq', function(req, res, next) {
    res.render('vq', { title: 'Express' });
});
//AQI REQUESTS___________________________________________________________
router.get('/aqi/pasttrends', function(req, res, next) {
   // console.log(req);
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
                "SELECT AREA_ID,AQI_TREND,DATE_RECORDED FROM (SELECT P.AREA_ID,CEIL(AVG(P.AQI)) AS AQI_TREND,TO_CHAR(P.DATE_RECORDED, 'YYYY-MM') AS DATE_RECORDED FROM POLLUTION P INNER JOIN AREAS A ON P.AREA_ID=A.AREA_ID WHERE A.AREA_NAME=:id GROUP BY P.AREA_ID,TO_CHAR(P.DATE_RECORDED, 'YYYY-MM')ORDER BY TO_CHAR(P.DATE_RECORDED, 'YYYY-MM') DESC)WHERE ROWNUM<=10",
                //"SELECT length,country1 FROM borders WHERE country1 = :id",
                [req.query.data],
                //extra part for resutltset
                /*{
                 resultSet: true,
                 prefetchRows: 1000
                 },*/
                // Optional execute options argument, such as the query result format
                // or whether to get extra metadata
                // { outFormat: oracledb.OBJECT, extendedMetaData: true },

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
                        res.send({chartdata: results.rows});


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


router.get('/aqi/trendtopfive', function(req, res, next) {
    //  var actualquery1="SELECT AREA_NAME FROM (SELECT A.AREA_NAME FROM POLLUTION P INNER JOIN AREAS A ON P.AREA_ID=A.AREA_ID GROUP BY A.AREA_NAME ORDER BY AVG(P.AQI) ASC )WHERE ROWNUM<=6 OR AREA_NAME= '" + req.query.data + "'";
    var actualquery1="SELECT AREA_NAME FROM (SELECT A.AREA_NAME FROM POLLUTION P INNER JOIN AREAS A ON P.AREA_ID=A.AREA_ID GROUP BY A.AREA_NAME ORDER BY AVG(P.AQI) ASC )WHERE ROWNUM<=6";
    console.log(actualquery1);
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
                actualquery1,
                function(err, results1)
                {
                    if (err) {
                        console.error(err.message);
                        doRelease(connection);

                        return;
                    }
                    //added else
                    else
                    {



                        var flag = true;
                        for(var i in results1.rows){
                            if(results1.rows[i][0] == req.query.data )
                                flag = false;
                        }

                        //flag = false => the 6 rows fetched have req.query.data => do nothing
                        //if flag = true => delete the last row

                        if(flag == true){
                            results1.rows[5][0] = req.query.data;
                        }

                        console.log("Printing new rows*******");

                        console.log(results1.rows);

                        console.log("Done printing new rows");












                        var query1 ="SELECT * FROM ( SELECT AREA_NAME ,AQI_TREND ,DATE_RECORDED FROM ( SELECT P.AREA_ID ,A.AREA_NAME ,CEIL(AVG(P.AQI)) AS AQI_TREND ,TO_CHAR(P.DATE_RECORDED, 'YYYY-MM') AS DATE_RECORDED FROM POLLUTION P INNER JOIN AREAS A ON P.AREA_ID=A.AREA_ID WHERE A.AREA_NAME IN ( (SELECT AREA_NAME FROM (SELECT A.AREA_NAME FROM POLLUTION P INNER JOIN AREAS A ON P.AREA_ID=A.AREA_ID GROUP BY A.AREA_NAME ORDER BY AVG(P.AQI) ASC )WHERE ROWNUM<=5 OR AREA_NAME='Golden Gate') ) GROUP BY P.AREA_ID,A.AREA_NAME,TO_CHAR(P.DATE_RECORDED, 'YYYY-MM') ORDER BY TO_CHAR(P.DATE_RECORDED, 'YYYY-MM') DESC ) WHERE ROWNUM<=20 ) PIVOT (SUM(AQI_TREND) AS AQI_TREND FOR (AREA_NAME)IN (";
                        var query2 =")) ORDER BY DATE_RECORDED";
                        var finalquery = query1;
                        for(var i in results1.rows){
                            console.log(results1.rows[i][0]);
                            finalquery = finalquery+"'"+results1.rows[i][0]+"'";
                            if(i<(results1.rows.length-1)){
                                finalquery = finalquery+",";
                            }
                            else{
                                finalquery = finalquery+query2;
                            }
                            //console.log(result[1]);
                        }
                        console.log(finalquery);
                        //var query1 ="SELECT * FROM ( SELECT AREA_NAME ,AQI_TREND ,DATE_RECORDED FROM ( SELECT P.AREA_ID ,A.AREA_NAME ,ROUND(AVG(P.AQI),3) AS AQI_TREND ,TO_CHAR(P.DATE_RECORDED, 'YYYY-MM') AS DATE_RECORDED FROM POLLUTION P INNER JOIN AREAS A ON P.AREA_ID=A.AREA_ID WHERE A.AREA_NAME IN ( (SELECT AREA_NAME FROM (SELECT A.AREA_NAME FROM POLLUTION P INNER JOIN AREAS A ON P.AREA_ID=A.AREA_ID GROUP BY A.AREA_NAME ORDER BY AVG(P.AQI) ASC )WHERE ROWNUM<=5 OR AREA_NAME='Golden Gate') ) GROUP BY P.AREA_ID,A.AREA_NAME,TO_CHAR(P.DATE_RECORDED, 'YYYY-MM') ORDER BY TO_CHAR(P.DATE_RECORDED, 'YYYY-MM') DESC ) WHERE ROWNUM<=20 ) PIVOT (SUM(AQI_TREND) AS AQI_TREND FOR (AREA_NAME)IN ('";
                        //var query2 ="')) ORDER BY DATE_RECORDED";
                        //var actualquery2 = query1+area1+"',"+"'"+area2+"',"+"'"+area3+"',"+"'"+area4+"',"+"'"+area5+query2;
                        //console.log(actualquery2);

                        connection.execute(

                            finalquery,
                            //"SELECT * FROM ( SELECT AREA_NAME ,AQI_TREND ,DATE_RECORDED FROM ( SELECT P.AREA_ID ,A.AREA_NAME ,ROUND(AVG(P.AQI),3) AS AQI_TREND ,TO_CHAR(P.DATE_RECORDED, 'YYYY-MM') AS DATE_RECORDED FROM POLLUTION P INNER JOIN AREAS A ON P.AREA_ID=A.AREA_ID WHERE A.AREA_NAME IN ( (SELECT AREA_NAME FROM (SELECT A.AREA_NAME FROM POLLUTION P INNER JOIN AREAS A ON P.AREA_ID=A.AREA_ID GROUP BY A.AREA_NAME ORDER BY AVG(P.AQI) ASC )WHERE ROWNUM<=5 OR AREA_NAME='Golden Gate') ) GROUP BY P.AREA_ID,A.AREA_NAME,TO_CHAR(P.DATE_RECORDED, 'YYYY-MM') ORDER BY TO_CHAR(P.DATE_RECORDED, 'YYYY-MM') DESC ) WHERE ROWNUM<=20 ) PIVOT (SUM(AQI_TREND) AS AQI_TREND FOR (AREA_NAME)IN ('Golden Gate','Noe Valley','Napa','Chinatown','Cole Valley')) ORDER BY DATE_RECORDED",

                            function(err, results2)
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
                                    //console.log(results2.rows);
                                    //just have it inside an object to esily identify it while fetching
                                    res.send({chartdata: results2.rows});

                                    doRelease(connection);
                                }
                                //console.log(results.metaData);
                                //console.log(results.rows);     // [ [ 180, 'Construction' ] ]

                            });

                    }

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
    //res.send('hello pasttrends');
});

router.get('/aqi/currenttopfive', function(req, res, next) {

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
                "SELECT AREA_NAME,AQI,DATE_RECORDED FROM (SELECT A.AREA_NAME,P.AQI,P.DATE_RECORDED FROM POLLUTION P INNER JOIN AREAS A ON P.AREA_ID=A.AREA_ID WHERE DATE_RECORDED=(SELECT MAX(DATE_RECORDED) FROM POLLUTION) ORDER BY AQI DESC)WHERE ROWNUM<=6 OR AREA_NAME=:id",
                [req.query.data],

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
                        res.send({chartdata: results.rows});

                        doRelease(connection);
                    }

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
    //res.render('aqi', { title: 'Express' });
    //res.send('hello currenttopfive');
});

//GQ REQUESTS___________________________________________________________
router.get('/gq/pasttrends', function(req, res, next) {
    console.log("This is request" );

    console.log(req);
    console.log("This is ");
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
                //"SELECT AREA_ID,AQI_TREND,DATE_RECORDED FROM (SELECT P.AREA_ID,ROUND(AVG(P.AQI),3) AS AQI_TREND,TO_CHAR(P.DATE_RECORDED, 'YYYY-MM') AS DATE_RECORDED FROM POLLUTION P INNER JOIN AREAS A ON P.AREA_ID=A.AREA_ID WHERE A.AREA_NAME=:id GROUP BY P.AREA_ID,TO_CHAR(P.DATE_RECORDED, 'YYYY-MM')ORDER BY TO_CHAR(P.DATE_RECORDED, 'YYYY-MM') DESC)WHERE ROWNUM<=10",
                "SELECT AREA_ID,GQ_TREND,DATE_RECORDED FROM (SELECT T.AREA_ID,CEIL(AVG(T.GQ)) AS GQ_TREND, TO_CHAR(T.DATE_RECORDED, 'YYYY-MM') AS DATE_RECORDED FROM TRENDS T INNER JOIN AREAS A ON T.AREA_ID=A.AREA_ID WHERE A.AREA_NAME=:id GROUP BY T.AREA_ID,TO_CHAR(T.DATE_RECORDED, 'YYYY-MM') ORDER BY TO_CHAR(T.DATE_RECORDED, 'YYYY-MM') DESC) WHERE ROWNUM<=10",
               // "SELECT AREA_NAME FROM AREAS",
                //[],
                [req.query.data],
                //extra part for resutltset
                /*{
                 resultSet: true,
                 prefetchRows: 1000
                 },*/
                // Optional execute options argument, such as the query result format
                // or whether to get extra metadata
                // { outFormat: oracledb.OBJECT, extendedMetaData: true },

                // The callback function handles the SQL execution results
                function(err, results)
                {
                    if (err) {
                        console.log("bye");
                        console.error(err.message);
                        doRelease(connection);
                        return;
                    }
                    //added else
                    else
                    {
                        //console.log("Response recieved",results.resultSet.getRows());
                        console.log("Hello");
                        console.log(results.rows);
                        //just have it inside an object to esily identify it while fetching
                        res.send({chartdata: results.rows});

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

router.get('/gq/trendtopfive', function(req, res, next) {


    // var actualquery1="select area_name from (select * from GQ_TRENDS order by GQ asc) where rownum<=5 OR AREA_NAME= '" + req.query.data + "'";

    var actualquery1="select area_name from (select * from GQ_TRENDS order by GQ asc) where rownum<=6";
    console.log(actualquery1);
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
                actualquery1,
                function(err, results1)
                {
                    if (err) {
                        console.error(err.message);
                        doRelease(connection);

                        return;
                    }
                    //added else
                    else
                    {

                        var flag = true;
                        for(var i in results1.rows){
                            if(results1.rows[i][0] == req.query.data )
                                flag = false;
                        }

                        //flag = false => the 6 rows fetched have req.query.data => do nothing
                        //if flag = true => delete the last row

                        if(flag == true){
                            results1.rows[5][0] = req.query.data;
                        }

                        console.log("Printing new rows*******");

                        console.log(results1.rows);

                        console.log("Done printing new rows");
                        var query1 ="SELECT * FROM (SELECT AREA_NAME ,GQ_TREND ,DATE_RECORDED FROM ( SELECT T.AREA_ID, A.AREA_NAME ,CEIL(AVG(T.GQ)) AS GQ_TREND,TO_CHAR(T.DATE_RECORDED, 'YYYY-MM') AS DATE_RECORDED FROM TRENDS T INNER JOIN AREAS A ON T.AREA_ID=A.AREA_ID WHERE A.AREA_NAME IN ((SELECT AREA_NAME FROM (SELECT A.AREA_NAME FROM TRENDS T INNER JOIN AREAS A ON T.AREA_ID=A.AREA_ID GROUP BY A.AREA_NAME ORDER BY AVG(T.GQ) ASC)WHERE ROWNUM<=5 OR AREA_NAME='Golden Gate')) GROUP BY T.AREA_ID,A.AREA_NAME,TO_CHAR(T.DATE_RECORDED, 'YYYY-MM')ORDER BY TO_CHAR(T.DATE_RECORDED, 'YYYY-MM') DESC) WHERE ROWNUM<=20)PIVOT (SUM(GQ_TREND) AS GQ_TREND FOR (AREA_NAME)IN (";
                        var query2 =")) ORDER BY DATE_RECORDED";
                        var finalquery = query1;
                        for(var i in results1.rows){
                            console.log(results1.rows[i][0]);
                            finalquery = finalquery+"'"+results1.rows[i][0]+"'";
                            if(i<(results1.rows.length-1)){
                                finalquery = finalquery+",";
                            }
                            else{
                                finalquery = finalquery+query2;
                            }
                            //console.log(result[1]);
                        }

                        console.log(finalquery);


                        connection.execute(

                            finalquery,


                            function(err, results2)
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
                                    //console.log(results2.rows);
                                    //just have it inside an object to esily identify it while fetching
                                    res.send({chartdata: results2.rows});
                                    console.log(results2.rows);
                                    doRelease(connection);
                                }
                                //console.log(results.metaData);
                                //console.log(results.rows);     // [ [ 180, 'Construction' ] ]

                            });

                    }

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
    //res.send('hello pasttrends');



});

router.get('/gq/currenttopfive', function(req, res, next) {
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
               // "SELECT AREA_NAME,AQI,DATE_RECORDED FROM (SELECT A.AREA_NAME,P.AQI,P.DATE_RECORDED FROM POLLUTION P INNER JOIN AREAS A ON P.AREA_ID=A.AREA_ID WHERE DATE_RECORDED=(SELECT MAX(DATE_RECORDED) FROM POLLUTION) ORDER BY AQI DESC)WHERE ROWNUM<=6 OR AREA_NAME='Chinatown'",
                "SELECT AREA_NAME,GQ,DATE_RECORDED FROM (SELECT A.AREA_NAME,T.GQ,T.DATE_RECORDED FROM TRENDS T INNER JOIN AREAS A ON T.AREA_ID=A.AREA_ID WHERE DATE_RECORDED=(SELECT MAX(DATE_RECORDED) FROM TRENDS) ORDER BY GQ DESC)WHERE ROWNUM<=6 OR AREA_NAME=:id",
                [req.query.data],

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
                        res.send({chartdata: results.rows});

                        doRelease(connection);
                    }

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

//VQ REQUESTS___________________________________________________________
//VQ REQUESTS___________________________________________________________
router.get('/vq/pasttrends', function(req, res, next) {
    // console.log(req);
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
                "SELECT AREA_ID ,VQ_TREND ,DATE_RECORDED FROM ( SELECT T.AREA_ID ,CEIL(AVG(T.VQ)) AS VQ_TREND ,TO_CHAR(T.DATE_RECORDED, 'YYYY-MM') AS DATE_RECORDED FROM TRENDS T INNER JOIN AREAS A ON T.AREA_ID=A.AREA_ID WHERE A.AREA_NAME=:id GROUP BY T.AREA_ID,TO_CHAR(T.DATE_RECORDED, 'YYYY-MM') ORDER BY TO_CHAR(T.DATE_RECORDED, 'YYYY-MM') DESC ) WHERE ROWNUM<=10",


                [req.query.data],
                //extra part for resutltset
                /*{
                 resultSet: true,
                 prefetchRows: 1000
                 },*/
                // Optional execute options argument, such as the query result format
                // or whether to get extra metadata
                // { outFormat: oracledb.OBJECT, extendedMetaData: true },

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
                        res.send({chartdata: results.rows});

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

router.get('/vq/trendtopfive', function(req, res, next) {


    // var actualquery1="SELECT AREA_NAME FROM (SELECT A.AREA_NAME FROM TRENDS T INNER JOIN AREAS A ON T.AREA_ID=A.AREA_ID GROUP BY A.AREA_NAME ORDER BY AVG(T.VQ) ASC )WHERE ROWNUM<=5 OR AREA_NAME= '" + req.query.data + "'";
    var actualquery1="SELECT AREA_NAME FROM (SELECT A.AREA_NAME FROM TRENDS T INNER JOIN AREAS A ON T.AREA_ID=A.AREA_ID GROUP BY A.AREA_NAME ORDER BY AVG(T.VQ) ASC )WHERE ROWNUM<=6";

    console.log(actualquery1);
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
                actualquery1,
                function(err, results1)
                {
                    if (err) {
                        console.error(err.message);
                        doRelease(connection);

                        return;
                    }
                    //added else
                    else
                    {

                        var flag = true;
                        for(var i in results1.rows){
                            if(results1.rows[i][0] == req.query.data )
                                flag = false;
                        }

                        //flag = false => the 6 rows fetched have req.query.data => do nothing
                        //if flag = true => delete the last row

                        if(flag == true){
                            results1.rows[5][0] = req.query.data;
                        }

                        console.log("Printing new rows*******");

                        console.log(results1.rows);

                        console.log("Done printing new rows");


                        var query1 ="SELECT * FROM ( SELECT AREA_NAME ,VQ_TREND ,DATE_RECORDED FROM ( SELECT T.AREA_ID ,A.AREA_NAME ,CEIL(AVG(T.VQ)) AS VQ_TREND ,TO_CHAR(T.DATE_RECORDED, 'YYYY-MM') AS DATE_RECORDED FROM TRENDS T INNER JOIN AREAS A ON T.AREA_ID=A.AREA_ID WHERE A.AREA_NAME IN ((SELECT AREA_NAME FROM (SELECT A.AREA_NAME FROM TRENDS T INNER JOIN AREAS A ON T.AREA_ID=A.AREA_ID GROUP BY A.AREA_NAME ORDER BY AVG(T.VQ) ASC )WHERE ROWNUM<=5 OR AREA_NAME='Golden Gate') ) GROUP BY T.AREA_ID,A.AREA_NAME,TO_CHAR(T.DATE_RECORDED, 'YYYY-MM') ORDER BY TO_CHAR(T.DATE_RECORDED, 'YYYY-MM') DESC ) WHERE ROWNUM<=20 ) PIVOT (SUM(VQ_TREND) AS VQ_TREND FOR (AREA_NAME)IN (";
                        var query2 =")) ORDER BY DATE_RECORDED";
                        var finalquery = query1;
                        for(var i in results1.rows){
                            console.log(results1.rows[i][0]);
                            finalquery = finalquery+"'"+results1.rows[i][0]+"'";
                            if(i<(results1.rows.length-1)){
                                finalquery = finalquery+ ",";
                            }
                            else{
                                finalquery = finalquery + query2;
                            }

                        }

                        console.log(finalquery);


                        connection.execute(
                            finalquery,

                            function(err, results2)
                            {
                                if (err) {
                                    console.error(err.message);
                                    doRelease(connection);
                                    return;
                                }
                                //added else
                                else
                                {
                                    res.send({chartdata: results2.rows});
                                    console.log(results2.rows);
                                    doRelease(connection);
                                }

                            });

                    }

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
    //res.send('hello pasttrends');




});

router.get('/vq/currenttopfive', function(req, res, next) {
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

            console.log(req.query.data);
            connection.execute(

                "SELECT AREA_NAME,VQ,DATE_RECORDED FROM (SELECT A.AREA_NAME,T.VQ,T.DATE_RECORDED FROM TRENDS T INNER JOIN AREAS A ON T.AREA_ID=A.AREA_ID WHERE DATE_RECORDED= (SELECT MAX(DATE_RECORDED) FROM TRENDS) ORDER BY VQ DESC) WHERE ROWNUM<=6 OR AREA_NAME=:id",
                [req.query.data],


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
                        res.send({chartdata: results.rows});

                        doRelease(connection);
                    }

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
//__________________________________________________________
module.exports = router;
