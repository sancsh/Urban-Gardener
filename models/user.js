
var oracledb = require('oracledb');
var bcrypt = require('bcryptjs');
var method = User.prototype;
var dbConfig = require('../routes/dbConfig.js');

function User(username,password) {
    this._username = username;
    this._password = password;
    console.log("user created"+this._username);

}

method.getUser = function() {
    return this._username;
};
function userExists(username,next) {
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

                "SELECT ADMINS.USERNAME FROM ADMINS WHERE ADMINS.USERNAME='"+username+"'",

                function(err, results)
                {
                    if (err) {
                        console.error(err.message);
                        doRelease(connection);
                        return false;
                    }
                    //added else
                    else
                    {
                        //console.log("Response recieved",results.resultSet.getRows());
                        console.log(results.rows[0]);
                        //just have it inside an object to esily identify it while fetching
                        //res.send({resultobjectlength: results.rows});

                        //res.send( results.rows);

                        doRelease(connection);
                        if(results.rows[0]==undefined){
                            console.log('chalo false');
                            next(false);
                            //return false;
                        }
                        else{
                            console.log('chalo true');
                            next(true);
                        }
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
    //req.mySession.user = username;
    //console.log(req.mySession.username);

    return true;

}

module.exports = User;
module.exports.userExists = userExists;