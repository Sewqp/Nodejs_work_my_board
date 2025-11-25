const express = require('express');
const router = express.Router();
const db = require('../config/db'); 

router.get('/post-upload', (req, res) => {
    if (!req.session.user) {
        return res.render('login', { error: '로그인이 필요합니다.' });
    }
    return res.render('post-upload', { sessionUser: req.session.user });
});

router.get('/post-Update', (req, res) => {
    if (!req.session.user) {
        return res.render('login', { error: '로그인이 필요합니다.' });
    }

    const post_id = req.query.id;
    const query = 'SELECT * FROM posts WHERE post_id = ?';

    db.query(query, [post_id], (err, results) => {
        if (err) {
            return res.render('error', { message: 'DB 오류 발생' });
        }
        if (results.length === 0) {
            return res.render('error', { message: '게시글을 찾을 수 없습니다.' });
        }
        if (Number(results[0].user_id) !== Number(req.session.user.id)) {
            return res.render('error', { message: '수정 권한이 없습니다.' });
        }
        return res.render('post-Update', { post: results[0] });
    });
});

router.get('/posts', (req, res) => {
    const query = 'SELECT p.post_id, p.board_id, p.title, u.nickname, p.view, p.created_at FROM posts p JOIN users u ON p.user_id = u.id ORDER BY (p.board_id = 2) DESC, p.created_at DESC LIMIT 20;';

    db.query(query, (err, results) => {
        if (err) {
            return res.render('error', {message:'게시글 불러오기 실패.'});
        }
        return res.render('main', {posts: results, sessionUser: req.session.user});
    });
});

router.get('/posts/:id', (req, res) => {
    const post_id = req.params.id;
    const updateViewQuery = 'UPDATE posts set view = view + 1 WHERE post_id = ?';
    const selectPostQuery = 'SELECT p.*, u.nickname FROM posts p JOIN users u ON p.user_id = u.id WHERE p.post_id = ?';
    const selectCommentQuery = 'SELECT c.*, u.nickname FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ? ORDER BY c.created_at ASC';
    
    new Promise((resolve, reject) => {
        db.query(updateViewQuery, [post_id], (err, results) => {
            if(err) return reject(err);
            resolve();
        });
    })
    .then(() => {
        return Promise.all([
            new Promise((resolve, reject) => {
                db.query(selectPostQuery, [post_id], (err, postResults) =>{
                    if(err) return reject(err);
                    resolve(postResults[0]);
                });
            }),
            new Promise((resolve, reject) => {
                db.query(selectCommentQuery, [post_id], (err, CommentResults) => {
                    if(err) return reject(err);
                    resolve(CommentResults);
                });
            })
        ]);
    })
    .then(([post, comments]) => {
        if(!post){
            return res.status(404).send('존재하지 않는 게시글입니다.');
        }

        res.render('post', {
            post: post,
            comments: comments,
            sessionUser: req.session.user
        });
    })
    .catch(err =>{
        console.error('게시글 상세 조회 DB 오류:', err);
        res.status(500).render('error', {message:'게시글을 불러오는 중 서버 오류'});
    });
});

router.post('/posts/:id', (req, res) => {
    if (!req.session.user || !req.session.user.id) {
        return res.render('login', { error: '로그인이 필요합니다.' });
    }
    
    const user_id = req.session.user.id;
    const post_id = req.params.id;
    const { comment_content } = req.body; 

    if (!comment_content || !comment_content.trim()) {
        return res.redirect(`/posts/${post_id}?error=댓글 내용을 입력해주세요.`);
    }

    const query = 'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)';
    
    db.query(query, [post_id, user_id, comment_content], (err, results) => {
        if (err) {
            console.error('댓글 작성 DB 오류:', err);
            return res.redirect(`/posts/${post_id}?error=댓글 작성 중 DB 오류가 발생했습니다.`);
        }
        return res.redirect(`/posts/${post_id}`);
    });
});

