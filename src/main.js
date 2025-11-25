const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'my_secret_key_1234',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 1000 * 60 * 60 
    }
}));

const indexRoutes = require('./routes/index'); 
const postRoutes = require('./routes/post');

app.use('/', indexRoutes);
app.use('/', postRoutes); 

app.listen(PORT, () => {
    console.log(`서버가 실행되었습니다: http://localhost:${PORT}`);
});