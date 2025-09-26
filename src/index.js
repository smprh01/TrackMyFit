const express = require("express");
const session = require("express-session");
const path = require("path");
const hbs = require("hbs");
const collection = require("./mongodb");
const bcrypt = require('bcryptjs');
const fs = require('fs');
const PDFDocument = require('pdfkit');

const app = express();

// === Paths ===
const templatePath = path.join(__dirname, '../templates');
const publicPath = path.join(__dirname, '../public');
const homePath = path.join(__dirname, '../home');

// === Middleware ===
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(publicPath));
app.use(express.static(homePath));
app.use(express.static('home'));
app.use('/images', express.static(path.join(__dirname, '../home/images')));

app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true only if using HTTPS
}));

// === View Engine ===
app.set("view engine", "hbs");
app.set("views", templatePath);

// === Handlebars Helpers ===
hbs.registerHelper('formatDate', function (dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return date.toLocaleDateString('en-GB', options);
});

// === Routes ===

// Home Page
app.get("/", (req, res) => {
    res.sendFile(path.join(homePath, 'index.html'));
});

// Signup Page
app.get("/signup", (req, res) => {
    res.render("signup");
});

// Login Page
app.get("/login", (req, res) => {
    res.render("login");
});

// Signup POST
app.post("/signup", async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const data = {
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        };
        await collection.insertMany([data]);
        req.session.username = req.body.name;
        res.redirect("/userHome");
    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).send("Error during signup");
    }
});

// Login POST
app.post("/login", async (req, res) => {
    try {
        const user = await collection.findOne({ name: req.body.name, email: req.body.email });

        if (user && await bcrypt.compare(req.body.password, user.password)) {
            req.session.username = user.name;
            res.redirect("/userHome");
        } else {
            res.send("Invalid credentials");
        }
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).send("Login error");
    }
});

// User Home Page
app.get("/userHome", (req, res) => {
    if (!req.session.username) return res.redirect("/login");
    res.render("userHome", { username: req.session.username });
});

app.get("/userFeedback", (req, res) => {
    if (!req.session.username) return res.redirect("/login");
    res.render("userFeedback", { username: req.session.username });
});

app.get("/userFAQ", (req, res) => {
    if (!req.session.username) return res.redirect("/login");
    res.render("userFAQ", { username: req.session.username });
});

// Dashboard Page
app.get("/dashboard", (req, res) => {
    if (!req.session.username) return res.redirect("/login");
    res.render("dashboard", { username: req.session.username });
});

// Logout
app.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).send("Error logging out");
        res.redirect("/");
    });
});

// Daily Intake Section (Session protected)
app.use('/dailyintake', express.static(path.join(__dirname, '../DailyIntake')));
app.get('/dailyintake', (req, res) => {
    if (!req.session.username) return res.redirect("/login");
    res.sendFile(path.join(__dirname, '../DailyIntake/dailyIntake.html'));
});

// BMI Section
app.use('/bmi', express.static(path.join(__dirname, '../BMI')));
app.get('/bmi', (req, res) => {
    if (!req.session.username) return res.redirect("/login");
    res.sendFile(path.join(__dirname, '../BMI/bmiCali.html'));
});

// Eye Checkup
app.use('/eyecheckup', express.static(path.join(__dirname, '../EyeCheck')));
app.get('/eyecheckup', (req, res) => {
    if (!req.session.username) return res.redirect("/login");
    res.sendFile(path.join(__dirname, '../EyeCheck/index.html'));
});

// Daily Intake Report
app.get("/report", async (req, res) => {
    const username = req.session.username;
    if (!username) return res.redirect("/login");

    try {
        const user = await collection.findOne({ name: username });
        if (!user) return res.status(404).send("User not found");

        res.render("dailyIntakeReport", {
            username,
            results: user.results || []
        });
    } catch (error) {
        console.error("Error fetching report:", error);
        res.status(500).send("Error loading report");
    }
});

// Intake Submission
app.post("/submit-intake", async (req, res) => {
    const { date, fluidintakestatus, mealsstatus, fruitssnackjunkfoodstatus } = req.body;
    const username = req.session.username;

    try {
        const user = await collection.findOne({ name: username });
        if (!user) return res.status(404).send("User not found");

        await collection.updateOne(
            { name: username },
            {
                $push: {
                    results: {
                        fluidintakestatus,
                        mealsstatus,
                        fruitssnackjunkfoodstatus,
                        date: date || new Date().toLocaleDateString("en-GB")
                    }
                }
            }
        );

        res.status(200).send("Daily intake saved successfully");
    } catch (error) {
        console.error("Error saving intake:", error);
        res.status(500).send("Failed to save intake");
    }
});

// Download PDF Report
app.get('/download-results-pdf', async (req, res) => {
    const username = req.session.username;
    if (!username) return res.redirect("/login");

    try {
        const user = await collection.findOne({ name: username });
        if (!user) return res.status(404).send("User not found");

        const doc = new PDFDocument({ margin: 50 });
        const filename = `${username}_results.pdf`;

        res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-type', 'application/pdf');
        doc.pipe(res);

        doc.fontSize(20).text('Daily Intake Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text(`Username: ${username}`);
        doc.moveDown(2);

        const tableTop = doc.y;
        const itemSpacing = 30;
        const colWidths = [100, 100, 100, 180];

        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('Date', 50, tableTop);
        doc.text('Fluids', 50 + colWidths[0], tableTop);
        doc.text('Meals', 50 + colWidths[0] + colWidths[1], tableTop);
        doc.text('Fruits & Snacks', 50 + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        doc.font('Helvetica').fontSize(12);
        let y = tableTop + 25;

        user.results.forEach(result => {
            doc.text(result.date, 50, y);
            doc.text(result.fluidintakestatus, 50 + colWidths[0], y);
            doc.text(result.mealsstatus, 50 + colWidths[0] + colWidths[1], y);
            doc.text(result.fruitssnackjunkfoodstatus, 50 + colWidths[0] + colWidths[1] + colWidths[2], y);

            y += itemSpacing;
            if (y > 750) {
                doc.addPage();
                y = 50;
            }
        });

        doc.end();
    } catch (error) {
        console.error("PDF generation error:", error);
        res.status(500).send("Error generating PDF");
    }
});

// === Server Start ===
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

