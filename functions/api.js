// packages
require("dotenv").config();
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const app = express();
const router = express.Router();
const mongoose = require('mongoose');
let isDbConnected = false;

const connectToDatabase = async () => {
    if (!isDbConnected) {
        await mongoose.connect("mongodb+srv://url-shortener:vishwa08@samplecluster.clrkivs.mongodb.net/url-shortener?retryWrites=true&w=majority&appName=sampleCluster");
        const db = mongoose.connection;
        db.on('error', (error) => console.error('Connection error:', error));
        db.once('open', () => {
            isDbConnected = true;
            console.error('Connected to database');
        });
    }
};


const User = require('../models/User');
const Url = require('../models/Url');


app.use(cors());
app.use(express.json())
router.use(express.urlencoded({ extended: true }));



app.get('/', (req, res) =>{
    res.send("Hello")
})

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    const response = await User.authenticate(email, password);
    if(response.auth){
        return res.json({
            auth: true,
            message: response.message,
            id: response.id
        })
    }
    else{
        return res.json({
            auth: false,
            message: response.message
        })
    }
})


app.post("/api/signup", async (req, res) => {
    const { name, email, password } = req.body;
    const response = await User.createUser(name, email, password)
    if(response.created){
        return res.json({
            created: true,
            message: response.message,
            id: response.id
        })
    }
    else{
        return res.json({
            created: false,
            message: response.message
        })
    }
})

app.post("/api/create", async (req, res) => {
    const { endpoint, redirectUrl } = req.body;
    const response = await Url.createUrl(req, endpoint, redirectUrl)
    if(response.success){
        return res.json({
            success: true,
            message: response.message,
            id: response.id
        })
    }
    else{
        return res.json({
            success: false,
            message: response.message
        })
    }
})

app.post("/api/getUrl", async (req, res) => {
    const {endpoint} = req.body;
    const response = await Url.getUrl(req, endpoint)
    if (response.found) {
        return res.json({
            found: true,
            message: response.message,
            redirectUrl: response.redirectUrl
        })
    } else {
        return res.json({
            found: false,
            message: response.message
        })
    }
})

app.get('/:endpoint', async (req, res) => {
    const endpoint = req.params.endpoint;
    const response = await Url.getUrl(req, endpoint)
    if (response.found) {
        return res.redirect(response.redirectUrl)
    } else {
        return res.json({
            found: false,
            message: response.message
        })
    }
})




app.use('/', router);

const handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;

    if (!isDbConnected) {
        await connectToDatabase();
    }
    return serverless(app)(event, context);
};

module.exports.handler = handler;