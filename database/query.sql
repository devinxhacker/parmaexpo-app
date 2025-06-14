create database parma;
use parma;

CREATE USER 'root'@'192.168.145.66' IDENTIFIED BY '28092008';
GRANT ALL PRIVILEGES ON parma.* TO 'root'@'192.168.145.66';
FLUSH PRIVILEGES;



create table if not exists users(
user_id int auto_increment primary key,
username varchar(100) unique not null,
full_name varchar(255) not null,
password varchar(255) not null,
role enum('Admin', 'Doctor', 'Technician', 'Receptionist') not null,
contact_number varchar(15) not null,
question varchar(255) not null,
answer varchar(255) not null,
created_at datetime default current_timestamp,
updated_at timestamp default current_timestamp
);

create table if not exists doctors(
doctor_id varchar(10) primary key,
doctor_name varchar(200) not null,
clinic_name varchar(200) not null,
email varchar(200) not null,
phone_number bigint(20),
commission float(10),
address varchar(255),
paid_commission float default 0
);

create table if not exists category(
category_id int primary key auto_increment,
category_name varchar(255) unique
);

create table if not exists test(
test_id int primary key auto_increment,
test_name varchar(255),
test_rate decimal(10, 2),
report_heading varchar(255),
test_code varchar(10),
method text,
comments text,
category_id int,
foreign key(category_id) references category(category_id),
unique(test_name, category_id)
);

create table if not exists component(
component_id int primary key auto_increment,
sub_test_name varchar(255),
component_name varchar(255),
specimen varchar(255),
test_unit varchar(50),
reference_range text,
min_value decimal(10,2),
max_value decimal(10,2),
component_for enum('All', 'Male', 'Female', 'Child'),
individual_method varchar(255),
test_id int,
is_deleted tinyint(1) default 0,
foreign key(test_id) references test(test_id),
unique key(test_id, sub_test_name, component_name, component_for)
);

create table if not exists patients(
patient_id varchar(10) primary key,
patient_salutation varchar(50),
patients_name varchar(200),
guardian_name varchar(200),
phone_number bigint(20),
gender varchar(10) not null,
age_years int,
age_months int,
age_days int,
alternate_phone_number bigint(20),
email varchar(100),
address varchar(255),
city varchar(100),
state varchar(100),
zip_code varchar(20)
);


create table if not exists report(
id int auto_increment primary key,
report_id varchar(10),
patient_id varchar(10),
test_id int,
component_id int,
test_date date,
result varchar(100),
method text,
comments text,
status varchar(100),
doctor_id varchar(10),
bold tinyint(1) default 0,
is_select tinyint(1) default 0,
blood_collection tinyint(1) default 0,
unique key (report_id, patient_id, test_id, component_id),
foreign key(patient_id) references patients(patient_id),
foreign key(test_id) references test(test_id),
foreign key(component_id) references component(component_id),
foreign key(doctor_id) references doctors(doctor_id)
);

create table if not exists payment(
payment_id int auto_increment primary key,
patient_id varchar(10),
report_id varchar(10),
subtotal decimal(10,2),
discount decimal(10,2),
total_amount decimal(10,2),
payment_date date,
unique key(patient_id, report_id),
foreign key(patient_id) references patients(patient_id),
foreign key(report_id) references report(report_id)
);

create table if not exists payment_transaction(
transaction_id int,
payment_id int,
amount decimal(10,2),
payment_date date,
payment_mode varchar(50),
foreign key(payment_id) references payment(payment_id)
);

INSERT INTO users (username, full_name, password, role, contact_number, question, answer) VALUES
('admin1', 'Admin One', 'password123', 'Admin', '1234567890', 'What is your favorite color?', 'Blue'),
('doctor1', 'Doctor One', 'doctorpass', 'Doctor', '9876543210', 'What city were you born in?', 'London'),
('tech1', 'Technician One', 'techpass', 'Technician', '1122334455', 'What is your pet\'s name?', 'Buddy'),
('recept1', 'Receptionist One', 'receptpass', 'Receptionist', '5544332211', 'What is your mother\'s maiden name?', 'Smith'),
('doctor2', 'Doctor Two', 'doctorpass2', 'Doctor', '6677889900', 'What is your favorite food?', 'Pizza'),
('tech2', 'Technician Two', 'techpass2', 'Technician', '9988776655', 'What is your favorite book?', 'The Hobbit');

INSERT INTO doctors (doctor_id, doctor_name, clinic_name, email, phone_number, commission, address) VALUES
('DOC001', 'Dr. John Doe', 'City Clinic', 'john.doe@example.com', 9876543210, 10.0, '123 Main St'),
('DOC002', 'Dr. Jane Smith', 'Rural Hospital', 'jane.smith@example.com', 8765432109, 12.5, '456 Oak Ave'),
('DOC003', 'Dr. David Lee', 'Central Medical', 'david.lee@example.com', 7654321098, 15.0, '789 Pine Ln'),
('DOC004', 'Dr. Sarah Jones', 'Family Health', 'sarah.jones@example.com', 6543210987, 8.0, '101 Elm Rd'),
('DOC005', 'Dr. Michael Brown', 'Advanced Care', 'michael.brown@example.com', 5432109876, 11.0, '222 Birch Ct');

INSERT INTO category (category_name) VALUES
('Hematology'),
('Biochemistry'),
('Microbiology'),
('Immunology'),
('Pathology'),
('Serology');

