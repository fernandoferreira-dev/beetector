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
    order_status enum('encomendado', 'preparado', 'enviado', 'entregue', 'cancelado') not null default 'encomendado',
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

create table if not exists gateways (
    gateway_id int auto_increment primary key,
    dev_eui char(16) not null unique,
    ttn_device_id varchar(100) not null unique,
    user_id int null,
    battery_mv smallint unsigned null,      
    battery_pct tinyint unsigned null,
    last_seen_at timestamp null,
    gateway_created_at timestamp not null default current_timestamp,
    foreign key (user_id) references users(user_id) on delete set null
);

create table if not exists hives (
    hive_id int auto_increment primary key,
    hive_claim_code varchar(50) not null unique,   
    payment_id int not null,
    user_id int null,
    apiary_id int null,
    gateway_id int null,                           
    hive_name varchar(100),
    hive_serial varchar(50) null unique,
    c6_id char(6) null unique,                     -- ultimos 3 bytes do MAC BLE do C6, ex. '8ed50a'
    hive_lat decimal(9,6) null,                    
    hive_lon decimal(9,6) null,
    location_set_at timestamp null,
    current_state tinyint unsigned null,           -- 0 SEM_SINAL, 1 CALMA, 2 ATIVA, 3 SEM_RAINHA, 4 ALARME
    battery_mv smallint unsigned null,             
    battery_pct tinyint unsigned null,
    hive_activated_at timestamp null,
    hive_created_at timestamp not null default current_timestamp,
    foreign key (payment_id) references payments(payment_id) on delete cascade,
    foreign key (user_id) references users(user_id) on delete set null,
    foreign key (apiary_id) references apiaries(apiary_id) on delete set null,
    foreign key (gateway_id) references gateways(gateway_id) on delete set null
);

create table if not exists uplinks (
    uplink_id bigint auto_increment primary key,
    gateway_id int not null,
    received_at datetime(3) not null,
    f_cnt int unsigned,
    gateway_battery_mv smallint unsigned null,     -- bateria do S3 neste uplink
    gateway_battery_pct tinyint unsigned null,
    rssi smallint,                                 -- sinal LoRa (TTN)
    snr decimal(4,1),
    ttn_gateway_id varchar(100),                   -- gateway LoRa do TTN que recebeu
    foreign key (gateway_id) references gateways(gateway_id) on delete cascade,
    unique key uq_gateway_time (gateway_id, received_at)
);

create table if not exists readings (
    reading_id bigint auto_increment primary key,
    uplink_id bigint not null,
    hive_id int not null,
    received_at datetime(3) not null,
    temperature_c decimal(4,1),
    humidity_pct decimal(4,1),
    bee_count smallint unsigned,                   -- contador acumulado do breakbeam (volta a 0 aos 65535 ou ao reiniciar o C6)
    audio_level_db decimal(5,1),                   -- pico de som (dBFS) desde o ultimo uplink
    audio_freq_hz smallint unsigned,
    state_code tinyint unsigned null,              -- estado no momento do uplink
    state_worst_code tinyint unsigned null,        -- pior estado desde o uplink anterior
    battery_mv smallint unsigned null,             -- bateria do C6
    battery_pct tinyint unsigned null,
    foreign key (uplink_id) references uplinks(uplink_id) on delete cascade,
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