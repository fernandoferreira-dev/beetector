create database if not exists beetector;
use beetector;

create table if not exists users (
    user_id int auto_increment primary key,
    user_email varchar(255) not null unique,
    user_password varchar(255) not null,
    user_first_name varchar(255),
    user_last_name varchar(255),
    user_created_at timestamp not null default current_timestamp
);

create table if not exists payments (
    payment_id int auto_increment primary key,
    user_id int not null,
    amount decimal(10,2) not null,
    paid_at timestamp not null default current_timestamp,
    foreign key (user_id) references users(user_id) on delete cascade,
    index idx_user_payment (user_id)
);

create table if not exists apiaries (
    apiary_id int auto_increment primary key,
    user_id int not null,
    apiary_name varchar(100) not null,
    apiary_lat decimal(9,6),
    apiary_lon decimal(9,6),
    apiary_created_at timestamp not null default current_timestamp,
    foreign key (user_id) references users(user_id) on delete cascade
);

create table if not exists hives (
    hive_id int auto_increment primary key,
    hive_claim_code varchar(50) not null unique,
    payment_id int not null,
    user_id int null,
    apiary_id int null,
    hive_name varchar(100),
    hive_serial varchar(50) null unique,
    ttn_device_id varchar(100) null unique,
    dev_eui char(16) null unique,
    fw_version_s3 varchar(20),
    fw_version_c6 varchar(20),
    hive_status enum('encomendado', 'preparado', 'ativo', 'inativo', 'em manutenção') default 'encomendado',
    current_state tinyint unsigned null,  
    state_since timestamp null,
    last_reading_at timestamp null,
    hive_activated_at timestamp null,
    hive_created_at timestamp not null default current_timestamp,
    foreign key (payment_id) references payments(payment_id) on delete cascade,
    foreign key (user_id) references users(user_id) on delete set null,
    foreign key (apiary_id) references apiaries(apiary_id) on delete set null,
    index idx_hive_status (hive_status)
);

create table if not exists readings (
    reading_id bigint auto_increment primary key,
    hive_id int not null,
    received_at datetime(3) not null,
    f_cnt int unsigned,
    temperature_c decimal(4,1),
    humidity_pct decimal(4,1),
    bee_count smallint unsigned,
    audio_level_db decimal(5,1),
    audio_base_db decimal(5,1) null,
    audio_freq_hz smallint unsigned,
    audio_high_ratio decimal(3,2) null,
    audio_spectrum json,
    state_code tinyint unsigned null,  
    battery_mv smallint unsigned,
    rssi smallint,
    snr decimal(4,1),
    gateway_id varchar(100),
    foreign key (hive_id) references hives(hive_id) on delete cascade,
    unique key uq_hive_time (hive_id, received_at)
);

create table if not exists inspections (
    inspection_id int auto_increment primary key,
    hive_id int not null,
    user_id int not null,
    inspected_at datetime not null,
    has_queen boolean null,
    invasion_observed boolean null,
    note text,
    foreign key (hive_id) references hives(hive_id) on delete cascade,
    foreign key (user_id) references users(user_id) on delete cascade
);

create table if not exists events (
    event_id bigint auto_increment primary key,
    hive_id int not null,
    state_code tinyint unsigned not null,
    previous_state tinyint unsigned null,
    started_at datetime(3) not null,
    notified_at timestamp null,
    foreign key (hive_id) references hives(hive_id) on delete cascade,
    index idx_hive_event (hive_id, started_at)
);

create table if not exists hive_configs (
    hive_id int primary key,
    silence_threshold_db decimal(5,1) not null default -65.0,
    active_threshold_db decimal(5,1) not null default -45.0,
    alarm_level_threshold_db decimal(5,1) not null default -38.0,
    alarm_jump_db decimal(4,1) not null default 10.0,
    high_ratio_threshold decimal(3,2) not null default 0.35,
    queenless_freq_hz smallint unsigned not null default 350,
    updated_at timestamp not null default current_timestamp
        on update current_timestamp,
    foreign key (hive_id) references hives(hive_id) on delete cascade
);