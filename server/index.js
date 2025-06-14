const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs'); // Import the 'fs' module
const { v4: uuidv4 } = require('uuid');


require('dotenv').config();
const app = express();

// Enable CORS for all routes
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Accept']
}));

app.use(bodyParser.json());

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT, 10), // Add and parse the port
    ssl: {
        ca: process.env.DB_SSL_CA_CONTENT || fs.readFileSync(process.env.DB_SSL_CA_PATH), // Use the CA certificate
        // rejectUnauthorized: true // This is true by default and recommended for security
    }
};

// Create a connection pool
const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test pool connection
pool.getConnection()
    .then(conn => {
        console.log('Database connected successfully using pool');
        conn.release();
    })
    .catch(err => console.error('Database pool connection error:', err));

// testConnection();


// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        // console.log('Login request body:', req.body); // Log request body
        const { username, password } = req.body;
        const connection = await pool.getConnection();
        const [results] = await connection.execute(
            'SELECT user_id, username, full_name, role FROM users WHERE username = ? AND password = ?',
            [username, password]
        );
        connection.release();

        if (results.length > 0) {
            res.json({
                success: true,
                user: results[0],
                message: 'Login successful'
            });
        } else {
            res.json({
                success: false,
                message: 'Invalid username or password'
            });
        }
    } catch (error) {
        // console.error('Login error details:', error); // Log error details
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Signup endpoint
app.post('/api/signup', async (req, res) => {
    let connection;
    try {
        const {
            username,
            fullName,
            password,
            role,
            contactNumber,
            securityQuestion,
            securityAnswer
        } = req.body;

        connection = await pool.getConnection();

        // Check if username exists
        const [existing] = await connection.execute(
            'SELECT username FROM users WHERE username = ?',
            [username]
        );
        if (existing.length > 0) {
            return res.json({
                success: false,
                message: 'Username already exists'
            });
        }
        // Insert new user
        await connection.execute(
            'INSERT INTO users (username, full_name, password, role, contact_number, question, answer) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [username, fullName, password, role, contactNumber, securityQuestion, securityAnswer]
        );

        res.json({
            success: true,
            message: 'Account created successfully'
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    } finally {
        if (connection) connection.release();
    }
});



app.get('/api/users/:userId', async (req, res) => {
    let connection;
    try {
        const { userId } = req.params;
        connection = await pool.getConnection();
        const [results] = await connection.execute(
            'SELECT user_id, username, full_name, role, contact_number FROM users WHERE user_id = ?',
            [userId]
        );

        if (results.length > 0) {
            res.json({
                success: true,
                user: results[0]
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        if (connection) connection.release();
    }
});

// Test endpoint
app.get('/api/test', (req, res) => {
    console.log('Test endpoint hit');
    //test db connection
    testConnection();
    try {
        res.json({ message: 'Server is running' });
    } catch (error) {
        console.error('Error in test endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Get summarized report list
app.get('/api/reports', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [reports] = await connection.execute(`
            SELECT
                r.report_id,
                p.patients_name,
                r.test_date,
                MAX(r.status) as status, -- Assuming status is consistent for a report_id or take one
                GROUP_CONCAT(DISTINCT t.test_name SEPARATOR ', ') AS tests
            FROM report r
            JOIN patients p ON r.patient_id = p.patient_id
            JOIN test t ON r.test_id = t.test_id
            GROUP BY r.report_id, p.patients_name, r.test_date
            ORDER BY r.test_date DESC, r.report_id DESC
        `);
        res.json({ success: true, reports: reports });
    } catch (error) {
        console.error('Error fetching reports list:', error);
        res.status(500).json({ success: false, message: 'Server error fetching reports list' });
    } finally {
        if (connection) connection.release();
    }
});

// Get detailed items for a specific report_id
app.get('/api/reports/detail/:reportId', async (req, res) => {
    let connection;
    const { reportId } = req.params;
    try {
        connection = await pool.getConnection();
        // Ensure all fields required by the frontend's ReportDetailItem interface for pre-filling are selected,
        // especially IDs from the report table (r) itself.
        const [reportItems] = await connection.execute(`
            SELECT
                r.id AS report_table_id,
                r.report_id,
                r.patient_id,         -- Added: Crucial for pre-selecting patient
                r.doctor_id,          -- Added: Crucial for pre-selecting doctor
                r.test_id,            -- Added: Crucial for mapping selected tests
                r.component_id,       -- Added: Crucial for mapping selected tests (if applicable)
                r.test_date,
                r.result,
                r.method,
                r.comments AS report_item_comments, -- This alias matches frontend's ReportDetailItem
                r.status,             -- Changed: Use r.status directly to match frontend's ReportDetailItem
                p.patients_name,      -- Included for context/display if needed elsewhere
                p.gender, p.age_years, p.age_months, p.age_days, -- Patient details
                t.test_name,          -- Test details (frontend also gets this from availableTests)
                t.test_rate,          -- Test details
                c.component_name,     -- Component details (if component_id is not null)
                c.specimen, c.test_unit, c.reference_range, -- Component details
                d.doctor_name         -- Doctor details for context/display
            FROM report r
            JOIN patients p ON r.patient_id = p.patient_id
            JOIN test t ON r.test_id = t.test_id
            LEFT JOIN component c ON r.component_id = c.component_id
            JOIN doctors d ON r.doctor_id = d.doctor_id
            WHERE r.report_id = ?
        `, [reportId]);
        res.json({ success: true, reportItems: reportItems });
    } catch (error) {
        console.error('Error fetching report details:', error);
        res.status(500).json({ success: false, message: 'Server error fetching report details' });
    } finally {
        if (connection) connection.release();
    }
});

// Delete all entries for a specific report_id
app.delete('/api/reports/:reportId', async (req, res) => {
    let connection;
    try {
        const { reportId } = req.params;
        connection = await pool.getConnection();
        const [deleteResult] = await connection.execute('DELETE FROM report WHERE report_id = ?', [reportId]);
        if (deleteResult.affectedRows > 0) {
            res.json({ success: true, message: 'Report deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Report not found or already deleted' });
        }
    } catch (error) {
        console.error('Error deleting report:', error);
        res.status(500).json({ success: false, message: 'Server error deleting report' });
    } finally {
        if (connection) connection.release();
    }
});

// Add new report (which can consist of multiple test entries)
app.post('/api/reports', async (req, res) => {
    let connection;
    try {
        const {
            patient_id, doctor_id, test_date, overall_comments, status, tests_conducted
        } = req.body;

        // Overall status from the form, can be overridden by individual test status
        const overall_status = status;

        if (!patient_id || !doctor_id || !test_date || !overall_status || !tests_conducted || tests_conducted.length === 0) {
            return res.status(400).json({ success: false, message: 'Missing required report data or tests.' });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        for (const testItem of tests_conducted) {
            const generated_report_id_for_test = `REP-${uuidv4().slice(0, 6).toUpperCase()}`; // Generate unique report_id for each test
            if (!testItem.test_id) { // Add more validation as needed
                throw new Error('Missing test_id in one of the conducted tests.');
            }
            // Ensure component_id is null if not provided or not applicable, or a valid ID.
            // The DB schema has component_id in report, so it needs a value or to allow NULLs if not always present.
            // For now, assuming component_id might be optional or a default is handled.
            // If your `report` table's `component_id` cannot be NULL and is always required,
            // ensure `testItem.component_id` is always valid.
            const componentIdToInsert = testItem.component_id || null; // Or a default if your schema requires it

            await connection.execute(
                'INSERT INTO report (report_id, patient_id, test_id, component_id, test_date, result, method, comments, status, doctor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    generated_report_id_for_test, // Use unique report_id for this specific test entry
                    patient_id,
                    testItem.test_id,
                    componentIdToInsert,
                    test_date,
                    testItem.result || null,
                    testItem.method || 'N/A', // Use individual method from testItem
                    testItem.comments || overall_comments || null,
                    testItem.status || overall_status, doctor_id // Use individual status from testItem, fallback to overall
                ]
            );
        }

        await connection.commit();
        res.json({ success: true, message: 'Report added successfully' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error adding report:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error adding report' });
    } finally {
        if (connection) connection.release();
    }
});


// Get reports for the current date
app.get('/api/reports/today', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [reports] = await connection.execute(`
            SELECT
                r.report_id,
                p.patients_name,
                r.test_date,
                MAX(r.status) as status,
                GROUP_CONCAT(DISTINCT t.test_name SEPARATOR ', ') AS tests
            FROM report r
            JOIN patients p ON r.patient_id = p.patient_id
            JOIN test t ON r.test_id = t.test_id
            WHERE DATE(r.test_date) = CURDATE()
            GROUP BY r.report_id, p.patients_name, r.test_date
            ORDER BY r.test_date DESC, r.report_id DESC
        `);
        res.json({ success: true, reports: reports });
    } catch (error) {
        console.error('Error fetching today\'s reports:', error);
        res.status(500).json({ success: false, message: 'Server error fetching today\'s reports' });
    } finally {
        if (connection) connection.release();
    }
});


// Update existing report (PUT /api/reports/:reportId)
app.put('/api/reports/:reportId', async (req, res) => {
    let connection;
    const { reportId } = req.params;
    try {
        const {
            patient_id, doctor_id, test_date, overall_comments, status, tests_conducted
        } = req.body;

        if (!patient_id || !doctor_id || !test_date || !status || !tests_conducted || tests_conducted.length === 0) {
            return res.status(400).json({ success: false, message: 'Missing required report data or tests for update.' });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Step 1: Delete existing entries for this report_id from the report table
        await connection.execute('DELETE FROM report WHERE report_id = ?', [reportId]);

        // Step 2: Insert the new/updated test entries
        for (const testItem of tests_conducted) {
            if (!testItem.test_id) {
                throw new Error('Missing test_id in one of the conducted tests during update.');
            }
            const componentIdToInsert = testItem.component_id || null;

            await connection.execute(
                'INSERT INTO report (report_id, patient_id, test_id, component_id, test_date, result, method, comments, status, doctor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    reportId, // Use the existing reportId for all new entries
                    patient_id,
                    testItem.test_id,
                    componentIdToInsert,
                    test_date,
                    testItem.result || null,
                    testItem.method || 'N/A',
                    testItem.comments || overall_comments || null,
                    testItem.status || status, doctor_id
                ]
            );
        }

        await connection.commit();
        res.json({ success: true, message: `Report ${reportId} updated successfully` });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`Error updating report ${reportId}:`, error);
        res.status(500).json({ success: false, message: error.message || `Server error updating report ${reportId}` });
    } finally {
        if (connection) connection.release();
    }
});

// get patients data
app.get('/api/patients', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [patients] = await connection.execute(`
            SELECT 
                patient_id,
                patients_name,
                phone_number,
                gender,
                age_years
            FROM patients
        `);
        res.json({
            success: true,
            patients: patients
        });
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    } finally {
        if (connection) connection.release();
    }
});

// get tests data
app.get('/api/tests', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [tests] = await connection.execute(`
            SELECT 
                test_id,
                test_name,
                test_rate,
                test_code,
                method,
                (SELECT component_id FROM component WHERE test_id = test.test_id ORDER BY component_id LIMIT 1) as default_component_id
            FROM test
        `);
        res.json({
            success: true,
            tests: tests
        });
    } catch (error) {
        console.error('Error fetching tests:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    } finally {
        if (connection) connection.release();
    }
});

// get components data
app.get('/api/components', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [components] = await connection.execute(`
            SELECT 
                component_id,
                component_name,
                sub_test_name
            FROM component
        `);
        res.json({
            success: true,
            components: components
        });
    } catch (error) {
        console.error('Error fetching components:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    } finally {
        if (connection) connection.release();
    }
});

// get doctors data
app.get('/api/doctors', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [doctors] = await connection.execute(`
            SELECT 
                doctor_id,
                doctor_name,
                clinic_name,
                email,
                phone_number,
                commission,
                address,
                paid_commission
            FROM doctors
        `);
        res.json({
            success: true,
            doctors: doctors
        });
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    } finally {
        if (connection) connection.release();
    }
});

// Add patient endpoint (POST /api/patients)
app.post('/api/patients', async (req, res) => {
    try {
        const {
            patient_salutation,
            patients_name,
            guardian_name,
            phone_number,
            gender,
            age_years,
            age_months,
            age_days,
            alternate_phone_number,
            email,
            address,
            city,
            state,
            zip_code,
        } = req.body;

        const generated_patient_id = `PAT-${uuidv4().slice(0, 6).toUpperCase()}`; // Example: PAT-1A2B3C


        // Basic validation
        if (!patients_name || !gender) { // patient_id removed from validation
            return res.status(400).json({
                success: false,
                message: 'Missing required fields (patients_name, gender)'
            });
        }

        const connection = await pool.getConnection(); // Use pool

        // Check for duplicate patient_id
        const [existingPatient] = await connection.execute(
            'SELECT patient_id FROM patients WHERE patient_id = ?',
            [generated_patient_id] // Check generated ID, though highly unlikely to collide with UUIDs
        );
        if (existingPatient.length > 0) { // This check is almost redundant with UUIDs but kept for structure
            await connection.end();
            return res.status(409).json({
                success: false,
                message: 'Patient ID already exists'
            });
        }

        // Insert new patient
        await connection.execute(
            'INSERT INTO patients (patient_id, patient_salutation, patients_name, guardian_name, phone_number, gender, age_years, age_months, age_days, alternate_phone_number, email, address, city, state, zip_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                generated_patient_id,
                patient_salutation || null,
                patients_name,
                guardian_name || null,
                phone_number, // Already handled by frontend to be number or null
                gender,
                age_years, // Already handled
                age_months, // Already handled
                age_days, // Already handled
                alternate_phone_number ? Number(alternate_phone_number) : null, // Ensure it's number or null
                email || null,
                address || null,
                city || null,
                state || null,
                zip_code || null
            ]        );

        connection.release(); // Release connection
        res.json({
            success: true,
            message: 'Patient added successfully'
        });
    } catch (error) {
        console.error('Error adding patient:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    } finally {
        // Ensure connection is released if acquired and an early return didn't happen
        // This is tricky if connection is acquired mid-try block. Better to acquire at the start.
    }
});

// Add doctor endpoint (POST /api/doctors)
app.post('/api/doctors', async (req, res) => {
    try {
        const {
            doctor_name,
            clinic_name,
            email,
            phone_number,
            commission,
            address,
            paid_commission,
        } = req.body;


        const generated_doctor_id = `DOC-${uuidv4().slice(0, 6).toUpperCase()}`; // Example: DOC-A1B2C3


        // Basic validation
        if (!doctor_name || !clinic_name) { // doctor_id removed from validation
            return res.status(400).json({
                success: false,
                message: 'Missing required fields (doctor_name, clinic_name)'
            });
        }

        const connection = await pool.getConnection(); // Use pool

        // Check for duplicate doctor_id
        const [existingDoctor] = await connection.execute(
            'SELECT doctor_id FROM doctors WHERE doctor_id = ?',
            [generated_doctor_id] // Check generated ID
        );
        if (existingDoctor.length > 0) { // Redundant with UUID but kept for structure
            await connection.end();
            return res.status(409).json({
                success: false,
                message: 'Doctor ID already exists'
            });
        }

        // Insert new doctor
        await connection.execute(
            'INSERT INTO doctors (doctor_id, doctor_name, clinic_name, email, phone_number, commission, address, paid_commission) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                generated_doctor_id,
                doctor_name,
                clinic_name,
                email || null,
                phone_number, // Already handled by frontend to be number or null
                commission,   // Already handled by frontend to be number or null
                address || null,
                paid_commission || 0 // Default to 0 if not provided
            ]
        );

        connection.release(); // Release connection
        res.json({
            success: true,
            message: 'Doctor added successfully'
        });
    } catch (error) {
        console.error('Error adding doctor:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    } finally {
        // Similar to above, ensure release
    }
});

// Update doctor endpoint (PUT /api/doctors/:doctorId)
app.put('/api/doctors/:doctorId', async (req, res) => {
    let connection;
    try {
        const { doctorId } = req.params;
        const {
            doctor_name,
            clinic_name,
            email,
            phone_number,
            commission,
            address,
            paid_commission, // Assuming this can also be updated
        } = req.body;

        if (!doctor_name || !clinic_name) {
            return res.status(400).json({ success: false, message: 'Doctor Name and Clinic Name are required.' });
        }

        connection = await pool.getConnection();
        await connection.execute(
            'UPDATE doctors SET doctor_name = ?, clinic_name = ?, email = ?, phone_number = ?, commission = ?, address = ?, paid_commission = ? WHERE doctor_id = ?',
            [doctor_name, clinic_name, email || null, phone_number ? Number(phone_number) : null, commission ? parseFloat(commission) : null, address || null, paid_commission || 0, doctorId]
        );
        connection.release();
        res.json({ success: true, message: 'Doctor updated successfully' });
    } catch (error) {
        console.error('Error updating doctor:', error);
        res.status(500).json({ success: false, message: 'Server error updating doctor' });
    } finally {
        if (connection) connection.release();
    }
});

// Delete doctor endpoint (DELETE /api/doctors/:doctorId)
app.delete('/api/doctors/:doctorId', async (req, res) => {
    let connection;
    try {
        const { doctorId } = req.params;
        connection = await pool.getConnection();
        const [result] = await connection.execute('DELETE FROM doctors WHERE doctor_id = ?', [doctorId]);
        connection.release();
        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Doctor deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Doctor not found' });
        }
    } catch (error) {
        console.error('Error deleting doctor:', error);
        res.status(500).json({ success: false, message: 'Server error deleting doctor. Check for related reports.' });
    } finally {
        if (connection) connection.release();
    }
});


