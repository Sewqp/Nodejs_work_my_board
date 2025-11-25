const mysql = require('mysql2');

const dbconnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'rootroot', 
    database: 'my_board_db'
});

dbconnection.connect(error => {
    if (error) {
        console.error("DB 연결 실패:", error);
        return;
    }
    console.log("DB 연결 완료.");
});

module.exports = dbconnection;