router.post('/post-upload', (req, res) => { 
    if (!req.session.user || !req.session.user.id) { 
        return res.render('login', { error: '로그인이 필요합니다.' }); 
    }
    const user_id = req.session.user.id; 
    const { title, post_content, board_id } = req.body;

    if (!title || !title.trim() || !post_content || !post_content.trim()) {
        return res.render('post-upload', { error: '제목과 내용은 비어있을 수 없습니다.', title: title, post_content: post_content, sessionUser: req.session.user });
    }

    const targetBoardId = board_id || 1;
    const query = 'INSERT INTO posts (board_id, user_id, title, content) VALUES (?, ?, ?, ?)';
    
    db.query(query, [targetBoardId, user_id, title, post_content], (err, results) => { 
        if (err) {
            console.error('글 작성 DB 오류:', err);
            return res.render('post-upload', { error: '게시글 저장 중 DB 오류가 발생했습니다.', sessionUser: req.session.user });
        }
        return res.redirect('/posts'); 
    });
});

router.post('/post-Delete/:id', (req, res) => {
    if (!req.session.user || !req.session.user.id) { 
        return res.render('login', { error: '로그인이 필요합니다.' }); 
    }
    
    const user_id = req.session.user.id; 
    const post_id = req.params.id; 

    const findAuthorQuery = 'SELECT user_id FROM posts WHERE post_id = ?'; 

    db.query(findAuthorQuery, [post_id], (err, results) => {
        if (err) {
            console.error('글 삭제 권한 조회 DB 오류:', err);
            return res.render('error', { message: 'DB 쿼리 오류 발생.' });
        }
        
        if (results.length === 0) {
            return res.render('error', { message: '삭제할 게시글을 찾을 수 없습니다.' });
        }
        
        const post_author_id = results[0].user_id;
        
        if (Number(post_author_id) !== Number(user_id)) { 
            return res.render('error', { message: '자신의 글만 지울 수 있습니다.' });
        }
        const deleteQuery = 'DELETE FROM posts WHERE post_id = ?'; 
        
        db.query(deleteQuery, [post_id], (err, deleteResults) => {
            if (err) {
                console.error('글 삭제 DB 오류:', err);
                return res.render('error', { message: 'DB 쿼리 오류 발생.' });
            }
            return res.redirect('/posts'); 
        });
    });
});

router.post('/post-Update/:id', (req, res) => {
    if (!req.session.user || !req.session.user.id) { 
        return res.render('login', { error: '로그인이 필요합니다.' }); 
    }
    
    const user_id = req.session.user.id; 
    const post_id = req.params.id;
    const { title, post_content } = req.body; 

    if (!title || !title.trim() || !post_content || !post_content.trim()) {
        return res.render('post-Update', { error: '제목과 내용은 비어있을 수 없습니다.', post: { post_id, title, content: post_content } });
    }

    const findAuthorQuery = 'SELECT user_id FROM posts WHERE post_id = ?'; 

    db.query(findAuthorQuery, [post_id], (err, results) => {
        if (err) {
            console.error('글 수정 권한 조회 DB 오류:', err);
            return res.render('error', { message: 'DB 쿼리 오류 발생.' });
        }
        
        if (results.length === 0) {
            return res.render('error', { message: '수정할 게시글을 찾을 수 없습니다.' });
        }
        
        const post_author_id = results[0].user_id;
        
        if (Number(post_author_id) !== Number(user_id)) { 
            return res.render('error', { message: '자신의 글만 수정할 수 있습니다.' });
        }
        
        const UpdateQuery = "UPDATE posts SET title = ?, content = ?, updated_at = NOW() WHERE post_id = ?;"; 
        
        db.query(UpdateQuery, [title, post_content, post_id], (err, UpdateResults) => {
            if (err) {
                console.error('글 수정 DB 오류:', err);
                return res.render('error', { message: 'DB 쿼리 오류 발생.' });
            }
            return res.redirect(`/posts/${post_id}`); 
        });
    });
});

module.exports = router;