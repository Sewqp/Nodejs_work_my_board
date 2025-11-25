CREATE DATABASE IF NOT EXISTS my_board_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE my_board_db;

-- 1. 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '사용자 고유 ID',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT '이메일',
    password VARCHAR(255) NOT NULL COMMENT '비밀번호',
    nickname VARCHAR(50) NOT NULL COMMENT '닉네임',
    role VARCHAR(10) DEFAULT 'user' COMMENT '권한(user/admin)',
    status VARCHAR(20) DEFAULT 'active' COMMENT '상태',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '가입일'
);

-- 2. 게시판 종류 테이블
CREATE TABLE IF NOT EXISTS boards (
    board_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '게시판 ID',
    name VARCHAR(50) NOT NULL COMMENT '게시판 이름',
    key_name VARCHAR(50) NOT NULL UNIQUE COMMENT 'URL 키'
);

-- 3. 게시글 테이블
CREATE TABLE IF NOT EXISTS posts (
    post_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '글 ID',
    board_id INT DEFAULT 1 COMMENT '게시판 ID', 
    user_id INT NOT NULL COMMENT '작성자 ID',
    title VARCHAR(255) NOT NULL COMMENT '제목',
    content TEXT NOT NULL COMMENT '내용',
    view INT DEFAULT 0 COMMENT '조회수',
    `like` INT DEFAULT 0 COMMENT '좋아요',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '작성일',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (board_id) REFERENCES boards(board_id) ON DELETE SET NULL
);

-- 4. 댓글 테이블
CREATE TABLE IF NOT EXISTS comments (
    comment_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '댓글 ID',
    post_id INT NOT NULL COMMENT '원글 ID',
    user_id INT NOT NULL COMMENT '작성자 ID',
    content TEXT NOT NULL COMMENT '내용',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '작성일',
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 초기 데이터
INSERT INTO boards (board_id, name, key_name) VALUES (1, '자유게시판', 'free') ON DUPLICATE KEY UPDATE name='자유게시판';
INSERT INTO boards (board_id, name, key_name) VALUES (2, '공지사항', 'notice') ON DUPLICATE KEY UPDATE name='공지사항';