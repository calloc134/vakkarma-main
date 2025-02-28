--migrate:up
-- スレッドテーブル
CREATE TABLE threads(
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    posted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    -- 妥協としての非正規化。本来はposted_atから導出すべき。
    epoch_id BIGINT NOT NULL UNIQUE
)
;
-- epoch_idにインデックス
CREATE INDEX idx_threads_epoch_id ON threads(epoch_id);
-- updated_atにインデックス
CREATE INDEX idx_threads_updated_at ON threads(updated_at DESC);

-- レスポンス(レス)のテーブル
CREATE TABLE responses(
    id UUID PRIMARY KEY,
    -- 無理に外部キー制約を張る必要はないので、外部キー制約は付けない
    thread_id UUID NOT NULL,
    response_number INT NOT NULL,
    author_name TEXT NOT NULL,
    mail TEXT NOT NULL,
    posted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    response_content TEXT NOT NULL,
    hash_id TEXT NOT NULL,
    trip TEXT,
    UNIQUE(thread_id, response_number)
)
;
-- thread_idにインデックス
CREATE INDEX idx_responses_thread_id ON responses(thread_id);
-- thread_idとresponse_numberに複合インデックス
CREATE INDEX idx_responses_thread_id_response_number ON responses(thread_id, response_number);

-- ダミーのスレッドを追加
INSERT INTO threads(
    id,
    title,
    posted_at,
    updated_at,
    epoch_id
)
VALUES(
    '01953082-1ea4-7a71-8ac2-395cedbd9ecb',
    'ようこそ！',
    '2025-01-01 00:00:00',
    '2025-01-01 00:00:00',
    1735657200
)
;
INSERT INTO responses(
    id,
    thread_id,
    response_number,
    author_name,
    mail,
    posted_at,
    response_content,
    hash_id,
    trip
)
VALUES(
    '01953082-8ae5-7df7-8446-e02b6b9189e7',
    '01953082-1ea4-7a71-8ac2-395cedbd9ecb',
    1,
    'VakKarma',
    'dummy@example.com',
    '2025-01-01 00:00:00',
    'VakKarma Boardへようこそ！',
    'welcome.',
    'UNhY4JhezH9g'
)
;
-- 板の設定を保存するテーブル
-- とりあえず現時点では1つの板のみをサポート
CREATE TABLE config(
    board_name TEXT PRIMARY KEY,
    local_rule TEXT NOT NULL,
    nanashi_name TEXT NOT NULL,
    max_content_length INT NOT NULL,
    admin_password TEXT NOT NULL
)
;
INSERT INTO config(
    board_name,
    local_rule,
    nanashi_name,
    max_content_length,
    admin_password
)
VALUES(
    'VakKarma Board',
    'ローカルルールはここに記述',
    '名無しさん',
    1000,
    -- password
    '$2b$10$9gxLQMYSDoBdbz/1znmieu1vjhZ2VGzKd21azF112uG45DvQNn0E6'
)
;
--migrate:down
-- 関連するテーブルを削除
DROP TABLE IF EXISTS responses CASCADE
;
DROP TABLE IF EXISTS threads CASCADE
;
DROP TABLE IF EXISTS config CASCADE
;