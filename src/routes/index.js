const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt'); 
const saltRounds = 10; 

router.get('/login', (req, res) => {
    return res.render('login');
});

router.get('/signup', (req, res) => { 
    return res.render('signup');
});

router.get('/', (req, res) => {
    return res.redirect('/posts');
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    const query = 'SELECT id, email, password, nickname, role FROM users WHERE email = ?';
    
    db.query(query, [email], (err, results) => {
        
        if (err) {
            console.error(err);
            return res.status(500).render('login', { error: '서버 오류가 발생했습니다.' });
        }

        if (results.length === 0) {
            return res.render('login', { error: '이메일 혹은 비밀번호가 틀립니다.' });
        }

        const user = results[0];
        
        bcrypt.compare(password, user.password, (err, isMatch) => {
            
            if (err) {
                console.error(err);
                return res.status(500).render('login', { error: '서버 오류가 발생했습니다.' });
            }

            if (isMatch) {
                req.session.user = {
                    id: user.id,
                    nickname: user.nickname,
                    email: user.email,
                    role: user.role
                };
                
                return res.redirect('/posts');
            } else {
                return res.render('login', { error: '이메일 혹은 비밀번호가 틀립니다.' });
            }
        });
    });
}); 

router.post('/signup', (req, res) => {
    const { email, password, username } = req.body;
    const checkQuery = 'SELECT id FROM users WHERE email = ?';

    db.query(checkQuery, [email], (err, results) => {

        if (err) {
            return res.render('signup', { error: 'DB 쿼리 오류!' });
        }

        if (results.length > 0) {
            return res.render('signup', { error: '동일한 이메일을 사용하고 있습니다.' });
        }

        bcrypt.hash(password, saltRounds, (err, hash) => {
            
            if (err) {
                return res.render('signup', { error: '패스워드 처리 중 오류가 발생했습니다.' });
            }

            const signupQuery = 'INSERT INTO users (email, password, nickname) VALUES (?, ?, ?)'; 

            db.query(signupQuery, [email, hash, username], (err, insertResults) => { 
                
                if (err) {
                    console.error(err);
                    return res.render('signup', { error: '가입 처리 중 DB 오류.' });
                }

                return res.redirect('/login');
            });
        });
    });
});

router.get('/logout', (req, res) => {
    
    req.session.destroy(err => {
        
        if (err) {
            console.error(err); 
            return res.status(500).send('서버 오류로 로그아웃에 실패했습니다.'); 
        }

        return res.redirect('/');
    });
});

module.exports = router;