// Add test endpoint (POST /api/tests)
app.post('/api/tests', async (req, res) => {
    let connection;
    try {
        const { test_name, test_rate, report_heading, test_code, method, comments, category_id } = req.body;
        // Add validation
        if (!test_name || !test_rate || !category_id) { // Ensure category_id is required as per schema
            return res.status(400).json({ success: false, message: "Missing required test fields (test_name, test_rate, category_id)." });
        }
        connection = await pool.getConnection();
        const [result] = await connection.execute(
            'INSERT INTO test (test_name, test_rate, report_heading, test_code, method, comments, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [test_name, parseFloat(test_rate), report_heading || null, test_code || null, method || null, comments || null, category_id]
        );
        res.status(201).json({ success: true, message: 'Test added successfully', testId: result.insertId });
    } catch (error) {
        console.error('Error adding test:', error);
        // Check for specific MySQL errors, e.g., duplicate entry
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Test name or code might already exist for this category.' });
        }
        res.status(500).json({ success: false, message: 'Server error adding test' });
    } finally {
        if (connection) connection.release();
    }
});

// Update test endpoint (PUT /api/tests/:testId)
app.put('/api/tests/:testId', async (req, res) => {
    let connection;
    try {
        const { testId } = req.params;
        const { test_name, test_rate, report_heading, test_code, method, comments, category_id } = req.body;

        if (!test_name || !test_rate || !category_id) {
            return res.status(400).json({ success: false, message: "Missing required test fields." });
        }
        connection = await pool.getConnection();
        await connection.execute(
            'UPDATE test SET test_name = ?, test_rate = ?, report_heading = ?, test_code = ?, method = ?, comments = ?, category_id = ? WHERE test_id = ?',
            [test_name, parseFloat(test_rate), report_heading || null, test_code || null, method || null, comments || null, category_id, testId]
        );
        connection.release();
        res.json({ success: true, message: 'Test updated successfully' });
    } catch (error) {
        console.error('Error updating test:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Test name or code might already exist for this category.' });
        }
        res.status(500).json({ success: false, message: 'Server error updating test' });
    } finally {
        if (connection) connection.release();
    }
});

