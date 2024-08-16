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
            const criteria = req.query.criteria;
            const cat = req.query.cat;
            const brand = req.query.brand;
            const minPrice = Number(req.query.minPrice);
            const maxPrice = Number(req.query.maxPrice);
            // console.log(minPrice);


            if (!criteria && !cat) {
                const result = await clothCollection.find()
                    .skip(page * size)
                    .limit(size)
                    .toArray();
                res.send(result)
            }
            else if ((cat || brand) && !criteria) {
                let query = {};

                if (cat != 'Category' && brand != 'Brand' && minPrice > 0 && maxPrice > 0) {
                    query = { category: cat, brand: brand, price: { $gte: minPrice, $lte: maxPrice } }
                }
                else if (cat != 'Category' && brand == 'Brand' && minPrice > 0 && maxPrice > 0) {
                    query = { category: cat, price: { $gte: minPrice, $lte: maxPrice } }
                }
                else if (cat == 'Category' && brand != 'Brand' && minPrice > 0 && maxPrice > 0) {
                    query = { brand: brand, price: { $gte: minPrice, $lte: maxPrice } }
                }
                else if (cat == 'Category' && brand == 'Brand' && minPrice > 0 && maxPrice > 0) {
                    query = { price: { $gte: minPrice, $lte: maxPrice } }
                }
                else if (cat != 'Category' && brand != 'Brand' && (minPrice <= 0 || maxPrice <= 0)) {
                    query = { category: cat, brand: brand }
                }
                else if (cat != 'Category' && brand == 'Brand' && (minPrice <= 0 || maxPrice <= 0)) {
                    query = { category: cat }
                }
                else if (cat == 'Category' && brand != 'Brand' && (minPrice <= 0 || maxPrice <= 0)) {
                    query = { brand: brand }
                }
                // console.log(query);

                const filteredData = await clothCollection.find(query)
                    .skip(page * size)
                    .limit(size)
                    .toArray();
                res.send(filteredData)
            }
            else if (criteria == 1) {
                const result = await clothCollection.aggregate(
                    [
                        { $sort: { price: 1 } }
                    ]
                )
                    .skip(page * size)
                    .limit(size)
                    .toArray();
                res.send(result)
            }
            else if (criteria == 2) {
                const result = await clothCollection.aggregate(
                    [
                        { $sort: { price: -1 } }
                    ]
                )
                    .skip(page * size)
                    .limit(size)
                    .toArray();
                res.send(result)
            }
            else if (criteria == 3) {
                const result = await clothCollection.aggregate(
                    [
                        { $sort: { product_creation_date: -1 } }
                    ]
                )
                    .skip(page * size)
                    .limit(size)
                    .toArray();
                res.send(result)
            }
        })

        app.get("/product-count", async (req, res) => {
            const cat = req.query.cat;
            const brand = req.query.brand;
            const minPrice = Number(req.query.minPrice);
            const maxPrice = Number(req.query.maxPrice);
            let query = {};
            // console.log(brand);            
            if (cat || brand) {
                if (cat != 'Category' && brand != 'Brand' && minPrice > 0 && maxPrice > 0) {
                    query = { category: cat, brand: brand, price: { $gte: minPrice, $lte: maxPrice } }
                }
                else if (cat != 'Category' && brand == 'Brand' && minPrice > 0 && maxPrice > 0) {
                    query = { category: cat, price: { $gte: minPrice, $lte: maxPrice } }
                }
                else if (cat == 'Category' && brand != 'Brand' && minPrice > 0 && maxPrice > 0) {
                    query = { brand: brand, price: { $gte: minPrice, $lte: maxPrice } }
                }
                else if (cat == 'Category' && brand == 'Brand' && minPrice > 0 && maxPrice > 0) {
                    query = { price: { $gte: minPrice, $lte: maxPrice } }
                }
                else if (cat != 'Category' && brand != 'Brand' && (minPrice <= 0 || maxPrice <= 0)) {
                    query = { category: cat, brand: brand }
                }
                else if (cat != 'Category' && brand == 'Brand' && (minPrice <= 0 || maxPrice <= 0)) {
                    query = { category: cat }
                }
                else if (cat == 'Category' && brand != 'Brand' && (minPrice <= 0 || maxPrice <= 0)) {
                    query = { brand: brand }
                }
                const result = await clothCollection.find(query).toArray()
                res.send({ count: result.length })
                return;
            }
            const count = await clothCollection.estimatedDocumentCount()
            res.send({ count })
        })

        app.post("/product", async (req, res) => {
            const data = req.body;
            const result = await clothCollection.insertOne(data);
            res.send(result)
        })

        app.get("/search-name", async (req, res) => {
            const name = req.query.name;
            const result = await clothCollection.findOne({ name: name });
            if (!result) {
                return res.json({
                    success: false,
                    message: 'No match found'
                })
            }
            res.send([result])
        })

        app.post("/users", async (req, res) => {
            const data = req.body;
            const { email } = data;
            const isExists = await userCollection.findOne({ email: email });
            if (isExists) {
                return res.json({
                    success: false
                })
            }
            const result = await userCollection.insertOne(data);
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
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