INSERT INTO test (test_name, test_rate, report_heading, test_code, method, comments, category_id) VALUES
('Complete Blood Count', 150.00, 'CBC Report', 'CBC', 'Automated Cell Counter', 'Results within normal range', 1),
('Liver Function Test', 200.00, 'LFT Report', 'LFT', 'Spectrophotometry', 'Check for liver enzymes', 2),
('Blood Culture', 300.00, 'Culture Report', 'BC', 'Culture and Sensitivity', 'Identify bacterial growth', 3),
('HIV Antibody Test', 250.00, 'HIV Report', 'HIV', 'ELISA', 'Screening for HIV', 4),
('Biopsy', 400.00, 'Biopsy Report', 'BIO', 'Histopathology', 'Tissue examination', 5),
('CRP', 180.00, 'CRP Report', 'CRP', 'Latex Agglutination', 'C-Reactive Protein', 6);

INSERT INTO component (sub_test_name, component_name, specimen, test_unit, reference_range, min_value, max_value, component_for, individual_method, test_id) VALUES
('CBC', 'Hemoglobin', 'Blood', 'g/dL', '12-16', 12.0, 16.0, 'All', 'Automated', 1),
('LFT', 'ALT', 'Serum', 'U/L', '7-56', 7.0, 56.0, 'All', 'Spectrophotometry', 2),
('BC', 'Bacteria', 'Blood', 'CFU/mL', 'Negative', 0.0, 0.0, 'All', 'Culture', 3),
('HIV', 'Antibodies', 'Serum', 'Negative/Positive', 'Negative', 0.0, 0.0, 'All', 'ELISA', 4),
('BIO', 'Tissue Type', 'Tissue', 'N/A', 'N/A', 0.0, 0.0, 'All', 'Histopathology', 5),
('CRP', 'CRP Level', 'Serum', 'mg/L', '0-5', 0.0, 5.0, 'All', 'Latex Agglutination', 6);

INSERT INTO patients (patient_id, patient_salutation, patients_name, guardian_name, phone_number, gender, age_years, age_months, age_days, alternate_phone_number, email, address, city, state, zip_code) VALUES
('PAT001', 'Mr.', 'John Smith', 'N/A', 9876543211, 'Male', 30, 0, 0, 8765432112, 'john.smith@example.com', '123 Pine St', 'New York', 'NY', '10001'),
('PAT002', 'Ms.', 'Jane Doe', 'N/A', 8765432113, 'Female', 25, 6, 0, 7654321114, 'jane.doe@example.com', '456 Oak Ave', 'Los Angeles', 'CA', '90001'),
('PAT003', 'Mr.', 'David Lee', 'N/A', 7654321115, 'Male', 40, 0, 0, 6543211116, 'david.lee@example.com', '789 Elm Rd', 'Chicago', 'IL', '60601'),
('PAT004', 'Mrs.', 'Sarah Jones', 'N/A', 6543211117, 'Female', 35, 3, 0, 5432111118, 'sarah.jones@example.com', '101 Maple Ln', 'Houston', 'TX', '77001'),
('PAT005', 'Mr.', 'Michael Brown', 'N/A', 5432111119, 'Male', 50, 0, 0, 4321111120, 'michael.brown@example.com', '222 Birch Ct', 'Phoenix', 'AZ', '85001');

INSERT INTO report (report_id, patient_id, test_id, component_id, test_date, result, method, comments, status, doctor_id) VALUES
('REP001', 'PAT001', 1, 1, '2023-10-26', '14.5', 'Automated', 'Normal', 'Completed', 'DOC001'),
('REP002', 'PAT002', 2, 2, '2023-10-26', '35', 'Spectrophotometry', 'Normal', 'Completed', 'DOC002'),
('REP003', 'PAT003', 3, 3, '2023-10-26', 'Negative', 'Culture', 'No growth', 'Completed', 'DOC003'),
('REP004', 'PAT004', 4, 4, '2023-10-26', 'Negative', 'ELISA', 'Negative', 'Completed', 'DOC004'),
('REP005', 'PAT005', 5, 5, '2023-10-26', 'Normal Tissue', 'Histopathology', 'Benign', 'Completed', 'DOC005'),
('REP006', 'PAT001', 6, 6, '2023-10-26', '2.5', 'Latex Agglutination', 'Normal', 'Completed', 'DOC001');

INSERT INTO payment (patient_id, report_id, subtotal, discount, total_amount, payment_date) VALUES
('PAT001', 'REP001', 150.00, 0.00, 150.00, '2023-10-26'),
('PAT002', 'REP002', 200.00, 10.00, 190.00, '2023-10-26'),
('PAT003', 'REP003', 300.00, 20.00, 280.00, '2023-10-26'),
('PAT004', 'REP004', 250.00, 0.00, 250.00, '2023-10-26'),
('PAT005', 'REP005', 400.00, 15.00, 385.00, '2023-10-26');

INSERT INTO payment_transaction (transaction_id, payment_id, amount, payment_date, payment_mode) VALUES
(1, 1, 150.00, '2023-10-26', 'Cash'),
(2, 2, 190.00, '2023-10-26', 'Card'),
(3, 3, 280.00, '2023-10-26', 'UPI'),
(4, 4, 250.00, '2023-10-26', 'Cash'),
(5, 5, 385.00, '2023-10-26', 'Card');


SELECT * FROM users;
SELECT * FROM doctors;
SELECT * FROM category;
SELECT * FROM test;
SELECT * FROM component;
SELECT * FROM patients;
SELECT * FROM report;
SELECT * FROM payment;
SELECT * FROM payment_transaction;