// Delete test endpoint (DELETE /api/tests/:testId)
app.delete('/api/tests/:testId', async (req, res) => {
    let connection;
    try {
        const { testId } = req.params;
        connection = await pool.getConnection();
        // Note: You might need to handle related components or reports before deleting a test
        // For simplicity, this directly attempts to delete the test.
        const [result] = await connection.execute('DELETE FROM test WHERE test_id = ?', [testId]);
        connection.release();
        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Test deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Test not found' });
        }
    } catch (error) {
        console.error('Error deleting test:', error);
        res.status(500).json({ success: false, message: 'Server error deleting test. Check for related components or reports.' });
    } finally {
        if (connection) connection.release();
    }
});

// Update patient endpoint (PUT /api/patients/:patientId)
app.put('/api/patients/:patientId', async (req, res) => {
    let connection;
    try {
        const { patientId } = req.params;
        const {
            patient_salutation, patients_name, guardian_name, phone_number, gender,
            age_years, age_months, age_days, alternate_phone_number, email,
            address, city, state, zip_code,
        } = req.body;

        if (!patients_name || !gender) {
            return res.status(400).json({ success: false, message: 'Patient Name and Gender are required.' });
        }

        connection = await pool.getConnection();
        await connection.execute(
            'UPDATE patients SET patient_salutation = ?, patients_name = ?, guardian_name = ?, phone_number = ?, gender = ?, age_years = ?, age_months = ?, age_days = ?, alternate_phone_number = ?, email = ?, address = ?, city = ?, state = ?, zip_code = ? WHERE patient_id = ?',
            [
                patient_salutation || null, patients_name, guardian_name || null,
                phone_number ? Number(phone_number) : null, gender,
                age_years ? parseInt(age_years) : null, age_months ? parseInt(age_months) : null, age_days ? parseInt(age_days) : null,
                alternate_phone_number ? Number(alternate_phone_number) : null, email || null,
                address || null, city || null, state || null, zip_code || null,
                patientId
            ]
        );
        connection.release();
        res.json({ success: true, message: 'Patient updated successfully' });
    } catch (error) {
        console.error('Error updating patient:', error);
        res.status(500).json({ success: false, message: 'Server error updating patient' });
    } finally {
        if (connection) connection.release();
    }
});

