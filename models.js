const mongoose = require('mongoose');

const blogPostSchema = mongoose.Schema({
	title: {type: String},
	content: {type: String},
	author: {
		firstName: String,
		lastName: String
	},
	created: {
		type: Number, 
		default: Date.now()
	}
})

blogPostSchema.virtual('fullName').get(function() {
	return `${this.author.firstName} ${this.author.lastName}`.trim();
})


blogPostSchema.methods.exposedApi = function() {
	return {
		title: this.title,
		content: this.content,
		author: this.fullName,
		created: this.created,
		id: this._id
	}
}

const Blog = mongoose.model('Blog', blogPostSchema);

module.exports = Blog