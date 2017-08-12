const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
mongoose.Promise = global.Promise;

const {DATABASE_URL, PORT} = require('./config');
const Blog = require('./models');

app.use(bodyParser.json());
// GET request to /posts to get all blog post
app.get('/posts', (req, res) => {
	//finding all blog post, returning a promise and mapping over all 
	//all blogs into our api filter
	Blog
		.find()
		.exec()
		.then(blogs => {
			res.json({
				blogs: blogs.map(
					(blog) => blog.exposedApi())
			})
		})
		.catch(
			err => {
				console.error(err);
				res.status(500).json({message: 'Server Error'})
			})
})


//GET post to posts/:id finding one specific blog post
app.get('/posts/:id', (req, res) => {
	//find individual id with findById, return promise, return through filter
	Blog
	.findById(req.params.id)
	// .exec()
	.then(blog => res.json(blog.exposedApi()))
	.catch(err => {
		console.error(err);
		res.status(500).json({message: 'Server Error'})
	})
})

//POST to /blogs with required fields and Post new blogs
app.post('/posts', (req, res) => {
	requiredFields = ['title', 'content', 'author'];
	for (let i = 0; i < requiredFields.length; i++) {
		const field = requiredFields[i];
		if(!(field in req.body)) {
			const message = `Missing ${field} in request`;
			console.error(message);
			res.status(400).send(message);
		}
	}
	Blog
		.create({
			title: req.body.title,
			content: req.body.content,
			author: req.body.author
		})
		.then(
			blog => res.status(201).json(blog.exposedApi()))
		.catch(err => {
			console.error(err);
			res.status(500).json('Internal Error')
		})
})

//PUT request to update data
app.put('/posts/:id', (req, res) => {
	if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
		const message = `${req.params.id} did not match ${req.body.id}`
		console.error(message);
		res.status(400).send(message);
	}

	const toUpdate = {};
	const updateableFields = ['title', 'content'];

	updateableFields.forEach(field => {
		if (field in req.body) {
			toUpdate[field] = req.body[field];
		}
	})

	Blog
		.findByIdAndUpdate(req.params.id, {$set: toUpdate})
		.exec()
		.then(blog => res.status(204).end())
		.catch(err => res.status(500).json({message: 'Server Error'}))

})

app.delete('/posts/:id', (req, res) => {
	Blog
	.findbyIdAndRemove(req.params.id)
	.exec()
	.then(blog => res.status(204).end())
	.catch(err => res.status(500).json({message: 'Server Error'}));
});

app.use('*', function(req, res) {
	res.status(404).json({message: 'Not Found'})
})

let server;

function startServer(dataBaseUrl=DATABASE_URL, port=PORT) {
	return new Promise((resolve, reject) => {
		mongoose.connect(dataBaseUrl, err => {
			if (err) {
				return reject(err);
			}
			server = app.listen(port, () => {
				console.log(`running on port ${port}`);
				resolve();
			})
			.on('error', err => {
				mongoose.disconnect();
				reject(err);
			})
		})
	})
}

function closeServer() {
	return mongoose.disconnect().then(() => {
		return new Promise((resolve, reject) => {
			console.log('Closing server');
			server.close(err => {
				if (err) {
					return reject(err)
				}
				resolve();
			})
		})
	})
	
}

if(require.main === module) {
	startServer().catch(err => console.error(err));
};

module.exports = {app, startServer, closeServer}