// Delete patient endpoint (DELETE /api/patients/:patientId)
app.delete('/api/patients/:patientId', async (req, res) => {
    let connection;
    try {
        const { patientId } = req.params;
        connection = await pool.getConnection();
        const [result] = await connection.execute('DELETE FROM patients WHERE patient_id = ?', [patientId]);
        connection.release();
        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Patient deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Patient not found' });
        }
    } catch (error) {
        console.error('Error deleting patient:', error);
        res.status(500).json({ success: false, message: 'Server error deleting patient. Check for related reports.' });
    } finally {
        if (connection) connection.release();
    }
});


// API to fetch categories for AddTestScreen dropdown
app.get('/api/categories', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [categories] = await connection.execute('SELECT category_id, category_name FROM category ORDER BY category_name');
        res.json({ success: true, categories: categories.map(cat => ({ label: cat.category_name, value: cat.category_id })) });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success: false, message: 'Server error fetching categories' });
    } finally {
        if (connection) connection.release();
    }
});


// Dashboard Summary Endpoint
app.get('/api/dashboard-summary', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        const [totalReportsResult] = await connection.execute('SELECT COUNT(*) as totalReports FROM report');
        const [totalPatientsResult] = await connection.execute('SELECT COUNT(*) as totalPatients FROM patients');
        const [totalDoctorsResult] = await connection.execute('SELECT COUNT(*) as totalDoctors FROM doctors');
        const [totalTestsResult] = await connection.execute('SELECT COUNT(*) as totalTests FROM test');
        const [reportsByStatusResult] = await connection.execute('SELECT status, COUNT(*) as count FROM report GROUP BY status');
        // Assuming test_date is a DATE or DATETIME column
        const [recentReportsResult] = await connection.execute('SELECT COUNT(*) as recentReports FROM report WHERE DATE(test_date) = CURDATE()');

        const summary = {
            totalReports: totalReportsResult[0].totalReports,
            totalPatients: totalPatientsResult[0].totalPatients,
            totalDoctors: totalDoctorsResult[0].totalDoctors,
            totalTests: totalTestsResult[0].totalTests,
            reportsByStatus: reportsByStatusResult, // This will be an array of {status, count}
            recentReports: recentReportsResult[0].recentReports,
        };

        res.json({
            success: true,
            summary: summary
        });

    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching dashboard summary'
        });
    } finally {
        if (connection) connection.release();
    }
});


const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
