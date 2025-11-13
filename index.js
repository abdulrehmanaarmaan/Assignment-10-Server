const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId, MinKey, ExplainVerbosity } = require('mongodb');
const app = express()
const port = process.env.PORT || 3500
require('dotenv').config()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Hello World!')
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.n8udp2w.mongodb.net/?appName=Cluster0`;

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

        const database = client.db('assigment_10_User')

        const moviesCollection = database.collection('movies');
        const watchListCollection = database.collection('WatchList');
        const usersCollection = database.collection('users');

        app.post('/movies', async (req, res) => {
            const email = req.query.email;
            const query = req.body;

            if (email) {
                const newMovie = { ...query, addedBy: email };
                const existingMovie = await moviesCollection.findOne(newMovie);

                console.log(existingMovie)
                if (existingMovie) {
                    return res.status(409).send({ message: 'movie already exists' })
                }
                const result = await moviesCollection.insertOne(newMovie);
                res.send(result)
            }

            const result = await moviesCollection.insertMany(query);
            res.send(result)
        })

        app.get('/movies', async (req, res) => {

            const { id, email, genres, minRating, maxRating } = req.query;

            if (id) {
                const query = { _id: new ObjectId(id) };

                const result = await moviesCollection.findOne(query)
                res.send(result)
            }

            if (email) {
                const query = { addedBy: email };

                const result = await moviesCollection.find(query).toArray();
                res.send(result)
            }

            if (genres) {
                const genreArray = genres.split(',')

                const regexArray = genreArray.map(genre => new RegExp(genre.trim(), 'i'));

                const query = { genre: { $in: regexArray } };
                const result = await moviesCollection.find(query).toArray();
                res.send(result)
            }

            if (minRating || maxRating) {
                const ratingQuery = {};

                if (minRating) {
                    ratingQuery.$gte = Number(minRating);
                }

                if (maxRating) {
                    ratingQuery.$lte = Number(maxRating);
                }

                const result = await moviesCollection.find({ rating: ratingQuery }).toArray();
                res.send(result)
            }

            const result = await moviesCollection.find({}).toArray()
            res.send(result)
        })

        app.patch('/movies/:id', async (req, res) => {
            const id = req.params.id;
            const updatedMovie = req.body;

            const query = { _id: new ObjectId(id) };

            const existingMovie = await moviesCollection.findOne(query);

            const isSame = Object.keys(updatedMovie).every(key => {
                return updatedMovie[key] === existingMovie[key];
            })

            if (isSame) {
                return res.status(409).send({ message: 'no changes in update' })
            }

            const update = {
                $set: updatedMovie
            }

            const result = await moviesCollection.updateOne(query, update);
            res.send(result)
        })

        app.delete('/movies/:id', async (req, res) => {
            const id = req.params.id;

            const query = { _id: new ObjectId(id) };

            const result = await moviesCollection.deleteOne(query);
            res.send(result)
        })

        app.post('/WatchList', async (req, res) => {
            const query = req.body;

            const existingMovie = await watchListCollection.findOne(query);

            if (existingMovie) {
                return res.status(409).send({ message: 'movie already exists in WatchList' })
            }

            const result = await watchListCollection.insertOne(query);
            res.send(result)
        })

        app.get('/WatchList', async (req, res) => {
            const result = await watchListCollection.find({}).toArray();
            res.send(result)
        })

        app.delete('/WatchList/:id', async (req, res) => {
            const id = req.params.id;

            const query = { _id: new ObjectId(id) };

            const result = await watchListCollection.deleteOne(query);
            res.send(result)
        })

        app.post('/users', async (req, res) => {
            const query = req.body;

            const existingUser = await usersCollection.findOne(query);

            if (existingUser) {
                return res.status(409).send({ message: 'user already exists' })
            }

            const result = await usersCollection.insertOne(query);
            res.send(result)
        })

        app.get('/users', async (req, res) => {
            const result = await usersCollection.find({}).toArray();
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close()
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
