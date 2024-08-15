const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
    origin: ["http://localhost:5173", "https://attire-auth.web.app", "https://attire-auth.firebaseapp.com"],
    credentials: true
}))
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ctn12zm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const clothCollection = client.db('attireDB').collection('clothes');
        const userCollection = client.db('attireDB').collection('users');

        app.get("/all-clothes", async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const result = await clothCollection.find()
                .skip(page * size)
                .limit(size)
                .toArray();
            res.send(result)
        })

        app.get("/product-count", async (req, res) => {
            const count = await clothCollection.estimatedDocumentCount()
            res.send({ count })
        })

        app.post("/users", async (req, res) => {
            const data = req.body;
            const {email} = data;
            const isExists = await userCollection.findOne({email: email});
            if(isExists){
                return res.json({
                    success: false
                })
            }           
            const result = await userCollection.insertOne(data);
            res.send(result)
        })

        app.post("/product", async (req, res) => {
            const data = req.body;         
            const result = await clothCollection.insertOne(data);
            res.send(result)
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);
app.get('/', (req, res) => {
    res.send('Attire Server Running')
})

app.listen(port, () => {
    console.log(`Attire Server Running on port ${port}`)
})