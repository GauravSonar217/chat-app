const express = require('express');
const bodyparser = require('body-parser');
const cors = require('cors');
const connectDB = require('./config/db.js');
const routes = require('./routes/index.js');
const createHttpError = require('http-errors');
const path = require('path');
const morgan = require('morgan');
const cookieParser = require("cookie-parser");
const errorMiddleware = require("./middleware/error.middleware.js");

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

connectDB();

app.get('/', (req, res) => {
    res.send(
        `<div style="
        text-align: center; 
        width: 100%;
        height: 100vh;
        background-color: #000;
        color: #fff;
        padding: 20px;
        ">
            <h1>Welcome to the API Server</h1>
            <h3>Use the /api endpoint to access the API routes.</h3>
        </div>
        `
    );
});

app.use('/api', routes);

// Handle 404 errors
app.use((req, res, next) => {
    next(createHttpError(404, 'Not Found'));
});

// Global error handler
app.use(errorMiddleware);


module.exports = app;
